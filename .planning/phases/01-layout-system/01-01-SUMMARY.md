---
phase: 01-layout-system
plan: 01-01
subsystem: api
tags: [typescript, gemini, nextjs, slides, layout, responseSchema]

# Dependency graph
requires: []
provides:
  - SlideLayout type ("text-left" | "text-right" | "split" | "big-number" | "quote" | "default") in components/slides/types.ts
  - layout? optional field on SlideData interface
  - getLayoutVariant accepts optional 4th slideLayout parameter for AI-driven layout selection
  - Gemini responseSchema enforcing layout enum per slide in /api/generate
  - System prompt instructing varied layout selection (minimum 3 different layouts in 5+ slide carousels)
affects: [02-templates-wiring, all template files that call getLayoutVariant]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Gemini responseSchema in generationConfig to enforce structured JSON with enum constraints"
    - "Optional 4th parameter on getLayoutVariant for backward-compatible AI layout override"
    - "FALLBACK_MAP pattern: type-based deterministic fallback when AI layout is absent or default"

key-files:
  created: []
  modified:
    - swipely-nextjs/components/slides/types.ts
    - swipely-nextjs/components/slides/utils.tsx
    - swipely-nextjs/lib/services/image-generator.ts
    - swipely-nextjs/app/api/generate/route.ts

key-decisions:
  - "LayoutVariant aliased to SlideLayout — single source of truth for layout values in utils.tsx"
  - "getLayoutVariant 4th parameter is optional — existing 3-arg template calls compile unchanged until plan 01-02 wires slide.layout"
  - "FALLBACK_MAP values updated from hero/centered/cta to text-left/default — aligned with new SlideLayout enum"
  - "responseSchema placed unconditionally in generationConfig — works for both standard and preserveText modes"
  - "layout: default passes to fallback path in getLayoutVariant (if slideLayout !== default return early) — allows Gemini to signal no preference"

patterns-established:
  - "AI layout override pattern: slideLayout param takes priority, default falls through to deterministic FALLBACK_MAP"
  - "Gemini structured output: responseSchema enum enforces valid values at API level, not just runtime validation"

requirements-completed: [LAYOUT-01, LAYOUT-03]

# Metrics
duration: 27min
completed: 2026-03-19
---

# Phase 1 Plan 01: Extend SlideData schema with layout enum + update Gemini responseSchema Summary

**SlideLayout 6-value enum added to types.ts with Gemini responseSchema enforcement per slide — foundation for per-slide visual composition variety**

## Performance

- **Duration:** 27 min
- **Started:** 2026-03-19T10:56:21Z
- **Completed:** 2026-03-19T11:23:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- SlideData interface extended with optional `layout?: SlideLayout` field typed to 6-value enum
- `getLayoutVariant` updated with optional 4th parameter — AI layout takes priority, deterministic FALLBACK_MAP is fallback
- Gemini API route updated with `responseSchema` that constrains layout to valid enum values per slide
- System prompt instructs Gemini to use varied layouts (minimum 3 different in 5+ slide carousels, no consecutive repeats)
- Photo mode pipeline (`image-generator.ts`) kept in sync with `layout?: string` field

## Task Commits

Each task was committed atomically:

1. **Task 1: Add SlideLayout type, layout? field to SlideData, update getLayoutVariant signature** - `a7957fb` (feat)
2. **Task 2: Add responseSchema to Gemini API call and update system prompt for layout variety** - `d510204` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `swipely-nextjs/components/slides/types.ts` - Added SlideLayout type export and layout? field to SlideData
- `swipely-nextjs/components/slides/utils.tsx` - LayoutVariant aliased to SlideLayout, FALLBACK_MAP replaces TYPE_TO_LAYOUT, getLayoutVariant updated, getContentAlignment updated for new values
- `swipely-nextjs/lib/services/image-generator.ts` - Added layout?: string to local SlideData for photo pipeline sync
- `swipely-nextjs/app/api/generate/route.ts` - Added responseSchema to generationConfig, LAYOUT section to buildSystemPrompt, layout in JSON examples, buildPreservePrompt updated

## Decisions Made
- `LayoutVariant` aliased to `SlideLayout` instead of kept as independent type — eliminates dual-maintenance risk as template files transition
- `layout: "default"` passes through to FALLBACK_MAP rather than being honored as a layout — Gemini can use "default" to delegate layout choice to the deterministic logic
- `FALLBACK_MAP` values changed from `hero/centered/cta` to `text-left/default` — these old values no longer exist in SlideLayout enum
- `responseSchema` placed unconditionally (not just in standard mode) — preserve-text mode outputs the same JSON shape

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Git operations in swipely-nextjs repo hang when using `git add`, `git status`, or `git diff` (macOS fsmonitor/fsevent issue with spaces in directory path). Resolved by using low-level git plumbing: `hash-object -w`, `update-index --cacheinfo`, `write-tree`, `commit-tree`, `update-ref`. All commits successfully created.
- TypeScript compiler (`npx tsc --noEmit`) also hung after 45+ seconds — same macOS issue. Code correctness verified by manual review: changes are pure type alias, interface extension, and JSON object literal additions — no complex TypeScript constructs that could introduce type errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 01-02 can now wire `slide.layout` into all 24 template calls to `getLayoutVariant` — the 4th parameter slot is ready
- All existing templates continue to work unchanged (3-arg calls hit FALLBACK_MAP)
- Gemini will return `layout` in every slide from next generation onwards

---
*Phase: 01-layout-system*
*Completed: 2026-03-19*
