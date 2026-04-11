# Onboarding Wizard Design

**Date:** 2026-03-07
**Status:** Approved

## Goal

New users go through registration and immediately create a real carousel — no dead ends, no friction. First session ends with a tangible result.

## Approach: First-time mode inside `/generate`

`/generate` detects `onboarding_completed = false` and switches to guided UI. After the first successful generation, marks `onboarding_completed = true`. Zero code duplication.

## Flow

```
signup → /generate (layout redirect changed: /onboarding → /generate)
           ↓
   profile.onboarding_completed = false
           ↓
   Guided UI: progress bar + simplified form
           ↓
   form → template → generating → result
           ↓
   result: PATCH profile.onboarding_completed = true
           ↓
   Subsequent visits → normal /generate UI
```

## Steps Detail

### Step 1: form (onboarding mode)
- Progress bar: ① Описание → ② Шаблон → ③ Готово
- Heading: "Создай первую карусель"
- Hidden controls: mode toggle (standard/photo), slide count, format selector
- Defaults applied silently: 5 slides, square, standard mode
- Single textarea: "О чём твой пост?" with example placeholder
- CTA: yellow "Далее →" button

### Step 2: template
- Same template picker as normal
- Progress bar stays visible

### Step 3: result
- Calls `supabase.from("profiles").update({ onboarding_completed: true })` once
- Mobile: swipeable horizontal cards (see below)
- Desktop: existing grid layout unchanged

## Mobile Slide Preview (result step)

```
overflow-x-scroll + snap-x snap-mandatory container
Each card: w-[85vw] snap-center flex-shrink-0
Pagination dots below (active dot highlighted)
```

Only active on `< md` breakpoint. Desktop grid unchanged.

## Code Changes

| File | Change |
|------|--------|
| `app/(dashboard)/layout.tsx` | Change redirect target from `/onboarding` to `/generate` |
| `app/(dashboard)/generate/page.tsx` | Add `isOnboarding` state from profile check; conditional guided UI on form/template steps; mark complete on result |
| `app/(dashboard)/onboarding/page.tsx` | Keep as redirect fallback (`router.push("/generate")`) or delete |

## What We Are NOT Building

- No name/niche collection fields
- No ToV analysis in this flow (remains accessible via settings)
- No animated tutorial / product tour
- No separate onboarding route
