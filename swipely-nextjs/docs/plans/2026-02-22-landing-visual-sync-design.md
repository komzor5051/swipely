# Landing Visual Sync — Design

**Goal:** Synchronize `landing/index.html` with the Ink & Lime visual language of `swipely-nextjs` and `swipely-editor`. Two targeted changes, one file.

**Scope:** `landing/index.html` only. No changes to `swipely-nextjs` or `swipely-editor` (already correct).

---

## Change 1: Background Grid

**Current (landing):**
```css
background-color: var(--bg); /* #FAFAF9 */
background-image:
  linear-gradient(var(--grid-fine) 1px, transparent 1px),     /* rgba(0,0,0,0.055) */
  linear-gradient(90deg, var(--grid-fine) 1px, transparent 1px),
  linear-gradient(var(--grid-major) 1px, transparent 1px),    /* rgba(0,0,0,0.10) */
  linear-gradient(90deg, var(--grid-major) 1px, transparent 1px);
background-size: 24px 24px, 24px 24px, 120px 120px, 120px 120px;
```

**New (match web app `swipely-nextjs` page background):**
```css
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

Differences vs current: slightly lighter grid lines (0.055→0.045, 0.10→0.085) + lime/blue radial glow overlays, exactly matching the main app.

The existing `::before` radial gradient on `body::before` (lines ~100-105) stays — it's a separate subtle glow and doesn't conflict.

---

## Change 2: Typography — Remove Syne

Remove `Syne` from Google Fonts import. All 10 occurrences of `font-family: 'Syne'` replaced with `'Outfit'`.

**Google Fonts URL** (remove `Syne:wght@400;600;700;800&`):
```html
<!-- Before -->
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Outfit:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">

<!-- After -->
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
```

Note: add weights `700;800` to Outfit (currently only `300;400;500;600`) so headings retain their visual weight.

**Affected selectors (10 total):**
- Line 107: `h1, h2, h3, h4` (global headings)
- Line 152: `.logo-text` (nav logo)
- Lines 453, 559, 705, 785, 868, 917, 1068, 1109 — specific component headings

All replaced with `'Outfit', sans-serif`.

---

## Files Changed

| File | Change |
|------|--------|
| `landing/index.html` | 1. Update `body` background grid CSS; 2. Update Google Fonts URL + 10× `'Syne'` → `'Outfit'` |

## Commit Target

```bash
cd landing
git add index.html
git commit -m "feat(landing): sync visual with web — blueprint grid + Outfit headings"
```
