"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  Loader2,
  CheckCircle,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  GripVertical,
  Type,
  Move,
  FileText,
  Layers,
} from "lucide-react";
import SlideRenderer from "@/components/slides/SlideRenderer";
import type { SlideData } from "@/components/slides/types";
import TemplateSwitcher from "@/components/generate/TemplateSwitcher";

/* ─── Types ─── */

interface Slide extends SlideData {
  type: string;
}

interface FieldStyle {
  offset: { x: number; y: number };
  fontSize: number;
  color: string;
  textAlign: "left" | "center" | "right";
  fontFamily: string;
}

interface SlideEditState {
  title: FieldStyle;
  content: FieldStyle;
}

interface CarouselEditorProps {
  slides: Slide[];
  template: string;
  format: "square" | "portrait";
  postCaption: string;
  onUpdateSlide: (
    index: number,
    field: "title" | "content",
    value: string
  ) => void;
  onUpdateCaption: (value: string) => void;
  onClose: () => void;
  onChangeTemplate: (id: string) => void;
  isPro?: boolean;
}

/* ─── Constants ─── */

const COLORS = [
  "#FFFFFF",
  "#000000",
  "#0A84FF",
  "#1A1A2E",
  "#FF4757",
  "#D4F542",
];

const GOOGLE_FONTS = [
  { name: "Outfit", label: "Outfit" },
  { name: "Space Grotesk", label: "Space Grotesk" },
  { name: "Inter", label: "Inter" },
  { name: "Montserrat", label: "Montserrat" },
  { name: "Poppins", label: "Poppins" },
  { name: "Raleway", label: "Raleway" },
  { name: "Oswald", label: "Oswald" },
  { name: "Playfair Display", label: "Playfair Display" },
  { name: "Lora", label: "Lora" },
  { name: "Bebas Neue", label: "Bebas Neue" },
  { name: "Nunito", label: "Nunito" },
  { name: "Work Sans", label: "Work Sans" },
];

const loadedFonts = new Set<string>();
function loadGoogleFont(family: string) {
  if (!family || loadedFonts.has(family)) return;
  loadedFonts.add(family);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;600;700&display=swap`;
  document.head.appendChild(link);
}

const DEFAULT_TITLE_STYLE: FieldStyle = {
  offset: { x: 0, y: 0 },
  fontSize: 82,
  color: "",
  textAlign: "left",
  fontFamily: "",
};

const DEFAULT_CONTENT_STYLE: FieldStyle = {
  offset: { x: 0, y: 0 },
  fontSize: 34,
  color: "",
  textAlign: "left",
  fontFamily: "",
};

const MOBILE_TABS = [
  { id: "text" as const, label: "Текст", icon: Type },
  { id: "position" as const, label: "Позиция", icon: Move },
  { id: "caption" as const, label: "Подпись", icon: FileText },
];

/* ─── Component ─── */

export default function CarouselEditor({
  slides,
  template,
  format,
  postCaption,
  onUpdateSlide,
  onUpdateCaption,
  onClose,
  onChangeTemplate,
  isPro = false,
}: CarouselEditorProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedField, setSelectedField] = useState<"title" | "content">(
    "title"
  );
  const [editStates, setEditStates] = useState<SlideEditState[]>(() =>
    slides.map(() => ({
      title: { ...DEFAULT_TITLE_STYLE },
      content: { ...DEFAULT_CONTENT_STYLE },
    }))
  );
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<null | "text" | "position" | "caption">(null);
  const [showTemplateSwitcher, setShowTemplateSwitcher] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);

  const [slideDirection, setSlideDirection] = useState<"forward" | "backward">("forward");
  const [slideKey, setSlideKey] = useState(0);

  // Drag state (desktop only)
  const [isDragging, setIsDragging] = useState(false);
  const dragFieldRef = useRef<"title" | "content" | null>(null);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const sheetTouchStartY = useRef(0);

  // Refs
  const activeSlideRef = useRef<HTMLDivElement>(null);
  const slideStripRef = useRef<HTMLDivElement>(null);
  const exportContainerRef = useRef<HTMLDivElement>(null);

  // Track window width for mobile/desktop detection
  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const h = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // Preload all Google Fonts on mount
  useEffect(() => {
    GOOGLE_FONTS.forEach((f) => loadGoogleFont(f.name));
  }, []);

  const isMobile = windowWidth > 0 && windowWidth < 768;

  // Scales
  const activeScale = 0.38;
  const thumbScale = 0.18;
  // Dynamic: fit within viewport minus 40px (px-4 each side = 32px + 8px buffer)
  const mobileSlideScale = windowWidth > 0 ? Math.min(0.28, (windowWidth - 40) / 1080) : 0.28;

  const currentState = editStates[currentSlide];

  /* ─── Apply DOM modifications to rendered slide ─── */
  const applyEditorStyles = useCallback(
    (container: HTMLElement | null, slideIndex: number) => {
      if (!container) return;
      const state = editStates[slideIndex];
      if (!state) return;

      const titleEl = container.querySelector("h1, h2") as HTMLElement | null;
      const contentEl = container.querySelector("p") as HTMLElement | null;

      if (titleEl) {
        titleEl.style.transform = `translate(${state.title.offset.x}px, ${state.title.offset.y}px)`;
        if (state.title.color) titleEl.style.color = state.title.color;
        if (state.title.fontSize !== DEFAULT_TITLE_STYLE.fontSize) {
          titleEl.style.fontSize = `${state.title.fontSize}px`;
        }
        titleEl.style.textAlign = state.title.textAlign;
        if (state.title.fontFamily) titleEl.style.fontFamily = state.title.fontFamily;
      }
      if (contentEl) {
        contentEl.style.transform = `translate(${state.content.offset.x}px, ${state.content.offset.y}px)`;
        if (state.content.color) contentEl.style.color = state.content.color;
        if (state.content.fontSize !== DEFAULT_CONTENT_STYLE.fontSize) {
          contentEl.style.fontSize = `${state.content.fontSize}px`;
        }
        contentEl.style.textAlign = state.content.textAlign;
        if (state.content.fontFamily) contentEl.style.fontFamily = state.content.fontFamily;
      }
    },
    [editStates]
  );

  useEffect(() => {
    // Skip during active drag — DOM is managed directly by onMove
    if (isDragging) return;
    applyEditorStyles(activeSlideRef.current, currentSlide);
  }, [editStates, currentSlide, applyEditorStyles, slides, isDragging]);

  /* ─── Drag handlers ─── */

  const dragScale = isMobile ? mobileSlideScale : activeScale;

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      e.preventDefault(); // prevent browser drag / text selection hijack
      if (!activeSlideRef.current) return;

      const slideRect = activeSlideRef.current.getBoundingClientRect();
      const relX = (e.clientX - slideRect.left) / dragScale;
      const relY = (e.clientY - slideRect.top) / dragScale;

      const titleEl = activeSlideRef.current.querySelector(
        "h1, h2"
      ) as HTMLElement | null;
      const contentEl = activeSlideRef.current.querySelector(
        "p"
      ) as HTMLElement | null;

      let field: "title" | "content" | null = null;

      if (titleEl) {
        const titleRect = titleEl.getBoundingClientRect();
        const tRelTop = (titleRect.top - slideRect.top) / dragScale;
        const tRelBottom = (titleRect.bottom - slideRect.top) / dragScale;
        const tRelLeft = (titleRect.left - slideRect.left) / dragScale;
        const tRelRight = (titleRect.right - slideRect.left) / dragScale;

        if (
          relX >= tRelLeft - 20 &&
          relX <= tRelRight + 20 &&
          relY >= tRelTop - 20 &&
          relY <= tRelBottom + 20
        ) {
          field = "title";
        }
      }

      if (!field && contentEl) {
        const cRect = contentEl.getBoundingClientRect();
        const cRelTop = (cRect.top - slideRect.top) / dragScale;
        const cRelBottom = (cRect.bottom - slideRect.top) / dragScale;
        const cRelLeft = (cRect.left - slideRect.left) / dragScale;
        const cRelRight = (cRect.right - slideRect.left) / dragScale;

        if (
          relX >= cRelLeft - 20 &&
          relX <= cRelRight + 20 &&
          relY >= cRelTop - 20 &&
          relY <= cRelBottom + 20
        ) {
          field = "content";
        }
      }

      if (!field) return;

      setSelectedField(field);
      dragFieldRef.current = field;
      dragStartPosRef.current = { x: e.clientX, y: e.clientY };
      setIsDragging(true);

      // Find the DOM element to update directly during drag
      const targetEl = field === "title" ? titleEl : contentEl;

      // Capture these at drag start — closure-safe, no stale refs
      const scale = dragScale;
      const slideIdx = currentSlide;
      const startOffset = { ...editStates[currentSlide][field].offset };

      // Track current offset in a local variable — no setEditStates during drag
      // (calling setEditStates in onMove triggers applyEditorStyles which resets the transform)
      let liveOffset = { ...startOffset };

      const onMove = (ev: PointerEvent) => {
        if (!dragFieldRef.current) return;
        const dx = (ev.clientX - dragStartPosRef.current.x) / scale;
        const dy = (ev.clientY - dragStartPosRef.current.y) / scale;
        liveOffset = { x: startOffset.x + dx, y: startOffset.y + dy };

        // Direct DOM update only — no React state during drag
        if (targetEl) {
          targetEl.style.transform = `translate(${liveOffset.x}px, ${liveOffset.y}px)`;
        }
      };

      const onUp = () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.removeEventListener("pointercancel", onUp);

        const f = dragFieldRef.current;
        dragFieldRef.current = null;
        setIsDragging(false);

        // Commit final position to state once, after drag ends
        if (f) {
          const finalOffset = { ...liveOffset };
          setEditStates((prev) => {
            const next = [...prev];
            next[slideIdx] = {
              ...next[slideIdx],
              [f]: { ...next[slideIdx][f], offset: finalOffset },
            };
            return next;
          });
        }
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onUp);
    },
    [currentSlide, editStates, dragScale]
  );

  const handlePointerUp = useCallback(() => {
    // Fallback cleanup (native listeners handle the primary cleanup)
    dragFieldRef.current = null;
    setIsDragging(false);
  }, []);

  /* ─── Mobile sheet swipe-to-dismiss ─── */

  const handleSheetTouchStart = useCallback((e: React.TouchEvent) => {
    sheetTouchStartY.current = e.touches[0].clientY;
  }, []);

  const handleSheetTouchEnd = useCallback((e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientY - sheetTouchStartY.current;
    if (delta > 60) setMobileSheet(null);
  }, []);

  /* ─── Style updaters ─── */

  const updateFieldStyle = useCallback(
    (field: "title" | "content", updates: Partial<FieldStyle>) => {
      setEditStates((prev) => {
        const next = [...prev];
        next[currentSlide] = {
          ...next[currentSlide],
          [field]: { ...next[currentSlide][field], ...updates },
        };
        return next;
      });
    },
    [currentSlide]
  );

  /* ─── Navigation ─── */

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

  /* ─── Export ─── */

  const handleExport = useCallback(async () => {
    setExporting(true);
    setExported(false);

    try {
      const { toPng } = await import("html-to-image");
      const container = exportContainerRef.current;
      if (!container) return;

      const exportSlides = container.querySelectorAll("[data-export-slide]");
      exportSlides.forEach((el, i) => {
        applyEditorStyles(el as HTMLElement, i);
      });

      // Wait for all Google Fonts to finish loading
      await document.fonts.ready;

      for (let i = 0; i < slides.length; i++) {
        const slideEl = exportSlides[i] as HTMLElement;
        if (!slideEl) continue;

        const dataUrl = await toPng(slideEl, {
          width: slideEl.offsetWidth,
          height: slideEl.offsetHeight,
          pixelRatio: 1,
          skipAutoScale: true,
        });

        const link = document.createElement("a");
        link.download = `slide-${String(i + 1).padStart(2, "0")}.png`;
        link.href = dataUrl;
        link.click();

        if (i < slides.length - 1) {
          await new Promise((r) => setTimeout(r, 300));
        }
      }

      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setExporting(false);
    }
  }, [slides, applyEditorStyles]);

  /* ─── Shared field toggle (used in both mobile sheets) ─── */

  function FieldToggle() {
    return (
      <div className="mb-5">
        <div className="text-xs font-medium text-white/40 mb-2">Выбрано</div>
        <div className="flex gap-1.5 p-1 bg-white/5 rounded-xl">
          {(["title", "content"] as const).map((field) => (
            <button
              key={field}
              onClick={() => setSelectedField(field)}
              className={`field-tab flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                selectedField === field
                  ? "bg-[#D4F542] text-[#0D0D14] shadow-sm"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              {field === "title" ? "Заголовок" : "Контент"}
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ─── Render ─── */

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#0D0D14]"
      style={{ animation: "editorFadeIn 0.3s ease" }}
    >
      <style>{`
        @keyframes editorFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes sheetSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .editor-slide {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .editor-slide:hover {
          transform: translateY(-2px);
        }
        .editor-slide-active {
          box-shadow: 0 8px 32px rgba(212, 245, 66, 0.25);
        }
        .editor-sidebar {
          animation: slideIn 0.3s ease 0.15s both;
        }
        .editor-input {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
        }
        .editor-input:focus {
          outline: none;
          border-color: #D4F542;
          box-shadow: 0 0 0 3px rgba(212, 245, 66, 0.15);
        }
        .editor-input::placeholder { color: rgba(255,255,255,0.25); }
        .editor-drag-cursor {
          cursor: ${isDragging ? "grabbing" : "grab"};
        }
        .field-tab {
          transition: all 0.2s ease;
        }
        .color-swatch {
          transition: all 0.15s ease;
        }
        .editor-input option {
          background: #1a1a28;
          color: #fff;
        }
        .color-swatch:hover {
          transform: scale(1.15);
        }
        input[type=range].lime-range {
          -webkit-appearance: none;
          height: 4px;
          border-radius: 9999px;
          outline: none;
          cursor: pointer;
        }
        input[type=range].lime-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #D4F542;
          cursor: pointer;
          border: 2px solid #0D0D14;
          box-shadow: 0 0 0 2px rgba(212,245,66,0.4);
        }
        @keyframes slideEnterFromRight {
          from { opacity: 0; transform: translateX(60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideEnterFromLeft {
          from { opacity: 0; transform: translateX(-60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* ── Top Bar ── */}
      <header className="h-[60px] bg-[#0D0D14] border-b border-white/8 flex items-center justify-between px-4 md:px-6 shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#D4F542] flex items-center justify-center shrink-0">
            <svg width={16} height={16} viewBox="0 0 32 32" fill="none">
              <path d="M8 10h16M8 16h16M8 22h10" stroke="#0D0D14" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-sm font-bold tracking-tight text-white">
            Swipely<span className="text-white/40 font-normal ml-1 hidden sm:inline">Editor</span>
          </span>
        </div>

        {/* Slide nav */}
        <div className="flex items-center gap-1 md:gap-2">
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/8 transition-all disabled:opacity-25"
            disabled={currentSlide === 0}
            onClick={() => goToSlide(currentSlide - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold tabular-nums min-w-[40px] text-center text-white font-[family-name:var(--font-mono)]">
            {currentSlide + 1}/{slides.length}
          </span>
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/8 transition-all disabled:opacity-25"
            disabled={currentSlide === slides.length - 1}
            onClick={() => goToSlide(currentSlide + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 md:px-5 h-9 rounded-full bg-[#D4F542] hover:bg-[#c8e83a] text-[#0D0D14] text-sm font-semibold transition-all active:scale-[0.97] disabled:opacity-50"
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Экспорт...</span>
              </>
            ) : exported ? (
              <>
                <CheckCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Скачано!</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span className="sm:hidden">PNG</span>
                <span className="hidden sm:inline">Скачать PNG</span>
              </>
            )}
          </button>
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/8 transition-all"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ── Main Area ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Desktop: slide strip (hidden on mobile) ── */}
        <div className="hidden md:flex flex-1 flex-col overflow-hidden">
          <div
            ref={slideStripRef}
            className="flex-1 flex items-center gap-5 px-8 overflow-x-auto"
            style={{
              scrollSnapType: "x mandatory",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {slides.map((slide, i) => {
              const isActive = i === currentSlide;
              const scale = isActive ? activeScale : thumbScale;

              return (
                <div
                  key={i}
                  className={`editor-slide shrink-0 rounded-xl overflow-hidden cursor-pointer relative ${
                    isActive ? "editor-slide-active" : "opacity-50 hover:opacity-80"
                  }`}
                  style={{
                    border: isActive
                      ? "2px solid #D4F542"
                      : "2px solid rgba(255,255,255,0.08)",
                    scrollSnapAlign: "center",
                  }}
                  onClick={() => goToSlide(i)}
                >
                  <div
                    key={isActive ? slideKey : undefined}
                    ref={isActive && !isMobile ? activeSlideRef : undefined}
                    className={isActive ? "editor-drag-cursor" : ""}
                    onPointerDown={isActive ? handlePointerDown : undefined}
                    onPointerUp={isActive ? handlePointerUp : undefined}
                    onPointerCancel={isActive ? handlePointerUp : undefined}
                    style={{
                      touchAction: "none",
                      animation: isActive
                        ? `${slideDirection === "forward" ? "slideEnterFromRight" : "slideEnterFromLeft"} 0.22s ease-out`
                        : undefined,
                    }}
                  >
                    <SlideRenderer
                      template={template}
                      scale={scale}
                      slide={slide}
                      slideNumber={i + 1}
                      totalSlides={slides.length}
                      format={format}
                    />
                  </div>

                  <div
                    className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold tabular-nums"
                    style={{
                      background: isActive ? "#D4F542" : "rgba(0,0,0,0.5)",
                      color: isActive ? "#0D0D14" : "#fff",
                    }}
                  >
                    {i + 1}/{slides.length}
                  </div>

                  {isActive && !isDragging && (
                    <div
                      className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-medium whitespace-nowrap"
                      style={{
                        background: "rgba(212, 245, 66, 0.9)",
                        color: "#0D0D14",
                        backdropFilter: "blur(8px)",
                        animation: "editorFadeIn 0.3s ease",
                      }}
                    >
                      <GripVertical className="h-3 w-3" />
                      Перетаскивай текст
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Mobile: single slide centered (hidden on desktop) ── */}
        <div
          className="md:hidden flex-1 flex flex-col items-center justify-center px-4"
          style={{
            paddingBottom: mobileSheet ? "290px" : "0px",
            transition: "padding-bottom 0.35s cubic-bezier(0.4,0,0.2,1)",
          }}
          onClick={() => mobileSheet && setMobileSheet(null)}
        >
          {/* Slide with scale-down animation when sheet opens */}
          <div
            style={{
              transform: mobileSheet ? "scale(0.82) translateY(-12px)" : "scale(1) translateY(0)",
              transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
              transformOrigin: "center center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Inner wrapper: slide enter animation (separate from scale transform) */}
            <div
              key={slideKey}
              style={{
                animation: `${slideDirection === "forward" ? "slideEnterFromRight" : "slideEnterFromLeft"} 0.22s ease-out`,
              }}
            >
              <div
                ref={isMobile ? activeSlideRef : undefined}
                className={`rounded-xl overflow-hidden editor-drag-cursor`}
                style={{
                  border: "2px solid #D4F542",
                  boxShadow: "0 8px 40px rgba(212, 245, 66, 0.18)",
                  touchAction: "none",
                }}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <SlideRenderer
                  template={template}
                  scale={mobileSlideScale}
                  slide={slides[currentSlide]}
                  slideNumber={currentSlide + 1}
                  totalSlides={slides.length}
                  format={format}
                />
              </div>
            </div>
          </div>

          {/* Dot navigation */}
          <div
            className="flex gap-1.5 mt-4"
            style={{
              transform: mobileSheet ? "scale(0.82)" : "scale(1)",
              transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
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

        {/* ── Desktop: Right Sidebar (hidden on mobile) ── */}
        <aside className="editor-sidebar hidden md:block w-[300px] bg-[#111118] border-l border-white/8 p-5 overflow-y-auto shrink-0">
          <h2 className="text-sm font-bold mb-5 text-white">Редактирование</h2>

          {/* Field toggle */}
          <div className="mb-5">
            <div className="text-xs font-medium text-white/40 mb-2">Выбрано</div>
            <div className="flex gap-1.5 p-1 bg-white/5 rounded-xl">
              {(["title", "content"] as const).map((field) => (
                <button
                  key={field}
                  onClick={() => setSelectedField(field)}
                  className={`field-tab flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                    selectedField === field
                      ? "bg-[#D4F542] text-[#0D0D14] shadow-sm"
                      : "text-white/50 hover:text-white/80"
                  }`}
                >
                  {field === "title" ? "Заголовок" : "Контент"}
                </button>
              ))}
            </div>
          </div>

          {/* Text input */}
          <div className="mb-5">
            <div className="text-xs font-medium text-white/40 mb-2">
              {selectedField === "title" ? "Заголовок" : "Текст слайда"}
            </div>
            {selectedField === "title" ? (
              <textarea
                value={slides[currentSlide].title}
                onChange={(e) => onUpdateSlide(currentSlide, "title", e.target.value)}
                rows={2}
                className="editor-input w-full rounded-xl p-3 text-sm resize-none"
              />
            ) : (
              <textarea
                value={slides[currentSlide].content}
                onChange={(e) => onUpdateSlide(currentSlide, "content", e.target.value)}
                rows={4}
                className="editor-input w-full rounded-xl p-3 text-sm resize-none"
              />
            )}
          </div>

          {/* Font size */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-white/40">Размер</span>
              <span className="text-xs tabular-nums text-white/60 font-[family-name:var(--font-mono)]">
                {currentState[selectedField].fontSize}px
              </span>
            </div>
            <input
              type="range"
              min={16}
              max={120}
              value={currentState[selectedField].fontSize}
              onChange={(e) => updateFieldStyle(selectedField, { fontSize: Number(e.target.value) })}
              className="lime-range w-full"
              style={{
                background: `linear-gradient(to right, #D4F542 ${
                  ((currentState[selectedField].fontSize - 16) / (120 - 16)) * 100
                }%, rgba(255,255,255,0.1) ${
                  ((currentState[selectedField].fontSize - 16) / (120 - 16)) * 100
                }%)`,
              }}
            />
          </div>

          {/* Font family */}
          <div className="mb-5">
            <div className="text-xs font-medium text-white/40 mb-2">Шрифт</div>
            <select
              value={currentState[selectedField].fontFamily}
              onChange={(e) => {
                loadGoogleFont(e.target.value);
                updateFieldStyle(selectedField, { fontFamily: e.target.value });
              }}
              className="editor-input w-full rounded-xl px-3 py-2 text-sm appearance-none cursor-pointer"
            >
              <option value="">— По умолчанию —</option>
              {GOOGLE_FONTS.map((f) => (
                <option key={f.name} value={f.name}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Alignment */}
          <div className="mb-5">
            <div className="text-xs font-medium text-white/40 mb-2">Выравнивание</div>
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
              {(
                [
                  { val: "left", icon: AlignLeft },
                  { val: "center", icon: AlignCenter },
                  { val: "right", icon: AlignRight },
                  { val: "justify", icon: AlignJustify },
                ] as const
              ).map(({ val, icon: Icon }) => (
                <button
                  key={val}
                  onClick={() =>
                    updateFieldStyle(selectedField, {
                      textAlign: val === "justify" ? "left" : val as "left" | "center" | "right",
                    })
                  }
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center transition-all ${
                    currentState[selectedField].textAlign === val
                      ? "bg-[#D4F542] text-[#0D0D14]"
                      : "text-white/40 hover:text-white/80 hover:bg-white/8"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="mb-5">
            <div className="text-xs font-medium text-white/40 mb-2">Цвет текста</div>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => updateFieldStyle(selectedField, { color })}
                  className="color-swatch w-9 h-9 rounded-xl border-2 transition-all"
                  style={{
                    backgroundColor: color,
                    borderColor:
                      currentState[selectedField].color === color
                        ? "#D4F542"
                        : color === "#FFFFFF"
                          ? "rgba(255,255,255,0.15)"
                          : "transparent",
                    boxShadow:
                      currentState[selectedField].color === color
                        ? "0 0 0 2px rgba(212,245,66,0.4)"
                        : "none",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="h-px bg-white/8 my-5" />

          {/* Post caption */}
          <div className="mb-5">
            <div className="text-xs font-medium text-white/40 mb-2">Подпись к посту</div>
            <textarea
              value={postCaption}
              onChange={(e) => onUpdateCaption(e.target.value)}
              rows={5}
              className="editor-input w-full rounded-xl p-3 text-sm resize-none"
            />
          </div>

          <p className="text-xs text-white/25 leading-relaxed">
            Перетаскивайте текст на активном слайде для изменения позиции
          </p>
          <div className="h-px bg-white/8 my-4" />
          <button
            onClick={() => setShowTemplateSwitcher(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 text-sm font-semibold text-white/70 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all active:scale-[0.98]"
          >
            <Layers className="h-4 w-4" />
            Сменить шаблон
          </button>
        </aside>
      </div>

      {/* ── Mobile: Bottom Tab Bar ── */}
      <div className="md:hidden h-[60px] bg-[#0D0D14] border-t border-white/8 flex items-stretch shrink-0">
        {MOBILE_TABS.map(({ id, label, icon: Icon }) => {
          const isActive = mobileSheet === id;
          return (
            <button
              key={id}
              onClick={() => setMobileSheet(isActive ? null : id)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors"
              style={{ color: isActive ? "#D4F542" : "rgba(255,255,255,0.4)" }}
            >
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
                  style={{ width: 32, height: 2, background: "#D4F542" }}
                />
              )}
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold">{label}</span>
            </button>
          );
        })}
        {/* Template switcher tab */}
        <button
          onClick={() => setShowTemplateSwitcher(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          <Layers className="h-5 w-5" />
          <span className="text-[10px] font-semibold">Шаблон</span>
        </button>
      </div>

      {/* ── Mobile: Bottom Sheet Overlay ── */}
      <div
        className="md:hidden fixed inset-0"
        style={{ zIndex: 60, pointerEvents: mobileSheet ? "auto" : "none" }}
      >
        {/* Backdrop — tap outside to close */}
        {mobileSheet && (
          <div
            className="absolute inset-0"
            onClick={() => setMobileSheet(null)}
          />
        )}

        {/* Sheet */}
        {mobileSheet && (
          <div
            className="absolute left-0 right-0 bg-[#111118] rounded-t-2xl border-t border-white/8 flex flex-col"
            style={{
              bottom: 60,
              maxHeight: "62vh",
              animation: "sheetSlideUp 0.32s cubic-bezier(0.4,0,0.2,1)",
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleSheetTouchStart}
            onTouchEnd={handleSheetTouchEnd}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-8 h-1 rounded-full bg-white/20" />
            </div>

            {/* Sheet title */}
            <div className="px-5 pt-1 pb-3 shrink-0 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                {mobileSheet === "text" && "Текст"}
                {mobileSheet === "position" && "Позиция"}
                {mobileSheet === "caption" && "Подпись к посту"}
              </h3>
              <button
                onClick={() => setMobileSheet(null)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Sheet content */}
            <div className="overflow-y-auto px-5 pb-6 flex-1">

              {/* ── Текст sheet ── */}
              {mobileSheet === "text" && (
                <>
                  <FieldToggle />

                  <div className="mb-5">
                    <div className="text-xs font-medium text-white/40 mb-2">
                      {selectedField === "title" ? "Заголовок" : "Текст слайда"}
                    </div>
                    {selectedField === "title" ? (
                      <textarea
                        value={slides[currentSlide].title}
                        onChange={(e) => onUpdateSlide(currentSlide, "title", e.target.value)}
                        rows={2}
                        className="editor-input w-full rounded-xl p-3 text-sm resize-none"
                      />
                    ) : (
                      <textarea
                        value={slides[currentSlide].content}
                        onChange={(e) => onUpdateSlide(currentSlide, "content", e.target.value)}
                        rows={3}
                        className="editor-input w-full rounded-xl p-3 text-sm resize-none"
                      />
                    )}
                  </div>

                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-white/40">Размер</span>
                      <span className="text-xs tabular-nums text-white/60 font-[family-name:var(--font-mono)]">
                        {currentState[selectedField].fontSize}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={16}
                      max={120}
                      value={currentState[selectedField].fontSize}
                      onChange={(e) => updateFieldStyle(selectedField, { fontSize: Number(e.target.value) })}
                      className="lime-range w-full"
                      style={{
                        background: `linear-gradient(to right, #D4F542 ${
                          ((currentState[selectedField].fontSize - 16) / (120 - 16)) * 100
                        }%, rgba(255,255,255,0.1) ${
                          ((currentState[selectedField].fontSize - 16) / (120 - 16)) * 100
                        }%)`,
                      }}
                    />
                  </div>

                  <div className="mb-5">
                    <div className="text-xs font-medium text-white/40 mb-2">Шрифт</div>
                    <select
                      value={currentState[selectedField].fontFamily}
                      onChange={(e) => {
                        loadGoogleFont(e.target.value);
                        updateFieldStyle(selectedField, { fontFamily: e.target.value });
                      }}
                      className="editor-input w-full rounded-xl px-3 py-2 text-sm appearance-none cursor-pointer"
                    >
                      <option value="">— По умолчанию —</option>
                      {GOOGLE_FONTS.map((f) => (
                        <option key={f.name} value={f.name}>{f.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-white/40 mb-2">Цвет текста</div>
                    <div className="flex gap-3 flex-wrap">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => updateFieldStyle(selectedField, { color })}
                          className="color-swatch w-10 h-10 rounded-xl border-2 transition-all"
                          style={{
                            backgroundColor: color,
                            borderColor:
                              currentState[selectedField].color === color
                                ? "#D4F542"
                                : color === "#FFFFFF"
                                  ? "rgba(255,255,255,0.15)"
                                  : "transparent",
                            boxShadow:
                              currentState[selectedField].color === color
                                ? "0 0 0 2px rgba(212,245,66,0.4)"
                                : "none",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── Позиция sheet ── */}
              {mobileSheet === "position" && (
                <>
                  <FieldToggle />

                  <div className="mb-5">
                    <div className="text-xs font-medium text-white/40 mb-2">Выравнивание</div>
                    <div className="flex gap-1.5 p-1.5 bg-white/5 rounded-xl">
                      {(
                        [
                          { val: "left", icon: AlignLeft },
                          { val: "center", icon: AlignCenter },
                          { val: "right", icon: AlignRight },
                          { val: "justify", icon: AlignJustify },
                        ] as const
                      ).map(({ val, icon: Icon }) => (
                        <button
                          key={val}
                          onClick={() =>
                            updateFieldStyle(selectedField, {
                              textAlign: val === "justify" ? "left" : val as "left" | "center" | "right",
                            })
                          }
                          className={`flex-1 py-3 rounded-lg flex items-center justify-center transition-all ${
                            currentState[selectedField].textAlign === val
                              ? "bg-[#D4F542] text-[#0D0D14]"
                              : "text-white/40 hover:text-white/80 hover:bg-white/8"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 text-xs text-white/40 leading-relaxed">
                    <GripVertical className="h-4 w-4 shrink-0 mt-0.5 opacity-60" />
                    <span>Закрой это меню и перетащи текст прямо на слайде для изменения позиции</span>
                  </div>
                </>
              )}

              {/* ── Подпись sheet ── */}
              {mobileSheet === "caption" && (
                <div>
                  <textarea
                    value={postCaption}
                    onChange={(e) => onUpdateCaption(e.target.value)}
                    rows={7}
                    className="editor-input w-full rounded-xl p-3 text-sm resize-none"
                    placeholder="Текст подписи к посту..."
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Hidden export renders ── */}
      <div
        ref={exportContainerRef}
        style={{
          position: "fixed",
          left: -9999,
          top: 0,
          opacity: 0,
          pointerEvents: "none",
        }}
      >
        {slides.map((slide, i) => (
          <div key={i} data-export-slide>
            <SlideRenderer
              template={template}
              scale={1}
              slide={slide}
              slideNumber={i + 1}
              totalSlides={slides.length}
              format={format}
            />
          </div>
        ))}
      </div>
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
          isPro={isPro}
        />
      )}
    </div>
  );
}
