# Embla Carousel — Design Spec

**Goal:** Replace custom scroll/navigation in TemplateSwitcher and CarouselEditor with Embla-based carousel showing 3 items per view, arrow buttons, and dot indicators.

**Architecture:** Use the existing `components/ui/carousel.tsx` (already Embla-based). Both places get the same interaction pattern: 3 items visible, center/selected item highlighted, ‹ › arrows, dots below.

---

## Place 1: TemplateSwitcher

**Current state:** 2-column CSS grid, vertical scroll inside the modal.

**New state:** Horizontal Embla carousel inside the modal body.

- Shows 3 template cards per view (each card = ~33% width of carousel viewport)
- Arrow buttons `‹` `›` on left/right of the carousel row (icon-only, no text)
- Dot indicators below — one dot per page (page = 3 templates), active dot wider/lime
- Selected template card has lime `#D4F542` border + name label + checkmark badge
- Locked (pro-only) templates still show Lock icon overlay
- On click: select template → call `onSelect()` → close switcher
- Arrows disabled at boundaries (first/last page)
- Touch swipe supported via Embla natively

**Card anatomy:**
- Square aspect ratio (1:1)
- Top: live `SlideRenderer` at `scale={0.16}` (same as before, just bigger card)
- Bottom label: template name, lime bg if selected, dark bg otherwise

**Pages:** 16 templates total → 6 pages of 3 (last page has 1 template)

---

## Place 2: CarouselEditor — slide strip

**Current state:**
- Desktop: horizontal overflow-scroll strip, active slide at scale 0.38, others at scale 0.18
- Mobile: single slide centered, chevrons in top header

**New state (both desktop and mobile):** Embla carousel showing 3 slides at a time.

- 3 slides always visible; center slot = active slide, highlighted with lime border and glow
- Non-active slides: opacity 0.45
- Arrow buttons `‹` `›` flanking the carousel (icon-only)
- Dot indicators below (one per slide, active dot wider/lime)
- Clicking a non-active card makes it active (centers it)
- Counter in top header updates: `N / total`
- Drag-to-reposition text overlay stays on active card
- Touch swipe via Embla on mobile
- Export still loops all slides via `exportContainerRef` (unchanged)

**Behavior at edges:**
- First slide: ‹ disabled, slides 1-2-3 visible
- Last slide: › disabled, slides N-2, N-1, N visible

---

## What does NOT change

- `SlideRenderer` component — unchanged
- `TemplateSwitcher` modal shell (header, backdrop, bottom sheet on mobile) — unchanged
- Export logic in CarouselEditor — unchanged
- Drag-to-reposition logic — unchanged
- `editStates` array and `applyEditorStyles` — unchanged

---

## Components to modify

| File | Change |
|------|--------|
| `components/generate/TemplateSwitcher.tsx` | Replace grid with Embla carousel |
| `components/generate/CarouselEditor.tsx` | Replace slide strip with Embla carousel |

## Dependencies

- `embla-carousel-react` — already installed (used by `carousel.tsx`)
- `components/ui/carousel.tsx` — can use directly OR use `useEmblaCarousel` hook directly for more control
