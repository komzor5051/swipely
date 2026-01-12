-- ==============================================
-- UNIFIED SCHEMA FOR WEB + TELEGRAM BOT
-- Исправляет проблему с foreign key constraint
-- ==============================================

-- 1. УДАЛЯЕМ старый constraint profiles.id -> auth.users
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. ДОБАВЛЯЕМ nullable поле auth_user_id для веб-пользователей
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS telegram_id BIGINT UNIQUE,
ADD COLUMN IF NOT EXISTS telegram_username TEXT,
ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id ON public.profiles(telegram_id);
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON public.profiles(auth_user_id);

COMMENT ON COLUMN public.profiles.auth_user_id IS 'UUID из auth.users для веб-пользователей (NULL для Telegram)';
COMMENT ON COLUMN public.profiles.telegram_id IS 'Telegram user ID для пользователей из бота (NULL для веба)';

-- 3. СОЗДАЕМ таблицу для истории сообщений (только для Telegram)
CREATE TABLE IF NOT EXISTS public.user_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  telegram_id BIGINT NOT NULL,
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice_transcription')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_messages_profile_id ON public.user_messages(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_messages_telegram_id ON public.user_messages(telegram_id, created_at DESC);

-- RLS для user_messages
ALTER TABLE public.user_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage all messages"
  ON public.user_messages FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.user_messages IS 'История сообщений Telegram пользователей для анализа tone of voice';

-- 4. ФУНКЦИЯ для создания/обновления Telegram профиля
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
  -- Собираем full_name
  v_full_name := TRIM(CONCAT(p_first_name, ' ', p_last_name));
  IF v_full_name = '' THEN
    v_full_name := NULL;
  END IF;

  -- Проверяем существует ли профиль
  SELECT id INTO v_profile_id
  FROM public.profiles
  WHERE telegram_id = p_telegram_id;

  IF v_profile_id IS NULL THEN
    -- Создаем новый профиль (auth_user_id = NULL для Telegram)
    INSERT INTO public.profiles (
      id,
      email,
      auth_user_id,
      telegram_id,
      telegram_username,
      full_name,
      subscription_tier,
      subscription_status,
      last_interaction_at
    ) VALUES (
      uuid_generate_v4(),
      'telegram_' || p_telegram_id || '@placeholder.local',
      NULL, -- Telegram пользователи не имеют auth_user_id
      p_telegram_id,
      p_telegram_username,
      v_full_name,
      'free',
      'active',
      NOW()
    )
    RETURNING id INTO v_profile_id;
  ELSE
    -- Обновляем существующий
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

COMMENT ON FUNCTION public.upsert_telegram_profile IS 'Создает/обновляет профиль по telegram_id БЕЗ auth.users';

-- 5. ФУНКЦИЯ для получения истории сообщений
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

COMMENT ON FUNCTION public.get_telegram_message_history IS 'Получает последние N сообщений Telegram пользователя';

-- 6. ОБНОВЛЯЕМ триггер handle_new_user для добавления auth_user_id
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, auth_user_id, subscription_tier, subscription_status)
  VALUES (NEW.id, NEW.email, NEW.id, 'free', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user IS 'Автосоздание профиля для веб-пользователей из auth.users';

-- 7. ОБНОВЛЯЕМ RLS политики для profiles (разрешить anon доступ для бота)
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;
CREATE POLICY "Service role can manage all profiles"
  ON public.profiles FOR ALL
  USING (true)
  WITH CHECK (true);

-- ==============================================
-- ИТОГОВАЯ АРХИТЕКТУРА:
--
-- Веб-пользователи:
--   - Регистрируются через auth.users (email/password)
--   - В profiles: id = auth.uid(), auth_user_id = auth.uid(), telegram_id = NULL
--   - Данные в usage_tracking, projects
--
-- Telegram пользователи:
--   - НЕ регистрируются в auth.users
--   - В profiles: id = uuid, auth_user_id = NULL, telegram_id = telegram_id
--   - Данные в usage_tracking, projects, user_messages
--
-- Связь: Один человек может быть И веб-пользователем И telegram-пользователем
--        (два разных профиля, можно объединить позже по email)
-- ==============================================
