const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || './data/swipely.db';
let db;

/**
 * Инициализация базы данных
 */
function init() {
  db = new Database(dbPath);

  // Создание таблицы пользователей
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY,
      username TEXT,
      subscription_tier TEXT DEFAULT 'free',
      generation_count INTEGER DEFAULT 0,
      last_generation_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      tone_guidelines TEXT
    )
  `);

  // Создание таблицы генераций
  db.exec(`
    CREATE TABLE IF NOT EXISTS generations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      style_preset TEXT,
      input_text TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    )
  `);

  console.log('✅ База данных инициализирована');
}

/**
 * Создание или обновление пользователя
 */
function createUser(userId, username) {
  const stmt = db.prepare(`
    INSERT INTO users (user_id, username)
    VALUES (?, ?)
    ON CONFLICT(user_id) DO UPDATE SET username = ?
  `);

  stmt.run(userId, username, username);
}

/**
 * Получение данных пользователя
 */
function getUser(userId) {
  const stmt = db.prepare('SELECT * FROM users WHERE user_id = ?');
  return stmt.get(userId);
}

/**
 * Проверка возможности генерации
 */
function canGenerate(userId) {
  const user = getUser(userId);

  if (!user) return false;

  // Pro пользователи могут генерировать безлимитно
  if (user.subscription_tier === 'pro') return true;

  // Бесплатные пользователи: 2 генерации в неделю
  const freeLimit = 2;

  // Сброс счетчика раз в неделю
  const lastGenDate = user.last_generation_date ? new Date(user.last_generation_date) : null;
  const now = new Date();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;

  if (lastGenDate && (now - lastGenDate > oneWeek)) {
    // Сбросить счетчик
    const resetStmt = db.prepare('UPDATE users SET generation_count = 0 WHERE user_id = ?');
    resetStmt.run(userId);
    return true;
  }

  return user.generation_count < freeLimit;
}

/**
 * Инкремент счетчика генераций
 */
function incrementGenerations(userId) {
  const stmt = db.prepare(`
    UPDATE users
    SET generation_count = generation_count + 1,
        last_generation_date = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `);

  stmt.run(userId);
}

/**
 * Сохранение генерации в историю
 */
function saveGeneration(userId, stylePreset, inputText) {
  const stmt = db.prepare(`
    INSERT INTO generations (user_id, style_preset, input_text)
    VALUES (?, ?, ?)
  `);

  stmt.run(userId, stylePreset, inputText);
}

/**
 * Обновление подписки пользователя
 */
function upgradeUser(userId, tier = 'pro') {
  const stmt = db.prepare('UPDATE users SET subscription_tier = ? WHERE user_id = ?');
  stmt.run(tier, userId);
}

/**
 * Сохранение tone guidelines пользователя
 */
function saveToneGuidelines(userId, toneData) {
  const stmt = db.prepare('UPDATE users SET tone_guidelines = ? WHERE user_id = ?');
  stmt.run(JSON.stringify(toneData), userId);
}

/**
 * Получение tone guidelines пользователя
 */
function getToneGuidelines(userId) {
  const user = getUser(userId);
  if (!user || !user.tone_guidelines) return null;

  try {
    return JSON.parse(user.tone_guidelines);
  } catch (error) {
    return null;
  }
}

module.exports = {
  init,
  createUser,
  getUser,
  canGenerate,
  incrementGenerations,
  saveGeneration,
  upgradeUser,
  saveToneGuidelines,
  getToneGuidelines
};
