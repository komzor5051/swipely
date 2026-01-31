-- ============================================
-- SUPABASE MIGRATION FOR SWIPELY BOT
-- ============================================
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- ==================== PROFILES TABLE ====================
-- Add new columns for balances and limits

-- Photo slides balance
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_slides_balance INTEGER DEFAULT 0;

-- Standard carousels count this month
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS standard_count_month INTEGER DEFAULT 0;

-- Last month reset date (e.g., "2024-2" for February 2024)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_month_reset TEXT;

-- Subscription expiration date
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Referral system
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by BIGINT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;

-- User settings
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tone_guidelines JSONB;

-- Generation stats
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS generation_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_generation_date TIMESTAMPTZ;

-- Create index for telegram_id lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id ON profiles(telegram_id);

-- ==================== PAYMENTS TABLE ====================
-- Ensure payments table has all required columns

-- Check if payment_id column exists, add if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'payments' AND column_name = 'payment_id') THEN
        ALTER TABLE payments ADD COLUMN payment_id TEXT UNIQUE;
    END IF;
END $$;

-- Ensure telegram_id column exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'payments' AND column_name = 'telegram_id') THEN
        ALTER TABLE payments ADD COLUMN telegram_id BIGINT;
    END IF;
END $$;

-- Ensure amount column exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'payments' AND column_name = 'amount') THEN
        ALTER TABLE payments ADD COLUMN amount NUMERIC;
    END IF;
END $$;

-- Ensure currency column exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'payments' AND column_name = 'currency') THEN
        ALTER TABLE payments ADD COLUMN currency TEXT DEFAULT 'RUB';
    END IF;
END $$;

-- Ensure product_type column exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'payments' AND column_name = 'product_type') THEN
        ALTER TABLE payments ADD COLUMN product_type TEXT;
    END IF;
END $$;

-- Ensure product_data column exists (JSONB for flexible data)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'payments' AND column_name = 'product_data') THEN
        ALTER TABLE payments ADD COLUMN product_data JSONB;
    END IF;
END $$;

-- Ensure payment_method column exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'payments' AND column_name = 'payment_method') THEN
        ALTER TABLE payments ADD COLUMN payment_method TEXT DEFAULT 'yookassa';
    END IF;
END $$;

-- Ensure status column exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'payments' AND column_name = 'status') THEN
        ALTER TABLE payments ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
END $$;

-- Create indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_telegram_id ON payments(telegram_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ==================== GENERATIONS TABLE (OPTIONAL) ====================
-- Create generations table if you want to track generation history

CREATE TABLE IF NOT EXISTS generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id),
    telegram_id BIGINT,
    style_preset TEXT,
    input_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generations_telegram_id ON generations(telegram_id);

-- ==================== RLS POLICIES ====================
-- Enable Row Level Security (optional, for added security)

-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- ==================== VERIFY MIGRATION ====================
-- Run these queries to verify the migration worked:

-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' ORDER BY ordinal_position;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'payments' ORDER BY ordinal_position;

-- ============================================
-- END OF MIGRATION
-- ============================================
