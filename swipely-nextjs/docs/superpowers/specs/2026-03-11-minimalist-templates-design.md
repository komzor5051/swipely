# Design Spec: Minimalist Templates (4 new)

**Date:** 2026-03-11
**Status:** Approved
**Goal:** Add 4 minimalist/Japanese-inspired carousel templates to expand the public library and improve conversion.

---

## Overview

Add 4 new public templates to `swipely-nextjs`. Each follows the established pattern: one TSX component, one registry entry, one `TEMPLATE_MAP` entry, one preview PNG.

Templates are visually distinct from existing 16 and share a "minimalist" direction — maximum whitespace, typographic hierarchy, no gradient noise.

---

## Templates

### 1. Kinfolk (`kinfolk`)

**Aesthetic:** Editorial magazine. Warm cream background, Playfair Display serif, gold rule, italic accents.
**Tone:** `professional`
**Audience:** Personal brand experts, writers, psychologists, coaches.
**Colors:** `#f7f4ee` background, `#1a1a1a` text, `#c8b89a` gold accent, `#999` muted.
**Fonts:** Playfair Display (title, italic tag, page number) + Inter Light (body, username).
**Layout:**
- Hook: tag top-left → slide number → large title → divider → body → username + page bottom
- Content: same structure, slightly smaller title

### 2. Swiss (`swiss`)

**Aesthetic:** International Typographic Style. White background, strict grid, large slide number, all-caps headers.
**Tone:** `professional`
**Audience:** Business, startup, finance, systems thinkers.
**Colors:** `#ffffff` background, `#000000` text, `#e0e0e0` rule.
**Fonts:** Space Grotesk (all elements, 300–700 weight range).
**Layout:**
- Hook: top bar (label + counter) → 2-column grid (big number left, content right with black accent line) → footer bar
- Content: same 2-column grid

### 3. Wabi (`wabi`)

**Aesthetic:** Japanese wabi-sabi. Warm linen background, asymmetric layout, decorative kanji watermark, brush stroke line.
**Tone:** `friendly`
**Audience:** Mindfulness, wellness, education, personal growth.
**Colors:** `#f0ebe2` background, `#2a2018` text, `#8b7355` brown accent.
**Fonts:** Playfair Display italic (title) + Noto Serif JP (kanji, tag) + Inter Light (body).
**Layout:**
- Hook: ink circle SVG top-right + kanji watermark → content bottom-aligned: tag → brush line → italic title → body → dot progress
- Content: same structure with smaller title

### 4. Nikkei (`nikkei`)

**Aesthetic:** Financial newspaper / data journalism. White, Inter, thin rules, stats prominently placed.
**Tone:** `professional`
**Audience:** Marketers, analysts, educators with data, business cases.
**Colors:** `#ffffff` background, `#000000` text, `#e8e8e8` rules, `#888` muted labels.
**Fonts:** Inter (all elements, 300–700 weight range) + Space Grotesk (brand label, numbers).
**Layout:**
- Hook: header (brand label + date) → thick rule → 2 stat blocks (big number + label) → mid rule → headline → body → footer (progress pips + page)
- Content: header → thick rule → headline (large) → body → footer

---

## Implementation Plan

### Files to create (4)
```
swipely-nextjs/components/slides/templates/KinfolkSlide.tsx
swipely-nextjs/components/slides/templates/SwissSlide.tsx
swipely-nextjs/components/slides/templates/WabiSlide.tsx
swipely-nextjs/components/slides/templates/NikkeiSlide.tsx
```

### Files to modify (3)
```
swipely-nextjs/components/slides/SlideRenderer.tsx   — add 4 imports + TEMPLATE_MAP entries
swipely-nextjs/lib/templates/registry.ts             — add 4 Template objects to templates[]
swipely-nextjs/app/layout.tsx                        — add Noto Serif JP to Google Fonts import (required by Wabi template)
```

### Preview images (4, generated after implementation)
```
swipely-nextjs/public/previews/kinfolk.png
swipely-nextjs/public/previews/swiss.png
swipely-nextjs/public/previews/wabi.png
swipely-nextjs/public/previews/nikkei.png
```

---

## Component Interface

Each component receives `SlideProps`:
```ts
interface SlideProps {
  slide: SlideData;       // { type, title, content, imageUrl? }
  slideNumber: number;
  totalSlides: number;
  format: "square" | "portrait" | "story";
  username?: string;
}
```

Uses utility functions from `../utils`:
- `getSlideDimensions(format)` — returns `{ width, height }` for correct pixel dimensions
- `renderTitle(title, hlStyle)` — renders `<hl>` tags as highlighted spans
- `renderContent(content)` — renders content string
- `scaleContentFontSize(content, base)` — scales font size based on text length

---

## Registry Entries

```ts
{ id: "kinfolk", name: "Kinfolk", nameRu: "Кинфолк", description: "Эдиториальный стиль — кремовый фон, засечки и золотой делитель", preview: "/previews/kinfolk.png", tags: ["светлый", "серифный", "личный"], maxWordsPerSlide: 30, tone: "professional" }
{ id: "swiss",   name: "Swiss",   nameRu: "Швейцарский", description: "Строгая типографская сетка в стиле швейцарской школы", preview: "/previews/swiss.png", tags: ["светлый", "bold", "структурированный"], maxWordsPerSlide: 25, tone: "professional" }
{ id: "wabi",    name: "Wabi",    nameRu: "Ваби-саби", description: "Японский минимализм — тёплый льняной фон и асимметрия", preview: "/previews/wabi.png", tags: ["светлый", "серифный", "личный"], maxWordsPerSlide: 25, tone: "friendly" }
{ id: "nikkei",  name: "Nikkei",  nameRu: "Никкэй", description: "Деловой стиль с крупными цифрами и тонкими линиями", preview: "/previews/nikkei.png", tags: ["светлый", "структурированный", "данные"], maxWordsPerSlide: 30, tone: "professional" }
```

---

## Acceptance Criteria

- All 4 components render without errors in `square`, `portrait`, and `story` formats
- Hook slide (slideNumber === 1) has distinct layout from content slides
- `<hl>` tags in title render as styled highlights
- Components registered in both `TEMPLATE_MAP` and `templates[]`
- Preview PNGs added to `public/previews/`
- No TypeScript errors (`npm run lint` passes)
