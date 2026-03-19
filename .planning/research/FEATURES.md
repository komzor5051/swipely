# Feature Landscape: Swipely Milestone 2

**Domain:** AI carousel generator (Instagram/social media)
**Researched:** 2026-03-19
**Scope:** Layout systems, rich elements (infographics/stats/charts), photo upload, content planning

---

## Context: What Swipely Is Now

Current state: 13 React templates, all rendering the same composition (title top, content below). Gemini generates `{ type, title, content }` per slide. No per-slide layout variation within a carousel. Photo mode exists but uses Gemini image generation, not user-uploaded photos.

Milestone 2 adds four capability areas. Research below maps what competitors do and what the market expects.

---

## Area 1: Layout Systems — Per-Slide Variation

### What the market does

**Canva** is template-based: users pick a template, then manually mix and match slide designs. There is no automatic per-slide layout variation — the user decides which layout to apply to each slide. Canva's brand consistency mechanism is color/font continuity across varied layouts.

**aiCarousels, ContentDrips, Predis AI** follow the same pattern: one visual template per carousel, all slides share the same layout. Variation is cosmetic (different background colors per slide), not structural (different compositions).

**Piktochart AI** is the closest to what Milestone 2 aims for: it generates varied slide compositions from a prompt. Each slide can be a different layout type. This is positioned as a differentiator in that market.

**Standard practice (observed across 10+ tools):** carousel tools use one template, consistent layout per carousel. Per-slide layout variation is NOT standard — it is emerging behavior in AI-first tools only.

### Layout types seen in the wild

| Layout Name | Description | Where Seen |
|-------------|-------------|------------|
| Text-center | Title + body centered, solid/gradient bg | Universal — all tools |
| Text-left | Title top, body left-aligned, icon or graphic right | Canva templates, Venngage |
| Quote-center | Large quote mark, centered text, author attribution | Canva, Predis AI |
| Big-number / Stat hero | Giant number (47%, 3x, etc.), small label below | Venngage infographic templates |
| Split (text + image) | Left half text, right half image | Canva photo templates, ContentDrips |
| Full-bleed photo | Photo as full background, text overlay with dark scrim | PostNitro, Canva photo carousels |
| List slide | Numbered or bulleted list with icons, structured grid | Venngage, Piktochart |
| Chart slide | Bar chart or pie chart fills most of the slide area | Venngage, specialized infographic tools |

### Table Stakes vs Differentiating

- **Table stakes**: consistent visual identity across all slides in a carousel (color, font, brand feel)
- **Table stakes**: at minimum 2-3 layout compositions (not just one for all slides)
- **Differentiating**: AI automatically assigns the most appropriate layout to each slide based on its content type — the user never picks manually
- **Differentiating**: 5+ distinct compositions available (quote, big-number, split, list, chart) making each carousel feel like a designed document, not a slideshow

### Swipely's specific constraint

The decision to have AI (Gemini) choose the layout via `layout` field in JSON is correct and aligned with the differentiating pattern. Users should not pick layouts manually — AI decides. This is the right architecture.

Complexity for layout variation: **Medium** (schema extension + new React components per layout type, no fundamental architecture change)

---

## Area 2: Rich Slide Elements — Numbered Lists, Stats, Charts

### What the market does

**Numbered lists in carousels** are the single most common "rich element" pattern. Every carousel tool from Canva to ContentDrips offers numbered step templates. The visual pattern is: large circled number (or plain numeral), item title, short body text per item. Icon next to each item is common but optional.

**Stat/infographic slides** are common in Venngage, Piktochart, and Canva. The dominant visual patterns:
- **Stat hero**: one number takes 60-70% of slide area, label text below it (e.g., "47%" huge, "of users prefer..." small)
- **Comparison stat**: two or three numbers side by side with labels
- **Progress bar**: horizontal bar showing percentage, used for "completion" or "share" type data
- **Icon + number grid**: 4-6 stats arranged in grid, each with icon and number

**Charts**: bar and pie charts appear in Venngage infographics but are rare in Instagram carousel generators specifically. Most carousel tools do NOT include real charts — they are considered too complex and visually dense for mobile swipeable content. Canva has charts but they are used rarely in carousel contexts. The constraint that html2canvas cannot handle Canvas-based chart libraries (Chart.js, Recharts) is real — this is a known issue in the community.

**SVG-based bar charts** are the pragmatic solution: simple, renders correctly in html2canvas, no JS library dependency. This aligns with the decision in PROJECT.md.

### Table Stakes vs Differentiating

- **Table stakes**: numbered list slide type (Steps 1-N format)
- **Table stakes**: one "big stat" slide type
- **Differentiating**: multiple stat patterns (hero, comparison, progress bar, icon grid)
- **Differentiating**: inline charts as native slide type (rare in competitors — most don't do this)
- **Anti-feature to avoid**: complex interactive charts — wrong medium for static PNG export

### Complexity notes

| Element | Complexity | Notes |
|---------|------------|-------|
| Numbered list layout | Low | 1 React component, straightforward rendering |
| Stat hero (big number) | Low | Typography layout, no computation |
| Progress bar | Low | Pure CSS/SVG |
| Comparison stats (2-3 numbers) | Low | Grid layout |
| Bar chart (SVG inline) | Medium | Manual SVG paths or simple `<rect>` elements scaled to data |
| Pie/donut chart (SVG) | Medium-High | SVG arc math required, or use d3 without canvas |

---

## Area 3: Photo Upload UX

### What the market does

**PostNitro** has an explicit "add background image" feature documented in their help center. The UX flow: upload image → it becomes the slide background → text overlays on top with optional dark scrim for readability. This is their primary photo workflow.

**Canva** photo carousel UX: user uploads photo to their media library, drags onto slide, can set as background or position as element. For carousel use, the dominant pattern is split layout (image left/right, text other side) or full-bleed (image fills entire slide).

**ContentDrips/aiCarousels**: brand kit upload (logo, colors, fonts) is standard, but per-slide photo upload as content (not just brand asset) is less prominent. ContentDrips positions photos more as brand identity than per-slide content.

**Common photo upload UX patterns found:**

1. **Upload once, use anywhere** (Canva): Photo goes to a library, user reuses across slides
2. **Slide-specific upload** (PostNitro): Each slide has an upload zone
3. **Carousel-level upload** (most tools): Upload photos for the whole carousel upfront, AI distributes them
4. **Brand kit upload** (ContentDrips, Predis AI): Upload is for logos/brand assets only

**What users expect for photo carousels:**

- Drag-and-drop or click-to-upload (not a hidden menu option)
- Immediate visual preview of photo in slide context
- Background mode: photo fills slide, text overlay with automatic dark scrim
- Split mode: photo takes left or right half, text on other side
- Multiple photos for multi-slide carousel (not just one photo for all slides)
- Ability to reposition/crop photo within its slot

**Photo carousel content types** (what users are making):
- Product showcase (product photo + benefit text)
- Before/after sequences
- Personal brand (face photo + insight/tip)
- Event or lifestyle photography + caption

### Table Stakes vs Differentiating

- **Table stakes**: upload photo, use as full-bleed slide background with text overlay
- **Table stakes**: dark scrim/overlay on photo for text legibility
- **Table stakes**: drag-and-drop upload interface
- **Differentiating**: split layout (photo half + text half) as named slide type
- **Differentiating**: AI assigns uploaded photos to appropriate slides in a multi-photo carousel (e.g., user uploads 5 photos, AI decides which slide uses which)
- **Anti-feature**: manual photo repositioning editor in v1 — adds complexity without critical value for the MVP; defer to later

### Complexity notes

| Feature | Complexity | Notes |
|---------|------------|-------|
| Upload single photo → slide background | Medium | Supabase Storage upload already planned, new slide type |
| Dark scrim overlay | Low | CSS gradient over image |
| Split layout with photo | Medium | New layout component, responsive sizing |
| Multiple photos, one per slide | Medium-High | Upload UX for N photos, mapping to slide array |
| AI assigns photos to slides | High | Gemini multimodal prompt with photo references |
| Crop/reposition tool | High | Out of scope for Milestone 2 |

---

## Area 4: Content Calendar / 30-Day Planning

### What the market does

**Dedicated social media scheduling tools** (Hootsuite, Sprout Social, Buffer, Later) all have content calendars, but they are scheduling-first — you create content, then place it on dates. They do not generate a topic plan from scratch.

**AI content calendar generators** (Taskade, ClickUp Brain, easy-peasy.ai) generate topic lists from a niche/goal prompt. The typical output:
- List of 30 post ideas with date, topic, post type (carousel, reel, single image, story), and a one-line brief
- NOT detailed content — just the plan/outline

**Predis AI** is the closest to what Swipely aims for: it combines content plan generation with carousel generation. You can generate a post idea in the calendar, then click to generate the actual carousel from that idea. This is the most directly relevant competitor pattern.

**What users expect from a 30-day AI content plan:**

1. **Input**: niche/goal description (1-3 sentences). The user should not have to think hard — "I'm a fitness coach" should be enough.
2. **Output**: visible calendar grid or list with one topic per day (or 3-5 posts per week)
3. **Each topic includes**: date, topic title, content type (carousel, tip, quote, etc.), 1-sentence brief
4. **Edit in place**: click a topic to rename it, change date, change type
5. **One-click generate**: from any topic card, click "Generate carousel" → goes to generation page with that topic pre-filled
6. **Save/export**: the plan persists in the user's account, not just a one-time generation
7. **Regenerate single item**: change one topic without regenerating the whole plan

**What users do NOT need in v1:**
- Publishing/scheduling to Instagram (requires Instagram API integration — huge complexity)
- Analytics or post performance tracking
- Team collaboration on the calendar
- Hashtag suggestions (can be added to carousel generation prompt, not calendar)

### Standard vs Differentiating in this space

- **Table stakes (for a "content plan" feature)**: 30-day output with topic + date + type, editable, persistable
- **Table stakes**: one-click to generate carousel from a calendar topic
- **Differentiating**: AI researches niche trends before generating the plan (vs just random generic topics)
- **Differentiating**: variety scoring — AI ensures the plan has a mix of types (educational, promotional, personal, entertaining) rather than 30 identical educational carousels
- **Anti-feature**: Instagram direct publish in v1 — requires Meta app review, significant compliance overhead, out of scope

### UX pattern that works

The minimal viable UX for this feature:

1. `/content-plan` page with empty state → "Generate my 30-day plan" button
2. Niche input field (textarea, 200 char max)
3. AI generates → calendar view (month grid or simple list) appears
4. Each card shows: day number, topic title, content type badge
5. Click card → inline edit
6. "Generate carousel" button on each card → navigates to `/generate?topic=[encoded topic]`
7. Completed carousels show a checkmark on the calendar card

### Complexity notes

| Feature | Complexity | Notes |
|---------|------------|-------|
| Niche input → AI generates 30 topics | Low | Single Gemini call with structured JSON output |
| Calendar/list display of topics | Low | Date array display, no complex calendar lib needed |
| Inline topic editing | Low | Controlled input component |
| Persist plan in Supabase | Low | Single `content_plans` table as planned in PROJECT.md |
| Link to generate from topic | Low | URL params to pre-fill existing `/generate` page |
| Regenerate single topic | Medium | Partial plan update, save to DB |
| Variety/type distribution in plan | Low | Prompt engineering — instruct Gemini on mix |
| Instagram publishing | Very High | Out of scope entirely |

---

## Table Stakes Summary

Features that must exist or users will perceive the product as incomplete/cheap:

| Feature | Why Expected | Complexity |
|---------|--------------|------------|
| Per-slide layout variation (at least 2-3 layouts) | Single-layout carousels look amateurish after Canva trained users | Medium |
| Numbered list slide type | Most common carousel format in the wild | Low |
| Big-number / stat hero slide type | Common in educational/expert content | Low |
| Full-bleed photo background with text overlay | Standard photo carousel format everywhere | Medium |
| Content plan persists in account | Users expect saved plans, not one-time generation | Low |
| One-click from plan to generate | Core workflow — plan is useless without easy generation | Low |

---

## Differentiators Summary

Features that are NOT expected but create competitive advantage:

| Feature | Value Proposition | Complexity |
|---------|-------------------|------------|
| AI chooses layout per slide automatically | No other carousel generator does this — all use one layout | Medium |
| 5+ distinct layout compositions | More visual variety than any competitor in AI-first tools | Medium (additive) |
| SVG charts as native slide type | No competitor in the AI carousel space does inline charts | Medium |
| Progress bar / comparison stat patterns | Infographic-quality output without leaving the tool | Low |
| Content plan with variety enforcement | Most generators produce repetitive plans; type distribution is rare | Low (prompt eng.) |
| Split photo layout (photo + text half) | More editorial than basic full-bleed | Medium |

---

## Anti-Features

Features to deliberately NOT build in Milestone 2:

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Manual layout picker per slide | Users shouldn't need to understand layout names; defeats AI-first promise | Let AI assign via `layout` field in JSON |
| Drag-and-drop photo repositioning | Complex editor, high effort, not critical for MVP | Basic crop on upload (browser-side) is sufficient |
| Instagram direct publishing | Requires Meta app review, OAuth, complex API integration, compliance | External scheduling tools (Later, Buffer) — mention in docs |
| Animated slides / video export | Wrong render architecture (html2canvas is static PNG) | Separate product consideration |
| Chart.js / Recharts integration | html2canvas cannot capture Canvas-based renders | SVG-only charts (inline `<svg>`) |
| Complex photo editing (filters, adjustments) | Wrong scope — this is a content tool, not Lightroom | Simple brightness overlay CSS only |
| Real-time collaboration on content plan | Multi-user complexity, not in user need for solo creators | Single-user plan, no sharing |
| Hashtag research in content plan | Separate concern; adds AI call overhead | Hashtag suggestions belong in carousel generation, not planning |

---

## Feature Dependencies

```
Rich layouts (layout field in JSON)
  → Requires: Gemini prompt update to assign layout per slide
  → Requires: New React components per layout type
  → Enables: Big-number layout, Quote layout, Split layout

Photo upload → Supabase Storage
  → Requires: Upload API route
  → Enables: Photo-as-background slide type
  → Enables: Split photo layout
  → Enables: (future) AI photo assignment across slides

Content plan → Supabase content_plans table
  → Requires: New DB table + RLS
  → Enables: Persistent 30-day plan
  → Enables: One-click generate (reuses existing /api/generate)

SVG charts
  → Requires: Structured data in slide JSON (bar: [{label, value}])
  → Requires: New React SVG chart components
  → Independent of photo upload or layout system
```

---

## MVP Recommendation

**Phase 1 (highest ROI, lowest complexity):**
1. Layout variation: add `layout` field to JSON schema, build 4 layout components (text-center existing, text-left, quote, big-number)
2. Numbered list element: `elements: [{type: "list", items: [...]}]` schema + ListSlide component
3. Stat hero element: `elements: [{type: "stat", value: "47%", label: "..."}]` + StatSlide component
4. Content plan: niche input → Gemini → 30 topics JSON → display + persist → link to generate

**Phase 2 (after Phase 1 validated):**
5. Photo upload → full-bleed background slide
6. Split layout (photo + text)
7. Progress bar element
8. SVG bar chart slide type

**Defer:**
- Pie chart (arc math overhead vs value)
- Multi-photo carousel (AI photo assignment to slides)
- Content plan variety enforcement (can add via prompt update later)

---

## Sources

- [aiCarousels — Best AI Carousel Generator Tools](https://www.aicarousels.com/blog/best-ai-carousel-generator) — LOW confidence (couldn't fetch full page)
- [PostNitro — How to add a background image to a carousel slide](https://postnitro.ai/docs/how-to/set-background-image/add-new) — MEDIUM confidence
- [Venngage — 15+ Instagram Carousel Templates + Design Tips](https://venngage.com/blog/instagram-carousel-template/) — MEDIUM confidence
- [Predis AI — 10 Top Tools to Design Instagram Carousels in 2025](https://predis.ai/resources/instagram-carousel-design-tool/) — MEDIUM confidence
- [Hootsuite — How to make the most of Instagram carousels in 2025](https://blog.hootsuite.com/instagram-carousel/) — MEDIUM confidence
- [ContentDrips Review 2025](https://skywork.ai/skypage/en/Contentdrips-Review-2025-My-Deep-Dive-into-the-AI-Content-Engine/1975064184470171648) — LOW confidence (secondary review)
- [Venngage — 9 Types of Infographics](https://venngage.com/blog/9-types-of-infographic-template/) — HIGH confidence (official Venngage content)
- [Piktochart — Visual Hierarchy](https://piktochart.com/blog/visual-hierarchy/) — HIGH confidence (official Piktochart content)
- [RankYak — 15 Best AI Content Calendar Generators](https://rankyak.com/blog/ai-content-calendar) — LOW confidence (review aggregator)
- [Metricool — Best Practices for Instagram Carousel Posts 2026](https://metricool.com/instagram-carousels/) — MEDIUM confidence

*Overall confidence: MEDIUM — competitive landscape verified across multiple sources; specific feature implementation details rely on secondary reviews and search results rather than direct tool access.*
