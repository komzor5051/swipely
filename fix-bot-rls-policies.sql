-- ============================================
-- FIX RLS POLICIES FOR TELEGRAM BOT
-- ============================================
-- Этот скрипт настраивает правильные политики доступа
-- для таблиц, используемых Telegram ботом

-- ============================================
-- 1. ТАБЛИЦА USER_MESSAGES
-- ============================================

-- Создаем таблицу, если её нет
CREATE TABLE IF NOT EXISTS user_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    telegram_id BIGINT NOT NULL,
    message_text TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'command')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_user_messages_profile_id ON user_messages(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_telegram_id ON user_messages(telegram_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_created_at ON user_messages(created_at DESC);

-- Включаем RLS
ALTER TABLE user_messages ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики
DROP POLICY IF EXISTS "service_role_user_messages_all" ON user_messages;
DROP POLICY IF EXISTS "authenticated_view_own_messages" ON user_messages;

-- ПОЛИТИКА для service_role - полный доступ (для Telegram бота)
CREATE POLICY "service_role_user_messages_all"
ON user_messages
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ПОЛИТИКА для authenticated - пользователи видят только свои сообщения
CREATE POLICY "authenticated_view_own_messages"
ON user_messages
FOR SELECT
TO authenticated
USING (
  auth.uid() = profile_id
);

-- Права доступа
GRANT ALL ON user_messages TO service_role;
GRANT SELECT ON user_messages TO authenticated;

-- ============================================
-- 2. ТАБЛИЦА PROFILES - ОБНОВЛЕНИЕ ПОЛИТИК
-- ============================================

-- Обновляем политику для service_role на profiles (если её нет)
DROP POLICY IF EXISTS "service_role_profiles_all" ON profiles;

CREATE POLICY "service_role_profiles_all"
ON profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

GRANT ALL ON profiles TO service_role;

-- ============================================
-- 3. ТАБЛИЦА USAGE_TRACKING - ОБНОВЛЕНИЕ ПОЛИТИК
-- ============================================

-- Обновляем политику для service_role на usage_tracking
DROP POLICY IF EXISTS "service_role_usage_all" ON usage_tracking;

CREATE POLICY "service_role_usage_all"
ON usage_tracking
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

GRANT ALL ON usage_tracking TO service_role;

-- ============================================
-- 4. ТАБЛИЦА PROJECTS - ОБНОВЛЕНИЕ ПОЛИТИК
-- ============================================

-- Создаем таблицу projects, если её нет
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    project_type TEXT NOT NULL CHECK (project_type IN ('carousel', 'image', 'video')),
    title TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Включаем RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики
DROP POLICY IF EXISTS "service_role_projects_all" ON projects;
DROP POLICY IF EXISTS "authenticated_view_own_projects" ON projects;

-- ПОЛИТИКА для service_role - полный доступ
CREATE POLICY "service_role_projects_all"
ON projects
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ПОЛИТИКА для authenticated - пользователи видят только свои проекты
CREATE POLICY "authenticated_view_own_projects"
ON projects
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

-- Права доступа
GRANT ALL ON projects TO service_role;
GRANT SELECT ON projects TO authenticated;

-- Триггер для auto-update updated_at
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. SQL ФУНКЦИИ ДЛЯ БОТА
-- ============================================

-- Функция для upsert Telegram профиля
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
    -- Пытаемся найти существующий профиль
    SELECT id INTO v_profile_id
    FROM profiles
    WHERE telegram_id = p_telegram_id;

    IF v_profile_id IS NULL THEN
        -- Создаем новый профиль
        INSERT INTO profiles (
            telegram_id,
            telegram_username,
            first_name,
            last_name,
            subscription_tier,
            subscription_status,
            last_interaction_at
        )
        VALUES (
            p_telegram_id,
            p_telegram_username,
            p_first_name,
            p_last_name,
            'free',
            'active',
            NOW()
        )
        RETURNING id INTO v_profile_id;
    ELSE
        -- Обновляем существующий профиль
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

-- Права на выполнение
GRANT EXECUTE ON FUNCTION upsert_telegram_profile(BIGINT, TEXT, TEXT, TEXT) TO service_role;

-- Функция для получения истории сообщений Telegram пользователя
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

-- Права на выполнение
GRANT EXECUTE ON FUNCTION get_telegram_message_history(BIGINT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION get_telegram_message_history(BIGINT, INTEGER) TO authenticated;

-- ============================================
-- 6. ОБНОВЛЕНИЕ ТАБЛИЦЫ PROFILES
-- ============================================

-- Добавляем недостающие колонки в profiles для Telegram бота
DO $$
BEGIN
    -- telegram_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'telegram_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN telegram_id BIGINT UNIQUE;
    END IF;

    -- telegram_username
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'telegram_username'
    ) THEN
        ALTER TABLE profiles ADD COLUMN telegram_username TEXT;
    END IF;

    -- first_name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'first_name'
    ) THEN
        ALTER TABLE profiles ADD COLUMN first_name TEXT;
    END IF;

    -- last_name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'last_name'
    ) THEN
        ALTER TABLE profiles ADD COLUMN last_name TEXT;
    END IF;

    -- last_interaction_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'last_interaction_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN last_interaction_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Создаем индекс на telegram_id
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id ON profiles(telegram_id);

-- ============================================
-- 7. ПРОВЕРКА УСТАНОВКИ
-- ============================================

SELECT
    'RLS политики для Telegram бота успешно настроены!' as message;

-- Показываем созданные политики
SELECT
    tablename as "Table",
    policyname as "Policy",
    cmd as "Type",
    roles::text[] as "Roles"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('user_messages', 'profiles', 'usage_tracking', 'projects')
ORDER BY tablename, policyname;

-- Показываем таблицы и колонки
SELECT
    table_name as "Table",
    column_name as "Column",
    data_type as "Type"
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('user_messages', 'profiles', 'usage_tracking', 'projects')
ORDER BY table_name, ordinal_position;
