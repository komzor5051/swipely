# Onboarding Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Send new users directly to `/generate` after signup and show balance hints + first-gen upgrade banner inline.

**Architecture:** Three isolated changes — (1) redirect target in signup page, (2) profile data extension + CTA label hint in generate page, (3) inline upgrade banner in result section. No new files needed.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Supabase client, shadcn/ui Button

---

## Context

No test framework exists in this project. Skip TDD steps — implement directly and verify in the browser by running `npm run dev` in `swipely-nextjs/`.

Key files:
- `app/(auth)/signup/page.tsx` — client component, `router.push('/dashboard')` at line 54
- `app/(dashboard)/generate/page.tsx` — ~1080 lines; profile fetch at line 137 (`subscription_tier` only); CTA buttons at lines ~789 (desktop) and ~815 (mobile); result section at line 1006
- No middleware changes needed — there is no onboarding guard

---

### Task 1: Redirect to `/generate` after signup

**Files:**
- Modify: `app/(auth)/signup/page.tsx:54`

**Step 1: Make the change**

Find line 54:
```ts
router.push('/dashboard')
```

Change to:
```ts
router.push('/generate')
```

**Step 2: Verify**

Run `npm run dev`. Register a new test account → should land on `/generate`, not `/dashboard`.

**Step 3: Commit**

```bash
git add app/(auth)/signup/page.tsx
git commit -m "feat(onboarding): redirect new users to /generate after signup"
```

---

### Task 2: Fetch `standard_balance` in generate page

**Files:**
- Modify: `app/(dashboard)/generate/page.tsx:132-151` (profile useEffect block)

**Context**

Currently only `subscription_tier` is fetched. We need `standard_balance` to show the hint and detect first generation.

**Step 1: Add state variable**

After line 132 (`const [isPro, setIsPro] = useState(false);`), add:

```tsx
const [standardBalance, setStandardBalance] = useState<number | null>(null);
const [showUpgradeBanner, setShowUpgradeBanner] = useState(false);
```

**Step 2: Extend the Supabase select**

Find this block (lines ~143-150):
```tsx
supabase
  .from("profiles")
  .select("subscription_tier")
  .eq("id", user.id)
  .single()
  .then(({ data }) => {
    setIsPro(data?.subscription_tier === "pro");
  });
```

Replace with:
```tsx
supabase
  .from("profiles")
  .select("subscription_tier, standard_balance")
  .eq("id", user.id)
  .single()
  .then(({ data }) => {
    setIsPro(data?.subscription_tier === "pro");
    setStandardBalance(data?.standard_balance ?? null);
  });
```

**Step 3: Commit**

```bash
git add app/(dashboard)/generate/page.tsx
git commit -m "feat(onboarding): fetch standard_balance in generate page"
```

---

### Task 3: Add balance hint to CTA buttons

**Files:**
- Modify: `app/(dashboard)/generate/page.tsx` — two CTA button labels (desktop ~line 793, mobile ~line 819)

**Context**

There are two identical "Выбрать шаблон" buttons — one for desktop (`hidden lg:block`) and one for mobile (`sticky bottom-0 lg:hidden`). Both need the same hint logic.

Show hint only when: `!isPro && standardBalance !== null && standardBalance <= 3`

Hint text:
- When `standardBalance === 3`: `(3 бесплатно)`
- When `standardBalance > 0 && standardBalance < 3`: `(осталось ${standardBalance} из 3)`

**Step 1: Add a helper**

Above the `return` statement of the component (before line ~410), add:

```tsx
const balanceHint =
  !isPro && standardBalance !== null && standardBalance <= 3
    ? standardBalance === 3
      ? "(3 бесплатно)"
      : `(осталось ${standardBalance} из 3)`
    : null;
```

**Step 2: Update desktop CTA label**

Find the desktop CTA button inner JSX (mode === "standard" branch, ~line 793):
```tsx
{mode === "standard" ? (
  <>
    <ArrowRight className="h-4 w-4" />
    Выбрать шаблон
  </>
```

Replace with:
```tsx
{mode === "standard" ? (
  <>
    <ArrowRight className="h-4 w-4" />
    Выбрать шаблон{balanceHint ? ` ${balanceHint}` : ""}
  </>
```

**Step 3: Update mobile CTA label** (identical change, ~line 819):

Find the same `"Выбрать шаблон"` text inside the mobile sticky CTA. Apply the same replacement.

**Step 4: Verify**

Run `npm run dev`. Open `/generate` on a free account with balance = 3 → button should show "Выбрать шаблон (3 бесплатно)". On a Pro account → no hint.

**Step 5: Commit**

```bash
git add app/(dashboard)/generate/page.tsx
git commit -m "feat(onboarding): show remaining free generations on CTA button"
```

---

### Task 4: Trigger upgrade banner after first generation

**Files:**
- Modify: `app/(dashboard)/generate/page.tsx` — `handleGenerate` function and result section

**Context**

`handleGenerate` starts at ~line 266 and calls `setStep("generating")`, then eventually `setStep("result")`. The banner should appear only when the user just consumed their first free generation (i.e. balance was 3 before they clicked).

**Step 1: Capture pre-generation balance and set banner**

Inside `handleGenerate`, immediately after `setStep("generating")` (line ~267), add:

```tsx
const wasFirstGeneration = !isPro && standardBalance === 3;
```

Then find where `setStep("result")` is called on success (look for `setResult(data)` — it's called before or alongside `setStep("result")`). After setting result, add:

```tsx
if (wasFirstGeneration) setShowUpgradeBanner(true);
```

**Step 2: Also update local balance after generation**

Right after `if (wasFirstGeneration) setShowUpgradeBanner(true);`, add:

```tsx
setStandardBalance((prev) => (prev !== null ? Math.max(0, prev - 1) : null));
```

This keeps the CTA hint correct if the user clicks "Перегенерировать" without a page reload.

**Step 3: Commit**

```bash
git add app/(dashboard)/generate/page.tsx
git commit -m "feat(onboarding): trigger upgrade banner logic after first generation"
```

---

### Task 5: Render upgrade banner in result section

**Files:**
- Modify: `app/(dashboard)/generate/page.tsx` — result section after download buttons (~line 1016)

**Context**

The result section starts at line 1006. The action buttons row (Редактор, Сменить шаблон, Перегенерировать, Новая карусель) ends around line 1051 with `</div> {/* flex flex-wrap gap-2 */}`. We add the banner right after this closing `</div>` and before `</div> {/* space-y-4 header block */}`.

**Step 1: Add banner JSX**

Find the closing `</div>` that ends the action buttons flex row (the one after "Новая карусель" Button, ~line 1051). Directly after it, add:

```tsx
{showUpgradeBanner && (
  <div className="rounded-2xl border border-[#D4F542]/40 bg-[#D4F542]/8 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
    <div className="flex-1">
      <p className="font-semibold text-sm text-[#0D0D14]">
        🎉 Первая карусель готова!
      </p>
      <p className="text-sm text-muted-foreground mt-0.5">
        {standardBalance !== null && standardBalance > 0
          ? `У тебя осталось ${standardBalance} бесплатных генерации.`
          : "Бесплатные генерации закончились."}
        {" "}С PRO — безлимит за 990₽/мес.
      </p>
    </div>
    <Button
      size="sm"
      className="rounded-xl bg-[#0D0D14] hover:bg-[#1a1a2e] text-white font-semibold shrink-0 whitespace-nowrap"
      onClick={() => window.location.href = "/dashboard/pricing"}
    >
      Попробовать PRO →
    </Button>
  </div>
)}
```

**Step 2: Verify**

`npm run dev`. On a fresh free account: generate a carousel → banner should appear below action buttons. On a Pro account: no banner.

Also verify: clicking "Перегенерировать" does NOT show banner again (it only sets `showUpgradeBanner` when balance was exactly 3, which is no longer true after first generation).

**Step 3: Commit**

```bash
git add app/(dashboard)/generate/page.tsx
git commit -m "feat(onboarding): add first-gen upgrade banner in result section"
```

---

## Verification Checklist

After all tasks:

1. **New user signup** → lands on `/generate` (not `/dashboard`)
2. **Free user with 3 remaining** → CTA shows "Выбрать шаблон (3 бесплатно)"
3. **Free user with 2 remaining** → CTA shows "Выбрать шаблон (осталось 2 из 3)"
4. **Pro user** → CTA shows "Выбрать шаблон" (no hint)
5. **After first free generation** → upgrade banner appears below action buttons
6. **After second generation** → banner does NOT appear again
7. **Pro user after generation** → no banner
