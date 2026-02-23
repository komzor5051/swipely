# Ink & Lime Redesign — Design Document

**Date**: 2026-02-21
**Scope**: Full dashboard redesign (layout, generate page, dashboard page, history page)
**Direction**: Editorial — dark sidebar + white main area + lime as primary accent
**Approved**: Yes

---

## Design Philosophy

Replace the generic "blue SaaS template" look with a bold Editorial system:
- `#0D0D14` (ultra-dark) sidebar creates immediate premium contrast
- `#D4F542` (lime) replaces blue as the primary action color — unique, memorable
- Large Outfit typography establishes hierarchy before users read anything
- Off-white (`#FAFAF9`) main background feels warm, not clinical

Reference aesthetic: Figma, Framer, Lemon Squeezy — confident, opinionated, product-led.

---

## Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--ink` | `#0D0D14` | Sidebar bg, primary headings |
| `--lime` | `#D4F542` | CTAs, active states, balance card bg |
| `--on-lime` | `#1A1A2E` | Text on lime backgrounds |
| `--main-bg` | `#FAFAF9` | Main content background |
| `--card-bg` | `#FFFFFF` | Cards and inputs |
| `--border` | `#E8E8E4` | All borders (warm, not cold gray) |
| `--muted-text` | `#6B7280` | Secondary text |
| `--blue` | `#0A84FF` | Info/links only (not CTA) |
| `--pink` | `#F9A8D4` | Decorative accents |

Existing tokens `--swipely-blue`, `--swipely-lime`, `--swipely-charcoal` are updated to reflect new roles.

---

## Typography Scale

| Role | Font | Weight | Size |
|------|------|--------|------|
| Page H1 | Outfit | 700 | 2.25rem (36px) |
| Section H2 | Outfit | 600 | 1.5rem (24px) |
| Body | Outfit | 400 | 1rem |
| Nav labels | Outfit | 500 | 0.875rem |
| Stat numbers | Space Mono | 700 | 2rem+ |
| Badges | Outfit | 600 | 0.75rem |

---

## Layout System

### Sidebar (`app/(dashboard)/layout.tsx`)

- Background: `#0D0D14`
- Width: 256px (unchanged)
- Logo: white text + lime accent dot on icon bg
- **Balance card**: `#D4F542` background with `#1A1A2E` text — lime as "alive" element
- **Active nav item**: `bg-[#D4F542]/15 text-[#D4F542]` + left indicator bar (lime)
- Inactive nav: `text-white/50`, hover `text-white/80 bg-white/5`
- PRO upgrade button: `bg-[#D4F542] text-[#1A1A2E]` (replace white button)
- Footer divider: `border-white/10`

### Header (top bar)

- Background: `#FFFFFF` (no blur needed — clean)
- Border-bottom: `#E8E8E4`
- "Создать карусель" button: `bg-[#D4F542] text-[#1A1A2E]` hover: `bg-[#c8e83a]`

### Main area

- Background: `#FAFAF9`
- Padding: `p-8 md:p-10`

---

## Generate Page (`app/(dashboard)/generate/page.tsx`)

### Step Indicator

Replace number-circles with named step dots:
```
● ─── ○ ─── ○ ─── ○
Контент  Платформа  Шаблон  Настройки
```
- Active step dot: `#D4F542` filled
- Completed step: `#0D0D14` filled (charcoal)
- Inactive: outline `#E8E8E4`
- Connector line: thin `#E8E8E4`, filled lime for completed segments

### Page Header

Add prominent H1 at top of each step:
- Step 1: "Создать карусель" (H1, Outfit 700)
- Step 2: "Где публикуем?"
- Step 3: "Выбери шаблон"
- Step 4: "Настройки"

Subtitle: smaller gray text below H1

### Mode Cards (Standard / AI Photo / Text / Video)

Upgrade from flat rectangles:
- Larger cards with icon + title + 1-line description
- Default: white bg, `#E8E8E4` border, rounded-2xl
- Hover: `shadow-md`, border-color `#D4F542/50`
- Selected: `border-[#D4F542]` (2px) + `bg-[#D4F542]/5` tint

### Textarea

- Rounded-2xl, white bg
- Focus ring: `ring-[#D4F542] ring-2` (lime focus instead of blue)
- Character counter: right-aligned, changes to lime when has content

### CTA Button

- "Далее: платформа →": `bg-[#D4F542] text-[#0D0D14]` + `rounded-full`
- Disabled: `opacity-40 cursor-not-allowed`
- Loading: `<Loader2>` spin on lime bg

---

## Dashboard Page (`app/(dashboard)/dashboard/page.tsx`)

### Stat Cards

- White bg, `rounded-2xl`, soft shadow
- Large stat number: Space Mono, `text-[#D4F542]` for primary metric
- Secondary numbers: charcoal

### Quick Actions

- Primary CTA card with lime bg: "Создать первую карусель"
- Spans full width or prominent placement

### Recent Generations

- Timeline list (not table)
- Each item: template badge (pill) + topic text + date

---

## History Page (`app/(dashboard)/history/page.tsx`)

- Grid: 2 columns on md, 3 on lg
- Generation card: white bg, `rounded-2xl`, template name badge (lime pill)
- Hover: `translateY(-2px)` + `shadow-md` transition
- Empty state: centered lime CTA

---

## Component Changes

### Buttons

| Variant | Style |
|---------|-------|
| Primary | `bg-[#D4F542] text-[#0D0D14] hover:bg-[#c8e83a] rounded-full` |
| Secondary | `bg-[#0D0D14] text-white hover:bg-[#1A1A2E] rounded-full` |
| Ghost | `border border-[#E8E8E4] bg-transparent hover:bg-[#FAFAF9] rounded-full` |
| Destructive | `bg-red-500 text-white rounded-full` |

### globals.css updates

- `--primary`: `#D4F542` (replaces blue as primary)
- `--primary-foreground`: `#0D0D14`
- `--sidebar`: `#0D0D14`
- `--background`: `#FAFAF9`
- `--ring`: `#D4F542` (focus rings become lime)

---

## Animation Patterns

- Card hover: `transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`
- Mode card selection: spring scale `0.98` on click
- Step transitions: `AnimatePresence` horizontal slide (already in use, keep)
- Sidebar active indicator: `layoutId="sidebar-active"` spring (already in use, keep)
- Page entrance: `FadeIn` component (already in use, keep)

---

## Files to Change

1. `app/globals.css` — update CSS variables
2. `app/(dashboard)/layout.tsx` — sidebar + header redesign
3. `app/(dashboard)/generate/page.tsx` — step indicator, mode cards, textarea, buttons
4. `app/(dashboard)/dashboard/page.tsx` — stat cards, actions layout
5. `app/(dashboard)/history/page.tsx` — grid layout, card redesign
6. `app/(dashboard)/dashboard/settings/page.tsx` — button + form styles

---

## Non-Goals

- Do NOT change the generation logic, API routes, or data fetching
- Do NOT change template components (`components/slides/templates/`)
- Do NOT change ExportPanel or CarouselEditor (complex components)
- Do NOT change auth pages or landing page
