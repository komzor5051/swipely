# Newspaper Template Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add "The Daily" newspaper-style slide template to swipely-nextjs.

**Architecture:** New `NewspaperSlide.tsx` component following the same pattern as `ChapterSlide.tsx` — inline styles, Google Fonts via `@import`, hook slide + content slides. Registered in `SlideRenderer.tsx` TEMPLATE_MAP and `registry.ts`. Preview PNG generated via Puppeteer from HTML mockup.

**Tech Stack:** React, TypeScript, Puppeteer (swipely-bot/node_modules), Next.js public/previews

---

### Task 1: Create NewspaperSlide.tsx

**Files:**
- Create: `swipely-nextjs/components/slides/templates/NewspaperSlide.tsx`

Fonts: `Playfair Display:wght@700;900` + `Lora:ital,wght@0,400;1,400` + `Barlow+Condensed:wght@400;600`

Design tokens:
- Background: `#FAFAF8`
- Text: `#0A0A0A`
- Content text: `#1A1A1A`
- Accent (hl): `#CC0000` + italic
- Rule thick: 4px solid `#0A0A0A`
- Rule thin: 1px solid `#0A0A0A`
- Meta color: `#888888`

Hook slide structure:
1. Masthead row: "THE DAILY" (Playfair 900, 32px, letter-spacing 6px) + meta "Выпуск № N / Total  ·  2026" (Barlow Condensed, 18px, #888)
2. Rule 4px
3. Rule 1px (gap 18px between rules)
4. Headline: Playfair Display 900, 112px, line-height 0.95, uppercase, flex: 1, centered vertically
5. Rule 1.5px (margin 52px top+bottom)
6. Content: Lora 400, 38px, line-height 1.65
7. Slide number bottom-right (absolute): Barlow Condensed, 18px, #BBBBBB

Content slides (2+):
- Same masthead + double rule
- Headline: 88px (slightly smaller)
- Same rule + content structure
- Slide number bottom-right

### Task 2: Register in SlideRenderer and registry

**Files:**
- Modify: `swipely-nextjs/components/slides/SlideRenderer.tsx`
- Modify: `swipely-nextjs/lib/templates/registry.ts`

In `SlideRenderer.tsx`:
- Add import: `import NewspaperSlide from "./templates/NewspaperSlide";`
- Add to TEMPLATE_MAP: `newspaper: NewspaperSlide,`

In `registry.ts`, add to templates array:
```ts
{
  id: "newspaper",
  name: "Newspaper",
  nameRu: "Газета",
  description: "Классический газетный стиль — Playfair Display, красные выделения, чёрно-белая строгость",
  preview: "/previews/newspaper.png",
  tags: ["светлый", "серифный", "эдиториал"],
  maxWordsPerSlide: 30,
  tone: "professional",
  proOnly: true,
},
```

### Task 3: Generate preview PNG

Use Puppeteer (from `../swipely-bot/node_modules/puppeteer`) to render the HTML preview at 1080x1350 (portrait) and save to `swipely-nextjs/public/previews/newspaper.png`.

HTML file already exists at `brand-templates/preview-newspaper.html` — update its body to 1080×1350, then render.

### Task 4: Visual QA

Open `http://localhost:3000` dev server, navigate to dashboard, verify:
- Template card shows correct preview image
- No PRO lock badge visible for PRO users (already fixed)
- Clicking navigates to `/generate?template=newspaper`
- Slides render correctly with hook + content slides

### Task 5: Commit and push

```bash
cd swipely-nextjs
git add components/slides/templates/NewspaperSlide.tsx \
        components/slides/SlideRenderer.tsx \
        lib/templates/registry.ts \
        public/previews/newspaper.png
git commit -m "feat(templates): add Newspaper / The Daily template"
git push origin main
```
