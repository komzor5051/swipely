import { useRef, useEffect, useCallback } from 'react';
import { renderTemplate } from '../templates';
import { FORMAT_SIZES, type Slide } from '../types';

interface SlideCanvasProps {
  slide: Slide;
  slideIndex: number;
  totalSlides: number;
  stylePreset: string;
  format: 'square' | 'portrait';
  username?: string;
  onUpdate: (slide: Slide) => void;
}

export default function SlideCanvas({
  slide,
  slideIndex,
  totalSlides,
  stylePreset,
  format,
  onUpdate,
}: SlideCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { width, height } = FORMAT_SIZES[format];

  // Scale for preview (fit in viewport)
  const scale = 0.5;
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;

  const updateSlideContent = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument) return;

    const doc = iframe.contentDocument;

    // Get current text from contenteditable elements
    const headlineEl = doc.querySelector('.headline');
    const contentEl = doc.querySelector('.content');

    const newTitle = headlineEl?.textContent || slide.title;
    const newContent = contentEl?.textContent || slide.content;

    // Only update if changed
    if (newTitle !== slide.title || newContent !== slide.content) {
      onUpdate({
        ...slide,
        title: newTitle,
        content: newContent,
      });
    }
  }, [slide, onUpdate]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const html = renderTemplate(stylePreset, {
      title: slide.title,
      content: slide.content,
      slideNumber: slideIndex + 1,
      totalSlides,
      width,
      height,
    });

    if (!html) return;

    // Write HTML to iframe
    const doc = iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(html);
    doc.close();

    // Make headline and content editable after load
    iframe.onload = () => {
      const iframeDoc = iframe.contentDocument;
      if (!iframeDoc) return;

      const headlineEl = iframeDoc.querySelector('.headline');
      const contentEl = iframeDoc.querySelector('.content');

      if (headlineEl) {
        headlineEl.setAttribute('contenteditable', 'true');
        headlineEl.setAttribute('style', (headlineEl.getAttribute('style') || '') + '; outline: none; cursor: text;');

        headlineEl.addEventListener('blur', updateSlideContent);
        headlineEl.addEventListener('input', () => {
          // Visual feedback on edit
        });
      }

      if (contentEl) {
        contentEl.setAttribute('contenteditable', 'true');
        contentEl.setAttribute('style', (contentEl.getAttribute('style') || '') + '; outline: none; cursor: text;');

        contentEl.addEventListener('blur', updateSlideContent);
      }

      // Add edit indicator styles
      const style = iframeDoc.createElement('style');
      style.textContent = `
        .headline:hover, .content:hover {
          outline: 2px dashed rgba(255, 107, 107, 0.5) !important;
          outline-offset: 8px;
        }
        .headline:focus, .content:focus {
          outline: 2px solid #FF6B6B !important;
          outline-offset: 8px;
        }
      `;
      iframeDoc.head.appendChild(style);
    };

    // Trigger load for inline content
    setTimeout(() => {
      if (iframe.onload) {
        iframe.onload(new Event('load'));
      }
    }, 100);
  }, [slide.title, slide.content, slideIndex, totalSlides, stylePreset, width, height, updateSlideContent]);

  return (
    <div className="flex flex-col items-center">
      {/* Canvas container */}
      <div
        ref={containerRef}
        className="relative bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{
          width: scaledWidth,
          height: scaledHeight,
        }}
      >
        <iframe
          ref={iframeRef}
          title={`Slide ${slideIndex + 1}`}
          className="absolute top-0 left-0 border-0"
          style={{
            width: width,
            height: height,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
          sandbox="allow-same-origin"
        />

        {/* Edit overlay hint */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-center pointer-events-none">
          <div className="bg-charcoal/80 text-white text-sm px-4 py-2 rounded-lg backdrop-blur-sm">
            Кликните на текст для редактирования
          </div>
        </div>
      </div>

      {/* Slide info */}
      <div className="mt-6 text-center">
        <p className="text-sm text-teal-light">
          Слайд {slideIndex + 1} из {totalSlides}
        </p>
        <p className="text-xs text-teal-light/60 mt-1">
          {width} x {height} px
        </p>
      </div>
    </div>
  );
}
