# Landing Visual Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Synchronize `landing/index.html` with the Ink & Lime visual language — match the blueprint grid background and replace Syne with Outfit.

**Architecture:** Single-file vanilla HTML/CSS change. No build system. Update the `body` background CSS and Google Fonts URL, then do a global find-replace for `'Syne'` → `'Outfit'`. One commit.

**Tech Stack:** Vanilla HTML, CSS custom properties. No framework, no build step.

---

## Task 1: Update background grid

**File:**
- Modify: `landing/index.html`

### Step 1: Open the file and locate the body background CSS

Find the `body` rule that sets the blueprint grid (around line 84-95):
```css
body {
    background-color: var(--bg);
    background-image:
        linear-gradient(var(--grid-fine) 1px, transparent 1px),
        linear-gradient(90deg, var(--grid-fine) 1px, transparent 1px),
        linear-gradient(var(--grid-major) 1px, transparent 1px),
        linear-gradient(90deg, var(--grid-major) 1px, transparent 1px);
    background-size: 24px 24px, 24px 24px, 120px 120px, 120px 120px;
```

### Step 2: Replace the background-image and background-size

Replace ONLY the `background-image` and `background-size` properties inside the `body` rule:

```css
body {
    background-color: #FAFAF9;
    background-image:
        linear-gradient(rgba(0,0,0,0.045) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,0,0,0.045) 1px, transparent 1px),
        linear-gradient(rgba(0,0,0,0.085) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,0,0,0.085) 1px, transparent 1px),
        radial-gradient(ellipse 70% 50% at 15% 30%, rgba(212,245,66,0.08) 0%, transparent 55%),
        radial-gradient(ellipse 55% 60% at 85% 15%, rgba(10,132,255,0.04) 0%, transparent 55%),
        radial-gradient(ellipse 60% 70% at 65% 85%, rgba(212,245,66,0.05) 0%, transparent 55%);
    background-size:
        24px 24px, 24px 24px, 120px 120px, 120px 120px,
        100% 100%, 100% 100%, 100% 100%;
```

Note: Keep `background-color: var(--bg)` or inline to `#FAFAF9` — either works, `--bg` is `#FAFAF9`.

### Step 3: Verify visually

Open `landing/index.html` directly in browser (no server needed — `file://` works).

Expected:
- Grid lines slightly lighter/softer than before
- Subtle lime glow in top-left and bottom-right corners
- No jarring change — it should look like the same grid, slightly more premium

---

## Task 2: Replace Syne with Outfit

**File:**
- Modify: `landing/index.html`

### Step 1: Update Google Fonts URL (line ~43)

Find:
```html
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Outfit:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
```

Replace with (remove Syne, add 700;800 to Outfit):
```html
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
```

### Step 2: Global replace all Syne references

Do a find-and-replace across the entire file:

Find: `font-family: 'Syne', sans-serif;`
Replace: `font-family: 'Outfit', sans-serif;`

There are exactly 10 occurrences (lines 107, 152, 453, 559, 705, 785, 868, 917, 1068, 1109). All get the same replacement.

### Step 3: Verify visually

Refresh the browser. Check:
- Logo "Swipely" text — same weight, slightly rounder feel (Outfit vs Syne)
- Hero `h1` — should still look bold and impactful (Outfit 800 is strong)
- Section headings — consistent with body text family

If any heading looks too light, that selector probably was using Syne 800 — Outfit 800 should compensate.

---

## Task 3: Commit

```bash
cd "/Users/lvmn/Desktop/Бизнес/ai projects /swipely /landing"
git add index.html
git commit -m "feat(landing): sync visual with web — blueprint grid + Outfit headings"
```

Expected output:
```
[main xxxxxxx] feat(landing): sync visual with web — blueprint grid + Outfit headings
 1 file changed, ~15 insertions(+), ~10 deletions(-)
```

---

## Done

Final check — open all three in browser side by side:
1. `landing/index.html` (file://)
2. `http://localhost:3000` (nextjs — `cd swipely-nextjs && npm run dev`)
3. `http://localhost:5173?token=xxx` (editor — `cd swipely-editor && npm run dev`)

Verify grid texture feels consistent across all three surfaces.
