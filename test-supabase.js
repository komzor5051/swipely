import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ijmevkzcpsipyuufjemg.supabase.co';
const supabaseKey = 'sb_publishable_uWlGoZntRjNPVOIJmSS3Lg_51lMTKO5';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  console.log('🔍 Проверка подключения к Supabase...\n');

  try {
    // 1. Проверка структуры таблицы usage_tracking
    console.log('📊 Проверка таблицы usage_tracking...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('usage_tracking')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Ошибка доступа к таблице usage_tracking:', tableError);
      console.log('\n💡 Возможные причины:');
      console.log('1. Таблица не создана');
      console.log('2. RLS политики блокируют доступ');
      console.log('3. Неверные права доступа\n');
      return;
    }

    console.log('✅ Таблица usage_tracking доступна\n');

    // 2. Проверка структуры записи
    console.log('📝 Структура существующих записей:');
    const { data: records, error: recordsError } = await supabase
      .from('usage_tracking')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    if (recordsError) {
      console.error('❌ Ошибка чтения записей:', recordsError);
    } else {
      console.log(`Найдено записей: ${records?.length || 0}`);
      if (records && records.length > 0) {
        console.log('\nПример записи:');
        console.log(JSON.stringify(records[0], null, 2));
      } else {
        console.log('Записей пока нет');
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 ТЕСТ: Попытка записи данных');
    console.log('='.repeat(50) + '\n');

    // 3. Попытка тестовой записи (потребуется реальный user_id)
    console.log('⚠️  Для тестовой записи нужен user_id из таблицы profiles');
    console.log('Проверяю существующих пользователей...\n');

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(5);

    if (profilesError) {
      console.error('❌ Ошибка доступа к таблице profiles:', profilesError);
      console.log('💡 Возможно, RLS блокирует доступ к profiles\n');
    } else if (profiles && profiles.length > 0) {
      console.log('✅ Найдены пользователи:');
      profiles.forEach((p, i) => {
        console.log(`${i + 1}. ID: ${p.id.substring(0, 8)}... Email: ${p.email || 'не указан'}`);
      });

      // Попытка тестовой записи с первым пользователем
      const testUserId = profiles[0].id;
      console.log(`\n🧪 Тестовая запись для пользователя ${testUserId.substring(0, 8)}...`);

      const testData = {
        user_id: testUserId,
        generation_type: 'carousel',
        metadata: {
          topic: 'ТЕСТ: Проверка логирования',
          style: 'auto',
          language: 'russian',
          slideCount: 5,
          test: true,
          timestamp: new Date().toISOString()
        }
      };

      console.log('Записываемые данные:');
      console.log(JSON.stringify(testData, null, 2));

      const { data: insertedData, error: insertError } = await supabase
        .from('usage_tracking')
        .insert(testData)
        .select();

      if (insertError) {
        console.error('\n❌ Ошибка записи:', insertError);
        console.log('\n💡 Возможные причины:');
        console.log('1. RLS политики запрещают INSERT');
        console.log('2. Неверная структура данных');
        console.log('3. Нарушение constraints (foreign key и т.д.)\n');
      } else {
        console.log('\n✅✅✅ УСПЕШНО ЗАПИСАНО!');
        console.log('Вставленные данные:');
        console.log(JSON.stringify(insertedData, null, 2));
      }
    } else {
      console.log('⚠️  Пользователи не найдены. Создайте тестового пользователя через Auth.\n');
    }

    console.log('\n' + '='.repeat(50));
    console.log('ТЕСТ ЗАВЕРШЕН');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

testSupabase();
