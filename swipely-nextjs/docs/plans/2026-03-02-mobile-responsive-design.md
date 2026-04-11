# Mobile Responsiveness — Design Doc

**Date:** 2026-03-02
**Approach:** B — Systematic adaptation (mobile-first priority)
**Scope:** All pages + CarouselEditor

---

## Goal

Make every page and the editor feel like a native mobile app. No overflow, no horizontal scroll, no cramped touch targets. Mobile users are the primary audience; desktop is secondary.

---

## Audit Summary

Overall score before fix: **7/10**. Found critical, high, and medium priority issues across 8 files.

---

## Changes by File

### 1. `app/page.tsx` — Landing Page

| Priority | Fix |
|---|---|
| HIGH | Hero top padding: `pt-32` → `pt-20 sm:pt-32` |
| MEDIUM | Stats row under hero: `flex gap-10` → `flex flex-col sm:flex-row gap-6 sm:gap-10` |
| MEDIUM | Demo chat bubble: `max-w-[80%]` → `max-w-[90%] sm:max-w-[80%]` |
| LOW | Template gallery: verify card text doesn't overflow on 375px |

### 2. `app/(dashboard)/layout.tsx` — Dashboard Shell

| Priority | Fix |
|---|---|
| HIGH | Mobile sidebar drawer: `w-64` → `w-60 sm:w-64` |
| MEDIUM | Balance card font: `text-2xl` → `text-xl sm:text-2xl` |

### 3. `app/(dashboard)/generate/page.tsx` — Generation Form

| Priority | Fix |
|---|---|
| HIGH | Full audit of form layout, inputs, multi-step screens for overflow |
| MEDIUM | Slide count picker buttons: verify grid wraps on narrow screens |
| MEDIUM | Image style toggle: responsive button group |
| LOW | File upload zone: adequate touch target and text on narrow screens |

### 4. `app/(dashboard)/history/page.tsx` — History Page

| Priority | Fix |
|---|---|
| MEDIUM | Thumbnail strip: `justify-start sm:justify-center` → `justify-start md:justify-center` |
| MEDIUM | Dialog: add explicit `max-w-[95vw] sm:max-w-2xl` for mobile |
| LOW | Filter button: consider always showing text |

### 5. `app/(dashboard)/dashboard/pricing/page.tsx` — Dashboard Pricing

| Priority | Fix |
|---|---|
| CRITICAL | Photo packs grid: `grid-cols-3` → `grid-cols-1 sm:grid-cols-3` |
| HIGH | Card padding: `p-7` → `p-5 sm:p-7` |

### 6. `app/pricing/page.tsx` — Public Pricing

| Priority | Fix |
|---|---|
| CRITICAL | Photo packs grid: `grid-cols-3` → `grid-cols-1 sm:grid-cols-3` |
| HIGH | Navbar padding: `px-8` → `px-4 sm:px-8` |
| MEDIUM | Hero heading: `text-5xl md:text-6xl` → `text-4xl sm:text-5xl md:text-6xl` |

### 7. `components/shared/Footer.tsx` — Footer

No critical issues. Minor spacing review only.

### 8. `components/generate/CarouselEditor.tsx` — Slide Editor

| Priority | Fix |
|---|---|
| HIGH | Control panel: desktop = right sidebar, mobile = bottom sheet (slide-up panel) |
| HIGH | Mobile tabs: Text / Position / Caption — ensure tab switching smooth, tabs don't overflow |
| HIGH | Color swatches: horizontal scroll on mobile, grid on desktop |
| MEDIUM | Carousel arrow buttons: `h-8 w-8` → `h-10 w-10 sm:h-8 sm:w-8` (touch target ≥40px) |
| MEDIUM | Slide preview: verify slide thumbnails strip scrolls horizontally with padding |
| LOW | Drag-and-drop text positioning: add explicit snap constraints on mobile |

---

## Responsive Breakpoints

```
mobile:  < 640px   (sm breakpoint — default, no prefix)
tablet:  640-768px (sm:)
desktop: > 768px   (md:, lg:)
```

Strategy: write mobile styles first (no prefix), override for larger screens with `sm:` and `md:`.

---

## Touch Target Standards

All interactive elements: minimum **44×44px** on mobile.

- Carousel arrows: `h-10 w-10` (40px, acceptable)
- Nav buttons: verify `p-2` + icon size ≥ 44px
- Color swatches: `h-8 w-8` with `p-1` wrapper → add `h-10 w-10 sm:h-8 sm:w-8`

---

## CarouselEditor Mobile Architecture

**Desktop:** side-by-side — preview left (60%), controls right (40%)
**Mobile:** stack vertically — preview top (fills viewport), controls bottom sheet (slides up)

Bottom sheet behavior:
- Default: collapsed, shows tab bar (Text / Position / Caption)
- On tab tap: expands to show controls for that tab
- Handles: touch-draggable handle or fixed height with scroll

---

## Acceptance Criteria

- [ ] No horizontal overflow on any page at 375px (iPhone SE)
- [ ] No horizontal overflow at 390px (iPhone 14)
- [ ] All interactive elements ≥ 40px touch target on mobile
- [ ] CarouselEditor bottom sheet opens/closes smoothly
- [ ] Pricing photo packs stack vertically on mobile
- [ ] Landing hero visible without heavy scrolling (pt-20 on mobile)
- [ ] Dashboard sidebar doesn't overflow half the viewport on mobile
- [ ] History modal thumbnails scroll horizontally with `justify-start`
- [ ] No fixed pixel widths causing overflow at narrow viewports

---

## Out of Scope

- Slide templates internal layout (they use fixed 1080px canvas, scaled by SlideRenderer — correct by design)
- Admin panel (not a user-facing screen)
- swipely-bot (separate project)
