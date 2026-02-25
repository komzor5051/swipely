"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import SlideRenderer from "@/components/slides/SlideRenderer";
import type { SlideData } from "@/components/slides/types";

/* ─── Types ─── */

interface Slide extends SlideData {
  type: string;
}

interface FieldStyle {
  offset: { x: number; y: number };
  fontSize: number;
  color: string;
  textAlign: "left" | "center" | "right";
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

const DEFAULT_TITLE_STYLE: FieldStyle = {
  offset: { x: 0, y: 0 },
  fontSize: 82,
  color: "",
  textAlign: "left",
};

const DEFAULT_CONTENT_STYLE: FieldStyle = {
  offset: { x: 0, y: 0 },
  fontSize: 34,
  color: "",
  textAlign: "left",
};

/* ─── Component ─── */

export default function CarouselEditor({
  slides,
  template,
  format,
  postCaption,
  onUpdateSlide,
  onUpdateCaption,
  onClose,
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

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const dragFieldRef = useRef<"title" | "content" | null>(null);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const dragStartOffsetRef = useRef({ x: 0, y: 0 });

  // Refs
  const activeSlideRef = useRef<HTMLDivElement>(null);
  const slideStripRef = useRef<HTMLDivElement>(null);
  const exportContainerRef = useRef<HTMLDivElement>(null);

  // Scale for the active slide
  const dims =
    format === "square"
      ? { width: 1080, height: 1080 }
      : { width: 1080, height: 1350 };
  const activeScale = 0.38;
  const thumbScale = 0.18;

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
      }
      if (contentEl) {
        contentEl.style.transform = `translate(${state.content.offset.x}px, ${state.content.offset.y}px)`;
        if (state.content.color) contentEl.style.color = state.content.color;
        if (state.content.fontSize !== DEFAULT_CONTENT_STYLE.fontSize) {
          contentEl.style.fontSize = `${state.content.fontSize}px`;
        }
        contentEl.style.textAlign = state.content.textAlign;
      }
    },
    [editStates]
  );

  // Apply styles whenever state changes
  useEffect(() => {
    applyEditorStyles(activeSlideRef.current, currentSlide);
  }, [editStates, currentSlide, applyEditorStyles, slides]);

  /* ─── Drag handlers ─── */

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!activeSlideRef.current) return;

      const slideRect = activeSlideRef.current.getBoundingClientRect();
      const relX = (e.clientX - slideRect.left) / activeScale;
      const relY = (e.clientY - slideRect.top) / activeScale;

      // Find which element was clicked
      const titleEl = activeSlideRef.current.querySelector(
        "h1, h2"
      ) as HTMLElement | null;
      const contentEl = activeSlideRef.current.querySelector(
        "p"
      ) as HTMLElement | null;

      let field: "title" | "content" | null = null;

      // Check title bounds (with some padding)
      if (titleEl) {
        const titleRect = titleEl.getBoundingClientRect();
        const tRelTop = (titleRect.top - slideRect.top) / activeScale;
        const tRelBottom = (titleRect.bottom - slideRect.top) / activeScale;
        const tRelLeft = (titleRect.left - slideRect.left) / activeScale;
        const tRelRight = (titleRect.right - slideRect.left) / activeScale;

        if (
          relX >= tRelLeft - 20 &&
          relX <= tRelRight + 20 &&
          relY >= tRelTop - 20 &&
          relY <= tRelBottom + 20
        ) {
          field = "title";
        }
      }

      // Check content bounds
      if (!field && contentEl) {
        const cRect = contentEl.getBoundingClientRect();
        const cRelTop = (cRect.top - slideRect.top) / activeScale;
        const cRelBottom = (cRect.bottom - slideRect.top) / activeScale;
        const cRelLeft = (cRect.left - slideRect.left) / activeScale;
        const cRelRight = (cRect.right - slideRect.left) / activeScale;

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
      dragStartOffsetRef.current = {
        ...editStates[currentSlide][field].offset,
      };
      setIsDragging(true);

      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [currentSlide, editStates, activeScale]
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDragging || !dragFieldRef.current) return;

      const dx = (e.clientX - dragStartPosRef.current.x) / activeScale;
      const dy = (e.clientY - dragStartPosRef.current.y) / activeScale;

      setEditStates((prev) => {
        const next = [...prev];
        const field = dragFieldRef.current!;
        next[currentSlide] = {
          ...next[currentSlide],
          [field]: {
            ...next[currentSlide][field],
            offset: {
              x: dragStartOffsetRef.current.x + dx,
              y: dragStartOffsetRef.current.y + dy,
            },
          },
        };
        return next;
      });
    },
    [isDragging, currentSlide, activeScale]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    dragFieldRef.current = null;
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
      setCurrentSlide(index);
      // Scroll strip to show the slide
      if (slideStripRef.current) {
        const child = slideStripRef.current.children[index] as HTMLElement;
        child?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    },
    [slides.length]
  );

  /* ─── Export ─── */

  const handleExport = useCallback(async () => {
    setExporting(true);
    setExported(false);

    try {
      const html2canvas = (await import("html2canvas")).default;
      const container = exportContainerRef.current;
      if (!container) return;

      // Apply editor styles to hidden export elements
      const exportSlides = container.querySelectorAll("[data-export-slide]");
      exportSlides.forEach((el, i) => {
        applyEditorStyles(el as HTMLElement, i);
      });

      // Wait for fonts to load
      await new Promise((r) => setTimeout(r, 200));

      for (let i = 0; i < slides.length; i++) {
        const slideEl = exportSlides[i] as HTMLElement;
        if (!slideEl) continue;

        const canvas = await html2canvas(slideEl, {
          scale: 1080 / slideEl.offsetWidth,
          useCORS: true,
          backgroundColor: null,
          width: slideEl.offsetWidth,
          height: slideEl.offsetHeight,
        });

        const link = document.createElement("a");
        link.download = `slide-${String(i + 1).padStart(2, "0")}.png`;
        link.href = canvas.toDataURL("image/png");
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

  /* ─── Render ─── */

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#F5F5F7] dark:bg-[#1a1a1a]"
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
        .editor-slide {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .editor-slide:hover {
          transform: translateY(-2px);
        }
        .editor-slide-active {
          box-shadow: 0 8px 32px rgba(10, 132, 255, 0.2);
        }
        .editor-sidebar {
          animation: slideIn 0.3s ease 0.15s both;
        }
        .editor-input:focus {
          box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.15);
        }
        .editor-drag-cursor {
          cursor: ${isDragging ? "grabbing" : "grab"};
        }
        .field-tab {
          transition: all 0.2s ease;
        }
        .color-swatch {
          transition: all 0.15s ease;
        }
        .color-swatch:hover {
          transform: scale(1.15);
        }
      `}</style>

      {/* ── Top Bar ── */}
      <header className="h-[60px] bg-white dark:bg-[#222] border-b border-border flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #0A84FF, #0066CC)" }}
          >
            <svg
              width={16}
              height={16}
              viewBox="0 0 32 32"
              fill="none"
            >
              <path
                d="M8 10h16M8 16h16M8 22h10"
                stroke="#fff"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="text-sm font-bold tracking-tight">
            Swipely Editor
          </span>
        </div>

        {/* Slide nav */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full"
            disabled={currentSlide === 0}
            onClick={() => goToSlide(currentSlide - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold tabular-nums min-w-[40px] text-center">
            {currentSlide + 1}/{slides.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full"
            disabled={currentSlide === slides.length - 1}
            onClick={() => goToSlide(currentSlide + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleExport}
            disabled={exporting}
            size="sm"
            className="rounded-full bg-[var(--swipely-blue)] hover:bg-[var(--swipely-blue-dark)] gap-2 px-5"
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Экспорт...
              </>
            ) : exported ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Скачано!
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Скачать PNG
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* ── Main Area ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Slide strip + active preview */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Slide strip */}
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
                    isActive ? "editor-slide-active" : "opacity-70 hover:opacity-90"
                  }`}
                  style={{
                    border: isActive
                      ? "3px solid var(--swipely-blue)"
                      : "2px solid transparent",
                    scrollSnapAlign: "center",
                  }}
                  onClick={() => goToSlide(i)}
                >
                  {/* Slide render */}
                  <div
                    ref={isActive ? activeSlideRef : undefined}
                    className={isActive ? "editor-drag-cursor" : ""}
                    onPointerDown={isActive ? handlePointerDown : undefined}
                    onPointerMove={isActive ? handlePointerMove : undefined}
                    onPointerUp={isActive ? handlePointerUp : undefined}
                    style={{ touchAction: "none" }}
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

                  {/* Slide number badge */}
                  <div
                    className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold tabular-nums"
                    style={{
                      background: isActive
                        ? "var(--swipely-blue)"
                        : "rgba(0,0,0,0.4)",
                      color: "#fff",
                    }}
                  >
                    {i + 1}/{slides.length}
                  </div>

                  {/* Drag hint on active */}
                  {isActive && !isDragging && (
                    <div
                      className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-medium"
                      style={{
                        background: "rgba(10, 132, 255, 0.85)",
                        color: "#fff",
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

        {/* ── Right Sidebar ── */}
        <aside className="editor-sidebar w-[320px] bg-white dark:bg-[#222] border-l border-border p-6 overflow-y-auto shrink-0">
          <h2 className="text-base font-bold mb-5">Редактирование</h2>

          {/* Field toggle */}
          <div className="mb-5">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Выбрано
            </div>
            <div className="flex gap-2">
              {(["title", "content"] as const).map((field) => (
                <button
                  key={field}
                  onClick={() => setSelectedField(field)}
                  className={`field-tab flex-1 py-2 rounded-lg text-sm font-semibold ${
                    selectedField === field
                      ? "bg-[var(--swipely-blue)] text-white shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {field === "title" ? "Заголовок" : "Контент"}
                </button>
              ))}
            </div>
          </div>

          {/* Text input */}
          <div className="mb-5">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              {selectedField === "title" ? "Заголовок" : "Текст слайда"}
            </div>
            {selectedField === "title" ? (
              <input
                type="text"
                value={slides[currentSlide].title}
                onChange={(e) =>
                  onUpdateSlide(currentSlide, "title", e.target.value)
                }
                className="editor-input w-full rounded-lg border border-border bg-background p-3 text-sm focus:outline-none focus:border-[var(--swipely-blue)] transition-all"
              />
            ) : (
              <textarea
                value={slides[currentSlide].content}
                onChange={(e) =>
                  onUpdateSlide(currentSlide, "content", e.target.value)
                }
                rows={4}
                className="editor-input w-full rounded-lg border border-border bg-background p-3 text-sm resize-none focus:outline-none focus:border-[var(--swipely-blue)] transition-all"
              />
            )}
          </div>

          {/* Font size */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                Размер
              </span>
              <span className="text-xs font-mono tabular-nums text-muted-foreground">
                {currentState[selectedField].fontSize}px
              </span>
            </div>
            <input
              type="range"
              min={16}
              max={120}
              value={currentState[selectedField].fontSize}
              onChange={(e) =>
                updateFieldStyle(selectedField, {
                  fontSize: Number(e.target.value),
                })
              }
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--swipely-blue) ${
                  ((currentState[selectedField].fontSize - 16) / (120 - 16)) *
                  100
                }%, #e5e5e5 ${
                  ((currentState[selectedField].fontSize - 16) / (120 - 16)) *
                  100
                }%)`,
              }}
            />
          </div>

          {/* Alignment */}
          <div className="mb-5">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Выравнивание
            </div>
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
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
                  className={`flex-1 py-2 rounded-md flex items-center justify-center transition-all ${
                    currentState[selectedField].textAlign === val ||
                    (val === "justify" && false)
                      ? "bg-white dark:bg-[#333] shadow-sm"
                      : "hover:bg-white/50 dark:hover:bg-[#333]/50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="mb-5">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Цвет текста
            </div>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() =>
                    updateFieldStyle(selectedField, { color })
                  }
                  className="color-swatch w-9 h-9 rounded-lg border-2 transition-all"
                  style={{
                    backgroundColor: color,
                    borderColor:
                      currentState[selectedField].color === color
                        ? "var(--swipely-blue)"
                        : color === "#FFFFFF"
                          ? "#e5e5e5"
                          : "transparent",
                    boxShadow:
                      currentState[selectedField].color === color
                        ? "0 0 0 2px rgba(10, 132, 255, 0.3)"
                        : "none",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="h-px bg-border my-5" />

          {/* Post caption */}
          <div className="mb-5">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Подпись к посту
            </div>
            <textarea
              value={postCaption}
              onChange={(e) => onUpdateCaption(e.target.value)}
              rows={5}
              className="editor-input w-full rounded-lg border border-border bg-background p-3 text-sm resize-none focus:outline-none focus:border-[var(--swipely-blue)] transition-all"
            />
          </div>

          {/* Hint */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            Перетаскивайте текст на активном слайде для изменения позиции
          </p>
        </aside>
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
    </div>
  );
}
