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
      standard_count_month INTEGER DEFAULT 0,
      photo_slides_balance INTEGER DEFAULT 0,
      last_generation_date TEXT,
      last_month_reset TEXT,
      subscription_expires_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      tone_guidelines TEXT
    )
  `);

  // Миграция: добавляем новые колонки если их нет
  try {
    db.exec(`ALTER TABLE users ADD COLUMN standard_count_month INTEGER DEFAULT 0`);
  } catch (e) { /* колонка уже существует */ }
  try {
    db.exec(`ALTER TABLE users ADD COLUMN photo_slides_balance INTEGER DEFAULT 0`);
  } catch (e) { /* колонка уже существует */ }
  try {
    db.exec(`ALTER TABLE users ADD COLUMN last_month_reset TEXT`);
  } catch (e) { /* колонка уже существует */ }
  try {
    db.exec(`ALTER TABLE users ADD COLUMN subscription_expires_at TEXT`);
  } catch (e) { /* колонка уже существует */ }
  // Реферальная система
  try {
    db.exec(`ALTER TABLE users ADD COLUMN referred_by INTEGER`);
  } catch (e) { /* колонка уже существует */ }
  try {
    db.exec(`ALTER TABLE users ADD COLUMN referral_count INTEGER DEFAULT 0`);
  } catch (e) { /* колонка уже существует */ }

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

  // Создание таблицы платежей
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_id TEXT UNIQUE,
      user_id INTEGER,
      amount REAL,
      product_type TEXT,
      product_data TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
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

// ============================================
// НОВАЯ ЭКОНОМИКА: ЛИМИТЫ И БАЛАНС
// ============================================

const pricing = require('../config/pricing');

/**
 * Сброс месячных лимитов если нужно
 */
function resetMonthlyLimitsIfNeeded(userId) {
  const user = getUser(userId);
  if (!user) return;

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;

  if (user.last_month_reset !== currentMonth) {
    const stmt = db.prepare(`
      UPDATE users
      SET standard_count_month = 0, last_month_reset = ?
      WHERE user_id = ?
    `);
    stmt.run(currentMonth, userId);
    console.log(`🔄 Месячные лимиты сброшены для пользователя ${userId}`);
  }
}

/**
 * Проверка возможности генерации Standard
 */
function canGenerateStandard(userId) {
  resetMonthlyLimitsIfNeeded(userId);
  const user = getUser(userId);
  if (!user) return { canGenerate: false, reason: 'user_not_found' };

  const tier = getActiveSubscription(userId);
  const limit = pricing.subscriptions[tier]?.features.standardLimit;

  // Безлимит для PRO
  if (limit === -1) {
    return { canGenerate: true, remaining: '∞', tier };
  }

  const remaining = limit - (user.standard_count_month || 0);

  if (remaining <= 0) {
    return { canGenerate: false, remaining: 0, tier, reason: 'limit_reached' };
  }

  return { canGenerate: true, remaining, tier };
}

/**
 * Проверка баланса Photo Mode слайдов
 */
function canGeneratePhoto(userId, slideCount) {
  const user = getUser(userId);
  if (!user) return { canGenerate: false, reason: 'user_not_found' };

  const balance = user.photo_slides_balance || 0;

  if (balance >= slideCount) {
    return { canGenerate: true, balance, hasBalance: true };
  }

  // Нужна оплата
  const tier = getActiveSubscription(userId);
  const price = pricing.getPhotoModePrice(slideCount, tier);

  return {
    canGenerate: false,
    balance,
    hasBalance: false,
    needSlides: slideCount,
    price,
    tier,
    reason: 'need_payment'
  };
}

/**
 * Списание Standard генерации
 */
function deductStandard(userId) {
  resetMonthlyLimitsIfNeeded(userId);

  const stmt = db.prepare(`
    UPDATE users
    SET standard_count_month = standard_count_month + 1,
        generation_count = generation_count + 1,
        last_generation_date = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `);
  stmt.run(userId);
  console.log(`📉 Списана Standard генерация для ${userId}`);
}

/**
 * Списание Photo Mode слайдов
 */
function deductPhotoSlides(userId, slideCount) {
  const stmt = db.prepare(`
    UPDATE users
    SET photo_slides_balance = photo_slides_balance - ?,
        generation_count = generation_count + 1,
        last_generation_date = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `);
  stmt.run(slideCount, userId);
  console.log(`📉 Списано ${slideCount} Photo слайдов для ${userId}`);
}

/**
 * Начисление Photo Mode слайдов (после оплаты)
 */
function addPhotoSlides(userId, slideCount) {
  const stmt = db.prepare(`
    UPDATE users
    SET photo_slides_balance = photo_slides_balance + ?
    WHERE user_id = ?
  `);
  stmt.run(slideCount, userId);
  console.log(`📈 Начислено ${slideCount} Photo слайдов для ${userId}`);
  return getUser(userId).photo_slides_balance;
}

/**
 * Активация PRO подписки
 */
function activateProSubscription(userId, months = 1) {
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + months);

  const stmt = db.prepare(`
    UPDATE users
    SET subscription_tier = 'pro',
        subscription_expires_at = ?
    WHERE user_id = ?
  `);
  stmt.run(expiresAt.toISOString(), userId);
  console.log(`🎉 PRO подписка активирована для ${userId} до ${expiresAt.toLocaleDateString('ru-RU')}`);
}

/**
 * Получение активного тарифа (с проверкой срока)
 */
function getActiveSubscription(userId) {
  const user = getUser(userId);
  if (!user) return 'free';

  if (user.subscription_tier === 'pro') {
    // Проверяем срок действия
    if (user.subscription_expires_at) {
      const expires = new Date(user.subscription_expires_at);
      if (expires < new Date()) {
        // Подписка истекла
        const stmt = db.prepare(`UPDATE users SET subscription_tier = 'free' WHERE user_id = ?`);
        stmt.run(userId);
        console.log(`⚠️ PRO подписка истекла для ${userId}`);
        return 'free';
      }
    }
    return 'pro';
  }

  return 'free';
}

/**
 * Получение статуса пользователя для UI
 */
function getUserStatus(userId) {
  resetMonthlyLimitsIfNeeded(userId);
  const user = getUser(userId);
  if (!user) return null;

  const tier = getActiveSubscription(userId);
  const standardCheck = canGenerateStandard(userId);

  return {
    tier,
    tierName: pricing.subscriptions[tier]?.nameRu || 'Бесплатный',
    standardRemaining: standardCheck.remaining,
    photoSlidesBalance: user.photo_slides_balance || 0,
    subscriptionExpiresAt: user.subscription_expires_at,
    totalGenerations: user.generation_count || 0
  };
}

// ============================================
// РЕФЕРАЛЬНАЯ СИСТЕМА
// ============================================

const REFERRAL_BONUS_INVITER = 5;  // Бонус пригласившему
const REFERRAL_BONUS_INVITED = 3;  // Бонус приглашённому

/**
 * Обработка реферала при регистрации
 * @returns {object|null} - информация о начислениях или null если реферал невалидный
 */
function processReferral(newUserId, referrerId) {
  // Проверки
  if (!referrerId || newUserId === referrerId) {
    return null;
  }

  const referrer = getUser(referrerId);
  if (!referrer) {
    console.log(`⚠️ Реферер ${referrerId} не найден`);
    return null;
  }

  const newUser = getUser(newUserId);
  if (!newUser) {
    console.log(`⚠️ Новый пользователь ${newUserId} не найден`);
    return null;
  }

  // Проверяем, не был ли уже обработан реферал
  if (newUser.referred_by) {
    console.log(`⚠️ Пользователь ${newUserId} уже имеет реферера`);
    return null;
  }

  // Записываем реферера
  const updateNewUser = db.prepare(`
    UPDATE users SET referred_by = ? WHERE user_id = ?
  `);
  updateNewUser.run(referrerId, newUserId);

  // Увеличиваем счётчик рефералов у пригласившего
  const updateReferrer = db.prepare(`
    UPDATE users SET referral_count = referral_count + 1 WHERE user_id = ?
  `);
  updateReferrer.run(referrerId);

  // Начисляем бонусы
  addPhotoSlides(referrerId, REFERRAL_BONUS_INVITER);
  addPhotoSlides(newUserId, REFERRAL_BONUS_INVITED);

  console.log(`🎁 Реферал обработан: ${referrerId} пригласил ${newUserId}`);
  console.log(`   → ${referrerId}: +${REFERRAL_BONUS_INVITER} слайдов`);
  console.log(`   → ${newUserId}: +${REFERRAL_BONUS_INVITED} слайдов`);

  return {
    inviterBonus: REFERRAL_BONUS_INVITER,
    invitedBonus: REFERRAL_BONUS_INVITED,
    referrerId,
    newUserId
  };
}

/**
 * Получение статистики рефералов пользователя
 */
function getReferralStats(userId) {
  const user = getUser(userId);
  if (!user) return null;

  return {
    referralCount: user.referral_count || 0,
    totalEarned: (user.referral_count || 0) * REFERRAL_BONUS_INVITER,
    bonusPerReferral: REFERRAL_BONUS_INVITER
  };
}

/**
 * Проверка, является ли пользователь новым (для реферальной системы)
 */
function isNewUser(userId) {
  const user = getUser(userId);
  // Считаем новым, если создан менее 5 минут назад и нет генераций
  if (!user) return true;

  const createdAt = new Date(user.created_at);
  const now = new Date();
  const fiveMinutes = 5 * 60 * 1000;

  return (now - createdAt < fiveMinutes) && (user.generation_count || 0) === 0;
}

// ============================================
// ПЛАТЕЖИ
// ============================================

/**
 * Создание записи о платеже
 */
function createPayment(paymentId, userId, amount, productType, productData) {
  const stmt = db.prepare(`
    INSERT INTO payments (payment_id, user_id, amount, product_type, product_data, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `);
  stmt.run(paymentId, userId, amount, productType, JSON.stringify(productData));
  console.log(`💳 Создана запись платежа ${paymentId} для ${userId}`);
}

/**
 * Получение платежа по ID
 */
function getPayment(paymentId) {
  const stmt = db.prepare('SELECT * FROM payments WHERE payment_id = ?');
  const payment = stmt.get(paymentId);
  if (payment && payment.product_data) {
    payment.product_data = JSON.parse(payment.product_data);
  }
  return payment;
}

/**
 * Получение pending платежей пользователя
 */
function getPendingPayments(userId) {
  const stmt = db.prepare(`
    SELECT * FROM payments
    WHERE user_id = ? AND status = 'pending'
    ORDER BY created_at DESC
  `);
  return stmt.all(userId).map(p => ({
    ...p,
    product_data: p.product_data ? JSON.parse(p.product_data) : null
  }));
}

/**
 * Завершение платежа
 */
function completePayment(paymentId, status = 'succeeded') {
  const stmt = db.prepare(`
    UPDATE payments
    SET status = ?, completed_at = CURRENT_TIMESTAMP
    WHERE payment_id = ?
  `);
  stmt.run(status, paymentId);
  console.log(`✅ Платёж ${paymentId} завершён со статусом ${status}`);
}

/**
 * Обработка успешного платежа - начисление товара
 */
function processSuccessfulPayment(paymentId) {
  const payment = getPayment(paymentId);

  if (!payment) {
    console.error(`❌ Платёж ${paymentId} не найден`);
    return null;
  }

  if (payment.status !== 'pending') {
    console.log(`⚠️ Платёж ${paymentId} уже обработан (${payment.status})`);
    return payment;
  }

  const { user_id, product_type, product_data } = payment;

  // Начисляем товар в зависимости от типа
  switch (product_type) {
    case 'pack_small':
    case 'pack_medium':
    case 'pack_large':
      addPhotoSlides(user_id, product_data.slides);
      break;

    case 'photo_slides':
      addPhotoSlides(user_id, product_data.slides);
      break;

    case 'topup_slides':
      addPhotoSlides(user_id, product_data.slides);
      console.log(`🛒 Докуплено ${product_data.slides} слайдов для ${user_id}`);
      break;

    case 'pro_month':
      activateProSubscription(user_id, 1);
      break;

    case 'pro_year':
      activateProSubscription(user_id, 12);
      break;

    default:
      console.error(`❌ Неизвестный тип продукта: ${product_type}`);
  }

  // Отмечаем платёж как завершённый
  completePayment(paymentId, 'succeeded');

  return { ...payment, status: 'succeeded' };
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
  getToneGuidelines,
  // Новая экономика
  canGenerateStandard,
  canGeneratePhoto,
  deductStandard,
  deductPhotoSlides,
  addPhotoSlides,
  activateProSubscription,
  getActiveSubscription,
  getUserStatus,
  resetMonthlyLimitsIfNeeded,
  // Платежи
  createPayment,
  getPayment,
  getPendingPayments,
  completePayment,
  processSuccessfulPayment,
  // Реферальная система
  processReferral,
  getReferralStats,
  isNewUser,
  REFERRAL_BONUS_INVITER,
  REFERRAL_BONUS_INVITED
};
