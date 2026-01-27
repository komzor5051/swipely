require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const db = require('./services/database');
const { transcribeVoice } = require('./services/whisper');
const { generateCarouselContent } = require('./services/gemini');
const { renderSlides } = require('./services/renderer');
const { upsertUser, saveCarouselGeneration } = require('./services/supabaseService');
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

      await bot.editMessageText(
        `📊 Отлично! Создам ${slideCount} слайдов.\n\n${copy.mainFlow.selectStyle}`,
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

      // Сохраняем генерацию в Supabase
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
    console.error('Ошибка callback_query:', error);
    await bot.sendMessage(chatId, copy.errors.generation);
  }
});

console.log('✅ Swipely Bot запущен!');
