import { useState, useRef } from 'react';
import { renderTemplate } from '../templates';
import { FORMAT_SIZES, type Slide } from '../types';

declare global {
  interface Window {
    html2canvas: (
      element: HTMLElement,
      options?: {
        scale?: number;
        useCORS?: boolean;
        allowTaint?: boolean;
        backgroundColor?: string;
      }
    ) => Promise<HTMLCanvasElement>;
  }
}

interface ExportButtonProps {
  slides: Slide[];
  stylePreset: string;
  format: 'square' | 'portrait';
  username?: string;
}

export default function ExportButton({
  slides,
  stylePreset,
  format,
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  async function exportSlides() {
    if (exporting) return;

    setExporting(true);
    setProgress(0);

    const { width, height } = FORMAT_SIZES[format];

    try {
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        setProgress(Math.round(((i + 0.5) / slides.length) * 100));

        // Create temporary container for rendering
        const container = document.createElement('div');
        container.style.cssText = `
          position: fixed;
          top: -9999px;
          left: -9999px;
          width: ${width}px;
          height: ${height}px;
          overflow: hidden;
          z-index: -1;
        `;
        document.body.appendChild(container);

        // Create iframe for slide
        const iframe = document.createElement('iframe');
        iframe.style.cssText = `
          width: ${width}px;
          height: ${height}px;
          border: none;
        `;
        container.appendChild(iframe);

        // Write HTML to iframe
        const html = renderTemplate(stylePreset, {
          title: slide.title,
          content: slide.content,
          slideNumber: i + 1,
          totalSlides: slides.length,
          width,
          height,
        });

        if (!html) continue;

        const doc = iframe.contentDocument;
        if (!doc) continue;

        doc.open();
        doc.write(html);
        doc.close();

        // Wait for fonts and resources to load
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Capture with html2canvas
        if (window.html2canvas && doc.body) {
          const canvas = await window.html2canvas(doc.body, {
            scale: 2, // 2x for retina quality
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
          });

          // Download PNG
          const link = document.createElement('a');
          link.download = `slide-${i + 1}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();

          // Delay between downloads
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        // Cleanup
        document.body.removeChild(container);

        setProgress(Math.round(((i + 1) / slides.length) * 100));
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Ошибка при экспорте. Попробуйте еще раз.');
    } finally {
      setExporting(false);
      setProgress(0);
    }
  }

  return (
    <>
      <button
        onClick={exportSlides}
        disabled={exporting}
        className={`
          btn-primary flex items-center gap-2
          ${exporting ? 'opacity-75 cursor-wait' : ''}
        `}
      >
        {exporting ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Экспорт... {progress}%</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>Скачать PNG</span>
          </>
        )}
      </button>

      {/* Hidden container for rendering */}
      <div ref={containerRef} className="hidden" />
    </>
  );
}
