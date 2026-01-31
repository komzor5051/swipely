-- ==============================================
-- CLEANUP SCRIPT
-- Очистка данных перед применением новой схемы
-- ==============================================

-- ВНИМАНИЕ! Этот скрипт удалит ВСЕ данные из таблиц
-- Используй только если уверен!

-- 1. Удаляем все записи из зависимых таблиц
DELETE FROM public.payments;
DELETE FROM public.projects;
DELETE FROM public.usage_tracking;

-- 2. Удаляем таблицу user_messages если она существует
DROP TABLE IF EXISTS public.user_messages CASCADE;

-- 3. Удаляем все профили (кроме тех что привязаны к auth.users)
-- Оставляем только веб-пользователей если они есть
DELETE FROM public.profiles
WHERE email LIKE 'telegram_%@placeholder.local';

-- Или удалить ВСЕ профили:
-- DELETE FROM public.profiles;

-- 4. Удаляем старые функции
DROP FUNCTION IF EXISTS public.upsert_telegram_profile(BIGINT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_telegram_message_history(BIGINT, INTEGER) CASCADE;

-- Готово! Теперь можно применять supabase-unified-schema.sql
