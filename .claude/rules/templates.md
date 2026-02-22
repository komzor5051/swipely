---
paths: "**/templates/**/*"
---

# Adding New Templates

New templates must be added to **both** `swipely-bot` and `swipely-nextjs` to stay in sync.

## In swipely-bot

1. Create `src/templates/{name}.html` with `{{TITLE}}`, `{{CONTENT}}`, `{{SLIDE_NUMBER}}` placeholders
2. Handle `<hl>` tags in title — render as visually distinct/highlighted elements
3. Add design preset to `getDesignConfig()` in `src/services/gemini.js`
4. Add mapping in `generateSlideHTML()` in `src/services/renderer.js`
5. Add callback handler for `style_{name}` in `src/index.js`
6. Update `styleDescriptions` in `src/utils/copy.js`
7. Add preview image to `previews/{name}.png`

## In swipely-nextjs

8. Add entry to `lib/templates/registry.ts` (`Template` interface: `id`, `name`, `nameRu`, `description`, `preview`, `tags`, `maxWordsPerSlide`, `tone`)
9. Create React component `components/slides/templates/{Name}Slide.tsx`
10. Register in `SlideRenderer.tsx` `TEMPLATE_MAP`
11. Add design preset to `designPresets` in `app/api/generate/route.ts`

## Notes

- `photo_mode` is special — NOT added to `registry.ts`. It's hardcoded in `generate/page.tsx` and only in `TEMPLATE_MAP` directly.
- Design presets in `gemini.js` and `app/api/generate/route.ts` must mirror each other.
