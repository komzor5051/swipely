-- Таблица для хранения сессий редактирования каруселей
-- Каждая сессия доступна по уникальному токену в течение 24 часов

CREATE TABLE IF NOT EXISTS carousel_edit_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(12) UNIQUE NOT NULL,
  user_id BIGINT NOT NULL,
  carousel_data JSONB NOT NULL,
  style_preset VARCHAR(50) NOT NULL,
  format VARCHAR(20) DEFAULT 'portrait',
  username VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Индекс для быстрого поиска по токену
CREATE INDEX IF NOT EXISTS idx_carousel_sessions_token ON carousel_edit_sessions(token);

-- Индекс для очистки истекших сессий
CREATE INDEX IF NOT EXISTS idx_carousel_sessions_expires ON carousel_edit_sessions(expires_at);

-- RLS политики
ALTER TABLE carousel_edit_sessions ENABLE ROW LEVEL SECURITY;

-- Политика для чтения: любой может читать по токену (публичный доступ через API)
CREATE POLICY "Public read by token" ON carousel_edit_sessions
  FOR SELECT
  USING (expires_at > NOW());

-- Политика для создания: только через service_role (бот)
CREATE POLICY "Service role insert" ON carousel_edit_sessions
  FOR INSERT
  WITH CHECK (true);

-- Политика для обновления: любой может обновлять carousel_data
CREATE POLICY "Public update carousel_data" ON carousel_edit_sessions
  FOR UPDATE
  USING (expires_at > NOW())
  WITH CHECK (expires_at > NOW());

-- Функция для автоматической очистки старых сессий (опционально)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM carousel_edit_sessions WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Комментарии для документации
COMMENT ON TABLE carousel_edit_sessions IS 'Временные сессии для редактирования каруселей через веб-интерфейс';
COMMENT ON COLUMN carousel_edit_sessions.token IS 'Уникальный 12-символьный токен для доступа к редактору';
COMMENT ON COLUMN carousel_edit_sessions.user_id IS 'Telegram user ID создателя';
COMMENT ON COLUMN carousel_edit_sessions.carousel_data IS 'JSON с данными слайдов: { slides: [...] }';
COMMENT ON COLUMN carousel_edit_sessions.style_preset IS 'Название HTML шаблона: minimal_pop, notebook, etc.';
COMMENT ON COLUMN carousel_edit_sessions.format IS 'Формат изображения: square (1080x1080) или portrait (1080x1350)';
COMMENT ON COLUMN carousel_edit_sessions.username IS 'Username пользователя для отображения на слайдах';
COMMENT ON COLUMN carousel_edit_sessions.expires_at IS 'Время истечения сессии (24 часа от создания)';
