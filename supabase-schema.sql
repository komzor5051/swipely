-- Swipely Bot Database Schema для Supabase
-- Этот скрипт нужно выполнить в SQL Editor на Supabase Dashboard

-- Таблица пользователей (уникальные пользователи Telegram)
CREATE TABLE IF NOT EXISTS bot_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс для быстрого поиска по telegram_id
CREATE INDEX IF NOT EXISTS idx_bot_users_telegram_id ON bot_users(telegram_id);

-- Таблица сообщений (история всех текстовых сообщений пользователя)
CREATE TABLE IF NOT EXISTS user_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES bot_users(id) ON DELETE CASCADE,
  telegram_id BIGINT NOT NULL, -- Для быстрого доступа без JOIN
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- 'text', 'voice_transcription'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс для получения истории сообщений пользователя
CREATE INDEX IF NOT EXISTS idx_user_messages_telegram_id ON user_messages(telegram_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_messages_user_id ON user_messages(user_id, created_at DESC);

-- Таблица генераций (история созданных каруселей)
CREATE TABLE IF NOT EXISTS carousel_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES bot_users(id) ON DELETE CASCADE,
  telegram_id BIGINT NOT NULL,
  input_text TEXT NOT NULL,
  style_preset TEXT NOT NULL, -- 'minimal_pop', 'notebook', 'darkest'
  slide_count INTEGER NOT NULL DEFAULT 5,
  tone_analysis TEXT, -- JSON с анализом тона пользователя
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс для статистики и аналитики
CREATE INDEX IF NOT EXISTS idx_carousel_generations_telegram_id ON carousel_generations(telegram_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_carousel_generations_style ON carousel_generations(style_preset);

-- Функция для автоматического обновления last_interaction_at
CREATE OR REPLACE FUNCTION update_last_interaction()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE bot_users
  SET last_interaction_at = NOW()
  WHERE telegram_id = NEW.telegram_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для обновления last_interaction_at при новом сообщении
DROP TRIGGER IF EXISTS trigger_update_last_interaction ON user_messages;
CREATE TRIGGER trigger_update_last_interaction
  AFTER INSERT ON user_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_last_interaction();

-- Триггер для обновления last_interaction_at при генерации
DROP TRIGGER IF EXISTS trigger_update_last_interaction_generation ON carousel_generations;
CREATE TRIGGER trigger_update_last_interaction_generation
  AFTER INSERT ON carousel_generations
  FOR EACH ROW
  EXECUTE FUNCTION update_last_interaction();

-- RLS (Row Level Security) политики
ALTER TABLE bot_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE carousel_generations ENABLE ROW LEVEL SECURITY;

-- Политика: разрешить чтение и запись для anon роли (для бота)
CREATE POLICY "Allow anon access to bot_users" ON bot_users
  FOR ALL USING (true);

CREATE POLICY "Allow anon access to user_messages" ON user_messages
  FOR ALL USING (true);

CREATE POLICY "Allow anon access to carousel_generations" ON carousel_generations
  FOR ALL USING (true);

-- Функция для получения последних N сообщений пользователя
CREATE OR REPLACE FUNCTION get_user_message_history(
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
  FROM user_messages um
  WHERE um.telegram_id = p_telegram_id
  ORDER BY um.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Комментарии к таблицам
COMMENT ON TABLE bot_users IS 'Уникальные пользователи Telegram бота';
COMMENT ON TABLE user_messages IS 'История всех сообщений пользователей для анализа тона';
COMMENT ON TABLE carousel_generations IS 'История генераций каруселей';
