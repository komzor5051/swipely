"use client";

import { useState, useRef, useCallback } from "react";
import { Download, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import SlideRenderer from "@/components/slides/SlideRenderer";
import type { SlideData } from "@/components/slides/types";

interface ExportPanelProps {
  slides: SlideData[];
  template: string;
  format: "square" | "portrait";
  username?: string;
  showWatermark?: boolean;
}

export default function ExportPanel({
  slides,
  template,
  format,
  username,
  showWatermark = false,
}: ExportPanelProps) {
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const exportSlides = useCallback(async () => {
    setExporting(true);
    setExported(false);

    try {
      const { toPng } = await import("html-to-image");

      const container = containerRef.current;
      if (!container) return;

      // Wait for all Google Fonts to finish loading
      await document.fonts.ready;

      const previewSlides = container.querySelectorAll("[data-slide-export]");

      for (let i = 0; i < slides.length; i++) {
        if (previewSlides[i]) {
          const el = previewSlides[i] as HTMLElement;
          const dataUrl = await toPng(el, {
            width: el.offsetWidth,
            height: el.offsetHeight,
            pixelRatio: 1,
            skipAutoScale: true,
          });

          const link = document.createElement("a");
          link.download = `slide-${String(i + 1).padStart(2, "0")}.png`;
          link.href = dataUrl;
          link.click();
        }

        if (i < slides.length - 1) {
          await new Promise((r) => setTimeout(r, 300));
        }
      }

      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  }, [slides, format]);

  return (
    <div className="space-y-4">
      {/* Hidden full-resolution slide renders for export */}
      <div
        ref={containerRef}
        aria-hidden="true"
        style={{ position: "fixed", left: "-9999px", top: 0 }}
      >
        {slides.map((slide, i) => (
          <div key={i} data-slide-export>
            <SlideRenderer
              template={template}
              scale={1}
              slide={slide}
              slideNumber={i + 1}
              totalSlides={slides.length}
              format={format}
              username={username}
              showWatermark={showWatermark}
            />
          </div>
        ))}
      </div>

      {/* Export button */}
      <Button
        onClick={exportSlides}
        disabled={exporting}
        size="lg"
        className="rounded-full bg-[var(--swipely-blue)] hover:bg-[var(--swipely-blue-dark)]"
      >
        {exporting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Экспорт ({slides.length} слайдов)...
          </>
        ) : exported ? (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Скачано!
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Скачать PNG ({slides.length} слайдов)
          </>
        )}
      </Button>
    </div>
  );
}
