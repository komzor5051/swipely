---
phase: 01-layout-system
plan: 02
subsystem: ui
tags: [react, templates, slide-layout, html-to-image, png-export]

# Dependency graph
requires:
  - phase: 01-layout-system/01-01
    provides: SlideLayout type, getLayoutVariant 4th param, layout field on SlideData

provides:
  - All 24 slide templates pass slide.layout to getLayoutVariant as 4th argument
  - All backdropFilter/backdrop-filter removed from slide components
  - PNG export now renders correctly without blur artifacts

affects:
  - phase 2 (chart-slides): templates they create will auto-inherit layout wiring pattern
  - phase 3 (photo-upload): PhotoSlide already wired and backdropFilter-free

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Group A pattern: single-line change getLayoutVariant(type, n, total) -> getLayoutVariant(type, n, total, slide.layout)"
    - "Group B pattern: import getLayoutVariant+getContentAlignment, call both, apply alignment to main content flex justifyContent"
    - "backdropFilter replacement: remove filter, increase rgba alpha by +0.2 to compensate for lost frosted-glass effect"

key-files:
  created: []
  modified:
    - swipely-nextjs/components/slides/templates/SwipelySlide.tsx
    - swipely-nextjs/components/slides/templates/GridMultiSlide.tsx
    - swipely-nextjs/components/slides/templates/SpeechBubbleSlide.tsx
    - swipely-nextjs/components/slides/templates/StarHighlightSlide.tsx
    - swipely-nextjs/components/slides/templates/ReceiptSlide.tsx
    - swipely-nextjs/components/slides/templates/PurpleAccentSlide.tsx
    - swipely-nextjs/components/slides/templates/QuoteDoodleSlide.tsx
    - swipely-nextjs/components/slides/templates/StreetSlide.tsx
    - swipely-nextjs/components/slides/templates/ChapterSlide.tsx
    - swipely-nextjs/components/slides/templates/DispatchSlide.tsx
    - swipely-nextjs/components/slides/templates/FrameSlide.tsx
    - swipely-nextjs/components/slides/templates/NewspaperSlide.tsx
    - swipely-nextjs/components/slides/templates/TerminalSlide.tsx
    - swipely-nextjs/components/slides/templates/PolaroidSlide.tsx
    - swipely-nextjs/components/slides/templates/BlueprintSlide.tsx
    - swipely-nextjs/components/slides/templates/MagazineSlide.tsx
    - swipely-nextjs/components/slides/templates/KinfolkSlide.tsx
    - swipely-nextjs/components/slides/templates/SwissSlide.tsx
    - swipely-nextjs/components/slides/templates/WabiSlide.tsx
    - swipely-nextjs/components/slides/templates/NikkeiSlide.tsx
    - swipely-nextjs/components/slides/templates/ClientCustomV1Slide.tsx
    - swipely-nextjs/components/slides/templates/OneTwoPrimeDarkSlide.tsx
    - swipely-nextjs/components/slides/templates/OneTwoPrimeWhiteSlide.tsx
    - swipely-nextjs/components/slides/templates/PhotoSlide.tsx
    - swipely-nextjs/components/slides/SlideRenderer.tsx

key-decisions:
  - "KinfolkSlide/NikkeiSlide/SwissSlide/WabiSlide/PhotoSlide Group B: added getLayoutVariant+getContentAlignment, applied alignment to nearest justifyContent on main content flex container"
  - "SwissSlide two-column layout: alignment applied to right content column (not root flex row) since root is horizontal"
  - "WabiSlide absolute-bottom layout: alignment applied to inner column's justifyContent despite absolute positioning"
  - "PhotoSlide: content wrapper justifyContent changed from hardcoded space-between to alignment variable"
  - "NikkeiSlide: both hook and content branch headline divs use alignment (same variable computed once before branch)"
  - "backdropFilter replacement alpha values: +0.2 increase on rgba backgrounds to compensate for removed frosted-glass effect"

patterns-established:
  - "Template layout wiring: all new templates must call getLayoutVariant with slide.layout as 4th arg and apply result via getContentAlignment"
  - "No backdropFilter in slide components: html-to-image cannot render it; use solid rgba instead"

requirements-completed: [LAYOUT-02, LAYOUT-04]

# Metrics
duration: 25min
completed: 2026-03-19
---

# Phase 01 Plan 02: Wire layout into all templates + remove backdrop-filter Summary

**All 24 slide templates wired to AI-assigned slide.layout via getLayoutVariant 4th arg, and all backdropFilter removed from slide components to fix html-to-image PNG export artifacts**

## Performance

- **Duration:** 25 min
- **Started:** 2026-03-19T00:00:00Z
- **Completed:** 2026-03-19T00:25:00Z
- **Tasks:** 2
- **Files modified:** 25

## Accomplishments

- Wired slide.layout into all 24 templates (19 Group A with single-line change, 5 Group B with full import+call pattern)
- Removed all backdropFilter / WebkitBackdropFilter / backdrop-filter occurrences from slide components (5 total across 3 files)
- PNG export artifacts from unsupported CSS backdrop-filter are now eliminated
- Group B templates (Kinfolk, Nikkei, Swiss, Wabi, Photo) are now layout-aware for the first time

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire slide.layout into all 24 templates** - `55471ed` (feat)
2. **Task 2: Remove all backdropFilter from slide components** - `9eaddd7` (fix)

## Files Created/Modified

- `components/slides/templates/SwipelySlide.tsx` - slide.layout wired + backdropFilter removed from footer badge
- `components/slides/templates/PhotoSlide.tsx` - slide.layout wired + 3 backdropFilter occurrences removed (content overlay, counter, username)
- `components/slides/SlideRenderer.tsx` - backdropFilter removed from watermark badge
- `components/slides/templates/KinfolkSlide.tsx` - full Group B wiring: import + call + alignment on middle section
- `components/slides/templates/NikkeiSlide.tsx` - full Group B wiring: alignment applied to both branch headline divs
- `components/slides/templates/SwissSlide.tsx` - full Group B wiring: alignment on right content column
- `components/slides/templates/WabiSlide.tsx` - full Group B wiring: alignment on bottom section flex column
- 17 other Group A templates - single-line 4th arg addition to getLayoutVariant call

## Decisions Made

- NikkeiSlide has two early-return branches (hook vs content); both headline divs get `justifyContent: alignment` computed once before the branch
- SwissSlide is a 2-column horizontal layout; alignment is applied to the right column's flex column, not the root horizontal row
- WabiSlide uses absolute positioning for bottom content; alignment is added as justifyContent on the inner column even though height is auto-sized
- PhotoSlide previously used hardcoded `justifyContent: "space-between"` in content wrapper — replaced with alignment variable

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Layout system circuit is complete: Gemini assigns layouts via responseSchema, getLayoutVariant honors them, all 24 templates render accordingly
- Phase 2 (chart slides) can start: any new templates should follow the Group B pattern (import getLayoutVariant+getContentAlignment, use alignment)
- No backdropFilter debt remaining in slide components

---
*Phase: 01-layout-system*
*Completed: 2026-03-19*
