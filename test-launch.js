require('dotenv').config();
const { Telegraf } = require('telegraf');

console.log('🧪 Тест запуска бота...');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

console.log('📝 Регистрация команды /start...');
bot.start((ctx) => {
  console.log('✅ Получена команда /start от:', ctx.from.username);
  ctx.reply('👋 Привет! Бот работает!');
});

console.log('🚀 Запуск бота...');

// Попробуем разные опции запуска
const launchOptions = {
  dropPendingUpdates: true,
  allowedUpdates: ['message', 'callback_query']
};

console.log('⚙️ Опции запуска:', JSON.stringify(launchOptions));

// Добавим таймаут на промис
Promise.race([
  bot.launch(launchOptions),
  new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout after 30s')), 30000))
])
  .then(() => {
    console.log('✅ Бот успешно запущен!');
    console.log('📊 Bot username:', bot.botInfo?.username);
  })
  .catch((error) => {
    console.error('❌ Ошибка:', error.message);
    console.error('📜 Stack:', error.stack);
    process.exit(1);
  });

// Graceful stop
process.once('SIGINT', () => {
  console.log('⏹️ Остановка бота...');
  bot.stop('SIGINT');
});
