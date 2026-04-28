// ============================================
// DATABASE SERVICE (SUPABASE)
// ============================================
// Миграция с SQLite на Supabase для персистентности на Railway
// Все функции асинхронные

const { createClient } = require('@supabase/supabase-js');
const pricing = require('../config/pricing');

// Инициализация Supabase клиента
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Реферальные бонусы
const REFERRAL_BONUS_INVITER = 5;  // Бонус пригласившему
const REFERRAL_BONUS_INVITED = 3;  // Бонус приглашённому

/**
 * Инициализация базы данных (для совместимости)
 * Supabase не требует локальной инициализации
 */
async function init() {
  console.log('✅ Supabase database service initialized');
}

// ============================================
// ПОЛЬЗОВАТЕЛИ
// ============================================

/**
 * Создание или обновление пользователя
 * НЕ сбрасывает балансы при обновлении!
 */
async function createUser(userId, username) {
  try {
    // Сначала проверяем существует ли пользователь
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('telegram_id', userId)
      .single();

    if (existing) {
      // Пользователь существует - обновляем только username
      const { data, error } = await supabase
        .from('profiles')
        .update({ telegram_username: username })
        .eq('telegram_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Ошибка обновления пользователя:', error);
        return null;
      }

      console.log(`✅ Пользователь обновлён: ${username || userId}`);
      return data;
    } else {
      // Новый пользователь - создаём с дефолтными значениями
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          telegram_id: userId,
          telegram_username: username,
          subscription_tier: 'free',
          photo_slides_balance: 0,
          standard_count_month: 0,
          generation_count: 0
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Ошибка создания пользователя:', error);
        return null;
      }

      console.log(`✅ Пользователь создан: ${username || userId}`);
      return data;
    }
  } catch (err) {
    console.error('❌ Критическая ошибка createUser:', err);
    return null;
  }
}

/**
 * Получение данных пользователя
 */
async function getUser(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('telegram_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Пользователь не найден
        return null;
      }
      console.error('❌ Ошибка получения пользователя:', error);
      return null;
    }

    // Преобразуем поля для совместимости со старым кодом
    return {
      user_id: data.telegram_id,
      username: data.telegram_username,
      subscription_tier: data.subscription_tier || 'free',
      generation_count: data.generation_count || 0,
      standard_count_month: data.standard_count_month || 0,
      photo_slides_balance: data.photo_slides_balance || 0,
      last_generation_date: data.last_generation_date,
      last_month_reset: data.last_month_reset,
      subscription_expires_at: data.subscription_expires_at,
      created_at: data.created_at,
      tone_guidelines: data.tone_guidelines,
      referred_by: data.referred_by,
      referral_count: data.referral_count || 0,
      // Дополнительные поля из Supabase
      id: data.id,
      display_username: data.display_username
    };
  } catch (err) {
    console.error('❌ Критическая ошибка getUser:', err);
    return null;
  }
}

/**
 * Проверка возможности генерации (старая логика для совместимости)
 */
async function canGenerate(userId) {
  const user = await getUser(userId);

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
    await supabase
      .from('profiles')
      .update({ generation_count: 0 })
      .eq('telegram_id', userId);
    return true;
  }

  return user.generation_count < freeLimit;
}

/**
 * Инкремент счетчика генераций
 */
async function incrementGenerations(userId) {
  try {
    const { error } = await supabase.rpc('increment_generation_count', {
      p_telegram_id: userId
    });

    // Fallback если RPC не существует
    if (error && error.code === '42883') {
      const user = await getUser(userId);
      if (user) {
        await supabase
          .from('profiles')
          .update({
            generation_count: (user.generation_count || 0) + 1,
            last_generation_date: new Date().toISOString()
          })
          .eq('telegram_id', userId);
      }
    }
  } catch (err) {
    console.error('❌ Ошибка incrementGenerations:', err);
  }
}

/**
 * Сохранение генерации в историю
 */
async function saveGeneration(userId, stylePreset, inputText) {
  try {
    // Получаем profile_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('telegram_id', userId)
      .single();

    if (!profile) {
      console.error('❌ Профиль не найден для сохранения генерации');
      return null;
    }

    const { data, error } = await supabase
      .from('generations')
      .insert({
        profile_id: profile.id,
        telegram_id: userId,
        style_preset: stylePreset,
        input_text: inputText
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Ошибка сохранения генерации:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('❌ Критическая ошибка saveGeneration:', err);
    return null;
  }
}

/**
 * Обновление подписки пользователя
 */
async function upgradeUser(userId, tier = 'pro') {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ subscription_tier: tier })
      .eq('telegram_id', userId);

    if (error) {
      console.error('❌ Ошибка upgradeUser:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('❌ Критическая ошибка upgradeUser:', err);
    return false;
  }
}

/**
 * Сохранение tone guidelines пользователя
 */
async function saveToneGuidelines(userId, toneData) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ tone_guidelines: toneData })
      .eq('telegram_id', userId);

    if (error) {
      console.error('❌ Ошибка saveToneGuidelines:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('❌ Критическая ошибка saveToneGuidelines:', err);
    return false;
  }
}

/**
 * Получение tone guidelines пользователя
 */
async function getToneGuidelines(userId) {
  const user = await getUser(userId);
  if (!user || !user.tone_guidelines) return null;
  return user.tone_guidelines;
}

// ============================================
// НОВАЯ ЭКОНОМИКА: ЛИМИТЫ И БАЛАНС
// ============================================

/**
 * Сброс месячных лимитов если нужно
 */
async function resetMonthlyLimitsIfNeeded(userId) {
  const user = await getUser(userId);
  if (!user) return;

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;

  if (user.last_month_reset !== currentMonth) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          standard_count_month: 0,
          last_month_reset: currentMonth
        })
        .eq('telegram_id', userId);

      if (!error) {
        console.log(`🔄 Месячные лимиты сброшены для пользователя ${userId}`);
      }
    } catch (err) {
      console.error('❌ Ошибка resetMonthlyLimitsIfNeeded:', err);
    }
  }
}

/**
 * Проверка возможности генерации Standard
 */
async function canGenerateStandard(userId) {
  await resetMonthlyLimitsIfNeeded(userId);
  const user = await getUser(userId);
  if (!user) return { canGenerate: false, reason: 'user_not_found' };

  const tier = await getActiveSubscription(userId);
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
async function canGeneratePhoto(userId, slideCount) {
  const user = await getUser(userId);
  if (!user) return { canGenerate: false, reason: 'user_not_found' };

  const balance = user.photo_slides_balance || 0;

  if (balance >= slideCount) {
    return { canGenerate: true, balance, hasBalance: true };
  }

  // Нужна оплата
  const tier = await getActiveSubscription(userId);
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
async function deductStandard(userId) {
  await resetMonthlyLimitsIfNeeded(userId);

  const user = await getUser(userId);
  if (!user) {
    console.error(`❌ deductStandard: пользователь ${userId} не найден`);
    return { success: false };
  }

  const usedBefore = user.standard_count_month || 0;

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        standard_count_month: usedBefore + 1,
        generation_count: (user.generation_count || 0) + 1,
        last_generation_date: new Date().toISOString()
      })
      .eq('telegram_id', userId);

    if (error) {
      console.error('❌ Ошибка deductStandard:', error);
      return { success: false };
    }

    const usedAfter = usedBefore + 1;
    const tier = await getActiveSubscription(userId);
    const limit = pricing.subscriptions[tier]?.features.standardLimit;
    const remaining = limit === -1 ? '∞' : Math.max(0, limit - usedAfter);

    console.log(`📉 Списана Standard генерация для ${userId} (использовано: ${usedBefore} → ${usedAfter}, осталось: ${remaining})`);

    return { success: true, usedBefore, usedAfter, remaining };
  } catch (err) {
    console.error('❌ Критическая ошибка deductStandard:', err);
    return { success: false };
  }
}

/**
 * Списание Photo Mode слайдов
 */
async function deductPhotoSlides(userId, slideCount) {
  const user = await getUser(userId);
  if (!user) {
    console.error(`❌ deductPhotoSlides: пользователь ${userId} не найден`);
    return { success: false, error: 'user_not_found' };
  }

  const balanceBefore = user.photo_slides_balance || 0;

  // Проверка баланса перед списанием
  if (balanceBefore < slideCount) {
    console.error(`❌ deductPhotoSlides: недостаточно слайдов у ${userId} (есть ${balanceBefore}, нужно ${slideCount})`);
    return { success: false, error: 'insufficient_balance', balanceBefore };
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        photo_slides_balance: balanceBefore - slideCount,
        generation_count: (user.generation_count || 0) + 1,
        last_generation_date: new Date().toISOString()
      })
      .eq('telegram_id', userId);

    if (error) {
      console.error('❌ Ошибка deductPhotoSlides:', error);
      return { success: false, error: 'db_error' };
    }

    const balanceAfter = balanceBefore - slideCount;
    console.log(`📉 Списано ${slideCount} Photo слайдов для ${userId} (было: ${balanceBefore}, стало: ${balanceAfter})`);

    return { success: true, balanceBefore, balanceAfter };
  } catch (err) {
    console.error('❌ Критическая ошибка deductPhotoSlides:', err);
    return { success: false, error: 'exception' };
  }
}

/**
 * Начисление Photo Mode слайдов (после оплаты)
 */
async function addPhotoSlides(userId, slideCount) {
  const user = await getUser(userId);
  if (!user) {
    console.error(`❌ addPhotoSlides: пользователь ${userId} не найден`);
    return { success: false, balanceAfter: 0 };
  }

  const balanceBefore = user.photo_slides_balance || 0;

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        photo_slides_balance: balanceBefore + slideCount
      })
      .eq('telegram_id', userId);

    if (error) {
      console.error('❌ Ошибка addPhotoSlides:', error);
      return { success: false, balanceAfter: balanceBefore };
    }

    const balanceAfter = balanceBefore + slideCount;
    console.log(`📈 Начислено ${slideCount} Photo слайдов для ${userId} (было: ${balanceBefore}, стало: ${balanceAfter})`);

    return { success: true, balanceBefore, balanceAfter };
  } catch (err) {
    console.error('❌ Критическая ошибка addPhotoSlides:', err);
    return { success: false, balanceAfter: 0 };
  }
}

/**
 * Активация или продление PRO подписки
 */
async function activateProSubscription(userId, months = 1) {
  const user = await getUser(userId);
  if (!user) {
    console.error(`❌ activateProSubscription: пользователь ${userId} не найден`);
    return null;
  }

  let startDate = new Date();

  // Если уже есть активная подписка — продлеваем от её окончания
  if (user.subscription_tier === 'pro' && user.subscription_expires_at) {
    const currentExpires = new Date(user.subscription_expires_at);
    if (currentExpires > startDate) {
      startDate = currentExpires;
      console.log(`📅 Продление PRO от ${startDate.toLocaleDateString('ru-RU')}`);
    }
  }

  const expiresAt = new Date(startDate);
  expiresAt.setMonth(expiresAt.getMonth() + months);

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_tier: 'pro',
        subscription_expires_at: expiresAt.toISOString()
      })
      .eq('telegram_id', userId);

    if (error) {
      console.error('❌ Ошибка activateProSubscription:', error);
      return null;
    }

    const action = user.subscription_tier === 'pro' ? 'продлена' : 'активирована';
    console.log(`🎉 PRO подписка ${action} для ${userId} до ${expiresAt.toLocaleDateString('ru-RU')}`);

    return expiresAt;
  } catch (err) {
    console.error('❌ Критическая ошибка activateProSubscription:', err);
    return null;
  }
}

/**
 * Получение активного тарифа (с проверкой срока)
 */
async function getActiveSubscription(userId) {
  const user = await getUser(userId);
  if (!user) return 'free';

  if (user.subscription_tier === 'pro') {
    // Проверяем срок действия
    if (user.subscription_expires_at) {
      const expires = new Date(user.subscription_expires_at);
      if (expires < new Date()) {
        // Подписка истекла
        await supabase
          .from('profiles')
          .update({ subscription_tier: 'free' })
          .eq('telegram_id', userId);
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
async function getUserStatus(userId) {
  await resetMonthlyLimitsIfNeeded(userId);
  const user = await getUser(userId);
  if (!user) return null;

  const tier = await getActiveSubscription(userId);
  const standardCheck = await canGenerateStandard(userId);

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

/**
 * Обработка реферала при регистрации
 */
async function processReferral(newUserId, referrerId) {
  // Проверки
  if (!referrerId || newUserId === referrerId) {
    return null;
  }

  const referrer = await getUser(referrerId);
  if (!referrer) {
    console.log(`⚠️ Реферер ${referrerId} не найден`);
    return null;
  }

  const newUser = await getUser(newUserId);
  if (!newUser) {
    console.log(`⚠️ Новый пользователь ${newUserId} не найден`);
    return null;
  }

  // Проверяем, не был ли уже обработан реферал
  if (newUser.referred_by) {
    console.log(`⚠️ Пользователь ${newUserId} уже имеет реферера`);
    return null;
  }

  try {
    // Записываем реферера
    await supabase
      .from('profiles')
      .update({ referred_by: referrerId })
      .eq('telegram_id', newUserId);

    // Увеличиваем счётчик рефералов у пригласившего
    await supabase
      .from('profiles')
      .update({ referral_count: (referrer.referral_count || 0) + 1 })
      .eq('telegram_id', referrerId);

    // Начисляем бонусы
    await addPhotoSlides(referrerId, REFERRAL_BONUS_INVITER);
    await addPhotoSlides(newUserId, REFERRAL_BONUS_INVITED);

    console.log(`🎁 Реферал обработан: ${referrerId} пригласил ${newUserId}`);
    console.log(`   → ${referrerId}: +${REFERRAL_BONUS_INVITER} слайдов`);
    console.log(`   → ${newUserId}: +${REFERRAL_BONUS_INVITED} слайдов`);

    return {
      inviterBonus: REFERRAL_BONUS_INVITER,
      invitedBonus: REFERRAL_BONUS_INVITED,
      referrerId,
      newUserId
    };
  } catch (err) {
    console.error('❌ Ошибка processReferral:', err);
    return null;
  }
}

/**
 * Получение статистики рефералов пользователя
 */
async function getReferralStats(userId) {
  const user = await getUser(userId);
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
async function isNewUser(userId) {
  const user = await getUser(userId);
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
async function createPayment(paymentId, userId, amount, productType, productData, paymentMethod = 'yookassa') {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        payment_id: paymentId,
        telegram_id: userId,
        amount: amount,
        currency: paymentMethod === 'telegram_stars' ? 'XTR' : 'RUB',
        product_type: productType,
        product_data: productData,
        payment_method: paymentMethod,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Ошибка createPayment:', error);
      return null;
    }

    const emoji = paymentMethod === 'telegram_stars' ? '⭐' : '💳';
    console.log(`${emoji} Создана запись платежа ${paymentId} для ${userId} (${paymentMethod})`);
    return data;
  } catch (err) {
    console.error('❌ Критическая ошибка createPayment:', err);
    return null;
  }
}

/**
 * Получение платежа по ID
 */
async function getPayment(paymentId) {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('payment_id', paymentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Не найден
      }
      console.error('❌ Ошибка getPayment:', error);
      return null;
    }

    // Преобразуем для совместимости
    return {
      id: data.id,
      payment_id: data.payment_id,
      user_id: data.telegram_id,
      amount: data.amount,
      product_type: data.product_type,
      product_data: data.product_data,
      status: data.status,
      payment_method: data.payment_method,
      created_at: data.created_at,
      completed_at: data.updated_at
    };
  } catch (err) {
    console.error('❌ Критическая ошибка getPayment:', err);
    return null;
  }
}

/**
 * Получение pending платежей пользователя
 */
async function getPendingPayments(userId) {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('telegram_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Ошибка getPendingPayments:', error);
      return [];
    }

    return data.map(p => ({
      id: p.id,
      payment_id: p.payment_id,
      user_id: p.telegram_id,
      amount: p.amount,
      product_type: p.product_type,
      product_data: p.product_data,
      status: p.status,
      payment_method: p.payment_method,
      created_at: p.created_at
    }));
  } catch (err) {
    console.error('❌ Критическая ошибка getPendingPayments:', err);
    return [];
  }
}

/**
 * Завершение платежа
 */
async function completePayment(paymentId, status = 'succeeded') {
  try {
    const { error } = await supabase
      .from('payments')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('payment_id', paymentId);

    if (error) {
      console.error('❌ Ошибка completePayment:', error);
      return false;
    }

    console.log(`✅ Платёж ${paymentId} завершён со статусом ${status}`);
    return true;
  } catch (err) {
    console.error('❌ Критическая ошибка completePayment:', err);
    return false;
  }
}

/**
 * Обработка успешного платежа - начисление товара
 */
async function processSuccessfulPayment(paymentId) {
  const payment = await getPayment(paymentId);

  if (!payment) {
    console.error(`❌ Платёж ${paymentId} не найден`);
    return null;
  }

  if (payment.status !== 'pending') {
    console.log(`⚠️ Платёж ${paymentId} уже обработан (${payment.status})`);
    return payment;
  }

  const { user_id, product_type, product_data, payment_method } = payment;
  const methodEmoji = payment_method === 'telegram_stars' ? '⭐' : '💳';

  console.log(`${methodEmoji} Обработка платежа ${paymentId}: user=${user_id}, type=${product_type}, data=${JSON.stringify(product_data)}`);

  let result;

  // Начисляем товар в зависимости от типа
  switch (product_type) {
    case 'pack_small':
    case 'pack_medium':
    case 'pack_large':
      result = await addPhotoSlides(user_id, product_data.slides);
      console.log(`${methodEmoji} Пакет ${product_type}: +${product_data.slides} слайдов → баланс: ${result.balanceAfter}`);
      break;

    case 'photo_slides':
      result = await addPhotoSlides(user_id, product_data.slides);
      console.log(`${methodEmoji} Photo slides: +${product_data.slides} слайдов → баланс: ${result.balanceAfter}`);
      break;

    case 'topup_slides':
      result = await addPhotoSlides(user_id, product_data.slides);
      console.log(`${methodEmoji} Докупка: +${product_data.slides} слайдов → баланс: ${result.balanceAfter}`);
      break;

    case 'custom_slides':
      result = await addPhotoSlides(user_id, product_data.slides);
      console.log(`${methodEmoji} Кастомная покупка: +${product_data.slides} слайдов → баланс: ${result.balanceAfter}`);
      break;

    case 'pro_month':
      const expiresMonth = await activateProSubscription(user_id, 1);
      console.log(`${methodEmoji} PRO месяц активирован до: ${expiresMonth?.toLocaleDateString('ru-RU')}`);
      break;

    case 'pro_year':
      const expiresYear = await activateProSubscription(user_id, 12);
      console.log(`${methodEmoji} PRO год активирован до: ${expiresYear?.toLocaleDateString('ru-RU')}`);
      break;

    default:
      console.error(`❌ Неизвестный тип продукта: ${product_type}`);
  }

  // Отмечаем платёж как завершённый
  await completePayment(paymentId, 'succeeded');

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
  REFERRAL_BONUS_INVITED,
  // Прямой доступ к Supabase клиенту (для админки)
  get supabase() { return supabase; }
};
