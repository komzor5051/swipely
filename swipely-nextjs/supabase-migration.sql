-- ============================================
-- SUPABASE MIGRATION FOR SWIPELY WEB APP
-- ============================================
-- Run this in Supabase Dashboard → SQL Editor
-- Safe to re-run (all operations are idempotent)
-- ============================================

-- ==================== PROFILES TABLE ====================
-- Ensure profiles table exists with web app columns

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT,
  first_name TEXT,
  subscription_tier TEXT DEFAULT 'free',
  subscription_end TIMESTAMPTZ,
  standard_used INTEGER DEFAULT 0,
  photo_slides_balance INTEGER DEFAULT 0,
  tov_guidelines TEXT,
  telegram_id BIGINT,
  referral_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if table already exists (safe, no-op if present)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS standard_used INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_slides_balance INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tov_guidelines TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tov_profile JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ==================== GENERATIONS TABLE ====================
-- Web app generation history

CREATE TABLE IF NOT EXISTS generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template TEXT,
  slide_count INTEGER,
  format TEXT,
  tone TEXT,
  input_text TEXT,
  output_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if table already exists from bot migration
ALTER TABLE generations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS template TEXT;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS slide_count INTEGER;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS format TEXT;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS tone TEXT;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS platform TEXT;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS goal TEXT;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS output_json JSONB;

CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);

-- ==================== RPC FUNCTIONS ====================

-- Increment standard_used counter
CREATE OR REPLACE FUNCTION increment_standard_used(user_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET standard_used = COALESCE(standard_used, 0) + 1
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== AUTO-CREATE PROFILE ON SIGNUP ====================

-- telegram_id must be nullable — web users sign up via email, not Telegram
ALTER TABLE profiles ALTER COLUMN telegram_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- IMPORTANT: use public.profiles (fully qualified) — supabase_auth_admin
  -- does not have 'public' in search_path, so unqualified 'profiles' fails
  INSERT INTO public.profiles (id, email, subscription_tier, standard_used, photo_slides_balance, onboarding_completed)
  VALUES (
    NEW.id,
    NEW.email,
    'free',
    0,
    0,
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- IMPORTANT: reload PostgREST schema cache after any ALTER TABLE
NOTIFY pgrst, 'reload schema';

-- Drop and recreate trigger (safe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ==================== RLS POLICIES ====================
-- Enable RLS so users can only access their own data

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow trigger to insert profiles (service role)
DROP POLICY IF EXISTS "Service can insert profiles" ON profiles;
CREATE POLICY "Service can insert profiles" ON profiles
  FOR INSERT WITH CHECK (true);

-- Generations: users can CRUD their own generations
DROP POLICY IF EXISTS "Users can view own generations" ON generations;
CREATE POLICY "Users can view own generations" ON generations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own generations" ON generations;
CREATE POLICY "Users can insert own generations" ON generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own generations" ON generations;
CREATE POLICY "Users can delete own generations" ON generations
  FOR DELETE USING (auth.uid() = user_id);

-- ==================== TABLE GRANTS ====================
-- Ensure authenticated users can access tables (needed for self-hosted Supabase)

GRANT ALL ON profiles TO authenticated;
GRANT ALL ON generations TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ==================== MONTHLY RESET + REFERRAL SYSTEM ====================
-- Safe to run on existing DB (idempotent)

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_month_reset TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;

-- RPC: reset standard_used if calendar month has changed (lazy reset on access)
CREATE OR REPLACE FUNCTION reset_monthly_if_needed(user_id_param UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  current_month TEXT := to_char(NOW(), 'YYYY-MM');
  user_last_reset TEXT;
BEGIN
  SELECT last_month_reset INTO user_last_reset FROM profiles WHERE id = user_id_param;
  IF user_last_reset IS DISTINCT FROM current_month THEN
    UPDATE profiles
      SET standard_used = 0, last_month_reset = current_month
      WHERE id = user_id_param;
  END IF;
END;
$$;

-- RPC: grant referral bonus slides to both parties
CREATE OR REPLACE FUNCTION grant_referral_bonus(new_user_id UUID, referrer_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- 3 bonus slides to new user
  UPDATE profiles
    SET photo_slides_balance = photo_slides_balance + 3,
        referred_by = referrer_id
    WHERE id = new_user_id;
  -- 5 bonus slides to referrer + increment their referral count
  UPDATE profiles
    SET photo_slides_balance = photo_slides_balance + 5,
        referral_count = COALESCE(referral_count, 0) + 1
    WHERE id = referrer_id;
END;
$$;

-- RPC: safely decrement photo_slides_balance (floor at 0)
CREATE OR REPLACE FUNCTION decrement_photo_balance(user_id_param UUID, amount INTEGER)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
    SET photo_slides_balance = GREATEST(0, photo_slides_balance - amount)
    WHERE id = user_id_param;
END;
$$;

-- ─── 2026-03-02: Security Hardening B ───────────────────────────────────────
-- Closes 4 attack vectors: race condition, request bombing, prompt injection, persistent IP rate limit

-- 1. Cooldown tracking column on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_generate_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Persistent IP signup tracking (replaces in-memory Map that resets on cold start)
CREATE TABLE IF NOT EXISTS ip_signups (
  ip           TEXT PRIMARY KEY,
  count        INT NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. check_ip_signup RPC — returns TRUE if allowed, FALSE if blocked (3 accounts/IP/24h)
CREATE OR REPLACE FUNCTION check_ip_signup(p_ip TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count        INT;
  v_window_start TIMESTAMPTZ;
BEGIN
  SELECT count, window_start
    INTO v_count, v_window_start
    FROM ip_signups
   WHERE ip = p_ip
     FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO ip_signups (ip, count, window_start)
    VALUES (p_ip, 1, NOW());
    RETURN TRUE;
  END IF;

  -- Reset window if older than 24 hours
  IF NOW() - v_window_start > INTERVAL '24 hours' THEN
    UPDATE ip_signups SET count = 1, window_start = NOW() WHERE ip = p_ip;
    RETURN TRUE;
  END IF;

  -- Block if at limit
  IF v_count >= 3 THEN
    RETURN FALSE;
  END IF;

  UPDATE ip_signups SET count = count + 1 WHERE ip = p_ip;
  RETURN TRUE;
END;
$$;

-- 4. claim_generation_slot RPC — atomically checks cooldown + limit, increments, updates timestamp
-- Returns: allowed BOOLEAN, reason TEXT ('OK'|'COOLDOWN'|'LIMIT_EXCEEDED'), wait_seconds INT
CREATE OR REPLACE FUNCTION claim_generation_slot(p_user_id UUID)
RETURNS TABLE(allowed BOOLEAN, reason TEXT, wait_seconds INT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tier             TEXT;
  v_sub_end          TIMESTAMPTZ;
  v_used             INT;
  v_last_generate_at TIMESTAMPTZ;
  v_is_pro           BOOLEAN;
  v_cooldown_sec     INT;
  v_elapsed_sec      FLOAT;
  v_remaining_sec    INT;
BEGIN
  -- Lock the profile row to prevent concurrent claims
  SELECT subscription_tier, subscription_end, standard_used, last_generate_at
    INTO v_tier, v_sub_end, v_used, v_last_generate_at
    FROM profiles
   WHERE id = p_user_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'LIMIT_EXCEEDED'::TEXT, 0;
    RETURN;
  END IF;

  -- Effective PRO: subscription_tier='pro' OR subscription_end is in the future.
  -- Checking subscription_end as fallback prevents blocking users when
  -- subscription_tier gets desynced (e.g. after Telegram re-login bug).
  v_is_pro := (v_tier = 'pro') OR (v_sub_end IS NOT NULL AND v_sub_end > NOW());

  -- Auto-heal desynced tier in DB (subscription_end active but tier=free)
  IF v_is_pro AND v_tier != 'pro' THEN
    UPDATE profiles SET subscription_tier = 'pro' WHERE id = p_user_id;
  END IF;

  -- Cooldown: PRO = 3s, FREE = 15s
  v_cooldown_sec := CASE WHEN v_is_pro THEN 3 ELSE 15 END;

  IF v_last_generate_at IS NOT NULL THEN
    v_elapsed_sec := EXTRACT(EPOCH FROM (NOW() - v_last_generate_at));
    IF v_elapsed_sec < v_cooldown_sec THEN
      v_remaining_sec := CEIL(v_cooldown_sec - v_elapsed_sec);
      RETURN QUERY SELECT FALSE, 'COOLDOWN'::TEXT, v_remaining_sec;
      RETURN;
    END IF;
  END IF;

  -- Usage limit for FREE (PRO = unlimited)
  IF NOT v_is_pro AND v_used >= 3 THEN
    RETURN QUERY SELECT FALSE, 'LIMIT_EXCEEDED'::TEXT, 0;
    RETURN;
  END IF;

  -- Claim the slot: increment counter (FREE only) + update timestamp
  IF NOT v_is_pro THEN
    UPDATE profiles
       SET standard_used = standard_used + 1,
           last_generate_at = NOW()
     WHERE id = p_user_id;
  ELSE
    UPDATE profiles
       SET last_generate_at = NOW()
     WHERE id = p_user_id;
  END IF;

  RETURN QUERY SELECT TRUE, 'OK'::TEXT, 0;
END;
$$;

-- ─── 2026-03-04: Atomic photo slide increment ───────────────────────────────
-- Used by payment webhook to avoid read-modify-write race condition
CREATE OR REPLACE FUNCTION add_photo_slides(p_user_id UUID, p_amount INTEGER)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
    SET photo_slides_balance = COALESCE(photo_slides_balance, 0) + p_amount
    WHERE id = p_user_id;
END;
$$;

-- ─── 2026-03-04: Telegram Login ──────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_username TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id ON profiles(telegram_id) WHERE telegram_id IS NOT NULL;

-- ─── 2026-03-05: Auto-sync subscription_tier from subscription_end ───────────
-- Prevents subscription_tier / subscription_end from getting out of sync.
-- Fires BEFORE UPDATE whenever subscription_end changes — sets subscription_tier
-- to 'pro' if new end is in the future, 'free' otherwise.

CREATE OR REPLACE FUNCTION sync_subscription_tier()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.subscription_end IS NOT NULL AND NEW.subscription_end > NOW() THEN
    NEW.subscription_tier := 'pro';
  ELSIF NEW.subscription_end IS NULL OR NEW.subscription_end <= NOW() THEN
    NEW.subscription_tier := 'free';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_subscription_tier ON profiles;
CREATE TRIGGER trg_sync_subscription_tier
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.subscription_end IS DISTINCT FROM NEW.subscription_end)
  EXECUTE FUNCTION sync_subscription_tier();

-- ─── 2026-03-05: Fix payments table for web app ──────────────────────────────
-- Old bot schema had telegram_id NOT NULL — web users pay via email auth, not Telegram
ALTER TABLE payments ALTER COLUMN telegram_id DROP NOT NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
NOTIFY pgrst, 'reload schema';

-- ─── 2026-03-05: Auto-blog ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS swipely_blog_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  angle TEXT,
  keywords TEXT[] DEFAULT '{}',
  source TEXT DEFAULT 'trend',
  score INTEGER DEFAULT 5,
  search_volume INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',  -- pending | writing | used
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS swipely_blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES swipely_blog_topics(id),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  meta_desc TEXT,
  content_md TEXT,
  content_html TEXT,
  cover_image TEXT,
  tags TEXT[] DEFAULT '{}',
  cta_url TEXT,
  status TEXT DEFAULT 'draft',  -- draft | published
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_swipely_blog_posts_slug ON swipely_blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_swipely_blog_posts_status ON swipely_blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_swipely_blog_topics_status_score ON swipely_blog_topics(status, score DESC);

-- ─── 2026-03-07: Add "start" tier support ────────────────────────────────────
-- 1. Updated claim_generation_slot: start tier = 20/month, 5s cooldown
-- 2. Updated sync_subscription_tier trigger: preserve 'start' tier on renewal

CREATE OR REPLACE FUNCTION claim_generation_slot(p_user_id UUID)
RETURNS TABLE(allowed BOOLEAN, reason TEXT, wait_seconds INT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tier             TEXT;
  v_sub_end          TIMESTAMPTZ;
  v_used             INT;
  v_last_generate_at TIMESTAMPTZ;
  v_sub_active       BOOLEAN;
  v_effective_tier   TEXT;
  v_cooldown_sec     INT;
  v_month_limit      INT;
  v_elapsed_sec      FLOAT;
  v_remaining_sec    INT;
BEGIN
  SELECT subscription_tier, subscription_end, standard_used, last_generate_at
    INTO v_tier, v_sub_end, v_used, v_last_generate_at
    FROM profiles
   WHERE id = p_user_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'LIMIT_EXCEEDED'::TEXT, 0;
    RETURN;
  END IF;

  v_sub_active := v_sub_end IS NOT NULL AND v_sub_end > NOW();

  IF v_sub_active THEN
    -- Active subscription: respect stored tier
    v_effective_tier := v_tier;
    -- Auto-heal: subscription active but tier='free' (desynced) -> upgrade to 'pro'
    IF v_tier = 'free' THEN
      v_effective_tier := 'pro';
      UPDATE profiles SET subscription_tier = 'pro' WHERE id = p_user_id;
    END IF;
  ELSE
    -- No active subscription: effective tier is 'free'
    v_effective_tier := 'free';
    IF v_tier != 'free' THEN
      UPDATE profiles SET subscription_tier = 'free' WHERE id = p_user_id;
    END IF;
  END IF;

  -- Cooldown: pro=3s, start=5s, free=15s
  v_cooldown_sec := CASE
    WHEN v_effective_tier = 'pro'   THEN 3
    WHEN v_effective_tier = 'start' THEN 5
    ELSE 15
  END;

  IF v_last_generate_at IS NOT NULL THEN
    v_elapsed_sec := EXTRACT(EPOCH FROM (NOW() - v_last_generate_at));
    IF v_elapsed_sec < v_cooldown_sec THEN
      v_remaining_sec := CEIL(v_cooldown_sec - v_elapsed_sec);
      RETURN QUERY SELECT FALSE, 'COOLDOWN'::TEXT, v_remaining_sec;
      RETURN;
    END IF;
  END IF;

  -- Monthly limit: pro=-1 (unlimited), start=20, free=3
  v_month_limit := CASE
    WHEN v_effective_tier = 'pro'   THEN -1
    WHEN v_effective_tier = 'start' THEN 20
    ELSE 3
  END;

  IF v_month_limit != -1 AND v_used >= v_month_limit THEN
    RETURN QUERY SELECT FALSE, 'LIMIT_EXCEEDED'::TEXT, 0;
    RETURN;
  END IF;

  -- Claim slot
  UPDATE profiles
     SET standard_used = CASE WHEN v_month_limit = -1 THEN standard_used ELSE standard_used + 1 END,
         last_generate_at = NOW()
   WHERE id = p_user_id;

  RETURN QUERY SELECT TRUE, 'OK'::TEXT, 0;
END;
$$;

-- Updated sync trigger: preserve 'start' tier, only force 'pro' when tier is 'free'
CREATE OR REPLACE FUNCTION sync_subscription_tier()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.subscription_end IS NULL OR NEW.subscription_end <= NOW() THEN
    -- Subscription expired: downgrade to free regardless of tier
    NEW.subscription_tier := 'free';
  ELSIF NEW.subscription_tier = 'free' THEN
    -- Active subscription but tier is 'free' (desynced): heal to 'pro'
    NEW.subscription_tier := 'pro';
  END IF;
  -- 'start' and 'pro' are preserved as-is when subscription_end is in the future
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_subscription_tier ON profiles;
CREATE TRIGGER trg_sync_subscription_tier
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.subscription_end IS DISTINCT FROM NEW.subscription_end)
  EXECUTE FUNCTION sync_subscription_tier();

-- Upgrade existing paid users to pro (anyone with subscription_end in future)
UPDATE profiles
   SET subscription_tier = 'pro'
 WHERE subscription_end > NOW()
   AND subscription_tier != 'start';

-- ─── 2026-03-09: Referral bonus → generations (instead of photo_slides) ──────

-- bonus_generations: non-expiring pool, spent when monthly limit is exhausted
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bonus_generations INT DEFAULT 0 NOT NULL;

-- Updated grant_referral_bonus: +5 generations to referrer, +3 to new user
CREATE OR REPLACE FUNCTION grant_referral_bonus(new_user_id UUID, referrer_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
    SET bonus_generations = bonus_generations + 3,
        referred_by = referrer_id,
        referral_bonus_applied = TRUE
    WHERE id = new_user_id;
  UPDATE profiles
    SET bonus_generations = bonus_generations + 5,
        referral_count = COALESCE(referral_count, 0) + 1
    WHERE id = referrer_id;
END;
$$;

-- Updated claim_generation_slot: falls back to bonus_generations when monthly quota exhausted
CREATE OR REPLACE FUNCTION claim_generation_slot(p_user_id UUID)
RETURNS TABLE(allowed BOOLEAN, reason TEXT, wait_seconds INT)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_tier TEXT; v_sub_end TIMESTAMPTZ; v_used INT; v_bonus INT;
  v_last_generate_at TIMESTAMPTZ; v_sub_active BOOLEAN;
  v_effective_tier TEXT; v_cooldown_sec INT; v_month_limit INT;
  v_elapsed_sec FLOAT; v_remaining_sec INT;
BEGIN
  SELECT subscription_tier, subscription_end, standard_used, bonus_generations, last_generate_at
    INTO v_tier, v_sub_end, v_used, v_bonus, v_last_generate_at
    FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN RETURN QUERY SELECT FALSE, 'LIMIT_EXCEEDED'::TEXT, 0; RETURN; END IF;

  v_sub_active := v_sub_end IS NOT NULL AND v_sub_end > NOW();
  IF v_sub_active THEN
    v_effective_tier := v_tier;
    IF v_tier = 'free' THEN v_effective_tier := 'pro'; UPDATE profiles SET subscription_tier = 'pro' WHERE id = p_user_id; END IF;
  ELSE
    v_effective_tier := 'free';
    IF v_tier != 'free' THEN UPDATE profiles SET subscription_tier = 'free' WHERE id = p_user_id; END IF;
  END IF;

  v_cooldown_sec := CASE WHEN v_effective_tier = 'pro' THEN 3 WHEN v_effective_tier = 'start' THEN 5 ELSE 15 END;
  IF v_last_generate_at IS NOT NULL THEN
    v_elapsed_sec := EXTRACT(EPOCH FROM (NOW() - v_last_generate_at));
    IF v_elapsed_sec < v_cooldown_sec THEN
      v_remaining_sec := CEIL(v_cooldown_sec - v_elapsed_sec);
      RETURN QUERY SELECT FALSE, 'COOLDOWN'::TEXT, v_remaining_sec; RETURN;
    END IF;
  END IF;

  v_month_limit := CASE WHEN v_effective_tier = 'pro' THEN 150 WHEN v_effective_tier = 'start' THEN 20 ELSE 3 END;

  IF v_used >= v_month_limit THEN
    IF v_bonus <= 0 THEN RETURN QUERY SELECT FALSE, 'LIMIT_EXCEEDED'::TEXT, 0; RETURN; END IF;
    UPDATE profiles SET bonus_generations = bonus_generations - 1, last_generate_at = NOW() WHERE id = p_user_id;
    RETURN QUERY SELECT TRUE, 'OK'::TEXT, 0; RETURN;
  END IF;

  UPDATE profiles
     SET standard_used = standard_used + 1,
         last_generate_at = NOW()
   WHERE id = p_user_id;
  RETURN QUERY SELECT TRUE, 'OK'::TEXT, 0;
END;
$$;

NOTIFY pgrst, 'reload schema';

-- RLS: published posts are publicly readable
ALTER TABLE swipely_blog_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipely_blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read blog posts" ON swipely_blog_posts;
CREATE POLICY "Public can read blog posts" ON swipely_blog_posts
  FOR SELECT USING (status = 'published');

-- Service role (admin client) bypasses RLS for pipeline inserts/updates
NOTIFY pgrst, 'reload schema';

-- Storage bucket for blog images (create manually in Supabase dashboard or via API):
-- Bucket name: swipely-blog-images, Public: true

-- ─── 2026-03-07: B2B API Keys ────────────────────────────────────────────────

-- API keys table: one row per B2B tenant, stores SHA-256 hash (never plain key)
CREATE TABLE IF NOT EXISTS api_keys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash        TEXT NOT NULL UNIQUE,         -- SHA-256 of swp_live_... key
  name            TEXT NOT NULL,                -- "Client Bot Name"
  tenant_id       TEXT NOT NULL,                -- slug: "client_name"
  monthly_limit   INT NOT NULL DEFAULT 500,
  used_this_month INT NOT NULL DEFAULT 0,
  last_reset_month TEXT,                        -- YYYY-MM for lazy monthly reset
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  last_used_at    TIMESTAMPTZ
);

-- Link generations to API key (NULL for web/normal users)
ALTER TABLE generations ADD COLUMN IF NOT EXISTS api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_generations_api_key_id ON generations(api_key_id) WHERE api_key_id IS NOT NULL;

-- RPC: atomically check quota + lazy monthly reset + increment usage
-- Returns: allowed BOOLEAN, reason TEXT ('OK'|'QUOTA_EXCEEDED'|'INACTIVE'), used INT, monthly_limit INT
CREATE OR REPLACE FUNCTION claim_api_key_slot(p_key_hash TEXT)
RETURNS TABLE(allowed BOOLEAN, reason TEXT, api_key_id UUID, tenant_id TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id            UUID;
  v_tenant_id     TEXT;
  v_active        BOOLEAN;
  v_limit         INT;
  v_used          INT;
  v_last_reset    TEXT;
  v_current_month TEXT := to_char(NOW(), 'YYYY-MM');
BEGIN
  SELECT ak.id, ak.tenant_id, ak.active, ak.monthly_limit, ak.used_this_month, ak.last_reset_month
    INTO v_id, v_tenant_id, v_active, v_limit, v_used, v_last_reset
    FROM api_keys ak
   WHERE ak.key_hash = p_key_hash
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'NOT_FOUND'::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;

  IF NOT v_active THEN
    RETURN QUERY SELECT FALSE, 'INACTIVE'::TEXT, v_id, v_tenant_id;
    RETURN;
  END IF;

  -- Lazy monthly reset
  IF v_last_reset IS DISTINCT FROM v_current_month THEN
    UPDATE api_keys SET used_this_month = 0, last_reset_month = v_current_month WHERE id = v_id;
    v_used := 0;
  END IF;

  IF v_used >= v_limit THEN
    RETURN QUERY SELECT FALSE, 'QUOTA_EXCEEDED'::TEXT, v_id, v_tenant_id;
    RETURN;
  END IF;

  -- Claim slot
  UPDATE api_keys
     SET used_this_month = used_this_month + 1,
         last_used_at = NOW()
   WHERE id = v_id;

  RETURN QUERY SELECT TRUE, 'OK'::TEXT, v_id, v_tenant_id;
END;
$$;

-- RLS: api_keys is admin-only (service role bypasses RLS, anon/authenticated are blocked)
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
-- No permissive policies — only service_role (admin client) can access this table

-- Grants: service_role needs explicit table access (RLS bypass ≠ table privilege)
GRANT ALL ON api_keys TO service_role;
GRANT ALL ON api_keys TO authenticated;

NOTIFY pgrst, 'reload schema';

-- RPC: rollback a generation slot when AI call fails after claim
CREATE OR REPLACE FUNCTION release_generation_slot(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET standard_used = GREATEST(0, standard_used - 1)
  WHERE id = p_user_id;
END;
$$;

-- ============================================
-- VERIFY: run these to check
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'generations';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'api_keys';
-- ============================================

-- ─── 2026-03-14: Free tier limit 3→1, remove Start from pricing ──────────────
-- Free users now get 1 carousel/month (resets monthly, same as before).
-- Start tier (start=20) is removed from the public pricing UI but kept in DB
-- for existing subscribers until their subscription expires.

CREATE OR REPLACE FUNCTION claim_generation_slot(p_user_id UUID)
RETURNS TABLE(allowed BOOLEAN, reason TEXT, wait_seconds INT)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_tier TEXT; v_sub_end TIMESTAMPTZ; v_used INT; v_bonus INT;
  v_last_generate_at TIMESTAMPTZ; v_sub_active BOOLEAN;
  v_effective_tier TEXT; v_cooldown_sec INT; v_month_limit INT;
  v_elapsed_sec FLOAT; v_remaining_sec INT;
BEGIN
  SELECT subscription_tier, subscription_end, standard_used, bonus_generations, last_generate_at
    INTO v_tier, v_sub_end, v_used, v_bonus, v_last_generate_at
    FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN RETURN QUERY SELECT FALSE, 'LIMIT_EXCEEDED'::TEXT, 0; RETURN; END IF;

  v_sub_active := v_sub_end IS NOT NULL AND v_sub_end > NOW();
  IF v_sub_active THEN
    v_effective_tier := v_tier;
    IF v_tier = 'free' THEN v_effective_tier := 'pro'; UPDATE profiles SET subscription_tier = 'pro' WHERE id = p_user_id; END IF;
  ELSE
    v_effective_tier := 'free';
    IF v_tier != 'free' THEN UPDATE profiles SET subscription_tier = 'free' WHERE id = p_user_id; END IF;
  END IF;

  v_cooldown_sec := CASE WHEN v_effective_tier = 'pro' THEN 3 WHEN v_effective_tier = 'start' THEN 5 ELSE 15 END;
  IF v_last_generate_at IS NOT NULL THEN
    v_elapsed_sec := EXTRACT(EPOCH FROM (NOW() - v_last_generate_at));
    IF v_elapsed_sec < v_cooldown_sec THEN
      v_remaining_sec := CEIL(v_cooldown_sec - v_elapsed_sec);
      RETURN QUERY SELECT FALSE, 'COOLDOWN'::TEXT, v_remaining_sec; RETURN;
    END IF;
  END IF;

  -- Free tier: 1 carousel/month (was 3). Start tier: 20/month (legacy, kept for existing subs).
  v_month_limit := CASE WHEN v_effective_tier = 'pro' THEN 150 WHEN v_effective_tier = 'start' THEN 20 ELSE 1 END;

  IF v_used >= v_month_limit THEN
    IF v_bonus <= 0 THEN RETURN QUERY SELECT FALSE, 'LIMIT_EXCEEDED'::TEXT, 0; RETURN; END IF;
    UPDATE profiles SET bonus_generations = bonus_generations - 1, last_generate_at = NOW() WHERE id = p_user_id;
    RETURN QUERY SELECT TRUE, 'OK'::TEXT, 0; RETURN;
  END IF;

  UPDATE profiles
     SET standard_used = standard_used + 1,
         last_generate_at = NOW()
   WHERE id = p_user_id;
  RETURN QUERY SELECT TRUE, 'OK'::TEXT, 0;
END;
$$;

NOTIFY pgrst, 'reload schema';
