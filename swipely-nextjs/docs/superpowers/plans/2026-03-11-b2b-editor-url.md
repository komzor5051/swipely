# B2B Editor URL — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public `/editor/[id]` hosted editor so B2B API clients can redirect their users to edit and download generated carousels without a Swipely account.

**Architecture:** New public route `app/editor/[id]/` mirrors the existing viewer pattern — server component loads generation from Supabase, `EditorClient` renders the existing `CarouselEditor` with local state only. API returns `edit_url` alongside `view_url`. Viewer gets an Edit link.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase admin client, `CarouselEditor` component, `html-to-image`

---

## Chunk 1: Server component + EditorClient

### Task 1: Create `app/editor/[id]/page.tsx`

**Files:**
- Create: `swipely-nextjs/app/editor/[id]/page.tsx`

- [ ] **Step 1: Create the server component**

Exact path: `app/editor/[id]/page.tsx`

```tsx
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import EditorClient from "./EditorClient";
import type { SlideData } from "@/components/slides/types";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

export default async function EditorPage({ params }: Params) {
  const { id } = await params;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return notFound();
  }

  const { data: gen, error } = await admin
    .from("generations")
    .select("id, template, format, output_json, created_at")
    .eq("id", id)
    .single();

  if (error || !gen) {
    return notFound();
  }

  const outputJson = gen.output_json as { slides?: SlideData[]; post_caption?: string } | null;
  const slides: SlideData[] = outputJson?.slides ?? [];
  const format: "square" | "portrait" = gen.format === "square" ? "square" : "portrait";

  if (!slides.length) {
    return notFound();
  }

  return (
    <EditorClient
      generationId={gen.id}
      template={gen.template}
      format={format}
      slides={slides}
      postCaption={outputJson?.post_caption ?? ""}
    />
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd swipely-nextjs && npx tsc --noEmit 2>&1 | grep -i "editor"
```

Expected: no output (no errors in editor files).

---

### Task 2: Create `app/editor/[id]/EditorClient.tsx`

**Files:**
- Create: `swipely-nextjs/app/editor/[id]/EditorClient.tsx`

- [ ] **Step 1: Create the client component**

Exact path: `app/editor/[id]/EditorClient.tsx`

```tsx
"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import CarouselEditor from "@/components/generate/CarouselEditor";
import type { SlideData } from "@/components/slides/types";

interface Slide extends SlideData {
  type: string;
}

interface EditorClientProps {
  generationId: string;
  template: string;
  format: "square" | "portrait";
  slides: SlideData[];
  postCaption: string;
}

export default function EditorClient({
  generationId,
  template,
  format,
  slides: initialSlides,
  postCaption: initialCaption,
}: EditorClientProps) {
  const [slides, setSlides] = useState<Slide[]>(
    initialSlides.map((s) => ({ ...s, type: (s as Slide).type ?? "value" }))
  );
  const [postCaption, setPostCaption] = useState(initialCaption);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const handleUpdateSlide = useCallback(
    (index: number, field: "title" | "content", value: string) => {
      setSlides((prev) =>
        prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
      );
    },
    []
  );

  const handleUpdateCaption = useCallback((value: string) => {
    setPostCaption(value);
  }, []);

  const handleClose = useCallback(() => {
    window.location.href = "https://swipely.ru";
  }, []);

  const handleChangeTemplate = useCallback((_id: string) => {
    // Template switching is disabled in the public editor
  }, []);

  return (
    <div className="min-h-screen bg-[#0D0D14]">
      {/* Header */}
      <div className="w-full px-4 py-4 flex items-center justify-between border-b border-white/10">
        <a
          href="https://swipely.ru"
          className="text-[#D4F542] font-bold text-lg tracking-tight"
        >
          swipely.ru
        </a>
        <a
          href={`/viewer/${generationId}`}
          className="text-[#9CA3AF] text-sm hover:text-white transition-colors"
        >
          Просмотр
        </a>
      </div>

      {/* Editor */}
      <CarouselEditor
        slides={slides}
        template={template}
        format={format}
        postCaption={postCaption}
        onUpdateSlide={handleUpdateSlide}
        onUpdateCaption={handleUpdateCaption}
        onClose={handleClose}
        onChangeTemplate={handleChangeTemplate}
        isPro={false}
      />

      {/* CTA */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="p-6 rounded-xl bg-[#D4F542]/10 border border-[#D4F542]/20 text-center">
          <p className="text-white font-semibold mb-2">Создай свою карусель</p>
          <p className="text-[#9CA3AF] text-sm mb-4">
            Swipely — AI-генератор каруселей для Instagram и других соцсетей
          </p>
          <a
            href="https://swipely.ru"
            className="inline-block px-6 py-2.5 rounded-lg bg-[#D4F542] text-[#0D0D14] font-semibold text-sm hover:bg-[#c8e83a] transition-colors"
          >
            Попробовать
          </a>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd swipely-nextjs && npx tsc --noEmit 2>&1 | grep -i "editor"
```

Expected: no output.

- [ ] **Step 3: Check build compiles**

```bash
cd swipely-nextjs && npm run build 2>&1 | tail -20
```

Expected: successful build, route `/editor/[id]` listed.

- [ ] **Step 4: Commit**

```bash
cd swipely-nextjs && git add app/editor/ && git commit -m "feat(editor): add public /editor/[id] hosted editor route"
```

---

## Chunk 2: API + Viewer changes

### Task 3: Add `edit_url` to `/api/v1/generate` response

**Files:**
- Modify: `swipely-nextjs/app/api/v1/generate/route.ts`

- [ ] **Step 1: Find the return statement in `route.ts`**

In `app/api/v1/generate/route.ts`, the final `return NextResponse.json(...)` is around line 329–335 and currently looks like:

```ts
return NextResponse.json({
  generation_id: generationId,
  slides: carouselData.slides,
  post_caption: carouselData.post_caption,
  view_url: generationId ? `${APP_URL}/viewer/${generationId}` : null,
  ...(render ? { image_urls, ...(render_error ? { render_error } : {}) } : {}),
});
```

- [ ] **Step 2: Add `edit_url` field**

Add `edit_url` on the line immediately after `view_url`:

```ts
return NextResponse.json({
  generation_id: generationId,
  slides: carouselData.slides,
  post_caption: carouselData.post_caption,
  view_url: generationId ? `${APP_URL}/viewer/${generationId}` : null,
  edit_url: generationId ? `${APP_URL}/editor/${generationId}` : null,
  ...(render ? { image_urls, ...(render_error ? { render_error } : {}) } : {}),
});
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd swipely-nextjs && npx tsc --noEmit 2>&1 | grep "v1"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
cd swipely-nextjs && git add app/api/v1/generate/route.ts && git commit -m "feat(api): add edit_url to /api/v1/generate response"
```

---

### Task 4: Add "Edit" link to `/viewer/[id]/ViewerClient.tsx`

**Files:**
- Modify: `swipely-nextjs/app/viewer/[id]/ViewerClient.tsx`

- [ ] **Step 1: Add `generationId` usage to actions row**

In `ViewerClient.tsx`, find the `/* Actions */` section (around line 121) which currently contains only the download button:

```tsx
{/* Actions */}
<div className="flex items-center gap-3 mt-6">
  <button
    onClick={downloadCurrent}
    disabled={downloading}
    className="px-6 py-3 rounded-xl bg-[#D4F542] text-[#0D0D14] font-semibold text-sm hover:bg-[#c8e83a] disabled:opacity-60 transition-colors"
  >
    {downloading ? "Скачиваю..." : `Скачать слайд ${current + 1}`}
  </button>
</div>
```

Replace with:

```tsx
{/* Actions */}
<div className="flex items-center gap-3 mt-6">
  <button
    onClick={downloadCurrent}
    disabled={downloading}
    className="px-6 py-3 rounded-xl bg-[#D4F542] text-[#0D0D14] font-semibold text-sm hover:bg-[#c8e83a] disabled:opacity-60 transition-colors"
  >
    {downloading ? "Скачиваю..." : `Скачать слайд ${current + 1}`}
  </button>
  <a
    href={`/editor/${generationId}`}
    className="px-6 py-3 rounded-xl bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-colors"
  >
    Редактировать
  </a>
</div>
```

- [ ] **Step 2: Add `generationId` to destructured props in `ViewerClient`**

`ViewerClient` declares `generationId: string` in its interface but does NOT destructure it. Find the function signature (around line 20) which currently reads:

```tsx
export default function ViewerClient({
  template,
  format,
  slides,
  postCaption,
}: ViewerClientProps) {
```

Change to:

```tsx
export default function ViewerClient({
  generationId,
  template,
  format,
  slides,
  postCaption,
}: ViewerClientProps) {
```

Without this change, `generationId` is `undefined` at runtime and the Edit link renders `/editor/undefined`.

- [ ] **Step 3: Verify TypeScript**

```bash
cd swipely-nextjs && npx tsc --noEmit 2>&1 | grep "viewer"
```

Expected: no output.

- [ ] **Step 4: Final build check**

```bash
cd swipely-nextjs && npm run build 2>&1 | tail -30
```

Expected: successful build, both `/viewer/[id]` and `/editor/[id]` listed.

- [ ] **Step 5: Commit**

```bash
cd swipely-nextjs && git add app/viewer/[id]/ViewerClient.tsx && git commit -m "feat(viewer): add Edit link to /editor/[id]"
```

---

## Manual Verification Checklist

After all tasks are done, verify end-to-end:

1. Start dev server: `cd swipely-nextjs && npm run dev`
2. Use a known `generation_id` from the DB (check Supabase → `generations` table)
3. Open `http://localhost:3000/editor/<id>` — should show the CarouselEditor
4. Edit a slide title — verify it updates in real time
5. Download a slide — verify PNG saves with correct filename
6. Click the X button — verify it navigates to `swipely.ru`
7. Open `http://localhost:3000/viewer/<id>` — verify "Редактировать" link is visible and navigates to `/editor/<id>`
8. Hit `http://localhost:3000/editor/nonexistent-id` — verify 404
9. Call `POST /api/v1/generate` — verify `edit_url` appears in response JSON
