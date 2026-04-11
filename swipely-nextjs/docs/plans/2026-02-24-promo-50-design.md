# Design: PRO -50% Promotion

**Date:** 2026-02-24
**Scope:** `swipely-nextjs` — dashboard pricing page only

## Summary

Add a 50% discount promotion on PRO subscription (both monthly and yearly) with a popup overlay on page load and updated pricing cards.

## User-Facing Changes

### 1. Popup Overlay (on page load)
- Dark backdrop with blur, centered modal
- Large "СКИДКА 50%" headline in lime `#D4F542`
- Strikethrough old prices (990₽ / 9 900₽) + new prices (495₽ / 4 950₽) displayed prominently
- Countdown timer `DD : HH : MM : SS` counting down to end of February (28.02.2026 23:59:59)
- Two CTA buttons: "Месяц — 495₽" and "Год — 4 950₽"
- Close button (×); popup does NOT show again within the same session (sessionStorage flag)

### 2. Plan Cards (after popup closed)
- PRO card: strikethrough old price + new price in lime
- `-50%` badge on the PRO card
- Compact countdown timer visible directly in the PRO card

## Technical Changes

### Pricing (API)
- `app/api/payments/create/route.ts`: `pro_monthly` 990 → **495**, `pro_yearly` 9900 → **4 950**

### New Component
- `components/pricing/PromoPopup.tsx` — modal overlay with timer and CTA buttons

### Modified Files
- `app/(dashboard)/dashboard/pricing/page.tsx` — render PromoPopup, update PRO card UI (strikethrough, badge, compact timer)

## What Does NOT Change
- Public `/pricing` page — untouched
- Webhook duration logic — untouched
- Free plan, photo packs — untouched

## Timer Logic
- Target: `new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)` — last second of current month
- Countdown in client component with `setInterval(1000)`
- When timer hits 0: shows "Акция завершена"
