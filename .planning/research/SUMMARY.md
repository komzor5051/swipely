# Project Research Summary

**Project:** Swipely — Milestone 2 (Rich Carousels + Content Planning)
**Domain:** AI carousel generator SaaS (swipely-nextjs)
**Researched:** 2026-03-19
**Confidence:** HIGH

## Executive Summary

Swipely Milestone 2 adds four capabilities to the existing Next.js 16 + React 19 + Supabase + Gemini stack: per-slide layout variation, rich slide elements (lists, stats, SVG charts), user photo upload, and a 30-day AI content calendar. The research confirms that all four features are buildable on the current architecture without introducing new npm packages or replacing existing patterns. The recommended approach is additive: extend `SlideData` schema with optional fields `layout` and `elements`, wire Gemini to populate them, add new React components for rendering, and add two new Supabase tables/buckets. No breaking changes are required.

The most important finding is that the entire export pipeline (html-to-image/html2canvas) creates hard technical constraints that must drive every implementation decision. Canvas-based chart libraries fail silently during PNG export — SVG-only charts with explicit pixel dimensions are mandatory. CSS `backdrop-filter` is silently dropped in exports and must be removed from all existing templates before new layouts are added. User-uploaded photos must be converted to base64 data URIs client-side before passing to slide components, because cross-origin URLs cause export failures regardless of CORS configuration. These are not optional concerns: shipping without addressing them produces broken exports that look correct in the editor.

The competitive landscape shows that AI-automatically-assigned per-slide layouts are a genuine differentiator — no current competitor does this. All other major carousel tools use one layout per carousel. Content calendar with variety enforcement and one-click carousel generation is directly modeled by Predis AI (the closest competitor) and represents table-stakes for moving from "carousel tool" to "content platform." The recommended build sequence is: layout system first (schema foundation), then rich elements (builds on layout), then photo upload (independent but touches the export pipeline), then content calendar (fully independent, highest standalone value). Content calendar can be built in parallel with rich elements given independent team capacity.

## Key Findings

### Recommended Stack

The stack is entirely fixed — no new dependencies are needed. All four features build on existing installed packages. Hand-written SVG React components replace any chart library because html-to-image cannot reliably capture Canvas or CSS-variable-based rendering during PNG export. Recharts (already installed) stays confined to the admin analytics page. The only conditional addition: `d3-shape` (~8KB) if pie chart arc math becomes unwieldy, but the `stroke-dasharray` technique for donut charts eliminates this need entirely.

Supabase Storage (already provisioned, unused) becomes active in this milestone for user photos. The signed-upload-URL pattern (client requests URL from server, uploads directly to Storage, server never handles the file bytes) is the correct architecture to avoid Next.js 1MB body limits on server actions.

**Core technologies:**
- Next.js 16 + React 19: existing — extends with new pages and API routes
- Gemini (google/genai SDK): existing — extends with `responseSchema` enums for layout and elements fields
- Supabase (database + Storage): existing — new `content_plans` table + `user-photos` bucket
- html-to-image (already installed, currently unused): existing export pipeline — no change to export mechanism
- Hand-written SVG components: new chart/element rendering — zero dependency addition

### Expected Features

**Must have (table stakes):**
- Per-slide layout variation (at least 2-3 distinct compositions) — single-layout carousels look amateur after Canva trained users
- Numbered list slide type — most common carousel format in the wild
- Stat hero / big-number slide type — standard in educational and expert content
- Full-bleed photo background with text overlay — standard photo carousel format
- Content plan persists in account — users expect saved plans, not one-time generation
- One-click from plan to generate carousel — core workflow that makes the plan actionable

**Should have (competitive differentiators):**
- AI automatically assigns layout per slide — no competitor does this; all use one layout per carousel
- 5+ distinct layout compositions (quote-center, split, text-left/right, big-number) — more visual variety than any AI-first competitor
- SVG charts as native slide type (bar, pie) — absent from all AI carousel tools; positions Swipely in infographic territory
- Content plan with variety enforcement (type + tone distribution) — most generators produce repetitive plans
- Split photo layout (photo half + text half) — more editorial than basic full-bleed

**Defer to v2+:**
- Instagram direct publishing — requires Meta app review, OAuth, compliance overhead; use external scheduling tools
- Manual photo repositioning / crop editor — adds complexity without critical MVP value
- Multi-photo carousel with AI photo assignment to slides
- Animated slides / video export — wrong render architecture (html2canvas is static PNG)
- Team collaboration on content calendar
- Hashtag research in content plan UI

### Architecture Approach

All four features integrate via a single schema extension to `SlideData` (add optional `layout` and `elements` fields) plus two new top-level surface areas (content calendar page + photo upload endpoint). The layout system uses a render branch inside each template component rather than separate components per layout variant — this keeps decorative layer code (glows, grid, logo, footer) in one place and avoids duplication. Rich elements live in `components/slides/elements/` as standalone SVG/React components, consumed by templates that opt in. The content calendar is a self-contained page with local React state, reusing the existing `/api/generate` endpoint for individual carousel generation. Photo upload uses Supabase Storage with client-side base64 conversion as the critical safety step before export.

**Major components:**
1. Extended `SlideData` schema (`types.ts`) — backward-compatible foundation for layouts + elements
2. `components/slides/elements/` — ListElement, StatElement, ProgressElement, BarChartElement, PieChartElement (pure SVG, inline styles, explicit pixel dimensions)
3. `app/api/photos/upload/route.ts` — auth-gated upload endpoint returning `{ publicUrl, storageKey }`
4. `app/api/content-plan/generate-plan/route.ts` + `[planId]/route.ts` — Gemini plan generation + PATCH for edits
5. `app/(dashboard)/content-plan/` — calendar page (server component for initial fetch + client component for interactivity)
6. Gemini prompt extension — `responseSchema` enum for `layout`, structured `elements` instructions

### Critical Pitfalls

1. **`backdrop-filter: blur()` silently drops in PNG export** — audit all templates with `grep -r "backdropFilter" components/slides/` before adding any new layout; replace with `background: "rgba(0,0,0,0.55)"` semi-transparent overlays. This affects existing templates right now.

2. **Cross-origin images break html-to-image export** — never pass a Supabase Storage URL (signed or public) directly to `backgroundImage` in slide JSX. After upload, convert to base64 data URI via `URL.createObjectURL(file)` for the current session; on reload, fetch via authenticated Supabase client and convert to base64 before rendering.

3. **SVG charts with `width="100%"` are invisible in exports** — all SVG chart components must use explicit pixel `width` and `height` attributes derived from `getSlideDimensions()`. Design this in from the start; retrofitting is error-prone.

4. **Gemini ignores `layout` field without enum schema constraint** — add `responseSchema` with enum values for `layout` when introducing the field. Without it, Gemini picks the same layout repeatedly or halluccinates variant names. Add Zod validation as a second defense layer.

5. **Content plan silent insert failure** — Supabase client swallows 403 errors (missing RLS INSERT policy) as empty data returns without throwing. Test RLS policies explicitly before wiring up UI; save partial Gemini results with `status: "partial"` rather than discarding them.

## Implications for Roadmap

Based on research, the four features have the following dependency structure: layout system must precede rich elements (big-number layout depends on stat element contract); photo upload and content calendar are both independent and can be parallelized. The correct sequence maximizes early visible value while respecting hard technical dependencies.

### Phase 1: Layout System + Slide Schema Extension

**Rationale:** Foundation for everything else. The `SlideData` schema change and Gemini prompt update are the lowest-risk, highest-leverage moves — they unlock all subsequent visual richness without any UI complexity. Must happen first because rich elements (Phase 2) depend on `layout` field being in place.

**Delivers:** Carousels where AI automatically assigns varied per-slide layouts. Immediate visual quality improvement with no new UI work — the slide preview just looks better.

**Addresses:** Per-slide layout variation (table stakes), quote-center, big-number, split, text-left/right compositions.

**Critical actions before shipping:**
- Audit and remove all `backdropFilter` from existing templates (Pitfall 1)
- Add `responseSchema` enum for `layout` in Gemini call (Pitfall 4)
- Add layout diversity enforcement in system prompt by slide index position (Pitfall 9)
- Add validation step in `/api/generate` that normalizes unknown layout values to `"default"`

**Research flag:** Standard patterns — no additional research needed. Architecture is directly derived from codebase inspection.

### Phase 2: Rich Slide Elements (Lists, Stats, SVG Charts)

**Rationale:** Builds on Phase 1 schema. Highest visual impact per implementation unit — transforms Swipely from a "text carousel tool" to an "infographic-quality content tool." SVG charts are the clearest differentiator vs all competitors in this space.

**Delivers:** List slides, stat hero slides, progress bars, bar charts, pie/donut charts as native AI-generated slide types. Positions Swipely in infographic territory where no AI carousel competitor exists.

**Addresses:** Numbered list (table stakes), big-number stat (table stakes), inline SVG charts (differentiator), progress bar / comparison stats (differentiator).

**Critical constraints:**
- All SVG components: explicit pixel dimensions, inline styles only, no CSS class references (Pitfall 5, Pitfall 8)
- Recharts stays in `/admin` only — never used in slide rendering
- Cap list items at 5, chart data points at 8 in Gemini validation step
- `elements` renders below `content` in default layout; replaces `content` as focal area in big-number and split layouts

**Research flag:** Standard SVG patterns — no research phase needed. Stack research fully specifies the implementation.

### Phase 3: User Photo Upload

**Rationale:** Independent of Phases 1-2 but touches the export pipeline. Builds on the `split` and `default` layouts introduced in Phase 1. Delivering this after layout system means the photo placement compositions (split layout, full-bleed) already exist.

**Delivers:** Users can upload their own photos and use them as slide backgrounds (full-bleed) or in split layout (photo half + text half). Unlocks product photography carousels, personal brand carousels, before/after sequences.

**Addresses:** Full-bleed photo background with text overlay (table stakes), split photo layout (differentiator).

**Critical constraints:**
- Signed-upload-URL pattern (client uploads directly to Supabase Storage, server never handles file bytes) — avoids Next.js 1MB body limit
- Client-side base64 conversion immediately after upload — mandatory for export reliability (Pitfall 2, Pitfall 7)
- Set 10MB bucket-level file size limit; validate client-side before requesting signed URL
- RLS policy: users can only upload to `{userId}/*` path prefix
- CORS configuration on `user-photos` bucket for `swipely.ru` and localhost

**Research flag:** Standard patterns — Supabase signed upload URL is official docs-verified. Export CORS issue is well-documented.

### Phase 4: Content Calendar

**Rationale:** Fully independent of Phases 1-3. Can be parallelized with Phase 2 or 3 given capacity. Placed last in sequence because it delivers the highest strategic value (transforms Swipely from tool to platform) and benefits from having the carousel generation quality improved in Phases 1-2 before users start generating carousels from the calendar.

**Delivers:** AI-generated 30-day content plan (topic + date + post type + tone per day), persistent in user account, with one-click carousel generation from any calendar item. Reuses `/api/generate` unchanged — the calendar is a structured way to queue generation calls.

**Addresses:** Content plan persistence (table stakes), one-click from plan to generate (table stakes), variety enforcement / type distribution (differentiator).

**Critical constraints:**
- `content_plans` table with JSONB `items[]` column — no normalization needed, whole plan loads at once
- RLS INSERT policy must be tested before UI is wired up (Pitfall 6 — Supabase swallows 403 silently)
- Save partial Gemini results with `status: "partial"` if response is truncated — never discard
- Content plan generation does NOT consume a carousel slot — separate Gemini call, no `claim_generation_slot`
- Do NOT call `/api/generate` server-side from `/api/content-plan/generate-plan` — they are separate prompts for separate concerns

**Research flag:** May benefit from light research-phase on Gemini token limits for 30-item structured output, to calibrate `maxOutputTokens` and handle partial responses gracefully.

### Phase Ordering Rationale

- Phase 1 must be first: schema extension is the foundation; rich elements cannot be built without the `layout` field contract established
- Phase 2 follows Phase 1 directly: `big-number` layout is semantically linked to `stat` element — building both in the same pass prevents a second round of template modifications
- Phase 3 is independent but benefits from Phase 1 layouts (split composition already exists when photo upload lands)
- Phase 4 is independent and highest strategic value — sequencing it last ensures the generation quality it surfaces is already improved
- Pitfall 1 (`backdropFilter`) must be fixed in Phase 1 before any new templates ship — it affects existing templates and will compound with each new layout added

### Research Flags

Needs additional research before planning:
- **Phase 4 (Content Calendar):** Gemini structured output token limits for 30-item JSON arrays. Need to verify `maxOutputTokens` ceiling and test partial response handling before writing the endpoint.

Standard patterns (skip research-phase):
- **Phase 1 (Layout System):** Derived from direct codebase audit + Gemini responseSchema official docs.
- **Phase 2 (Rich Elements):** SVG-only approach is fully specified in STACK.md; no library decisions pending.
- **Phase 3 (Photo Upload):** Supabase signed-upload-URL pattern is official docs-verified; CORS and base64 patterns are established.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All decisions grounded in direct codebase audit + official Supabase/Gemini docs. No new dependencies = no version uncertainty. |
| Features | MEDIUM | Competitive landscape research used secondary sources (reviews, aggregators). Direct tool access was limited. Core conclusions (layout variation as differentiator, charts absent from competitors) are consistent across multiple sources. |
| Architecture | HIGH | Based on direct inspection of all relevant files: `types.ts`, `utils.tsx`, `/api/generate/route.ts`, `SwipelySlide.tsx`. Integration patterns fully specified. |
| Pitfalls | HIGH | html-to-image limitations verified against GitHub issues with issue numbers. Supabase CORS behavior verified against official docs. Gemini enum behavior verified against SDK issue tracker. |

**Overall confidence:** HIGH

### Gaps to Address

- **Gemini 30-item structured output reliability:** The content plan generation requests 30 structured objects in a single Gemini call. Maximum output token behavior with `responseSchema` constraints is not fully characterized. Validate during Phase 4 planning: test with `gemini-2.0-flash` at 30 items, measure truncation frequency, decide whether to split into two 15-item calls if needed.

- **html2canvas vs html-to-image:** The existing export pipeline (`SwipelySlide` rendering) uses html2canvas in some paths and html-to-image in others. The research notes html-to-image is installed but currently unused as the primary exporter. Clarify which library is the active export path before Phase 2 (rich elements) ships — SVG chart behavior differs between the two libraries and the fix strategy differs accordingly.

- **Template coverage for layout variants:** Research recommends starting with 4-5 of the most-used templates for layout variant implementation. The actual usage distribution (which templates users select most) should be checked in the `generations` table before deciding which templates to prioritize.

## Sources

### Primary (HIGH confidence)
- Direct codebase audit: `swipely-nextjs/components/slides/types.ts`, `utils.tsx`, `app/api/generate/route.ts`, `SwipelySlide.tsx` — current schema, rendering chain, existing patterns
- Supabase Storage official docs: signed upload URL pattern, storage RLS policies, file limits
- Gemini Structured Outputs official docs: responseSchema enum constraints
- html-to-image GitHub Issue #239 (backdrop-filter), #207 (Google Fonts CORS), #40 (cross-origin images) — confirmed open issues

### Secondary (MEDIUM confidence)
- PostNitro help docs: photo background UX pattern
- Venngage official blog: infographic slide types and layout patterns
- Piktochart official blog: visual hierarchy in carousels
- Hootsuite blog: Instagram carousel best practices 2026
- Metricool: carousel post patterns 2026
- npm-compare: html-to-image vs html2canvas architecture differences

### Tertiary (LOW confidence)
- aiCarousels blog: competitive feature landscape (couldn't fetch full page)
- ContentDrips 2025 review (secondary review aggregator): brand kit upload patterns
- RankYak AI content calendar aggregator: competitive landscape for content planning tools

---
*Research completed: 2026-03-19*
*Ready for roadmap: yes*
