# Embla Carousel Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace custom scroll/navigation in TemplateSwitcher and CarouselEditor with Embla-based 3-per-view carousels with ‹ › arrow buttons and dot indicators.

**Architecture:** `embla-carousel-react` is already installed. Both components use `useEmblaCarousel` hook directly for full control. TemplateSwitcher: 3 templates per page, page-scroll. CarouselEditor: 3 slides visible, `align: "center"` so active is centered (edges snap to boundary via `containScroll: "trimSnaps"`), unified layout replacing separate desktop/mobile views. Drag-to-reposition only on desktop — mobile uses bottom sheet; this avoids pointer capture conflict with Embla swipe.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, `embla-carousel-react` (already installed), lucide-react.

---

## Chunk 1: TemplateSwitcher

### Task 1: Replace TemplateSwitcher grid with Embla carousel

**Files:**
- Modify: `swipely-nextjs/components/generate/TemplateSwitcher.tsx`

**Context:** Currently renders `const Grid = (...)` (pure JSX, no hooks). Replace with Embla. **Critical:** hooks (`useEmblaCarousel`, `useState`, `useEffect`, `useCallback`) must go at the component function body level — NOT inside the JSX constant. The JSX constant is just the markup.

- [ ] **Step 1: Add imports**

Add to the top of the file (after the existing `"use client"` and current imports):

```tsx
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
```

The existing imports (`X`, `Check`, `Lock`, `templates`, `SlideRenderer`, `SlideData`, `toast`) stay unchanged.

- [ ] **Step 2: Add Embla hooks inside the component function body (ABOVE the JSX constant)**

Inside `export default function TemplateSwitcher(...)`, right after the `availableTemplates` filter line, add these hook calls. They must be at the top level of the function, not inside any expression:

```tsx
// ── Embla carousel ──
const [emblaRef, emblaApi] = useEmblaCarousel({
  align: "start",
  slidesToScroll: 3,
  containScroll: "trimSnaps",
});
const [canScrollPrev, setCanScrollPrev] = useState(false);
const [canScrollNext, setCanScrollNext] = useState(true);
const [selectedSnap, setSelectedSnap] = useState(0);
const [snapCount, setSnapCount] = useState(0);

const onEmblaSelect = useCallback(() => {
  if (!emblaApi) return;
  setCanScrollPrev(emblaApi.canScrollPrev());
  setCanScrollNext(emblaApi.canScrollNext());
  setSelectedSnap(emblaApi.selectedScrollSnap());
}, [emblaApi]);

useEffect(() => {
  if (!emblaApi) return;
  setSnapCount(emblaApi.scrollSnapList().length);
  onEmblaSelect();
  emblaApi.on("select", onEmblaSelect);
  emblaApi.on("reInit", onEmblaSelect);
  return () => {
    emblaApi.off("select", onEmblaSelect);
    emblaApi.off("reInit", onEmblaSelect);
  };
}, [emblaApi, onEmblaSelect]);
```

- [ ] **Step 3: Replace `const Grid = (...)` with `const Carousel = (...)`**

Delete the entire `const Grid = (...)` block and replace with this JSX constant (hooks are NOT inside here — they were added in Step 2):

```tsx
const Carousel = (
  <div>
    <div className="flex items-center gap-2">
      <button
        onClick={() => emblaApi?.scrollPrev()}
        disabled={!canScrollPrev}
        aria-label="Предыдущие шаблоны"
        className="w-9 h-9 rounded-full flex items-center justify-center border border-white/10 text-white/60 hover:text-white hover:border-white/25 disabled:opacity-20 transition-all shrink-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="overflow-hidden flex-1" ref={emblaRef}>
        <div className="flex" style={{ gap: "8px" }}>
          {availableTemplates.map((t) => {
            const isSelected = t.id === currentTemplate;
            const locked = t.proOnly && !isPro;
            return (
              <div key={t.id} style={{ flex: "0 0 calc((100% - 16px) / 3)" }}>
                <button
                  aria-label={`${t.nameRu}${isSelected ? ", выбран" : ""}${locked ? ", только PRO" : ""}`}
                  aria-pressed={isSelected}
                  onClick={() => {
                    if (locked) {
                      toast("Шаблон доступен только на PRO", {
                        description: "Перейди на PRO, чтобы использовать этот стиль",
                        action: {
                          label: "Перейти",
                          onClick: () => (window.location.href = "/dashboard/pricing"),
                        },
                      });
                      onClose();
                      return;
                    }
                    onSelect(t.id);
                    onClose();
                  }}
                  className={`relative w-full rounded-xl overflow-hidden border-2 transition-all active:scale-[0.97] text-left ${
                    isSelected && !locked
                      ? "border-[#D4F542] shadow-[0_0_0_3px_rgba(212,245,66,0.25)]"
                      : locked
                        ? "border-white/5 opacity-55 hover:opacity-75"
                        : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <SlideRenderer
                    template={t.id}
                    scale={0.11}
                    slide={firstSlide}
                    slideNumber={1}
                    totalSlides={slides.length}
                    format={format}
                  />
                  <div
                    className={`absolute inset-x-0 bottom-0 px-2 py-1.5 text-[11px] font-semibold text-center truncate ${
                      isSelected && !locked
                        ? "bg-[#D4F542] text-[#0D0D14]"
                        : "bg-black/60 text-white backdrop-blur-sm"
                    }`}
                  >
                    {t.nameRu}
                  </div>
                  {isSelected && !locked && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#D4F542] flex items-center justify-center">
                      <Check className="h-3 w-3 text-[#0D0D14]" />
                    </div>
                  )}
                  {locked && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
                      <Lock className="h-2.5 w-2.5 text-[#D4F542]" />
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => emblaApi?.scrollNext()}
        disabled={!canScrollNext}
        aria-label="Следующие шаблоны"
        className="w-9 h-9 rounded-full flex items-center justify-center border border-white/10 text-white/60 hover:text-white hover:border-white/25 disabled:opacity-20 transition-all shrink-0"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>

    {snapCount > 1 && (
      <div className="flex justify-center gap-1.5 mt-3">
        {Array.from({ length: snapCount }).map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            aria-label={`Страница ${i + 1}`}
            style={{
              width: i === selectedSnap ? 16 : 6,
              height: 6,
              borderRadius: 3,
              background: i === selectedSnap ? "#D4F542" : "rgba(255,255,255,0.2)",
              transition: "all 0.2s ease",
              border: "none",
              padding: 0,
              cursor: "pointer",
              flexShrink: 0,
            }}
          />
        ))}
      </div>
    )}
  </div>
);
```

- [ ] **Step 4: Replace both `{Grid}` references with `{Carousel}`**

In the return JSX there are two places rendering the grid — one in the desktop modal (`<div className="overflow-y-auto p-4">{Grid}</div>`) and one in the mobile bottom sheet (`<div className="overflow-y-auto px-4 pb-6">{Grid}</div>`). Replace both `{Grid}` with `{Carousel}`.

- [ ] **Step 5: Verify in dev server**

```bash
cd "swipely-nextjs" && npm run dev
```

Open http://localhost:3000, generate a carousel, open the editor, click "Сменить шаблон". Check:
- 3 templates visible at once
- ‹ › arrows scroll by 3 at a time, disabled at boundaries
- Dot indicators below, lime dot = current page
- Selecting a template highlights it with lime border + checkmark
- Locked templates show lock icon
- Works in both desktop modal and mobile bottom sheet

- [ ] **Step 6: Commit**

```bash
cd "swipely-nextjs" && git add components/generate/TemplateSwitcher.tsx
git commit -m "feat(ui): replace template grid with Embla 3-per-view carousel"
```

---

## Chunk 2: CarouselEditor

### Task 2: Replace CarouselEditor slide strip with Embla carousel

**Files:**
- Modify: `swipely-nextjs/components/generate/CarouselEditor.tsx`

**Context — full component structure:**
```
fixed inset-0 flex flex-col bg-[#0D0D14]
├── header (60px) — logo, slide counter ‹N/total›, download + close
├── flex-1 flex overflow-hidden
│   ├── Desktop slide strip: hidden md:flex flex-1 flex-col (~lines 634–714)
│   ├── Mobile single slide: md:hidden flex-1 flex flex-col (~lines 716–805)
│   └── Desktop sidebar: hidden md:block w-[300px] (~lines 807–978)
├── Mobile bottom tab bar: md:hidden h-[60px]
└── Mobile bottom sheet overlay: md:hidden fixed inset-0
```

**What changes:**
- Remove desktop slide strip block entirely
- Remove mobile single-slide block entirely
- Add one unified Embla carousel (works on both)
- Remove ‹ › buttons from header (keep counter text only)
- Keep sidebar, bottom tab bar, bottom sheet, export logic — all unchanged

**Drag-to-reposition conflict:** Embla listens to pointer events on its viewport. `handlePointerDown` calls `e.preventDefault()` + `setPointerCapture()` which hijacks the pointer stream away from Embla. Fix: only attach drag handlers on desktop (`!isMobile`). On mobile, swiping works freely; text editing uses the bottom sheet.

**`isMobile` must be kept** — it's still used for the drag condition.

- [ ] **Step 1: Add `useEmblaCarousel` import**

`useState`, `useCallback`, `useEffect`, `useRef` are already imported. Add only:

```tsx
import useEmblaCarousel from "embla-carousel-react";
```

- [ ] **Step 2: Remove old scale constants and `slideStripRef`, add Embla hook + carouselScale**

Find and delete these 3 lines:

```tsx
const activeScale = 0.38;
const thumbScale = 0.18;
const mobileSlideScale = windowWidth > 0 ? Math.min(0.28, (windowWidth - 40) / 1080) : 0.28;
```

Find and delete:
```tsx
const slideStripRef = useRef<HTMLDivElement>(null);
```

After `const isMobile = ...` line, add:

```tsx
// Embla carousel
const [emblaRef, emblaApi] = useEmblaCarousel({
  align: "center",       // active slide is centered; edges snap to boundary via containScroll
  containScroll: "trimSnaps",
});
const [canScrollPrev, setCanScrollPrev] = useState(false);
const [canScrollNext, setCanScrollNext] = useState(true);

// Dynamic scale: fit 3 cards in the available width
const carouselScale = (() => {
  if (windowWidth === 0) return 0.18;
  const sidebarW = windowWidth >= 768 ? 300 : 0;
  // Reserved: sidebar + 2 arrows(40px) + 2 arrow-gaps(12px) + container px-4(32px) + 2 card gaps(12px each)
  const reserved = sidebarW + 40 + 40 + 12 + 12 + 32 + 24;
  const cardPx = (windowWidth - reserved) / 3;
  return Math.max(0.07, cardPx / 1080);
})();
```

- [ ] **Step 3: Add Embla sync effects (after existing useEffects)**

After the `useEffect` for window resize listener, add:

```tsx
// Sync Embla canScroll state + currentSlide on swipe
const onEmblaSelect = useCallback(() => {
  if (!emblaApi) return;
  setCanScrollPrev(emblaApi.canScrollPrev());
  setCanScrollNext(emblaApi.canScrollNext());
  const i = emblaApi.selectedScrollSnap();
  setCurrentSlide(i);
  setSlideKey((k) => k + 1);
}, [emblaApi]);

useEffect(() => {
  if (!emblaApi) return;
  onEmblaSelect();
  emblaApi.on("select", onEmblaSelect);
  emblaApi.on("reInit", onEmblaSelect);
  return () => {
    emblaApi.off("select", onEmblaSelect);
    emblaApi.off("reInit", onEmblaSelect);
  };
}, [emblaApi, onEmblaSelect]);

// Drive Embla from external navigation (goToSlide, dots)
useEffect(() => {
  if (!emblaApi) return;
  if (emblaApi.selectedScrollSnap() !== currentSlide) {
    emblaApi.scrollTo(currentSlide);
  }
}, [emblaApi, currentSlide]);
```

- [ ] **Step 4: Update `goToSlide` — remove `slideStripRef` scrollIntoView, add `emblaApi.scrollTo`**

Find `goToSlide` (around line 386). Replace its body:

```tsx
const goToSlide = useCallback(
  (index: number) => {
    if (isDragging) return;
    if (index < 0 || index >= slides.length) return;
    if (index === currentSlide) return;
    setSlideDirection(index > currentSlide ? "forward" : "backward");
    setSlideKey((k) => k + 1);
    setCurrentSlide(index);
    emblaApi?.scrollTo(index);
  },
  [slides.length, currentSlide, isDragging, emblaApi]
);
```

- [ ] **Step 5: Update `dragScale` — uses `carouselScale` now**

Find:
```tsx
const dragScale = isMobile ? mobileSlideScale : activeScale;
```
Replace with:
```tsx
const dragScale = carouselScale;
```

- [ ] **Step 6: Remove ‹ › buttons from header, keep counter**

Find the "Slide nav" comment block in the header (around line 576):
```tsx
{/* Slide nav */}
<div className="flex items-center gap-1 md:gap-2">
  <button ... onClick={() => goToSlide(currentSlide - 1)}><ChevronLeft .../></button>
  <span ...>{currentSlide + 1}/{slides.length}</span>
  <button ... onClick={() => goToSlide(currentSlide + 1)}><ChevronRight .../></button>
</div>
```

Replace with:
```tsx
{/* Slide counter */}
<span className="text-sm font-semibold tabular-nums text-white font-[family-name:var(--font-mono)]">
  {currentSlide + 1} / {slides.length}
</span>
```

- [ ] **Step 7: Add missing animation keyframes to the `<style>` block**

The unified carousel uses `slideEnterFromRight` and `slideEnterFromLeft`. Find the `<style>` block in the return JSX (it already has `editorFadeIn`, `slideIn`, `sheetSlideUp`). Add these two keyframes inside it:

```css
@keyframes slideEnterFromRight {
  from { opacity: 0; transform: translateX(40px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes slideEnterFromLeft {
  from { opacity: 0; transform: translateX(-40px); }
  to   { opacity: 1; transform: translateX(0); }
}
```

- [ ] **Step 8: Replace the two slide display blocks with a unified Embla carousel**

Find the entire `{/* ── Main Area ── */}` div and its children. The structure is:
```tsx
<div className="flex-1 flex overflow-hidden">
  {/* Desktop slide strip */}
  <div className="hidden md:flex flex-1 flex-col overflow-hidden">...</div>
  {/* Mobile single slide */}
  <div className="md:hidden flex-1 ...">...</div>
  {/* Desktop sidebar */}
  <aside className="editor-sidebar hidden md:block w-[300px] ...">...</aside>
</div>
```

Delete the two `hidden md:flex` and `md:hidden` blocks completely. Replace with a unified carousel block before the `<aside>`. The final structure:

```tsx
{/* ── Main Area ── */}
<div className="flex-1 flex overflow-hidden">

  {/* ── Unified Embla carousel (desktop + mobile) ── */}
  <div className="flex-1 flex flex-col justify-center py-5 overflow-hidden">

    {/* Carousel row: arrow · viewport · arrow */}
    <div className="flex items-center gap-3 px-4">
      <button
        onClick={() => goToSlide(currentSlide - 1)}
        disabled={!canScrollPrev}
        aria-label="Предыдущий слайд"
        className="w-10 h-10 rounded-full flex items-center justify-center border border-white/10 text-white/60 hover:text-white hover:border-white/25 disabled:opacity-20 transition-all shrink-0"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="overflow-hidden flex-1" ref={emblaRef}>
        <div className="flex" style={{ gap: "12px" }}>
          {slides.map((slide, i) => {
            const isActive = i === currentSlide;
            return (
              <div
                key={i}
                className={`relative rounded-xl overflow-hidden cursor-pointer transition-all ${
                  isActive
                    ? "border-2 border-[#D4F542]"
                    : "border-2 border-white/8 opacity-45 hover:opacity-70"
                }`}
                style={{
                  flex: "0 0 calc((100% - 24px) / 3)",
                  boxShadow: isActive ? "0 6px 28px rgba(212,245,66,0.2)" : "none",
                }}
                onClick={() => goToSlide(i)}
              >
                {/* Draggable inner wrapper — drag only on desktop to avoid Embla conflict */}
                <div
                  key={isActive ? slideKey : i}
                  ref={isActive && !isMobile ? activeSlideRef : undefined}
                  className={isActive && !isMobile ? "editor-drag-cursor" : ""}
                  onPointerDown={isActive && !isMobile ? handlePointerDown : undefined}
                  onPointerUp={isActive && !isMobile ? handlePointerUp : undefined}
                  onPointerCancel={isActive && !isMobile ? handlePointerUp : undefined}
                  style={{
                    touchAction: isActive && !isMobile ? "none" : "auto",
                    animation:
                      isActive && !isDragging
                        ? `${slideDirection === "forward" ? "slideEnterFromRight" : "slideEnterFromLeft"} 0.22s ease-out`
                        : undefined,
                  }}
                >
                  <SlideRenderer
                    template={template}
                    scale={carouselScale}
                    slide={slide}
                    slideNumber={i + 1}
                    totalSlides={slides.length}
                    format={format}
                  />
                </div>

                {/* Slide number badge */}
                <div
                  className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold tabular-nums"
                  style={{
                    background: isActive ? "#D4F542" : "rgba(0,0,0,0.5)",
                    color: isActive ? "#0D0D14" : "#fff",
                  }}
                >
                  {i + 1}
                </div>

                {/* Drag hint — desktop only on active slide */}
                {isActive && !isMobile && !isDragging && (
                  <div
                    className="absolute top-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-medium whitespace-nowrap pointer-events-none"
                    style={{ background: "rgba(212,245,66,0.9)", color: "#0D0D14" }}
                  >
                    <GripVertical className="h-2.5 w-2.5" />
                    Тяни {selectedField === "title" ? "заголовок" : "контент"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => goToSlide(currentSlide + 1)}
        disabled={!canScrollNext}
        aria-label="Следующий слайд"
        className="w-10 h-10 rounded-full flex items-center justify-center border border-white/10 text-white/60 hover:text-white hover:border-white/25 disabled:opacity-20 transition-all shrink-0"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>

    {/* Dot indicators */}
    <div className="flex justify-center gap-1.5 mt-4">
      {slides.map((_, i) => (
        <button
          key={i}
          onClick={() => goToSlide(i)}
          style={{
            width: i === currentSlide ? 16 : 6,
            height: 6,
            borderRadius: 3,
            background: i === currentSlide ? "#D4F542" : "rgba(255,255,255,0.25)",
            transition: "all 0.2s ease",
            border: "none",
            padding: 0,
            cursor: "pointer",
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  </div>

  {/* ── Desktop: Right Sidebar (hidden on mobile) — UNCHANGED ── */}
  <aside className="editor-sidebar hidden md:block w-[300px] bg-[#111118] border-l border-white/8 p-5 overflow-y-auto shrink-0">
    {/* copy all existing sidebar content here verbatim */}
  </aside>
</div>
```

**The `<aside>` content** (field toggle, text inputs, font size slider, font family select, alignment buttons, color swatches, caption textarea, template switcher button) must be copied verbatim from the existing file — do not modify any of it.

- [ ] **Step 9: Verify TypeScript compiles**

```bash
cd "swipely-nextjs" && npx tsc --noEmit 2>&1 | head -40
```

Expected: no errors. If errors about `slideStripRef` still referenced somewhere, search and remove those references.

- [ ] **Step 10: Verify in dev server**

```bash
cd "swipely-nextjs" && npm run dev
```

Open http://localhost:3000, generate a carousel, open the CarouselEditor. Verify:
- **Desktop:** 3 slides visible, center one has lime border + glow; ‹ › arrows navigate; clicking inactive slide centers it; dot indicators update; header shows "N / total" counter; sidebar edit controls still work; drag-to-reposition on active slide still works
- **Mobile:** 3 slides visible; touch swipe between slides works (swipe on ANY card including active); dot indicators update; bottom tab bar (Текст/Позиция/Подпись/Шаблон) still works; bottom sheet edit controls still work
- **Export:** click "Скачать PNG" — all slides download correctly

- [ ] **Step 11: Commit**

```bash
cd "swipely-nextjs" && git add components/generate/CarouselEditor.tsx
git commit -m "feat(ui): replace slide strip with Embla 3-per-view carousel in CarouselEditor"
```

---

## Final

- [ ] **Push to GitHub**

```bash
cd "swipely-nextjs" && git push origin main
```
