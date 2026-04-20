# User Photo Slides — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two new photo-split carousel templates (`photo_split_light`, `photo_split_dark`) that display a user-uploaded photo in the top/bottom 52% of each slide, with a per-slide upload UI in the result editor.

**Architecture:** Per-slide blob URL state in `generate/page.tsx` → merged into display slides for `SlideRenderer` preview → `ExportPanel` renders with blob URLs directly (html-to-image works same-origin) → background Supabase Storage upload post-export for persistence.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4, Supabase Storage, html-to-image (client-side PNG export), Puppeteer (swipely-bot server-side export).

---

## File Map

| Action | Path |
|--------|------|
| Modify | `swipely-nextjs/components/slides/types.ts` |
| Modify | `swipely-nextjs/lib/templates/registry.ts` |
| Create | `swipely-nextjs/components/slides/templates/PhotoSplitLightSlide.tsx` |
| Create | `swipely-nextjs/components/slides/templates/PhotoSplitDarkSlide.tsx` |
| Modify | `swipely-nextjs/components/slides/SlideRenderer.tsx` |
| Create | `swipely-nextjs/app/api/photos/upload/route.ts` |
| Modify | `swipely-nextjs/supabase-migration.sql` |
| Modify | `swipely-nextjs/app/(dashboard)/generate/page.tsx` |
| Modify | `swipely-nextjs/components/generate/ExportPanel.tsx` |
| Create | `swipely-nextjs/scripts/gen-preview-photo-split.mjs` |
| Create | `swipely-bot/src/templates/photo_split_light.html` |
| Create | `swipely-bot/src/templates/photo_split_dark.html` |
| Modify | `swipely-bot/src/services/renderer.js` |

---

## Task 1: Extend SlideData type and Template interface

**Files:**
- Modify: `swipely-nextjs/components/slides/types.ts`
- Modify: `swipely-nextjs/lib/templates/registry.ts`

- [ ] **Step 1: Add three fields to SlideData in types.ts**

Open `swipely-nextjs/components/slides/types.ts` and replace the `SlideData` interface:

```typescript
export interface SlideData {
  type: string;
  title: string; // May contain <hl>keyword</hl> tags for keyword highlighting
  content: string;
  layout?: SlideLayout;
  element?: SlideElement;
  imageUrl?: string; // base64 data URL for Photo Mode
  userPhotoUrl?: string;      // Supabase Storage public URL (used at export time)
  userPhotoBlobUrl?: string;  // blob URL for UI preview only — NOT sent to API
  userPhotoPosition?: "top" | "bottom"; // split position, default "top"
}
```

- [ ] **Step 2: Add supportsUserPhoto to Template interface in registry.ts**

Open `swipely-nextjs/lib/templates/registry.ts`. Replace the `Template` interface:

```typescript
export interface Template {
  id: string;
  name: string;
  nameRu: string;
  description: string;
  preview: string;
  tags: string[];
  maxWordsPerSlide: number;
  tone: string;
  startOnly?: boolean;    // requires "start" tier or above
  proOnly?: boolean;      // requires "pro" or "creator" tier
  tenantId?: string;      // tenant-scoped custom template (API v1)
  tenantOnly?: boolean;   // hide from public UI — only accessible via API/tenant
  supportsUserPhoto?: boolean; // template supports per-slide user photo upload
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd swipely-nextjs && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors about SlideData or Template.

- [ ] **Step 4: Commit**

```bash
cd swipely-nextjs && git add components/slides/types.ts lib/templates/registry.ts
git commit -m "feat: extend SlideData with userPhoto fields, Template with supportsUserPhoto"
```

---

## Task 2: Create PhotoSplitLightSlide.tsx

**Files:**
- Create: `swipely-nextjs/components/slides/templates/PhotoSplitLightSlide.tsx`

- [ ] **Step 1: Create the file**

Create `swipely-nextjs/components/slides/templates/PhotoSplitLightSlide.tsx`:

```tsx
"use client";

import React from "react";
import type { SlideProps } from "../types";
import { renderTitle, renderContent, getSlideDimensions } from "../utils";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`;

export default function PhotoSplitLightSlide({
  slide,
  slideNumber,
  totalSlides,
  format,
  username,
}: SlideProps) {
  const { width, height } = getSlideDimensions(format);
  const photoZoneH = Math.round(height * 0.52);
  const textZoneH = height - photoZoneH;

  const photoUrl = slide.userPhotoBlobUrl ?? slide.userPhotoUrl;
  const photoOnTop = (slide.userPhotoPosition ?? "top") === "top";
  const hasPhoto = !!photoUrl;

  const titleLength = (slide.title || "").length;
  let titleSize = 64;
  if (titleLength <= 20) titleSize = 84;
  else if (titleLength <= 35) titleSize = 72;
  else if (titleLength <= 50) titleSize = 60;
  else if (titleLength <= 70) titleSize = 52;
  else titleSize = 44;

  const highlightStyle: React.CSSProperties = {
    display: "inline",
    color: "#7C5C3E",
  };

  const photoZone = (
    <div
      style={{
        width,
        height: photoZoneH,
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
        backgroundImage: `url('${photoUrl}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 28,
          right: 32,
          fontFamily: "'Inter', sans-serif",
          fontSize: 20,
          fontWeight: 600,
          color: "#fff",
          background: "rgba(0,0,0,0.45)",
          padding: "6px 16px",
          borderRadius: 100,
        }}
      >
        {slideNumber}/{totalSlides}
      </div>
    </div>
  );

  const textZone = (
    <div
      style={{
        width,
        height: hasPhoto ? textZoneH : height,
        flexShrink: 0,
        background: "#F5F3EE",
        boxSizing: "border-box",
        padding: hasPhoto ? "44px 56px" : "80px 56px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {/* Slide counter when no photo */}
      {!hasPhoto && (
        <div
          style={{
            position: "absolute",
            top: 32,
            right: 40,
            fontFamily: "'Inter', sans-serif",
            fontSize: 20,
            fontWeight: 600,
            color: "#C4BFB6",
          }}
        >
          {slideNumber}/{totalSlides}
        </div>
      )}

      <h2
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: titleSize,
          fontWeight: 800,
          color: "#1A1A18",
          lineHeight: 1.1,
          letterSpacing: -1.5,
          margin: 0,
          marginBottom: slide.content ? 28 : 0,
          wordWrap: "break-word",
          overflowWrap: "anywhere",
        }}
      >
        {renderTitle(slide.title, highlightStyle)}
      </h2>

      {slide.content && (
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 28,
            fontWeight: 400,
            color: "#5E5B54",
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          {renderContent(slide.content)}
        </p>
      )}

      {username && (
        <div
          style={{
            position: "absolute",
            bottom: 28,
            right: 40,
            fontFamily: "'Inter', sans-serif",
            fontSize: 18,
            fontWeight: 600,
            color: "#B0A89C",
            letterSpacing: 0.2,
          }}
        >
          @{username}
        </div>
      )}
    </div>
  );

  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{FONTS}</style>
      {hasPhoto ? (
        photoOnTop ? (
          <>
            {photoZone}
            {textZone}
          </>
        ) : (
          <>
            {textZone}
            {photoZone}
          </>
        )
      ) : (
        textZone
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd swipely-nextjs && npx tsc --noEmit 2>&1 | grep PhotoSplitLight
```

Expected: no output (no errors).

- [ ] **Step 3: Commit**

```bash
cd swipely-nextjs && git add components/slides/templates/PhotoSplitLightSlide.tsx
git commit -m "feat: add PhotoSplitLightSlide template component"
```

---

## Task 3: Create PhotoSplitDarkSlide.tsx

**Files:**
- Create: `swipely-nextjs/components/slides/templates/PhotoSplitDarkSlide.tsx`

- [ ] **Step 1: Create the file**

Create `swipely-nextjs/components/slides/templates/PhotoSplitDarkSlide.tsx`:

```tsx
"use client";

import React from "react";
import type { SlideProps } from "../types";
import { renderTitle, renderContent, getSlideDimensions } from "../utils";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`;

export default function PhotoSplitDarkSlide({
  slide,
  slideNumber,
  totalSlides,
  format,
  username,
}: SlideProps) {
  const { width, height } = getSlideDimensions(format);
  const photoZoneH = Math.round(height * 0.52);
  const textZoneH = height - photoZoneH;

  const photoUrl = slide.userPhotoBlobUrl ?? slide.userPhotoUrl;
  const photoOnTop = (slide.userPhotoPosition ?? "top") === "top";
  const hasPhoto = !!photoUrl;

  const titleLength = (slide.title || "").length;
  let titleSize = 64;
  if (titleLength <= 20) titleSize = 84;
  else if (titleLength <= 35) titleSize = 72;
  else if (titleLength <= 50) titleSize = 60;
  else if (titleLength <= 70) titleSize = 52;
  else titleSize = 44;

  const highlightStyle: React.CSSProperties = {
    display: "inline",
    color: "#D4F542",
  };

  const photoZone = (
    <div
      style={{
        width,
        height: photoZoneH,
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
        backgroundImage: `url('${photoUrl}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 28,
          right: 32,
          fontFamily: "'Inter', sans-serif",
          fontSize: 20,
          fontWeight: 600,
          color: "#fff",
          background: "rgba(0,0,0,0.55)",
          padding: "6px 16px",
          borderRadius: 100,
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        {slideNumber}/{totalSlides}
      </div>
    </div>
  );

  const textZone = (
    <div
      style={{
        width,
        height: hasPhoto ? textZoneH : height,
        flexShrink: 0,
        background: "#111111",
        boxSizing: "border-box",
        padding: hasPhoto ? "44px 56px" : "80px 56px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {!hasPhoto && (
        <div
          style={{
            position: "absolute",
            top: 32,
            right: 40,
            fontFamily: "'Inter', sans-serif",
            fontSize: 20,
            fontWeight: 600,
            color: "#333",
          }}
        >
          {slideNumber}/{totalSlides}
        </div>
      )}

      <h2
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: titleSize,
          fontWeight: 800,
          color: "#F0F0F0",
          lineHeight: 1.1,
          letterSpacing: -1.5,
          margin: 0,
          marginBottom: slide.content ? 28 : 0,
          wordWrap: "break-word",
          overflowWrap: "anywhere",
        }}
      >
        {renderTitle(slide.title, highlightStyle)}
      </h2>

      {slide.content && (
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 28,
            fontWeight: 400,
            color: "#888888",
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          {renderContent(slide.content)}
        </p>
      )}

      {username && (
        <div
          style={{
            position: "absolute",
            bottom: 28,
            right: 40,
            fontFamily: "'Inter', sans-serif",
            fontSize: 18,
            fontWeight: 600,
            color: "#3A3A3A",
            letterSpacing: 0.2,
          }}
        >
          @{username}
        </div>
      )}
    </div>
  );

  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{FONTS}</style>
      {hasPhoto ? (
        photoOnTop ? (
          <>
            {photoZone}
            {textZone}
          </>
        ) : (
          <>
            {textZone}
            {photoZone}
          </>
        )
      ) : (
        textZone
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd swipely-nextjs && npx tsc --noEmit 2>&1 | grep PhotoSplitDark
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd swipely-nextjs && git add components/slides/templates/PhotoSplitDarkSlide.tsx
git commit -m "feat: add PhotoSplitDarkSlide template component"
```

---

## Task 4: Register templates in SlideRenderer and registry

**Files:**
- Modify: `swipely-nextjs/components/slides/SlideRenderer.tsx`
- Modify: `swipely-nextjs/lib/templates/registry.ts`

- [ ] **Step 1: Add imports to SlideRenderer.tsx**

In `swipely-nextjs/components/slides/SlideRenderer.tsx`, add two import lines after the existing template imports (before `const TEMPLATE_MAP`):

```typescript
import PhotoSplitLightSlide from "./templates/PhotoSplitLightSlide";
import PhotoSplitDarkSlide from "./templates/PhotoSplitDarkSlide";
```

- [ ] **Step 2: Add entries to TEMPLATE_MAP in SlideRenderer.tsx**

In the `TEMPLATE_MAP` object, add two entries after `terracot`:

```typescript
  photo_split_light: PhotoSplitLightSlide,
  photo_split_dark: PhotoSplitDarkSlide,
```

- [ ] **Step 3: Add template entries to registry.ts**

In `swipely-nextjs/lib/templates/registry.ts`, add two entries at the end of the `templates` array (before the closing `]`):

```typescript
  {
    id: "photo_split_light",
    name: "Photo Split Light",
    nameRu: "Фото-сплит Светлый",
    description: "Вертикальный сплит: ваше фото + текст. Светлый кремовый фон.",
    preview: "/previews/photo_split_light.png",
    tags: ["фото", "сплит", "светлый"],
    maxWordsPerSlide: 30,
    tone: "friendly",
    startOnly: true,
    supportsUserPhoto: true,
  },
  {
    id: "photo_split_dark",
    name: "Photo Split Dark",
    nameRu: "Фото-сплит Тёмный",
    description: "Вертикальный сплит: ваше фото + текст. Тёмный editorial фон.",
    preview: "/previews/photo_split_dark.png",
    tags: ["фото", "сплит", "тёмный"],
    maxWordsPerSlide: 30,
    tone: "professional",
    startOnly: true,
    supportsUserPhoto: true,
  },
```

- [ ] **Step 4: Add IDs to PRO_ONLY_TEMPLATE_IDS exclusion check (they are startOnly, not proOnly — verify they are NOT in PRO_ONLY list)**

The `PRO_ONLY_TEMPLATE_IDS` const in registry.ts should NOT include `photo_split_light` or `photo_split_dark`. Confirm by reading the const — it should remain as-is.

- [ ] **Step 5: Verify TypeScript**

```bash
cd swipely-nextjs && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
cd swipely-nextjs && git add components/slides/SlideRenderer.tsx lib/templates/registry.ts
git commit -m "feat: register photo_split_light and photo_split_dark templates"
```

---

## Task 5: Upload API route and Supabase Storage bucket

**Files:**
- Create: `swipely-nextjs/app/api/photos/upload/route.ts`
- Modify: `swipely-nextjs/supabase-migration.sql`

- [ ] **Step 1: Create the upload API route**

Create directory `swipely-nextjs/app/api/photos/upload/` and file `route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Tier check: requires start tier or above
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  const tier = profile?.subscription_tier ?? "free";
  if (tier === "free") {
    return NextResponse.json({ error: "UPGRADE_REQUIRED" }, { status: 403 });
  }

  // Parse multipart form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 10MB." },
      { status: 413 }
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Allowed: JPEG, PNG, WebP." },
      { status: 415 }
    );
  }

  // Build storage path: {user_id}/{uuid}.{ext}
  const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const uuid = crypto.randomUUID();
  const storagePath = `${user.id}/${uuid}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await admin.storage
    .from("user-photos")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: "Upload failed", detail: uploadError.message },
      { status: 500 }
    );
  }

  const {
    data: { publicUrl },
  } = admin.storage.from("user-photos").getPublicUrl(storagePath);

  return NextResponse.json({ url: publicUrl });
}
```

- [ ] **Step 2: Add bucket creation to supabase-migration.sql**

Append to the end of `swipely-nextjs/supabase-migration.sql`:

```sql
-- user-photos storage bucket (public, per-user path prefix)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-photos',
  'user-photos',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users can insert into their own prefix
CREATE POLICY IF NOT EXISTS "user_photos_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS: public read access
CREATE POLICY IF NOT EXISTS "user_photos_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'user-photos');
```

- [ ] **Step 3: Apply migration to Supabase**

Run the migration SQL against the Supabase project. In the Supabase dashboard SQL editor, or via CLI:

```bash
# If using Supabase CLI:
# supabase db push
# OR paste the new SQL block into Supabase Dashboard → SQL Editor
```

Verify the `user-photos` bucket appears in Supabase Dashboard → Storage.

- [ ] **Step 4: Verify TypeScript**

```bash
cd swipely-nextjs && npx tsc --noEmit 2>&1 | grep "photos/upload"
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
cd swipely-nextjs && git add app/api/photos/upload/route.ts supabase-migration.sql
git commit -m "feat: add /api/photos/upload route and Supabase user-photos bucket"
```

---

## Task 6: Per-slide photo UI in generate/page.tsx

**Files:**
- Modify: `swipely-nextjs/app/(dashboard)/generate/page.tsx`

This task adds:
1. `slidePhotos` state — per-slide `{ blobUrl, file, position }` records
2. `displaySlides` computed array — merges `result.slides` with `slidePhotos` blob URLs
3. `SlidePhotoZone` component — the upload/remove/flip UI shown below each slide thumbnail
4. Pass `displaySlides` to `SlideRenderer` and `ExportPanel`
5. Revoke blob URLs on reset

- [ ] **Step 1: Extend the local Slide interface**

Find the local `Slide` interface in `page.tsx` (around line 56):

```typescript
interface Slide {
  type: string;
  title: string;
  content: string;
  imageUrl?: string;
}
```

Replace with:

```typescript
interface Slide {
  type: string;
  title: string;
  content: string;
  imageUrl?: string;
  userPhotoBlobUrl?: string;
  userPhotoPosition?: "top" | "bottom";
}
```

- [ ] **Step 2: Add SlidePhotoState type and slidePhotos state**

After the line `const userPhotoInputRef = useRef<HTMLInputElement>(null);` (around line 176), add:

```typescript
  type SlidePhotoState = {
    blobUrl: string;
    file: File;
    position: "top" | "bottom";
  };

  const [slidePhotos, setSlidePhotos] = useState<Record<number, SlidePhotoState>>({});
  const slidePhotosRef = useRef<Record<number, SlidePhotoState>>({});

  useEffect(() => {
    slidePhotosRef.current = slidePhotos;
  }, [slidePhotos]);
```

- [ ] **Step 3: Add helper functions for per-slide photo handling**

After the `removePhoto` function (around line 343), add:

```typescript
  const handleSlidePhotoUpload = (
    slideIndex: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Файл слишком большой. Максимум 10 МБ.");
      return;
    }
    if (!VALID_IMAGE_TYPES.test(file.type)) {
      toast.error("Поддерживаются только JPEG, PNG и WebP");
      return;
    }

    const blobUrl = URL.createObjectURL(file);
    setSlidePhotos((prev) => ({
      ...prev,
      [slideIndex]: { blobUrl, file, position: prev[slideIndex]?.position ?? "top" },
    }));
  };

  const removeSlidePhoto = (slideIndex: number) => {
    setSlidePhotos((prev) => {
      const next = { ...prev };
      if (next[slideIndex]) {
        URL.revokeObjectURL(next[slideIndex].blobUrl);
        delete next[slideIndex];
      }
      return next;
    });
  };

  const toggleSlidePhotoPosition = (slideIndex: number) => {
    setSlidePhotos((prev) => {
      const cur = prev[slideIndex];
      if (!cur) return prev;
      return {
        ...prev,
        [slideIndex]: { ...cur, position: cur.position === "top" ? "bottom" : "top" },
      };
    });
  };
```

- [ ] **Step 4: Add displaySlides computation**

Find the line `const hasUserPhotos = uploadedPhotos.length > 0;` (around line 316). Add after it:

```typescript
  const isPhotoSplitTemplate =
    getTemplate(selectedTemplate)?.supportsUserPhoto === true;

  const displaySlides: Slide[] = result?.slides.map((slide, i) => ({
    ...slide,
    userPhotoBlobUrl: slidePhotos[i]?.blobUrl,
    userPhotoPosition: slidePhotos[i]?.position ?? "top",
  })) ?? [];
```

- [ ] **Step 5: Update handleReset to revoke slide blob URLs**

Find the `handleReset` function. After `setUploadedPhotos([]);`, add:

```typescript
    Object.values(slidePhotosRef.current).forEach((p) =>
      URL.revokeObjectURL(p.blobUrl)
    );
    setSlidePhotos({});
```

- [ ] **Step 6: Also clear slidePhotos in useEffect cleanup**

Find the existing cleanup `useEffect` with `URL.revokeObjectURL` (around line 207). Add slide photo cleanup:

```typescript
  useEffect(() => {
    return () => {
      uploadedPhotosRef.current.forEach((url) => URL.revokeObjectURL(url));
      Object.values(slidePhotosRef.current).forEach((p) =>
        URL.revokeObjectURL(p.blobUrl)
      );
    };
  }, []);
```

(This replaces the existing cleanup useEffect — add the second line to it.)

- [ ] **Step 7: Update the main SlideRenderer in result step to use displaySlides**

Find the main `<SlideRenderer>` in the result step (around line 1327):

```tsx
                  <SlideRenderer
                    template={activeTemplate}
                    scale={slideScale}
                    slide={result.slides[currentSlide]}
```

Replace `slide={result.slides[currentSlide]}` with `slide={displaySlides[currentSlide]}`:

```tsx
                  <SlideRenderer
                    template={activeTemplate}
                    scale={slideScale}
                    slide={displaySlides[currentSlide]}
```

- [ ] **Step 8: Update thumbnail strip SlideRenderer to use displaySlides**

Find the thumbnail `<SlideRenderer>` (around line 1383):

```tsx
                      <SlideRenderer
                        template={activeTemplate}
                        scale={0.1}
                        slide={slide}
```

Replace `slide={slide}` with `slide={displaySlides[i]}`:

```tsx
                      <SlideRenderer
                        template={activeTemplate}
                        scale={0.1}
                        slide={displaySlides[i]}
```

- [ ] **Step 9: Add per-slide photo zone UI in the thumbnail strip**

Find the thumbnail strip loop (the `result.slides.map((slide, i) => ...` that renders the `<button>` with thumbnail). After the closing `</button>` for each thumbnail (before the closing `)}` of the map), add a photo zone UI below each thumbnail. Wrap the existing `<button>` and the new photo zone in a `<div key={i} className="flex-shrink-0 flex flex-col items-center gap-1.5">` wrapper.

Replace the thumbnail map with:

```tsx
                  {result.slides.map((_, i) => {
                    const photo = slidePhotos[i];
                    const slidePhotoInputId = `slide-photo-${i}`;
                    return (
                      <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1.5">
                        <button
                          onClick={() => setCurrentSlide(i)}
                          className={`flex-shrink-0 rounded-lg border-2 overflow-hidden transition-all ${
                            i === currentSlide
                              ? "border-[#D4F542] shadow-lg shadow-[#D4F542]/20 scale-105"
                              : "border-border hover:border-[#D4F542]/30 opacity-60 hover:opacity-100"
                          }`}
                        >
                          <SlideRenderer
                            template={activeTemplate}
                            scale={0.1}
                            slide={displaySlides[i]}
                            slideNumber={i + 1}
                            totalSlides={result.slides.length}
                            format={format as "square" | "portrait"}
                            showWatermark={!isPro}
                          />
                        </button>

                        {/* Per-slide photo controls — shown only for photo-split templates */}
                        {isPhotoSplitTemplate && (
                          <div className="flex items-center gap-1">
                            <input
                              id={slidePhotoInputId}
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={(e) => handleSlidePhotoUpload(i, e)}
                            />
                            {photo ? (
                              <>
                                <button
                                  onClick={() => toggleSlidePhotoPosition(i)}
                                  title={photo.position === "top" ? "Фото сверху" : "Фото снизу"}
                                  className="w-6 h-6 rounded flex items-center justify-center bg-muted hover:bg-muted/80 text-[10px] font-bold text-muted-foreground transition-colors"
                                >
                                  {photo.position === "top" ? "↑" : "↓"}
                                </button>
                                <button
                                  onClick={() => removeSlidePhoto(i)}
                                  title="Удалить фото"
                                  className="w-6 h-6 rounded flex items-center justify-center bg-muted hover:bg-red-100 text-muted-foreground hover:text-red-500 transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </>
                            ) : (
                              <label
                                htmlFor={slidePhotoInputId}
                                title="Добавить фото"
                                className="w-6 h-6 rounded flex items-center justify-center bg-muted hover:bg-[#D4F542]/20 text-muted-foreground cursor-pointer transition-colors"
                              >
                                <ImageIcon className="h-3 w-3" />
                              </label>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
```

- [ ] **Step 10: Pass displaySlides to ExportPanel**

Find the `<ExportPanel` usage in the result step. Update the `slides` prop:

```tsx
              <ExportPanel
                ref={exportPanelRef}
                slides={displaySlides as import("@/components/slides/types").SlideData[]}
                template={activeTemplate}
```

(Replace `slides={result.slides as SlideData[]}` or however it's currently passed.)

- [ ] **Step 11: Verify TypeScript**

```bash
cd swipely-nextjs && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 12: Commit**

```bash
cd swipely-nextjs && git add app/'(dashboard)'/generate/page.tsx
git commit -m "feat: add per-slide photo upload UI for photo-split templates"
```

---

## Task 7: Post-export Supabase upload in ExportPanel

**Files:**
- Modify: `swipely-nextjs/components/generate/ExportPanel.tsx`

After export completes (PNG downloaded), upload photos to Supabase Storage in the background. This is non-blocking — the download is not delayed.

- [ ] **Step 1: Add photoFiles prop to ExportPanel**

In `ExportPanel.tsx`, update the `ExportPanelProps` interface:

```typescript
interface ExportPanelProps {
  slides: SlideData[];
  template: string;
  format: "square" | "portrait";
  username?: string;
  showWatermark?: boolean;
  hideButton?: boolean;
  onExportStart?: () => void;
  onExportEnd?: () => void;
  /** Per-slide File objects for background Supabase Storage upload after export */
  photoFiles?: Record<number, File>;
}
```

- [ ] **Step 2: Add background upload after successful export**

In the `exportSlides` `useCallback`, after `setExported(true)` and before the `setTimeout(() => setExported(false), 3000)`, add:

```typescript
        // Background upload to Supabase Storage (non-blocking)
        if (photoFiles && Object.keys(photoFiles).length > 0) {
          void uploadPhotoFilesToStorage(photoFiles);
        }
```

- [ ] **Step 3: Add uploadPhotoFilesToStorage helper inside ExportPanel component**

Add this function before the `useImperativeHandle` call (inside the component, before the return):

```typescript
    const uploadPhotoFilesToStorage = async (files: Record<number, File>) => {
      const uploads = Object.entries(files).map(async ([, file]) => {
        const formData = new FormData();
        formData.append("file", file);
        try {
          await fetch("/api/photos/upload", {
            method: "POST",
            body: formData,
          });
        } catch {
          // Background upload failure is silent — user already has the PNG
        }
      });
      await Promise.allSettled(uploads);
    };
```

- [ ] **Step 4: Update forwardRef destructuring to include photoFiles**

In the `forwardRef` function signature:

```typescript
  function ExportPanel(
    { slides, template, format, username, showWatermark = false, hideButton = false, onExportStart, onExportEnd, photoFiles },
    ref
  ) {
```

- [ ] **Step 5: Pass photoFiles from generate/page.tsx**

In `generate/page.tsx`, find the `<ExportPanel` usage and add the `photoFiles` prop:

```tsx
              <ExportPanel
                ref={exportPanelRef}
                slides={displaySlides as SlideData[]}
                template={activeTemplate}
                format={format as "square" | "portrait"}
                username={username || undefined}
                showWatermark={!isPro}
                photoFiles={
                  isPhotoSplitTemplate
                    ? Object.fromEntries(
                        Object.entries(slidePhotos).map(([k, v]) => [k, v.file])
                      )
                    : undefined
                }
              />
```

- [ ] **Step 6: Verify TypeScript**

```bash
cd swipely-nextjs && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
cd swipely-nextjs && git add components/generate/ExportPanel.tsx app/'(dashboard)'/generate/page.tsx
git commit -m "feat: background Supabase Storage upload of slide photos after export"
```

---

## Task 8: Bot HTML templates and renderer.js

**Files:**
- Create: `swipely-bot/src/templates/photo_split_light.html`
- Create: `swipely-bot/src/templates/photo_split_dark.html`
- Modify: `swipely-bot/src/services/renderer.js`

These templates are used when the Telegram bot renders photo-split carousels via Puppeteer. The placeholders `{{PHOTO_URL}}` and `{{PHOTO_POSITION}}` must be populated before rendering.

- [ ] **Step 1: Create photo_split_light.html**

Create `swipely-bot/src/templates/photo_split_light.html`:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1080, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: 1080px;
      height: 1350px;
      overflow: hidden;
      font-family: 'Inter', -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
    }

    /* Photo zone — top or bottom depending on PHOTO_POSITION */
    .photo-zone {
      width: 1080px;
      height: 702px; /* 52% of 1350 */
      flex-shrink: 0;
      position: relative;
      background-size: cover;
      background-position: center;
      background-image: url('{{PHOTO_URL}}');
      order: {{PHOTO_ORDER_TOP}}; /* 0 = top, 1 = bottom */
    }

    .text-zone {
      width: 1080px;
      height: 648px; /* 48% of 1350 */
      flex-shrink: 0;
      background: #F5F3EE;
      padding: 52px 64px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      position: relative;
      order: {{PHOTO_ORDER_BOTTOM}};
    }

    /* When no photo, text zone fills full height */
    .photo-zone.hidden { display: none; }
    .text-zone.full-height {
      height: 1350px;
      padding: 80px 64px;
    }

    .slide-counter {
      position: absolute;
      top: 28px;
      right: 36px;
      font-size: 20px;
      font-weight: 600;
      color: #fff;
      background: rgba(0,0,0,0.45);
      padding: 6px 16px;
      border-radius: 100px;
    }

    .slide-counter.dark-text {
      color: #C4BFB6;
      background: transparent;
    }

    h2 {
      font-family: 'Inter', sans-serif;
      font-size: 72px;
      font-weight: 800;
      color: #1A1A18;
      line-height: 1.1;
      letter-spacing: -1.5px;
      margin-bottom: 28px;
      word-wrap: break-word;
      overflow-wrap: anywhere;
    }

    .content {
      font-family: 'Inter', sans-serif;
      font-size: 28px;
      font-weight: 400;
      color: #5E5B54;
      line-height: 1.65;
    }

    .username {
      position: absolute;
      bottom: 28px;
      right: 40px;
      font-family: 'Inter', sans-serif;
      font-size: 18px;
      font-weight: 600;
      color: #B0A89C;
      letter-spacing: 0.2px;
    }
  </style>
</head>
<body>

<div class="photo-zone {{PHOTO_HIDDEN}}">
  <div class="slide-counter">{{SLIDE_NUMBER}}/{{TOTAL_SLIDES}}</div>
</div>

<div class="text-zone {{TEXT_FULL_HEIGHT}}">
  {{NO_PHOTO_COUNTER}}
  <h2>{{TITLE}}</h2>
  <div class="content">{{CONTENT}}</div>
  {{USERNAME}}
</div>

</body>
</html>
```

- [ ] **Step 2: Create photo_split_dark.html**

Create `swipely-bot/src/templates/photo_split_dark.html` — same structure, dark theme:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1080, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: 1080px;
      height: 1350px;
      overflow: hidden;
      font-family: 'Inter', -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
    }

    .photo-zone {
      width: 1080px;
      height: 702px;
      flex-shrink: 0;
      position: relative;
      background-size: cover;
      background-position: center;
      background-image: url('{{PHOTO_URL}}');
      order: {{PHOTO_ORDER_TOP}};
    }

    .text-zone {
      width: 1080px;
      height: 648px;
      flex-shrink: 0;
      background: #111111;
      padding: 52px 64px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      position: relative;
      order: {{PHOTO_ORDER_BOTTOM}};
    }

    .photo-zone.hidden { display: none; }
    .text-zone.full-height {
      height: 1350px;
      padding: 80px 64px;
    }

    .slide-counter {
      position: absolute;
      top: 28px;
      right: 36px;
      font-size: 20px;
      font-weight: 600;
      color: #fff;
      background: rgba(0,0,0,0.55);
      padding: 6px 16px;
      border-radius: 100px;
      border: 1px solid rgba(255,255,255,0.12);
    }

    .slide-counter.dark-text {
      color: #333;
      background: transparent;
      border: none;
    }

    h2 {
      font-family: 'Inter', sans-serif;
      font-size: 72px;
      font-weight: 800;
      color: #F0F0F0;
      line-height: 1.1;
      letter-spacing: -1.5px;
      margin-bottom: 28px;
      word-wrap: break-word;
      overflow-wrap: anywhere;
    }

    .content {
      font-family: 'Inter', sans-serif;
      font-size: 28px;
      font-weight: 400;
      color: #888888;
      line-height: 1.65;
    }

    .username {
      position: absolute;
      bottom: 28px;
      right: 40px;
      font-family: 'Inter', sans-serif;
      font-size: 18px;
      font-weight: 600;
      color: #3A3A3A;
      letter-spacing: 0.2px;
    }
  </style>
</head>
<body>

<div class="photo-zone {{PHOTO_HIDDEN}}">
  <div class="slide-counter">{{SLIDE_NUMBER}}/{{TOTAL_SLIDES}}</div>
</div>

<div class="text-zone {{TEXT_FULL_HEIGHT}}">
  {{NO_PHOTO_COUNTER}}
  <h2>{{TITLE}}</h2>
  <div class="content">{{CONTENT}}</div>
  {{USERNAME}}
</div>

</body>
</html>
```

- [ ] **Step 3: Add cases to renderer.js switch statement**

In `swipely-bot/src/services/renderer.js`, find the `switch (stylePreset)` block. Add two cases before the `default:` line:

```javascript
    case 'photo_split_light':
      templatePath = path.join(TEMPLATES_DIR, 'photo_split_light.html');
      break;
    case 'photo_split_dark':
      templatePath = path.join(TEMPLATES_DIR, 'photo_split_dark.html');
      break;
```

- [ ] **Step 4: Add photo placeholder substitution to renderer.js**

In `generateSlideHTML`, find the placeholder substitution block (around line 204):

```javascript
  let html = template
    .replace(/\{\{SLIDE_NUMBER\}\}/g, slideNumber)
    .replace(/\{\{TOTAL_SLIDES\}\}/g, totalSlides)
    .replace(/\{\{TITLE\}\}/g, slide.title || '')
    .replace(/\{\{CONTENT\}\}/g, slide.content || '')
    .replace(/\{\{TYPE\}\}/g, slide.type || 'statement');
```

Replace with:

```javascript
  const photoUrl = slide.photoUrl || slide.userPhotoUrl || '';
  const photoPosition = slide.photoPosition || slide.userPhotoPosition || 'top';
  const hasPhoto = !!photoUrl;

  let html = template
    .replace(/\{\{SLIDE_NUMBER\}\}/g, slideNumber)
    .replace(/\{\{TOTAL_SLIDES\}\}/g, totalSlides)
    .replace(/\{\{TITLE\}\}/g, slide.title || '')
    .replace(/\{\{CONTENT\}\}/g, slide.content || '')
    .replace(/\{\{TYPE\}\}/g, slide.type || 'statement')
    .replace(/\{\{PHOTO_URL\}\}/g, photoUrl)
    .replace(/\{\{PHOTO_ORDER_TOP\}\}/g, photoPosition === 'top' ? '0' : '1')
    .replace(/\{\{PHOTO_ORDER_BOTTOM\}\}/g, photoPosition === 'top' ? '1' : '0')
    .replace(/\{\{PHOTO_HIDDEN\}\}/g, hasPhoto ? '' : 'hidden')
    .replace(/\{\{TEXT_FULL_HEIGHT\}\}/g, hasPhoto ? '' : 'full-height')
    .replace(/\{\{NO_PHOTO_COUNTER\}\}/g, hasPhoto ? '' :
      `<div class="slide-counter dark-text">${slideNumber}/${totalSlides}</div>`)
    .replace(/\{\{USERNAME\}\}/g, options.username ?
      `<div class="username">@${options.username}</div>` : '');
```

- [ ] **Step 5: Commit bot changes**

```bash
cd swipely-bot && git add src/templates/photo_split_light.html src/templates/photo_split_dark.html src/services/renderer.js
git commit -m "feat: add photo_split_light/dark bot templates and renderer support"
```

---

## Task 9: Preview images and smoke test

**Files:**
- Create: `swipely-nextjs/scripts/gen-preview-photo-split.mjs`
- Create: `swipely-nextjs/public/previews/photo_split_light.png`
- Create: `swipely-nextjs/public/previews/photo_split_dark.png`

- [ ] **Step 1: Create preview generation script**

Create `swipely-nextjs/scripts/gen-preview-photo-split.mjs`:

```javascript
/**
 * Generates /public/previews/photo_split_light.png and photo_split_dark.png
 * Run: node scripts/gen-preview-photo-split.mjs
 */
import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PREVIEWS = path.join(__dirname, "../public/previews");

const LIGHT_HTML = `<!DOCTYPE html><html><head>
<meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap">
<style>*{margin:0;padding:0;box-sizing:border-box;}
body{width:1080px;height:1350px;overflow:hidden;font-family:'Inter',sans-serif;display:flex;flex-direction:column;}
.photo{width:1080px;height:702px;background:#D4C8B8;display:flex;align-items:center;justify-content:center;}
.photo svg{opacity:0.3;}
.text{width:1080px;height:648px;background:#F5F3EE;padding:52px 64px;display:flex;flex-direction:column;justify-content:center;}
h2{font-size:80px;font-weight:800;color:#1A1A18;line-height:1.1;letter-spacing:-2px;margin-bottom:24px;}
p{font-size:30px;color:#5E5B54;line-height:1.6;}
.num{position:absolute;top:28px;right:36px;font-size:20px;font-weight:600;color:#fff;background:rgba(0,0,0,0.45);padding:6px 16px;border-radius:100px;}
</style></head><body>
<div class="photo" style="position:relative">
<div class="num">1/5</div>
<svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#8B7355" stroke-width="1.5"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M8 5l1.5-2h5L16 5"/></svg>
</div>
<div class="text">
<h2>Ваш заголовок</h2>
<p>Текст описания вашей темы — автоматически форматируется под фото-сплит</p>
</div>
</body></html>`;

const DARK_HTML = LIGHT_HTML
  .replace("#F5F3EE", "#111111")
  .replace("#D4C8B8", "#1E1E1E")
  .replace("color:#1A1A18", "color:#F0F0F0")
  .replace("color:#5E5B54", "color:#888")
  .replace("stroke:#8B7355", "stroke:#555");

async function generatePreview(html, outPath) {
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.screenshot({ path: outPath, type: "png" });
  await browser.close();
  console.log(`Generated: ${outPath}`);
}

await generatePreview(LIGHT_HTML, path.join(PREVIEWS, "photo_split_light.png"));
await generatePreview(DARK_HTML, path.join(PREVIEWS, "photo_split_dark.png"));
console.log("Done.");
```

- [ ] **Step 2: Run the preview generation script**

```bash
cd swipely-nextjs && node scripts/gen-preview-photo-split.mjs
```

Expected output:
```
Generated: .../public/previews/photo_split_light.png
Generated: .../public/previews/photo_split_dark.png
Done.
```

Verify both files exist and are non-zero:
```bash
ls -la swipely-nextjs/public/previews/photo_split_*.png
```

- [ ] **Step 3: Smoke test — start dev server and verify templates appear**

```bash
cd swipely-nextjs && npm run dev
```

Open `http://localhost:3000/dashboard/generate` in browser.
1. Click "Создать карусель" to reach the template picker step.
2. Scroll to the end of the template list — verify "Фото-сплит Светлый" and "Фото-сплит Тёмный" appear with their preview images.
3. Select "Фото-сплит Светлый", generate a carousel with any text.
4. In the result step → thumbnail strip → verify a photo upload icon appears below each thumbnail.
5. Click the photo icon on slide 1 → select any JPEG/PNG → verify the thumbnail shows the split layout with the uploaded photo.
6. Verify the position toggle (↑/↓) switches photo between top and bottom.
7. Click "Скачать PNG" — verify the exported PNG includes the photo.

- [ ] **Step 4: Commit everything**

```bash
cd swipely-nextjs && git add scripts/gen-preview-photo-split.mjs public/previews/photo_split_light.png public/previews/photo_split_dark.png
git commit -m "feat: add preview images and generation script for photo-split templates"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] `SlideData` extended with `userPhotoUrl`, `userPhotoBlobUrl`, `userPhotoPosition` — Task 1
- [x] Two TSX templates (light/dark) — Tasks 2, 3
- [x] Two bot HTML templates — Task 8
- [x] Template registry entries with `supportsUserPhoto: true` — Task 4
- [x] `SlideRenderer.tsx` updated — Task 4
- [x] `/api/photos/upload` route — Task 5
- [x] Supabase `user-photos` bucket — Task 5
- [x] `slidePhotos` state in `page.tsx` — Task 6
- [x] Per-slide photo upload UI (dashed zone, ×, ↕) — Task 6
- [x] Blob URL preview — Task 6 (via `displaySlides`)
- [x] Upload to Supabase at export — Task 7
- [x] Revoke blob URLs on reset — Task 6
- [x] Tier gating (free → UPGRADE_REQUIRED) — Task 5
- [x] `startOnly: true` on templates — Task 4
- [x] Preview PNGs — Task 9

**Execution order for parallel subagents:**
- Wave 1 (independent): Tasks 2, 3, 5, 8 can run in parallel
- Wave 2 (depends on Wave 1): Task 4 (needs Types from Task 1 + components from Tasks 2, 3)
- Wave 3: Task 6 (needs Task 4 to be done); Task 7 (needs Task 6)
- Wave 4: Task 9 (preview generation after dev server is up)
- **Task 1 must run before all others.**
