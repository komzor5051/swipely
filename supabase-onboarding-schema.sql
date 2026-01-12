-- ============================================
-- ОБНОВЛЕНИЕ СХЕМЫ ДЛЯ ONBOARDING СИСТЕМЫ
-- ============================================
-- Добавляет новые поля в profiles для онбординга и ToV анализа

-- 1. Добавляем новые колонки в profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_step TEXT DEFAULT 'not_started', -- not_started, context, tov, role, completed
ADD COLUMN IF NOT EXISTS user_context TEXT, -- Контекст пользователя (кто ты, чем занимаешься)
ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'expert' CHECK (user_role IN ('expert', 'visionary', 'friend')),
ADD COLUMN IF NOT EXISTS tov_profile JSONB DEFAULT '{}'::jsonb, -- Tone of Voice профиль
ADD COLUMN IF NOT EXISTS niche TEXT; -- Ниша пользователя

-- 2. Комментарии для документации
COMMENT ON COLUMN profiles.onboarding_completed IS 'Флаг завершения онбординга';
COMMENT ON COLUMN profiles.onboarding_step IS 'Текущий шаг онбординга: not_started, context, tov, role, completed';
COMMENT ON COLUMN profiles.user_context IS 'Контекст пользователя из Phase 1: кто ты и чем занимаешься';
COMMENT ON COLUMN profiles.user_role IS 'Выбранная роль: expert (Эксперт), visionary (Визионер), friend (Друг)';
COMMENT ON COLUMN profiles.tov_profile IS 'JSON профиль Tone of Voice: {sentence_length, emoji_usage_rate, tone, language_level}';
COMMENT ON COLUMN profiles.niche IS 'Ниша пользователя, извлеченная из контекста';

-- 3. Индекс для быстрого поиска незавершенного онбординга
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding
ON profiles(onboarding_completed, telegram_id);

-- 4. Функция для обновления ToV профиля
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

-- 5. Функция для завершения онбординга
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

-- 6. Функция для сохранения контекста (Phase 1)
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

-- 7. Проверка установки
SELECT
    'Onboarding schema успешно обновлена!' as message;

-- Показываем добавленные колонки
SELECT
    column_name as "Column",
    data_type as "Type",
    column_default as "Default"
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('onboarding_completed', 'onboarding_step', 'user_context', 'user_role', 'tov_profile', 'niche')
ORDER BY ordinal_position;
