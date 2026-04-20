# Content Strategy: First 100 Paid Subscriptions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Довести Swipely до 100 платных подписок за 6-8 недель через систематизацию Threads-канала и починку воронки.

**Architecture:** Threads Engine (5 постов/нед) + 4 фикса воронки (активация, чекаут, промокоды/Early Supporter, реф-программа) + affiliate-кампания. Инженерные изменения в `swipely-nextjs`, операционные — как markdown-плейбуки в `docs/`.

**Tech Stack:** Next.js 16 (App Router), React 19, Supabase (auth+DB+RLS), AuraPay, Tailwind v4, PostHog, Node cron через `/api/cron/*` endpoints.

**Source spec:** `docs/superpowers/specs/2026-04-19-content-strategy-first-100-subs-design.md`

---

## File Structure

**Engineering (swipely-nextjs):**

- Create: `swipely-nextjs/app/api/generate/demo/route.ts` — публичный endpoint для демо-генерации без регистрации с rate-limit по IP
- Modify: `swipely-nextjs/components/landing/HeroGenerator.tsx` — поддержка анонимной демо-генерации с watermark
- Create: `swipely-nextjs/lib/email/send.ts` — обёртка Resend для email-ретаргета
- Create: `swipely-nextjs/app/api/cron/payment-reminder-email/route.ts` — email-напоминание брошенных платежей (параллельно существующему telegram payment-reminder)
- Modify: `swipely-nextjs/app/api/payments/create/route.ts` — добавить `creator_yearly_promo` (11940) и `blogger_monthly_promo` (445) продукты; поддержка `affiliate_ref` в метаданных
- Modify: `swipely-nextjs/app/api/webhooks/aurapay/route.ts` — обработка annual промо и Early Supporter auto-apply
- Create: `swipely-nextjs/lib/supabase/migrations/2026-04-19-early-supporter.sql` — таблица `early_supporter_slots` (cap 50)
- Create: `swipely-nextjs/lib/supabase/migrations/2026-04-19-affiliates.sql` — таблицы `affiliates` и `affiliate_referrals`
- Create: `swipely-nextjs/app/api/affiliate/track/route.ts` — прокидка `?ref=slug` в cookie при визите
- Modify: `swipely-nextjs/app/api/auth/signup/route.ts` — запись affiliate_ref из cookie в `profiles.referred_by_affiliate`
- Create: `swipely-nextjs/app/admin/affiliates/page.tsx` — админка аффилиатов
- Modify: `swipely-nextjs/app/pricing/page.tsx` — блок Early Supporter со счётчиком, кнопка Annual Creator -40%
- Create: `swipely-nextjs/app/api/early-supporter/count/route.ts` — текущее число занятых слотов

**Operations (docs):**

- Create: `docs/content-ops/hooks-cookbook.md` — 7 шаблонов крючков × 3 вариации
- Create: `docs/content-ops/weekly-sprint-template.md` — шаблон недельного спринта (копируется каждую неделю)
- Create: `docs/content-ops/publication-rules.md` — железные правила Threads
- Create: `docs/outreach/target-bloggers.md` — список 30 микро-блогеров с контактами (заполняется Владом)
- Create: `docs/outreach/cold-dm-scripts.md` — 3 скрипта холодного outreach + follow-up
- Create: `docs/outreach/affiliate-kit.md` — материалы для партнёров (ссылка, промо-креативы, условия 30% LTV)
- Create: `docs/outreach/affiliate-onboarding.md` — плейбук onboarding нового партнёра

**Measurement:**

- Modify: `swipely-nextjs/app/api/cron/` — добавить `daily-metrics/route.ts` — ежедневный Telegram-отчёт в канал владельца

---

## Prerequisites Before Starting

- [ ] **Step 0.1:** Убедиться что Supabase `profiles` таблица имеет столбцы `referred_by_affiliate` (nullable, text) и `subscription_tier`, `billing_period`, `subscription_expires_at`. Если нет — добавить миграцией.

```sql
-- File: swipely-nextjs/lib/supabase/migrations/2026-04-19-profile-affiliate.sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referred_by_affiliate TEXT NULL,
  ADD COLUMN IF NOT EXISTS referred_by_user UUID NULL REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS billing_period TEXT NULL CHECK (billing_period IN ('monthly', 'yearly')),
  ADD COLUMN IF NOT EXISTS is_early_supporter BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS early_supporter_slot INTEGER NULL,
  ADD COLUMN IF NOT EXISTS first_generation_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS bonus_carousels INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_profiles_referred_by_affiliate ON profiles(referred_by_affiliate) WHERE referred_by_affiliate IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by_user ON profiles(referred_by_user) WHERE referred_by_user IS NOT NULL;
```

**Note:** Если `referred_by_user` или `bonus_carousels` уже существуют (есть файл `app/(dashboard)/referral/page.tsx` — значит ref-система частично реализована), `IF NOT EXISTS` защитит от дубликата. Перед миграцией проверить текущую схему через `mcp__supabase__list_tables` и сравнить.

- [ ] **Step 0.2:** Запустить миграцию через Supabase MCP: `mcp__supabase__apply_migration` с именем `2026-04-19-profile-affiliate`.
- [ ] **Step 0.3:** Проверить наличие `RESEND_API_KEY` в `.env.local`. Если нет — зарегистрироваться на resend.com, получить ключ, добавить:

```
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=hello@swipely.ru
```

- [ ] **Step 0.4:** Commit:

```bash
cd swipely-nextjs
git add lib/supabase/migrations/2026-04-19-profile-affiliate.sql
git commit -m "feat: add profile columns for affiliates and Early Supporter"
```

---

## Phase 1 — Week 1: Activation + Email Retarget + Content Kickoff

### Task 1: Fix 1 — Anonymous demo generation endpoint

**Files:**
- Create: `swipely-nextjs/app/api/generate/demo/route.ts`
- Test: `swipely-nextjs/__tests__/api/generate-demo.test.ts`

- [ ] **Step 1.1: Write failing test for demo endpoint**

Create `swipely-nextjs/__tests__/api/generate-demo.test.ts`:

```typescript
import { POST } from "@/app/api/generate/demo/route";

describe("POST /api/generate/demo", () => {
  it("generates watermarked demo for anonymous user", async () => {
    const req = new Request("http://localhost/api/generate/demo", {
      method: "POST",
      headers: { "x-forwarded-for": "1.2.3.4", "content-type": "application/json" },
      body: JSON.stringify({ topic: "Как начать бегать" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.slides).toBeDefined();
    expect(body.slides.length).toBe(3);
    expect(body.watermark).toBe(true);
  });

  it("rate-limits same IP to 3 requests per hour", async () => {
    const ip = "5.6.7.8";
    for (let i = 0; i < 3; i++) {
      const res = await POST(new Request("http://localhost/api/generate/demo", {
        method: "POST",
        headers: { "x-forwarded-for": ip, "content-type": "application/json" },
        body: JSON.stringify({ topic: "test" }),
      }));
      expect(res.status).toBe(200);
    }
    const blocked = await POST(new Request("http://localhost/api/generate/demo", {
      method: "POST",
      headers: { "x-forwarded-for": ip, "content-type": "application/json" },
      body: JSON.stringify({ topic: "test" }),
    }));
    expect(blocked.status).toBe(429);
  });

  it("rejects empty topic", async () => {
    const res = await POST(new Request("http://localhost/api/generate/demo", {
      method: "POST",
      headers: { "x-forwarded-for": "9.9.9.9", "content-type": "application/json" },
      body: JSON.stringify({ topic: "" }),
    }));
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 1.2: Run test to confirm failure**

Run: `npm test -- generate-demo`
Expected: FAIL ("Cannot find module '@/app/api/generate/demo/route'")

- [ ] **Step 1.3: Implement demo endpoint**

Create `swipely-nextjs/app/api/generate/demo/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { generateStandardContent } from "@/lib/generation/gemini";
import { captureEvent } from "@/lib/posthog";

const DEMO_RATE_LIMIT = 3;
const DEMO_RATE_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  const allowed = await rateLimit(`demo:${ip}`, DEMO_RATE_LIMIT, DEMO_RATE_WINDOW_MS);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = await request.json();
  const topic = (body.topic ?? "").trim();
  if (!topic) {
    return NextResponse.json({ error: "topic required" }, { status: 400 });
  }
  if (topic.length > 200) {
    return NextResponse.json({ error: "topic too long" }, { status: 400 });
  }

  const slides = await generateStandardContent({ topic, slideCount: 3, templateId: "swipely" });

  await captureEvent("demo_generation", { distinct_id: ip, properties: { topic, ip } });

  return NextResponse.json({ slides, watermark: true });
}
```

- [ ] **Step 1.4: Run test, verify PASS**

Run: `npm test -- generate-demo`
Expected: PASS on all 3 test cases.

- [ ] **Step 1.5: Commit**

```bash
git add swipely-nextjs/app/api/generate/demo swipely-nextjs/__tests__/api/generate-demo.test.ts
git commit -m "feat: anonymous demo generation with IP rate limit"
```

---

### Task 2: Fix 1 — Wire demo into HeroGenerator

**Files:**
- Modify: `swipely-nextjs/components/landing/HeroGenerator.tsx`

- [ ] **Step 2.1: Read current HeroGenerator.tsx structure**

Run: `wc -l swipely-nextjs/components/landing/HeroGenerator.tsx`
Then open and identify the form submit handler.

- [ ] **Step 2.2: Add demo mode toggle (if user not authenticated)**

In the submit handler of `HeroGenerator.tsx`, replace direct call to authenticated endpoint with:

```typescript
const endpoint = user ? "/api/generate" : "/api/generate/demo";
const payload = user
  ? { topic, slideCount, templateId }
  : { topic };

const res = await fetch(endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

if (res.status === 429) {
  setError("Ты превысил лимит демо-генераций. Зарегистрируйся, чтобы продолжить.");
  setShowSignupCTA(true);
  return;
}

const data = await res.json();
setSlides(data.slides);
setIsDemoResult(Boolean(data.watermark));
```

- [ ] **Step 2.3: Add watermark overlay component**

Add to HeroGenerator render logic when `isDemoResult === true`:

```tsx
{isDemoResult && (
  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
    <span className="text-white/30 text-4xl font-bold rotate-[-20deg] select-none tracking-wider">
      swipely.ru
    </span>
  </div>
)}
```

And add signup CTA block after slides display:

```tsx
{isDemoResult && (
  <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900 p-6 text-center">
    <p className="text-neutral-300">Скачай без водяного знака — бесплатная регистрация, 3 карусели в подарок.</p>
    <Link href="/signup" className="mt-4 inline-block bg-white text-black px-6 py-3 rounded">
      Скачать без водяного знака
    </Link>
  </div>
)}
```

- [ ] **Step 2.4: Manual test locally**

Run: `cd swipely-nextjs && npm run dev`
Open http://localhost:3000 in incognito window (to be anonymous).
Type topic "Как встать в 6 утра", click generate.
Expected: 3 slides appear with watermark overlay; CTA block below.

- [ ] **Step 2.5: Commit**

```bash
git add swipely-nextjs/components/landing/HeroGenerator.tsx
git commit -m "feat: wire anonymous demo generation with watermark CTA"
```

---

### Task 3: Fix 3 — Email retargeting cron

**Files:**
- Create: `swipely-nextjs/lib/email/send.ts`
- Create: `swipely-nextjs/app/api/cron/payment-reminder-email/route.ts`
- Test: `swipely-nextjs/__tests__/cron/payment-reminder-email.test.ts`

- [ ] **Step 3.1: Write email sender utility**

Create `swipely-nextjs/lib/email/send.ts`:

```typescript
interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailArgs): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "hello@swipely.ru";
  if (!apiKey) {
    console.error("[email] RESEND_API_KEY not set");
    return false;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    console.error("[email] send failed", res.status, await res.text());
    return false;
  }
  return true;
}
```

- [ ] **Step 3.2: Commit email util**

```bash
git add swipely-nextjs/lib/email/send.ts
git commit -m "feat: add Resend email sender utility"
```

- [ ] **Step 3.3: Write cron test**

Create `swipely-nextjs/__tests__/cron/payment-reminder-email.test.ts`:

```typescript
import { GET } from "@/app/api/cron/payment-reminder-email/route";

describe("GET /api/cron/payment-reminder-email", () => {
  it("requires bearer secret", async () => {
    const res = await GET(new Request("http://localhost/api/cron/payment-reminder-email"));
    expect(res.status).toBe(401);
  });

  it("accepts bearer CRON_SECRET", async () => {
    process.env.CRON_SECRET = "test-secret";
    const res = await GET(new Request("http://localhost/api/cron/payment-reminder-email", {
      headers: { authorization: "Bearer test-secret" },
    }));
    expect([200, 500]).toContain(res.status);
  });
});
```

- [ ] **Step 3.4: Implement cron endpoint**

Create `swipely-nextjs/app/api/cron/payment-reminder-email/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";

export const dynamic = "force-dynamic";

const SUBJECT = "Твоя карусель в 1 клике от готовности — скидка 20% до завтра";
const PROMO_CODE = "BACK20";

function buildHtml(firstName: string | null, paymentUrl: string): string {
  const greeting = firstName ? `Привет, ${firstName}.` : "Привет.";
  return `
    <div style="font-family:-apple-system,sans-serif;max-width:500px;margin:0 auto;">
      <p>${greeting}</p>
      <p>Ты начал оплачивать Swipely, но что-то не прошло. Бывает.</p>
      <p>Даём промокод <strong>${PROMO_CODE}</strong> на скидку 20% — применяется автоматически по ссылке ниже:</p>
      <p><a href="${paymentUrl}?promo=${PROMO_CODE}" style="display:inline-block;background:#000;color:#fff;padding:12px 24px;text-decoration:none;">Завершить оплату</a></p>
      <p style="color:#888;font-size:12px;">Если это была ошибка — просто проигнорируй письмо.</p>
    </div>
  `;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: payments, error } = await supabase
    .from("payments")
    .select(`
      id, payment_url, user_id,
      profiles!inner(email, full_name, reminder_email_sent_at)
    `)
    .eq("status", "pending")
    .is("reminder_email_sent_at", null)
    .not("payment_url", "is", null)
    .gte("created_at", new Date(Date.now() - 120 * 60 * 1000).toISOString())
    .lte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  for (const payment of payments ?? []) {
    const profile = payment.profiles as unknown as { email: string; full_name: string | null };
    if (!profile?.email) continue;
    const ok = await sendEmail({
      to: profile.email,
      subject: SUBJECT,
      html: buildHtml(profile.full_name, payment.payment_url!),
    });
    if (ok) {
      await supabase.from("payments").update({ reminder_email_sent_at: new Date().toISOString() }).eq("id", payment.id);
      sent++;
    }
  }

  return NextResponse.json({ sent, total: payments?.length ?? 0 });
}
```

- [ ] **Step 3.5: Add DB column for email reminder tracking**

Create `swipely-nextjs/lib/supabase/migrations/2026-04-19-email-reminder-col.sql`:

```sql
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reminder_email_sent_at TIMESTAMPTZ NULL;
```

Apply via `mcp__supabase__apply_migration` with name `2026-04-19-email-reminder-col`.

- [ ] **Step 3.6: Register cron in cron-job.org**

Manually: add cron at cron-job.org → URL `https://swipely.ru/api/cron/payment-reminder-email` → every 15 min → Bearer header with `CRON_SECRET`.

- [ ] **Step 3.7: Apply BACK20 promo logic in `/api/payments/create`**

Modify `swipely-nextjs/app/api/payments/create/route.ts` (inside POST handler after auth check, before calling AuraPay):

```typescript
const promo = body.promo as string | undefined;
let amount = product.amount;
let description = product.description;

if (promo === "BACK20") {
  amount = Math.round(amount * 0.8);
  description = `${description} (промо BACK20 -20%)`;
}
```

- [ ] **Step 3.8: Commit**

```bash
git add swipely-nextjs/app/api/cron/payment-reminder-email swipely-nextjs/lib/supabase/migrations/2026-04-19-email-reminder-col.sql swipely-nextjs/app/api/payments/create/route.ts
git commit -m "feat: email retarget abandoned payments with BACK20 promo"
```

---

### Task 4: Content Ops — Hooks cookbook

**Files:**
- Create: `docs/content-ops/hooks-cookbook.md`

- [ ] **Step 4.1: Write cookbook file**

Create `docs/content-ops/hooks-cookbook.md`:

```markdown
# Threads Hooks Cookbook — swipely

**Правило:** каждый пост — одна медиа (картинка или карусель). Ссылка только в первом комменте. Первая строка ≤12 слов.

---

## D1 — Находка

**Формула:** Нашёл [прикольный/странный] сервис который [конкретный результат за конкретное время]. [Подробность делающая реальным]. Скинул в комментариях.

- "Нашёл сервис, который сделал мне 10 каруселей за время одного похода за кофе. Скинул в коммент."
- "Наткнулся на прикольную штуку: пишешь голосовым тему — через 20 секунд готовая карусель. Оставил в комментарии."
- "Один сервис заменил мне Canva. Делает карусель за 15 секунд. Ссылка под постом."

## D2 — До / После с цифрой

**Формула:** Раньше [X Y-способом Z-часов]. Теперь [X через сервис W-минут]. [Что изменилось].

- "Раньше тратил 2 часа на карусель в Figma. Сейчас 20 секунд и она уже в телефоне."
- "Делал 1 пост-карусель в день. Теперь 7 за вечер — остаётся время на нормальный контент."
- "На карусель уходило полдня. Теперь один кофе и 10 штук готовы."

## D3 — Скрин результата

**Формула:** [Одна фраза-реакция]. [Что именно — тема карусели]. За 20 секунд.
**Медиа:** реальная карусель из swipely, 1 слайд.

- "Это я написал одну тему. Карусель сделал сервис за 20 секунд."
- "Вот что получается, когда пишешь голосовым 'топ-5 ошибок начинающих'."
- "Одна тема → 7 слайдов → готовый пост. 20 секунд."

## P1 — Цифра-провокация

**Формула:** [Шокирующая метрика] — и вот почему [контринтуитивный вывод].

- "Мои карусели получают в 5 раз больше охвата чем reels. И я больше не снимаю видео."
- "10% вовлечённости на карусель против 1.2% на обычный пост. Это не мнение, это данные Meta."
- "Reels — 3 часа работы. Карусель — 20 секунд. Одинаковый охват. Арифметика простая."

## P2 — Разбор чужого поста

**Формула:** Вот пост который набрал [X]. Разберу почему. [3 пункта]. Главное — [применимо к карусели].

- "Вот карусель, которая набрала 50К охвата. Разберу почему: 1) цепляющий первый слайд, 2) цифра во втором, 3) провокационный вывод. Любая карусель по этой формуле работает."

## P3 — Эксперимент

**Формула:** Неделю [делал X]. Вот что получилось. [Цифры до/после в картинке].
**Медиа:** график / скрин дашборда.

- "Неделю публиковал только карусели, без Reels. Охват вырос в 2.3 раза. График в картинке."

## P4 — Мнение против нормы

**Формула:** Все советуют [X]. Это худший совет для [Y]. Вот что работает вместо.

- "Все советуют снимать Reels каждый день. Это худший совет для эксперта. Ты выгораешь за 2 недели и бросаешь. Вместо этого — 1 карусель в день на тему, в которой ты силён."

---

## Ссылка в комменте (стандарт)

Первый комментарий от @vladlyamin под своим постом:
> swipely.ru

(без точки, без "вот", без эмодзи — только URL)

## Early Supporter urgency (в текст поста, а не коммент)

В 1-2 постах из 5 в неделю добавляем строку:
> Первые 50 платных — скидка 30% на полгода. Осталось мест: [N].

Число слотов — из `/api/early-supporter/count` или вручную, если ещё не выкачено.
```

- [ ] **Step 4.2: Commit**

```bash
cd "/Users/lvmn/Desktop/Бизнес/02_SaaS_Продукты/ai projects /swipely "
git add docs/content-ops/hooks-cookbook.md
git commit -m "docs: add Threads hooks cookbook with 7 templates"
```

---

### Task 5: Content Ops — Weekly sprint template

**Files:**
- Create: `docs/content-ops/weekly-sprint-template.md`
- Create: `docs/content-ops/publication-rules.md`

- [ ] **Step 5.1: Write weekly sprint template**

Create `docs/content-ops/weekly-sprint-template.md`:

```markdown
# Weekly Sprint Template — Threads @vladlyamin

**Копия:** `cp docs/content-ops/weekly-sprint-template.md docs/content-ops/sprints/YYYY-WW.md`

## Неделя [ISO week], даты [YYYY-MM-DD]—[YYYY-MM-DD]

### Планирование (воскресенье)

- [ ] Открыл `hooks-cookbook.md`
- [ ] Открыл аналитику прошлой недели (метрики ниже)
- [ ] Выбрал 5 тем на неделю с распределением 70/30 (3-4 D × 1-2 P)

### Календарь постов

| День | Время (МСК) | Шаблон | Тема / крючок | Медиа | Опубликован |
|------|-------------|--------|---------------|-------|-------------|
| Пн | 10:30 | D1 | | | [ ] |
| Вт | 10:30 | D2 | | | [ ] |
| Ср | 10:30 | P1 | | | [ ] |
| Чт | 10:30 | D3 | | | [ ] |
| Сб | 10:30 | P2/P4 (на выбор) | | | [ ] |

### Ответы на комменты

Правило: ответить на первые 5 комментов в течение 2 часов после публикации.

- [ ] Пн — активный час
- [ ] Вт — активный час
- [ ] Ср — активный час
- [ ] Чт — активный час
- [ ] Сб — активный час

### Метрики недели (заполнить в воскресенье)

| Пост | Views | Likes | Shares | Replies | Клики по ссылке (из UTM/referrer) |
|------|-------|-------|--------|---------|-----------------------------------|
| Пн | | | | | |
| Вт | | | | | |
| Ср | | | | | |
| Чт | | | | | |
| Сб | | | | | |

**Best post:** [какой и почему]
**Worst post:** [какой и почему]
**Формат, который переносим в следующую неделю:** [какой]

### Продуктовые метрики недели

| Метрика | Значение |
|---------|----------|
| Новых регистраций | |
| Free→1+ген | |
| Free→Paid | |
| Новых платных | |
| MRR | |
| Ретаргет-email отправлено/конверсия | |

### Решения на следующую неделю

- [решение 1]
- [решение 2]
```

- [ ] **Step 5.2: Create publication-rules.md**

Create `docs/content-ops/publication-rules.md`:

```markdown
# Threads Publication Rules — swipely

## Железные правила

1. **Всегда с медиа.** Пост без картинки режется алгоритмом. Медиа: реальный скрин карусели, сама карусель (1 слайд), мем/сравнение, дашборд-скрин для POV.
2. **Ссылка в первом комменте, не в теле.** Threads душит внешние ссылки в основном теле.
3. **Первая строка ≤ 12 слов.** Иначе скрывается под "More".
4. **Без эмодзи.** Как в brand voice. Работает лучше.
5. **Без хештегов.** В Threads они не помогают охватам.
6. **Имя бренда строчными:** swipely. Не Swipely, не SWIPELY.
7. **Цифры без оговорок:** "10%", "2.3×", "20 секунд". Не "примерно", не "в среднем".
8. **A/B крючков:** один тейк публикуется в 2-3 переформулировках в течение 10 дней. НЕ удаляешь предыдущие.
9. **Repost own posts через 2-3 недели** — Threads не штрафует, новые зрители видят впервые.
10. **Ответы на комменты** — первые 5 в течение 2 часов после публикации (алгоритм вознаграждает ранние ответы автора).

## Не делать

- Не писать в стиле "Привет! Хочу поделиться..." — слабый открыватель.
- Не использовать восклицательные знаки как инструмент убеждения.
- Не использовать слово "просто" — снисходительно.
- Не начинать с "мы" — бренд говорит от первого лица (Влад).
- Не писать посты длиннее 300 символов без веской причины.

## Тайминг

- Публикация: 10:00-11:00 МСК (проверено на виральных постах марта 2026).
- Ответы автора: первые 2 часа критичны.
- Ре-ап: через 2-3 недели для постов с >5K views.

## Что делаем если пост "не зашёл" (<2K views за 24 часа)

- НЕ удаляем.
- Через 2-3 недели — публикуем другую формулировку того же тезиса.
- Если 3 поста подряд <2K — пересматриваем хук-формат на неделе.
```

- [ ] **Step 5.3: Commit**

```bash
git add docs/content-ops/weekly-sprint-template.md docs/content-ops/publication-rules.md
git commit -m "docs: add weekly sprint template and publication rules"
```

---

### Task 6: Content Ops — Week 1 sprint (execute)

**Files:**
- Create: `docs/content-ops/sprints/2026-W17.md` (реальный спринт недели 17 = 2026-04-20..04-26)

- [ ] **Step 6.1: Copy weekly template to sprint file**

```bash
cp docs/content-ops/weekly-sprint-template.md docs/content-ops/sprints/2026-W17.md
```

- [ ] **Step 6.2: Заполнить 5 тем на неделю**

Открыть `docs/content-ops/sprints/2026-W17.md` и вписать 5 крючков из cookbook. Рекомендация для первой недели — только D1 и один P1, чтобы подтвердить работу проверенного механизма без рисков:

| День | Шаблон | Пример крючка |
|------|--------|---------------|
| Пн 21.04 | D1 | "Нашёл сервис, который пишет карусели по голосовому сообщению. 20 секунд — готово." |
| Вт 22.04 | D1 | "Один сервис заменил мне Canva. Делает карусель за 15 секунд. Не верил, пока не попробовал." |
| Ср 23.04 | P1 | "10% вовлечённости на карусель против 1.2% на обычный пост. Это данные Meta, не моё мнение." |
| Чт 24.04 | D2 | "Раньше тратил 2 часа на карусель. Сейчас 20 секунд. Освободилось 10 часов в неделю." |
| Сб 26.04 | D1 | "Нашёл прикольный способ делать карусели — пишешь тему, получаешь PNG. За время кофе — 5 штук." |

- [ ] **Step 6.3: Подготовить медиа-активы**

Для каждого из 5 постов сгенерировать 1 карусель в swipely и сохранить PNG слайда 1 для медиа. Папка `content-ops/media/2026-W17/`.

- [ ] **Step 6.4: Commit спринт-файл (без медиа, их в .gitignore)**

```bash
git add docs/content-ops/sprints/2026-W17.md
git commit -m "docs: week 17 content sprint plan"
```

- [ ] **Step 6.5: Публикация Пн 21.04 10:30 МСК**

Вручную: Threads app → создать пост → вставить текст → прикрепить медиа → опубликовать → сразу же оставить первый комментарий "swipely.ru".

---

### Task 7: Outreach — Target bloggers list

**Files:**
- Create: `docs/outreach/target-bloggers.md`

- [ ] **Step 7.1: Создать шаблон списка**

Create `docs/outreach/target-bloggers.md`:

```markdown
# Target Micro-Bloggers — Affiliate Campaign

**Цель:** 15-20 активных аффилиатов к концу недели 3.
**Комиссия:** 30% LTV (cap 12 месяцев на привлечённого юзера).
**Критерии ЦА блогера:**
- 5-30К фолловеров в Threads / Instagram / Telegram
- Тематика: контент-маркетинг, эксперты, малый бизнес, блогинг, маркетинг в соцсетях
- Русскоязычная аудитория
- Активность в последние 30 дней

## Список (заполнение — Влад, неделя 1)

| # | Имя / Handle | Платформа | Подписчиков | Тематика | Контакт | Статус |
|---|--------------|-----------|-------------|----------|---------|--------|
| 1 | | | | | | не написал |
| 2 | | | | | | не написал |
| 3 | | | | | | не написал |

Статусы: `не написал` / `написал DD.MM` / `ответил` / `согласился` / `активен` / `отказ`.

## Источники для поиска

- Threads: поиск по ключам "карусели", "instagram эксперт", "контент", "блогинг советы"
- Telegram: каналы в категории "Бизнес/Маркетинг" на TGStat.ru с 5-30К
- Instagram: hashtag #карусели #сммменеджер (осторожно — много ботов)
- Нетворк LVMN: выписать 10 знакомых с релевантной аудиторией
```

- [ ] **Step 7.2: Commit**

```bash
git add docs/outreach/target-bloggers.md
git commit -m "docs: add target bloggers list template for affiliate outreach"
```

- [ ] **Step 7.3: Заполнить минимум 15 строк (Влад, оффлайн-работа)**

Это не код-задача. Открыть `target-bloggers.md` и внести первых 15 кандидатов на основе поиска по источникам выше. Рекомендуется 30, чтобы с запасом на отказы.

---

### Task 7b: LVMN-TG cross-promo post (one-shot, week 1)

**Files:**
- Create: `docs/content-ops/lvmn-crosspromo-post.md` (черновик поста)

- [ ] **Step 7b.1: Написать пост для LVMN-TG канала**

Create `docs/content-ops/lvmn-crosspromo-post.md`:

```markdown
# LVMN-TG Cross-Promo Post

**Публикация:** один раз, в неделе 1 (четверг 10:00 МСК — когда канал активен).

## Пост

> Последние 2 месяца в свободное время собираю сайд-проект — swipely.
> Это AI-генератор каруселей для соцсетей: пишешь тему, через 20 секунд получаешь PNG-карусель. Без Canva, без дизайнера.
>
> 517 пользователей за 1.5 месяца без рекламы, одним виральным постом в Threads. Сейчас делаю честный запуск:
> — первым 50 платным — скидка 30% на полгода
> — тариф Creator (годовой) — 11 940 ₽ вместо 19 900 до конца недели
>
> Попробовать: swipely.ru
>
> [Скрин дашборда MRR или реальной сгенерированной карусели]

## Почему именно этот пост

- Аудитория LVMN — про автоматизацию, не карусели. Поэтому позиционируем как "сайд-проект с реальными цифрами", а не как рекламу SaaS.
- Реальные цифры (517 юзеров, 58 рег с одного поста) работают в LVMN-аудитории лучше чем маркетинг-обещания.
- Один раз за всю кампанию. Не превращаем LVMN-канал в промо-канал Swipely.
```

- [ ] **Step 7b.2: Опубликовать в LVMN-TG (вручную)**

- [ ] **Step 7b.3: Отследить клики через UTM или referrer logs**

- [ ] **Step 7b.4: Commit**

```bash
git add docs/content-ops/lvmn-crosspromo-post.md
git commit -m "docs: LVMN cross-promo post draft for week 1"
```

---

### Task 8: Outreach — Cold DM scripts

**Files:**
- Create: `docs/outreach/cold-dm-scripts.md`

- [ ] **Step 8.1: Create cold DM scripts file**

Create `docs/outreach/cold-dm-scripts.md`:

```markdown
# Cold DM Scripts — Affiliate Outreach

## Принцип

- Коротко. ≤3 предложений в первом сообщении.
- Персонально. Хотя бы одна строка про конкретный пост/проект блогера.
- Без "Привет, надеюсь ты хорошо себя чувствуешь". Сразу к делу.
- Оффер звучит как *возможность*, не как *просьба*.

## Script A — для Threads (холодный DM)

> [Имя], смотрю твои посты про [конкретная тема]. Делаю сервис swipely.ru — генерация каруселей за 20 секунд.
> Запустил партнёрку: 30% LTV с каждой подписки твоего подписчика, платим 12 месяцев.
> Если интересно — кину детали и реф-ссылку, сам попробуешь бесплатно.

## Script B — для Telegram (чуть теплее)

> [Имя], привет. Нашёл твой канал через [источник].
> Веду swipely — AI-генератор каруселей для соцсетей. За последний месяц 58 регистраций с одного поста в Threads, но скейлиться через рефералов пока не пробовал.
> Предложение: бесплатный Creator на 3 месяца + 30% с каждой оплаты твоего подписчика (12 мес). Без нижнего порога, кэшбек на карту раз в месяц.
> Если зайдёт — отправлю пакет: ссылка, пара примеров постов, дашборд статистики.

## Script C — для Instagram DM (короче)

> Привет. Делаю swipely.ru — карусели за 20 сек.
> Ищу 10 блогеров для партнёрки 30% LTV. Твоя аудитория подходит. Интересно?

## Follow-up через 3 дня (если не ответили)

> Напомню про swipely и партнёрку. Если не актуально — просто скажи, не буду беспокоить.

## Follow-up через 7 дней после согласия, но без активности

> [Имя], ты согласился на партнёрку swipely неделю назад. Всё ок? Если нужна помощь с материалами для поста — пришлю.

## Сообщение после первого оплатившего подписчика партнёра

> [Имя], у тебя первая оплата по реф-ссылке: +[сумма] в баланс.
> Закрепим на следующем выплатном цикле. Продолжай — ты в топ-3 партнёров по конверсии.
```

- [ ] **Step 8.2: Commit**

```bash
git add docs/outreach/cold-dm-scripts.md
git commit -m "docs: add cold DM scripts for affiliate outreach"
```

---

## Phase 2 — Week 2: AuraPay Mobile Audit + Annual Creator Promo + Content

### Task 9: AuraPay mobile checkout audit

**Files:**
- Create: `swipely-nextjs/__tests__/e2e/checkout-mobile.spec.ts`

- [ ] **Step 9.1: Write Playwright mobile checkout test**

Create `swipely-nextjs/__tests__/e2e/checkout-mobile.spec.ts`:

```typescript
import { test, expect, devices } from "@playwright/test";

test.use({ ...devices["iPhone 14 Pro"] });

test("mobile checkout flow — creator_monthly", async ({ page, context }) => {
  await context.addCookies([{ name: "sb-auth-test", value: "STAGING_TEST_SESSION", domain: "localhost", path: "/" }]);

  await page.goto("http://localhost:3000/pricing");
  await expect(page.getByRole("heading", { name: /Тарифы/i })).toBeVisible();

  const creatorButton = page.getByRole("button", { name: /Про|Creator/i }).first();
  await expect(creatorButton).toBeVisible();
  await creatorButton.tap();

  await page.waitForURL(/aurapay|payment/, { timeout: 10000 });
  await expect(page.locator("body")).not.toContainText(/Error|Ошибка/);
});

test("mobile paywall after 3 generations shows Early Supporter offer", async ({ page }) => {
  await page.goto("http://localhost:3000/dashboard/pricing");
  const supporterBlock = page.locator('[data-testid="early-supporter-offer"]');
  await expect(supporterBlock).toBeVisible();
});
```

- [ ] **Step 9.2: Run test on staging/local**

Run: `cd swipely-nextjs && npx playwright test __tests__/e2e/checkout-mobile.spec.ts`
Fix any failures found. Typical issues: AuraPay redirect URL doesn't return user to site (fix callback URL), buttons too small on mobile (fix min-width), payment form fields overflow viewport.

- [ ] **Step 9.3: Document findings**

Create `docs/qa/2026-04-mobile-checkout-findings.md`:

```markdown
# Mobile Checkout Audit — AuraPay

**Date:** 2026-04-[X]
**Tested device:** iPhone 14 Pro (viewport 393×852)

## Issues Found

- [ ] Issue 1: [description] — Fixed in commit [sha]
- [ ] Issue 2: [description] — Fixed in commit [sha]

## Regressions prevented

List of tests added to CI to prevent regression.
```

- [ ] **Step 9.4: Commit test + fixes + report**

```bash
git add swipely-nextjs/__tests__/e2e/checkout-mobile.spec.ts docs/qa/2026-04-mobile-checkout-findings.md
git commit -m "test: mobile checkout Playwright flow + audit report"
```

---

### Task 10: Add Annual Creator promo product

**Files:**
- Modify: `swipely-nextjs/app/api/payments/create/route.ts`
- Modify: `swipely-nextjs/app/pricing/page.tsx`

- [ ] **Step 10.1: Add product to PRODUCTS map**

In `swipely-nextjs/app/api/payments/create/route.ts`, add entry to PRODUCTS:

```typescript
creator_yearly_promo: {
  amount: 11940,
  description: "Swipely Про — годовая подписка (промо -40%, Creator за цену Start)",
  type: "subscription",
},
blogger_monthly_promo: {
  amount: 445,
  description: "Swipely Блогер — первый месяц (промо -50%)",
  type: "subscription",
},
```

- [ ] **Step 10.2: Update webhook to mark annual subscription**

Read `swipely-nextjs/app/api/webhooks/aurapay/route.ts`. In the success handler, where `subscription_tier` is set, add logic:

```typescript
let billing_period = "monthly";
let subscription_expires_at: Date;
const now = new Date();

if (product_type === "creator_yearly_promo" || product_type === "creator_yearly") {
  billing_period = "yearly";
  subscription_expires_at = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
} else if (product_type === "blogger_yearly") {
  billing_period = "yearly";
  subscription_expires_at = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
} else {
  subscription_expires_at = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
}

await supabase.from("profiles").update({
  subscription_tier: product_type.startsWith("creator_") ? "creator" : "start",
  billing_period,
  subscription_expires_at: subscription_expires_at.toISOString(),
}).eq("user_id", user_id);
```

- [ ] **Step 10.3: Add Annual Creator button to pricing page**

In `swipely-nextjs/app/pricing/page.tsx`, find the Creator tier card. Add a secondary button:

```tsx
<Link
  href="/api/payments/create"
  onClick={(e) => {
    e.preventDefault();
    handleBuy("creator_yearly_promo");
  }}
  className="mt-2 block text-center text-sm underline text-neutral-500 hover:text-neutral-900"
>
  Или купи год за 11 940 ₽ — Creator по цене Start (−40%)
</Link>
```

Where `handleBuy` calls `/api/payments/create` with the product ID.

- [ ] **Step 10.4: Test manually**

Run: `cd swipely-nextjs && npm run dev`. Open `/pricing` as authenticated user. Click "Или купи год за 11 940 ₽". Expect redirect to AuraPay with amount 11940.

- [ ] **Step 10.5: Commit**

```bash
git add swipely-nextjs/app/api/payments/create/route.ts swipely-nextjs/app/api/webhooks/aurapay/route.ts swipely-nextjs/app/pricing/page.tsx
git commit -m "feat: add Annual Creator promo (11940/yr) and Blogger first-month promo (445)"
```

---

### Task 11: Content Ops — Week 2 sprint

**Files:**
- Create: `docs/content-ops/sprints/2026-W18.md`

- [ ] **Step 11.1: Заполнить по шаблону**

Copy template, выбрать 5 крючков. Неделя 2 — добавить D2 и один P-пост (эксперимент / цифра).

- [ ] **Step 11.2: В Ср или Чт — первый POV-пост с цифрами**

Использовать данные за неделю 1: сколько регистраций принёс Threads, сколько апдейтов/метрик. Пример:

> Неделю назад починил демо-генерацию на лендинге. Free→первая карусель выросло с 32% до [X]%. Ничего кроме убрать шаг регистрации до результата. [Скрин графика.]

- [ ] **Step 11.3: Publish & track as per rules**

---

### Task 12: Outreach — 30 cold DMs отправлены

**Files:**
- Update: `docs/outreach/target-bloggers.md` (статусы)

- [ ] **Step 12.1: Открыть список, выбрать первые 30 строк**

- [ ] **Step 12.2: Отправить Script A или B каждому (в зависимости от платформы)**

Темпо: 5-6 DM в день × 5 дней = 30.

- [ ] **Step 12.3: Обновить статус в target-bloggers.md после каждой отправки**

- [ ] **Step 12.4: Follow-up через 3 дня для не ответивших** (Script D)

- [ ] **Step 12.5: Commit статусов раз в день**

```bash
git add docs/outreach/target-bloggers.md
git commit -m "chore: week 2 affiliate outreach status update"
```

---

## Phase 3 — Week 3: Early Supporter + Affiliate Infrastructure

### Task 13: Early Supporter DB + API

**Files:**
- Create: `swipely-nextjs/lib/supabase/migrations/2026-04-26-early-supporter.sql`
- Create: `swipely-nextjs/app/api/early-supporter/count/route.ts`
- Create: `swipely-nextjs/__tests__/api/early-supporter.test.ts`

- [ ] **Step 13.1: DB migration**

Create `swipely-nextjs/lib/supabase/migrations/2026-04-26-early-supporter.sql`:

```sql
CREATE OR REPLACE FUNCTION claim_early_supporter_slot(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_slot INTEGER;
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM profiles WHERE is_early_supporter = TRUE;
  IF v_count >= 50 THEN
    RETURN -1;
  END IF;

  UPDATE profiles
    SET is_early_supporter = TRUE,
        early_supporter_slot = v_count + 1
    WHERE user_id = p_user_id AND is_early_supporter = FALSE
    RETURNING early_supporter_slot INTO v_slot;

  RETURN COALESCE(v_slot, -1);
END;
$$;
```

Apply via `mcp__supabase__apply_migration` name `2026-04-26-early-supporter`.

- [ ] **Step 13.2: Write test for count endpoint**

Create `swipely-nextjs/__tests__/api/early-supporter.test.ts`:

```typescript
import { GET } from "@/app/api/early-supporter/count/route";

describe("GET /api/early-supporter/count", () => {
  it("returns remaining slots as integer", async () => {
    const res = await GET();
    const body = await res.json();
    expect(typeof body.remaining).toBe("number");
    expect(typeof body.taken).toBe("number");
    expect(body.remaining + body.taken).toBe(50);
  });
});
```

- [ ] **Step 13.3: Implement count endpoint**

Create `swipely-nextjs/app/api/early-supporter/count/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET() {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_early_supporter", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const taken = count ?? 0;
  const remaining = Math.max(0, 50 - taken);
  return NextResponse.json({ taken, remaining });
}
```

- [ ] **Step 13.4: Wire Early Supporter claim into webhook**

In `swipely-nextjs/app/api/webhooks/aurapay/route.ts`, after successful payment update, call RPC:

```typescript
const { data: slotData } = await supabase.rpc("claim_early_supporter_slot", { p_user_id: user_id });
const slot = slotData as number;

if (slot > 0) {
  await supabase.from("profiles").update({
    subscription_expires_at: new Date(now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
  }).eq("user_id", user_id);
}
```

This gives first 50 paid users 6 months subscription on first payment (30% discount = half price for 6 months is economically ≈ 3 months free).

- [ ] **Step 13.5: Add Early Supporter card to pricing page**

In `swipely-nextjs/app/pricing/page.tsx`, add above the tier cards:

```tsx
const [earlySupporter, setEarlySupporter] = useState<{ remaining: number; taken: number } | null>(null);

useEffect(() => {
  fetch("/api/early-supporter/count").then(r => r.json()).then(setEarlySupporter);
}, []);

{earlySupporter && earlySupporter.remaining > 0 && (
  <div
    data-testid="early-supporter-offer"
    className="mb-8 rounded-lg border border-neutral-900 bg-neutral-900 p-6 text-white"
  >
    <div className="text-sm uppercase tracking-wider opacity-60">Early Supporter</div>
    <div className="mt-2 text-2xl">
      Первым 50 — скидка 30% на 6 месяцев + бэйдж в профиле
    </div>
    <div className="mt-4 text-sm">
      Осталось: <strong>{earlySupporter.remaining}</strong> из 50
    </div>
  </div>
)}
```

- [ ] **Step 13.6: Run tests + manual check**

Run: `npm test -- early-supporter`
Expected: PASS.

Open `/pricing` — баннер должен появиться если remaining > 0.

- [ ] **Step 13.7: Commit**

```bash
git add swipely-nextjs/lib/supabase/migrations/2026-04-26-early-supporter.sql swipely-nextjs/app/api/early-supporter swipely-nextjs/app/api/webhooks/aurapay/route.ts swipely-nextjs/app/pricing/page.tsx swipely-nextjs/__tests__/api/early-supporter.test.ts
git commit -m "feat: Early Supporter slot system with 50-user cap"
```

---

### Task 14: Affiliate tracking system

**Files:**
- Create: `swipely-nextjs/lib/supabase/migrations/2026-04-26-affiliates.sql`
- Create: `swipely-nextjs/app/api/affiliate/track/route.ts`
- Modify: `swipely-nextjs/app/api/auth/signup/route.ts`
- Modify: `swipely-nextjs/app/api/webhooks/aurapay/route.ts`

- [ ] **Step 14.1: DB migration — affiliates tables**

Create `swipely-nextjs/lib/supabase/migrations/2026-04-26-affiliates.sql`:

```sql
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  owner_email TEXT NOT NULL,
  owner_name TEXT,
  commission_rate NUMERIC(3,2) NOT NULL DEFAULT 0.30,
  payout_method TEXT,
  payout_details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_slug TEXT NOT NULL REFERENCES affiliates(slug),
  referred_user_id UUID NOT NULL REFERENCES auth.users(id),
  signed_up_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_paid_at TIMESTAMPTZ,
  total_paid_rub INTEGER NOT NULL DEFAULT 0,
  total_commission_rub INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '12 months'),
  UNIQUE(affiliate_slug, referred_user_id)
);

CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_user ON affiliate_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_slug ON affiliate_referrals(affiliate_slug);
```

Apply via `mcp__supabase__apply_migration` name `2026-04-26-affiliates`.

- [ ] **Step 14.2: Track endpoint (sets cookie)**

Create `swipely-nextjs/app/api/affiliate/track/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("ref");
  const redirect = url.searchParams.get("r") ?? "/";
  if (!slug) {
    return NextResponse.redirect(new URL(redirect, url.origin));
  }

  const supabase = createAdminClient();
  const { data } = await supabase.from("affiliates").select("slug").eq("slug", slug).eq("active", true).maybeSingle();

  const response = NextResponse.redirect(new URL(redirect, url.origin));
  if (data?.slug) {
    response.cookies.set({
      name: "aff_ref",
      value: data.slug,
      maxAge: 30 * 24 * 60 * 60,
      httpOnly: false,
      sameSite: "lax",
      path: "/",
    });
  }
  return response;
}
```

- [ ] **Step 14.3: Read cookie in signup**

Modify `swipely-nextjs/app/api/auth/signup/route.ts`. In the POST handler, after creating the user, read cookie and record referral:

```typescript
import { cookies } from "next/headers";

const cookieStore = await cookies();
const aff_ref = cookieStore.get("aff_ref")?.value;

if (aff_ref) {
  await adminSupabase.from("profiles").update({ referred_by_affiliate: aff_ref }).eq("user_id", newUser.id);
  await adminSupabase.from("affiliate_referrals").insert({
    affiliate_slug: aff_ref,
    referred_user_id: newUser.id,
  });
}
```

- [ ] **Step 14.4: Credit commission on payment webhook**

In `swipely-nextjs/app/api/webhooks/aurapay/route.ts` success handler, after subscription activated:

```typescript
const { data: profile } = await supabase
  .from("profiles")
  .select("referred_by_affiliate")
  .eq("user_id", user_id)
  .single();

if (profile?.referred_by_affiliate) {
  const { data: aff } = await supabase
    .from("affiliates")
    .select("commission_rate")
    .eq("slug", profile.referred_by_affiliate)
    .single();

  const commission = Math.floor(paid_amount * Number(aff?.commission_rate ?? 0.30));

  await supabase.rpc("increment_affiliate_referral", {
    p_slug: profile.referred_by_affiliate,
    p_user_id: user_id,
    p_paid: paid_amount,
    p_commission: commission,
  });
}
```

Need matching SQL function:

```sql
CREATE OR REPLACE FUNCTION increment_affiliate_referral(
  p_slug TEXT, p_user_id UUID, p_paid INTEGER, p_commission INTEGER
) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE affiliate_referrals SET
    first_paid_at = COALESCE(first_paid_at, NOW()),
    total_paid_rub = total_paid_rub + p_paid,
    total_commission_rub = total_commission_rub + p_commission
  WHERE affiliate_slug = p_slug AND referred_user_id = p_user_id AND expires_at > NOW();
END;
$$;
```

Добавить в ту же миграцию `2026-04-26-affiliates.sql`.

- [ ] **Step 14.5: Commit**

```bash
git add swipely-nextjs/lib/supabase/migrations/2026-04-26-affiliates.sql swipely-nextjs/app/api/affiliate swipely-nextjs/app/api/auth/signup/route.ts swipely-nextjs/app/api/webhooks/aurapay/route.ts
git commit -m "feat: affiliate tracking with 30% LTV commission (12 month cap)"
```

---

### Task 15: Affiliate admin dashboard

**Files:**
- Create: `swipely-nextjs/app/admin/affiliates/page.tsx`
- Create: `swipely-nextjs/app/admin/affiliates/actions.ts`

- [ ] **Step 15.1: Create server actions**

Create `swipely-nextjs/app/admin/affiliates/actions.ts`:

```typescript
"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function createAffiliate(formData: FormData) {
  const supabase = createAdminClient();
  const slug = String(formData.get("slug")).toLowerCase().replace(/[^a-z0-9-]/g, "");
  const email = String(formData.get("email"));
  const name = String(formData.get("name") ?? "");
  const rate = parseFloat(String(formData.get("rate") ?? "0.30"));

  if (!slug || !email) throw new Error("slug and email required");

  const { error } = await supabase.from("affiliates").insert({
    slug, owner_email: email, owner_name: name, commission_rate: rate,
  });
  if (error) throw error;
  revalidatePath("/admin/affiliates");
}
```

- [ ] **Step 15.2: Create dashboard page**

Create `swipely-nextjs/app/admin/affiliates/page.tsx`:

```tsx
import { createAdminClient } from "@/lib/supabase/admin";
import { createAffiliate } from "./actions";

export default async function AffiliatesAdmin() {
  const supabase = createAdminClient();
  const { data: affiliates } = await supabase
    .from("affiliates")
    .select("slug, owner_email, owner_name, commission_rate, active, created_at")
    .order("created_at", { ascending: false });

  const slugs = (affiliates ?? []).map(a => a.slug);
  const { data: stats } = slugs.length
    ? await supabase.rpc("affiliate_stats_by_slug", { slugs })
    : { data: [] };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl mb-6">Аффилиаты</h1>

      <form action={createAffiliate} className="mb-8 space-y-2 border border-neutral-800 p-4 rounded">
        <input name="slug" placeholder="slug (latin-only, lowercase)" className="w-full border p-2" />
        <input name="email" placeholder="Email" type="email" className="w-full border p-2" />
        <input name="name" placeholder="Имя" className="w-full border p-2" />
        <input name="rate" placeholder="Комиссия (default 0.30)" className="w-full border p-2" defaultValue="0.30" />
        <button type="submit" className="bg-black text-white px-4 py-2 rounded">Создать</button>
      </form>

      <table className="w-full text-sm">
        <thead><tr>
          <th className="text-left">Slug</th><th>Имя</th><th>Реф</th><th>Оплатило</th><th>Комиссия</th><th>Ссылка</th>
        </tr></thead>
        <tbody>
          {(affiliates ?? []).map((a) => {
            const s = (stats ?? []).find((x: any) => x.affiliate_slug === a.slug);
            return (
              <tr key={a.slug}>
                <td>{a.slug}</td>
                <td>{a.owner_name}</td>
                <td>{s?.total_referrals ?? 0}</td>
                <td>{s?.total_paid ?? 0}</td>
                <td>{s?.total_commission ?? 0} ₽</td>
                <td><code>https://swipely.ru/api/affiliate/track?ref={a.slug}&r=/</code></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 15.3: Add stats RPC**

В миграции `2026-04-26-affiliates.sql`:

```sql
CREATE OR REPLACE FUNCTION affiliate_stats_by_slug(slugs TEXT[])
RETURNS TABLE(affiliate_slug TEXT, total_referrals BIGINT, total_paid BIGINT, total_commission BIGINT)
LANGUAGE sql AS $$
  SELECT affiliate_slug,
         COUNT(*),
         COALESCE(SUM(total_paid_rub), 0),
         COALESCE(SUM(total_commission_rub), 0)
  FROM affiliate_referrals
  WHERE affiliate_slug = ANY(slugs)
  GROUP BY affiliate_slug;
$$;
```

Re-apply migration.

- [ ] **Step 15.4: Commit**

```bash
git add swipely-nextjs/app/admin/affiliates swipely-nextjs/lib/supabase/migrations/2026-04-26-affiliates.sql
git commit -m "feat: affiliate admin dashboard with stats"
```

---

### Task 16: Outreach — Affiliate kit + onboarding

**Files:**
- Create: `docs/outreach/affiliate-kit.md`
- Create: `docs/outreach/affiliate-onboarding.md`

- [ ] **Step 16.1: Affiliate kit**

Create `docs/outreach/affiliate-kit.md`:

```markdown
# Swipely Affiliate Kit

## Сколько и как

- **Комиссия:** 30% от каждой оплаты твоего подписчика.
- **Срок:** первые 12 месяцев жизни реф-юзера.
- **Выплаты:** раз в месяц, на карту или перевод. Кэшбэк 5-го числа за предыдущий месяц.
- **Минимум для выплаты:** 500 ₽ (ниже — переносится на следующий месяц).

## Как работает

1. Даю тебе уникальную ссылку: `https://swipely.ru/?ref=[твой_slug]`
2. Ты постишь где угодно — Threads, Telegram, Instagram, YouTube, сайт.
3. Когда человек переходит → регистрируется → платит → ты получаешь 30% от каждой его оплаты.
4. Статистика — доступ в личный кабинет партнёра (в разработке, пока шлю скрины раз в неделю).

## Ты получаешь бесплатно

- Creator tariff на 3 месяца (1990 ₽/мес ценность — 5970 ₽ за 3 мес).
- Доступ к закрытому каналу для партнёров (советы по контенту).
- Право использовать кейсы из своих постов в маркетинге свыше 100К охвата → бонус 3000 ₽.

## Материалы (скинуто отдельно)

- 3 готовых поста для Threads (текст + PNG-карусель с результатом).
- 2 готовых Stories для Instagram (JPG 1080×1920).
- Скрин-демо видео 30 сек для TikTok/Reels (MP4).
- Логотип swipely (PNG, SVG).

## Что НЕ делаем

- Не спамим в личку незнакомым людям.
- Не создаём фейковые отзывы.
- Не покупаем рекламу от имени swipely без согласования.
- Не даём обещания которые нельзя проверить ("за 1 день 10000 подписчиков").

Нарушение = прекращение партнёрства без выплаты накопленного баланса.

## Контакт

Вопросы и выплаты — @vladlyamin в Telegram.
```

- [ ] **Step 16.2: Onboarding playbook**

Create `docs/outreach/affiliate-onboarding.md`:

```markdown
# Affiliate Onboarding Playbook

## Шаги после согласия партнёра

### 1. Зарегистрировать в админке (Влад, 5 мин)
- `/admin/affiliates` → создать новую запись
- slug: имя партнёра латиницей (example: `anna-ivanova` → `anna`)
- commission_rate: 0.30 (default)

### 2. Выслать партнёру (copy-paste в DM)

> Готов пак. Вот что у тебя есть:
>
> 1. Твоя реф-ссылка: https://swipely.ru/?ref=[slug]
> 2. Бесплатный Creator на 3 месяца — активирован на [email]. Проверь.
> 3. Материалы: [ссылка на Google Drive с affiliate-kit]
> 4. Правила и условия: [affiliate-kit.md со ссылкой на публичную версию]
>
> Первый пост — в течение 7 дней, иначе партнёрство пересматривается.
> Если нужна помощь с текстом/медиа — пиши, разберём вместе.

### 3. Через 3 дня — check-in
- Проверить, есть ли посты с реф-ссылкой у партнёра.
- Если нет — DM с предложением помочь с контентом.

### 4. После первой платящей регистрации
- DM партнёру с поздравлением и точной суммой баланса.
- Добавить в closed Telegram channel "swipely-partners".

### 5. Ежемесячно (5-го числа)
- Свести отчёт по всем партнёрам.
- Выплатить тем у кого ≥500 ₽.
- Опубликовать рейтинг в closed channel.
```

- [ ] **Step 16.3: Commit**

```bash
git add docs/outreach/affiliate-kit.md docs/outreach/affiliate-onboarding.md
git commit -m "docs: affiliate kit and onboarding playbook"
```

---

### Task 17: Content sprint week 3 + POV post про цифры

**Files:**
- Create: `docs/content-ops/sprints/2026-W19.md`

- [ ] **Step 17.1: Заполнить спринт. Один пост — "Week 3 Swipely Update" с реальными цифрами.**

Пример POV-поста:

> 3 недели Swipely в цифрах. Публикую как есть.
> - Регистраций: [X] (рост +[Y]% от недели 0)
> - Активация (первая карусель): [X]% (было 32%)
> - Платных: [X] (было 6)
> - MRR: [X] ₽
> - Early Supporter осталось: [N] из 50
>
> Что сработало: [1 инсайт]. Что нет: [1 инсайт].
> Плачу себе за эту мысль: [reflection].

---

## Phase 4 — Week 4: Referral + Daily Metrics + Iteration

### Task 18: Enable referral program (+5 carousels)

**Files:**
- Modify: `swipely-nextjs/app/(dashboard)/referral/page.tsx` — уже существует, доработать под +5 каруселей
- Create: `swipely-nextjs/lib/supabase/migrations/2026-05-03-referral-bonus.sql`

- [ ] **Step 18.1: Проверить текущее состояние referral/page.tsx**

Run: `cat swipely-nextjs/app/(dashboard)/referral/page.tsx | head -100`

- [ ] **Step 18.2: DB — создать RPC для начисления бонуса**

(Колонки `bonus_carousels`, `referred_by_user`, `first_generation_at` уже добавлены в prerequisite-миграции 2026-04-19.)

```sql
-- File: swipely-nextjs/lib/supabase/migrations/2026-05-03-referral-bonus.sql
CREATE OR REPLACE FUNCTION grant_referral_bonus(p_referrer UUID, p_referred UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE profiles SET bonus_carousels = COALESCE(bonus_carousels, 0) + 5 WHERE user_id = p_referrer;
  UPDATE profiles SET bonus_carousels = COALESCE(bonus_carousels, 0) + 5 WHERE user_id = p_referred;
END;
$$;
```

Apply via `mcp__supabase__apply_migration` name `2026-05-03-referral-bonus`.

- [ ] **Step 18.3: После первой генерации нового юзера — grant bonus обоим**

В handler генерации (где создаётся генерация, `/api/generate/route.ts`), в конце добавить:

```typescript
const { data: profile } = await supabase.from("profiles").select("referred_by_user, first_generation_at").eq("user_id", user.id).single();
if (profile && !profile.first_generation_at && profile.referred_by_user) {
  await supabase.rpc("grant_referral_bonus", { p_referrer: profile.referred_by_user, p_referred: user.id });
  await supabase.from("profiles").update({ first_generation_at: new Date().toISOString() }).eq("user_id", user.id);
}
```

- [ ] **Step 18.4: Учитывать bonus_carousels при проверке лимита**

Найти место проверки лимита генераций (вероятно в `app/api/generate/route.ts`). Добавить логику:

```typescript
const effectiveLimit = freeLimit + (profile?.bonus_carousels ?? 0);
if (used >= effectiveLimit) {
  return NextResponse.json({ error: "limit reached" }, { status: 402 });
}
```

- [ ] **Step 18.5: UI — показать баланс на странице referral**

В `app/(dashboard)/referral/page.tsx`:

```tsx
<div className="mb-4 p-4 rounded border border-neutral-800">
  Бонусных каруселей: <strong>{profile.bonus_carousels ?? 0}</strong>
</div>
<p className="text-sm">Позови друга — оба получите +5 каруселей после первой генерации друга.</p>
```

- [ ] **Step 18.6: Commit**

```bash
git add swipely-nextjs/lib/supabase/migrations/2026-05-03-referral-bonus.sql swipely-nextjs/app/api/generate/route.ts "swipely-nextjs/app/(dashboard)/referral/page.tsx"
git commit -m "feat: referral bonus +5 carousels on first generation of referee"
```

---

### Task 19: Daily metrics Telegram report

**Files:**
- Create: `swipely-nextjs/app/api/cron/daily-metrics/route.ts`

- [ ] **Step 19.1: Implement endpoint**

Create `swipely-nextjs/app/api/cron/daily-metrics/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function notifyOwner(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.OWNER_TELEGRAM_ID;
  if (!token || !chatId) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

export async function GET(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createAdminClient();

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [{ count: newUsers }, { count: newGens }, { count: newPaid }, { data: rev }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("generations").select("*", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("subscription_started_at", since).neq("subscription_tier", "free"),
    supabase.from("payments").select("amount").eq("status", "succeeded").gte("updated_at", since),
  ]);

  const totalRev = (rev ?? []).reduce((a, b) => a + (b.amount ?? 0), 0);

  const text = [
    "<b>Swipely 24h</b>",
    `Регистрации: <b>${newUsers ?? 0}</b>`,
    `Генерации: <b>${newGens ?? 0}</b>`,
    `Новых платных: <b>${newPaid ?? 0}</b>`,
    `Выручка: <b>${totalRev} ₽</b>`,
  ].join("\n");

  await notifyOwner(text);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 19.2: Env**

Add `OWNER_TELEGRAM_ID=[telegram id]` в `.env.local` и в проде.

- [ ] **Step 19.3: Register cron**

Cron-job.org → daily at 09:00 MSK → URL `https://swipely.ru/api/cron/daily-metrics` → Bearer CRON_SECRET.

- [ ] **Step 19.4: Commit**

```bash
git add swipely-nextjs/app/api/cron/daily-metrics
git commit -m "feat: daily metrics Telegram report to owner"
```

---

### Task 20: Content sprint week 4

**Files:**
- Create: `docs/content-ops/sprints/2026-W20.md`

- [ ] **Step 20.1: Заполнить по шаблону.**

- [ ] **Step 20.2: Один пост — про аффилиатов как soft case-study.**

Example:

> 2 недели назад запустил партнёрку swipely. Первые партнёры уже привели [N] регистраций.
> Платим 30% с каждой подписки их подписчиков — 12 месяцев.
> Если у тебя есть аудитория в контент-нише — пиши, добавлю в список.

---

## Phase 5 — Weeks 5-8: Iteration + Scale

### Task 21: Weekly sprint execution (×4 weeks)

**Каждую неделю:**

- [ ] **Step 21.1:** Copy template → `docs/content-ops/sprints/2026-W[N].md`
- [ ] **Step 21.2:** Plan 5 hooks (voskres)
- [ ] **Step 21.3:** Publish 5 posts Пн/Вт/Ср/Чт/Сб
- [ ] **Step 21.4:** Reply to comments within 2h each
- [ ] **Step 21.5:** Update target-bloggers.md daily with outreach progress
- [ ] **Step 21.6:** Sunday — fill metrics, commit sprint file

---

### Task 22: Weekly review + course correction

**Каждое воскресенье вечером:**

- [ ] **Step 22.1:** Проверить метрики из daily-metrics отчётов за неделю
- [ ] **Step 22.2:** Проверить kill-criteria из спека:
  - 5 постов подряд <2K views? → поставить Threads на hold, пересмотреть формат
  - <20 платных после 3 недель? → добавить trial 14 дней или пробный месяц 99 ₽
  - Free→ген <40% на неделе 2? → пересмотреть лендинг
  - Нет ни одного активного аффилиата к концу недели 3? → эскалация до 50% LTV
  - Инженерка не успевает? → нанять фрилансера (60-80к за 40 ч)
- [ ] **Step 22.3:** При срабатывании kill-criterion — создать явный план корректировки, не продолжать слепо

---

### Task 23: Cleanup & handoff

**К концу недели 8 (или при достижении 100 платных):**

- [ ] **Step 23.1:** Зафиксировать фактический результат — количество платных, MRR, по каналам
- [ ] **Step 23.2:** Написать post-mortem: `docs/content-ops/post-mortems/2026-06-100-subs.md`
- [ ] **Step 23.3:** Обновить spec статус:
  ```bash
  sed -i '' 's/Status: Design approved for planning/Status: Executed (YYYY-MM-DD)/' docs/superpowers/specs/2026-04-19-content-strategy-first-100-subs-design.md
  ```
- [ ] **Step 23.4:** Commit финальное состояние

---

## Measurement Summary

**Еженедельные KPI (воскресенье, 30 мин):**

| Метрика | Источник | Цель |
|---------|----------|------|
| Views на пост (медиана) | Threads nativeanalytics | >5K |
| Доля постов >5K views | Threads analytics | 40-50% |
| Новых регистраций | daily-metrics cron | растёт WoW |
| Free→1+ген | daily-metrics cron | 60% к концу |
| Free→Paid | daily-metrics cron | 4-5% к концу |
| Конверсия чекаут | payments table | 55-60% к концу |
| Активных аффилиатов | affiliates admin | 15+ к нед 4 |

---

## Рекомендованное разделение задач

- **Влад (инженерка):** Tasks 1-3, 9-10, 13-15, 18-19 — ~30-40 часов за 6 недель
- **Влад (контент):** Tasks 4-6, 11, 17, 20, 21 — ~4.5 ч/нед × 8 = ~36 часов
- **Влад (аутрич):** Tasks 7-8, 12, 16 — ~5-10 часов первые 3 недели, затем 1-2 ч/нед

---

## Out of scope для этого плана

- Платная реклама (VK Ads, Яндекс Директ, Telegram Ads)
- SEO/блог
- Международный рынок
- Новые функции продукта кроме непосредственно связанных с воронкой
- Ребрендинг / новый tone of voice
- TikTok / Instagram / YouTube / LinkedIn

Если срабатывает kill-criterion по Threads — возврат к спеку и пересмотр стратегии, не добавление каналов в этот план.
