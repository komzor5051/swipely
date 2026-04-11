# Template Switcher + Slide Transition Animation — Design

**Date:** 2026-02-25
**Status:** Approved

---

## Overview

Two related UX improvements to the carousel editor:

1. **Template Switcher** — ability to change template after generation (client-side re-render, no API call)
2. **Slide Transition Animation** — smooth slide animation when navigating between slides in the editor

---

## Feature 1: Template Switcher

### Placement

- **Result page** (`step="result"` in `generate/page.tsx`): button "Сменить шаблон" in result toolbar
- **CarouselEditor**: 4th tab "Шаблон" in mobile bottom bar + button in desktop sidebar

### New Component: `TemplateSwitcher`

**Location:** `components/generate/TemplateSwitcher.tsx`

**Props:**
```typescript
interface TemplateSwitcherProps {
  currentTemplate: string;
  slides: Slide[];
  format: "square" | "portrait";
  onSelect: (templateId: string) => void;
  onClose: () => void;
}
```

**Behavior:**
- 2-column grid of all 11 standard templates (excludes `photo_mode`)
- Each card: live `SlideRenderer` of first slide at scale ~0.16, template name below
- Selected template: lime border + checkmark overlay
- Mobile: bottom sheet with `sheetSlideUp` animation (same pattern as CarouselEditor sheets)
- Desktop: centered modal with dark overlay backdrop

### State Flow

- `selectedTemplate` state already exists in `generate/page.tsx`
- Selecting a new template calls `setSelectedTemplate(id)` → `activeTemplate` updates → all `SlideRenderer` instances re-render
- CarouselEditor gets new prop `onChangeTemplate: (id: string) => void` — bubbles up to `generate/page.tsx`

### Files Changed

| File | Change |
|------|--------|
| `components/generate/TemplateSwitcher.tsx` | New component |
| `components/generate/CarouselEditor.tsx` | +`onChangeTemplate` prop, +mobile tab, +desktop button |
| `app/(dashboard)/generate/page.tsx` | +toolbar button, +`onChangeTemplate` handler |

---

## Feature 2: Slide Transition Animation

### Behavior

When `goToSlide(index)` is called in `CarouselEditor`:
- `index > currentSlide` → forward → current exits left, next enters from right
- `index < currentSlide` → backward → current exits right, next enters from left
- Animation: translateX ±60px → 0, opacity 0→1, duration 220ms ease-out

### Implementation

Add two pieces of state to `CarouselEditor`:
- `slideDirection: "forward" | "backward"` — determines animation direction
- `slideKey: number` — incremented on each navigation; used as `key` on slide container to force React remount and restart CSS animation

Add CSS keyframes:
```css
@keyframes slideEnterFromRight {
  from { opacity: 0; transform: translateX(60px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes slideEnterFromLeft {
  from { opacity: 0; transform: translateX(-60px); }
  to   { opacity: 1; transform: translateX(0); }
}
```

Applied to:
- Mobile: the centered slide wrapper div
- Desktop: the active slide wrapper in the slide strip

### Files Changed

| File | Change |
|------|--------|
| `components/generate/CarouselEditor.tsx` | +`slideDirection` state, +`slideKey` state, +CSS keyframes, apply animation |

---

## Constraints

- `photo_mode` is excluded from TemplateSwitcher (special template, not in registry)
- Template switch is instant — no loading state needed
- Animation key forces DOM remount — `applyEditorStyles` useEffect will re-run correctly
- `slideKey` is not reset when template changes (only on slide navigation)
