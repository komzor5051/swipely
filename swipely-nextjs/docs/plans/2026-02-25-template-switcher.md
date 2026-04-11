# Template Switcher + Slide Transition Animation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add live template switching after generation (client-side, no API) + smooth slide-enter animation in the editor.

**Architecture:** New `TemplateSwitcher` component (2-col grid, live renders, bottom sheet/modal) integrated into both result page and `CarouselEditor`. Slide transitions use CSS keyframes + React `key` trick to force remount and restart animation on navigation.

**Tech Stack:** React 19, Next.js App Router, Tailwind CSS 4, `lib/templates/registry.ts` (template list), `SlideRenderer` (live previews), no extra dependencies.

---

## Task 1: Slide transition animation in CarouselEditor

**Files:**
- Modify: `components/generate/CarouselEditor.tsx`

No test framework — verify by running `npm run dev` in `swipely-nextjs/` and testing navigation in browser.

### Step 1: Add `slideDirection` and `slideKey` state

In `CarouselEditor`, after the existing `isDragging` state (line ~119), add:

```tsx
const [slideDirection, setSlideDirection] = useState<"forward" | "backward">("forward");
const [slideKey, setSlideKey] = useState(0);
```

### Step 2: Update `goToSlide` to set direction and increment key

Replace existing `goToSlide`:

```tsx
const goToSlide = useCallback(
  (index: number) => {
    if (index < 0 || index >= slides.length) return;
    setSlideDirection(index > currentSlide ? "forward" : "backward");
    setSlideKey((k) => k + 1);
    setCurrentSlide(index);
    if (slideStripRef.current) {
      const child = slideStripRef.current.children[index] as HTMLElement;
      child?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  },
  [slides.length, currentSlide]
);
```

### Step 3: Add CSS keyframes to the `<style>` block

Inside the existing `<style>{`...`}</style>` block, append:

```css
@keyframes slideEnterFromRight {
  from { opacity: 0; transform: translateX(60px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes slideEnterFromLeft {
  from { opacity: 0; transform: translateX(-60px); }
  to   { opacity: 1; transform: translateX(0); }
}
```

### Step 4: Apply animation — mobile centered slide

Find the mobile centered slide section (inside `md:hidden`). The outer `<div style={{ transform: mobileSheet ? "scale(0.82)..." }}>` wraps the slide. Add `key` and `style` to this wrapper:

```tsx
<div
  key={slideKey}
  style={{
    transform: mobileSheet ? "scale(0.82) translateY(-12px)" : "scale(1) translateY(0)",
    transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
    transformOrigin: "center center",
    animation: `${slideDirection === "forward" ? "slideEnterFromRight" : "slideEnterFromLeft"} 0.22s ease-out`,
  }}
  onClick={(e) => e.stopPropagation()}
>
```

### Step 5: Apply animation — desktop active slide

In the desktop slide strip `.map`, find the `<div ref={isActive && !isMobile ? activeSlideRef : undefined} ...>` wrapper. Add `key` on it when active:

```tsx
<div
  key={isActive ? slideKey : undefined}
  ref={isActive && !isMobile ? activeSlideRef : undefined}
  className={isActive ? "editor-drag-cursor" : ""}
  onPointerDown={isActive ? handlePointerDown : undefined}
  onPointerMove={isActive ? handlePointerMove : undefined}
  onPointerUp={isActive ? handlePointerUp : undefined}
  style={{
    touchAction: "none",
    animation: isActive
      ? `${slideDirection === "forward" ? "slideEnterFromRight" : "slideEnterFromLeft"} 0.22s ease-out`
      : undefined,
  }}
>
```

### Step 6: Commit

```bash
cd "swipely-nextjs" && git add components/generate/CarouselEditor.tsx
git commit -m "feat(editor): slide enter animation on navigation"
```

---

## Task 2: Create `TemplateSwitcher` component

**Files:**
- Create: `swipely-nextjs/components/generate/TemplateSwitcher.tsx`

### Step 1: Create the file

```tsx
"use client";

import { X, Check } from "lucide-react";
import { templates } from "@/lib/templates/registry";
import SlideRenderer from "@/components/slides/SlideRenderer";
import type { SlideData } from "@/components/slides/types";

interface TemplateSwitcherProps {
  currentTemplate: string;
  slides: SlideData[];
  format: "square" | "portrait";
  onSelect: (templateId: string) => void;
  onClose: () => void;
}

export default function TemplateSwitcher({
  currentTemplate,
  slides,
  format,
  onSelect,
  onClose,
}: TemplateSwitcherProps) {
  const firstSlide = slides[0];
  // photo_mode is a special template not in the registry — exclude it
  const availableTemplates = templates.filter((t) => t.id !== "photo_mode");

  const Grid = (
    <div className="grid grid-cols-2 gap-3">
      {availableTemplates.map((t) => {
        const isSelected = t.id === currentTemplate;
        return (
          <button
            key={t.id}
            onClick={() => {
              onSelect(t.id);
              onClose();
            }}
            className={`relative rounded-xl overflow-hidden border-2 transition-all active:scale-[0.97] text-left ${
              isSelected
                ? "border-[#D4F542] shadow-[0_0_0_3px_rgba(212,245,66,0.25)]"
                : "border-white/10 hover:border-white/30"
            }`}
          >
            <SlideRenderer
              template={t.id}
              scale={0.16}
              slide={firstSlide}
              slideNumber={1}
              totalSlides={slides.length}
              format={format}
            />
            <div
              className={`absolute inset-x-0 bottom-0 px-2 py-1.5 text-[11px] font-semibold text-center truncate ${
                isSelected
                  ? "bg-[#D4F542] text-[#0D0D14]"
                  : "bg-black/60 text-white backdrop-blur-sm"
              }`}
            >
              {t.nameRu}
            </div>
            {isSelected && (
              <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#D4F542] flex items-center justify-center">
                <Check className="h-3 w-3 text-[#0D0D14]" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes tplSheetUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes tplFadeIn {
          from { opacity: 0; transform: scale(0.97) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      {/* ── Desktop: centered modal ── */}
      <div className="hidden md:flex fixed inset-0 z-[70] items-center justify-center">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <div
          className="relative z-10 bg-[#111118] rounded-2xl border border-white/10 w-[500px] flex flex-col"
          style={{
            maxHeight: "80vh",
            animation: "tplFadeIn 0.25s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
            <h2 className="text-sm font-bold text-white">Сменить шаблон</h2>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {/* Grid */}
          <div className="overflow-y-auto p-4">{Grid}</div>
        </div>
      </div>

      {/* ── Mobile: bottom sheet ── */}
      <div className="md:hidden fixed inset-0 z-[70]">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div
          className="absolute left-0 right-0 bottom-0 bg-[#111118] rounded-t-2xl border-t border-white/8 flex flex-col"
          style={{
            maxHeight: "82vh",
            animation: "tplSheetUp 0.32s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-8 h-1 rounded-full bg-white/20" />
          </div>
          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-3 shrink-0">
            <h3 className="text-sm font-bold text-white">Сменить шаблон</h3>
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {/* Grid */}
          <div className="overflow-y-auto px-4 pb-6">{Grid}</div>
        </div>
      </div>
    </>
  );
}
```

### Step 2: Commit

```bash
git add components/generate/TemplateSwitcher.tsx
git commit -m "feat(editor): TemplateSwitcher component with live previews"
```

---

## Task 3: Integrate TemplateSwitcher into the result page

**Files:**
- Modify: `swipely-nextjs/app/(dashboard)/generate/page.tsx`

### Step 1: Add import

At the top of `page.tsx`, add:

```tsx
import TemplateSwitcher from "@/components/generate/TemplateSwitcher";
```

Also add `Layers` to the lucide-react import line.

### Step 2: Add `showTemplateSwitcher` state

After the `editing` state (~line 122):

```tsx
const [showTemplateSwitcher, setShowTemplateSwitcher] = useState(false);
```

### Step 3: Add button to result toolbar

In the result toolbar (the `flex flex-wrap gap-2` div at ~line 1178), add after the "Редактор" button:

```tsx
<Button
  variant="outline"
  size="sm"
  className="rounded-full active:scale-[0.98] transition-all gap-1.5"
  onClick={() => setShowTemplateSwitcher(true)}
>
  <Layers className="h-3.5 w-3.5" />
  Сменить шаблон
</Button>
```

### Step 4: Render TemplateSwitcher

Inside `{step === "result" && result && (...)}` block, at the END of the `<PageTransition>` wrapper (just before its closing tag), add:

```tsx
{showTemplateSwitcher && (
  <TemplateSwitcher
    currentTemplate={activeTemplate}
    slides={result.slides}
    format={format as "square" | "portrait"}
    onSelect={(id) => setSelectedTemplate(id)}
    onClose={() => setShowTemplateSwitcher(false)}
  />
)}
```

### Step 5: Commit

```bash
git add app/\(dashboard\)/generate/page.tsx
git commit -m "feat(generate): add template switcher to result toolbar"
```

---

## Task 4: Integrate TemplateSwitcher into CarouselEditor

**Files:**
- Modify: `swipely-nextjs/components/generate/CarouselEditor.tsx`

### Step 1: Add `onChangeTemplate` prop and import

Update `CarouselEditorProps` interface:

```tsx
interface CarouselEditorProps {
  slides: Slide[];
  template: string;
  format: "square" | "portrait";
  postCaption: string;
  onUpdateSlide: (index: number, field: "title" | "content", value: string) => void;
  onUpdateCaption: (value: string) => void;
  onClose: () => void;
  onChangeTemplate: (id: string) => void; // ← add this
}
```

Add to destructured props:
```tsx
export default function CarouselEditor({
  ...,
  onChangeTemplate,
}: CarouselEditorProps) {
```

Add import at top:
```tsx
import TemplateSwitcher from "@/components/generate/TemplateSwitcher";
import { Layers } from "lucide-react"; // add Layers to existing lucide import
```

### Step 2: Add `showTemplateSwitcher` state

After `mobileSheet` state:

```tsx
const [showTemplateSwitcher, setShowTemplateSwitcher] = useState(false);
```

### Step 3: Add "Шаблон" tab to mobile bottom bar

In the mobile bottom tab bar (`md:hidden h-[60px]` div), after the `{MOBILE_TABS.map(...)}` block, add a 4th button:

```tsx
{/* Template switcher tab */}
<button
  onClick={() => setShowTemplateSwitcher(true)}
  className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors"
  style={{ color: "rgba(255,255,255,0.4)" }}
>
  <Layers className="h-5 w-5" />
  <span className="text-[10px] font-semibold">Шаблон</span>
</button>
```

### Step 4: Add button to desktop sidebar

In the desktop sidebar (`<aside className="editor-sidebar ..."`), after the existing `<p className="text-xs text-white/25 ...">` hint at the bottom:

```tsx
<div className="h-px bg-white/8 my-4" />
<button
  onClick={() => setShowTemplateSwitcher(true)}
  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 text-sm font-semibold text-white/70 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all active:scale-[0.98]"
>
  <Layers className="h-4 w-4" />
  Сменить шаблон
</button>
```

### Step 5: Render TemplateSwitcher

At the very end of the main `return`, just before the final closing `</div>` of the root element:

```tsx
{showTemplateSwitcher && (
  <TemplateSwitcher
    currentTemplate={template}
    slides={slides}
    format={format}
    onSelect={(id) => {
      onChangeTemplate(id);
      setShowTemplateSwitcher(false);
    }}
    onClose={() => setShowTemplateSwitcher(false)}
  />
)}
```

### Step 6: Wire up `onChangeTemplate` in generate/page.tsx

In `generate/page.tsx`, where `CarouselEditor` is rendered (~line 402):

```tsx
<CarouselEditor
  slides={result.slides}
  template={activeTemplate}
  format={format as "square" | "portrait"}
  postCaption={result.post_caption}
  onUpdateSlide={updateSlide}
  onUpdateCaption={updateCaption}
  onClose={() => setEditing(false)}
  onChangeTemplate={(id) => setSelectedTemplate(id)}  // ← add this
/>
```

### Step 7: Commit

```bash
git add components/generate/CarouselEditor.tsx app/\(dashboard\)/generate/page.tsx
git commit -m "feat(editor): template switcher in editor (mobile tab + desktop sidebar)"
```

---

## Verification

After all tasks:
1. `npm run dev` in `swipely-nextjs/`
2. Generate a carousel → result page shows "Сменить шаблон" button → clicking opens grid of 11 templates → selecting one re-renders all previews instantly
3. Click "Редактор" → mobile: bottom tab "Шаблон" opens same switcher; desktop: sidebar button opens modal
4. Navigate between slides → smooth slide-in animation from correct direction
5. `npm run lint` — no TypeScript errors
