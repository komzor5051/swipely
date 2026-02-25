require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: {
    params: {
      allowed_updates: ['message', 'callback_query']
    }
  }
});

const REDIRECT_TEXT = `👋 Привет\!

Бот Swipely переехал на сайт — теперь всё работает там:

🌐 *swipely\.ru*

━━━━━━━━━━━━━━━━━━━━

🎁 *Акция* — первый месяц PRO всего *495 ₽* вместо 990 ₽\. Прямо сейчас\.

━━━━━━━━━━━━━━━━━━━━

Что появилось на сайте, чего не было в боте:

✦ *18 шаблонов дизайна* — меняй прямо в редакторе
✦ *AI карусель с твоим фото* — твой персонаж на каждом слайде
✦ *Редактор слайдов* — правь текст и стиль после генерации
✦ *История* — все карусели сохраняются, скачивай в любой момент
✦ *Подпись к посту* — AI пишет caption автоматически
✦ *Бесплатный тариф* — 3 карусели в месяц без карты

Заходи → *swipely\.ru* 🚀`;

bot.on('message', async (msg) => {
  try {
    await bot.sendMessage(msg.chat.id, REDIRECT_TEXT, { parse_mode: 'MarkdownV2' });
  } catch (err) {
    console.error('sendMessage error:', err.message);
  }
});

bot.on('callback_query', async (query) => {
  try {
    await bot.answerCallbackQuery(query.id);
    await bot.sendMessage(query.message.chat.id, REDIRECT_TEXT, { parse_mode: 'MarkdownV2' });
  } catch (err) {
    console.error('callback_query error:', err.message);
  }
});

console.log('🤖 Swipely Bot (заглушка) запущен — редирект на swipely.ru');
