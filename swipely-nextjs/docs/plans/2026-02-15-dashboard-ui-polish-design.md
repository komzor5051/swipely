# Dashboard UI Polish — Design Document

**Date**: 2026-02-15
**Scope**: Dashboard layout + Dashboard + Generate + History + Settings
**Style**: Modern minimalism (Linear/Vercel aesthetic)
**Animation library**: Framer Motion
**Toast system**: Sonner

## Goals

1. Fix spacing/overlap issues across all dashboard pages
2. Add smooth entrance animations and page transitions
3. Improve loading states with spinners and toasts
4. General visual polish — typography, colors, consistency

## Architecture

### New Dependencies
- `framer-motion` — React animation library (~30KB)
- `sonner` — Toast notification system (~5KB)

### New Components
- `components/ui/motion.tsx` — Reusable motion primitives:
  - `FadeIn` — fade + translateY entrance
  - `StaggerList` / `StaggerItem` — cascading child animations
  - `SlideIn` — directional slide entrance
  - Re-export `AnimatePresence` from framer-motion

### Integration Points
- `<Toaster />` added to root `app/layout.tsx`
- Motion components used as wrappers around existing UI

## Changes by Page

### Dashboard Layout (layout.tsx)
- Mobile sidebar: AnimatePresence + slide-in animation
- Nav items: layoutId active indicator (animated blue bar)
- Fade backdrop animation on mobile menu

### Dashboard Page (dashboard/page.tsx)
- Stats grid: StaggerList (cascading appearance)
- Quick Actions: FadeIn with delay
- Recent Generations: StaggerList for list items
- Skeleton: shimmer gradient instead of animate-pulse

### Generate Page (generate/page.tsx)
- AnimatePresence mode="wait" for step transitions
- Step indicator: motion.div layoutId for active circle
- Template grid: StaggerList
- Generating state: enhanced loading animation
- Result: slide-in transitions

### History Page (history/page.tsx)
- Grid cards: StaggerList
- Filter dropdown: AnimatePresence + scale/fade
- Delete: exit animation (shrink + fade) + toast with undo
- Empty state: FadeIn

### Settings Page (settings/page.tsx)
- TOV grid: fix responsive (grid-cols-2 sm:grid-cols-3)
- Save button: Loader2 spinner icon
- Success feedback: Sonner toast
- Sections: cascading FadeIn

### Global Polish
- Cards: hover:shadow-sm transition
- Buttons: active:scale-[0.98] for tactile feedback
- Focus states: focus-visible:ring-2 ring-offset-2
- Consistent border-radius across all elements
