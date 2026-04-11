# Onboarding Wizard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** New users land on `/generate` and go through a guided first-time flow that ends with a real carousel; `onboarding_completed` is set to true on result.

**Architecture:** `/generate` detects `onboarding_completed = false` from the user's profile and switches to a guided mode: progress bar replaces full nav, advanced controls are hidden, defaults are applied silently. After first successful generation the flag is flipped. Layout redirect changed from `/onboarding` to `/generate`.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4, Supabase client, existing generate page state machine (`form | template | generating | result`)

---

### Task 1: Redirect layout to `/generate` instead of `/onboarding`

**Files:**
- Modify: `app/(dashboard)/layout.tsx:217` and `app/(dashboard)/layout.tsx:238`

**Step 1: Open layout.tsx, find the two redirect calls**

Both are `router.push("/onboarding")` — one at line ~217, one at ~238.

**Step 2: Change both to `/generate`**

```tsx
// line ~217
if (!profileData.onboarding_completed && !pathname.includes("/onboarding") && !visitedOnboarding.current) {
  router.push("/generate");
  return;
}

// line ~238
if (!pathname.includes("/onboarding") && !visitedOnboarding.current) {
  router.push("/generate");
  return;
}
```

Also update the two guard checks — `pathname.includes("/onboarding")` can stay for backward compat (keep `/onboarding` as a dead-end fallback).

**Step 3: Verify manually**
- Register a new account → should land on `/generate`
- Existing user with `onboarding_completed = true` → should land on `/dashboard` normally

**Step 4: Commit**
```bash
cd "swipely-nextjs"
git add app/\(dashboard\)/layout.tsx
git commit -m "feat(onboarding): redirect new users to /generate instead of /onboarding"
```

---

### Task 2: Load `onboarding_completed` in generate page

**Files:**
- Modify: `app/(dashboard)/generate/page.tsx`

**Step 1: Add `isOnboarding` state near the other profile states (~line 145)**

```tsx
const [isOnboarding, setIsOnboarding] = useState(false);
const onboardingMarkedRef = useRef(false);
```

**Step 2: Extend the existing profile fetch useEffect (~line 152) to also read `onboarding_completed`**

Current fetch:
```tsx
supabase
  .from("profiles")
  .select("subscription_tier, standard_used")
  .eq("id", user.id)
  .single()
  .then(({ data }) => {
    setIsPro(data?.subscription_tier === "pro");
    setStandardUsed(data?.standard_used ?? null);
  });
```

Change to:
```tsx
supabase
  .from("profiles")
  .select("subscription_tier, standard_used, onboarding_completed")
  .eq("id", user.id)
  .single()
  .then(({ data }) => {
    setIsPro(data?.subscription_tier === "pro");
    setStandardUsed(data?.standard_used ?? null);
    if (data && !data.onboarding_completed) {
      setIsOnboarding(true);
    }
  });
```

**Step 3: Commit**
```bash
git add app/\(dashboard\)/generate/page.tsx
git commit -m "feat(onboarding): detect first-time users in generate page"
```

---

### Task 3: Add OnboardingProgressBar component

**Files:**
- Create: `components/generate/OnboardingProgressBar.tsx`

**Step 1: Create the component**

```tsx
// components/generate/OnboardingProgressBar.tsx
"use client";

const STEPS = [
  { id: "form", label: "Описание" },
  { id: "template", label: "Шаблон" },
  { id: "result", label: "Готово" },
];

type Step = "form" | "template" | "generating" | "result";

function stepIndex(step: Step): number {
  if (step === "form") return 0;
  if (step === "template") return 1;
  return 2; // generating + result both map to index 2
}

export default function OnboardingProgressBar({ step }: { step: Step }) {
  const current = stepIndex(step);

  return (
    <div className="mb-6">
      <p className="text-xs text-muted-foreground text-center mb-3">
        Создай свою первую карусель
      </p>
      <div className="flex items-center gap-2 max-w-xs mx-auto">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 flex-1">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < current
                    ? "bg-[#D4F542] text-[#0D0D14]"
                    : i === current
                    ? "bg-[#D4F542] text-[#0D0D14] ring-2 ring-[#D4F542]/40"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < current ? "✓" : i + 1}
              </div>
              <span
                className={`text-[10px] whitespace-nowrap ${
                  i === current ? "text-foreground font-medium" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mb-4 transition-all ${
                  i < current ? "bg-[#D4F542]" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**
```bash
git add components/generate/OnboardingProgressBar.tsx
git commit -m "feat(onboarding): add progress bar component"
```

---

### Task 4: Show guided UI on form step

**Files:**
- Modify: `app/(dashboard)/generate/page.tsx`

The generate page renders the form step JSX inline (large block starting with `step === "form"`). Add the following changes:

**Step 1: Import OnboardingProgressBar at the top of the file**

```tsx
import OnboardingProgressBar from "@/components/generate/OnboardingProgressBar";
```

**Step 2: At the top of the form step JSX block, add conditional progress bar**

Find where the form JSX starts (look for `step === "form"` condition) and prepend:

```tsx
{isOnboarding && <OnboardingProgressBar step={step} />}
```

**Step 3: Hide advanced controls when `isOnboarding`**

Wrap the following sections with `{!isOnboarding && ( ... )}`:
- Mode toggle (standard / photo)
- Slide count selector
- Format selector (portrait / square)
- Video URL input section

These can stay as-is, just conditionally hidden. The defaults (5 slides, portrait, standard) stay applied.

**Step 4: Change the submit button label when onboarding**

Find the generate/next button in the form step. Add conditional label:

```tsx
{isOnboarding ? "Создать карусель →" : "Далее"}
```

**Step 5: Verify in browser**
- New user (onboarding_completed = false): form shows progress bar, no mode toggle, no slide count, no format selector, CTA says "Создать карусель →"
- Existing user (onboarding_completed = true): form unchanged

**Step 6: Commit**
```bash
git add app/\(dashboard\)/generate/page.tsx
git commit -m "feat(onboarding): guided form UI for first-time users"
```

---

### Task 5: Show progress bar on template step + mark complete on result

**Files:**
- Modify: `app/(dashboard)/generate/page.tsx`

**Step 1: Add progress bar to template step**

Find the template step JSX block and prepend:
```tsx
{isOnboarding && <OnboardingProgressBar step={step} />}
```

**Step 2: Mark `onboarding_completed = true` when result is reached**

In `handleGenerate`, after `setStep("result")` (both in standard mode success and in the photo mode SSE useEffect), add:

```tsx
// Mark onboarding complete once, on first result
if (isOnboarding && !onboardingMarkedRef.current) {
  onboardingMarkedRef.current = true;
  const supabase = createClient();
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) {
      supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id)
        .then(() => setIsOnboarding(false));
    }
  });
}
```

There are two places to add this:
1. Standard mode: after `setStep("result")` at ~line 416
2. Photo mode SSE: inside the `useEffect` that watches `photoGen.status === "done"` and calls `setStep("result")`

**Step 3: Add progress bar to result step**

Find result step JSX and prepend:
```tsx
{isOnboarding && <OnboardingProgressBar step="result" />}
```

**Step 4: Commit**
```bash
git add app/\(dashboard\)/generate/page.tsx
git commit -m "feat(onboarding): mark complete on result, show progress bar through all steps"
```

---

### Task 6: Mobile swipeable slide cards on result step

**Files:**
- Modify: `app/(dashboard)/generate/page.tsx`

**Step 1: Locate the result step slide preview grid**

In the result step JSX, find where slides are rendered (likely a `grid` or `flex` container iterating over `result.slides`).

**Step 2: Replace with responsive container**

Wrap the slides in a responsive container:

```tsx
{/* Mobile: horizontal swipeable | Desktop: existing grid */}
<div
  className="md:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4"
  style={{ scrollbarWidth: "none" }}
>
  {result.slides.map((slide, i) => (
    <div
      key={i}
      className="flex-shrink-0 w-[85vw] snap-center"
      onClick={() => setCurrentSlide(i)}
    >
      <SlideRenderer
        slide={slide}
        template={activeTemplate}
        format={format}
        scale={slideScale}
        isActive={currentSlide === i}
      />
    </div>
  ))}
</div>

{/* Pagination dots — mobile only */}
<div className="md:hidden flex justify-center gap-1.5 mt-2">
  {result.slides.map((_, i) => (
    <button
      key={i}
      onClick={() => setCurrentSlide(i)}
      className={`w-1.5 h-1.5 rounded-full transition-all ${
        i === currentSlide
          ? "bg-[#D4F542] w-3"
          : "bg-muted-foreground/30"
      }`}
    />
  ))}
</div>

{/* Desktop: existing grid (unchanged) */}
<div className="hidden md:grid ...existing classes...">
  {/* existing slide grid content */}
</div>
```

Note: The existing desktop grid stays exactly as-is — just wrap it with `hidden md:grid`.

**Step 3: Verify on mobile viewport (Chrome DevTools, 390px width)**
- Slides are horizontally swipeable
- Dots update as you swipe (via click, scroll detection is optional)
- Desktop view unchanged

**Step 4: Commit**
```bash
git add app/\(dashboard\)/generate/page.tsx
git commit -m "feat(onboarding): mobile swipeable slide cards on result step"
```

---

### Task 7: Clean up `/onboarding` route

**Files:**
- Modify: `app/(dashboard)/onboarding/page.tsx`

**Step 1: Replace page content with a redirect to `/generate`**

```tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/generate");
  }, [router]);
  return null;
}
```

This keeps the route alive (no 404 for any bookmarked/cached links) but silently redirects.

**Step 2: Commit**
```bash
git add app/\(dashboard\)/onboarding/page.tsx
git commit -m "feat(onboarding): redirect legacy /onboarding to /generate"
```

---

## Manual Test Checklist

After all tasks:

- [ ] New signup (email/password) → lands on `/generate` with progress bar, simplified form
- [ ] Fill in text → click "Создать карусель →" → goes to template step with progress bar
- [ ] Choose template → generates → result step shows progress bar at step 3
- [ ] Check Supabase: `profiles.onboarding_completed = true` for that user
- [ ] Refresh `/generate` → no progress bar (normal UI)
- [ ] Mobile (390px): result step has swipeable cards + dots
- [ ] Desktop: result step unchanged
- [ ] Visit `/onboarding` directly → redirects to `/generate`
- [ ] Existing user → `/generate` shows normal UI from the start
