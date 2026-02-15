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
}

export default function ExportPanel({
  slides,
  template,
  format,
  username,
}: ExportPanelProps) {
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const exportSlides = useCallback(async () => {
    setExporting(true);
    setExported(false);

    try {
      // Dynamic import — html2canvas loaded only on export
      const html2canvas = (await import("html2canvas")).default;

      const container = containerRef.current;
      if (!container) return;

      // Render each slide at full resolution
      for (let i = 0; i < slides.length; i++) {
        // Create temporary off-screen element at full resolution
        const wrapper = document.createElement("div");
        wrapper.style.position = "fixed";
        wrapper.style.left = "-9999px";
        wrapper.style.top = "0";
        document.body.appendChild(wrapper);

        // Render slide at full size (1080px)
        const slideEl = document.createElement("div");
        const width = 1080;
        const height = format === "square" ? 1080 : 1350;
        slideEl.style.width = `${width}px`;
        slideEl.style.height = `${height}px`;
        wrapper.appendChild(slideEl);

        // Use html2canvas on the hidden full-res preview
        // We need to find the actual rendered slide in the hidden container
        // Instead, capture from the visible previews scaled up
        const previewSlides = container.querySelectorAll("[data-slide-export]");
        if (previewSlides[i]) {
          const canvas = await html2canvas(previewSlides[i] as HTMLElement, {
            scale: 1080 / (previewSlides[i] as HTMLElement).offsetWidth,
            useCORS: true,
            backgroundColor: null,
            width: (previewSlides[i] as HTMLElement).offsetWidth,
            height: (previewSlides[i] as HTMLElement).offsetHeight,
          });

          // Download
          const link = document.createElement("a");
          link.download = `slide-${String(i + 1).padStart(2, "0")}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
        }

        document.body.removeChild(wrapper);

        // Small delay between downloads
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
      <div ref={containerRef} className="sr-only" aria-hidden="true">
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
