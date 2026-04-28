const { createClient } = require('@supabase/supabase-js');

const ADMIN_CHAT_ID = 843512517;
const TZ = 'Europe/Moscow';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const PRODUCT_LABELS = {
  blogger_monthly: 'Start (месяц)',
  blogger_yearly: 'Start (год)',
  creator_monthly: 'Creator (месяц)',
  creator_monthly_promo: 'Creator (месяц, промо)',
  creator_yearly: 'Creator (год)',
  pro_monthly: 'Pro (месяц)',
  pro_yearly: 'Pro (год)',
  pack_15: 'Пак 15 слайдов',
  pack_50: 'Пак 50 слайдов',
  pack_150: 'Пак 150 слайдов',
  photo_custom: 'Кастомный пак слайдов',
  test_1rub: 'Тестовый 1₽',
};

// Moscow is UTC+3, no DST. Returns {startISO, endISO, label} for day offset
// relative to today (0 = today, -1 = yesterday).
function getDayWindow(offsetDays = 0, now = new Date()) {
  const msk = new Date(now.toLocaleString('en-US', { timeZone: TZ }));
  const y = msk.getFullYear();
  const m = msk.getMonth();
  const d = msk.getDate() + offsetDays;
  const startISO = new Date(Date.UTC(y, m, d, -3, 0, 0)).toISOString();
  const endISO = new Date(Date.UTC(y, m, d + 1, -3, 0, 0)).toISOString();
  const dayStart = new Date(Date.UTC(y, m, d, -3, 0, 0));
  const label = dayStart.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', timeZone: TZ });
  return { startISO, endISO, label };
}

async function collectForWindow({ startISO, endISO }) {
  const [signupsRes, genRes, paymentsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startISO)
      .lt('created_at', endISO),
    supabase
      .from('generations')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startISO)
      .lt('created_at', endISO),
    supabase
      .from('payments')
      .select('amount, product_type, payment_method')
      .eq('status', 'succeeded')
      .gte('created_at', startISO)
      .lt('created_at', endISO),
  ]);

  const payments = paymentsRes.data || [];
  const revenue = payments.reduce((s, p) => s + Number(p.amount || 0), 0);

  // { productType: { count, revenue } }
  const byProduct = {};
  for (const p of payments) {
    const key = p.product_type || 'unknown';
    if (!byProduct[key]) byProduct[key] = { count: 0, revenue: 0 };
    byProduct[key].count += 1;
    byProduct[key].revenue += Number(p.amount || 0);
  }

  return {
    signups: signupsRes.count || 0,
    generations: genRes.count || 0,
    payments: { count: payments.length, revenue, byProduct },
    errors: [signupsRes.error, genRes.error, paymentsRes.error].filter(Boolean),
  };
}

async function collectStats() {
  const today = getDayWindow(0);
  const yesterday = getDayWindow(-1);
  const [todayStats, yesterdayStats] = await Promise.all([
    collectForWindow(today),
    collectForWindow(yesterday),
  ]);
  return { today: { ...todayStats, label: today.label }, yesterday: yesterdayStats };
}

function delta(today, yesterday) {
  const d = today - yesterday;
  if (d === 0) return '=';
  return d > 0 ? `+${d}` : `${d}`;
}

function fmtRub(n) {
  return n.toLocaleString('ru-RU') + ' ₽';
}

function formatReport({ today, yesterday }) {
  const lines = [
    `Отчёт Swipely за ${today.label}`,
    ``,
    `Регистрации: ${today.signups} (вчера: ${yesterday.signups}, ${delta(today.signups, yesterday.signups)})`,
    `Генерации: ${today.generations} (вчера: ${yesterday.generations}, ${delta(today.generations, yesterday.generations)})`,
    `Оплаты: ${today.payments.count} на ${fmtRub(today.payments.revenue)} (вчера: ${yesterday.payments.count} на ${fmtRub(yesterday.payments.revenue)}, ${delta(today.payments.count, yesterday.payments.count)})`,
  ];

  const products = Object.entries(today.payments.byProduct).sort((a, b) => b[1].revenue - a[1].revenue);
  if (products.length) {
    lines.push(``, `По продуктам:`);
    for (const [id, v] of products) {
      const label = PRODUCT_LABELS[id] || id;
      lines.push(`  ${label}: ${v.count} × ${fmtRub(Math.round(v.revenue / v.count))} = ${fmtRub(v.revenue)}`);
    }
  }

  if (today.errors.length || yesterday.errors.length) {
    lines.push(``, `Ошибки запросов: ${today.errors.length + yesterday.errors.length} (см. логи)`);
  }

  return lines.join('\n');
}

async function sendDailyReport(bot) {
  try {
    const stats = await collectStats();
    const text = formatReport(stats);
    await bot.sendMessage(ADMIN_CHAT_ID, text);
    console.log(`[dailyReport] sent at ${new Date().toISOString()}`);
    if (stats.today.errors.length || stats.yesterday.errors.length) {
      [...stats.today.errors, ...stats.yesterday.errors].forEach((e) =>
        console.error('[dailyReport] supabase error:', e)
      );
    }
  } catch (err) {
    console.error('[dailyReport] failed:', err);
    try {
      await bot.sendMessage(ADMIN_CHAT_ID, `Daily report failed: ${err.message}`);
    } catch {}
  }
}

module.exports = { sendDailyReport, collectStats, formatReport, ADMIN_CHAT_ID };
