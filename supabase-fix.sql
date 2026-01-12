-- ==============================================
-- FIX: Удаляем старые объекты перед применением unified schema
-- ==============================================

-- 1. Удаляем старые политики
DROP POLICY IF EXISTS "Service role can manage all messages" ON public.user_messages;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;

-- 2. Удаляем старую таблицу user_messages если она существует
DROP TABLE IF EXISTS public.user_messages CASCADE;

-- 3. Удаляем старые функции
DROP FUNCTION IF EXISTS public.upsert_telegram_profile(BIGINT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_telegram_message_history(BIGINT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 4. Удаляем старый constraint на profiles если он есть
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Готово! Теперь выполни supabase-unified-schema.sql
