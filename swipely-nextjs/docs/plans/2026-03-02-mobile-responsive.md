# Mobile Responsiveness Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make every page and the editor feel like a native mobile app — no overflow, no cramped touch targets, mobile-first.

**Architecture:** Approach B — targeted CSS fixes across 6 files + one dynamic scale calculation in CarouselEditor. No component rewrites, no new files. All changes are Tailwind class edits + one line of JS logic.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS 4, React 19

---

### Task 1: Landing page — hero padding + stats row

**Files:**
- Modify: `app/page.tsx:24` (hero section top padding)
- Modify: `app/page.tsx:65` (stats flex row)

**Step 1: Fix hero top padding**

Line 24, change:
```tsx
// Before
<section className="min-h-screen flex items-center pt-32 pb-16 px-6 relative">
// After
<section className="min-h-screen flex items-center pt-20 sm:pt-32 pb-16 px-6 relative">
```

Rationale: `pt-32` = 128px. On a 667px-tall iPhone, this eats 19% of the viewport before any content. `pt-20` (80px) leaves enough breathing room while still feeling spaced.

**Step 2: Fix stats row wrapping**

Line 65, change:
```tsx
// Before
<div className="flex gap-10 pt-6 border-t border-border">
// After
<div className="flex flex-wrap gap-6 sm:gap-10 pt-6 border-t border-border">
```

Rationale: On 320px iPhone SE, 3 stats × ~80px each + `gap-10` (40px) = ~280px. With `flex-wrap gap-6`, items wrap naturally instead of squishing.

**Step 3: Verify no overflow at 375px**

Open browser devtools → toggle device (iPhone 14, 390px). Scroll through hero: text should be fully visible without horizontal scroll, stats row should wrap if needed.

**Step 4: Commit**
```bash
cd "swipely-nextjs"
git add app/page.tsx
git commit -m "fix(mobile): reduce hero padding + wrap stats row on mobile"
```

---

### Task 2: Dashboard layout — mobile sidebar width

**Files:**
- Modify: `app/(dashboard)/layout.tsx:277-281` (sidebar drawer)

**Step 1: Make sidebar drawer viewport-relative**

Lines 276-282, change:
```tsx
// Before
<motion.div
  initial={{ x: -264 }}
  animate={{ x: 0 }}
  exit={{ x: -264 }}
  transition={{ type: "spring", damping: 30, stiffness: 300 }}
  className="relative w-64 h-full"
>
// After
<motion.div
  initial={{ x: "-100%" }}
  animate={{ x: 0 }}
  exit={{ x: "-100%" }}
  transition={{ type: "spring", damping: 30, stiffness: 300 }}
  className="relative w-[85vw] max-w-64 h-full"
>
```

Rationale: `w-64` = 256px. On iPhone SE (320px), that's 80% of screen width — the overlay barely lets users tap to close. `w-[85vw] max-w-64` caps at 256px on larger screens but shrinks proportionally on small ones. The animation uses `"-100%"` to always match the dynamic width.

**Step 2: Verify drawer on small screen**

Toggle device to iPhone SE (375px or 320px). Open sidebar. Overlay backdrop should be ~15% of screen, tapable to close.

**Step 3: Commit**
```bash
git add app/\(dashboard\)/layout.tsx
git commit -m "fix(mobile): make sidebar drawer viewport-relative width"
```

---

### Task 3: Dashboard pricing — photo packs grid + card padding

**Files:**
- Modify: `app/(dashboard)/dashboard/pricing/page.tsx:157` (plan card padding)
- Modify: `app/(dashboard)/dashboard/pricing/page.tsx:210` (PRO card padding)
- Modify: `app/(dashboard)/dashboard/pricing/page.tsx:339` (photo packs grid)

**Step 1: Fix plan card padding — Free card**

Line 157, change:
```tsx
// Before
<div className="relative rounded-2xl border border-border bg-card p-7 flex flex-col">
// After
<div className="relative rounded-2xl border border-border bg-card p-5 sm:p-7 flex flex-col">
```

**Step 2: Fix plan card padding — PRO card**

Line 210, change:
```tsx
// Before
<div className="rounded-2xl bg-[#0D0D14] p-7 flex flex-col relative overflow-hidden shadow-xl">
// After
<div className="rounded-2xl bg-[#0D0D14] p-5 sm:p-7 flex flex-col relative overflow-hidden shadow-xl">
```

**Step 3: Fix photo packs grid (CRITICAL)**

Line 339, change:
```tsx
// Before
<div className="grid grid-cols-3 gap-3">
// After
<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
```

Rationale: On 375px mobile, 3 columns with `p-4` each = ~65px per card. The price, slide count, and buy button are all cramped and the badge ("Выгодно") clips. Single column stacks beautifully on mobile, 3 cols resume at 640px+.

**Step 4: Verify at 375px**

All photo pack cards should be full-width stacked vertically. "Выгодно" and "Максимум" badges should be fully visible.

**Step 5: Commit**
```bash
git add app/\(dashboard\)/dashboard/pricing/page.tsx
git commit -m "fix(mobile): photo packs single-column + smaller card padding on mobile"
```

---

### Task 4: Public pricing page — navbar, hero title, photo packs, card padding

**Files:**
- Modify: `app/pricing/page.tsx:321` (navbar padding)
- Modify: `app/pricing/page.tsx:353` (hero h1 text size)
- Modify: `app/pricing/page.tsx:94` (Free plan card padding)
- Modify: `app/pricing/page.tsx:137` (PRO card padding)
- Modify: `app/pricing/page.tsx:216` (photo packs grid)

**Step 1: Fix navbar padding**

Line 321, change:
```tsx
// Before
<nav className="relative z-20 flex items-center justify-between px-8 py-5 border-b border-white/6">
// After
<nav className="relative z-20 flex items-center justify-between px-4 sm:px-8 py-5 border-b border-white/6">
```

**Step 2: Fix hero heading size**

Line 353, change:
```tsx
// Before
<h1 className="text-5xl md:text-6xl font-black tracking-tight">
// After
<h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight">
```

Rationale: `text-5xl` = 48px. On 375px mobile, "Начни за 0₽. Расти без лимитов." at 48px bold spills into two cramped lines. `text-3xl` (30px) on mobile reads clearly.

**Step 3: Fix Free plan card padding**

Line 94, change:
```tsx
// Before
<div className="rounded-2xl border border-white/8 bg-white/4 p-7 flex flex-col backdrop-blur-sm">
// After
<div className="rounded-2xl border border-white/8 bg-white/4 p-5 sm:p-7 flex flex-col backdrop-blur-sm">
```

**Step 4: Fix PRO card padding**

Line 137, change:
```tsx
// Before
<div className="rounded-2xl border-2 border-[#D4F542]/40 bg-[#0D0D14] p-7 flex flex-col relative overflow-hidden shadow-2xl shadow-[#D4F542]/5">
// After
<div className="rounded-2xl border-2 border-[#D4F542]/40 bg-[#0D0D14] p-5 sm:p-7 flex flex-col relative overflow-hidden shadow-2xl shadow-[#D4F542]/5">
```

**Step 5: Fix photo packs grid (CRITICAL)**

Line 216, change:
```tsx
// Before
<div className="grid grid-cols-3 gap-3">
// After
<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
```

**Step 6: Verify at 390px (iPhone 14)**

Navigate to `/pricing`. Navbar should have proper padding. Hero title should be legible at 3 lines max. Photo packs should stack vertically.

**Step 7: Commit**
```bash
git add app/pricing/page.tsx
git commit -m "fix(mobile): pricing page navbar, hero size, photo packs grid"
```

---

### Task 5: History page — dialog width + thumbnail strip

**Files:**
- Modify: `app/(dashboard)/history/page.tsx:357` (dialog max-w)
- Modify: `app/(dashboard)/history/page.tsx:437` (thumbnail strip justify)

**Step 1: Fix dialog width for mobile**

Line 357, change:
```tsx
// Before
<DialogContent className="sm:max-w-2xl max-h-[92dvh] overflow-x-hidden overflow-y-auto p-4 sm:p-6">
// After
<DialogContent className="w-[95vw] sm:w-auto sm:max-w-2xl max-h-[92dvh] overflow-x-hidden overflow-y-auto p-4 sm:p-6">
```

Rationale: Without explicit width on mobile, shadcn Dialog defaults to its own max-w that may clip or leave no room. `w-[95vw]` ensures the dialog uses 95% of viewport width on mobile.

**Step 2: Fix thumbnail strip justify alignment**

Line 437, change:
```tsx
// Before
<div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 w-full justify-start sm:justify-center px-1">
// After
<div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 w-full justify-start md:justify-center px-1">
```

Rationale: `sm:justify-center` centers at 640px (still mobile territory for most phones in landscape). `md:justify-center` waits until 768px (tablet+). On mobile, `justify-start` with horizontal scroll is the correct pattern.

**Step 3: Verify in devtools**

Open History page, click a generation card. Dialog should be 95% wide on mobile. Thumbnails should scroll from left edge on mobile, be centered on tablet.

**Step 4: Commit**
```bash
git add app/\(dashboard\)/history/page.tsx
git commit -m "fix(mobile): history dialog 95vw + thumbnail justify-start on mobile"
```

---

### Task 6: CarouselEditor — dynamic mobile slide scale

**Files:**
- Modify: `components/generate/CarouselEditor.tsx:151-153` (mobileSlideScale calculation)

**Problem:** `mobileSlideScale = 0.28` is hardcoded. For a 1080px slide at 0.28 = 302px rendered width. On iPhone SE (320px screen, minus `px-4`=32px = 288px available): **302 > 288 → horizontal overflow**.

**Step 1: Replace hardcoded scale with dynamic calculation**

Lines 151-153 area (after the `activeScale` and `thumbScale` declarations), change:
```tsx
// Before
const activeScale = 0.38;
const thumbScale = 0.18;
const mobileSlideScale = 0.28;
// After
const activeScale = 0.38;
const thumbScale = 0.18;
// Dynamic: fit within viewport minus 40px (px-4 on each side + buffer)
const mobileSlideScale = windowWidth > 0 ? Math.min(0.28, (windowWidth - 40) / 1080) : 0.28;
```

How it works:
- `windowWidth - 40` = available pixel width (subtracts 32px for `px-4` padding + 8px buffer)
- Divide by 1080 (slide width) = max scale that fits
- `Math.min(0.28, ...)` = never exceeds original 0.28 on larger phones

Examples:
- iPhone SE 320px: `min(0.28, 280/1080)` = `min(0.28, 0.259)` = **0.259** → 279px ✓
- iPhone 14 375px: `min(0.28, 335/1080)` = `min(0.28, 0.310)` = **0.28** → 302px ✓
- iPhone 14 Plus 428px: `min(0.28, 388/1080)` = **0.28** → 302px ✓

**Step 2: Verify on smallest supported device**

In devtools, set to iPhone SE (375px, or manually set to 320px). Open `/generate`, generate a carousel, proceed to result. Tap "Редактировать". The slide in the editor should be fully contained without horizontal overflow.

**Step 3: Verify sheet animation on small screen**

When sheet is open, `paddingBottom: "290px"` should push slide up correctly. Verify slide is still visible (not completely pushed off screen) on 667px tall iPhone SE.

**Step 4: Commit**
```bash
git add components/generate/CarouselEditor.tsx
git commit -m "fix(mobile): dynamic slide scale in editor for narrow viewports"
```

---

## Verification Checklist

After all 6 tasks:

| Check | Device | Expected |
|---|---|---|
| Landing hero visible without excessive scroll | iPhone SE 375px | pt-20 visible top padding |
| Stats row doesn't overflow | iPhone SE 375px | flex-wrap, no horizontal scroll |
| Sidebar drawer leaves tapable backdrop | iPhone SE 375px | ~15% backdrop visible |
| Photo packs stack vertically | iPhone 14 390px | 1 column each |
| Pricing hero title readable | iPhone 14 390px | Max 3 lines, text-3xl |
| Pricing navbar not clipped | iPhone 14 390px | 16px side padding |
| History dialog fits screen | iPhone 14 390px | 95% width, no overflow |
| Editor slide doesn't overflow | iPhone SE 375px | 279px slide in 288px container |

## No horizontal scroll on any page

Test this systematically: open each route on 375px device, verify `document.documentElement.scrollWidth === document.documentElement.clientWidth` (no horizontal overflow).
