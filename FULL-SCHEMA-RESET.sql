-- ============================================
-- SWIPELY BOT - ПОЛНАЯ СХЕМА БАЗЫ ДАННЫХ
-- ============================================
-- Выполнить в Supabase SQL Editor
-- ВНИМАНИЕ: Сначала удаляет существующие объекты!
-- ============================================

-- ============================================
-- 0. ОЧИСТКА (DROP всех объектов)
-- ============================================

-- Удаляем функции
DROP FUNCTION IF EXISTS upsert_telegram_profile(BIGINT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_telegram_message_history(BIGINT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS update_tov_profile(BIGINT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS complete_onboarding(BIGINT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS save_user_context(BIGINT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS check_generation_limit(UUID) CASCADE;

-- Удаляем таблицы (порядок важен из-за foreign keys)
DROP TABLE IF EXISTS carousel_edit_sessions CASCADE;
DROP TABLE IF EXISTS user_messages CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS usage_tracking CASCADE;
DROP TABLE IF EXISTS swipely_users CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================
-- 1. ТАБЛИЦА PROFILES (основная)
-- ============================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Telegram данные
    telegram_id BIGINT UNIQUE NOT NULL,
    telegram_username TEXT,
    first_name TEXT,
    last_name TEXT,

    -- Display username для слайдов
    display_username TEXT,

    -- Подписка
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
    subscription_status TEXT DEFAULT 'active',

    -- Онбординг
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_step TEXT DEFAULT 'not_started' CHECK (onboarding_step IN ('not_started', 'context', 'tov', 'role', 'completed')),
    user_context TEXT,
    user_role TEXT DEFAULT 'expert' CHECK (user_role IN ('expert', 'visionary', 'friend')),
    tov_profile JSONB DEFAULT '{}'::jsonb,
    niche TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_profiles_telegram_id ON profiles(telegram_id);
CREATE INDEX idx_profiles_onboarding ON profiles(onboarding_completed, telegram_id);
CREATE INDEX idx_profiles_subscription ON profiles(subscription_tier);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Политики для profiles
CREATE POLICY "service_role_profiles_all"
ON profiles FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "anon_profiles_all"
ON profiles FOR ALL TO anon
USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_view_own_profile"
ON profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "authenticated_update_own_profile"
ON profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Права
GRANT ALL ON profiles TO service_role;
GRANT ALL ON profiles TO anon;
GRANT SELECT, UPDATE ON profiles TO authenticated;

-- ============================================
-- 2. ТАБЛИЦА SWIPELY_USERS (логирование)
-- ============================================

CREATE TABLE swipely_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    language_code TEXT,
    action TEXT NOT NULL,
    style TEXT,
    slide_count INTEGER,
    raw_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_swipely_users_user_id ON swipely_users(user_id);
CREATE INDEX idx_swipely_users_action ON swipely_users(action);
CREATE INDEX idx_swipely_users_created_at ON swipely_users(created_at DESC);

-- RLS
ALTER TABLE swipely_users ENABLE ROW LEVEL SECURITY;

-- Политики для swipely_users
CREATE POLICY "service_role_swipely_users_all"
ON swipely_users FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "anon_swipely_users_all"
ON swipely_users FOR ALL TO anon
USING (true) WITH CHECK (true);

-- Права
GRANT ALL ON swipely_users TO service_role;
GRANT ALL ON swipely_users TO anon;

-- ============================================
-- 3. ТАБЛИЦА USER_MESSAGES (история сообщений)
-- ============================================

CREATE TABLE user_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    telegram_id BIGINT NOT NULL,
    message_text TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'command')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_user_messages_profile_id ON user_messages(profile_id);
CREATE INDEX idx_user_messages_telegram_id ON user_messages(telegram_id);
CREATE INDEX idx_user_messages_created_at ON user_messages(created_at DESC);

-- RLS
ALTER TABLE user_messages ENABLE ROW LEVEL SECURITY;

-- Политики
CREATE POLICY "service_role_user_messages_all"
ON user_messages FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "anon_user_messages_all"
ON user_messages FOR ALL TO anon
USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_view_own_messages"
ON user_messages FOR SELECT TO authenticated
USING (auth.uid() = profile_id);

-- Права
GRANT ALL ON user_messages TO service_role;
GRANT ALL ON user_messages TO anon;
GRANT SELECT ON user_messages TO authenticated;

-- ============================================
-- 4. ТАБЛИЦА USAGE_TRACKING (отслеживание лимитов)
-- ============================================

CREATE TABLE usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    generation_type TEXT NOT NULL DEFAULT 'carousel',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_created_at ON usage_tracking(created_at DESC);
CREATE INDEX idx_usage_tracking_type ON usage_tracking(generation_type);

-- RLS
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Политики
CREATE POLICY "service_role_usage_all"
ON usage_tracking FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "anon_usage_all"
ON usage_tracking FOR ALL TO anon
USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_view_own_usage"
ON usage_tracking FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Права
GRANT ALL ON usage_tracking TO service_role;
GRANT ALL ON usage_tracking TO anon;
GRANT SELECT ON usage_tracking TO authenticated;

-- ============================================
-- 5. ТАБЛИЦА PROJECTS (история генераций)
-- ============================================

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    project_type TEXT NOT NULL CHECK (project_type IN ('carousel', 'image', 'video')),
    title TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_projects_type ON projects(project_type);

-- RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Политики
CREATE POLICY "service_role_projects_all"
ON projects FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "anon_projects_all"
ON projects FOR ALL TO anon
USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_view_own_projects"
ON projects FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Права
GRANT ALL ON projects TO service_role;
GRANT ALL ON projects TO anon;
GRANT SELECT ON projects TO authenticated;

-- ============================================
-- 6. ТАБЛИЦА CAROUSEL_EDIT_SESSIONS (веб-редактор)
-- ============================================

CREATE TABLE carousel_edit_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(12) UNIQUE NOT NULL,
    user_id BIGINT NOT NULL,
    carousel_data JSONB NOT NULL,
    style_preset VARCHAR(50),
    format VARCHAR(20) DEFAULT 'square',
    username VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Индексы
CREATE INDEX idx_carousel_sessions_token ON carousel_edit_sessions(token);
CREATE INDEX idx_carousel_sessions_user_id ON carousel_edit_sessions(user_id);
CREATE INDEX idx_carousel_sessions_expires_at ON carousel_edit_sessions(expires_at);

-- RLS
ALTER TABLE carousel_edit_sessions ENABLE ROW LEVEL SECURITY;

-- Политики
CREATE POLICY "service_role_sessions_all"
ON carousel_edit_sessions FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "anon_sessions_all"
ON carousel_edit_sessions FOR ALL TO anon
USING (true) WITH CHECK (true);

CREATE POLICY "public_read_sessions"
ON carousel_edit_sessions FOR SELECT TO public
USING (expires_at > NOW());

-- Права
GRANT ALL ON carousel_edit_sessions TO service_role;
GRANT ALL ON carousel_edit_sessions TO anon;
GRANT SELECT ON carousel_edit_sessions TO public;

-- ============================================
-- 7. SQL ФУНКЦИИ
-- ============================================

-- Функция обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для auto-update
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Функция upsert_telegram_profile
CREATE OR REPLACE FUNCTION upsert_telegram_profile(
    p_telegram_id BIGINT,
    p_telegram_username TEXT DEFAULT NULL,
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_profile_id UUID;
BEGIN
    SELECT id INTO v_profile_id
    FROM profiles
    WHERE telegram_id = p_telegram_id;

    IF v_profile_id IS NULL THEN
        INSERT INTO profiles (
            telegram_id,
            telegram_username,
            first_name,
            last_name,
            display_username,
            subscription_tier,
            subscription_status,
            last_interaction_at
        )
        VALUES (
            p_telegram_id,
            p_telegram_username,
            p_first_name,
            p_last_name,
            p_telegram_username, -- display_username = telegram_username по умолчанию
            'free',
            'active',
            NOW()
        )
        RETURNING id INTO v_profile_id;
    ELSE
        UPDATE profiles
        SET
            telegram_username = COALESCE(p_telegram_username, telegram_username),
            first_name = COALESCE(p_first_name, first_name),
            last_name = COALESCE(p_last_name, last_name),
            last_interaction_at = NOW(),
            updated_at = NOW()
        WHERE id = v_profile_id;
    END IF;

    RETURN v_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION upsert_telegram_profile(BIGINT, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION upsert_telegram_profile(BIGINT, TEXT, TEXT, TEXT) TO anon;

-- Функция get_telegram_message_history
CREATE OR REPLACE FUNCTION get_telegram_message_history(
    p_telegram_id BIGINT,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
    message_text TEXT,
    message_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        um.message_text,
        um.message_type,
        um.created_at
    FROM user_messages um
    WHERE um.telegram_id = p_telegram_id
    ORDER BY um.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_telegram_message_history(BIGINT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION get_telegram_message_history(BIGINT, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_telegram_message_history(BIGINT, INTEGER) TO authenticated;

-- Функция update_tov_profile
CREATE OR REPLACE FUNCTION update_tov_profile(
    p_telegram_id BIGINT,
    p_tov_json JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE profiles
    SET
        tov_profile = p_tov_json,
        onboarding_step = 'role',
        updated_at = NOW()
    WHERE telegram_id = p_telegram_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_tov_profile(BIGINT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION update_tov_profile(BIGINT, JSONB) TO anon;

-- Функция complete_onboarding
CREATE OR REPLACE FUNCTION complete_onboarding(
    p_telegram_id BIGINT,
    p_user_role TEXT,
    p_niche TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE profiles
    SET
        user_role = p_user_role,
        niche = p_niche,
        onboarding_completed = TRUE,
        onboarding_step = 'completed',
        updated_at = NOW()
    WHERE telegram_id = p_telegram_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION complete_onboarding(BIGINT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION complete_onboarding(BIGINT, TEXT, TEXT) TO anon;

-- Функция save_user_context
CREATE OR REPLACE FUNCTION save_user_context(
    p_telegram_id BIGINT,
    p_context TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE profiles
    SET
        user_context = p_context,
        onboarding_step = 'tov',
        updated_at = NOW()
    WHERE telegram_id = p_telegram_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION save_user_context(BIGINT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION save_user_context(BIGINT, TEXT) TO anon;

-- Функция check_generation_limit (для лимитов)
CREATE OR REPLACE FUNCTION check_generation_limit(p_user_id UUID)
RETURNS TABLE(
    can_generate BOOLEAN,
    used_count INTEGER,
    limit_count INTEGER,
    tier TEXT
) AS $$
DECLARE
    v_tier TEXT;
    v_limit INTEGER;
    v_used INTEGER;
BEGIN
    -- Получаем tier пользователя
    SELECT subscription_tier INTO v_tier
    FROM profiles
    WHERE id = p_user_id;

    -- Определяем лимит
    v_limit := CASE v_tier
        WHEN 'pro' THEN 50
        ELSE 5
    END;

    -- Считаем использование за текущий месяц
    SELECT COUNT(*)::INTEGER INTO v_used
    FROM usage_tracking
    WHERE user_id = p_user_id
    AND generation_type = 'carousel'
    AND created_at >= DATE_TRUNC('month', NOW());

    RETURN QUERY SELECT
        (v_used < v_limit) AS can_generate,
        v_used AS used_count,
        v_limit AS limit_count,
        v_tier AS tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_generation_limit(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION check_generation_limit(UUID) TO anon;
GRANT EXECUTE ON FUNCTION check_generation_limit(UUID) TO authenticated;

-- ============================================
-- 8. ПРОВЕРКА УСТАНОВКИ
-- ============================================

SELECT '✅ СХЕМА УСПЕШНО СОЗДАНА!' as status;

-- Показать все таблицы
SELECT
    tablename as "Таблица",
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = tablename) as "Колонок"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'swipely_users', 'user_messages', 'usage_tracking', 'projects', 'carousel_edit_sessions')
ORDER BY tablename;

-- Показать колонки profiles
SELECT
    column_name as "Колонка",
    data_type as "Тип",
    column_default as "Default"
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Показать все политики
SELECT
    tablename as "Таблица",
    policyname as "Политика",
    cmd as "Команда",
    roles::text[] as "Роли"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
