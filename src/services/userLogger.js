/**
 * User Logger — логирование пользователей в файл
 */

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../../logs');
const USERS_LOG_FILE = path.join(LOG_DIR, 'users.json');

// Создаём директорию если не существует
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Загрузка данных пользователей из файла
 */
function loadUsers() {
  try {
    if (fs.existsSync(USERS_LOG_FILE)) {
      const data = fs.readFileSync(USERS_LOG_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('❌ Ошибка чтения users.json:', error.message);
  }
  return { users: {}, stats: { totalUsers: 0, totalGenerations: 0 } };
}

/**
 * Сохранение данных пользователей в файл
 */
function saveUsers(data) {
  try {
    fs.writeFileSync(USERS_LOG_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('❌ Ошибка записи users.json:', error.message);
  }
}

/**
 * Логирование пользователя (при /start или любой активности)
 */
function logUser(telegramUser) {
  const data = loadUsers();
  const userId = String(telegramUser.id);
  const now = new Date().toISOString();

  if (data.users[userId]) {
    // Обновляем существующего пользователя
    data.users[userId].lastSeen = now;
    data.users[userId].visits += 1;
    // Обновляем данные если изменились
    data.users[userId].username = telegramUser.username || data.users[userId].username;
    data.users[userId].firstName = telegramUser.first_name || data.users[userId].firstName;
    data.users[userId].lastName = telegramUser.last_name || data.users[userId].lastName;
  } else {
    // Новый пользователь
    data.users[userId] = {
      id: telegramUser.id,
      username: telegramUser.username || null,
      firstName: telegramUser.first_name || null,
      lastName: telegramUser.last_name || null,
      languageCode: telegramUser.language_code || null,
      firstSeen: now,
      lastSeen: now,
      visits: 1,
      generations: 0
    };
    data.stats.totalUsers += 1;
    console.log(`👤 Новый пользователь: @${telegramUser.username || telegramUser.first_name} (ID: ${userId})`);
  }

  saveUsers(data);
  return data.users[userId];
}

/**
 * Логирование генерации карусели
 */
function logGeneration(userId, stylePreset, slideCount) {
  const data = loadUsers();
  const userIdStr = String(userId);

  if (data.users[userIdStr]) {
    data.users[userIdStr].generations += 1;
    data.users[userIdStr].lastGeneration = new Date().toISOString();
    data.users[userIdStr].lastStyle = stylePreset;
    data.stats.totalGenerations += 1;
    saveUsers(data);

    console.log(`📊 Генерация: user=${userIdStr}, style=${stylePreset}, slides=${slideCount}, total=${data.users[userIdStr].generations}`);
  }
}

/**
 * Получение статистики
 */
function getStats() {
  const data = loadUsers();
  const users = Object.values(data.users);

  // Сортируем по количеству генераций
  const topUsers = users
    .sort((a, b) => b.generations - a.generations)
    .slice(0, 10);

  // Активные за последние 24 часа
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const activeToday = users.filter(u => u.lastSeen > dayAgo).length;

  return {
    totalUsers: data.stats.totalUsers,
    totalGenerations: data.stats.totalGenerations,
    activeToday,
    topUsers: topUsers.map(u => ({
      id: u.id,
      username: u.username,
      firstName: u.firstName,
      generations: u.generations
    }))
  };
}

/**
 * Получение списка всех пользователей
 */
function getAllUsers() {
  const data = loadUsers();
  return Object.values(data.users);
}

module.exports = {
  logUser,
  logGeneration,
  getStats,
  getAllUsers
};
