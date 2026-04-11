# Single-Page Generation Wizard — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Collapse 4-step wizard into one mobile-first form, removing platform/goal steps and adding a brief/context field.

**Architecture:** Single `"form"` state replaces 4 wizard steps. All controls visible at once. Mobile layout is primary (single-column, sticky CTA); desktop enhances with two-column grid. API gets optional `brief` field injected into system prompt.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind CSS 4, existing `TemplateSwitcher` modal, `sonner` toast, `framer-motion` for transitions.

**Design doc:** `docs/plans/2026-03-02-single-page-wizard-design.md`

---

### Task 1: Update API — add `brief` field to generate route

**Files:**
- Modify: `app/api/generate/route.ts`

**Step 1: Add `brief` to body type and destructuring**

Find the `body` type declaration (line ~424) and add `brief`:
```ts
let body: {
  text: string;
  template: string;
  slideCount: number;
  format?: string;
  tone?: string;
  platform?: string;
  goal?: string;
  brief?: string;          // ← add this
  preserveText?: boolean;
};
```

Then update destructuring (line ~441):
```ts
const { text, template, slideCount, format, tone, platform, goal, brief, preserveText } = body;
```

**Step 2: Add `briefSection` to `buildSystemPrompt`**

Change the function signature (line ~192):
```ts
function buildSystemPrompt(
  templateId: string,
  slideCount: number,
  tone?: string,
  tovGuidelines?: string,
  platform?: string,
  goal?: string,
  brief?: string,          // ← add
): string {
```

Inside the function, after `tovSection` definition, add:
```ts
const briefSection = brief?.trim()
  ? `\nПОЖЕЛАНИЯ АВТОРА:\n${brief.trim()}\n`
  : "";
```

Then update the template string to inject `briefSection`. Find the line with `${tovSection}${platformSection}${goalSection}` and change to:
```ts
${tovSection}${briefSection}${platformSection}${goalSection}
```

**Step 3: Pass `brief` when calling `buildSystemPrompt`**

Find the call to `buildSystemPrompt` (line ~472):
```ts
: buildSystemPrompt(template, slideCount, tone, tovGuidelines, platform, goal, brief);
```

**Step 4: Verify manually**

Run `npm run dev` in `swipely-nextjs/`, open `/generate`, check no TS errors in terminal.

**Step 5: Commit**
```bash
cd swipely-nextjs
git add app/api/generate/route.ts
git commit -m "feat(api): add optional brief/context field to generate prompt"
```

---

### Task 2: Refactor `generate/page.tsx` — state machine + remove dead code

**Files:**
- Modify: `app/(dashboard)/generate/page.tsx`

**Step 1: Update the `Step` type and remove constants**

Replace:
```ts
type Step = "input" | "platform_goal" | "template" | "settings" | "generating" | "result";
```
With:
```ts
type Step = "form" | "generating" | "result";
```

Remove these constants entirely (they're no longer used):
```ts
const STEPS = ["input", "platform_goal", "template", "settings"] as const;
const STEP_LABELS: Record<string, string> = { ... };
const PLATFORMS = [...] as const;
const GOALS = [...] as const;
```

**Step 2: Add `brief` state, update initial step, fix error fallback**

Add after other useState declarations:
```ts
const [brief, setBrief] = useState("");
```

Change initial step:
```ts
const [step, setStep] = useState<Step>("form");
```

In `handleGenerate`, change error fallback from `setStep("settings")` to:
```ts
setStep("form");
```

In `handleTranscribe`, change `setStep("platform_goal")` to nothing (just leave on `"form"`):
```ts
setText(data.transcript);
setVideoUrl("");
// step stays "form"
```

**Step 3: Pass `brief` to API call and update `handleReset`**

In the fetch call inside `handleGenerate`, add `brief` to the body:
```ts
body: JSON.stringify({
  text,
  template: selectedTemplate,
  slideCount,
  format,
  tone,
  brief,
  preserveText,
}),
```

In `handleReset`, add:
```ts
setBrief("");
```

Remove `setPlatform("")` and `setGoal("")` from `handleReset`.

**Step 4: Remove `platform`/`goal` state declarations**

Remove:
```ts
const [platform, setPlatform] = useState("");
const [goal, setGoal] = useState("");
```

**Step 5: Remove `goToNextStep` and `goToPrevStep` functions entirely**

Delete both functions.

**Step 6: Commit interim state**
```bash
git add app/(dashboard)/generate/page.tsx
git commit -m "refactor(generate): collapse wizard state machine to form/generating/result"
```

---

### Task 3: Build the form UI — left column (content inputs)

**Files:**
- Modify: `app/(dashboard)/generate/page.tsx`

**Step 1: Replace the step indicator block**

Find the step indicator `<FadeIn>` block (the dots/labels, around line 453). Remove it entirely. It should no longer render.

**Step 2: Replace the `{step === "input" && ...}` block with `{step === "form" && ...}`**

The new form JSX structure (left column content, desktop grid handled in Task 4):

```tsx
{step === "form" && (
  <PageTransition id="form" className="space-y-5">
    {/* Email verification banner — keep exactly as-is */}
    {emailUnverified && ( ... existing banner JSX ... )}

    <div>
      <h1 className="text-3xl font-bold mb-1 text-[#0D0D14]">Создать карусель</h1>
      <p className="text-muted-foreground text-sm">Введи тему — AI сделает остальное</p>
    </div>

    {/* Outer grid: single col mobile, two col desktop */}
    <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-6 lg:items-start space-y-5 lg:space-y-0">

      {/* LEFT COLUMN */}
      <div className="space-y-4">

        {/* Mode toggle — keep existing 2-button grid JSX, just move here */}
        <div className="grid grid-cols-2 gap-3">
          {/* ... existing Стандарт / AI Фото buttons ... */}
        </div>

        {/* Main text input */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#0D0D14]">
            {mode === "photo" ? "Тема карусели" : "Текст или идея"}
          </label>
          {/* Video URL input (inputMode === "video") — keep existing JSX */}
          {/* Text textarea (inputMode === "text") */}
          {inputMode === "text" && (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Например: 5 причин перейти на контент с AI..."
              rows={4}
              className="w-full rounded-2xl border border-[#E8E8E4] bg-white px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#D4F542] focus:border-transparent transition-all placeholder:text-[#9CA3AF]"
            />
          )}
          {/* Keep existing video URL block for inputMode === "video" */}
        </div>

        {/* Brief field (standard mode only — not preserve text, not photo) */}
        {mode === "standard" && !preserveText && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#0D0D14]">
              Бриф{" "}
              <span className="text-[#9CA3AF] font-normal">(опционально)</span>
            </label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Для кого, ключевые акценты, пожелания по тону..."
              rows={2}
              className="w-full rounded-2xl border border-[#E8E8E4] bg-white px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#D4F542] focus:border-transparent transition-all placeholder:text-[#9CA3AF]"
            />
          </div>
        )}

        {/* Preserve text toggle (standard mode only) */}
        {mode === "standard" && (
          /* keep existing preserveText toggle JSX */
        )}

        {/* Photo upload area (photo mode only) — keep existing JSX */}
        {mode === "photo" && (
          /* keep existing photo upload + style picker JSX */
        )}

      </div>

      {/* RIGHT COLUMN — built in Task 4 */}
      <div className="space-y-4">
        {/* placeholder — filled in Task 4 */}
      </div>

    </div>

    {/* Mobile sticky CTA — hidden on lg (desktop CTA is in right column) */}
    <div className="sticky bottom-0 lg:hidden bg-white/95 backdrop-blur-sm border-t border-[#E8E8E4] -mx-6 px-6 py-4 mt-2">
      <Button
        onClick={handleGenerate}
        disabled={!text.trim() || (mode === "photo" && !referencePhoto)}
        className="w-full h-12 text-base font-semibold bg-[#0D0D14] hover:bg-[#1a1a2e] text-white rounded-2xl"
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Создать карусель
      </Button>
    </div>

  </PageTransition>
)}
```

**Step 3: Remove old step blocks**

Delete the entire `{step === "platform_goal" && ...}` block.
Delete the entire `{step === "template" && ...}` block.
Delete the entire `{step === "settings" && ...}` block.

Change `{step === "input" && ...}` references to `{step === "form" && ...}` (already done in step 2).

**Step 4: Verify no TypeScript errors**

Check terminal where `npm run dev` is running — should show 0 TS errors.

**Step 5: Commit**
```bash
git add app/(dashboard)/generate/page.tsx
git commit -m "feat(generate): single-page form with brief field, remove platform/goal steps"
```

---

### Task 4: Build the right column — template selector + settings + desktop CTA

**Files:**
- Modify: `app/(dashboard)/generate/page.tsx`

This fills in the `{/* RIGHT COLUMN */}` div from Task 3.

**Step 1: Template compact selector**

Define a color map above the component (or inline):
```ts
const TEMPLATE_COLORS: Record<string, string> = {
  swipely: "#0A84FF",
  grid_multi: "#F59E0B",
  purple_accent: "#8B5CF6",
  receipt: "#374151",
  quote_doodle: "#F9A8D4",
  speech_bubble: "#10B981",
  star_highlight: "#EAB308",
  street: "#0D0D14",
  chapter: "#92400E",
  dispatch: "#4C1D95",
  frame: "#78716C",
};
```

Template selector JSX (inside right column div):
```tsx
{mode === "standard" && (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-[#0D0D14]">Шаблон</label>
      <button
        onClick={() => setShowTemplateSwitcher(true)}
        className="text-xs text-[#6B7280] hover:text-[#0D0D14] transition-colors"
      >
        Все шаблоны →
      </button>
    </div>
    <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-hide">
      {templates.map((t) => {
        const isLocked = !isPro && (PRO_ONLY_TEMPLATE_IDS as readonly string[]).includes(t.id);
        const isActive = selectedTemplate === t.id;
        return (
          <button
            key={t.id}
            onClick={() => {
              if (isLocked) {
                toast("Нужен PRO для этого шаблона", { description: "Перейди на PRO чтобы разблокировать" });
                return;
              }
              setSelectedTemplate(t.id);
            }}
            className={`snap-start flex-shrink-0 flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 transition-all min-w-[88px] relative ${
              isActive
                ? "border-[#D4F542] bg-[#D4F542]/5"
                : "border-[#E8E8E4] bg-white hover:border-[#D4F542]/40"
            }`}
          >
            <div
              className="w-5 h-5 rounded-full flex-shrink-0"
              style={{ backgroundColor: TEMPLATE_COLORS[t.id] ?? "#9CA3AF" }}
            />
            <span className="text-[11px] font-medium text-[#0D0D14] leading-tight text-center">
              {t.nameRu}
            </span>
            {isLocked && (
              <Lock className="absolute top-1.5 right-1.5 h-3 w-3 text-[#9CA3AF]" />
            )}
          </button>
        );
      })}
    </div>
  </div>
)}
```

**Step 2: Slide count chips**
```tsx
<div className="space-y-2">
  <label className="text-sm font-medium text-[#0D0D14]">Слайдов</label>
  <div className="flex gap-2 flex-wrap">
    {SLIDE_COUNTS.map((count) => {
      const isLocked = !isPro && PRO_SLIDE_COUNTS.includes(count);
      return (
        <button
          key={count}
          onClick={() => {
            if (isLocked) {
              toast("Нужен PRO", { description: `${count} слайдов доступны на PRO тарифе` });
              return;
            }
            setSlideCount(count);
          }}
          className={`flex items-center gap-1 px-4 h-10 rounded-xl border-2 text-sm font-medium transition-all ${
            slideCount === count
              ? "border-[#D4F542] bg-[#D4F542]/10 text-[#0D0D14]"
              : "border-[#E8E8E4] bg-white text-[#374151] hover:border-[#D4F542]/40"
          }`}
        >
          {count}
          {isLocked && <Lock className="h-3 w-3 text-[#9CA3AF]" />}
        </button>
      );
    })}
  </div>
</div>
```

**Step 3: Tone 2×2 grid**
```tsx
{mode === "standard" && (
  <div className="space-y-2">
    <label className="text-sm font-medium text-[#0D0D14]">Тон</label>
    <div className="grid grid-cols-2 gap-2">
      {TONES.map((t) => (
        <button
          key={t.id}
          onClick={() => setTone(t.id)}
          className={`flex items-center gap-2 px-3 h-11 rounded-xl border-2 text-sm font-medium transition-all text-left ${
            tone === t.id
              ? "border-[#D4F542] bg-[#D4F542]/10 text-[#0D0D14]"
              : "border-[#E8E8E4] bg-white text-[#374151] hover:border-[#D4F542]/40"
          }`}
        >
          <span>{t.emoji}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  </div>
)}
```

**Step 4: Format toggle**
```tsx
<div className="space-y-2">
  <label className="text-sm font-medium text-[#0D0D14]">Формат</label>
  <div className="grid grid-cols-2 gap-2">
    {FORMATS.map((f) => (
      <button
        key={f.id}
        onClick={() => setFormat(f.id)}
        className={`flex flex-col items-center justify-center gap-0.5 h-14 rounded-xl border-2 transition-all ${
          format === f.id
            ? "border-[#D4F542] bg-[#D4F542]/10"
            : "border-[#E8E8E4] bg-white hover:border-[#D4F542]/40"
        }`}
      >
        <span className="text-base">{f.id === "square" ? "■" : "▬"}</span>
        <span className="text-xs font-medium text-[#0D0D14]">{f.label}</span>
        <span className="text-[10px] text-[#9CA3AF]">{f.size}</span>
      </button>
    ))}
  </div>
</div>
```

**Step 5: Desktop CTA (hidden on mobile)**
```tsx
{/* Desktop CTA — hidden on mobile (mobile has sticky bottom bar) */}
<div className="hidden lg:block pt-2">
  <Button
    onClick={handleGenerate}
    disabled={!text.trim() || (mode === "photo" && !referencePhoto)}
    className="w-full h-12 text-base font-semibold bg-[#0D0D14] hover:bg-[#1a1a2e] text-white rounded-2xl"
  >
    <Sparkles className="h-4 w-4 mr-2" />
    Создать карусель
  </Button>
</div>
```

**Step 6: Wire up TemplateSwitcher modal (keep existing)**

`TemplateSwitcher` is already imported and its `showTemplateSwitcher` state already exists. No changes needed — the "Все шаблоны →" button in step 1 calls `setShowTemplateSwitcher(true)`.

**Step 7: Visual check**

Open `http://localhost:3000/generate` on mobile viewport (375px) in DevTools:
- [ ] Both textareas visible
- [ ] Brief field appears in standard mode, hidden in photo mode
- [ ] Template scroll works with finger drag simulation
- [ ] Tone shows 2×2 grid
- [ ] Sticky CTA visible at bottom
- [ ] No horizontal overflow

Switch to desktop (1280px):
- [ ] Two-column layout
- [ ] CTA in right column (not sticky)
- [ ] Template scroll or wraps

**Step 8: Commit**
```bash
git add app/(dashboard)/generate/page.tsx
git commit -m "feat(generate): mobile-first right column — template selector, settings, CTA"
```

---

### Task 5: Polish + edge cases

**Files:**
- Modify: `app/(dashboard)/generate/page.tsx`

**Step 1: Photo mode — hide brief field, fix slide counts**

Photo mode already hides template step. In the brief field condition (`mode === "standard" && !preserveText`), photo mode is already excluded. Verify slide count for photo mode is capped at 3-7 (already handled by the API, but UI should also hide 9/12 when `mode === "photo"`):

Add condition to the slide count map:
```tsx
{SLIDE_COUNTS.filter(count => mode === "photo" ? count <= 7 : true).map((count) => { ... })}
```

**Step 2: Video transcription stays on `"form"`**

Already handled in Task 2. Confirm `handleTranscribe` no longer calls `setStep("platform_goal")`.

**Step 3: Generating + result steps unchanged**

The `{step === "generating" && ...}` and `{step === "result" && ...}` blocks remain untouched from before. Only their error fallback changed (`setStep("form")` instead of `setStep("settings")`).

**Step 4: Add `scrollbar-hide` utility if not already in Tailwind config**

Check `tailwind.config.ts`. If not present, the template scroll will show a scrollbar on desktop. Add via CSS in `globals.css`:
```css
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
```

**Step 5: Full E2E manual test**

- [ ] Standard mode: fill topic + brief, pick template, set slides/tone/format → Generate → result appears
- [ ] Preserve text mode: brief hidden, toggle works
- [ ] Photo mode: upload photo, brief hidden, slide count capped at 7
- [ ] Video URL: paste YouTube link, transcribe, text populates, stays on form
- [ ] PRO-locked template: toast shows, selection blocked
- [ ] PRO-locked slide count (9, 12): toast shows
- [ ] Email unverified banner still shows
- [ ] Reset from result → back to clean form

**Step 6: Final commit**
```bash
git add app/(dashboard)/generate/page.tsx app/globals.css
git commit -m "fix(generate): photo mode slide cap, scrollbar-hide, edge cases"
```

---

## Summary of Files Changed

| File | Change |
|------|--------|
| `app/api/generate/route.ts` | Add `brief` field to body type + prompt |
| `app/(dashboard)/generate/page.tsx` | Major refactor: state machine, new form layout, all tasks above |
| `app/globals.css` | Add `.scrollbar-hide` utility if missing |
