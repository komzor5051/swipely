-- ==============================================
-- TELEGRAM BOT MIGRATION
-- Расширяет существующую веб-схему для поддержки Telegram бота
-- ==============================================

-- 1. Добавить поля для Telegram в таблицу profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS telegram_id BIGINT UNIQUE,
ADD COLUMN IF NOT EXISTS telegram_username TEXT,
ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Индекс для быстрого поиска по telegram_id
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id ON public.profiles(telegram_id);

-- 2. Создать таблицу для истории сообщений (для анализа тона)
CREATE TABLE IF NOT EXISTS public.user_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  telegram_id BIGINT NOT NULL,
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice_transcription')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для быстрого доступа к истории
CREATE INDEX IF NOT EXISTS idx_user_messages_profile_id ON public.user_messages(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_messages_telegram_id ON public.user_messages(telegram_id, created_at DESC);

-- 3. RLS политики для user_messages
ALTER TABLE public.user_messages ENABLE ROW LEVEL SECURITY;

-- Политика: сервисный ключ имеет полный доступ (для бота)
CREATE POLICY "Service role can manage all messages"
  ON public.user_messages FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Функция для upsert профиля через telegram_id (без auth.users)
CREATE OR REPLACE FUNCTION public.upsert_telegram_profile(
  p_telegram_id BIGINT,
  p_telegram_username TEXT DEFAULT NULL,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_profile_id UUID;
  v_full_name TEXT;
BEGIN
  -- Собираем full_name из first_name и last_name
  v_full_name := TRIM(CONCAT(p_first_name, ' ', p_last_name));
  IF v_full_name = '' THEN
    v_full_name := NULL;
  END IF;

  -- Проверяем существует ли профиль с этим telegram_id
  SELECT id INTO v_profile_id
  FROM public.profiles
  WHERE telegram_id = p_telegram_id;

  IF v_profile_id IS NULL THEN
    -- Создаем новый профиль (без привязки к auth.users)
    INSERT INTO public.profiles (
      id,
      email,
      telegram_id,
      telegram_username,
      full_name,
      subscription_tier,
      subscription_status,
      last_interaction_at
    ) VALUES (
      uuid_generate_v4(),
      'telegram_' || p_telegram_id || '@placeholder.local', -- фейковый email для уникальности
      p_telegram_id,
      p_telegram_username,
      v_full_name,
      'free',
      'active',
      NOW()
    )
    RETURNING id INTO v_profile_id;
  ELSE
    -- Обновляем существующий профиль
    UPDATE public.profiles
    SET
      telegram_username = COALESCE(p_telegram_username, telegram_username),
      full_name = COALESCE(v_full_name, full_name),
      last_interaction_at = NOW()
    WHERE id = v_profile_id;
  END IF;

  RETURN v_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Функция для получения истории сообщений
CREATE OR REPLACE FUNCTION public.get_telegram_message_history(
  p_telegram_id BIGINT,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  message_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT um.message_text, um.created_at
  FROM public.user_messages um
  WHERE um.telegram_id = p_telegram_id
  ORDER BY um.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Обновить политику profiles для анонимного доступа (для бота с service key)
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;
CREATE POLICY "Service role can manage all profiles"
  ON public.profiles FOR ALL
  USING (true)
  WITH CHECK (true);

-- 7. Комментарии
COMMENT ON COLUMN public.profiles.telegram_id IS 'Telegram user ID для пользователей из бота';
COMMENT ON COLUMN public.profiles.telegram_username IS 'Telegram @username';
COMMENT ON TABLE public.user_messages IS 'История сообщений пользователей для анализа tone of voice';
COMMENT ON FUNCTION public.upsert_telegram_profile IS 'Создает/обновляет профиль по telegram_id без auth.users';
COMMENT ON FUNCTION public.get_telegram_message_history IS 'Получает последние N сообщений пользователя для анализа тона';
