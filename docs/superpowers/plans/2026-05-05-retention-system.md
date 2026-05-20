# Retention System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Activate streak display, collect user niche, personalize daily topic starters, and add missing re-engagement cron emails — fixing day-0 churn without touching unrelated code.

**Architecture:** Four isolated changes building on existing infrastructure: StatsRow already has an `accent` Card design, Gemini is already wired in `lib/generation/gemini.ts`, email system runs via NotiSend through `lib/email.ts`, and two cron routes already exist. We add niche collection to onboarding, wire streak into StatsRow, replace hardcoded topics with Gemini-generated ones cached in `profiles.suggested_topics`, and create two missing cron routes (7-day silence, recurring 3-day nudge).

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (server client + admin client), NotiSend (via `lib/email.ts`), Gemini (`lib/generation/gemini.ts` → `callGemini`), cron-job.org (external, called with `CRON_SECRET` Bearer token)

---

## File Map

**Modified:**
- `swipely-nextjs/components/dashboard/StatsRow.tsx` — add `streak` prop, third card
- `swipely-nextjs/app/(dashboard)/dashboard/DashboardClient.tsx` — remove `void streak`, pass to StatsRow; add `starters` to InitialData; show starters to all users
- `swipely-nextjs/app/(dashboard)/dashboard/page.tsx` — fetch starters from DB, pass to client
- `swipely-nextjs/app/(dashboard)/onboarding/page.tsx` — add niche step after TOV
- `swipely-nextjs/lib/email.ts` — add `niche?` param to 3 functions, personalise topic lists
- `swipely-nextjs/app/api/cron/email-no-gen/route.ts` — select `niche`, pass to send function
- `swipely-nextjs/app/api/cron/day3-retention/route.ts` — select `niche`, pass to send function

**Created:**
- `swipely-nextjs/app/api/starters/route.ts` — GET: generate/cache 3 personalised topic starters via Gemini
- `swipely-nextjs/app/api/cron/7d-silence/route.ts` — users with no generation in 7+ days
- `swipely-nextjs/app/api/cron/recurring-3d/route.ts` — active paid/free users silent 3+ days

---

## Task 1: Show streak in StatsRow

**Files:**
- Modify: `swipely-nextjs/components/dashboard/StatsRow.tsx`
- Modify: `swipely-nextjs/app/(dashboard)/dashboard/DashboardClient.tsx`

- [ ] **Step 1: Add `streak` prop to StatsRow and render third card**

Replace `StatsRow.tsx` with:

```tsx
"use client";

type Props = {
  total: number;
  monthCount: number;
  monthLimit: number;
  streak: number;
};

export function StatsRow({ total, monthCount, monthLimit, streak }: Props) {
  const pct = Math.min(100, Math.round((monthCount / monthLimit) * 100));
  const cols = streak > 0 ? 3 : 2;

  return (
    <div
      className="grid gap-3 md:gap-4 mb-8 max-sm:mb-6"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      <Card label="Всего создано" value={total} sub={total === 1 ? "карусель" : "каруселей"} />
      <Card
        label="В этом месяце"
        value={monthCount}
        sub={`из ${monthLimit}`}
        progress={pct}
      />
      {streak > 0 && (
        <Card label="Серия" value={streak} sub="дней подряд" accent />
      )}
    </div>
  );
}

function Card({
  label,
  value,
  sub,
  progress,
  accent,
}: {
  label: string;
  value: number;
  sub: string;
  progress?: number;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #EAEAE4",
        borderRadius: 12,
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        minHeight: 92,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#A3A3A3",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: "#0A0A0A",
          lineHeight: 1.1,
          display: "flex",
          alignItems: "baseline",
          gap: 6,
        }}
      >
        {value}
        {accent && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "#0A0A0A",
              background: "#B6E82C",
              padding: "2px 6px",
              borderRadius: 4,
              textTransform: "uppercase",
            }}
          >
            Стрик
          </span>
        )}
      </div>
      <div style={{ fontSize: 12, color: "#737373" }}>{sub}</div>
      {typeof progress === "number" && (
        <div
          style={{
            marginTop: 4,
            height: 4,
            background: "#F4F4F1",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: progress >= 90 ? "#EF4444" : progress >= 66 ? "#F59E0B" : "#B6E82C",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Pass streak from DashboardClient to StatsRow**

In `DashboardClient.tsx`, find line 141:
```tsx
  // Suppress unused warning for streak (kept for future use)
  void streak;
```
Delete those two lines.

Find the `<StatsRow` usage (around line 162):
```tsx
        <StatsRow
          total={totalCount}
          monthCount={monthCount}
          monthLimit={limit}
        />
```
Replace with:
```tsx
        <StatsRow
          total={totalCount}
          monthCount={monthCount}
          monthLimit={limit}
          streak={streak}
        />
```

- [ ] **Step 3: Verify locally**

```bash
cd "swipely-nextjs"
npm run dev
```

Open http://localhost:3000/dashboard — if you have generations on consecutive days, a third "Серия" card should appear with a green "СТРИК" badge. If streak = 0, only two cards show (unchanged layout).

- [ ] **Step 4: Commit**

```bash
cd "swipely-nextjs"
git add components/dashboard/StatsRow.tsx app/\(dashboard\)/dashboard/DashboardClient.tsx
git commit -m "feat(dashboard): show streak in StatsRow"
```

---

## Task 2: Add niche question to onboarding

**Files:**
- Modify: `swipely-nextjs/app/(dashboard)/onboarding/page.tsx`

- [ ] **Step 1: Add niche state and step logic**

At the top of `OnboardingPage` function, after the existing state declarations, add:

```tsx
  const [step, setStep] = useState<"tov" | "niche">("tov");
  const [niche, setNiche] = useState("");
  const [savingNiche, setSavingNiche] = useState(false);
```

- [ ] **Step 2: Modify `handleSkip` and `handleContinue` to go to niche step first**

Replace:
```tsx
  const handleSkip = async () => {
    await markCompleted("skip");
    router.push("/dashboard");
  };

  const handleContinue = async () => {
    await markCompleted("continue");
    router.push("/generate");
  };
```
With:
```tsx
  const handleSkip = () => {
    setStep("niche");
  };

  const handleContinue = () => {
    setStep("niche");
  };

  const handleNicheSubmit = async () => {
    if (!user) return;
    setSavingNiche(true);
    const supabase = createClient();
    if (niche.trim()) {
      await supabase.from("profiles").update({ niche: niche.trim() }).eq("id", user.id);
    }
    await markCompleted(result ? "continue" : "skip");
    setSavingNiche(false);
    router.push(result ? "/generate" : "/dashboard");
  };
```

- [ ] **Step 3: Add niche UI screen**

After the closing `</div>` of the `{result && (...)}` block (before the final closing `</div>` of the component return), add:

```tsx
      {step === "niche" && (
        <div className="max-w-2xl mx-auto py-8">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-3">О чём твой блог?</h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Выбери тему или напиши свою — будем подбирать идеи под твою нишу
            </p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            {["Маркетинг", "Психология", "Бизнес", "Финансы", "Саморазвитие", "Дизайн", "Копирайтинг", "Здоровье", "Карьера", "Отношения"].map((n) => (
              <button
                key={n}
                onClick={() => setNiche(niche === n ? "" : n)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 999,
                  border: niche === n ? "2px solid #0E0E10" : "2px solid #E5E7EB",
                  background: niche === n ? "#0E0E10" : "#fff",
                  color: niche === n ? "#fff" : "#0E0E10",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Или напиши свою нишу..."
            value={["Маркетинг","Психология","Бизнес","Финансы","Саморазвитие","Дизайн","Копирайтинг","Здоровье","Карьера","Отношения"].includes(niche) ? "" : niche}
            onChange={(e) => setNiche(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-8 outline-none focus:border-gray-400"
          />
          <div className="flex gap-3">
            <Button
              onClick={handleNicheSubmit}
              disabled={savingNiche}
              className="flex-1 rounded-xl h-12 bg-[#0E0E10] hover:bg-[#1a1a1d] text-white"
            >
              {savingNiche ? <Loader2 className="h-4 w-4 animate-spin" /> : "Готово"}
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                await markCompleted(result ? "continue" : "skip");
                router.push(result ? "/generate" : "/dashboard");
              }}
              className="rounded-xl h-12"
            >
              Пропустить
            </Button>
          </div>
        </div>
      )}
```

- [ ] **Step 4: Wrap existing TOV content in `step === "tov"` condition**

The existing JSX return currently renders the TOV form always. Wrap the existing `<div className="max-w-2xl mx-auto py-8">` block (the TOV one) in `{step === "tov" && (...)`.

The return should look like:
```tsx
  return (
    <div>
      {step === "tov" && (
        <div className="max-w-2xl mx-auto py-8">
          {/* ...existing TOV content unchanged... */}
        </div>
      )}
      {step === "niche" && (
        <div className="max-w-2xl mx-auto py-8">
          {/* ...niche UI from Step 3... */}
        </div>
      )}
    </div>
  );
```

- [ ] **Step 5: Verify locally**

```bash
npm run dev
```

Go to http://localhost:3000/onboarding — complete or skip TOV, then you should see the niche screen. Selecting a chip or typing in the input and clicking "Готово" should redirect to dashboard/generate. Check Supabase `profiles` table — `niche` column should be populated.

- [ ] **Step 6: Commit**

```bash
git add app/\(dashboard\)/onboarding/page.tsx
git commit -m "feat(onboarding): add niche question step after TOV"
```

---

## Task 3: Personalized daily starters

**Files:**
- Create: `swipely-nextjs/app/api/starters/route.ts`
- Modify: `swipely-nextjs/app/(dashboard)/dashboard/page.tsx`
- Modify: `swipely-nextjs/app/(dashboard)/dashboard/DashboardClient.tsx`

- [ ] **Step 1: Create the starters API route**

Create `app/api/starters/route.ts`:

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { callGemini } from "@/lib/generation/gemini";

const FALLBACK_STARTERS = [
  "3 ошибки, которые я совершил в первый год",
  "Как я экономлю 2 часа в день с одним инструментом",
  "5 вещей, которые я перестал делать — и стало лучше",
];

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ starters: FALLBACK_STARTERS });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("niche, suggested_topics, suggested_topics_date")
    .eq("id", user.id)
    .single();

  if (!profile?.niche) {
    return NextResponse.json({ starters: FALLBACK_STARTERS });
  }

  // Return cached if generated today
  const today = new Date().toISOString().slice(0, 10);
  const cacheDate = profile.suggested_topics_date
    ? String(profile.suggested_topics_date).slice(0, 10)
    : null;

  if (cacheDate === today && Array.isArray(profile.suggested_topics) && profile.suggested_topics.length > 0) {
    return NextResponse.json({ starters: profile.suggested_topics });
  }

  // Generate fresh topics
  try {
    const prompt = `Ты помогаешь блогеру в нише "${profile.niche}" придумать темы для постов-каруселей в Instagram.

Придумай ровно 3 темы для коротких постов-каруселей. Каждая тема — это цепляющий заголовок поста (не вопрос, а утверждение или список).

Формат ответа — только JSON массив из 3 строк, без пояснений:
["тема 1", "тема 2", "тема 3"]`;

    const result = await callGemini(prompt, { model: "gemini-2.0-flash", maxOutputTokens: 200, temperature: 0.9 });
    const cleaned = result.text.replace(/```json\n?/g, "").replace(/```/g, "").trim();
    const starters: string[] = JSON.parse(cleaned);

    if (!Array.isArray(starters) || starters.length === 0) throw new Error("Bad response");

    await admin
      .from("profiles")
      .update({ suggested_topics: starters, suggested_topics_date: new Date().toISOString() })
      .eq("id", user.id);

    return NextResponse.json({ starters });
  } catch {
    return NextResponse.json({ starters: FALLBACK_STARTERS });
  }
}
```

- [ ] **Step 2: Add `starters` to DashboardPage server fetch**

In `app/(dashboard)/dashboard/page.tsx`, after the existing 4 parallel queries, add a starters fetch. Find the `Promise.all` block and add a 5th query:

```ts
  const [profileRes, recentRes, totalRes, datesRes, startersRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("subscription_tier, last_scan_job_id")
      .eq("id", user.id)
      .single(),
    supabase
      .from("generations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("generations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("generations")
      .select("created_at")
      .eq("user_id", user.id)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("niche, suggested_topics, suggested_topics_date")
      .eq("id", user.id)
      .single(),
  ]);
```

Then compute starters before the return:

```ts
  const today = new Date().toISOString().slice(0, 10);
  const startersProfile = startersRes.data as { niche: string | null; suggested_topics: string[] | null; suggested_topics_date: string | null } | null;
  const cacheDate = startersProfile?.suggested_topics_date?.slice(0, 10);
  const starters: string[] | null =
    cacheDate === today && Array.isArray(startersProfile?.suggested_topics) && startersProfile!.suggested_topics!.length > 0
      ? startersProfile!.suggested_topics
      : null;
```

And pass `starters` to `DashboardClient`:

```ts
  return (
    <DashboardClient
      initial={{
        recentGenerations: (recentRes.data as Generation[] | null) ?? [],
        totalCount: totalRes.count ?? 0,
        recentDates:
          (datesRes.data as { created_at: string }[] | null)?.map((d) => d.created_at) ?? [],
        showInstagramBanner,
        starters,
      }}
    />
  );
```

Also update the early return (unauthenticated case) to include `starters: null`.

- [ ] **Step 3: Update DashboardClient to use starters**

In `DashboardClient.tsx`, update `InitialData` interface:

```ts
interface InitialData {
  recentGenerations: Generation[];
  totalCount: number;
  recentDates: string[];
  showInstagramBanner: boolean;
  starters: string[] | null;
}
```

Remove the `TOPIC_SUGGESTIONS` constant (lines 119-123).

Replace `firstTime` topic suggestions section (lines 281-311) with a starters section that shows to **all** users when starters are available:

```tsx
          {/* Starters — shown to all users when available */}
          {(initial.starters ?? [
            "3 ошибки, которые я совершил в первый год",
            "Как я экономлю 2 часа в день с одним инструментом",
            "5 вещей, которые я перестал делать — и стало лучше",
          ]).length > 0 && (
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid #EAEAE4" }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#A3A3A3", marginBottom: 10 }}>
                {initial.starters ? "Идеи для тебя" : "С чего начать"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(initial.starters ?? [
                  "3 ошибки, которые я совершил в первый год",
                  "Как я экономлю 2 часа в день с одним инструментом",
                  "5 вещей, которые я перестал делать — и стало лучше",
                ]).map((topic) => (
                  <Link
                    key={topic}
                    href={`/generate?topic=${encodeURIComponent(topic)}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      background: "#FAFAF9",
                      border: "1px solid #EAEAE4",
                      borderRadius: 10,
                      textDecoration: "none",
                      fontSize: 14,
                      color: "#0A0A0A",
                    }}
                    className="hover:!bg-[#F4F4F1]"
                  >
                    <span>«{topic}»</span>
                    <ArrowRight style={{ width: 14, height: 14, color: "#737373", flexShrink: 0 }} />
                  </Link>
                ))}
              </div>
            </div>
          )}
```

Also remove the `firstTime` variable since it's no longer used to gate topic display.

- [ ] **Step 4: Trigger starters generation on first load**

In `DashboardClient.tsx`, add a `useEffect` that calls `/api/starters` when `initial.starters` is null (cache miss — fresh user or stale cache). The response will populate the cache; user sees generic starters on this visit and personalised ones on next visit.

```tsx
  useEffect(() => {
    if (!initial.starters) {
      fetch("/api/starters").catch(() => {});
    }
  }, [initial.starters]);
```

- [ ] **Step 5: Verify locally**

```bash
npm run dev
```

1. Log in as a user with `niche` set in Supabase. Open http://localhost:3000/dashboard — after first load, check `profiles.suggested_topics` in Supabase; next reload should show those topics in the starters section.
2. Log in as a user with `niche = null` — fallback generic topics should appear.

- [ ] **Step 6: Commit**

```bash
git add app/api/starters/route.ts app/\(dashboard\)/dashboard/page.tsx app/\(dashboard\)/dashboard/DashboardClient.tsx
git commit -m "feat(dashboard): personalized daily starters via Gemini, shown to all users"
```

---

## Task 4: Personalize emails by niche + add missing cron routes

**Files:**
- Modify: `swipely-nextjs/lib/email.ts`
- Modify: `swipely-nextjs/app/api/cron/email-no-gen/route.ts`
- Modify: `swipely-nextjs/app/api/cron/day3-retention/route.ts`
- Create: `swipely-nextjs/app/api/cron/7d-silence/route.ts`
- Create: `swipely-nextjs/app/api/cron/recurring-3d/route.ts`

- [ ] **Step 1: Add niche parameter to email functions in `lib/email.ts`**

Add a helper that returns topic bullets personalised to the niche. Add it after the `btn()` helper:

```ts
function topicList(niche: string | null | undefined): string {
  if (niche) {
    return `
      <p style="color:#0D0D14;font-weight:600;margin:0 0 8px">Темы для ниши «${niche}»:</p>
      <p style="color:#6B7280;line-height:1.6;margin:0 0 20px">
        Введи любую тему из своей ниши — Swipely оформит её в карусель за 60 секунд.
      </p>`;
  }
  return `
    <ul style="color:#0D0D14;line-height:2;margin:0 0 20px;padding-left:20px">
      <li>3 ошибки в Instagram, которые убивают охваты</li>
      <li>Как выйти на 100k за 3 месяца</li>
      <li>Чек-лист запуска блога с нуля</li>
    </ul>`;
}
```

Update `sendWelcomeNoGenEmail` signature and body:

```ts
export async function sendWelcomeNoGenEmail(to: string, niche?: string | null): Promise<void> {
  await sendEmail(
    to,
    'Твоя первая карусель — уже готова',
    wrap(`
      ${h2('Готовая тема для первой карусели')}
      ${p('Ты зарегистрировался в Swipely, но ещё не попробовал генерацию.')}
      ${topicList(niche)}
      ${btn('https://swipely.ru/generate?utm_source=email_no_gen', 'Создать карусель')}
    `)
  );
}
```

Update `sendReengagementEmail` signature and body:

```ts
export async function sendReengagementEmail(to: string, niche?: string | null): Promise<void> {
  await sendEmail(
    to,
    niche ? `Новые идеи для ${niche}` : 'Создай карусель за 60 секунд',
    wrap(`
      ${h2('Контент сам себя не напишет')}
      ${niche ? p(`Вот несколько тем для ниши «${niche}» — выбери любую и создай карусель за минуту.`) : p('Введи тему и получи готовую карусель за минуту.')}
      ${btn('https://swipely.ru/generate?utm_source=email_reengagement', 'Открыть Swipely')}
    `)
  );
}
```

Add new function for recurring 3-day nudge:

```ts
export async function sendRecurringNudgeEmail(to: string, niche?: string | null): Promise<void> {
  await sendEmail(
    to,
    niche ? `Идея для поста в ${niche}` : 'Идея для следующего поста',
    wrap(`
      ${h2('Пора создать следующую карусель')}
      ${niche
        ? p(`Прошло несколько дней. Вот повод зайти — сделай карусель по теме из ниши «${niche}» за 60 секунд.`)
        : p('Прошло несколько дней без нового поста. Введи тему — Swipely оформит её за минуту.')}
      ${btn('https://swipely.ru/generate?utm_source=email_recurring', 'Создать карусель')}
    `)
  );
}
```

- [ ] **Step 2: Update `email-no-gen` cron to select and pass niche**

In `app/api/cron/email-no-gen/route.ts`, update the Supabase select:

```ts
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, email, niche')
    .eq('standard_used', 0)
    .not('email', 'is', null)
    .gte('created_at', new Date(now - 48 * 60 * 60 * 1000).toISOString())
    .lte('created_at', new Date(now - 24 * 60 * 60 * 1000).toISOString());
```

Update the send call:

```ts
      await sendWelcomeNoGenEmail(u.email, u.niche);
```

- [ ] **Step 3: Update `day3-retention` cron to select and pass niche**

`sendDay3RetentionEmail` imported in this cron does not exist in `lib/email.ts`. Fix: replace the import with `sendFirstGenFollowupEmail` and add `niche` param to that function.

First, update `lib/email.ts` — add `niche` param to `sendFirstGenFollowupEmail`:

```ts
export async function sendFirstGenFollowupEmail(to: string, niche?: string | null): Promise<void> {
  await sendEmail(
    to,
    'Первая карусель готова — что дальше?',
    wrap(`
      ${h2('Ты создал первую карусель')}
      ${niche
        ? p(`Вот ещё темы для ниши «${niche}» — у тебя осталось 2 бесплатных генерации. Попробуй другой шаблон — у нас их 19.`)
        : p('У тебя ещё есть 2 бесплатных генерации. Попробуй другой шаблон — у нас их 19.')}
      ${btn('https://swipely.ru/generate?utm_source=email_first_gen', 'Создать ещё')}
    `)
  );
}
```

Then, in `app/api/cron/day3-retention/route.ts`, replace the import:

```ts
import { sendFirstGenFollowupEmail } from '@/lib/email';
```

Update the select:

```ts
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, email, niche')
    .gte('created_at', window96h)
    .lte('created_at', window72h)
    .gte('standard_used', 1)
    .eq('subscription_tier', 'free')
    .not('email', 'is', null);
```

Update the send call:

```ts
      await sendFirstGenFollowupEmail(u.email, u.niche);
```

- [ ] **Step 4: Create `7d-silence` cron route**

Create `app/api/cron/7d-silence/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendReengagementEmail } from '@/lib/email';

// Runs daily. Targets users who:
//   - last generated exactly 7–8 days ago (one-time reactivation window)
//   - have email
//   - are on free tier (paid users get value from subscription, not this nudge)
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = Date.now();
  const window8d = new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString();
  const window7d = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, email, niche')
    .gte('last_generate_at', window8d)
    .lte('last_generate_at', window7d)
    .eq('subscription_tier', 'free')
    .not('email', 'is', null);

  if (error) {
    console.error('[7d-silence cron]', error);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  let sent = 0;
  for (const u of (users ?? [])) {
    if (!u.email) continue;
    try {
      await sendReengagementEmail(u.email, u.niche);
      sent++;
    } catch (e) {
      console.error('[7d-silence] failed for', u.id, e);
    }
  }

  return NextResponse.json({ sent, total: users?.length ?? 0 });
}
```

- [ ] **Step 5: Create `recurring-3d` cron route**

Create `app/api/cron/recurring-3d/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendRecurringNudgeEmail } from '@/lib/email';

// Runs daily. Targets users who:
//   - have generated at least 1 carousel (engaged)
//   - last generated 3–4 days ago (3-day nudge window, entered exactly once per cycle)
//   - have email
//   - are not already in the 7d-silence window (last_generate_at > 4d ago handled by upper bound)
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = Date.now();
  const window4d = new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString();
  const window3d = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString();

  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, email, niche')
    .gte('standard_used', 1)
    .gte('last_generate_at', window4d)
    .lte('last_generate_at', window3d)
    .not('email', 'is', null);

  if (error) {
    console.error('[recurring-3d cron]', error);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  let sent = 0;
  for (const u of (users ?? [])) {
    if (!u.email) continue;
    try {
      await sendRecurringNudgeEmail(u.email, u.niche);
      sent++;
    } catch (e) {
      console.error('[recurring-3d] failed for', u.id, e);
    }
  }

  return NextResponse.json({ sent, total: users?.length ?? 0 });
}
```

- [ ] **Step 6: Verify build**

```bash
cd "swipely-nextjs"
npm run build
```

Expected: no TypeScript errors on modified files. If `sendDay3RetentionEmail` is missing `niche` param, the build will catch it — fix the signature in `lib/email.ts`.

- [ ] **Step 7: Test cron routes manually**

```bash
# Start dev server
npm run dev

# Test 7d-silence route (should return {sent: 0, total: 0} in local env)
curl -H "Authorization: Bearer $(grep CRON_SECRET .env.local | cut -d= -f2)" \
  http://localhost:3000/api/cron/7d-silence

# Test recurring-3d route
curl -H "Authorization: Bearer $(grep CRON_SECRET .env.local | cut -d= -f2)" \
  http://localhost:3000/api/cron/recurring-3d
```

Expected: `{"sent":0,"total":0}` — no users in local DB match the window. No 401 = auth works.

- [ ] **Step 8: Register new crons on cron-job.org**

Add two new jobs in cron-job.org dashboard, same settings as existing crons:
- URL: `https://swipely.ru/api/cron/7d-silence` — daily at 10:00 MSK, GET, `Authorization: Bearer <CRON_SECRET>`
- URL: `https://swipely.ru/api/cron/recurring-3d` — daily at 10:00 MSK, GET, `Authorization: Bearer <CRON_SECRET>`

- [ ] **Step 9: Commit**

```bash
git add lib/email.ts \
  app/api/cron/email-no-gen/route.ts \
  app/api/cron/day3-retention/route.ts \
  app/api/cron/7d-silence/route.ts \
  app/api/cron/recurring-3d/route.ts
git commit -m "feat(email): personalise cron emails by niche, add 7d-silence and recurring-3d crons"
```

---

## Final: Deploy

- [ ] **Push and deploy**

```bash
git push
```

Deploy runs automatically via CI. After deploy, verify on https://swipely.ru/dashboard:
1. Streak card appears for users with consecutive-day generations
2. Onboarding shows niche step
3. Topic starters refresh daily and match user niche

- [ ] **Verify email delivery**

Manually trigger `email-no-gen` on a test account with no generations and a valid email:

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" \
  https://swipely.ru/api/cron/email-no-gen
```

Check inbox for personalised email.
