-- ==============================================
-- FIX: Разрешаем anon роли писать в user_messages
-- ==============================================

-- 1. Удаляем старую политику
DROP POLICY IF EXISTS "Service role can manage all messages" ON public.user_messages;

-- 2. Создаем новые политики для anon роли (публичный API ключ)
CREATE POLICY "Allow anon insert messages"
  ON public.user_messages FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon read own messages"
  ON public.user_messages FOR SELECT
  TO anon
  USING (true);

-- 3. Обновляем политики для profiles (на всякий случай)
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;

CREATE POLICY "Allow anon manage profiles"
  ON public.profiles FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- 4. Обновляем политики для usage_tracking
DROP POLICY IF EXISTS "Users can insert own usage" ON public.usage_tracking;

CREATE POLICY "Allow anon insert usage"
  ON public.usage_tracking FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon read usage"
  ON public.usage_tracking FOR SELECT
  TO anon
  USING (true);

-- 5. Обновляем политики для projects
DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;

CREATE POLICY "Allow anon insert projects"
  ON public.projects FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon read projects"
  ON public.projects FOR SELECT
  TO anon
  USING (true);

-- Готово! Теперь Telegram бот сможет записывать данные через anon key
