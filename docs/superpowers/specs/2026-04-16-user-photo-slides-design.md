# Design: User Photo on Carousel Slides

**Date:** 2026-04-16  
**Status:** Approved  
**Scope:** Phase 1 — dedicated photo-split templates; Phase 2 — modifier for existing templates

---

## Problem

Users want to embed their own photos into carousel slides. Reference: wedding/event playlist carousels where each slide is split — ~52% photo zone + ~48% text zone. This creates personal, high-engagement content that looks nothing like generic AI carousels.

Currently Swipely has Photo Mode (Gemini AI-generated images) but no way to use user-owned photos in slides.

---

## Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| Layout | Vertical split: photo top or bottom | Matches user's references, works on portrait 1080×1350 |
| Photo position | Per-slide toggle (top/bottom) | Users mix positions for visual variety across slides |
| Scope per slide | Every slide gets a photo zone | Simpler UX — no "enable per slide" toggle needed |
| Photo assignment | Different photo per slide | Users have event/story carousels needing varied photos |
| Upload timing | blob URL for preview → Supabase Storage at export | Instant preview UX, no premature upload |
| Phase order | New photo-split templates first, existing template modifier second | Isolated, shippable, testable |

---

## Architecture

### Data Model Extension

`components/slides/types.ts` — extend `SlideData`:

```typescript
export interface SlideData {
  type: string;
  title: string;
  content: string;
  layout?: SlideLayout;
  element?: SlideElement;
  imageUrl?: string;          // existing: AI-generated photo (Photo Mode)
  userPhotoUrl?: string;      // NEW: Supabase Storage public URL (used at export/render)
  userPhotoBlobUrl?: string;  // NEW: blob URL for UI preview only — NOT sent to API
  userPhotoPosition?: "top" | "bottom"; // NEW: split position, default "top"
}
```

`userPhotoBlobUrl` is UI-only state (revoked after session, never serialized to API).  
`userPhotoUrl` is set only at export time after Supabase Storage upload.

---

## Phase 1: New Photo-Split Templates

### 1.1 Template Files

Create 2 new templates. Each template handles both `userPhotoBlobUrl` (preview) and `userPhotoUrl` (render/export) — prefers blob when available.

**Template A — `photo_split_light`**  
Light background (#F5F3EE), Inter font, clean sans-serif. Warm paper aesthetic.

**Template B — `photo_split_dark`**  
Dark background (#111), white text, monochrome accent. Editorial/magazine aesthetic.

Each template requires:
- `swipely-nextjs/components/slides/templates/PhotoSplitLightSlide.tsx`
- `swipely-nextjs/components/slides/templates/PhotoSplitDarkSlide.tsx`
- `swipely-bot/src/templates/photo_split_light.html` (Puppeteer)
- `swipely-bot/src/templates/photo_split_dark.html` (Puppeteer)

### 1.2 Template Structure (TSX)

Each `PhotoSplitXxxSlide` renders:

```
┌──────────────────────────────┐
│  PHOTO ZONE (52%)            │  ← background-image: userPhotoBlobUrl || userPhotoUrl
│  object-fit: cover           │     If neither → placeholder with upload prompt
│  position: relative          │
│  [slide counter top-right]   │
└──────────────────────────────┘
┌──────────────────────────────┐
│  TEXT ZONE (48%)             │
│  title (bold, large)         │
│  content (list or paragraph) │
│  [username bottom-right]     │
└──────────────────────────────┘
```

When `userPhotoPosition === "bottom"`, zones flip.

If no photo uploaded: full-height text layout (no empty photo zone visible).

### 1.3 HTML Templates for Puppeteer

`photo_split_light.html` and `photo_split_dark.html` add new placeholders:

```
{{PHOTO_URL}}       — Supabase Storage public URL
{{PHOTO_POSITION}}  — "top" | "bottom"
```

Photo zone: `<div style="background-image: url('{{PHOTO_URL}}'); background-size: cover; background-position: center; height: 702px;">` (52% of 1350px).

If `{{PHOTO_URL}}` is empty string, template hides photo zone and expands text zone to full height.

### 1.4 Template Registry

`swipely-nextjs/lib/templates/registry.ts` — add:

```typescript
{
  id: "photo_split_light",
  name: "Photo Split Light",
  nameRu: "Фото-сплит Светлый",
  description: "Вертикальный сплит: ваше фото + текст. Светлый фон.",
  preview: "/previews/photo_split_light.png",
  tags: ["фото", "сплит", "светлый"],
  maxWordsPerSlide: 30,
  tone: "friendly",
  supportsUserPhoto: true,   // NEW flag
  startOnly: true,
},
{
  id: "photo_split_dark",
  name: "Photo Split Dark",
  nameRu: "Фото-сплит Тёмный",
  description: "Вертикальный сплит: ваше фото + текст. Тёмный фон.",
  preview: "/previews/photo_split_dark.png",
  tags: ["фото", "сплит", "тёмный"],
  maxWordsPerSlide: 30,
  tone: "professional",
  supportsUserPhoto: true,
  startOnly: true,
},
```

Add `supportsUserPhoto?: boolean` to `Template` interface.

### 1.5 UI: Photo Upload on Result Screen

**Location:** `swipely-nextjs/app/(dashboard)/generate/page.tsx`

When selected template has `supportsUserPhoto === true`, each slide card shows a photo zone:

- If no photo: dashed border zone with `+` icon and text "Добавить фото"
- If photo uploaded: photo preview fills zone with a `×` remove button (top-right) and `↕` position toggle (top/bottom)
- Click on zone → opens `<input type="file" accept="image/jpeg,image/png,image/webp">`
- Max file size: 10 MB (already defined in page.tsx as `MAX_FILE_SIZE`)
- On file select: `URL.createObjectURL(file)` → store as `slide.userPhotoBlobUrl`

**State change in `page.tsx`:**

```typescript
// Per-slide photo state
const [slidePhotos, setSlidePhotos] = useState<Record<number, {
  blobUrl: string;
  file: File;
  position: "top" | "bottom";
}>>({});
```

When building result slides for display, merge: `slide.userPhotoBlobUrl = slidePhotos[i]?.blobUrl`.

### 1.6 Export Flow (Supabase Storage Upload)

**Trigger:** User clicks "Скачать" / export button.

**New API route:** `POST /api/photos/upload`

```typescript
// Input: FormData with file
// Auth: requires session
// Output: { url: string }  — Supabase Storage public URL
// Storage bucket: "user-photos" (public bucket, files prefixed by user_id/uuid)
```

**Export sequence in `ExportPanel`:**

1. For each slide with `slidePhotos[i]`, upload `slidePhotos[i].file` via `/api/photos/upload`
2. Receive `userPhotoUrl` per slide
3. Pass enriched slides to existing export/render API (Puppeteer or html2canvas)
4. On success: revoke blob URLs (`URL.revokeObjectURL`)

**Supabase Storage bucket:** `user-photos` — public, with path `{user_id}/{uuid}.{ext}`.  
Add bucket creation to `supabase_migration.sql`.

### 1.7 Puppeteer Rendering (swipely-bot)

In `swipely-bot/src/services/renderer.js`, template rendering function:

- Add `{{PHOTO_URL}}` and `{{PHOTO_POSITION}}` to the placeholder substitution map
- If `photoUrl` is absent, pass empty string (template handles graceful fallback)

In Next.js export API (if using server-side Puppeteer): pass `userPhotoUrl` from slide data into template HTML string before rendering.

---

## Phase 2: Photo Modifier for Existing Templates (future)

After Phase 1 ships and is validated:

**Approach:** `PhotoSplitWrapper` HOC.

```typescript
// components/slides/PhotoSplitWrapper.tsx
// Wraps any SlideComponent and overlays a split layout when userPhotoUrl/userPhotoBlobUrl is set.
// The wrapped template renders into the text zone (bottom 48%).
// Photo zone (top 52%) is rendered by the wrapper.
```

**Template registry:** Add `supportsUserPhoto: true` to existing templates one by one (starting with popular ones: `swipely`, `newspaper`, `chapter`, `kinfolk`).

**No changes to individual template TSX files** — wrapper handles the split at render time.

---

## Pricing

- Photo-split templates: `startOnly: true` (Start tier and above)
- Upload functionality gated behind Start tier check in `/api/photos/upload`
- Free tier users see the templates in the picker but get a paywall on photo upload

---

## File Checklist

### Phase 1 — New files
- [ ] `components/slides/templates/PhotoSplitLightSlide.tsx`
- [ ] `components/slides/templates/PhotoSplitDarkSlide.tsx`
- [ ] `swipely-bot/src/templates/photo_split_light.html`
- [ ] `swipely-bot/src/templates/photo_split_dark.html`
- [ ] `app/api/photos/upload/route.ts`
- [ ] `public/previews/photo_split_light.png`
- [ ] `public/previews/photo_split_dark.png`

### Phase 1 — Modified files
- [ ] `components/slides/types.ts` — add `userPhotoUrl`, `userPhotoBlobUrl`, `userPhotoPosition`
- [ ] `components/slides/SlideRenderer.tsx` — register new templates
- [ ] `lib/templates/registry.ts` — add templates + `supportsUserPhoto` to `Template` interface
- [ ] `app/(dashboard)/generate/page.tsx` — `slidePhotos` state, photo upload UI, export enrichment
- [ ] `components/generate/ExportPanel.tsx` — upload photos before render
- [ ] `supabase_migration.sql` — `user-photos` bucket creation

### Phase 2 — New files
- [ ] `components/slides/PhotoSplitWrapper.tsx`

---

## Out of Scope

- AI-generated image editing or combination with user photo
- Photo cropping/repositioning UI (object-fit: cover handles automatic centering)
- Video support
- Photo reuse across carousel sessions (no photo library)
