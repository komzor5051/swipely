require('dotenv').config();
const { Telegraf } = require('telegraf');

async function main() {
  try {
    console.log('🧪 Пошаговый тест запуска...');

    const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

    console.log('1️⃣ Проверка токена через getMe...');
    const me = await bot.telegram.getMe();
    console.log('✅ Бот найден:', me.username);

    console.log('2️⃣ Удаление webhook...');
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    console.log('✅ Webhook удален');

    console.log('3️⃣ Регистрация обработчиков...');
    bot.start((ctx) => {
      console.log('Получен /start от', ctx.from.username);
      ctx.reply('👋 Привет!');
    });

    console.log('4️⃣ Запуск polling...');
    await bot.launch({
      dropPendingUpdates: true,
      allowedUpdates: ['message', 'callback_query']
    });

    console.log('✅ Бот успешно запущен!');

    // Graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main();
