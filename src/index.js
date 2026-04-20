require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const { sendDailyReport, ADMIN_CHAT_ID } = require('./services/dailyReport');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: {
    params: {
      allowed_updates: ['message', 'callback_query']
    }
  }
});

// Note: SUPABASE_ANON_KEY actually holds the service_role key — see swipely monorepo .env conventions.
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const BOT_BONUS_PHOTO_SLIDES = 3;

// Handles `/start link_<token>` deep links from the web app.
// Returns true if we sent a custom reply (caller should NOT fall through to the redirect).
async function handleLinkStart(msg) {
  const text = msg.text || '';
  const match = text.match(/^\/start\s+link_([A-Za-z0-9_-]+)$/);
  if (!match) return false;
  const token = match[1];

  // Atomic claim: only one caller can flip used_at from NULL.
  const { data: claimed, error: claimErr } = await supabase
    .from('telegram_link_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('token', token)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .select('user_id')
    .maybeSingle();

  if (claimErr || !claimed) {
    await bot.sendMessage(
      msg.chat.id,
      'Ссылка недействительна или истекла. Вернись на swipely.ru → Настройки → «Получить бонус» и получи свежую.'
    );
    return true;
  }

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('photo_slides_balance, bot_started, first_name')
    .eq('id', claimed.user_id)
    .single();

  if (profileErr || !profile) {
    console.error('[handleLinkStart] profile fetch failed', profileErr);
    await bot.sendMessage(msg.chat.id, 'Что-то пошло не так. Напиши @vladlyamin, разберёмся.');
    return true;
  }

  const grantBonus = !profile.bot_started;
  const updates = {
    telegram_id: msg.from.id,
    telegram_username: msg.from.username || null,
    bot_started: true,
  };
  if (!profile.first_name && msg.from.first_name) {
    updates.first_name = msg.from.first_name;
  }
  if (grantBonus) {
    updates.photo_slides_balance = (profile.photo_slides_balance || 0) + BOT_BONUS_PHOTO_SLIDES;
  }

  const { error: updateErr } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', claimed.user_id);

  if (updateErr) {
    console.error('[handleLinkStart] profile update failed', updateErr);
    await bot.sendMessage(msg.chat.id, 'Что-то пошло не так. Напиши @vladlyamin, разберёмся.');
    return true;
  }

  const reply = grantBonus
    ? `Готово! +${BOT_BONUS_PHOTO_SLIDES} фото-слайда на счёте. Возвращайся на swipely.ru и выбери Photo Mode при генерации.`
    : 'Аккаунт уже привязан к Telegram. Возвращайся на swipely.ru → /generate';
  await bot.sendMessage(msg.chat.id, reply);
  return true;
}

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
  // Deep link from web app: /start link_<token> — link account + grant bonus.
  if (msg.text && msg.text.startsWith('/start ')) {
    try {
      const handled = await handleLinkStart(msg);
      if (handled) return;
    } catch (err) {
      console.error('handleLinkStart error:', err.message);
      // Fall through to redirect so the user still sees something.
    }
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
