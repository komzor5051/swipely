const { createClient } = require('@supabase/supabase-js');

// Инициализация Supabase клиента
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Создание или обновление пользователя в таблице profiles
 */
async function upsertUser(telegramUser) {
  const { id: telegramId, username, first_name, last_name } = telegramUser;

  try {
    // Вызываем SQL функцию для upsert профиля
    const { data, error } = await supabase
      .rpc('upsert_telegram_profile', {
        p_telegram_id: telegramId,
        p_telegram_username: username || null,
        p_first_name: first_name || null,
        p_last_name: last_name || null
      });

    if (error) {
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
  skipOnboarding
};
