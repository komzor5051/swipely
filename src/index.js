require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const db = require('./services/database');
const { transcribeVoice } = require('./services/whisper');
const { generateCarouselContent } = require('./services/gemini');
const { renderSlides, renderSlidesWithImages } = require('./services/renderer');
const { downloadTelegramPhoto, generateCarouselImages, STYLE_PROMPTS } = require('./services/imageGenerator');
const {
  supabase,
  upsertUser,
  saveCarouselGeneration,
  saveDisplayUsername,
  getDisplayUsername,
  savePayment,
  updatePaymentStatus,
  getPaymentsStats,
  getRecentPayments,
  getTotalPaymentsStats
} = require('./services/supabaseService');
const { logUser, logGeneration } = require('./services/userLogger');
const { getPreviewPaths, STYLE_INFO } = require('./services/previewService');
const { createEditSession } = require('./services/editorService');
const copy = require('./utils/copy');
const demoCarousel = require('./data/demoCarousel');
const pricing = require('./config/pricing');
const yookassa = require('./services/yookassa');

// Инициализация бота
// ВАЖНО: allowed_updates включает pre_checkout_query для работы Stars платежей!
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: {
    params: {
      allowed_updates: ['message', 'callback_query', 'pre_checkout_query', 'shipping_query']
    }
  }
});

// Simple in-memory session storage
const sessions = {};

// Инициализация базы данных (async)
(async () => {
  await db.init();
})();

console.log('🤖 Swipely Bot запускается...');

// ============================================
// TELEGRAM STARS PAYMENTS
// ============================================

// Подтверждение pre_checkout_query (обязательно для Stars!)
bot.on('pre_checkout_query', async (query) => {
  try {
    await bot.answerPreCheckoutQuery(query.id, true);
    console.log(`⭐ Pre-checkout approved for user ${query.from.id}`);
  } catch (err) {
    console.error('❌ Pre-checkout error:', err.message);
    try {
      await bot.answerPreCheckoutQuery(query.id, false, { error_message: 'Ошибка обработки платежа' });
    } catch (e) {
      // Игнорируем ошибки повторного ответа
    }
  }
});

// Обработка успешного платежа Stars
bot.on('successful_payment', async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const payment = msg.successful_payment;

  try {
    const payload = JSON.parse(payment.invoice_payload);
    const { product_type, slides, months } = payload;

    // Генерируем уникальный ID для БД
    const paymentId = `stars_${Date.now()}_${userId}`;

    // Создаём запись в локальной БД
    await db.createPayment(
      paymentId,
      userId,
      payment.total_amount,
      product_type,
      { slides, months, telegram_charge_id: payment.telegram_payment_charge_id },
      'telegram_stars'
    );

    // Обрабатываем платёж (начисляем слайды/PRO)
    await db.processSuccessfulPayment(paymentId);

    // Сохраняем платёж в Supabase
    await savePayment({
      payment_id: paymentId,
      telegram_id: userId,
      amount: payment.total_amount,
      currency: 'XTR',
      product_type: product_type,
      product_data: { slides, months, telegram_charge_id: payment.telegram_payment_charge_id },
      payment_method: 'telegram_stars',
      status: 'succeeded'
    });

    // Получаем обновлённый статус
    const status = await db.getUserStatus(userId);

    // Уведомляем пользователя
    if (product_type === 'photo_slides' || product_type === 'topup_slides') {
      // Проверяем, есть ли активная сессия с текстом
      const session = sessions[userId];
      if (session && session.transcription) {
        // Есть сессия — предлагаем продолжить генерацию
        await bot.sendMessage(chatId,
          copy.pricing.stars.successSlides(slides, status.photoSlidesBalance) +
          '\n\n📸 Выбери стиль изображения:',
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: copy.photoMode.styleSelection.buttons.cartoon, callback_data: 'imgstyle_cartoon' }],
                [{ text: copy.photoMode.styleSelection.buttons.realistic, callback_data: 'imgstyle_realistic' }]
              ]
            }
          }
        );
      } else {
        // Нет сессии — стандартное сообщение
        await bot.sendMessage(chatId, copy.pricing.stars.successSlides(slides, status.photoSlidesBalance), {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '✨ Создать карусель', callback_data: 'menu_create' }],
              [{ text: '← Главное меню', callback_data: 'menu_main' }]
            ]
          }
        });
      }
    } else if (product_type.startsWith('pack_')) {
      // Пакет слайдов — стандартное сообщение
      await bot.sendMessage(chatId, copy.pricing.stars.successSlides(slides, status.photoSlidesBalance), {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '✨ Создать карусель', callback_data: 'menu_create' }],
            [{ text: '← Главное меню', callback_data: 'menu_main' }]
          ]
        }
      });
    } else if (product_type === 'pro_month' || product_type === 'pro_year') {
      const expiresAt = new Date(status.subscriptionExpiresAt).toLocaleDateString('ru-RU');
      await bot.sendMessage(chatId, copy.pricing.stars.successPro(expiresAt), {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '✨ Создать карусель', callback_data: 'menu_create' }],
            [{ text: '← Главное меню', callback_data: 'menu_main' }]
          ]
        }
      });
    }

    console.log(`⭐ Stars payment SUCCESS: user=${userId}, type=${product_type}, amount=${payment.total_amount}⭐`);

  } catch (err) {
    console.error('❌ Stars payment processing error:', err);
    await bot.sendMessage(chatId, '❌ Ошибка обработки платежа. Напиши в поддержку.');
  }
});

/**
 * Отправка invoice для оплаты Stars
 * @param {number} chatId - ID чата
 * @param {number} userId - ID пользователя
 * @param {string} productType - тип продукта
 * @param {string} title - заголовок
 * @param {string} description - описание
 * @param {number} starsAmount - сумма в Stars
 * @param {object} productData - данные продукта (slides, months)
 */
async function sendStarsInvoice(chatId, userId, productType, title, description, starsAmount, productData) {
  const payload = JSON.stringify({
    product_type: productType,
    user_id: userId,
    ...productData
  });

  await bot.sendInvoice(
    chatId,
    title,
    description,
    payload,
    '',           // provider_token (пустая строка для Stars!)
    'XTR',        // currency = Telegram Stars
    [{ label: title, amount: starsAmount }],
    {
      need_name: false,
      need_phone_number: false,
      need_email: false,
      need_shipping_address: false,
      is_flexible: false
    }
  );
}

// ============================================
// КОМАНДА /START и /MENU - Главное меню
// ============================================
bot.onText(/\/(start|menu)(.*)/, async (msg, match) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const param = match[2]?.trim(); // Параметр после /start (например, payment_xxx)

  try {
    // Регистрируем пользователя в локальной БД
    await db.createUser(userId, msg.from.username || msg.from.first_name);

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
      if (referrerId && referrerId !== userId && await db.isNewUser(userId)) {
        const result = await db.processReferral(userId, referrerId);
        if (result) {
          // Уведомляем приглашённого
          await bot.sendMessage(chatId, copy.referral.invitedBonus(result.invitedBonus), {
            parse_mode: 'Markdown'
          });

          // Уведомляем пригласившего
          try {
            const referrerStatus = await db.getUserStatus(referrerId);
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
    const status = await db.getUserStatus(userId);

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
      const result = await db.processSuccessfulPayment(paymentId);

      if (!result) {
        // Платёж не найден в локальной БД (возможно бот перезапустился)
        console.error(`❌ Платёж ${paymentId} не найден в локальной БД при проверке статуса`);
        await bot.sendMessage(chatId,
          '⚠️ Платёж прошёл, но произошла техническая ошибка.\n\n' +
          'Напиши в поддержку с ID платежа:\n' +
          `\`${paymentId}\``,
          { parse_mode: 'Markdown' }
        );
        return;
      }

      const status = await db.getUserStatus(userId);

      // Обновляем статус платежа в Supabase (pending → succeeded)
      await updatePaymentStatus(paymentId, 'succeeded');

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
        } else if (result.product_type === 'topup_slides' || result.product_type === 'photo_slides') {
          // Докупка слайдов или покупка Photo Mode
          const session = sessions[userId];
          const successText = result.product_type === 'topup_slides'
            ? copy.pricing.success.slidesTopUp(result.product_data.slides, status.photoSlidesBalance)
            : copy.pricing.success.slides(result.product_data.slides, status.photoSlidesBalance);

          if (session && session.transcription) {
            // Есть сессия — предлагаем выбор стиля
            await bot.sendMessage(chatId,
              successText + '\n\n📸 Выбери стиль изображения:',
              {
                parse_mode: 'Markdown',
                reply_markup: {
                  inline_keyboard: [
                    [{ text: copy.photoMode.styleSelection.buttons.cartoon, callback_data: 'imgstyle_cartoon' }],
                    [{ text: copy.photoMode.styleSelection.buttons.realistic, callback_data: 'imgstyle_realistic' }]
                  ]
                }
              }
            );
          } else {
            // Нет сессии
            await bot.sendMessage(chatId, successText, {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '✨ Создать карусель', callback_data: 'menu_create' }],
                  [{ text: '← Главное меню', callback_data: 'menu_main' }]
                ]
              }
            });
          }
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
    const status = await db.getUserStatus(userId);

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
// КОМАНДА /admin - админская панель
// ============================================
const ADMIN_USER_ID = parseInt(process.env.ADMIN_USER_ID) || 0;

bot.onText(/\/admin/, async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  // Проверка доступа
  if (userId !== ADMIN_USER_ID) {
    return bot.sendMessage(chatId, '⛔ Доступ запрещён');
  }

  try {
    await bot.sendMessage(chatId, '🔐 **Админ-панель**\n\nВыбери раздел:', {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '💳 Статистика оплат', callback_data: 'admin_payments' }],
          [{ text: '👥 Пользователи', callback_data: 'admin_users' }],
          [{ text: '📊 Общая статистика', callback_data: 'admin_stats' }]
        ]
      }
    });
  } catch (error) {
    console.error('Ошибка /admin:', error);
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
          [{ text: copy.pricing.buttons.buyCustom, callback_data: 'buy_custom' }],
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
    const deductResult = await db.deductPhotoSlides(userId, slideCount);
    if (!deductResult.success) {
      console.error(`⚠️ Не удалось списать слайды для ${userId}: ${deductResult.error}`);
    }

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

    // 7. Создаём сессию редактирования (для Photo Mode передаём изображения)
    const editSession = await createEditSession(userId, carouselData, 'photo_overlay', format, username, images);

    // 8. Результат с кнопками
    const resultButtons = [
      [{ text: copy.mainFlow.resultButtons.createNew, callback_data: 'create_now' }]
    ];

    // Добавляем кнопку редактирования, если сессия создана
    if (editSession && editSession.editUrl) {
      resultButtons.unshift([{ text: copy.mainFlow.resultButtons.editText, url: editSession.editUrl }]);
    }

    await bot.sendMessage(chatId, copy.photoMode.result, {
      reply_markup: {
        inline_keyboard: resultButtons
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

    // Проверяем, ожидаем ли ввод количества слайдов для кастомной покупки
    if (sessions[userId]?.awaitingCustomSlides) {
      const slideCount = parseInt(text.trim());

      // Валидация
      if (isNaN(slideCount) || slideCount < 1) {
        await bot.sendMessage(chatId, copy.pricing.customSlides.invalid);
        return;
      }

      if (slideCount > 1000) {
        await bot.sendMessage(chatId, copy.pricing.customSlides.tooMany);
        return;
      }

      // Очищаем флаг
      delete sessions[userId].awaitingCustomSlides;

      // Получаем цену
      const tier = await db.getActiveSubscription(userId);
      const pricePerSlide = pricing.getPerSlidePrice(tier);
      const totalPrice = slideCount * pricePerSlide;
      const starsPrice = pricing.getStarsPrice(totalPrice);

      // Показываем подтверждение с выбором оплаты
      await bot.sendMessage(chatId,
        copy.pricing.customSlides.confirm(slideCount, pricePerSlide, totalPrice, tier),
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: copy.pricing.stars.starsOption(starsPrice), callback_data: `stars_custom_${slideCount}` }],
              [{ text: copy.pricing.stars.rubOption(totalPrice), callback_data: `rub_custom_${slideCount}` }],
              [{ text: '← Назад', callback_data: 'view_packs' }]
            ]
          }
        }
      );
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
  await db.createUser(userId, query.from.username || query.from.first_name);

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
            [{ text: copy.pricing.buttons.buyCustom, callback_data: 'buy_custom' }],
            [{ text: '───────────────', callback_data: 'noop' }],
            [{ text: copy.pricing.buttons.viewPro, callback_data: 'view_pro' }],
            [{ text: '← Назад', callback_data: 'menu_buy' }]
          ]
        }
      });
      return;
    }

    // Кастомное количество слайдов - запрос ввода
    if (data === 'buy_custom') {
      sessions[userId] = { ...sessions[userId], awaitingCustomSlides: true };

      await bot.editMessageText(copy.pricing.customSlides.prompt, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '← Назад', callback_data: 'view_packs' }]
          ]
        }
      });
      return;
    }

    // Подтверждение кастомной покупки - выбор способа оплаты
    if (data.startsWith('confirm_custom_')) {
      const slideCount = parseInt(data.replace('confirm_custom_', ''));
      const tier = await db.getActiveSubscription(userId);
      const pricePerSlide = pricing.getPerSlidePrice(tier);
      const totalPrice = slideCount * pricePerSlide;
      const starsPrice = pricing.getStarsPrice(totalPrice);

      await bot.editMessageText(
        copy.pricing.customSlides.confirm(slideCount, pricePerSlide, totalPrice, tier),
        {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: copy.pricing.stars.starsOption(starsPrice), callback_data: `stars_custom_${slideCount}` }],
              [{ text: copy.pricing.stars.rubOption(totalPrice), callback_data: `rub_custom_${slideCount}` }],
              [{ text: '← Назад', callback_data: 'view_packs' }]
            ]
          }
        }
      );
      return;
    }

    // Оплата кастомного количества через Stars
    if (data.startsWith('stars_custom_')) {
      const slideCount = parseInt(data.replace('stars_custom_', ''));
      const tier = await db.getActiveSubscription(userId);
      const pricePerSlide = pricing.getPerSlidePrice(tier);
      const totalPrice = slideCount * pricePerSlide;
      const starsPrice = pricing.getStarsPrice(totalPrice);

      await sendStarsInvoice(
        chatId,
        userId,
        'custom_slides',
        `Swipely: ${slideCount} слайдов`,
        `Photo Mode слайды`,
        starsPrice,
        { slides: slideCount }
      );
      return;
    }

    // Оплата кастомного количества через YooKassa
    if (data.startsWith('rub_custom_')) {
      const slideCount = parseInt(data.replace('rub_custom_', ''));
      const tier = await db.getActiveSubscription(userId);
      const pricePerSlide = pricing.getPerSlidePrice(tier);
      const totalPrice = slideCount * pricePerSlide;

      await bot.sendMessage(chatId, '⏳ Создаю ссылку на оплату...');

      const botInfo = await bot.getMe();

      const payment = await yookassa.createPayment({
        amount: totalPrice,
        description: `Swipely: ${slideCount} слайдов`,
        metadata: {
          user_id: userId,
          product_type: 'custom_slides',
          slides: slideCount
        },
        returnUrl: yookassa.getTelegramReturnUrl(botInfo.username, 'temp')
      });

      if (!payment.success) {
        await bot.sendMessage(chatId, `❌ Ошибка создания платежа: ${payment.error}\n\nПопробуй позже.`);
        return;
      }

      await db.createPayment(payment.paymentId, userId, totalPrice, 'custom_slides', { slides: slideCount });
      await savePayment({
        payment_id: payment.paymentId,
        telegram_id: userId,
        amount: totalPrice,
        currency: 'RUB',
        product_type: 'custom_slides',
        product_data: { slides: slideCount },
        payment_method: 'yookassa',
        status: 'pending'
      });

      await bot.sendMessage(chatId,
        `💳 **Покупка слайдов**\n\n` +
        `📦 Количество: ${slideCount} шт.\n` +
        `💰 Цена: ${pricePerSlide}₽/шт.\n` +
        `💵 Итого: ${pricing.formatPrice(totalPrice)}${tier === 'pro' ? ' (PRO цена)' : ''}\n\n` +
        `👇 Нажми кнопку для оплаты:`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: `💳 Оплатить ${totalPrice}₽`, url: payment.confirmationUrl }],
              [{ text: '🔄 Я оплатил, проверить', callback_data: `check_payment_${payment.paymentId}` }],
              [{ text: '← Назад', callback_data: 'view_packs' }]
            ]
          }
        }
      );
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
      const status = await db.getUserStatus(userId);
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

    // Покупка пакета слайдов - показываем выбор способа оплаты
    if (data.startsWith('buy_pack_')) {
      const packId = data.replace('buy_pack_', '');
      const pack = pricing.slidePacks[packId];

      if (!pack) {
        return bot.sendMessage(chatId, '❌ Пакет не найден');
      }

      const starsPrice = pricing.starsPricing.slidePacks[packId];

      await bot.editMessageText(
        `📦 **${pack.name}**\n\n` +
        `${copy.pricing.stars.chooseMethod}`,
        {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: copy.pricing.stars.starsOption(starsPrice), callback_data: `stars_pack_${packId}` }],
              [{ text: copy.pricing.stars.rubOption(pack.price), callback_data: `rub_pack_${packId}` }],
              [{ text: '← Назад', callback_data: 'view_packs' }]
            ]
          }
        }
      );
      return;
    }

    // Оплата пакета через Stars
    if (data.startsWith('stars_pack_')) {
      const packId = data.replace('stars_pack_', '');
      const pack = pricing.slidePacks[packId];

      if (!pack) {
        return bot.sendMessage(chatId, '❌ Пакет не найден');
      }

      const starsPrice = pricing.starsPricing.slidePacks[packId];

      await sendStarsInvoice(
        chatId,
        userId,
        `pack_${packId}`,
        `Swipely: ${pack.name}`,
        `${pack.slides} слайдов для Photo Mode`,
        starsPrice,
        { slides: pack.slides }
      );
      return;
    }

    // Оплата пакета через YooKassa (рубли)
    if (data.startsWith('rub_pack_')) {
      const packId = data.replace('rub_pack_', '');
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

      // Сохраняем платёж в локальную БД и Supabase
      await db.createPayment(payment.paymentId, userId, pack.price, `pack_${packId}`, { slides: pack.slides });
      await savePayment({
        payment_id: payment.paymentId,
        telegram_id: userId,
        amount: pack.price,
        currency: 'RUB',
        product_type: `pack_${packId}`,
        product_data: { slides: pack.slides },
        payment_method: 'yookassa',
        status: 'pending'
      });

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

    // Покупка PRO подписки - показываем выбор способа оплаты
    if (data === 'buy_pro_month' || data === 'buy_pro_year') {
      const months = data === 'buy_pro_year' ? 12 : 1;
      const price = data === 'buy_pro_year' ? 9900 : 990;
      const productType = data === 'buy_pro_year' ? 'pro_year' : 'pro_month';
      const starsPrice = months === 12 ? pricing.starsPricing.pro.year : pricing.starsPricing.pro.month;

      await bot.editMessageText(
        `🚀 **PRO на ${months === 12 ? 'год' : 'месяц'}**\n\n` +
        `${copy.pricing.stars.chooseMethod}`,
        {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: copy.pricing.stars.starsOption(starsPrice), callback_data: `stars_${productType}` }],
              [{ text: copy.pricing.stars.rubOption(price), callback_data: `rub_${productType}` }],
              [{ text: '← Назад', callback_data: 'view_pro' }]
            ]
          }
        }
      );
      return;
    }

    // Оплата PRO через Stars
    if (data === 'stars_pro_month' || data === 'stars_pro_year') {
      const months = data === 'stars_pro_year' ? 12 : 1;
      const productType = data === 'stars_pro_year' ? 'pro_year' : 'pro_month';
      const starsPrice = months === 12 ? pricing.starsPricing.pro.year : pricing.starsPricing.pro.month;

      await sendStarsInvoice(
        chatId,
        userId,
        productType,
        `Swipely PRO ${months === 12 ? '(год)' : '(месяц)'}`,
        `Безлимит Standard + скидка 20% на Photo Mode`,
        starsPrice,
        { months }
      );
      return;
    }

    // Оплата PRO через YooKassa (рубли)
    if (data === 'rub_pro_month' || data === 'rub_pro_year') {
      const months = data === 'rub_pro_year' ? 12 : 1;
      const price = data === 'rub_pro_year' ? 9900 : 990;
      const productType = data === 'rub_pro_year' ? 'pro_year' : 'pro_month';

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

      // Сохраняем платёж в локальную БД и Supabase
      await db.createPayment(payment.paymentId, userId, price, productType, { months });
      await savePayment({
        payment_id: payment.paymentId,
        telegram_id: userId,
        amount: price,
        currency: 'RUB',
        product_type: productType,
        product_data: { months },
        payment_method: 'yookassa',
        status: 'pending'
      });

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

    // Оплата Photo Mode перед генерацией - выбор способа оплаты
    if (data.startsWith('pay_photo_')) {
      const slideCount = parseInt(data.replace('pay_photo_', ''));
      const tier = await db.getActiveSubscription(userId);
      const price = pricing.getPhotoModePrice(slideCount, tier);
      const starsPrice = pricing.getPhotoModeStarsPrice(slideCount);

      await bot.sendMessage(chatId,
        `🎨 **AI-карусель: ${slideCount} слайдов**\n\n` +
        `${copy.pricing.stars.chooseMethod}`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: copy.pricing.stars.starsOption(starsPrice), callback_data: `stars_photo_${slideCount}` }],
              [{ text: copy.pricing.stars.rubOption(price), callback_data: `rub_photo_${slideCount}` }],
              [{ text: '← Назад', callback_data: 'mode_photo' }]
            ]
          }
        }
      );
      return;
    }

    // Оплата Photo Mode через Stars
    if (data.startsWith('stars_photo_')) {
      const slideCount = parseInt(data.replace('stars_photo_', ''));
      const starsPrice = pricing.getPhotoModeStarsPrice(slideCount);

      await sendStarsInvoice(
        chatId,
        userId,
        'photo_slides',
        `AI-карусель: ${slideCount} слайдов`,
        `Photo Mode — изображения с AI`,
        starsPrice,
        { slides: slideCount }
      );
      return;
    }

    // Оплата Photo Mode через YooKassa (рубли)
    if (data.startsWith('rub_photo_')) {
      const slideCount = parseInt(data.replace('rub_photo_', ''));
      const tier = await db.getActiveSubscription(userId);
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

      // Сохраняем платёж в локальную БД и Supabase
      await db.createPayment(payment.paymentId, userId, price, 'photo_slides', { slides: slideCount });
      await savePayment({
        payment_id: payment.paymentId,
        telegram_id: userId,
        amount: price,
        currency: 'RUB',
        product_type: 'photo_slides',
        product_data: { slides: slideCount },
        payment_method: 'yookassa',
        status: 'pending'
      });

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

    // Покупка недостающих слайдов поштучно - выбор способа оплаты
    if (data.startsWith('topup_')) {
      const slidesToBuy = parseInt(data.replace('topup_', ''));
      const tier = await db.getActiveSubscription(userId);
      const pricePerSlide = pricing.getPerSlidePrice(tier);
      const totalPrice = slidesToBuy * pricePerSlide;
      const starsPrice = pricing.getStarsPrice(totalPrice);

      await bot.sendMessage(chatId,
        `🛒 **Докупка: ${slidesToBuy} слайдов**\n\n` +
        `${copy.pricing.stars.chooseMethod}`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: copy.pricing.stars.starsOption(starsPrice), callback_data: `stars_topup_${slidesToBuy}` }],
              [{ text: copy.pricing.stars.rubOption(totalPrice), callback_data: `rub_topup_${slidesToBuy}` }],
              [{ text: '← Назад', callback_data: 'mode_photo' }]
            ]
          }
        }
      );
      return;
    }

    // Докупка слайдов через Stars
    if (data.startsWith('stars_topup_')) {
      const slidesToBuy = parseInt(data.replace('stars_topup_', ''));
      const tier = await db.getActiveSubscription(userId);
      const pricePerSlide = pricing.getPerSlidePrice(tier);
      const totalPrice = slidesToBuy * pricePerSlide;
      const starsPrice = pricing.getStarsPrice(totalPrice);

      await sendStarsInvoice(
        chatId,
        userId,
        'topup_slides',
        `Докупка: ${slidesToBuy} слайдов`,
        `Photo Mode слайды`,
        starsPrice,
        { slides: slidesToBuy }
      );
      return;
    }

    // Докупка слайдов через YooKassa (рубли)
    if (data.startsWith('rub_topup_')) {
      const slidesToBuy = parseInt(data.replace('rub_topup_', ''));
      const tier = await db.getActiveSubscription(userId);
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

      // Сохраняем платёж в локальную БД и Supabase
      await db.createPayment(payment.paymentId, userId, totalPrice, 'topup_slides', { slides: slidesToBuy });
      await savePayment({
        payment_id: payment.paymentId,
        telegram_id: userId,
        amount: totalPrice,
        currency: 'RUB',
        product_type: 'topup_slides',
        product_data: { slides: slidesToBuy },
        payment_method: 'yookassa',
        status: 'pending'
      });

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

    // ==================== ADMIN CALLBACKS ====================

    // Проверка админского доступа для admin_ callbacks
    if (data.startsWith('admin_') && userId !== ADMIN_USER_ID) {
      return bot.answerCallbackQuery(query.id, { text: '⛔ Доступ запрещён', show_alert: true });
    }

    // Статистика оплат (из Supabase)
    if (data === 'admin_payments') {
      try {
        // Получаем статистику из Supabase
        const stats = await getPaymentsStats();
        const recentPayments = await getRecentPayments(5);

        let recentText = recentPayments.length > 0
          ? recentPayments.map(p => {
              const emoji = p.payment_method === 'telegram_stars' ? '⭐' : '💳';
              const date = new Date(p.created_at).toLocaleDateString('ru-RU');
              const productType = (p.product_type || '').replace(/_/g, '\\_'); // Экранируем _ для Markdown
              return `${emoji} ${productType} — ${p.amount}${p.payment_method === 'telegram_stars' ? '⭐' : '₽'} (${date})`;
            }).join('\n')
          : 'Нет платежей';

        const text = `💳 **Статистика оплат (Supabase)**

**⭐ Telegram Stars:**
├ Успешных: ${stats?.stars?.succeeded?.count || 0} (${stats?.stars?.succeeded?.total || 0}⭐)
└ В ожидании: ${stats?.stars?.pending?.count || 0}

**💳 YooKassa:**
├ Успешных: ${stats?.yookassa?.succeeded?.count || 0} (${stats?.yookassa?.succeeded?.total || 0}₽)
└ В ожидании: ${stats?.yookassa?.pending?.count || 0}

**📋 Последние платежи:**
${recentText}`;

        await bot.editMessageText(text, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔄 Обновить', callback_data: 'admin_payments' }],
              [{ text: '← Назад', callback_data: 'admin_back' }]
            ]
          }
        });
      } catch (err) {
        console.error('Admin payments error:', err);
        await bot.sendMessage(chatId, '❌ Ошибка получения статистики: ' + err.message);
      }
      return;
    }

    // Статистика пользователей (из Supabase)
    if (data === 'admin_users') {
      try {
        // Получаем данные из Supabase profiles
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        const { count: proUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('subscription_tier', 'pro');

        // Получаем последних 5 пользователей из Supabase
        const { data: recentUsers } = await supabase
          .from('profiles')
          .select('telegram_id, telegram_username, first_name, subscription_tier, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        // Получаем количество генераций из usage_tracking
        const { count: totalGenerations } = await supabase
          .from('usage_tracking')
          .select('*', { count: 'exact', head: true })
          .eq('generation_type', 'carousel');

        // Данные о балансе из Supabase
        const { count: usersWithBalance } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gt('photo_slides_balance', 0);

        const { data: balanceData } = await supabase
          .from('profiles')
          .select('photo_slides_balance');

        const totalPhotoBalance = balanceData?.reduce((sum, u) => sum + (u.photo_slides_balance || 0), 0) || 0;

        let recentText = (recentUsers && recentUsers.length > 0)
          ? recentUsers.map(u => {
              const tier = u.subscription_tier === 'pro' ? '⭐' : '👤';
              const name = u.telegram_username || u.first_name || u.telegram_id;
              const date = new Date(u.created_at).toLocaleDateString('ru-RU');
              return `${tier} ${name} (${date})`;
            }).join('\n')
          : 'Нет пользователей';

        const text = `👥 **Пользователи (Supabase)**

**📊 Общее:**
├ Всего: ${totalUsers || 0}
├ PRO: ${proUsers || 0}
├ С балансом слайдов: ${usersWithBalance}
└ Общий баланс: ${totalPhotoBalance || 0} слайдов

**📈 Генерации:**
└ Всего: ${totalGenerations || 0}

**🆕 Последние:**
${recentText}`;

        await bot.editMessageText(text, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔄 Обновить', callback_data: 'admin_users' }],
              [{ text: '← Назад', callback_data: 'admin_back' }]
            ]
          }
        });
      } catch (err) {
        console.error('Admin users error:', err);
        await bot.sendMessage(chatId, '❌ Ошибка получения статистики: ' + err.message);
      }
      return;
    }

    // Общая статистика (полностью из Supabase)
    if (data === 'admin_stats') {
      try {
        // Пользователи из Supabase
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Сегодняшние пользователи из Supabase
        const today = new Date().toISOString().split('T')[0];
        const { count: todayUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today);

        // Генерации из Supabase
        const { count: totalGenerations } = await supabase
          .from('usage_tracking')
          .select('*', { count: 'exact', head: true })
          .eq('generation_type', 'carousel');

        // Платежи из Supabase
        const paymentStats = await getTotalPaymentsStats();

        const text = `📊 **Общая статистика (Supabase)**

**💰 Доход:**
├ YooKassa: ${(paymentStats?.totalRevenue || 0).toLocaleString('ru-RU')}₽
├ Stars: ${paymentStats?.totalStars || 0}⭐ (~${Math.round((paymentStats?.totalStars || 0) * 1.66)}₽)
└ Всего платежей: ${paymentStats?.totalPayments || 0}

**👥 Пользователи:**
├ Всего: ${totalUsers || 0}
└ Сегодня: +${todayUsers || 0}

**📈 Активность:**
├ Генераций всего: ${totalGenerations || 0}
└ Платежей сегодня: ${paymentStats?.todayPayments || 0}`;

        await bot.editMessageText(text, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔄 Обновить', callback_data: 'admin_stats' }],
              [{ text: '← Назад', callback_data: 'admin_back' }]
            ]
          }
        });
      } catch (err) {
        console.error('Admin stats error:', err);
        await bot.sendMessage(chatId, '❌ Ошибка получения статистики: ' + err.message);
      }
      return;
    }

    // Назад в админку
    if (data === 'admin_back') {
      await bot.editMessageText('🔐 **Админ-панель**\n\nВыбери раздел:', {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '💳 Статистика оплат', callback_data: 'admin_payments' }],
            [{ text: '👥 Пользователи', callback_data: 'admin_users' }],
            [{ text: '📊 Общая статистика', callback_data: 'admin_stats' }]
          ]
        }
      });
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
              [{ text: copy.pricing.buttons.buyCustom, callback_data: 'buy_custom' }],
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
      const status = await db.getUserStatus(userId);

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
      const status = await db.getUserStatus(userId);

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
      const stats = await db.getReferralStats(userId) || { referralCount: 0, totalEarned: 0 };
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
      // Отправляем превью стилей альбомами (макс 10 фото в альбоме)
      try {
        const previews = await getPreviewPaths();
        const ALBUM_LIMIT = 10;

        // Первый альбом (первые 10)
        const firstBatch = previews.slice(0, ALBUM_LIMIT).map((preview, idx) => ({
          type: 'photo',
          media: preview.path,
          caption: idx === 0 ? '🎨 Доступные стили (1/2)' : undefined
        }));
        await bot.sendMediaGroup(chatId, firstBatch);

        // Второй альбом (остальные)
        if (previews.length > ALBUM_LIMIT) {
          const secondBatch = previews.slice(ALBUM_LIMIT).map((preview, idx) => ({
            type: 'photo',
            media: preview.path,
            caption: idx === 0 ? '🎨 Доступные стили (2/2)' : undefined
          }));
          await bot.sendMediaGroup(chatId, secondBatch);
        }
      } catch (err) {
        console.error('⚠️ Не удалось отправить превью стилей:', err.message);
      }

      await bot.sendMessage(chatId, 'Выбери стиль для просмотра примера:', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📓 Notebook Sketch', callback_data: 'view_style_notebook' }],
            [{ text: '🌌 Aurora', callback_data: 'view_style_aurora' }],
            [{ text: '💻 Terminal', callback_data: 'view_style_terminal' }],
            [{ text: '📰 Editorial', callback_data: 'view_style_editorial' }],
            [{ text: '💎 Luxe', callback_data: 'view_style_luxe' }],
            [{ text: '🔲 Backspace', callback_data: 'view_style_backspace' }],
            [{ text: '⭐ Star Highlight', callback_data: 'view_style_star_highlight' }],
            [{ text: '💜 Purple Accent', callback_data: 'view_style_purple_accent' }],
            [{ text: '✍️ Quote Doodle', callback_data: 'view_style_quote_doodle' }],
            [{ text: '💬 Speech Bubble', callback_data: 'view_style_speech_bubble' }],
            [{ text: '📊 Grid Multi', callback_data: 'view_style_grid_multi' }],
            [{ text: '🧾 Receipt', callback_data: 'view_style_receipt' }],
            [{ text: '🍋 Lime Checklist', callback_data: 'view_style_lime_checklist' }],
            [{ text: '📱 App List', callback_data: 'view_style_app_list' }],
            [{ text: '📜 Paper Texture', callback_data: 'view_style_paper_image' }]
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
      const standardCheck = await db.canGenerateStandard(userId);

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

      // Отправляем превью стилей альбомами (макс 10 фото в альбоме)
      try {
        const previews = await getPreviewPaths();
        const ALBUM_LIMIT = 10;

        // Первый альбом (первые 10)
        const firstBatch = previews.slice(0, ALBUM_LIMIT).map((preview, idx) => ({
          type: 'photo',
          media: preview.path,
          caption: idx === 0 ? '👆 Превью стилей (1/2)' : undefined
        }));
        await bot.sendMediaGroup(chatId, firstBatch);

        // Второй альбом (остальные)
        if (previews.length > ALBUM_LIMIT) {
          const secondBatch = previews.slice(ALBUM_LIMIT).map((preview, idx) => ({
            type: 'photo',
            media: preview.path,
            caption: idx === 0 ? '👆 Превью стилей (2/2)' : undefined
          }));
          await bot.sendMediaGroup(chatId, secondBatch);
        }
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
                { text: '📓 Notebook', callback_data: 'style_notebook' },
                { text: '🌌 Aurora', callback_data: 'style_aurora' }
              ],
              [
                { text: '💻 Terminal', callback_data: 'style_terminal' },
                { text: '📰 Editorial', callback_data: 'style_editorial' }
              ],
              [
                { text: '💎 Luxe', callback_data: 'style_luxe' },
                { text: '🔲 Backspace', callback_data: 'style_backspace' }
              ],
              [
                { text: '⭐ Star Highlight', callback_data: 'style_star_highlight' },
                { text: '💜 Purple Accent', callback_data: 'style_purple_accent' }
              ],
              [
                { text: '✍️ Quote Doodle', callback_data: 'style_quote_doodle' },
                { text: '💬 Speech Bubble', callback_data: 'style_speech_bubble' }
              ],
              [
                { text: '📊 Grid Multi', callback_data: 'style_grid_multi' },
                { text: '🧾 Receipt', callback_data: 'style_receipt' }
              ],
              [
                { text: '🍋 Lime Checklist', callback_data: 'style_lime_checklist' },
                { text: '📱 App List', callback_data: 'style_app_list' }
              ],
              [{ text: '📜 Paper Texture', callback_data: 'style_paper_image' }]
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
      const photoCheck = await db.canGeneratePhoto(userId, slideCount);

      if (!photoCheck.canGenerate) {
        // Нужна оплата
        const tier = await db.getActiveSubscription(userId);
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
        'notebook': 'Notebook Sketch',
        'aurora': 'Aurora',
        'terminal': 'Terminal',
        'editorial': 'Editorial',
        'luxe': 'Luxe',
        'backspace': 'Backspace',
        'star_highlight': 'Star Highlight',
        'purple_accent': 'Purple Accent',
        'quote_doodle': 'Quote Doodle',
        'speech_bubble': 'Speech Bubble',
        'grid_multi': 'Grid Multi',
        'receipt': 'Receipt',
        'lime_checklist': 'Lime Checklist',
        'app_list': 'App List',
        'paper_image': 'Paper Texture'
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
      const deductResult = await db.deductStandard(userId);
      if (!deductResult.success) {
        console.error(`⚠️ Не удалось списать Standard генерацию для ${userId}`);
      }

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
