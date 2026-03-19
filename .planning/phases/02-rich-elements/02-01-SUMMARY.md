---
phase: 02-rich-elements
plan: 01
subsystem: ui
tags: [react, typescript, svg, gemini, next.js]

# Dependency graph
requires:
  - phase: 01-layout-system
    provides: SlideLayout type and SlideData interface in types.ts

provides:
  - SlideElement discriminated union type (list | stat | bar_chart | pie_chart)
  - ChartItem interface for unified chart/list data
  - ListElement component — styled numbered list with accent markers
  - StatElement component — big number hero with supporting label
  - BarChartElement component — inline SVG bar chart, up to 5 bars, monochrome
  - PieChartElement component — inline SVG donut chart with opacity-step palette, up to 5 slices
  - renderElement dispatcher in elements/index.tsx
  - Gemini responseSchema extended with optional element field per slide
  - System prompt updated with Rich elements instructions

affects: [02-rich-elements/02-02, template files that will call renderElement]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - All element components use inline React style objects (no Tailwind) — matches existing template convention
    - SVG elements are hand-written inline (no external chart libraries)
    - Unified {label, value} ChartItem schema for all element types — Gemini structured output constraint
    - hexToRgba helper is file-local in PieChartElement (not shared util)

key-files:
  created:
    - swipely-nextjs/components/slides/elements/ListElement.tsx
    - swipely-nextjs/components/slides/elements/StatElement.tsx
    - swipely-nextjs/components/slides/elements/BarChartElement.tsx
    - swipely-nextjs/components/slides/elements/PieChartElement.tsx
    - swipely-nextjs/components/slides/elements/index.tsx
  modified:
    - swipely-nextjs/components/slides/types.ts
    - swipely-nextjs/app/api/generate/route.ts

key-decisions:
  - "ListElementData.items uses ChartItem[] (not string[]) — unified schema enables single Gemini responseSchema for all element types"
  - "All element components inline React styles — no Tailwind inside slide components, matches existing template pattern"
  - "No external chart libraries — SVG charts hand-written inline per Phase 2 decision established in CONTEXT.md"
  - "maxOutputTokens increased from 3000 to 4000 — element JSON arrays (items with label/value) add token overhead"
  - "element is NOT in Gemini required array — remains optional per slide, AI chooses where to add value"

patterns-established:
  - "Element components: export named function, accept accentColor prop, use inline styles only, no backdrop-filter"
  - "renderElement pattern: switch on element.type, return React.ReactNode, null for unrecognized types"
  - "Pie chart colors: accentColor at 5 opacity steps [1.0, 0.75, 0.55, 0.40, 0.28] via hexToRgba helper"

requirements-completed: [RICH-01, RICH-02, RICH-03, RICH-04]

# Metrics
duration: 16min
completed: 2026-03-19
---

# Phase 2 Plan 01: Rich Elements Foundation Summary

**SlideElement discriminated union with 4 SVG/HTML components (list, stat, bar chart, pie chart), renderElement dispatcher, and Gemini schema extended to optionally assign elements to slides**

## Performance

- **Duration:** 16 min
- **Started:** 2026-03-19T13:07:41Z
- **Completed:** 2026-03-19T13:23:41Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Full SlideElement type system with discriminated union across 4 variants, ChartItem as shared data primitive
- 4 element components built with inline SVG/React styles — no external dependencies, no backdrop-filter
- renderElement dispatcher centralizes element-to-component mapping for all templates in Plan 02
- Gemini AI can now assign rich elements to slides via structured output schema; system prompt explains when and how

## Task Commits

1. **Task 1: Define SlideElement types and create all 4 element components with renderElement dispatcher** - `67d83d6` (feat)
2. **Task 2: Extend Gemini responseSchema with element object and update system prompt** - `07a965c` (feat)

## Files Created/Modified

- `swipely-nextjs/components/slides/types.ts` — Added ChartItem, 4 ElementData interfaces, SlideElement union, element? field on SlideData
- `swipely-nextjs/components/slides/elements/ListElement.tsx` — Numbered list with circular accent markers, reads item.label from ChartItem[]
- `swipely-nextjs/components/slides/elements/StatElement.tsx` — Big number (120px, accent color) + supporting label
- `swipely-nextjs/components/slides/elements/BarChartElement.tsx` — Inline SVG vertical bar chart, 800x400 viewBox, up to 5 bars
- `swipely-nextjs/components/slides/elements/PieChartElement.tsx` — Inline SVG donut chart (outer 160, inner 90), hexToRgba opacity palette, small-slice label offloading
- `swipely-nextjs/components/slides/elements/index.tsx` — renderElement dispatcher + re-exports of all 4 components
- `swipely-nextjs/app/api/generate/route.ts` — element added to responseSchema (nullable, not required), maxOutputTokens 3000→4000, Rich elements added to system prompt

## Decisions Made

- `ListElementData.items: ChartItem[]` instead of `string[]` — Gemini structured output cannot produce discriminated unions, so a unified `{label, value}` shape is shared by all 4 element types. ListElement renders only `item.label`.
- Element components use inline React `style` objects throughout — this is the established convention for all slide template components, ensures html2canvas/html-to-image compatibility.
- No external chart libraries added — Phase 2 CONTEXT.md established that SVG charts are hand-written inline (Recharts stays in /admin only).
- `maxOutputTokens` raised from 3000 to 4000 — element items arrays with labels and values add token overhead, especially for list elements with 7 items.
- `element` is not in the `required` array in Gemini responseSchema — keeps it optional so AI can decide per-slide, matches the plan intent (1-3 elements per carousel, not every slide).

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- All 4 element components are ready to be wired into templates in Plan 02-02
- renderElement dispatcher is the single integration point for all templates
- TypeScript compiles clean — zero errors across the codebase after both tasks

---
*Phase: 02-rich-elements*
*Completed: 2026-03-19*
