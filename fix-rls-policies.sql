-- ============================================
-- FIX RLS POLICIES FOR USAGE_TRACKING
-- ============================================
-- Этот скрипт настраивает правильные политики доступа
-- для таблицы usage_tracking в Supabase

-- 1. Включаем RLS на таблице (если еще не включен)
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- 2. Удаляем старые политики, если есть (на случай повторного запуска)
DROP POLICY IF EXISTS "users_insert_own_usage" ON usage_tracking;
DROP POLICY IF EXISTS "users_view_own_usage" ON usage_tracking;
DROP POLICY IF EXISTS "service_role_all_access" ON usage_tracking;

-- 3. ПОЛИТИКА INSERT - Пользователи могут записывать свои данные
CREATE POLICY "users_insert_own_usage"
ON usage_tracking
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4. ПОЛИТИКА SELECT - Пользователи видят только свои записи
CREATE POLICY "users_view_own_usage"
ON usage_tracking
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 5. ПОЛИТИКА для service_role - полный доступ (для админки)
CREATE POLICY "service_role_all_access"
ON usage_tracking
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- ПРОВЕРКА СТРУКТУРЫ ТАБЛИЦЫ
-- ============================================
-- Убедимся, что таблица имеет правильные поля

-- Проверяем и добавляем недостающие колонки (если нужно)
DO $$
BEGIN
    -- Проверка колонки metadata (должна быть JSONB)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'usage_tracking'
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE usage_tracking ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Проверка индекса на (user_id, created_at) для быстрого подсчета лимитов
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'usage_tracking'
        AND indexname = 'idx_usage_tracking_user_date'
    ) THEN
        CREATE INDEX idx_usage_tracking_user_date ON usage_tracking(user_id, created_at DESC);
    END IF;
END $$;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Даем права на SELECT/INSERT для authenticated пользователей
GRANT SELECT, INSERT ON usage_tracking TO authenticated;
GRANT ALL ON usage_tracking TO service_role;

-- ============================================
-- ВЫВОД ДЛЯ ПРОВЕРКИ
-- ============================================

SELECT
    'RLS политики успешно настроены!' as message,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'usage_tracking') as total_policies;

-- Показываем созданные политики
SELECT
    policyname as "Policy Name",
    cmd as "Command",
    roles::text[] as "Roles",
    qual::text as "USING expression"
FROM pg_policies
WHERE tablename = 'usage_tracking'
ORDER BY policyname;
