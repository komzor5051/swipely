-- ============================================
-- МИГРАЦИЯ: Добавление Telegram полей для Mini App
-- ============================================
-- Выполните в Supabase SQL Editor

-- 1. Добавляем Telegram поля в profiles
-- ============================================

-- Убираем обязательную связь с auth.users для поддержки Telegram-only пользователей
-- Сначала удаляем constraint если он есть
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Добавляем Telegram поля
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS telegram_id BIGINT UNIQUE,
ADD COLUMN IF NOT EXISTS telegram_username TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Индекс для быстрого поиска по telegram_id
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id
ON profiles(telegram_id) WHERE telegram_id IS NOT NULL;

-- 2. Обновляем RLS политики для поддержки service_role
-- ============================================

-- Политика для INSERT от service_role (для создания Telegram профилей)
DROP POLICY IF EXISTS "service_role_profiles_insert" ON profiles;
CREATE POLICY "service_role_profiles_insert"
ON profiles FOR INSERT
TO service_role
WITH CHECK (true);

-- 3. Функция для upsert Telegram профиля
-- ============================================

CREATE OR REPLACE FUNCTION upsert_telegram_profile(
    p_telegram_id BIGINT,
    p_telegram_username TEXT DEFAULT NULL,
    p_full_name TEXT DEFAULT NULL
)
RETURNS profiles AS $$
DECLARE
    v_profile profiles;
BEGIN
    -- Пытаемся найти существующий профиль
    SELECT * INTO v_profile
    FROM profiles
    WHERE telegram_id = p_telegram_id;

    IF FOUND THEN
        -- Обновляем существующий профиль
        UPDATE profiles SET
            telegram_username = COALESCE(p_telegram_username, telegram_username),
            full_name = COALESCE(p_full_name, full_name),
            updated_at = NOW()
        WHERE telegram_id = p_telegram_id
        RETURNING * INTO v_profile;
    ELSE
        -- Создаем новый профиль (генерируем UUID для id)
        INSERT INTO profiles (
            id,
            telegram_id,
            telegram_username,
            full_name,
            subscription_tier,
            subscription_status,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            p_telegram_id,
            p_telegram_username,
            p_full_name,
            'free',
            'active',
            NOW(),
            NOW()
        )
        RETURNING * INTO v_profile;
    END IF;

    RETURN v_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Права на выполнение функции
GRANT EXECUTE ON FUNCTION upsert_telegram_profile(BIGINT, TEXT, TEXT) TO service_role;

-- 4. Обновляем функцию проверки лимитов для работы с telegram_id
-- ============================================

CREATE OR REPLACE FUNCTION check_generation_limit_by_telegram(p_telegram_id BIGINT)
RETURNS TABLE(
    can_generate BOOLEAN,
    remaining_generations INTEGER,
    is_pro BOOLEAN,
    used_this_month INTEGER,
    limit_count INTEGER,
    profile_id UUID
) AS $$
DECLARE
    v_profile_id UUID;
    v_subscription_tier TEXT;
    v_month_start TIMESTAMP WITH TIME ZONE;
    v_used_count INTEGER;
    v_limit INTEGER;
BEGIN
    -- Получаем профиль по telegram_id
    SELECT id, subscription_tier INTO v_profile_id, v_subscription_tier
    FROM profiles
    WHERE telegram_id = p_telegram_id;

    IF v_profile_id IS NULL THEN
        -- Профиль не найден
        RETURN QUERY SELECT
            false::BOOLEAN,
            0::INTEGER,
            false::BOOLEAN,
            0::INTEGER,
            0::INTEGER,
            NULL::UUID;
        RETURN;
    END IF;

    -- Определяем лимит
    IF v_subscription_tier = 'pro' THEN
        v_limit := 50;
    ELSE
        v_limit := 5;
    END IF;

    -- Считаем использование за месяц
    v_month_start := DATE_TRUNC('month', NOW());

    SELECT COUNT(*) INTO v_used_count
    FROM usage_tracking
    WHERE user_id = v_profile_id
    AND created_at >= v_month_start;

    -- Возвращаем результат
    RETURN QUERY SELECT
        (v_used_count < v_limit) as can_generate,
        GREATEST(0, v_limit - v_used_count) as remaining_generations,
        (v_subscription_tier = 'pro') as is_pro,
        v_used_count as used_this_month,
        v_limit as limit_count,
        v_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_generation_limit_by_telegram(BIGINT) TO service_role;

-- 5. Проверка миграции
-- ============================================

SELECT
    '✅ Миграция Telegram Mini App выполнена!' as message;

-- Показываем структуру profiles
SELECT
    column_name as "Column",
    data_type as "Type",
    is_nullable as "Nullable"
FROM information_schema.columns
WHERE table_name = 'profiles'
AND table_schema = 'public'
ORDER BY ordinal_position;
