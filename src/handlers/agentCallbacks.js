const crypto = require('crypto');

// Handles agent approval inline-button callbacks from Wave 4 agents.
// callback_data shapes:
//   agent_topics_approve:<runId>           agent_topics_reject:<runId>
//   agent_carousel_approve:<runId>:<cid>   agent_carousel_reject:<runId>:<cid>
//
// Posts to swipely.ru /api/agents/bot-action with an HMAC over the payload
// (EDITOR_BOT_SECRET). Returns true if it handled the callback.

const APP_URL = process.env.SWIPELY_APP_URL || 'https://swipely.ru';

function isAgentCallback(data) {
  return typeof data === 'string' && /^agent_(topics|carousel)_(approve|reject):/.test(data);
}

async function handleAgentCallback(bot, query) {
  const data = query.data || '';
  if (!isAgentCallback(data)) return false;

  const secret = process.env.EDITOR_BOT_SECRET;
  if (!secret) {
    await bot.answerCallbackQuery(query.id, { text: 'Сервис временно недоступен', show_alert: false }).catch(() => {});
    return true;
  }

  const telegramId = query.from && query.from.id;
  const ts = Date.now();
  const hmac = crypto.createHmac('sha256', secret).update(`${telegramId}:${data}:${ts}`).digest('hex');

  let ok = false;
  let detail = '';
  try {
    const res = await fetch(`${APP_URL}/api/agents/bot-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegram_id: telegramId, callback_data: data, ts, hmac }),
    });
    const json = await res.json().catch(() => ({}));
    ok = res.ok && json.ok;
    detail = json.error || json.status || '';
  } catch (err) {
    detail = String(err.message || err);
  }

  const isApprove = data.includes('_approve:');
  const text = ok
    ? (isApprove ? 'Принято ✓' : 'Отклонено')
    : (detail === 'user_not_linked' ? 'Привяжи аккаунт: swipely.ru → Настройки' : 'Не получилось, попробуй на сайте');
  await bot.answerCallbackQuery(query.id, { text }).catch(() => {});

  // Replace the inline keyboard so the action can't be repeated.
  try {
    await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: query.message.chat.id, message_id: query.message.message_id });
  } catch { /* ignore */ }
  if (ok) {
    await bot.sendMessage(query.message.chat.id, isApprove ? 'Готово. Загляни на swipely.ru — там результат.' : 'Ок, не делаем.').catch(() => {});
  }
  return true;
}

module.exports = { isAgentCallback, handleAgentCallback };
