# Phase 2: Rich Elements - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Add 4 rich element types — styled numbered list, stat hero (big number), SVG bar chart, SVG pie chart — that Gemini can assign to any slide via a single `element` field in the slide JSON. Elements render through a shared `components/slides/elements/` component layer that all 24 templates import. All rich element slides must export correctly via html-to-image (`toPng`).

</domain>

<decisions>
## Implementation Decisions

### Template scope
- All 24 templates support rich elements (not a curated subset)
- Elements live in a shared `components/slides/elements/` directory: `ListElement`, `StatElement`, `BarChartElement`, `PieChartElement`
- Templates import and position elements from this shared layer — no per-template element implementations
- Researcher should investigate how current template rendering patterns (layout variants, content alignment) integrate with an injected element region

### Elements + content coexistence
- Each slide has at most ONE element (single element per slide, not an array)
- Schema: `element?: { type: "list" | "stat" | "bar_chart" | "pie_chart", ...data }`; null/absent means no element
- When a slide has an element, `content` becomes a short subtitle/caption displayed below the element
- Gemini generates `content` as a brief 1-line label when `element` is present
- `title` remains as the slide headline regardless of element type

### Stat hero design
- Shows: big number (`value: string`) + supporting label (`label: string`) only — no context line or comparison
- The big number is styled with the template's primary accent color (inherits the template's existing accent variable)
- StatElement accepts a `accentColor` prop that templates pass in from their own color constants

### Chart aesthetics — bar chart
- Monochrome: all bars share the template's accent color
- Max 5 bars per chart
- Inline labels: label above each bar (category name), value displayed on the bar or above it
- Gemini provides: `items: [{label: string, value: number}]` (3–5 items)

### Chart aesthetics — pie chart
- Max 5 slices
- Inline labels: label adjacent to each slice (no separate legend)
- Color scheme: Claude's discretion — use accent color with stepped opacity or a small preset palette (see discretion section)
- Gemini provides: `items: [{label: string, value: number}]` (3–5 items, values are raw numbers; component computes percentages)

### Claude's Discretion
- Pie chart color palette (accent-stepped opacity vs a small preset of 5 neutral tones)
- Exact font sizes and spacing within each element component
- How templates position the element region relative to title + content (top, center, or contextually based on layout variant)
- Whether `BarChartElement` and `PieChartElement` use a shared SVG util or are fully independent

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Types and schema
- `swipely-nextjs/components/slides/types.ts` — Current `SlideData` interface; `element` field must be added here
- `swipely-nextjs/app/api/generate/route.ts` — Gemini `responseSchema` definition; `element` object must be added to the slide schema

### Rendering infrastructure
- `swipely-nextjs/components/slides/utils.tsx` — `getLayoutVariant`, `getContentAlignment`, `renderTitle`, `renderContent`; understand before adding element rendering
- `swipely-nextjs/components/slides/SlideRenderer.tsx` — Template dispatch map; no changes expected but read to understand how slides flow

### Representative templates (read before deciding element injection pattern)
- `swipely-nextjs/components/slides/templates/DispatchSlide.tsx` — Layout-variant template; understand how content is positioned
- `swipely-nextjs/components/slides/templates/MagazineSlide.tsx` — Another layout-variant template with different content zones

### Export constraint
- `swipely-nextjs/components/slides/utils.tsx` — `PhotoBackground` and overlay patterns; SVG must follow same inline-only approach (no external resources, no backdrop-filter)

### Project constraints
- `.planning/PROJECT.md` §Constraints — `backdrop-filter` banned, Gemini only, html-to-image is the export method
- `.planning/STATE.md` §Blockers/Concerns — "Active export library (html2canvas vs html-to-image) needs to be confirmed before Phase 2 ships — SVG behavior differs between the two"

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/slides/utils.tsx` — `getLayoutVariant`, `getContentAlignment`, `renderTitle`, `renderContent`, `getSlideDimensions`, `scaleContentFontSize`: all available to element components
- `components/slides/types.ts` — `SlideData`, `SlideProps`, `SlideLayout`: extend `SlideData` with `element?` field

### Established Patterns
- All templates use inline React `style` objects (no Tailwind inside slide components) — element components must follow the same pattern
- Templates define their own accent color constants at file top (e.g. `const ACCENT = "#5B4FE8"`) — `StatElement` and chart elements receive accent color as a prop
- No `backdrop-filter` anywhere — solid `rgba` overlays only
- Template structure: `<style>{FONTS}</style>` + fixed `width`/`height` from `getSlideDimensions` + `position: "relative"` wrapper

### Integration Points
- `types.ts`: add `element?: SlideElement` to `SlideData`
- `route.ts` `responseSchema`: extend the slide item schema with optional `element` object
- Each template: detect `slide.element` and render the appropriate element component in the content zone
- `components/slides/elements/` directory: create (does not exist yet)

</code_context>

<specifics>
## Specific Ideas

- User confirmed: researcher should study template rendering patterns before the planner decides how elements are positioned within each template's content zone
- STATE.md blocker must be resolved before Phase 2 ships: confirm whether html-to-image or html2canvas is the active export path; SVG inline rendering behaves differently in each

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-rich-elements*
*Context gathered: 2026-03-19*
