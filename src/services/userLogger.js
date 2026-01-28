/**
 * User Logger — логирование пользователей в Supabase
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const TABLE_NAME = 'swipely_users';

/**
 * Логирование пользователя (при /start)
 */
async function logUser(telegramUser) {
  try {
    const { error } = await supabase.from(TABLE_NAME).insert({
      user_id: telegramUser.id,
      username: telegramUser.username || null,
      first_name: telegramUser.first_name || null,
      last_name: telegramUser.last_name || null,
      language_code: telegramUser.language_code || null,
      action: 'start',
      raw_data: telegramUser
    });

    if (error) {
      console.error('❌ Ошибка логирования user:', error.message);
    } else {
      console.log(`📝 Лог: @${telegramUser.username || telegramUser.first_name} → start`);
    }
  } catch (err) {
    console.error('❌ logUser error:', err.message);
  }
}

/**
 * Логирование генерации карусели
 */
async function logGeneration(userId, stylePreset, slideCount, username = null) {
  try {
    const { error } = await supabase.from(TABLE_NAME).insert({
      user_id: userId,
      username: username,
      action: 'generation',
      style: stylePreset,
      slide_count: slideCount
    });

    if (error) {
      console.error('❌ Ошибка логирования generation:', error.message);
    } else {
      console.log(`📝 Лог: ${userId} → generation (${stylePreset}, ${slideCount} slides)`);
    }
  } catch (err) {
    console.error('❌ logGeneration error:', err.message);
  }
}

/**
 * Получение статистики
 */
async function getStats() {
  try {
    // Всего уникальных пользователей
    const { data: users, error: usersError } = await supabase
      .from(TABLE_NAME)
      .select('user_id')
      .eq('action', 'start');

    // Всего генераций
    const { count: totalGenerations, error: genError } = await supabase
      .from(TABLE_NAME)
      .select('*', { count: 'exact', head: true })
      .eq('action', 'generation');

    // Активные за 24 часа
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: activeToday, error: activeError } = await supabase
      .from(TABLE_NAME)
      .select('user_id')
      .gte('created_at', dayAgo);

    const uniqueUsers = users ? [...new Set(users.map(u => u.user_id))].length : 0;
    const uniqueActiveToday = activeToday ? [...new Set(activeToday.map(u => u.user_id))].length : 0;

    return {
      totalUsers: uniqueUsers,
      totalGenerations: totalGenerations || 0,
      activeToday: uniqueActiveToday
    };
  } catch (err) {
    console.error('❌ getStats error:', err.message);
    return { totalUsers: 0, totalGenerations: 0, activeToday: 0 };
  }
}

module.exports = {
  logUser,
  logGeneration,
  getStats
};
