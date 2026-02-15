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

-- ============================================
-- VERIFY: run these to check
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'generations';
-- ============================================
