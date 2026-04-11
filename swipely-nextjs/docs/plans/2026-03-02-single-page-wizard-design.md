# Single-Page Generation Wizard — Design

**Date:** 2026-03-02
**Goal:** Reduce time-to-value by collapsing 4-step wizard into one mobile-first form page.

## Problem

Current flow: `input → platform_goal → template → settings` = 3 "Next" clicks before generation starts. High drop-off on mobile.

## Solution

Single form page with all controls visible. Mobile-first layout. Direct "Generate" without steps.

## New State Machine

```
form → generating → result
```

Type `Step` changes from:
```ts
"input" | "platform_goal" | "template" | "settings" | "generating" | "result"
```
to:
```ts
"form" | "generating" | "result"
```

## What's Removed

- `platform` and `goal` state and UI (entire `platform_goal` step)
- Step indicator (dots + labels) — not needed without steps
- `goToNextStep` / `goToPrevStep` functions
- `STEPS`, `STEP_LABELS` constants
- `PLATFORMS`, `GOALS` constants

> `platform` and `goal` remain in `generations` insert as empty strings for DB schema compat.

## What's Added

- `brief` state (`string`, optional) — free-text context field
- `brief` sent to `/api/generate` and injected into system prompt
- Compact template selector (horizontal snap-scroll on mobile, grid on desktop)

## Layout

### Mobile (primary, 375px+)

```
[Создать карусель]

[■ Стандарт]  [● AI Фото]      ← mode toggle, full-width

[textarea: Тема или текст...]  ← rows=4
[textarea: Для кого, акценты...] ← rows=2, optional, labelled "Бриф (опционально)"

(photo mode only):
  [drag/drop photo upload]
  [AI Фото | Мультяшный / Реалистичный]

Шаблон
[→ Swipely] [Мультигрид🔒] [Фиолет.] [Чек] ...  ← horizontal snap-scroll
[Все шаблоны →]  ← opens TemplateSwitcher modal

Слайдов
[3]  [5]  [7]  [9🔒]  [12🔒]   ← chip row

Тон
[📚 Обучающий]   [🎭 Развлекательный]
[🔥 Провокационный] [💪 Мотивационный]  ← 2×2 grid

Формат
[■ Квадрат]  [▬ Вертикаль]   ← 2-button toggle

━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ← sticky bottom bar (shadow-top)
[✦ СОЗДАТЬ КАРУСЕЛЬ]
```

### Desktop (lg+)

```
┌─────────────────────┬──────────────────────┐
│ Left (flex-1)       │ Right (w-[340px])    │
│ mode toggle         │ Шаблон (grid 3-col)  │
│ textarea: тема      │ Слайдов (chips)      │
│ textarea: бриф      │ Тон (2×2)            │
│ (photo upload)      │ Формат (toggle)      │
│                     │ [СОЗДАТЬ КАРУСЕЛЬ]   │
└─────────────────────┴──────────────────────┘
```

CTA not sticky on desktop — it's in the right column, always in view.

## Template Compact Selector

Horizontal snap-scroll strip. Each card:
- `min-w-[100px]` × `56px`
- Template color dot (16px circle) + `nameRu`
- Active: `border-[#D4F542] border-2`
- PRO-only + free user: shows `Lock` icon, clicking → `toast("Нужен PRO для этого шаблона")`
- "Все шаблоны →" button at end opens existing `TemplateSwitcher` modal

Template accent colors for dots:
```
swipely: #0A84FF    grid_multi: #F59E0B   purple_accent: #8B5CF6
receipt: #374151    quote_doodle: #F9A8D4  speech_bubble: #10B981
star_highlight: #F59E0B  street: #0D0D14  chapter: #92400E
dispatch: #4C1D95   frame: #78716C
```

## API Changes (`/api/generate`)

Add `brief` to body type:
```ts
brief?: string;
```

In `buildSystemPrompt`, add optional section after `tovSection`:
```ts
const briefSection = brief?.trim()
  ? `\nПОЖЕЛАНИЯ АВТОРА:\n${brief.trim()}\n`
  : "";
```

Inject between `tovSection` and `platformSection` in prompt string.

Remove `platform` / `goal` from required parsing (keep as optional for DB insert, pass empty strings).

## Preserve Text Mode

Stays as-is (toggle on main form). The `preserveText` switch remains in the standard mode section.

## Video Transcription

Stays as-is. On form completion (`handleTranscribe`), instead of `setStep("platform_goal")`, just stay on `"form"` — transcript populates the main textarea.

## Error Handling

Same as current: `EMAIL_NOT_VERIFIED` banner stays on form page. Generation errors show `toast.error`.

On error during generation: `setStep("form")` instead of `setStep("settings")`.
