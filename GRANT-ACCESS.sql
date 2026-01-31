-- Выдаем полные права на таблицу profiles для service_role
GRANT ALL ON TABLE profiles TO service_role;
GRANT ALL ON TABLE profiles TO postgres;

-- Отключаем RLS еще раз
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Проверяем результат
SELECT
  tablename,
  rowsecurity as "RLS включен?"
FROM pg_tables
WHERE tablename = 'profiles';

-- Проверяем права доступа
SELECT
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'profiles';
