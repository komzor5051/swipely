# User Photo Upload — Design

**Date**: 2026-03-05
**Status**: Approved

## Summary

Add an optional photo upload block to the Standard mode form step. PRO-only. User uploads their own photos which are used as slide backgrounds. AI generates text based on the user's topic as usual. Template selection step is skipped when photos are uploaded.

## User Flow

```
Without photos:  form → template → generating → result  (existing)
With photos:     form → generating → result              (template step skipped)
```

## Key Decisions

- **Storage**: `URL.createObjectURL(file)` — objectURLs in browser memory, no server upload, no Supabase Storage
- **Template**: Hardcoded `photo_mode` when photos are uploaded. `PhotoSlide` already handles `imageUrl` + text overlay.
- **Missing photos**: If user uploads fewer photos than slides, remaining slides render on dark background (PhotoSlide already handles `imageUrl: undefined` gracefully)
- **Access**: PRO-only. Non-PRO users don't see the block.

## Photo Distribution Logic

```
uploadedPhotos = [p1, p2, p3], slideCount = 7
→ slides[0].imageUrl = p1
→ slides[1].imageUrl = p2
→ slides[2].imageUrl = p3
→ slides[3..6].imageUrl = undefined  (dark gradient fallback in PhotoSlide)
```

## UI — Photo Upload Block (form step, PRO only)

```
┌─────────────────────────────────────────────┐
│ 📷 Свои фото   [PRO]                        │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │   ↑  Перетащи или выбери фото       │    │
│  │      до 12 файлов · JPG, PNG, WEBP  │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [img1] [img2] [img3] [×] [×] [×]           │
│                                             │
│  ℹ 3 из 5 слайдов получат фото,            │
│    остальные — тёмный фон                  │
└─────────────────────────────────────────────┘
```

- Drag & drop + click to select
- `<input type="file" multiple accept="image/*">`
- Max 12 files (matching max slide count)
- Thumbnails with remove (×) button per photo
- Info hint when photo count < slide count (non-blocking)
- Block is fully optional — without photos, generation works as before

## What Changes

### `app/(dashboard)/generate/page.tsx`
- Add `uploadedPhotos: string[]` state (objectURLs)
- Add photo upload UI to form step (PRO-only)
- Skip template step when `uploadedPhotos.length > 0`
- After generation: map slides to include `imageUrl: uploadedPhotos[i] ?? undefined`
- Force `template = "photo_mode"` when photos uploaded

### No changes needed
- `/api/generate` — generates text as usual
- `PhotoSlide` — already handles imageUrl + dark fallback
- `CarouselEditor` — works as-is
- Export (`html-to-image`) — objectURLs work fine

## Out of Scope
- Uploading photos to Supabase Storage
- AI analysis of photo content (Gemini Vision)
- Per-slide photo reordering (drag-and-drop of photo thumbnails)
- Free tier access
