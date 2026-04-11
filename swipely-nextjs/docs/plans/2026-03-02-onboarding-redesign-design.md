# Onboarding Redesign — Design Document

## Goal

Minimize time-to-value for new users: after registration they immediately create their first carousel, then naturally discover the product's limits.

## Approved Flow

```
Регистрация → /generate → [создаёт карусель] → Result + upgrade banner
```

No separate `/onboarding` step. No ToV wizard. No intermediate screens.

---

## Section 1: Routing After Registration

**Current**: `signup → /dashboard → /onboarding` (ToV wizard, 2-3 steps)

**New**: `signup → /generate` (directly)

- `app/api/auth/signup/route.ts` — change redirect from `/onboarding` to `/generate`
- `middleware.ts` — remove onboarding redirect guard (currently redirects unauthenticated `/generate` users to `/onboarding` if `onboarding_completed = false`)
- `onboarding_completed` column — still set to `true` on first generation (or immediately on signup) so we don't break existing checks elsewhere
- The existing `/onboarding` page can stay as a fallback for old links; it just won't be part of the main flow

---

## Section 2: Balance Indicator on CTA Button

New users see remaining free generations directly in the generate button label.

**Before first generation:**
```
[ Выбрать шаблон (3 бесплатно) → ]
```

**After first generation (2 left):**
```
[ Выбрать шаблон (осталось 2 из 3) → ]
```

**Pro users / no limit:** button shows no counter, label unchanged.

**Implementation:**
- `generate/page.tsx` — read `profile.standard_balance` from already-loaded profile data
- Show hint only when `isNewUser` (balance = 3 or profile created < 24h) AND balance > 0
- Logic: `isNewUser = profile.standard_balance >= 1 && profile.standard_balance <= 3 && !profile.subscription_status` (or check `onboarding_completed` flag)
- No separate API call needed — profile is already fetched on page load

---

## Section 3: Result-Screen Upgrade Banner

After first carousel is generated, show a one-time inline banner below the download buttons.

**Trigger condition:**
- User has used exactly 1 free generation (balance was 3, now 2)
- OR: `isNewUser && generationsCount === 1`

**Banner design (inline, not modal):**
```
╔══════════════════════════════════════╗
║ 🎉 Первая карусель готова!           ║
║ У тебя осталось 2 бесплатных.        ║
║ С PRO — безлимит за 990₽/мес        ║
║                                      ║
║  [ Попробовать PRO → ]               ║
╚══════════════════════════════════════╝
```

**Implementation:**
- State flag `showUpgradeBanner` in `generate/page.tsx`
- Set to `true` after generation completes when new-user condition is met
- Banner renders below download buttons in the result section
- "Попробовать PRO →" links to `/dashboard/pricing`
- No modal, no blocking UI — user can still download freely

---

## What We're NOT Building

- ToV collection during onboarding — removed entirely
- Welcome email sequence — out of scope
- Onboarding checklist / progress steps — out of scope
- Blocking modal after first carousel — use inline banner only
- Any changes to the Telegram bot flow

---

## Files to Touch

| File | Change |
|------|--------|
| `app/api/auth/signup/route.ts` | Redirect to `/generate` instead of `/onboarding` |
| `middleware.ts` | Remove onboarding guard that blocks `/generate` for new users |
| `app/(dashboard)/generate/page.tsx` | Add balance hint to CTA button + upgrade banner after result |
| `app/(dashboard)/onboarding/page.tsx` | No changes (kept as dead route) |

---

## Success Criteria

1. New user after registration lands on `/generate` with no intermediate steps
2. CTA button shows remaining free generations for new accounts
3. After first successful generation, upgrade banner appears inline below result
4. Existing Pro users and returning free users see no change in behavior
