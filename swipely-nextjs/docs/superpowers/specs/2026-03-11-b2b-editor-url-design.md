# Spec: B2B API — Hosted Editor URL

**Date:** 2026-03-11
**Status:** Approved

## Problem

After generating a carousel via `/api/v1/generate`, B2B clients have no way to let their end-users edit the result. The `view_url` is read-only. The edit experience only exists inside the authenticated dashboard at `/generate`.

## Goal

Add a public hosted editor at `/editor/[id]` that B2B clients can redirect their users to. No Swipely account required. Users edit slides in the browser and download PNGs. Nothing is saved back to the server.

## Scope

Three changes:

1. **New route `/editor/[id]`** — public hosted editor
2. **`/api/v1/generate` response** — add `edit_url` field
3. **`/viewer/[id]`** — add "Edit" link pointing to `/editor/[id]`

Out of scope: saving edits to DB, auth, B2B PATCH endpoint.

## Architecture

### `/editor/[id]` route

```
app/editor/[id]/
  page.tsx          — server component
  EditorClient.tsx  — client component
```

**`page.tsx`** mirrors `app/viewer/[id]/page.tsx`:
- Creates admin Supabase client
- Queries `generations` by ID: `id, template, format, output_json`
- Returns `notFound()` if missing or empty slides
- Passes `slides`, `template`, `format`, `postCaption`, `generationId` to `EditorClient`

**`EditorClient.tsx`**:
- `"use client"` — holds local `useState` for slides and postCaption
- Renders `CarouselEditor` with the following props:
  - `onUpdateSlide` / `onUpdateCaption` — callbacks that mutate local state only
  - `onClose` — navigates to `https://swipely.ru` (no dashboard to return to)
  - `onChangeTemplate` — no-op `() => {}` stub; template switching is disabled in public editor context
  - `isPro={false}` — public editor does not grant pro template access
- The `TemplateSwitcher` inside `CarouselEditor` will be visible but restricted to free templates via `isPro={false}`
- Download: same as `ViewerClient` — downloads the **current slide only** as a PNG via `html-to-image` `toPng`. No zip, no new dependencies.
- `generationId` prop is used only for the download filename: `slide-${generationId}-${slideIndex + 1}.png`
- Branding: Swipely header + CTA block at bottom (same style as viewer)
- No auth checks, no Supabase writes

### `page.tsx` requirements

Must include `export const dynamic = "force-dynamic"` to prevent static rendering at build time (admin client requires runtime env vars). Supabase select: `id, template, format, output_json, created_at` — mirrors viewer exactly.

### API change (`/api/v1/generate`)

In the response object, add `edit_url` alongside `view_url`:

```json
{
  "generation_id": "uuid",
  "slides": [...],
  "post_caption": "...",
  "view_url": "https://swipely.ru/viewer/<id>",
  "edit_url": "https://swipely.ru/editor/<id>",
  "image_urls": [...]
}
```

One line change: `edit_url: generationId ? \`${APP_URL}/editor/${generationId}\` : null` — placed at top level alongside `view_url`, unconditionally (not inside the `render` spread).

### Viewer change (`/viewer/[id]/ViewerClient.tsx`)

Add a small "Edit" button/link in the actions row pointing to `/editor/${generationId}`. Style: secondary, alongside the existing download button.

## Data Flow

```
B2B client → POST /api/v1/generate
           ← { generation_id, edit_url: "swipely.ru/editor/<id>", ... }

B2B client → redirects end-user to edit_url

End-user  → GET /editor/<id>
           ← page.tsx loads generation from Supabase
           ← EditorClient renders CarouselEditor with local state

End-user edits slides → state updates locally
End-user clicks Download → html-to-image → PNG saved to disk
```

## Security

- Route is public (no auth) — consistent with `/viewer/[id]`
- Generation is identified by UUID — not guessable
- No writes to DB — read-only server side

## Files to Create / Modify

| Action | File |
|--------|------|
| Create | `app/editor/[id]/page.tsx` |
| Create | `app/editor/[id]/EditorClient.tsx` |
| Modify | `app/api/v1/generate/route.ts` — add `edit_url` to response |
| Modify | `app/viewer/[id]/ViewerClient.tsx` — add Edit link |

## Non-Goals

- Saving edits to Supabase
- Auth-gated editor
- Template switching in editor (viewer already has none; keep consistent)
- Photo mode editing
