require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const db = require('./services/database');
const { transcribeVoice } = require('./services/whisper');
const { generateCarouselContent } = require('./services/gemini');
const { renderSlides, renderSlidesWithImages } = require('./services/renderer');
const { downloadTelegramPhoto, generateCarouselImages, STYLE_PROMPTS } = require('./services/imageGenerator');
const { upsertUser, saveCarouselGeneration, saveDisplayUsername, getDisplayUsername } = require('./services/supabaseService');
const { logUser, logGeneration } = require('./services/userLogger');
const { getPreviewPaths, STYLE_INFO } = require('./services/previewService');
const { createEditSession } = require('./services/editorService');
const copy = require('./utils/copy');
const demoCarousel = require('./data/demoCarousel');
const pricing = require('./config/pricing');
const yookassa = require('./services/yookassa');

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
// КОМАНДА /START и /MENU - Главное меню
// ============================================
bot.onText(/\/(start|menu)(.*)/, async (msg, match) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const param = match[2]?.trim(); // Параметр после /start (например, payment_xxx)

  try {
    // Регистрируем пользователя в локальной БД
    db.createUser(userId, msg.from.username || msg.from.first_name);

    // Логируем пользователя в файл
    logUser(msg.from);

    // Регистрируем/обновляем пользователя в Supabase
    await upsertUser(msg.from);

    // Проверяем, это возврат из платёжной системы?
    if (param && param.startsWith('payment_')) {
      const paymentId = param.replace('payment_', '');
      await handlePaymentReturn(chatId, userId, paymentId);
      return;
    }

    // Проверяем реферальную ссылку
    if (param && param.startsWith('ref_')) {
      const referrerId = parseInt(param.replace('ref_', ''));
      if (referrerId && referrerId !== userId && db.isNewUser(userId)) {
        const result = db.processReferral(userId, referrerId);
        if (result) {
          // Уведомляем приглашённого
          await bot.sendMessage(chatId, copy.referral.invitedBonus(result.invitedBonus), {
            parse_mode: 'Markdown'
          });

          // Уведомляем пригласившего
          try {
            const referrerStatus = db.getUserStatus(referrerId);
            await bot.sendMessage(referrerId, copy.referral.inviterBonus(
              result.inviterBonus,
              referrerStatus.photoSlidesBalance
            ), { parse_mode: 'Markdown' });
          } catch (e) {
            console.log(`⚠️ Не удалось уведомить реферера ${referrerId}`);
          }
        }
      }
    }

    // Получаем статус пользователя
    const status = db.getUserStatus(userId);

    // Показываем главное меню
    const welcomeText = status
      ? copy.start.welcome(status)
      : copy.start.welcomeNew;

    await bot.sendMessage(chatId, welcomeText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: copy.start.buttons.create, callback_data: 'menu_create' }],
          [
            { text: copy.start.buttons.buy, callback_data: 'menu_buy' },
            { text: copy.start.buttons.account, callback_data: 'menu_account' }
          ],
          [
            { text: copy.start.buttons.demo, callback_data: 'demo_carousel' },
            { text: copy.start.buttons.howItWorks, callback_data: 'how_it_works' }
          ],
          [{ text: copy.start.buttons.referral, callback_data: 'menu_referral' }],
          [{ text: copy.start.buttons.legal, callback_data: 'menu_legal' }]
        ]
      }
    });

  } catch (error) {
    console.error('Ошибка /start:', error);
    await bot.sendMessage(chatId, copy.errors.generation);
  }
});

/**
 * Обработка возврата из платёжной системы
 */
async function handlePaymentReturn(chatId, userId, paymentId) {
  try {
    await bot.sendMessage(chatId, '⏳ Проверяю статус платежа...');

    // Получаем статус из ЮКассы
    const paymentStatus = await yookassa.getPaymentStatus(paymentId);

    if (!paymentStatus.success) {
      await bot.sendMessage(chatId, '❌ Не удалось проверить платёж. Попробуй позже или напиши в поддержку.');
      return;
    }

    if (paymentStatus.status === 'succeeded') {
      // Обрабатываем успешный платёж
      const result = db.processSuccessfulPayment(paymentId);

      if (result) {
        const status = db.getUserStatus(userId);

        if (result.product_type.startsWith('pro_')) {
          // PRO подписка
          const expiresAt = new Date(status.subscriptionExpiresAt).toLocaleDateString('ru-RU');
          await bot.sendMessage(chatId, copy.pricing.success.pro(expiresAt), {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '✨ Создать карусель', callback_data: 'menu_create' }],
                [{ text: '← Главное меню', callback_data: 'menu_main' }]
              ]
            }
          });
        } else if (result.product_type === 'topup_slides') {
          // Докупка слайдов поштучно
          await bot.sendMessage(chatId,
            copy.pricing.success.slidesTopUp(result.product_data.slides, status.photoSlidesBalance),
            {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '📸 Продолжить Photo Mode', callback_data: 'mode_photo' }],
                  [{ text: '← Главное меню', callback_data: 'menu_main' }]
                ]
              }
            }
          );
        } else {
          // Пакет слайдов
          await bot.sendMessage(chatId,
            copy.pricing.success.slides(result.product_data.slides, status.photoSlidesBalance),
            {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '✨ Создать карусель', callback_data: 'menu_create' }],
                  [{ text: '← Главное меню', callback_data: 'menu_main' }]
                ]
              }
            }
          );
        }
      }
    } else if (paymentStatus.status === 'canceled') {
      await bot.sendMessage(chatId, copy.pricing.cancelled, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Попробовать снова', callback_data: 'menu_buy' }],
            [{ text: '← Главное меню', callback_data: 'menu_main' }]
          ]
        }
      });
    } else {
      // pending - ещё в процессе
      await bot.sendMessage(chatId,
        '⏳ Платёж ещё обрабатывается. Подожди немного и нажми кнопку проверки.',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔄 Проверить статус', callback_data: `check_payment_${paymentId}` }],
              [{ text: '← Главное меню', callback_data: 'menu_main' }]
            ]
          }
        }
      );
    }

  } catch (error) {
    console.error('❌ Ошибка обработки возврата платежа:', error);
    await bot.sendMessage(chatId, '❌ Произошла ошибка. Попробуй позже или напиши в поддержку.');
  }
}

// ============================================
// КОМАНДА /account - статус аккаунта и баланс
// ============================================
bot.onText(/\/(account|status|balance)/, async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  try {
    const status = db.getUserStatus(userId);

    if (!status) {
      return bot.sendMessage(chatId, 'Сначала отправь /start');
    }

    // Форматируем дату истечения подписки
    let expiresFormatted = '';
    if (status.subscriptionExpiresAt) {
      expiresFormatted = new Date(status.subscriptionExpiresAt).toLocaleDateString('ru-RU');
    }

    const statusText = copy.pricing.status({
      ...status,
      expiresFormatted
    });

    await bot.sendMessage(chatId, statusText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: copy.pricing.buttons.viewPacks, callback_data: 'view_packs' }],
          [{ text: copy.pricing.buttons.viewPro, callback_data: 'view_pro' }],
          [{ text: '📝 Создать карусель', callback_data: 'create_now' }]
        ]
      }
    });

  } catch (error) {
    console.error('Ошибка /account:', error);
    await bot.sendMessage(chatId, copy.errors.generation);
  }
});

// ============================================
// КОМАНДА /buy - страница оплаты
// ============================================
bot.onText(/\/buy/, async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  try {
    await bot.sendMessage(chatId, copy.pricing.slidePacks, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: copy.pricing.buttons.buySlides(15, 490), callback_data: 'buy_pack_small' }],
          [{ text: copy.pricing.buttons.buySlides(50, 1490), callback_data: 'buy_pack_medium' }],
          [{ text: copy.pricing.buttons.buySlides(150, 3990), callback_data: 'buy_pack_large' }],
          [{ text: '───────────────', callback_data: 'noop' }],
          [{ text: copy.pricing.buttons.viewPro, callback_data: 'view_pro' }]
        ]
      }
    });

  } catch (error) {
    console.error('Ошибка /buy:', error);
    await bot.sendMessage(chatId, copy.errors.generation);
  }
});

// ============================================
// КОМАНДА /USERNAME - настройка отображаемого юзернейма
// ============================================
bot.onText(/\/username/, async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  try {
    // Получаем текущий юзернейм
    const currentUsername = await getDisplayUsername(userId);

    let text = copy.username.prompt;
    if (currentUsername) {
      text = copy.username.currentUsername(currentUsername) + '\n\n' + text;
    } else {
      text = copy.username.noUsername + '\n\n' + text;
    }

    // Устанавливаем флаг ожидания юзернейма
    sessions[userId] = { ...sessions[userId], awaitingUsername: true };

    await bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: copy.username.buttons.clear, callback_data: 'clear_username' }],
          [{ text: copy.username.buttons.cancel, callback_data: 'cancel_username' }]
        ]
      }
    });

  } catch (error) {
    console.error('Ошибка /username:', error);
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
    const format = session.format || 'portrait';
    const styleName = STYLE_PROMPTS[imageStyle]?.name || imageStyle;

    // Получаем юзернейм пользователя
    const username = await getDisplayUsername(userId);

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
      imageStyle,
      format
    );

    // 3. Рендеринг слайдов с текстом поверх изображений
    await bot.sendMessage(chatId, copy.photoMode.progress.composingSlides);
    const finalImages = await renderSlidesWithImages(carouselData, images, { format, username });

    // 4. Отправка карусели
    const mediaGroup = finalImages.map((imgPath, idx) => ({
      type: 'photo',
      media: imgPath,
      caption: idx === 0 ? `✨ AI-карусель в стиле "${styleName}"` : undefined
    }));

    await bot.sendMediaGroup(chatId, mediaGroup);

    // 5. Списываем Photo слайды
    db.deductPhotoSlides(userId, slideCount);

    // 6. Логирование
    logGeneration(userId, `photo_${imageStyle}`, slideCount);
    console.log(`📊 Сохраняю AI-генерацию для пользователя ${userId}...`);
    await saveCarouselGeneration(
      userId,
      session.transcription,
      `photo_${imageStyle}`,
      slideCount,
      { mode: 'photo', imageStyle: imageStyle }
    );

    // 7. Результат
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

    // Проверяем, ожидаем ли ввод юзернейма
    if (sessions[userId]?.awaitingUsername) {
      // Очищаем @, пробелы, и лишние символы
      let username = text.trim();
      if (username.startsWith('@')) {
        username = username.substring(1);
      }
      username = '@' + username.replace(/[^a-zA-Z0-9_а-яА-ЯёЁ]/g, '');

      // Сохраняем юзернейм
      await saveDisplayUsername(userId, username);
      delete sessions[userId].awaitingUsername;

      await bot.sendMessage(chatId, copy.username.saved(username), {
        parse_mode: 'Markdown'
      });
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

  // Убеждаемся что пользователь существует в локальной БД
  db.createUser(userId, query.from.username || query.from.first_name);

  try {
    // ==================== PRICING & PAYMENT CALLBACKS ====================

    // Просмотр пакетов слайдов
    if (data === 'view_packs') {
      await bot.editMessageText(copy.pricing.slidePacks, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: copy.pricing.buttons.buySlides(15, 490), callback_data: 'buy_pack_small' }],
            [{ text: copy.pricing.buttons.buySlides(50, 1490), callback_data: 'buy_pack_medium' }],
            [{ text: copy.pricing.buttons.buySlides(150, 3990), callback_data: 'buy_pack_large' }],
            [{ text: '───────────────', callback_data: 'noop' }],
            [{ text: copy.pricing.buttons.viewPro, callback_data: 'view_pro' }],
            [{ text: '← Назад', callback_data: 'menu_buy' }]
          ]
        }
      });
      return;
    }

    // Просмотр PRO подписки
    if (data === 'view_pro') {
      await bot.editMessageText(copy.pricing.proSubscription, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: copy.pricing.buttons.buyPro, callback_data: 'buy_pro_month' }],
            [{ text: copy.pricing.buttons.buyProYear, callback_data: 'buy_pro_year' }],
            [{ text: '← Назад', callback_data: 'menu_buy' }]
          ]
        }
      });
      return;
    }

    // Назад к статусу (личный кабинет)
    if (data === 'back_to_status') {
      const status = db.getUserStatus(userId);
      let expiresFormatted = '';
      if (status?.subscriptionExpiresAt) {
        expiresFormatted = new Date(status.subscriptionExpiresAt).toLocaleDateString('ru-RU');
      }

      await bot.editMessageText(copy.pricing.account({ ...status, expiresFormatted }), {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '✨ Создать карусель', callback_data: 'menu_create' }],
            [{ text: '💳 Пополнить баланс', callback_data: 'menu_buy' }],
            [{ text: '← Главное меню', callback_data: 'menu_main' }]
          ]
        }
      });
      return;
    }

    // Покупка пакета слайдов
    if (data.startsWith('buy_pack_')) {
      const packId = data.replace('buy_pack_', '');
      const pack = pricing.slidePacks[packId];

      if (!pack) {
        return bot.sendMessage(chatId, '❌ Пакет не найден');
      }

      // Создаём платёж в ЮКассе
      await bot.editMessageText('⏳ Создаю ссылку на оплату...', {
        chat_id: chatId,
        message_id: messageId
      });

      const botInfo = await bot.getMe();
      const returnUrl = yookassa.getTelegramReturnUrl(botInfo.username, 'PAYMENT_ID');

      const payment = await yookassa.createPayment({
        amount: pack.price,
        description: `Swipely: ${pack.name}`,
        metadata: {
          user_id: userId,
          product_type: packId,
          slides: pack.slides
        },
        returnUrl: returnUrl.replace('PAYMENT_ID', '') // Заменим после создания
      });

      if (!payment.success) {
        await bot.editMessageText(
          `❌ Ошибка создания платежа: ${payment.error}\n\nПопробуй позже.`,
          { chat_id: chatId, message_id: messageId }
        );
        return;
      }

      // Сохраняем платёж в БД
      db.createPayment(payment.paymentId, userId, pack.price, packId, { slides: pack.slides });

      // Обновляем return URL с реальным ID платежа
      const realReturnUrl = yookassa.getTelegramReturnUrl(botInfo.username, payment.paymentId);

      await bot.editMessageText(
        `💳 **Оплата пакета "${pack.name}"**\n\n` +
        `📦 Слайдов: ${pack.slides}\n` +
        `💰 Сумма: ${pricing.formatPrice(pack.price)}\n\n` +
        `👇 Нажми кнопку для перехода к оплате:`,
        {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: `💳 Оплатить ${pack.price}₽`, url: payment.confirmationUrl }],
              [{ text: '🔄 Я оплатил, проверить', callback_data: `check_payment_${payment.paymentId}` }],
              [{ text: '← Назад', callback_data: 'menu_buy' }]
            ]
          }
        }
      );
      return;
    }

    // Проверка статуса платежа
    if (data.startsWith('check_payment_')) {
      const paymentId = data.replace('check_payment_', '');
      await handlePaymentReturn(chatId, userId, paymentId);
      return;
    }

    // Покупка PRO подписки
    if (data === 'buy_pro_month' || data === 'buy_pro_year') {
      const months = data === 'buy_pro_year' ? 12 : 1;
      const price = data === 'buy_pro_year' ? 9900 : 990;
      const productType = data === 'buy_pro_year' ? 'pro_year' : 'pro_month';

      // Создаём платёж в ЮКассе
      await bot.editMessageText('⏳ Создаю ссылку на оплату...', {
        chat_id: chatId,
        message_id: messageId
      });

      const botInfo = await bot.getMe();

      const payment = await yookassa.createPayment({
        amount: price,
        description: `Swipely PRO на ${months === 12 ? 'год' : 'месяц'}`,
        metadata: {
          user_id: userId,
          product_type: productType,
          months: months
        },
        returnUrl: 'https://t.me/' + botInfo.username // Временный URL
      });

      if (!payment.success) {
        await bot.editMessageText(
          `❌ Ошибка создания платежа: ${payment.error}\n\nПопробуй позже.`,
          { chat_id: chatId, message_id: messageId }
        );
        return;
      }

      // Сохраняем платёж в БД
      db.createPayment(payment.paymentId, userId, price, productType, { months });

      await bot.editMessageText(
        `💳 **PRO-подписка на ${months === 12 ? 'год' : 'месяц'}**\n\n` +
        `✨ Безлимит Standard каруселей\n` +
        `🎨 Скидка 20% на Photo Mode\n` +
        `💰 Сумма: ${pricing.formatPrice(price)}\n\n` +
        `👇 Нажми кнопку для перехода к оплате:`,
        {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: `💳 Оплатить ${price}₽`, url: payment.confirmationUrl }],
              [{ text: '🔄 Я оплатил, проверить', callback_data: `check_payment_${payment.paymentId}` }],
              [{ text: '← Назад', callback_data: 'view_pro' }]
            ]
          }
        }
      );
      return;
    }

    // Оплата Photo Mode перед генерацией
    if (data.startsWith('pay_photo_')) {
      const slideCount = parseInt(data.replace('pay_photo_', ''));
      const tier = db.getActiveSubscription(userId);
      const price = pricing.getPhotoModePrice(slideCount, tier);

      // Создаём платёж в ЮКассе
      await bot.sendMessage(chatId, '⏳ Создаю ссылку на оплату...');

      const botInfo = await bot.getMe();

      const payment = await yookassa.createPayment({
        amount: price,
        description: `Swipely: AI-карусель ${slideCount} слайдов`,
        metadata: {
          user_id: userId,
          product_type: 'photo_slides',
          slides: slideCount
        },
        returnUrl: yookassa.getTelegramReturnUrl(botInfo.username, 'temp')
      });

      if (!payment.success) {
        await bot.sendMessage(chatId, `❌ Ошибка создания платежа: ${payment.error}\n\nПопробуй позже.`);
        return;
      }

      // Сохраняем платёж в БД
      db.createPayment(payment.paymentId, userId, price, 'photo_slides', { slides: slideCount });

      await bot.sendMessage(chatId,
        `💳 **AI-карусель: ${slideCount} слайдов**\n\n` +
        `💰 Сумма: ${pricing.formatPrice(price)}${tier === 'pro' ? ' (PRO скидка -20%)' : ''}\n\n` +
        `👇 Нажми кнопку для оплаты:`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: `💳 Оплатить ${price}₽`, url: payment.confirmationUrl }],
              [{ text: '🔄 Я оплатил, проверить', callback_data: `check_payment_${payment.paymentId}` }],
              [{ text: '← Назад', callback_data: 'menu_create' }]
            ]
          }
        }
      );
      return;
    }

    // Покупка недостающих слайдов поштучно
    if (data.startsWith('topup_')) {
      const slidesToBuy = parseInt(data.replace('topup_', ''));
      const tier = db.getActiveSubscription(userId);
      const pricePerSlide = pricing.getPerSlidePrice(tier);
      const totalPrice = slidesToBuy * pricePerSlide;

      // Создаём платёж в ЮКассе
      await bot.sendMessage(chatId, '⏳ Создаю ссылку на оплату...');

      const botInfo = await bot.getMe();

      const payment = await yookassa.createPayment({
        amount: totalPrice,
        description: `Swipely: ${slidesToBuy} слайдов`,
        metadata: {
          user_id: userId,
          product_type: 'topup_slides',
          slides: slidesToBuy
        },
        returnUrl: yookassa.getTelegramReturnUrl(botInfo.username, 'temp')
      });

      if (!payment.success) {
        await bot.sendMessage(chatId, `❌ Ошибка создания платежа: ${payment.error}\n\nПопробуй позже.`);
        return;
      }

      // Сохраняем платёж в БД
      db.createPayment(payment.paymentId, userId, totalPrice, 'topup_slides', { slides: slidesToBuy });

      await bot.sendMessage(chatId,
        `💳 **Докупка слайдов**\n\n` +
        `📦 Слайдов: ${slidesToBuy} шт.\n` +
        `💰 Цена: ${pricePerSlide}₽/шт.\n` +
        `💵 Итого: ${pricing.formatPrice(totalPrice)}${tier === 'pro' ? ' (PRO цена)' : ''}\n\n` +
        `👇 Нажми кнопку для оплаты:`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: `💳 Оплатить ${totalPrice}₽`, url: payment.confirmationUrl }],
              [{ text: '🔄 Я оплатил, проверить', callback_data: `check_payment_${payment.paymentId}` }],
              [{ text: '← Назад', callback_data: 'menu_create' }]
            ]
          }
        }
      );
      return;
    }

    // noop для разделителей
    if (data === 'noop') {
      return;
    }

    // ==================== MAIN MENU CALLBACKS ====================

    // Создать карусель
    if (data === 'menu_create') {
      await bot.editMessageText(
        copy.mainFlow.requestInput,
        {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [
              [{ text: '← Главное меню', callback_data: 'menu_main' }]
            ]
          }
        }
      );
      return;
    }

    // Пополнить баланс
    if (data === 'menu_buy') {
      await bot.editMessageText(
        copy.pricing.slidePacks,
        {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: copy.pricing.buttons.buySlides(15, 490), callback_data: 'buy_pack_small' }],
              [{ text: copy.pricing.buttons.buySlides(50, 1490), callback_data: 'buy_pack_medium' }],
              [{ text: copy.pricing.buttons.buySlides(150, 3990), callback_data: 'buy_pack_large' }],
              [{ text: '───────────────', callback_data: 'noop' }],
              [{ text: copy.pricing.buttons.viewPro, callback_data: 'view_pro' }],
              [{ text: '← Главное меню', callback_data: 'menu_main' }]
            ]
          }
        }
      );
      return;
    }

    // Личный кабинет
    if (data === 'menu_account') {
      const status = db.getUserStatus(userId);

      if (!status) {
        return bot.sendMessage(chatId, 'Сначала отправь /start');
      }

      let expiresFormatted = '';
      if (status.subscriptionExpiresAt) {
        expiresFormatted = new Date(status.subscriptionExpiresAt).toLocaleDateString('ru-RU');
      }

      await bot.editMessageText(
        copy.pricing.account({ ...status, expiresFormatted }),
        {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '✨ Создать карусель', callback_data: 'menu_create' }],
              [{ text: '💳 Пополнить баланс', callback_data: 'menu_buy' }],
              [{ text: '← Главное меню', callback_data: 'menu_main' }]
            ]
          }
        }
      );
      return;
    }

    // Главное меню (возврат)
    if (data === 'menu_main') {
      const status = db.getUserStatus(userId);

      const welcomeText = status
        ? copy.start.welcome(status)
        : copy.start.welcomeNew;

      await bot.editMessageText(
        welcomeText,
        {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: copy.start.buttons.create, callback_data: 'menu_create' }],
              [
                { text: copy.start.buttons.buy, callback_data: 'menu_buy' },
                { text: copy.start.buttons.account, callback_data: 'menu_account' }
              ],
              [
                { text: copy.start.buttons.demo, callback_data: 'demo_carousel' },
                { text: copy.start.buttons.howItWorks, callback_data: 'how_it_works' }
              ],
              [{ text: copy.start.buttons.referral, callback_data: 'menu_referral' }],
              [{ text: copy.start.buttons.legal, callback_data: 'menu_legal' }]
            ]
          }
        }
      );
      return;
    }

    // ==================== REFERRAL PROGRAM ====================
    if (data === 'menu_referral') {
      const stats = db.getReferralStats(userId) || { referralCount: 0, totalEarned: 0 };
      const botInfo = await bot.getMe();
      const referralLink = `https://t.me/${botInfo.username}?start=ref_${userId}`;

      await bot.editMessageText(
        copy.referral.menu(stats, referralLink),
        {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: copy.referral.buttons.back, callback_data: 'menu_main' }]
            ]
          }
        }
      );
      return;
    }

    // ==================== USERNAME CALLBACKS ====================
    if (data === 'clear_username') {
      await saveDisplayUsername(userId, null);
      delete sessions[userId]?.awaitingUsername;

      await bot.editMessageText(
        copy.username.cleared,
        {
          chat_id: chatId,
          message_id: messageId
        }
      );
      return;
    }

    if (data === 'cancel_username') {
      delete sessions[userId]?.awaitingUsername;

      await bot.deleteMessage(chatId, messageId);
      return;
    }

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

    // ==================== LEGAL DOCUMENTS ====================
    if (data === 'menu_legal') {
      await bot.editMessageText(
        copy.legal.menu,
        {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: copy.legal.buttons.privacy, callback_data: 'legal_privacy' }],
              [{ text: copy.legal.buttons.offer, callback_data: 'legal_offer' }],
              [{ text: copy.legal.buttons.back, callback_data: 'menu_main' }]
            ]
          }
        }
      );
      return;
    }

    // Отправка политики конфиденциальности
    if (data === 'legal_privacy') {
      const docsPath = path.join(__dirname, '..', 'docs');
      const possibleFiles = [
        path.join(docsPath, 'personal policy.pdf'),
        path.join(docsPath, 'privacy_policy.pdf'),
        path.join(docsPath, 'privacy_policy.txt')
      ];

      let filePath = null;
      for (const p of possibleFiles) {
        if (fs.existsSync(p)) {
          filePath = p;
          break;
        }
      }

      if (filePath) {
        await bot.sendDocument(chatId, filePath, {
          caption: '🔒 Политика конфиденциальности Swipely'
        });
      } else {
        await bot.sendMessage(chatId, copy.legal.notFound);
      }
      return;
    }

    // Отправка оферты
    if (data === 'legal_offer') {
      const docsPath = path.join(__dirname, '..', 'docs');
      const possibleFiles = [
        path.join(docsPath, 'privacy policy.pdf'),
        path.join(docsPath, 'public_offer.pdf'),
        path.join(docsPath, 'offer.pdf')
      ];

      let filePath = null;
      for (const p of possibleFiles) {
        if (fs.existsSync(p)) {
          filePath = p;
          break;
        }
      }

      if (filePath) {
        await bot.sendDocument(chatId, filePath, {
          caption: '📄 Публичная оферта Swipely'
        });
      } else {
        await bot.sendMessage(chatId, copy.legal.notFound);
      }
      return;
    }

    // ==================== VIEW STYLES ====================
    if (data === 'view_styles') {
      // Отправляем превью стилей альбомом
      try {
        const previews = await getPreviewPaths();

        const mediaGroup = previews.map((preview, idx) => ({
          type: 'photo',
          media: preview.path,
          caption: idx === 0 ? '🎨 Доступные стили карусели' : undefined
        }));

        await bot.sendMediaGroup(chatId, mediaGroup);
      } catch (err) {
        console.error('⚠️ Не удалось отправить превью стилей:', err.message);
      }

      await bot.sendMessage(chatId, 'Выбери стиль для просмотра примера:', {
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
            [{ text: '💎 Luxe', callback_data: 'view_style_luxe' }],
            [{ text: '🔲 Backspace', callback_data: 'view_style_backspace' }]
          ]
        }
      });
      return;
    }

    // ==================== CREATE NOW ====================
    if (data === 'create_now') {
      await bot.sendMessage(chatId, copy.mainFlow.requestInput, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '← Главное меню', callback_data: 'menu_main' }]
          ]
        }
      });
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

      // Показываем выбор формата изображения
      await bot.editMessageText(
        copy.mainFlow.selectFormat,
        {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [
              [{ text: copy.mainFlow.formatButtons.square, callback_data: 'format_square' }],
              [{ text: copy.mainFlow.formatButtons.portrait, callback_data: 'format_portrait' }]
            ]
          }
        }
      );
      return;
    }

    // ==================== ВЫБОР ФОРМАТА ИЗОБРАЖЕНИЯ ====================
    if (data.startsWith('format_')) {
      const format = data.replace('format_', '');

      // Сохраняем формат в сессию
      if (sessions[userId]) {
        sessions[userId].format = format;
      } else {
        sessions[userId] = { format };
      }

      const slideCount = sessions[userId]?.slideCount || 5;

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
      // Проверяем лимит Standard генераций
      const standardCheck = db.canGenerateStandard(userId);

      if (!standardCheck.canGenerate) {
        await bot.editMessageText(
          copy.pricing.standardLimitReached,
          {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: copy.pricing.buttons.viewPro, callback_data: 'view_pro' }],
                [{ text: '📸 Photo Mode (платно)', callback_data: 'mode_photo' }]
              ]
            }
          }
        );
        return;
      }

      if (sessions[userId]) {
        sessions[userId].generationMode = 'standard';
      }

      // Удаляем предыдущее сообщение с выбором режима
      try {
        await bot.deleteMessage(chatId, messageId);
      } catch (err) {
        // Игнорируем ошибку если сообщение уже удалено
      }

      // Отправляем превью стилей альбомом
      try {
        const previews = await getPreviewPaths();

        const mediaGroup = previews.map((preview, idx) => ({
          type: 'photo',
          media: preview.path,
          caption: idx === 0 ? '👆 Превью всех стилей' : undefined
        }));

        await bot.sendMediaGroup(chatId, mediaGroup);
      } catch (err) {
        console.error('⚠️ Не удалось отправить превью стилей:', err.message);
      }

      // Отправляем сообщение с кнопками выбора стиля
      await bot.sendMessage(
        chatId,
        copy.mainFlow.selectStyle,
        {
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
              [{ text: '💎 Luxe', callback_data: 'style_luxe' }],
              [{ text: '🔲 Backspace', callback_data: 'style_backspace' }]
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

      const slideCount = sessions[userId]?.slideCount || 5;

      // Проверяем баланс Photo Mode слайдов
      const photoCheck = db.canGeneratePhoto(userId, slideCount);

      if (!photoCheck.canGenerate) {
        // Нужна оплата
        const tier = db.getActiveSubscription(userId);
        const balance = photoCheck.balance || 0;

        // Если есть частичный баланс - предлагаем докупить недостающие
        if (balance > 0) {
          const topUp = pricing.calculateTopUp(slideCount, balance, tier);

          await bot.editMessageText(
            copy.pricing.photoTopUp({
              slideCount,
              balance,
              slidesToBuy: topUp.slidesToBuy,
              pricePerSlide: topUp.pricePerSlide,
              topUpPrice: topUp.totalPrice,
              tier
            }),
            {
              chat_id: chatId,
              message_id: messageId,
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: copy.pricing.buttons.buyPerSlide(topUp.slidesToBuy, topUp.totalPrice), callback_data: `topup_${topUp.slidesToBuy}` }],
                  [{ text: copy.pricing.buttons.viewPacks, callback_data: 'view_packs' }],
                  [{ text: '🎨 Standard (бесплатно)', callback_data: 'mode_standard' }]
                ]
              }
            }
          );
          return;
        }

        // Баланс = 0, показываем полную стоимость
        const price = pricing.getPhotoModePrice(slideCount, tier);

        await bot.editMessageText(
          copy.pricing.photoNeedPayment({
            slideCount,
            price,
            balance: 0,
            tier
          }),
          {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: copy.pricing.buttons.payOnce(price), callback_data: `pay_photo_${slideCount}` }],
                [{ text: copy.pricing.buttons.viewPacks, callback_data: 'view_packs' }],
                [{ text: '🎨 Standard (бесплатно)', callback_data: 'mode_standard' }]
              ]
            }
          }
        );
        return;
      }

      // Баланс есть, продолжаем
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
        'luxe': 'Luxe',
        'backspace': 'Backspace'
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
      const format = sessions[userId]?.format || 'portrait';

      if (!userText) {
        return bot.sendMessage(chatId, '❌ Текст не найден. Начни сначала с /start');
      }

      // Получаем юзернейм пользователя
      const username = await getDisplayUsername(userId);

      // Генерация контента через Gemini
      await bot.sendMessage(chatId, copy.mainFlow.progress.analyzing);
      const carouselData = await generateCarouselContent(userText, styleKey, slideCount, null);

      // Рендеринг слайдов
      await bot.sendMessage(chatId, copy.mainFlow.progress.rendering);
      const images = await renderSlides(carouselData, styleKey, { format, username });

      // Отправка карусели
      const mediaGroup = images.map((imgPath, idx) => ({
        type: 'photo',
        media: imgPath,
        caption: idx === 0 ? `✨ Твоя карусель в стиле ${styleNames[styleKey]}` : undefined
      }));

      await bot.sendMediaGroup(chatId, mediaGroup);

      // Списываем лимит Standard
      db.deductStandard(userId);

      // Логируем генерацию
      logGeneration(userId, styleKey, slideCount);
      console.log(`📊 Сохраняю генерацию карусели для пользователя ${userId}...`);
      await saveCarouselGeneration(userId, userText, styleKey, slideCount, null);

      // Создаем сессию редактирования
      const editSession = await createEditSession(userId, carouselData, styleKey, format, username);

      // Результат с кнопками действий
      const resultButtons = [
        [{ text: copy.mainFlow.resultButtons.createNew, callback_data: 'create_now' }]
      ];

      // Добавляем кнопку редактирования, если сессия создана
      if (editSession && editSession.editUrl) {
        resultButtons.unshift([{ text: copy.mainFlow.resultButtons.editText, url: editSession.editUrl }]);
      }

      await bot.sendMessage(chatId, copy.mainFlow.result, {
        reply_markup: {
          inline_keyboard: resultButtons
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
