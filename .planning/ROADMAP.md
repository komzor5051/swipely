# Roadmap: Swipely Milestone 2 — Rich Carousels + Content Planning

## Overview

Four phases build on the existing Next.js 16 + React 19 + Gemini + Supabase stack. Phase 1 extends the slide schema and fixes the export pipeline — it is the prerequisite for everything visual. Phase 2 adds rich rendering components (lists, stats, SVG charts) that depend on the Phase 1 schema. Phase 3 (user photo upload) is architecturally independent and touches the export pipeline in a different way. Phase 4 (content calendar) is fully independent and delivers the highest strategic value — moving Swipely from a carousel tool to a content platform. Every requirement is additive; no breaking changes to existing behavior.

## Phases

- [x] **Phase 1: Layout System** - AI assigns varied per-slide layouts; export pipeline made reliable (completed 2026-03-19)
- [ ] **Phase 2: Rich Elements** - Lists, stat heroes, and SVG charts as native slide types
- [ ] **Phase 3: User Photo Upload** - Users upload their own photos as slide backgrounds
- [ ] **Phase 4: Content Calendar** - AI-generated 30-day content plan with one-click carousel generation

## Phase Details

### Phase 1: Layout System
**Goal**: Carousels where every slide has a distinct AI-assigned visual composition, with a reliable PNG export pipeline
**Depends on**: Nothing (first phase)
**Requirements**: LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04
**Success Criteria** (what must be TRUE):
  1. A generated carousel shows at least two visually distinct slide compositions within the same carousel
  2. All existing templates render without visual regression after the layout system is introduced
  3. Exported PNGs match what the user sees in the editor (no blur artifacts, no invisible overlays)
  4. AI consistently uses different layout values per slide — the same layout does not repeat for every slide in a 5+ slide carousel
**Plans:** 2/2 plans complete

Plans:
- [x] 01-01-PLAN.md — Extend SlideData schema with layout enum + update Gemini responseSchema
- [x] 01-02-PLAN.md — Wire layout into all templates + remove backdrop-filter

### Phase 2: Rich Elements
**Goal**: Users receive slides with beautifully rendered numbered lists, stat heroes, and SVG charts as AI-chosen content types
**Depends on**: Phase 1
**Requirements**: RICH-01, RICH-02, RICH-03, RICH-04, RICH-05
**Success Criteria** (what must be TRUE):
  1. A generated carousel can include a slide with a styled numbered list (not a default browser `<ol>`)
  2. A generated carousel can include a stat hero slide with a large number and supporting label
  3. A generated carousel can include an inline SVG bar chart slide
  4. A generated carousel can include an inline SVG pie/donut chart slide
  5. All rich element slides export to PNG correctly — no blank areas, no missing chart segments
**Plans:** 2/2 plans executed (awaiting visual verification checkpoint)

Plans:
- [x] 02-01-PLAN.md — Types, element components (List, Stat, BarChart, PieChart), renderElement dispatcher, and Gemini responseSchema extension
- [x] 02-02-PLAN.md — Wire renderElement into all 24 templates + visual verification checkpoint

### Phase 3: User Photo Upload
**Goal**: Users can upload their own photos and use them as full-bleed backgrounds or split-layout images in slides
**Depends on**: Phase 1
**Requirements**: PHOTO-01, PHOTO-02, PHOTO-03, PHOTO-04
**Success Criteria** (what must be TRUE):
  1. User can select a photo file in the web editor and see it appear in a slide preview
  2. A slide with a user photo renders the photo as a full-bleed background with readable text overlay
  3. A slide with a user photo renders in split layout (photo on one half, text on the other)
  4. Exported PNG of a photo slide is identical to the editor preview — photo is not blank or broken
**Plans**: TBD

Plans:
- [ ] 03-01: Supabase Storage setup (user-photos bucket, RLS, signed upload URL endpoint)
- [ ] 03-02: Photo upload UI + client-side base64 conversion + photo slide rendering components

### Phase 4: Content Calendar
**Goal**: Users can generate a 30-day AI content plan, edit it, and launch individual carousel generation from any item in one click
**Depends on**: Phase 1
**Requirements**: PLAN-01, PLAN-02, PLAN-03, PLAN-04, PLAN-05
**Success Criteria** (what must be TRUE):
  1. User can navigate to /content-plan and see the page without errors
  2. User enters a niche/topic and receives a 30-day plan with dates, themes, and post types
  3. User sees the plan as a structured list or grid — each item shows date, topic, and post type
  4. User clicks one item in the plan and a carousel starts generating with that topic pre-filled
  5. User refreshes the page and finds their content plan still there, unchanged
**Plans**: TBD

Plans:
- [ ] 04-01: Supabase `content_plans` table + RLS + generate-plan API route
- [ ] 04-02: /content-plan page UI — plan display, editing, and one-click carousel launch

## Progress

**Execution Order:**
Phase 1 first (schema foundation). Phase 2 and Phase 3 can follow in parallel. Phase 4 is independent after Phase 1.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Layout System | 2/2 | Complete    | 2026-03-19 |
| 2. Rich Elements | 2/2 | Checkpoint |  |
| 3. User Photo Upload | 0/2 | Not started | - |
| 4. Content Calendar | 0/2 | Not started | - |
