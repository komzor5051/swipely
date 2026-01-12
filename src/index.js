require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const db = require('./services/database');
const { transcribeVoice } = require('./services/whisper');
const { generateCarouselContent } = require('./services/claude');
const { renderSlides } = require('./services/renderer');
const {
  upsertUser,
  saveMessage,
  getUserMessageHistory,
  saveCarouselGeneration,
  checkOnboardingStatus,
  saveUserContext,
  saveTovProfile,
  completeOnboarding,
  skipOnboarding
} = require('./services/supabaseService');
const copy = require('./utils/copy');
const demoCarousel = require('./data/demoCarousel');
const { analyzeToneOfVoice, formatTovProfile } = require('./services/tovAnalyzer');

// Инициализация бота
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true
});

// Simple in-memory session storage
const sessions = {};

// Инициализация базы данных
db.init();

console.log('🤖 Swipely Bot запускается...');

// ============================================
// КОМАНДА /START - НОВЫЙ UX
// ============================================
bot.onText(/\/start/, async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  try {
    // Регистрируем пользователя в локальной БД (старая система)
    db.createUser(userId, msg.from.username || msg.from.first_name);

    // Регистрируем/обновляем пользователя в Supabase
    await upsertUser(msg.from);

    // Проверяем статус онбординга
    const onboardingStatus = await checkOnboardingStatus(userId);

    if (onboardingStatus && onboardingStatus.onboarding_completed) {
      // Пользователь уже прошел онбординг - показываем главное меню
      return await bot.sendMessage(chatId, copy.mainFlow.requestInput);
    }

    // Новый пользователь - показываем Start Screen
    await bot.sendMessage(chatId, copy.start.welcome, {
      reply_markup: {
        inline_keyboard: [
          [{ text: copy.start.buttons.demo, callback_data: 'demo_carousel' }],
          [
            { text: copy.start.buttons.howItWorks, callback_data: 'how_it_works' },
            { text: copy.start.buttons.viewStyles, callback_data: 'view_styles' }
          ]
        ]
      }
    });

  } catch (error) {
    console.error('Ошибка /start:', error);
    await bot.sendMessage(chatId, copy.errors.generation);
  }
});

// ============================================
// ОБРАБОТКА ГОЛОСОВЫХ СООБЩЕНИЙ
// ============================================
bot.on('voice', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    // Проверка наличия OpenAI API ключа
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      return bot.sendMessage(chatId,
        '🎤 Голосовой ввод пока недоступен.\n\n' +
        '📝 Напиши текст сообщением, и я создам карусель!'
      );
    }

    await bot.sendMessage(chatId, '🎧 Слушаю твой голос...');

    // Проверяем, завершен ли онбординг
    const onboardingStatus = await checkOnboardingStatus(userId);
    const session = sessions[userId];

    // Если пользователь в процессе онбординга - обрабатываем через text handler
    if (session && (session.onboarding_phase === 'context' || session.onboarding_phase === 'tov')) {
      // Транскрибируем голос
      const fileLink = await bot.getFileLink(msg.voice.file_id);
      const transcription = await transcribeVoice(fileLink);

      // Эмулируем текстовое сообщение
      const fakeTextMsg = {
        ...msg,
        text: transcription
      };

      // Вызываем обработчик текста
      return handleTextMessage(fakeTextMsg);
    }

    // Обычный флоу - голосовой ввод для карусели
    if (!onboardingStatus || !onboardingStatus.onboarding_completed) {
      return await bot.sendMessage(chatId, 'Сначала давай пройдем быструю настройку!', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🚀 Начать настройку', callback_data: 'start_onboarding' }],
            [{ text: '⏩ Пропустить', callback_data: 'skip_onboarding' }]
          ]
        }
      });
    }

    // Получаем голосовое сообщение
    const fileLink = await bot.getFileLink(msg.voice.file_id);

    // Транскрибируем голос
    const transcription = await transcribeVoice(fileLink);

    await bot.sendMessage(chatId, copy.mainFlow.requestSlideCount(transcription), {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '3', callback_data: 'slides_3' },
            { text: '5', callback_data: 'slides_5' },
            { text: '7', callback_data: 'slides_7' }
          ],
          [
            { text: '10', callback_data: 'slides_10' },
            { text: '12', callback_data: 'slides_12' }
          ]
        ]
      }
    });

    // Сохраняем транскрипцию в сессии
    sessions[userId] = { transcription };

  } catch (error) {
    console.error('Ошибка обработки голоса:', error);
    await bot.sendMessage(chatId, copy.errors.voice);
  }
});

// ============================================
// ОБРАБОТКА ТЕКСТОВЫХ СООБЩЕНИЙ
// ============================================
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  // Игнорируем команды и не-текстовые сообщения
  if (!text || text.startsWith('/')) return;

  await handleTextMessage(msg);
});

async function handleTextMessage(msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  try {
    const userProfile = await upsertUser(msg.from);

    // Игнорируем служебные кнопки
    const ignoredTexts = ['🎤 Голосовое сообщение', '📝 Текстовое сообщение'];
    if (ignoredTexts.includes(text)) {
      return;
    }

    // Проверяем, в каком этапе онбординга пользователь
    const session = sessions[userId];

    // ==================== ONBOARDING PHASE 1: CONTEXT ====================
    if (session && session.onboarding_phase === 'context') {
      await saveUserContext(userId, text);
      delete session.onboarding_phase;

      // Переход к Phase 2: ToV
      sessions[userId] = { onboarding_phase: 'tov' };

      await bot.sendMessage(chatId, copy.onboarding.phase2.text);
      return;
    }

    // ==================== ONBOARDING PHASE 2: TOV ====================
    if (session && session.onboarding_phase === 'tov') {
      await bot.sendMessage(chatId, copy.onboarding.phase2.processing);

      // Анализируем ToV через Claude
      const tovProfile = await analyzeToneOfVoice(text);
      await saveTovProfile(userId, tovProfile);

      delete session.onboarding_phase;

      // Переход к Phase 3: Выбор роли
      const formattedTov = formatTovProfile(tovProfile);
      await bot.sendMessage(chatId, copy.onboarding.phase2.success(formattedTov), {
        parse_mode: 'Markdown'
      });

      await bot.sendMessage(chatId, copy.onboarding.phase3.text, {
        reply_markup: {
          inline_keyboard: [
            [{ text: copy.onboarding.phase3.roles.expert.button, callback_data: 'role_expert' }],
            [{ text: copy.onboarding.phase3.roles.visionary.button, callback_data: 'role_visionary' }],
            [{ text: copy.onboarding.phase3.roles.friend.button, callback_data: 'role_friend' }]
          ]
        }
      });
      return;
    }

    // ==================== NORMAL FLOW (после онбординга) ====================

    // Проверяем, завершен ли онбординг
    const onboardingStatus = await checkOnboardingStatus(userId);
    if (!onboardingStatus || !onboardingStatus.onboarding_completed) {
      await bot.sendMessage(chatId, 'Сначала давай пройдем быструю настройку!', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🚀 Начать настройку', callback_data: 'start_onboarding' }],
            [{ text: '⏩ Пропустить', callback_data: 'skip_onboarding' }]
          ]
        }
      });
      return;
    }

    // Логируем сообщение
    console.log(`💾 Сохраняю сообщение пользователя ${userId} в Supabase...`);
    await saveMessage(userId, text, 'text', userProfile?.profile_id);

    // Обычный флоу создания карусели
    await bot.sendMessage(chatId, copy.mainFlow.requestSlideCount(text), {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '3', callback_data: 'slides_3' },
            { text: '5', callback_data: 'slides_5' },
            { text: '7', callback_data: 'slides_7' }
          ],
          [
            { text: '10', callback_data: 'slides_10' },
            { text: '12', callback_data: 'slides_12' }
          ]
        ]
      }
    });

    sessions[userId] = { transcription: text };

  } catch (error) {
    console.error('Ошибка обработки текста:', error);
    await bot.sendMessage(chatId, copy.errors.generation);
  }
}

// ============================================
// ОБРАБОТКА CALLBACK QUERIES
// ============================================
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const data = query.data;
  const messageId = query.message.message_id;

  try {
    await bot.answerCallbackQuery(query.id);
  } catch (err) {
    if (!err.message.includes('too old')) {
      console.error('Ошибка answerCallbackQuery:', err.message);
    }
  }

  try {
    // ==================== DEMO CAROUSEL ====================
    if (data === 'demo_carousel') {
      await bot.sendMessage(chatId, copy.demo.generating);

      // Генерируем демо-карусель из статичного JSON
      const imgPaths = await renderSlides(demoCarousel, 'minimal_pop');

      const mediaGroup = imgPaths.map((imgPath, idx) => ({
        type: 'photo',
        media: imgPath,
        caption: idx === 0 ? copy.demo.result : undefined
      }));

      await bot.sendMediaGroup(chatId, mediaGroup);

      // Предложение пройти онбординг
      await bot.sendMessage(chatId, 'Хочешь настроить бота под себя?', {
        reply_markup: {
          inline_keyboard: [
            [{ text: copy.demo.buttons.startOnboarding, callback_data: 'start_onboarding' }],
            [{ text: copy.demo.buttons.createNow, callback_data: 'create_now' }]
          ]
        }
      });
      return;
    }

    // ==================== HOW IT WORKS ====================
    if (data === 'how_it_works') {
      await bot.sendMessage(chatId, copy.howItWorks.text, {
        reply_markup: {
          inline_keyboard: [
            [{ text: copy.howItWorks.button, callback_data: 'create_now' }]
          ]
        },
        parse_mode: 'Markdown'
      });
      return;
    }

    // ==================== VIEW STYLES ====================
    if (data === 'view_styles') {
      await bot.sendMessage(chatId, copy.mainFlow.selectStyle, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '✨ Minimal Pop', callback_data: 'view_style_minimal_pop' }],
            [{ text: '📓 Notebook Sketch', callback_data: 'view_style_notebook' }],
            [{ text: '🌚 Darkest Hour', callback_data: 'view_style_darkest' }]
          ]
        }
      });
      return;
    }

    // ==================== START ONBOARDING - PHASE 1 ====================
    if (data === 'start_onboarding') {
      sessions[userId] = { onboarding_phase: 'context' };

      await bot.sendMessage(chatId, copy.onboarding.phase1.text, {
        reply_markup: {
          inline_keyboard: [
            [{ text: copy.onboarding.phase1.button, callback_data: 'skip_onboarding' }]
          ]
        },
        parse_mode: 'Markdown'
      });
      return;
    }

    // ==================== SKIP ONBOARDING ====================
    if (data === 'skip_onboarding') {
      await skipOnboarding(userId);
      delete sessions[userId];

      await bot.sendMessage(chatId, copy.mainFlow.requestInput);
      return;
    }

    // ==================== PHASE 3: ROLE SELECTION ====================
    if (data.startsWith('role_')) {
      const role = data.replace('role_', ''); // expert, visionary, friend

      // Извлекаем нишу из контекста (если есть)
      const profile = await checkOnboardingStatus(userId);
      const niche = profile?.niche || null;

      await completeOnboarding(userId, role, niche);
      delete sessions[userId];

      await bot.sendMessage(chatId, copy.onboarding.complete(profile), {
        reply_markup: {
          inline_keyboard: [
            [{ text: copy.onboarding.completeButtons.create, callback_data: 'create_now' }],
            [{ text: copy.onboarding.completeButtons.randomTopic, callback_data: 'random_topic' }]
          ]
        },
        parse_mode: 'Markdown'
      });
      return;
    }

    // ==================== CREATE NOW ====================
    if (data === 'create_now') {
      const onboardingStatus = await checkOnboardingStatus(userId);

      if (!onboardingStatus || !onboardingStatus.onboarding_completed) {
        await skipOnboarding(userId);
      }

      await bot.sendMessage(chatId, copy.mainFlow.requestInput);
      return;
    }

    // ==================== ВЫБОР КОЛИЧЕСТВА СЛАЙДОВ ====================
    if (data.startsWith('slides_')) {
      const slideCount = parseInt(data.replace('slides_', ''));

      // Сохраняем количество слайдов в сессию
      if (sessions[userId]) {
        sessions[userId].slideCount = slideCount;
      } else {
        sessions[userId] = { slideCount };
      }

      await bot.editMessageText(
        `📊 Отлично! Создам ${slideCount} слайдов.\n\n${copy.mainFlow.selectStyle}`,
        {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [
              [{ text: '✨ Minimal Pop', callback_data: 'style_minimal_pop' }],
              [{ text: '📓 Notebook Sketch', callback_data: 'style_notebook' }],
              [{ text: '🌚 Darkest Hour', callback_data: 'style_darkest' }]
            ]
          }
        }
      );
      return;
    }

    // ==================== ВЫБОР СТИЛЯ И ГЕНЕРАЦИЯ ====================
    if (data.startsWith('style_')) {
      const styleKey = data.replace('style_', '');
      const styleNames = {
        'minimal_pop': 'Minimal Pop',
        'notebook': 'Notebook Sketch',
        'darkest': 'Darkest Hour'
      };

      await bot.editMessageText(
        `✍️ Генерирую карусель в стиле "${styleNames[styleKey]}"...\n⏳ Это займёт 15-20 секунд`,
        {
          chat_id: chatId,
          message_id: messageId
        }
      );

      const userText = sessions[userId]?.transcription;
      const slideCount = sessions[userId]?.slideCount || 5;

      if (!userText) {
        return bot.sendMessage(chatId, '❌ Текст не найден. Начни сначала с /start');
      }

      // Получаем профиль пользователя для ToV
      const userProfile = await checkOnboardingStatus(userId);
      const messageHistory = await getUserMessageHistory(userId, 20);

      // Формируем контекст для Claude с учетом ToV профиля
      let toneGuidelines = null;
      if (userProfile && userProfile.tov_profile && Object.keys(userProfile.tov_profile).length > 0) {
        toneGuidelines = `Профиль пользователя:
- Контекст: ${userProfile.user_context || 'не указан'}
- Роль: ${userProfile.user_role || 'expert'}
- Стиль: ${JSON.stringify(userProfile.tov_profile)}
${messageHistory.length > 0 ? `\nИстория сообщений:\n${messageHistory.map(m => `- ${m.message_text}`).join('\n')}` : ''}`;
      } else if (messageHistory.length > 0) {
        toneGuidelines = `История сообщений пользователя:\n${messageHistory.map(m => `- ${m.message_text}`).join('\n')}`;
      }

      // Генерация контента через Claude
      await bot.sendMessage(chatId, copy.mainFlow.progress.analyzing);
      const carouselData = await generateCarouselContent(userText, styleKey, slideCount, toneGuidelines);

      // Рендеринг слайдов
      await bot.sendMessage(chatId, copy.mainFlow.progress.rendering);
      const images = await renderSlides(carouselData, styleKey);

      // Отправка карусели
      const mediaGroup = images.map((imgPath, idx) => ({
        type: 'photo',
        media: imgPath,
        caption: idx === 0 ? `✨ Твоя карусель в стиле ${styleNames[styleKey]}` : undefined
      }));

      await bot.sendMediaGroup(chatId, mediaGroup);

      // Сохраняем генерацию в Supabase
      console.log(`📊 Сохраняю генерацию карусели для пользователя ${userId}...`);
      await saveCarouselGeneration(
        userId,
        userText,
        styleKey,
        slideCount,
        toneGuidelines ? { hasToV: true, role: userProfile.user_role } : null
      );

      // Результат с кнопками действий
      await bot.sendMessage(chatId, copy.mainFlow.result, {
        reply_markup: {
          inline_keyboard: [
            [{ text: copy.mainFlow.resultButtons.createNew, callback_data: 'create_now' }]
          ]
        }
      });

      // Очищаем сессию
      delete sessions[userId];
      return;
    }

  } catch (error) {
    console.error('Ошибка callback_query:', error);
    await bot.sendMessage(chatId, copy.errors.generation);
  }
});

console.log('✅ Swipely Bot запущен!');
