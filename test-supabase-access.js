require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testAccess() {
  console.log('🔍 Тестирую доступ к Supabase...');
  console.log('URL:', process.env.SUPABASE_URL);

  // Проверяем роль ключа
  const keyStart = process.env.SUPABASE_ANON_KEY.substring(0, 50);
  console.log('Ключ начинается с:', keyStart + '...');

  // Декодируем payload JWT
  const payload = process.env.SUPABASE_ANON_KEY.split('.')[1];
  const decoded = Buffer.from(payload, 'base64').toString('utf-8');
  const json = JSON.parse(decoded);
  console.log('📋 Role в ключе:', json.role);
  console.log('📋 Issuer:', json.iss);

  // Пробуем прочитать profiles
  console.log('\n🔍 Пытаюсь прочитать таблицу profiles...');
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Ошибка:', error);
  } else {
    console.log('✅ Успешно! Прочитано записей:', data.length);
    if (data.length > 0) {
      console.log('Пример записи:', data[0]);
    }
  }
}

testAccess();
