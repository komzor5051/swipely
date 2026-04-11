# Design: Template-First Flow

**Date**: 2026-03-04
**Status**: Approved

## Problem

Users currently pick a template at step 3 of the generation wizard — after entering text. This reduces engagement: the visual appeal of templates is a key motivator to start creating, but users don't see them until they're already mid-flow.

## Solution

Add a horizontal scrollable template picker directly below the "Создать карусель" CTA banner on the dashboard. Users pick a style first, then are taken to `/generate` with the template pre-selected.

## Design

### Dashboard — TemplatePicker component

Location: directly below the lime CTA banner, above the stats grid.

**Layout:**
```
Выбери стиль                    ← →
[card][card][card][card][card]...
```

**Template card (160×220px):**
- Background: PNG preview image (`/previews/{id}.png`), aspect-ratio 1080/1350
- Bottom strip: template name (white bg)
- Hover state: card lifts via `translate-y-1`
- CTA: "Попробовать →" button appears on hover / always visible on mobile
- PRO-only templates: semi-transparent overlay + lock icon + "PRO" badge

**Navigation:**
- Desktop: left/right arrow buttons
- Mobile: native horizontal scroll (`overflow-x-auto`, `snap-x`)

### Transition to /generate

Clicking any template card: `router.push('/generate?template={id}')`.

### Generate page — URL param reading

On mount, `useSearchParams().get('template')` — if the id exists in the registry, set as `selectedTemplate`. The template step in the wizard remains unchanged; it just starts pre-selected.

## Files Changed

| File | Change |
|------|--------|
| `components/dashboard/TemplatePicker.tsx` | New component — horizontal scrollable template slider |
| `app/(dashboard)/dashboard/page.tsx` | Add `<TemplatePicker>` below the CTA banner (`FadeIn delay={0.08}`) |
| `app/(dashboard)/generate/page.tsx` | Read `?template=` from `useSearchParams` on mount, set `selectedTemplate` |

## Constraints

- No new routes or API changes
- Template registry (`lib/templates/registry.ts`) read-only — no modifications
- PRO-only templates visible but gated (lock overlay) — clicking them still goes to `/generate?template={id}`, generate page handles PRO gate as before
- Existing banenr `href="/generate"` stays unchanged — clicking the banner itself goes to generate without pre-selection
