require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const db = require('./services/database');
const { transcribeVoice } = require('./services/whisper');
const { generateCarouselContent } = require('./services/gemini');
const { renderSlides, renderSlidesWithImages } = require('./services/renderer');
const { downloadTelegramPhoto, generateCarouselImages, STYLE_PROMPTS } = require('./services/imageGenerator');
const { upsertUser, saveCarouselGeneration } = require('./services/supabaseService');
const { logUser, logGeneration } = require('./services/userLogger');
const copy = require('./utils/copy');
const demoCarousel = require('./data/demoCarousel');

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
// КОМАНДА /START
// ============================================
bot.onText(/\/start/, async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  try {
    // Регистрируем пользователя в локальной БД
    db.createUser(userId, msg.from.username || msg.from.first_name);

    // Логируем пользователя в файл
    logUser(msg.from);

    // Регистрируем/обновляем пользователя в Supabase
    await upsertUser(msg.from);

    // Сразу показываем главное меню
    await bot.sendMessage(chatId, copy.mainFlow.requestInput);

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

    // Получаем и транскрибируем голосовое сообщение
    const fileLink = await bot.getFileLink(msg.voice.file_id);
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
// ОБРАБОТКА ФОТО (для AI-аватаров)
// ============================================
bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // Проверяем, ждём ли мы фото от этого пользователя
  if (!sessions[userId]?.awaitingPhoto) {
    return bot.sendMessage(chatId, copy.photoMode.photoRequest.wrongContext);
  }

  try {
    await bot.sendMessage(chatId, copy.photoMode.progress.photoReceived);

    // Получаем самое большое фото (последнее в массиве)
    const photoSizes = msg.photo;
    const largestPhoto = photoSizes[photoSizes.length - 1];

    // Скачиваем и конвертируем в base64
    const photoBase64 = await downloadTelegramPhoto(bot, largestPhoto.file_id);

    sessions[userId].referencePhoto = photoBase64;
    sessions[userId].awaitingPhoto = false;

    // Запускаем генерацию
    await startPhotoModeGeneration(chatId, userId);

  } catch (error) {
    console.error('❌ Ошибка обработки фото:', error);
    await bot.sendMessage(chatId, copy.photoMode.errors.photoProcessing);
  }
});

/**
 * Генерация карусели в режиме с фото (AI-аватары)
 */
async function startPhotoModeGeneration(chatId, userId) {
  const session = sessions[userId];

  if (!session || !session.transcription || !session.referencePhoto) {
    return bot.sendMessage(chatId, '❌ Данные сессии потеряны. Начни сначала с /start');
  }

  try {
    const slideCount = session.slideCount || 5;
    const imageStyle = session.imageStyle || 'cartoon';
    const styleName = STYLE_PROMPTS[imageStyle]?.name || imageStyle;

    // 1. Генерация контента
    await bot.sendMessage(chatId, copy.photoMode.progress.generatingContent);
    const carouselData = await generateCarouselContent(
      session.transcription,
      'photo_mode',
      slideCount,
      null
    );

    // 2. Генерация AI-изображений
    await bot.sendMessage(chatId, copy.photoMode.progress.generatingImages(slideCount));
    const images = await generateCarouselImages(
      carouselData,
      session.referencePhoto,
      imageStyle
    );

    // 3. Рендеринг слайдов с текстом поверх изображений
    await bot.sendMessage(chatId, copy.photoMode.progress.composingSlides);
    const finalImages = await renderSlidesWithImages(carouselData, images);

    // 4. Отправка карусели
    const mediaGroup = finalImages.map((imgPath, idx) => ({
      type: 'photo',
      media: imgPath,
      caption: idx === 0 ? `✨ AI-карусель в стиле "${styleName}"` : undefined
    }));

    await bot.sendMediaGroup(chatId, mediaGroup);

    // 5. Логирование
    logGeneration(userId, `photo_${imageStyle}`, slideCount);
    console.log(`📊 Сохраняю AI-генерацию для пользователя ${userId}...`);
    await saveCarouselGeneration(
      userId,
      session.transcription,
      `photo_${imageStyle}`,
      slideCount,
      { mode: 'photo', imageStyle: imageStyle }
    );

    // 6. Результат
    await bot.sendMessage(chatId, copy.photoMode.result, {
      reply_markup: {
        inline_keyboard: [
          [{ text: copy.mainFlow.resultButtons.createNew, callback_data: 'create_now' }]
        ]
      }
    });

    // Очищаем сессию
    delete sessions[userId];

  } catch (error) {
    console.error('❌ Ошибка photo mode generation:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    await bot.sendMessage(chatId, copy.photoMode.errors.imageGeneration);
  }
}

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
    await upsertUser(msg.from);

    // Игнорируем служебные кнопки
    const ignoredTexts = ['🎤 Голосовое сообщение', '📝 Текстовое сообщение'];
    if (ignoredTexts.includes(text)) {
      return;
    }

    // Сразу показываем выбор количества слайдов
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

      // Предложение создать свою карусель
      await bot.sendMessage(chatId, 'Теперь создай свою карусель!', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📝 Создать карусель', callback_data: 'create_now' }]
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
            [{ text: '🌚 Darkest Hour', callback_data: 'view_style_darkest' }],
            [{ text: '🌌 Aurora', callback_data: 'view_style_aurora' }],
            [{ text: '💻 Terminal', callback_data: 'view_style_terminal' }],
            [{ text: '📰 Editorial', callback_data: 'view_style_editorial' }],
            [{ text: '🍃 Zen', callback_data: 'view_style_zen' }],
            [{ text: '🎨 Memphis', callback_data: 'view_style_memphis' }],
            [{ text: '💎 Luxe', callback_data: 'view_style_luxe' }]
          ]
        }
      });
      return;
    }

    // ==================== CREATE NOW ====================
    if (data === 'create_now') {
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

      // Показываем выбор режима генерации
      await bot.editMessageText(
        copy.photoMode.modeSelection.text(slideCount),
        {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [
              [{ text: copy.photoMode.modeSelection.buttons.standard, callback_data: 'mode_standard' }],
              [{ text: copy.photoMode.modeSelection.buttons.photo, callback_data: 'mode_photo' }]
            ]
          }
        }
      );
      return;
    }

    // ==================== РЕЖИМ: ОБЫЧНЫЙ (HTML шаблоны) ====================
    if (data === 'mode_standard') {
      if (sessions[userId]) {
        sessions[userId].generationMode = 'standard';
      }

      await bot.editMessageText(
        copy.mainFlow.selectStyle,
        {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✨ Minimal Pop', callback_data: 'style_minimal_pop' },
                { text: '📓 Notebook', callback_data: 'style_notebook' }
              ],
              [
                { text: '🌚 Darkest', callback_data: 'style_darkest' },
                { text: '🌌 Aurora', callback_data: 'style_aurora' }
              ],
              [
                { text: '💻 Terminal', callback_data: 'style_terminal' },
                { text: '📰 Editorial', callback_data: 'style_editorial' }
              ],
              [
                { text: '🍃 Zen', callback_data: 'style_zen' },
                { text: '🎨 Memphis', callback_data: 'style_memphis' }
              ],
              [{ text: '💎 Luxe', callback_data: 'style_luxe' }]
            ]
          }
        }
      );
      return;
    }

    // ==================== РЕЖИМ: С ФОТО (AI-аватары) ====================
    if (data === 'mode_photo') {
      if (sessions[userId]) {
        sessions[userId].generationMode = 'photo';

        // Ограничиваем количество слайдов для экономии
        if (sessions[userId].slideCount > 7) {
          sessions[userId].slideCount = 7;
          await bot.sendMessage(chatId, copy.photoMode.slideLimit);
        }
      }

      await bot.editMessageText(
        copy.photoMode.styleSelection.text,
        {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [
              [{ text: copy.photoMode.styleSelection.buttons.cartoon, callback_data: 'imgstyle_cartoon' }],
              [{ text: copy.photoMode.styleSelection.buttons.realistic, callback_data: 'imgstyle_realistic' }]
            ]
          }
        }
      );
      return;
    }

    // ==================== ВЫБОР СТИЛЯ ИЗОБРАЖЕНИЯ (для photo mode) ====================
    if (data.startsWith('imgstyle_')) {
      const imageStyle = data.replace('imgstyle_', '');

      if (sessions[userId]) {
        sessions[userId].imageStyle = imageStyle;
        sessions[userId].awaitingPhoto = true;
      }

      const styleName = STYLE_PROMPTS[imageStyle]?.name || imageStyle;

      await bot.editMessageText(
        copy.photoMode.photoRequest.text(styleName),
        {
          chat_id: chatId,
          message_id: messageId
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
        'darkest': 'Darkest Hour',
        'aurora': 'Aurora',
        'terminal': 'Terminal',
        'editorial': 'Editorial',
        'zen': 'Zen',
        'memphis': 'Memphis',
        'luxe': 'Luxe'
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

      // Генерация контента через Gemini
      await bot.sendMessage(chatId, copy.mainFlow.progress.analyzing);
      const carouselData = await generateCarouselContent(userText, styleKey, slideCount, null);

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

      // Логируем генерацию
      logGeneration(userId, styleKey, slideCount);
      console.log(`📊 Сохраняю генерацию карусели для пользователя ${userId}...`);
      await saveCarouselGeneration(userId, userText, styleKey, slideCount, null);

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
    console.error('❌ Ошибка callback_query:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    await bot.sendMessage(chatId, copy.errors.generation);
  }
});

console.log('✅ Swipely Bot запущен!');
