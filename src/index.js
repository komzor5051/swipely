require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const { sendDailyReport, ADMIN_CHAT_ID } = require('./services/dailyReport');

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
  // Admin-only: /report — отправить отчёт за сегодня прямо сейчас (для теста).
  if (msg.chat.id === ADMIN_CHAT_ID && msg.text && msg.text.trim() === '/report') {
    await sendDailyReport(bot);
    return;
  }
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

// Daily report — каждый день в 22:00 по Москве для админа (chat 843512517).
cron.schedule('0 22 * * *', () => sendDailyReport(bot), { timezone: 'Europe/Moscow' });

console.log('🤖 Swipely Bot (заглушка) запущен — редирект на swipely.ru');
console.log('📊 Daily report scheduled: 22:00 Europe/Moscow → chat ' + ADMIN_CHAT_ID);
