-- ============================================
-- ПОЛНАЯ НАСТРОЙКА БАЗЫ ДАННЫХ SWIPELY.AI
-- ============================================
-- Выполните этот скрипт в Supabase SQL Editor
-- (https://supabase.com/dashboard/project/[PROJECT_ID]/sql)

-- ============================================
-- 1. ТАБЛИЦА PROFILES
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired')),
    subscription_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS для profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_view_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "service_role_profiles_all" ON profiles;

CREATE POLICY "users_view_own_profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "users_update_own_profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "service_role_profiles_all"
ON profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Права доступа
GRANT SELECT, UPDATE ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;

-- Триггер для auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. ТАБЛИЦА USAGE_TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    generation_type TEXT NOT NULL CHECK (generation_type IN ('carousel', 'image')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс для быстрого подсчета лимитов
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_date
ON usage_tracking(user_id, created_at DESC);

-- Индекс для поиска по типу генерации
CREATE INDEX IF NOT EXISTS idx_usage_tracking_type
ON usage_tracking(generation_type);

-- RLS для usage_tracking
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_insert_own_usage" ON usage_tracking;
DROP POLICY IF EXISTS "users_view_own_usage" ON usage_tracking;
DROP POLICY IF EXISTS "service_role_usage_all" ON usage_tracking;

CREATE POLICY "users_insert_own_usage"
ON usage_tracking FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_view_own_usage"
ON usage_tracking FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "service_role_usage_all"
ON usage_tracking FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Права доступа
GRANT SELECT, INSERT ON usage_tracking TO authenticated;
GRANT ALL ON usage_tracking TO service_role;

-- ============================================
-- 3. ТРИГГЕР СОЗДАНИЯ ПРОФИЛЯ ПРИ РЕГИСТРАЦИИ
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, subscription_tier, subscription_status)
    VALUES (
        NEW.id,
        NEW.email,
        'free',
        'active'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 4. ФУНКЦИЯ ПРОВЕРКИ ЛИМИТОВ
-- ============================================

CREATE OR REPLACE FUNCTION check_generation_limit(p_user_id UUID)
RETURNS TABLE(
    can_generate BOOLEAN,
    remaining_generations INTEGER,
    is_pro BOOLEAN,
    used_this_month INTEGER,
    limit_count INTEGER
) AS $$
DECLARE
    v_subscription_tier TEXT;
    v_month_start TIMESTAMP WITH TIME ZONE;
    v_used_count INTEGER;
    v_limit INTEGER;
BEGIN
    -- Получаем тип подписки
    SELECT subscription_tier INTO v_subscription_tier
    FROM profiles
    WHERE id = p_user_id;

    -- Pro пользователи имеют 50 генераций/месяц
    IF v_subscription_tier = 'pro' THEN
        v_limit := 50;
    ELSE
        v_limit := 5; -- Free tier
    END IF;

    -- Считаем использование за текущий месяц
    v_month_start := DATE_TRUNC('month', NOW());

    SELECT COUNT(*) INTO v_used_count
    FROM usage_tracking
    WHERE user_id = p_user_id
    AND created_at >= v_month_start;

    -- Возвращаем результат
    RETURN QUERY SELECT
        (v_used_count < v_limit) as can_generate,
        GREATEST(0, v_limit - v_used_count) as remaining_generations,
        (v_subscription_tier = 'pro') as is_pro,
        v_used_count as used_this_month,
        v_limit as limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Права на выполнение функции
GRANT EXECUTE ON FUNCTION check_generation_limit(UUID) TO authenticated;

-- ============================================
-- 5. ПРОВЕРКА УСТАНОВКИ
-- ============================================

-- Показываем созданные таблицы
SELECT
    'Таблицы созданы успешно!' as message;

SELECT
    table_name as "Table",
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as "Columns"
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'usage_tracking')
ORDER BY table_name;

-- Показываем RLS политики
SELECT
    tablename as "Table",
    policyname as "Policy",
    cmd as "Type"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'usage_tracking')
ORDER BY tablename, policyname;

-- Показываем индексы
SELECT
    tablename as "Table",
    indexname as "Index"
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'usage_tracking')
ORDER BY tablename, indexname;
