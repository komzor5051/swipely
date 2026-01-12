require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

console.log('🧪 Тест с node-telegram-bot-api...');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true
});

console.log('✅ Бот создан, запуск polling...');

bot.on('message', (msg) => {
  console.log('📨 Получено сообщение от', msg.from.username || msg.from.first_name);
  bot.sendMessage(msg.chat.id, '👋 Привет! Бот работает!');
});

bot.on('polling_error', (error) => {
  console.error('❌ Ошибка polling:', error.message);
});

console.log('🚀 Бот запущен и готов к работе!');
console.log('📋 Отправь боту любое сообщение в Telegram...');
