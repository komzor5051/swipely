require('dotenv').config();
const { Telegraf } = require('telegraf');

console.log('🧪 Тестирую подключение к Telegram API...');
console.log('📋 Bot Token:', process.env.TELEGRAM_BOT_TOKEN ? '✅ Загружен' : '❌ Отсутствует');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

console.log('🚀 Пытаюсь запустить бота...');

bot.launch()
  .then(() => {
    console.log('✅ Бот успешно запущен!');
    console.log('📊 Bot Info:', bot.botInfo);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Ошибка запуска:', error.message);
    console.error('📜 Полная ошибка:', error);
    process.exit(1);
  });

// Таймаут на случай зависания
setTimeout(() => {
  console.error('⏱️ Превышено время ожидания (10 сек)');
  process.exit(1);
}, 10000);
