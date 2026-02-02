const { createClient } = require('@supabase/supabase-js');

// Инициализация Supabase клиента
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Создание или обновление пользователя в таблице profiles
 * Использует RPC функцию для одного запроса вместо двух
 * НЕ сбрасывает балансы и другие важные данные!
 */
async function upsertUser(telegramUser) {
  const { id: telegramId, username, first_name, last_name } = telegramUser;

  try {
    // Используем RPC функцию для атомарного upsert (1 запрос вместо 2)
    const { data, error } = await supabase.rpc('upsert_profile', {
      p_telegram_id: telegramId,
      p_username: username || null,
      p_first_name: first_name || null,
      p_last_name: last_name || null
    });

    if (error) {
      // Fallback на старый метод если RPC функция не существует
      if (error.code === '42883') { // function does not exist
        console.log('⚠️ RPC функция не найдена, используем fallback');
        return await upsertUserFallback(telegramUser);
      }
      console.error('❌ Ошибка upsert пользователя:', error);
      return null;
    }

    console.log(`✅ Пользователь сохранен: ${username || telegramId} (profile_id: ${data})`);
    return { profile_id: data, telegram_id: telegramId };
  } catch (err) {
    console.error('❌ Критическая ошибка upsert:', err);
    return null;
  }
}

/**
 * Fallback метод если RPC функция не создана
 * TODO: Удалить после применения миграции
 */
async function upsertUserFallback(telegramUser) {
  const { id: telegramId, username, first_name, last_name } = telegramUser;

  try {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          telegram_username: username || null,
          first_name: first_name || null,
          last_name: last_name || null
        })
        .eq('telegram_id', telegramId)
        .select('id')
        .single();

      if (error) {
        console.error('❌ Ошибка обновления пользователя:', error);
        return null;
      }
      return { profile_id: data.id, telegram_id: telegramId };
    } else {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          telegram_id: telegramId,
          telegram_username: username || null,
          first_name: first_name || null,
          last_name: last_name || null,
          subscription_tier: 'free',
          photo_slides_balance: 0,
          standard_count_month: 0,
          generation_count: 0
        })
        .select('id')
        .single();

      if (error) {
        console.error('❌ Ошибка создания пользователя:', error);
        return null;
      }
      return { profile_id: data.id, telegram_id: telegramId };
    }
  } catch (err) {
    console.error('❌ Критическая ошибка fallback upsert:', err);
    return null;
  }
}

/**
 * Сохранение сообщения пользователя в историю
 */
async function saveMessage(telegramId, messageText, messageType = 'text', profileId = null) {
  try {
    let profile_id = profileId;

    // Если profile_id не передан, ищем по telegram_id
    if (!profile_id) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('telegram_id', telegramId)
        .single();

      if (profileError || !profile) {
        console.error('❌ Профиль не найден для сохранения сообщения:', telegramId);
        return null;
      }
      profile_id = profile.id;
    }

    const { data, error } = await supabase
      .from('user_messages')
      .insert({
        profile_id: profile_id,
        telegram_id: telegramId,
        message_text: messageText,
        message_type: messageType
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Ошибка сохранения сообщения:', error);
      return null;
    }

    console.log(`💾 Сообщение сохранено для пользователя ${telegramId}`);
    return data;
  } catch (err) {
    console.error('❌ Критическая ошибка saveMessage:', err);
    return null;
  }
}

/**
 * Получение истории сообщений пользователя
 */
async function getUserMessageHistory(telegramId, limit = 20) {
  try {
    const { data, error } = await supabase
      .rpc('get_telegram_message_history', {
        p_telegram_id: telegramId,
        p_limit: limit
      });

    if (error) {
      console.error('❌ Ошибка получения истории:', error);
      return [];
    }

    console.log(`📚 Получено ${data?.length || 0} сообщений из истории пользователя ${telegramId}`);
    return data || [];
  } catch (err) {
    console.error('❌ Критическая ошибка getUserMessageHistory:', err);
    return [];
  }
}

/**
 * Сохранение генерации карусели
 */
async function saveCarouselGeneration(telegramId, inputText, stylePreset, slideCount, toneAnalysis = null) {
  try {
    // Получаем profile_id из таблицы profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (profileError || !profile) {
      console.error('❌ Профиль не найден для сохранения генерации:', telegramId);
      return null;
    }

    // 1. Сохраняем в usage_tracking (для лимитов)
    const { error: usageError } = await supabase
      .from('usage_tracking')
      .insert({
        user_id: profile.id,
        generation_type: 'carousel',
        metadata: {
          source: 'telegram_bot',
          telegram_id: telegramId,
          style_preset: stylePreset,
          slide_count: slideCount,
          input_text: inputText.substring(0, 100), // Первые 100 символов
          tone_analysis: toneAnalysis
        }
      });

    if (usageError) {
      console.error('❌ Ошибка записи в usage_tracking:', usageError);
    }

    // 2. Сохраняем в projects (для истории проектов)
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: profile.id,
        project_type: 'carousel',
        title: `Telegram: ${inputText.substring(0, 50)}...`,
        data: {
          source: 'telegram_bot',
          telegram_id: telegramId,
          input_text: inputText,
          style_preset: stylePreset,
          slide_count: slideCount,
          tone_analysis: toneAnalysis
        }
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Ошибка сохранения в projects:', error);
      return null;
    }

    console.log(`🎨 Генерация сохранена для пользователя ${telegramId}`);
    return data;
  } catch (err) {
    console.error('❌ Критическая ошибка saveCarouselGeneration:', err);
    return null;
  }
}

/**
 * Получение статистики пользователя
 */
async function getUserStats(telegramId) {
  try {
    // Получаем profile_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, subscription_tier')
      .eq('telegram_id', telegramId)
      .single();

    if (profileError || !profile) {
      console.error('❌ Профиль не найден для получения статистики:', telegramId);
      return null;
    }

    // Считаем генерации из usage_tracking
    const { count: totalGenerations, error: genError } = await supabase
      .from('usage_tracking')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('generation_type', 'carousel');

    // Считаем сообщения
    const { count: totalMessages, error: msgError } = await supabase
      .from('user_messages')
      .select('*', { count: 'exact', head: true })
      .eq('telegram_id', telegramId);

    if (genError || msgError) {
      console.error('❌ Ошибка получения статистики');
      return null;
    }

    return {
      totalGenerations: totalGenerations || 0,
      totalMessages: totalMessages || 0,
      subscriptionTier: profile.subscription_tier
    };
  } catch (err) {
    console.error('❌ Критическая ошибка getUserStats:', err);
    return null;
  }
}

/**
 * Проверка завершения онбординга
 */
async function checkOnboardingStatus(telegramId) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('onboarding_completed, onboarding_step, user_role, tov_profile, user_context, niche')
      .eq('telegram_id', telegramId)
      .single();

    if (error) {
      console.error('❌ Ошибка проверки онбординга:', error);
      return null;
    }

    return profile;
  } catch (err) {
    console.error('❌ Критическая ошибка checkOnboardingStatus:', err);
    return null;
  }
}

/**
 * Сохранение контекста пользователя (Phase 1)
 */
async function saveUserContext(telegramId, context) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        user_context: context,
        onboarding_step: 'tov'
      })
      .eq('telegram_id', telegramId);

    if (error) {
      console.error('❌ Ошибка сохранения контекста:', error);
      return false;
    }

    console.log(`💾 Контекст сохранен для пользователя ${telegramId}`);
    return true;
  } catch (err) {
    console.error('❌ Критическая ошибка saveUserContext:', err);
    return false;
  }
}

/**
 * Сохранение ToV профиля (Phase 2)
 */
async function saveTovProfile(telegramId, tovProfile) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        tov_profile: tovProfile,
        onboarding_step: 'role'
      })
      .eq('telegram_id', telegramId);

    if (error) {
      console.error('❌ Ошибка сохранения ToV профиля:', error);
      return false;
    }

    console.log(`🎯 ToV профиль сохранен для пользователя ${telegramId}`);
    return true;
  } catch (err) {
    console.error('❌ Критическая ошибка saveTovProfile:', err);
    return false;
  }
}

/**
 * Завершение онбординга (Phase 3)
 */
async function completeOnboarding(telegramId, userRole, niche = null) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        user_role: userRole,
        niche: niche,
        onboarding_completed: true,
        onboarding_step: 'completed'
      })
      .eq('telegram_id', telegramId);

    if (error) {
      console.error('❌ Ошибка завершения онбординга:', error);
      return false;
    }

    console.log(`✅ Онбординг завершен для пользователя ${telegramId}`);
    return true;
  } catch (err) {
    console.error('❌ Критическая ошибка completeOnboarding:', err);
    return false;
  }
}

/**
 * Пропуск онбординга (быстрый старт)
 */
async function skipOnboarding(telegramId) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        onboarding_completed: true,
        onboarding_step: 'completed',
        user_role: 'expert' // Дефолтная роль
      })
      .eq('telegram_id', telegramId);

    if (error) {
      console.error('❌ Ошибка пропуска онбординга:', error);
      return false;
    }

    console.log(`⏩ Онбординг пропущен для пользователя ${telegramId}`);
    return true;
  } catch (err) {
    console.error('❌ Критическая ошибка skipOnboarding:', err);
    return false;
  }
}

/**
 * Сохранение отображаемого юзернейма
 */
async function saveDisplayUsername(telegramId, displayUsername) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        display_username: displayUsername
      })
      .eq('telegram_id', telegramId);

    if (error) {
      console.error('❌ Ошибка сохранения юзернейма:', error);
      return false;
    }

    console.log(`✅ Юзернейм сохранен для пользователя ${telegramId}: ${displayUsername}`);
    return true;
  } catch (err) {
    console.error('❌ Критическая ошибка saveDisplayUsername:', err);
    return false;
  }
}

/**
 * Получение отображаемого юзернейма
 */
async function getDisplayUsername(telegramId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('display_username, telegram_username')
      .eq('telegram_id', telegramId)
      .single();

    if (error) {
      console.error('❌ Ошибка получения юзернейма:', error);
      return null;
    }

    // Возвращаем display_username или telegram_username как fallback
    return data?.display_username || data?.telegram_username || null;
  } catch (err) {
    console.error('❌ Критическая ошибка getDisplayUsername:', err);
    return null;
  }
}

// ============================================
// ПЛАТЕЖИ (PAYMENTS)
// ============================================

/**
 * Сохранение платежа в Supabase
 */
async function savePayment(paymentData) {
  const {
    payment_id,
    telegram_id,
    amount,
    currency,
    product_type,
    product_data,
    payment_method,
    status
  } = paymentData;

  try {
    const { data, error } = await supabase
      .from('payments')
      .upsert({
        payment_id,
        telegram_id,
        amount,
        currency: currency || (payment_method === 'telegram_stars' ? 'XTR' : 'RUB'),
        product_type,
        product_data,
        payment_method,
        status: status || 'pending'
      }, { onConflict: 'payment_id' })
      .select()
      .single();

    if (error) {
      console.error('❌ Ошибка сохранения платежа в Supabase:', error);
      return null;
    }

    console.log(`💳 Платеж сохранен в Supabase: ${payment_id}`);
    return data;
  } catch (err) {
    console.error('❌ Критическая ошибка savePayment:', err);
    return null;
  }
}

/**
 * Обновление статуса платежа
 */
async function updatePaymentStatus(paymentId, status) {
  try {
    const { error } = await supabase
      .from('payments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('payment_id', paymentId);

    if (error) {
      console.error('❌ Ошибка обновления статуса платежа:', error);
      return false;
    }

    console.log(`💳 Статус платежа обновлен: ${paymentId} → ${status}`);
    return true;
  } catch (err) {
    console.error('❌ Критическая ошибка updatePaymentStatus:', err);
    return false;
  }
}

/**
 * Получение статистики платежей для админки
 */
async function getPaymentsStats() {
  try {
    // Stars успешные
    const { count: starsSucceededCount, data: starsData } = await supabase
      .from('payments')
      .select('amount', { count: 'exact' })
      .eq('payment_method', 'telegram_stars')
      .eq('status', 'succeeded');

    const starsTotal = starsData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    // YooKassa успешные
    const { count: yookassaSucceededCount, data: yookassaData } = await supabase
      .from('payments')
      .select('amount', { count: 'exact' })
      .eq('payment_method', 'yookassa')
      .eq('status', 'succeeded');

    const yookassaTotal = yookassaData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    // Pending
    const { count: starsPendingCount } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('payment_method', 'telegram_stars')
      .eq('status', 'pending');

    const { count: yookassaPendingCount } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('payment_method', 'yookassa')
      .eq('status', 'pending');

    return {
      stars: {
        succeeded: { count: starsSucceededCount || 0, total: starsTotal },
        pending: { count: starsPendingCount || 0 }
      },
      yookassa: {
        succeeded: { count: yookassaSucceededCount || 0, total: yookassaTotal },
        pending: { count: yookassaPendingCount || 0 }
      }
    };
  } catch (err) {
    console.error('❌ Ошибка получения статистики платежей:', err);
    return null;
  }
}

/**
 * Получение последних платежей
 */
async function getRecentPayments(limit = 5) {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('payment_id, telegram_id, amount, product_type, payment_method, status, created_at')
      .eq('status', 'succeeded')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Ошибка получения последних платежей:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('❌ Критическая ошибка getRecentPayments:', err);
    return [];
  }
}

/**
 * Получение общей статистики платежей
 */
async function getTotalPaymentsStats() {
  try {
    // Всего успешных платежей
    const { count: totalPayments } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'succeeded');

    // Сумма по YooKassa
    const { data: yookassaData } = await supabase
      .from('payments')
      .select('amount')
      .eq('payment_method', 'yookassa')
      .eq('status', 'succeeded');

    const totalRevenue = yookassaData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    // Сумма по Stars
    const { data: starsData } = await supabase
      .from('payments')
      .select('amount')
      .eq('payment_method', 'telegram_stars')
      .eq('status', 'succeeded');

    const totalStars = starsData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    // Сегодняшние платежи
    const today = new Date().toISOString().split('T')[0];
    const { count: todayPayments } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'succeeded')
      .gte('created_at', today);

    return {
      totalPayments: totalPayments || 0,
      totalRevenue,
      totalStars,
      todayPayments: todayPayments || 0
    };
  } catch (err) {
    console.error('❌ Ошибка получения общей статистики:', err);
    return null;
  }
}

module.exports = {
  supabase,
  upsertUser,
  saveMessage,
  getUserMessageHistory,
  saveCarouselGeneration,
  getUserStats,
  // Онбординг функции
  checkOnboardingStatus,
  saveUserContext,
  saveTovProfile,
  completeOnboarding,
  skipOnboarding,
  // Настройки пользователя
  saveDisplayUsername,
  getDisplayUsername,
  // Платежи
  savePayment,
  updatePaymentStatus,
  getPaymentsStats,
  getRecentPayments,
  getTotalPaymentsStats
};
