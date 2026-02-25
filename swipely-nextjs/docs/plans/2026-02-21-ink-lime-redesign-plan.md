# Ink & Lime Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the entire Swipely dashboard with an Ink & Lime editorial aesthetic — dark sidebar, warm off-white main area, lime as the primary accent replacing blue.

**Architecture:** Pure CSS class and token changes across 6 files. No logic, routing, or API changes. globals.css token update cascades through all shadcn/ui components automatically.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS 4, framer-motion, shadcn/ui, CSS custom properties

---

## Task 1: Update CSS design tokens in globals.css

**Files:**
- Modify: `app/globals.css`

**Step 1: Change the `:root` color variables**

In `app/globals.css`, replace the `:root` block (lines 49–95). Key changes:
- `--primary`: `#0A84FF` → `#D4F542`
- `--primary-foreground`: `#FFFFFF` → `#0D0D14`
- `--background`: `#FFFFFF` → `#FAFAF9`
- `--ring`: `#0A84FF` → `#D4F542`
- `--sidebar`: `#0A84FF` → `#0D0D14`
- `--sidebar-primary`: `#FFFFFF` → `#D4F542`
- `--sidebar-primary-foreground`: `#0A84FF` → `#0D0D14`
- `--sidebar-accent`: `rgba(255,255,255,0.15)` → `rgba(212,245,66,0.12)`
- `--sidebar-accent-foreground`: `#FFFFFF` → `#D4F542`

Add new token inside `:root`:
```css
--ink: #0D0D14;
--lime: #D4F542;
--lime-hover: #c8e83a;
--on-lime: #0D0D14;
```

Full updated `:root` block to replace at lines 49–95:
```css
:root {
  --radius: 0.625rem;

  /* Swipely Brand Colors — Ink & Lime */
  --background: #FAFAF9;
  --foreground: #0D0D14;
  --card: #FFFFFF;
  --card-foreground: #0D0D14;
  --popover: #FFFFFF;
  --popover-foreground: #0D0D14;
  --primary: #D4F542;
  --primary-foreground: #0D0D14;
  --secondary: #F0F7FF;
  --secondary-foreground: #0A84FF;
  --muted: #F0F0ED;
  --muted-foreground: #6B7280;
  --accent: #D4F542;
  --accent-foreground: #0D0D14;
  --destructive: #EF4444;
  --border: #E8E8E4;
  --input: #E8E8E4;
  --ring: #D4F542;
  --chart-1: #D4F542;
  --chart-2: #0A84FF;
  --chart-3: #F9A8D4;
  --chart-4: #3D9FFF;
  --chart-5: #0066CC;

  /* Sidebar */
  --sidebar: #0D0D14;
  --sidebar-foreground: #FFFFFF;
  --sidebar-primary: #D4F542;
  --sidebar-primary-foreground: #0D0D14;
  --sidebar-accent: rgba(212, 245, 66, 0.12);
  --sidebar-accent-foreground: #D4F542;
  --sidebar-border: rgba(255, 255, 255, 0.08);
  --sidebar-ring: rgba(212, 245, 66, 0.3);

  /* Extended brand tokens */
  --ink: #0D0D14;
  --lime: #D4F542;
  --lime-hover: #c8e83a;
  --on-lime: #0D0D14;
  --swipely-blue: #0A84FF;
  --swipely-blue-dark: #0066CC;
  --swipely-blue-light: #3D9FFF;
  --swipely-lime: #D4F542;
  --swipely-pink: #F9A8D4;
  --swipely-charcoal: #1A1A2E;
  --swipely-charcoal-light: #2D2D44;
}
```

**Step 2: Update gradient-bg utility to match warm off-white**

In `globals.css`, find `.gradient-bg` and update the last color from `#FFFFFF` to `#FAFAF9`:
```css
.gradient-bg {
  ...
  background:
    radial-gradient(ellipse 80% 50% at 20% 40%, rgba(212, 245, 66, 0.06) 0%, transparent 50%),
    radial-gradient(ellipse 60% 60% at 80% 20%, rgba(10, 132, 255, 0.04) 0%, transparent 50%),
    radial-gradient(ellipse 50% 80% at 60% 80%, rgba(212, 245, 66, 0.04) 0%, transparent 50%),
    #FAFAF9;
  ...
}
```

Also update `.text-gradient`:
```css
.text-gradient {
  background: linear-gradient(135deg, var(--ink) 0%, #2D2D44 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

**Step 3: Verify visually**

Run `npm run dev` in `swipely-nextjs/`. Open `http://localhost:3000/dashboard`.
Expected: sidebar turns near-black `#0D0D14`, background becomes warm off-white.

**Step 4: Commit**

```bash
cd swipely-nextjs
git add app/globals.css
git commit -m "feat(design): update CSS tokens — ink sidebar, lime primary, warm bg"
```

---

## Task 2: Redesign sidebar in layout.tsx

**Files:**
- Modify: `app/(dashboard)/layout.tsx`

**Step 1: Update sidebar background and balance card**

In `layout.tsx`, find the `<aside>` opening tag (line 52):
```tsx
// BEFORE
<aside className={`w-64 bg-[var(--swipely-blue)] text-white p-6 flex flex-col ${className}`}>

// AFTER
<aside className={`w-64 bg-[#0D0D14] text-white p-6 flex flex-col ${className}`}>
```

Find the balance card div (line 73, `className="mb-6 rounded-2xl bg-white/10 ..."`):
```tsx
// BEFORE
<div className="mb-6 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
  <div className="text-xs text-white/60 mb-1">Генерации</div>
  <div className="text-2xl font-bold font-[family-name:var(--font-mono)]">
    {loading ? "—" : remaining}{" "}
    <span className="text-sm font-normal text-white/60">
      / {loading ? "—" : limitLabel}
    </span>
  </div>
  <div className="text-xs text-white/50 mt-1">
    {tier === "pro" ? "PRO тариф" : "Бесплатный тариф"}
  </div>

// AFTER
<div className="mb-6 rounded-2xl bg-[#D4F542] p-4">
  <div className="text-xs text-[#0D0D14]/60 mb-1">Генерации</div>
  <div className="text-2xl font-bold font-[family-name:var(--font-mono)] text-[#0D0D14]">
    {loading ? "—" : remaining}{" "}
    <span className="text-sm font-normal text-[#0D0D14]/50">
      / {loading ? "—" : limitLabel}
    </span>
  </div>
  <div className="text-xs text-[#0D0D14]/50 mt-1">
    {tier === "pro" ? "PRO тариф" : "Бесплатный тариф"}
  </div>
```

**Step 2: Update PRO upgrade button inside balance card**

Find the upgrade Button (lines 87–93):
```tsx
// BEFORE
<Button
  size="sm"
  className="w-full mt-3 rounded-full bg-white text-[var(--swipely-blue)] hover:bg-white/90 active:scale-[0.98] text-xs font-semibold transition-all"
>
  <CreditCard className="h-3 w-3 mr-1.5" />
  Перейти на PRO
</Button>

// AFTER
<Button
  size="sm"
  className="w-full mt-3 rounded-full bg-[#0D0D14] text-white hover:bg-[#1A1A2E] active:scale-[0.98] text-xs font-semibold transition-all"
>
  <CreditCard className="h-3 w-3 mr-1.5" />
  Перейти на PRO
</Button>
```

**Step 3: Update active nav item styles**

Find the active nav item className (line 107):
```tsx
// BEFORE
isActive
  ? "bg-white/20 text-white"
  : "text-white/70 hover:bg-white/10 hover:text-white"

// AFTER
isActive
  ? "bg-[#D4F542]/15 text-[#D4F542]"
  : "text-white/50 hover:bg-white/8 hover:text-white/90"
```

Find the active indicator bar (line 116):
```tsx
// BEFORE
<motion.div
  layoutId="sidebar-active"
  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-full"
  ...
/>

// AFTER
<motion.div
  layoutId="sidebar-active"
  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#D4F542] rounded-full"
  ...
/>
```

**Step 4: Update footer border and logout button**

Find the user section border (line 129):
```tsx
// BEFORE
<div className="mt-auto pt-4 border-t border-white/15">

// AFTER
<div className="mt-auto pt-4 border-t border-white/10">
```

Find the email muted text (line 132):
```tsx
// BEFORE
<p className="text-xs text-white/50">Вход как:</p>

// AFTER
<p className="text-xs text-white/40">Вход как:</p>
```

**Step 5: Update header "Создать карусель" button**

Find the top bar Button (lines 300–305):
```tsx
// BEFORE
<Button
  size="sm"
  className="rounded-full bg-[var(--swipely-blue)] hover:bg-[var(--swipely-blue-dark)] active:scale-[0.98] transition-all shadow-sm hover:shadow-md"
>
  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
  Создать карусель
</Button>

// AFTER
<Button
  size="sm"
  className="rounded-full bg-[#D4F542] text-[#0D0D14] hover:bg-[#c8e83a] active:scale-[0.98] transition-all shadow-sm hover:shadow-md font-semibold"
>
  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
  Создать карусель
</Button>
```

**Step 6: Verify visually**

Reload `http://localhost:3000/dashboard`. Expected:
- Sidebar is near-black
- Balance card is yellow/lime with dark text
- Active nav item has lime text
- "Создать карусель" button is lime

**Step 7: Commit**

```bash
git add app/(dashboard)/layout.tsx
git commit -m "feat(design): redesign sidebar — ink bg, lime balance card, lime nav"
```

---

## Task 3: Upgrade step indicator on Generate page

**Files:**
- Modify: `app/(dashboard)/generate/page.tsx`

**Step 1: Add step labels data near the top of the file**

After the `STEPS` constant (line 77), add:
```tsx
const STEP_LABELS: Record<string, string> = {
  input: "Контент",
  platform_goal: "Платформа",
  template: "Шаблон",
  settings: "Настройки",
};
```

**Step 2: Replace the step indicator JSX**

Find the step indicator block (lines 373–408):
```tsx
// BEFORE
<FadeIn className="flex items-center gap-2 mb-8">
  {STEPS.map((s, i) => {
    const isResult = step === "result";
    const stepIdx = STEPS.indexOf(step as typeof STEPS[number]);
    const isPast = stepIdx > i || isResult;
    const isCurrent = step === s;
    return (
      <div key={s} className="flex items-center gap-2">
        <div className="relative">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-[family-name:var(--font-mono)] transition-all duration-300 ${
              isCurrent || isResult
                ? "bg-[var(--swipely-blue)] text-white shadow-md shadow-[var(--swipely-blue)]/30"
                : isPast
                  ? "bg-[var(--swipely-blue)]/20 text-[var(--swipely-blue)]"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {isPast ? <Check className="h-4 w-4" /> : i + 1}
          </div>
        </div>
        {i < STEPS.length - 1 && (
          <div
            className={`w-12 h-0.5 transition-colors duration-500 ${
              isPast
                ? "bg-[var(--swipely-blue)]/30"
                : "bg-muted"
            }`}
          />
        )}
      </div>
    );
  })}
</FadeIn>

// AFTER
<FadeIn className="flex items-center gap-1 mb-10">
  {STEPS.map((s, i) => {
    const isResult = step === "result";
    const stepIdx = STEPS.indexOf(step as typeof STEPS[number]);
    const isPast = stepIdx > i || isResult;
    const isCurrent = step === s;
    return (
      <div key={s} className="flex items-center gap-1">
        <div className="flex flex-col items-center gap-1.5">
          <div
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              isCurrent
                ? "bg-[#D4F542] scale-125 shadow-sm shadow-[#D4F542]/40"
                : isPast
                  ? "bg-[#0D0D14]"
                  : "bg-[#E8E8E4]"
            }`}
          />
          <span
            className={`text-xs font-medium transition-colors duration-300 hidden sm:block ${
              isCurrent
                ? "text-[#0D0D14]"
                : isPast
                  ? "text-[#6B7280]"
                  : "text-[#9CA3AF]"
            }`}
          >
            {STEP_LABELS[s]}
          </span>
        </div>
        {i < STEPS.length - 1 && (
          <div
            className={`w-10 h-0.5 mb-4 transition-colors duration-500 ${
              isPast ? "bg-[#D4F542]/50" : "bg-[#E8E8E4]"
            }`}
          />
        )}
      </div>
    );
  })}
</FadeIn>
```

**Step 3: Increase H1 size on the input step**

Find line 415:
```tsx
// BEFORE
<h1 className="text-2xl font-bold mb-2">Создать карусель</h1>

// AFTER
<h1 className="text-3xl font-bold mb-2 text-[#0D0D14]">Создать карусель</h1>
```

**Step 4: Verify**

Reload `/generate`. Expected:
- Step indicator shows dots + labels (Контент, Платформа, etc.)
- Active dot is lime and slightly larger
- Past dots are charcoal
- Heading is larger

**Step 5: Commit**

```bash
git add app/(dashboard)/generate/page.tsx
git commit -m "feat(design): upgrade step indicator with named dots + lime active state"
```

---

## Task 4: Upgrade mode toggle cards on Generate page

**Files:**
- Modify: `app/(dashboard)/generate/page.tsx`

**Step 1: Replace the segmented mode toggle with card-style selector**

Find the mode toggle block (lines 422–445) — the `flex rounded-2xl border` div:
```tsx
// BEFORE
<div className="flex rounded-2xl border border-border bg-muted/50 p-1 gap-1">
  <button onClick={() => setMode("standard")} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${mode === "standard" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
    <ImageIcon className="h-4 w-4" />
    Стандарт
  </button>
  <button onClick={() => setMode("photo")} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${mode === "photo" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
    <Camera className="h-4 w-4" />
    AI Фото
  </button>
</div>

// AFTER
<div className="grid grid-cols-2 gap-3">
  <button
    onClick={() => setMode("standard")}
    className={`flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
      mode === "standard"
        ? "border-[#D4F542] bg-[#D4F542]/5 shadow-sm"
        : "border-[#E8E8E4] bg-white hover:border-[#D4F542]/40 hover:shadow-sm"
    }`}
  >
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${mode === "standard" ? "bg-[#D4F542]/20" : "bg-[#F0F0ED]"}`}>
      <ImageIcon className={`h-4 w-4 ${mode === "standard" ? "text-[#0D0D14]" : "text-[#6B7280]"}`} />
    </div>
    <div>
      <p className={`text-sm font-semibold ${mode === "standard" ? "text-[#0D0D14]" : "text-[#374151]"}`}>Стандарт</p>
      <p className="text-xs text-[#9CA3AF] mt-0.5">Текст в слайды</p>
    </div>
  </button>

  <button
    onClick={() => setMode("photo")}
    className={`flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
      mode === "photo"
        ? "border-[#D4F542] bg-[#D4F542]/5 shadow-sm"
        : "border-[#E8E8E4] bg-white hover:border-[#D4F542]/40 hover:shadow-sm"
    }`}
  >
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${mode === "photo" ? "bg-[#D4F542]/20" : "bg-[#F0F0ED]"}`}>
      <Camera className={`h-4 w-4 ${mode === "photo" ? "text-[#0D0D14]" : "text-[#6B7280]"}`} />
    </div>
    <div>
      <p className={`text-sm font-semibold ${mode === "photo" ? "text-[#0D0D14]" : "text-[#374151]"}`}>AI Фото</p>
      <p className="text-xs text-[#9CA3AF] mt-0.5">Фото на каждом слайде</p>
    </div>
  </button>
</div>
```

**Step 2: Update textarea focus ring from blue to lime**

Find the textarea (line 572):
```tsx
// BEFORE
className="w-full h-48 rounded-2xl border border-border bg-card p-5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--swipely-blue)]/50 focus:border-[var(--swipely-blue)] placeholder:text-muted-foreground/60 transition-all"

// AFTER
className="w-full h-48 rounded-2xl border border-[#E8E8E4] bg-white p-5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#D4F542]/60 focus:border-[#D4F542] placeholder:text-[#9CA3AF] transition-all"
```

Also update video URL input (line 534):
```tsx
// BEFORE
className="w-full rounded-2xl border border-border bg-card px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--swipely-blue)]/50 focus:border-[var(--swipely-blue)] placeholder:text-muted-foreground/60 transition-all"

// AFTER
className="w-full rounded-2xl border border-[#E8E8E4] bg-white px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4F542]/60 focus:border-[#D4F542] placeholder:text-[#9CA3AF] transition-all"
```

**Step 3: Update all "Далее" / CTA buttons from blue to lime**

Find the main CTA button on input step (line 582):
```tsx
// BEFORE
className="rounded-full px-8 bg-[var(--swipely-blue)] hover:bg-[var(--swipely-blue-dark)] active:scale-[0.98] transition-all shadow-sm"

// AFTER
className="rounded-full px-8 bg-[#D4F542] text-[#0D0D14] hover:bg-[#c8e83a] active:scale-[0.98] transition-all shadow-sm font-semibold"
```

Find the video transcribe button (line 542):
```tsx
// BEFORE
className="w-full rounded-full bg-[var(--swipely-blue)] hover:bg-[var(--swipely-blue-dark)] transition-all"

// AFTER
className="w-full rounded-full bg-[#D4F542] text-[#0D0D14] hover:bg-[#c8e83a] transition-all font-semibold"
```

Also update the drag-to-upload area (line 473–477) — replace blue references:
```tsx
// BEFORE
isDragging
  ? "border-[var(--swipely-blue)] bg-[var(--swipely-blue)]/10 scale-[1.02]"
  : "border-border hover:border-[var(--swipely-blue)]/50 bg-muted/30 hover:bg-muted/50"

// AFTER
isDragging
  ? "border-[#D4F542] bg-[#D4F542]/8 scale-[1.02]"
  : "border-[#E8E8E4] hover:border-[#D4F542]/50 bg-[#F8F8F6] hover:bg-[#F5F5F2]"
```

And upload icon bg (line 479):
```tsx
// BEFORE
<div className="w-12 h-12 rounded-full bg-[var(--swipely-blue)]/10 flex items-center justify-center">
  <Upload className="h-5 w-5 text-[var(--swipely-blue)]" />

// AFTER
<div className="w-12 h-12 rounded-full bg-[#D4F542]/15 flex items-center justify-center">
  <Upload className="h-5 w-5 text-[#0D0D14]" />
```

**Step 4: Update input mode tabs (Text/Video)**

Find the input mode tabs (lines 503–524):
```tsx
// BEFORE (both buttons)
inputMode === "text"
  ? "bg-background shadow-sm text-foreground"
  : "text-muted-foreground hover:text-foreground"

// AFTER (both buttons)
inputMode === "text"  // or "video"
  ? "bg-white shadow-sm text-[#0D0D14] font-semibold"
  : "text-[#9CA3AF] hover:text-[#374151]"
```

**Step 5: Verify**

Reload `/generate`. Expected:
- Mode cards are larger with icon + description
- Selected card has lime border + light lime tint
- Textarea gets lime focus ring (yellow glow)
- "Далее" button is lime

**Step 6: Commit**

```bash
git add app/(dashboard)/generate/page.tsx
git commit -m "feat(design): upgrade mode cards, lime focus rings, lime CTA buttons"
```

---

## Task 5: Search remaining blue references in generate page and fix other steps

**Files:**
- Modify: `app/(dashboard)/generate/page.tsx`

**Step 1: Search for remaining blue references**

Run this search to find all remaining `swipely-blue` references in generate/page.tsx:
```bash
grep -n "swipely-blue" app/(dashboard)/generate/page.tsx
```

For each result, replace `var(--swipely-blue)` CTA instances with lime equivalents. Navigation buttons (`ArrowLeft` back buttons) should use `variant="ghost"` or keep a subtle style — they're secondary actions and don't need lime.

**Step 2: Update platform/goal selection active states**

Find the platform card active state in the `platform_goal` step. Look for a className with the active style for platform buttons — replace blue border/bg with lime:
```tsx
// Find pattern like:
platform === p.id ? "border-[var(--swipely-blue)] bg-[var(--swipely-blue)]/5" : "..."

// Replace with:
platform === p.id ? "border-[#D4F542] bg-[#D4F542]/5" : "border-[#E8E8E4] hover:border-[#D4F542]/30"
```

Same for goal cards active state.

**Step 3: Update template grid active state**

Find template card active state in `template` step:
```tsx
// Pattern: selectedTemplate === t.id ? "border-[var(--swipely-blue)]..."
// Replace with: selectedTemplate === t.id ? "border-[#D4F542] ring-1 ring-[#D4F542]/30"
```

**Step 4: Update settings step CTA ("Создать карусель" final button)**

Find the `handleGenerate` trigger button in the `settings` step — same lime treatment as other CTAs.

**Step 5: Update slide count + format + tone selector active states**

Search for active selector states in settings step. Replace blue highlights with lime.

**Step 6: Commit**

```bash
git add app/(dashboard)/generate/page.tsx
git commit -m "feat(design): apply lime accent to all generate page selection states"
```

---

## Task 6: Redesign Dashboard stat cards

**Files:**
- Modify: `app/(dashboard)/dashboard/page.tsx`

**Step 1: Update H1 and subtitle**

Find lines 86–90:
```tsx
// BEFORE
<h1 className="text-2xl font-bold mb-1">
  Привет{profile?.first_name ? `, ${profile.first_name}` : ""}!
</h1>
<p className="text-muted-foreground">Обзор твоего аккаунта Swipely</p>

// AFTER
<h1 className="text-3xl font-bold mb-1 text-[#0D0D14]">
  Привет{profile?.first_name ? `, ${profile.first_name}` : ""}!
</h1>
<p className="text-[#6B7280]">Обзор твоего аккаунта Swipely</p>
```

**Step 2: Update stat card 1 — "Генерации"**

Find the first stat card (lines 94–111). Replace icon bg + color:
```tsx
// BEFORE
<div className="w-8 h-8 rounded-lg bg-[var(--swipely-blue)]/10 flex items-center justify-center">
  <BarChart3 className="h-4 w-4 text-[var(--swipely-blue)]" />
</div>

// AFTER
<div className="w-8 h-8 rounded-lg bg-[#D4F542]/20 flex items-center justify-center">
  <BarChart3 className="h-4 w-4 text-[#0D0D14]" />
</div>
```

Also update the big stat number to use lime color:
```tsx
// BEFORE
<div className="text-3xl font-bold font-[family-name:var(--font-mono)]">

// AFTER
<div className="text-3xl font-bold font-[family-name:var(--font-mono)] text-[#D4F542]">
```

**Step 3: Update card hover for all stat cards**

For all stat cards, enhance the hover effect:
```tsx
// BEFORE
className="rounded-2xl border border-border bg-card p-5 hover:shadow-sm transition-shadow"

// AFTER
className="rounded-2xl border border-[#E8E8E4] bg-white p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
```

**Step 4: Update "Перейти на PRO" link color**

Find line 142:
```tsx
// BEFORE
className="text-xs text-[var(--swipely-blue)] hover:underline mt-1 inline-block"

// AFTER
className="text-xs text-[#D4F542] hover:underline mt-1 inline-block font-semibold"
```

Wait — lime on white background has poor contrast. Use charcoal for this link instead:
```tsx
className="text-xs text-[#0D0D14] hover:text-[#374151] underline underline-offset-2 mt-1 inline-block font-medium"
```

**Step 5: Commit**

```bash
git add app/(dashboard)/dashboard/page.tsx
git commit -m "feat(design): upgrade dashboard stat cards with lime accents + lift hover"
```

---

## Task 7: Redesign History page cards

**Files:**
- Modify: `app/(dashboard)/history/page.tsx`

**Step 1: Update H1**

Find line 122:
```tsx
// BEFORE
<h1 className="text-2xl font-bold mb-1">История</h1>

// AFTER
<h1 className="text-3xl font-bold mb-1 text-[#0D0D14]">История</h1>
```

**Step 2: Update filter button active state**

Find the Filter Button (line 129):
```tsx
// BEFORE
className="rounded-full active:scale-[0.98] transition-all"

// AFTER — if filter is active show lime outline
className={`rounded-full active:scale-[0.98] transition-all ${filterTemplate ? "border-[#D4F542] text-[#0D0D14] bg-[#D4F542]/10" : ""}`}
```

**Step 3: Enhance generation cards with lift effect**

Find the generation card in the loaded state (search for `rounded-2xl border border-border bg-card`). This appears in the `generations.map` block. Add hover lift:
```tsx
// BEFORE
className="rounded-2xl border border-border bg-card p-5 cursor-pointer hover:shadow-md transition-all group"

// AFTER
className="rounded-2xl border border-[#E8E8E4] bg-white p-5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
```

**Step 4: Update template badge in history cards**

Find the template badge — a span/div showing template name in cards. Update to lime styling:
```tsx
// Find badge pattern like:
className="... bg-[var(--swipely-blue)]/10 text-[var(--swipely-blue)]..."

// Replace with:
className="... bg-[#D4F542]/15 text-[#0D0D14] font-semibold..."
```

**Step 5: Commit**

```bash
git add app/(dashboard)/history/page.tsx
git commit -m "feat(design): upgrade history cards — lift hover, lime badges"
```

---

## Task 8: Final polish — settings page and remaining pages

**Files:**
- Modify: `app/(dashboard)/dashboard/settings/page.tsx`

**Step 1: Read the settings page first**

```bash
cat app/(dashboard)/dashboard/settings/page.tsx | head -100
```

**Step 2: Update primary buttons to lime**

Search for blue-colored buttons:
```bash
grep -n "swipely-blue\|primary" app/(dashboard)/dashboard/settings/page.tsx
```

Replace any `bg-[var(--swipely-blue)]` CTA buttons with `bg-[#D4F542] text-[#0D0D14]`.

**Step 3: Run a final blue audit across all modified files**

```bash
grep -rn "swipely-blue\|#0A84FF" app/(dashboard)/
```

For any remaining `swipely-blue` references used as CTA/active colors, replace with lime.
For `swipely-blue` used as info/link colors (non-CTA), it's OK to leave them — blue remains a secondary brand color.

**Step 4: Final visual check**

Open each page and check:
- `/dashboard` — dark sidebar, lime balance card, stat cards have lime numbers
- `/generate` — lime step dots, card-style mode selector, lime CTA
- `/history` — cards lift on hover, lime badges
- `/dashboard/settings` — buttons are lime

**Step 5: Final commit**

```bash
git add app/(dashboard)/dashboard/settings/page.tsx
git commit -m "feat(design): ink & lime redesign complete — settings page + final polish"
```

---

## Completion Checklist

- [ ] globals.css: `--primary` = lime, `--sidebar` = `#0D0D14`, `--background` = `#FAFAF9`
- [ ] layout.tsx: dark sidebar, lime balance card, lime active nav, lime header button
- [ ] generate/page.tsx: named step dots, card-style mode selector, lime focus rings, lime CTAs
- [ ] dashboard/page.tsx: larger H1, lime stat accents, lift card hover
- [ ] history/page.tsx: lime badges, lift card hover
- [ ] settings/page.tsx: lime buttons
- [ ] No `swipely-blue` left on CTAs/active states
- [ ] All pages load without console errors
