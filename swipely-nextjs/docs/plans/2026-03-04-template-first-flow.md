# Template-First Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a horizontal template picker slider on the dashboard (below the CTA banner) so users pick a design style before entering text, then navigate to `/generate?template={id}` with the template pre-selected.

**Architecture:** New `TemplatePicker` client component reads the template registry, renders a scrollable card strip, and pushes to `/generate?template={id}`. The generate page gains a single `useSearchParams`-based `useEffect` that pre-fills `selectedTemplate` from the URL param.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS 4, `next/navigation` (`useRouter`, `useSearchParams`), `next/image`

---

### Task 1: Create TemplatePicker component

**Files:**
- Create: `components/dashboard/TemplatePicker.tsx`

**Step 1: Create the file with this exact code**

```tsx
"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { templates } from "@/lib/templates/registry";

export default function TemplatePicker() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -340 : 340, behavior: "smooth" });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#0D0D14]">Выбери стиль</p>
        <div className="flex gap-1">
          <button
            onClick={() => scroll("left")}
            className="w-7 h-7 rounded-full border border-[#E8E8E4] bg-white flex items-center justify-center hover:bg-[#F5F5F0] transition-colors"
            aria-label="Прокрутить влево"
          >
            <ChevronLeft className="h-4 w-4 text-[#6B7280]" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-7 h-7 rounded-full border border-[#E8E8E4] bg-white flex items-center justify-center hover:bg-[#F5F5F0] transition-colors"
            aria-label="Прокрутить вправо"
          >
            <ChevronRight className="h-4 w-4 text-[#6B7280]" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => router.push(`/generate?template=${tpl.id}`)}
            className="group relative flex-none w-[140px] snap-start rounded-2xl overflow-hidden border border-[#E8E8E4] bg-white hover:-translate-y-1 hover:shadow-md transition-all duration-200 text-left"
          >
            {/* Preview image */}
            <div className="relative w-full aspect-[4/5] bg-[#F5F5F0]">
              <Image
                src={tpl.preview}
                alt={tpl.nameRu}
                fill
                className="object-cover"
                sizes="140px"
              />
              {/* PRO overlay */}
              {tpl.proOnly && (
                <div className="absolute inset-0 bg-black/30 flex items-start justify-end p-2">
                  <span className="flex items-center gap-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    <Lock className="h-2.5 w-2.5" />
                    PRO
                  </span>
                </div>
              )}
            </div>

            {/* Name + CTA */}
            <div className="px-3 py-2.5">
              <p className="text-xs font-semibold text-[#0D0D14] truncate">{tpl.nameRu}</p>
              <p className="text-[10px] text-[#6B7280] mt-0.5 group-hover:text-[#0D0D14] transition-colors">
                Попробовать →
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

```bash
cd "/Users/lvmn/Desktop/Бизнес/ai projects /swipely /swipely-nextjs" && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors related to `TemplatePicker.tsx`

**Step 3: Commit**

```bash
cd "/Users/lvmn/Desktop/Бизнес/ai projects /swipely /swipely-nextjs"
git add components/dashboard/TemplatePicker.tsx
git commit -m "feat(dashboard): add TemplatePicker component — horizontal template slider"
```

---

### Task 2: Add TemplatePicker to dashboard page

**Files:**
- Modify: `app/(dashboard)/dashboard/page.tsx` — insert after the CTA banner block (lines ~92–110)

**Step 1: Add import at top of file**

In `app/(dashboard)/dashboard/page.tsx`, add this import after the existing imports:

```tsx
import TemplatePicker from "@/components/dashboard/TemplatePicker";
```

**Step 2: Insert TemplatePicker after the CTA banner**

Find this closing block in the file (around line 109–110):

```tsx
        </Link>
      </FadeIn>

      {/* Stats Grid */}
```

Replace with:

```tsx
        </Link>
      </FadeIn>

      {/* Template picker */}
      <FadeIn delay={0.08}>
        <TemplatePicker />
      </FadeIn>

      {/* Stats Grid */}
```

**Step 3: Verify TypeScript compiles**

```bash
cd "/Users/lvmn/Desktop/Бизнес/ai projects /swipely /swipely-nextjs" && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

**Step 4: Commit**

```bash
cd "/Users/lvmn/Desktop/Бизнес/ai projects /swipely /swipely-nextjs"
git add app/\(dashboard\)/dashboard/page.tsx
git commit -m "feat(dashboard): show TemplatePicker below CTA banner"
```

---

### Task 3: Read ?template= param on generate page

**Files:**
- Modify: `app/(dashboard)/generate/page.tsx`

**Step 1: Add useSearchParams import**

In `app/(dashboard)/generate/page.tsx`, the imports from `react` are on line 3:

```tsx
import { useState, useRef, useEffect } from "react";
```

Change to:

```tsx
import { useState, useRef, useEffect, Suspense } from "react";
```

Also add `useSearchParams` to the next/navigation imports. Find:

```tsx
import { createClient } from "@/lib/supabase/client";
```

Add before it (or near other next/navigation imports if any):

```tsx
import { useSearchParams } from "next/navigation";
import { getTemplate } from "@/lib/templates/registry";
```

**Step 2: Add useSearchParams and the initialization effect**

In `GeneratePage()`, after the existing `useEffect` for `supabase.auth.getUser()` (around line 155), add:

```tsx
  const searchParams = useSearchParams();

  useEffect(() => {
    const tplParam = searchParams.get("template");
    if (tplParam && getTemplate(tplParam)) {
      setSelectedTemplate(tplParam);
    }
  }, [searchParams]);
```

**Step 3: Wrap GeneratePage export in Suspense**

`useSearchParams` requires a Suspense boundary in Next.js App Router. The page is already a client component, so wrap the default export:

At the bottom of the file, find the `export default function GeneratePage()` declaration. Change the file structure so the actual component is named `GeneratePageInner` and a wrapper exports it:

Find:
```tsx
export default function GeneratePage() {
```

Change to:
```tsx
function GeneratePage() {
```

Then at the very end of the file, after the closing `}` of `GeneratePage`, add:

```tsx
export default function GeneratePageWrapper() {
  return (
    <Suspense>
      <GeneratePage />
    </Suspense>
  );
}
```

**Step 4: Verify TypeScript compiles**

```bash
cd "/Users/lvmn/Desktop/Бизнес/ai projects /swipely /swipely-nextjs" && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors

**Step 5: Commit**

```bash
cd "/Users/lvmn/Desktop/Бизнес/ai projects /swipely /swipely-nextjs"
git add app/\(dashboard\)/generate/page.tsx
git commit -m "feat(generate): pre-select template from ?template= URL param"
```

---

### Task 4: Manual verification

**Step 1: Start dev server**

```bash
cd "/Users/lvmn/Desktop/Бизнес/ai projects /swipely /swipely-nextjs" && npm run dev
```

**Step 2: Check dashboard**
1. Open `http://localhost:3000/dashboard`
2. Verify: horizontal template slider appears below the lime "Создать карусель" banner
3. Verify: templates scroll horizontally with arrow buttons
4. Verify: PRO templates show lock + "PRO" badge
5. Verify: hovering a card shows the "Попробовать →" text in darker color

**Step 3: Check navigation flow**
1. Click any template card on the dashboard
2. Verify: browser navigates to `/generate?template={id}`
3. Verify: the template step in the wizard shows the clicked template pre-selected

**Step 4: Check that direct /generate still works**
1. Open `http://localhost:3000/generate` (no param)
2. Verify: default template "swipely" is selected (unchanged behavior)
