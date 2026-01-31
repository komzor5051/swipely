require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const db = require('./services/database');
const { transcribeVoice } = require('./services/whisper');
const { generateCarouselContent } = require('./services/claude');
const { renderSlides } = require('./services/renderer');
const { upsertUser, saveMessage, getUserMessageHistory, saveCarouselGeneration } = require('./services/supabaseService');

// Инициализация бота
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true
});

// Simple in-memory session storage
const sessions = {};

// Инициализация базы данных
db.init();

console.log('🤖 Swipely Bot запускается...');

// Команда /start
bot.onText(/\/start/, async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const username = msg.from.username || msg.from.first_name;

  // Регистрируем пользователя в локальной БД (старая система)
  db.createUser(userId, username);

  // Регистрируем пользователя в Supabase (новая система)
  await upsertUser(msg.from);

  await bot.sendMessage(chatId,
    '👋 Привет! Я создаю стильные карусели за 1 минуту.\n\n' +
    '📝 Напиши или наговори мысль — я упакую её в контент.\n\n' +
    '✨ Просто отправь текст или голосовое сообщение!'
  );
});

// Обработка голосовых сообщений
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

    // ТЕСТОВЫЙ РЕЖИМ: лимиты отключены
    // const user = db.getUser(userId);
    // if (!db.canGenerate(userId)) {
    //   return bot.sendMessage(chatId, '⛔ Лимит генераций исчерпан!');
    // }

    // Получаем голосовое сообщение
    const fileLink = await bot.getFileLink(msg.voice.file_id);

    // Транскрибируем голос
    const transcription = await transcribeVoice(fileLink);

    await bot.sendMessage(chatId,
      `📝 Я услышал:\n"${transcription}"\n\n📊 Сколько слайдов создать?`,
      {
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
      }
    );

    // Сохраняем транскрипцию в сессии
    sessions[userId] = { transcription };

  } catch (error) {
    console.error('Ошибка обработки голоса:', error);
    await bot.sendMessage(chatId, '❌ Произошла ошибка. Попробуй ещё раз или отправь текстом.');
  }
});

// Обработка текстовых сообщений
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // Игнорируем команды и голосовые
  if (msg.text && msg.text.startsWith('/')) return;
  if (msg.voice) return;
  if (!msg.text) return;

  try {
    const text = msg.text;

    // Игнорируем служебные кнопки клавиатуры
    const ignoredTexts = ['🎤 Голосовое сообщение', '📝 Текстовое сообщение'];
    if (ignoredTexts.includes(text)) {
      return;
    }

    // ТЕСТОВЫЙ РЕЖИМ: лимиты отключены
    // if (!db.canGenerate(userId)) {
    //   return bot.sendMessage(chatId, '⛔ Лимит генераций исчерпан!');
    // }

    // Сохраняем сообщение пользователя в Supabase для анализа тона
    const userProfile = await upsertUser(msg.from); // Обновляем last_interaction_at

    // Логируем сообщение в БД
    console.log(`💾 Сохраняю сообщение пользователя ${userId} в Supabase...`);
    await saveMessage(userId, text, 'text', userProfile?.profile_id);

    await bot.sendMessage(chatId,
      `📝 Принял:\n"${text}"\n\n📊 Сколько слайдов создать?`,
      {
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
      }
    );

    // Сохраняем текст в сессии
    sessions[userId] = { transcription: text };

  } catch (error) {
    console.error('Ошибка обработки текста:', error);
    await bot.sendMessage(chatId, '❌ Произошла ошибка. Попробуй ещё раз.');
  }
});

// Обработка callback-кнопок
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const data = query.data;
  const messageId = query.message.message_id;

  try {
    // Обработка выбора количества слайдов
    if (data.startsWith('slides_')) {
      const slideCount = parseInt(data.replace('slides_', ''));

      // Сохраняем количество слайдов в сессию
      if (sessions[userId]) {
        sessions[userId].slideCount = slideCount;
      } else {
        sessions[userId] = { slideCount };
      }

      await bot.editMessageText(
        `📊 Отлично! Создам ${slideCount} слайдов.\n\n🎨 Теперь выбери стиль:`,
        {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [
              [{ text: '🌸 Minimal Pop', callback_data: 'style_minimal_pop' }],
              [{ text: '📓 Notebook Sketch', callback_data: 'style_notebook' }],
              [{ text: '🌑 Darkest Hour', callback_data: 'style_darkest' }]
            ]
          }
        }
      );

      // Отвечаем на callback query
      try {
        await bot.answerCallbackQuery(query.id);
      } catch (err) {
        if (!err.message.includes('too old')) {
          console.error('Ошибка answerCallbackQuery:', err.message);
        }
      }
      return;
    }

    // Обработка выбора стиля
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
      const slideCount = sessions[userId]?.slideCount || 5; // По умолчанию 5 слайдов

      if (!userText) {
        return bot.sendMessage(chatId, '❌ Текст не найден. Начни сначала с /start');
      }

      // Получаем историю сообщений пользователя для анализа тона
      const messageHistory = await getUserMessageHistory(userId, 20);
      const toneGuidelines = messageHistory.length > 0 ?
        `История сообщений пользователя (для анализа тона):\n${messageHistory.map(m => `- ${m.message_text}`).join('\n')}` :
        null;

      // Генерация контента через Claude с учетом тона пользователя
      const carouselData = await generateCarouselContent(userText, styleKey, slideCount, toneGuidelines);

      // Рендеринг слайдов в изображения
      await bot.sendMessage(chatId, '🎨 Строю макеты...');
      const images = await renderSlides(carouselData, styleKey);

      // Отправка карусели альбомом
      await bot.sendMessage(chatId, '📦 Собираю итоговую версию...');

      const mediaGroup = images.map((imgPath, idx) => ({
        type: 'photo',
        media: imgPath,
        caption: idx === 0 ? `✨ Твоя карусель в стиле ${styleNames[styleKey]}` : undefined
      }));

      await bot.sendMediaGroup(chatId, mediaGroup);

      // ТЕСТОВЫЙ РЕЖИМ: счетчик отключен
      // db.incrementGenerations(userId);
      // const user = db.getUser(userId);
      // const remaining = user.subscription_tier === 'pro' ? '∞' : (2 - user.generation_count);

      // Сохраняем генерацию в Supabase
      console.log(`📊 Сохраняю генерацию карусели для пользователя ${userId}...`);
      await saveCarouselGeneration(
        userId,
        userText,
        styleKey,
        slideCount,
        toneGuidelines ? { hasHistory: true, messageCount: messageHistory.length } : null
      );

      await bot.sendMessage(chatId,
        `✅ Готово!\n\n💾 Скачать без водяного знака?`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '💎 Скачать HD (PRO)', callback_data: 'download_hd' }],
              [{ text: '🔄 Создать ещё', callback_data: 'new_carousel' }]
            ]
          }
        }
      );

      // Очищаем сессию
      delete sessions[userId];
    }

    // Обработка других callback
    if (data === 'upgrade') {
      await bot.sendMessage(chatId,
        '💎 Swipely PRO — 490₽/мес\n\n' +
        '✨ Что входит:\n' +
        '• ∞ Генерации\n' +
        '• Без водяных знаков\n' +
        '• HD-экспорт (1080p)\n' +
        '• Ускоренная генерация\n' +
        '• Сохранение стилей\n\n' +
        '🔗 Оплатить: [ссылка на оплату]',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '💳 Оформить подписку', url: 'https://example.com/payment' }]
            ]
          }
        }
      );
    }

    if (data === 'new_carousel') {
      await bot.sendMessage(chatId,
        '🎨 Отправь новый текст или голосовое сообщение для создания карусели!'
      );
    }

    // Отвечаем на callback query (убираем "часики" на кнопке)
    try {
      await bot.answerCallbackQuery(query.id);
    } catch (err) {
      // Игнорируем ошибку "query too old" - это нормально для долгих генераций
      if (!err.message.includes('too old')) {
        console.error('Ошибка answerCallbackQuery:', err.message);
      }
    }

  } catch (error) {
    console.error('Ошибка обработки callback:', error);
    await bot.sendMessage(chatId, '❌ Произошла ошибка при генерации. Попробуй ещё раз.');
    try {
      await bot.answerCallbackQuery(query.id);
    } catch (err) {
      // Игнорируем
    }
  }
});

// Команда /upgrade
bot.onText(/\/upgrade/, async (msg) => {
  const chatId = msg.chat.id;

  await bot.sendMessage(chatId,
    '💎 Swipely PRO — 490₽/мес\n\n' +
    '✨ Что входит:\n' +
    '• ∞ Генерации\n' +
    '• Без водяных знаков\n' +
    '• HD-экспорт (1080p)\n' +
    '• Ускоренная генерация\n' +
    '• Сохранение стилей\n\n' +
    '🔗 Оплатить: [ссылка на оплату]',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '💳 Оформить подписку', url: 'https://example.com/payment' }]
        ]
      }
    }
  );
});

// Обработка ошибок polling
bot.on('polling_error', (error) => {
  console.error('❌ Ошибка polling:', error.message);
});

console.log('✅ Swipely Bot запущен!');
