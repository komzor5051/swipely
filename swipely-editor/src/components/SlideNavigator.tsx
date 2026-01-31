import { useRef, useEffect } from 'react';
import { renderTemplate } from '../templates';
import { FORMAT_SIZES, type Slide } from '../types';

interface SlideNavigatorProps {
  slides: Slide[];
  currentIndex: number;
  onSelect: (index: number) => void;
  stylePreset: string;
  format: 'square' | 'portrait';
}

export default function SlideNavigator({
  slides,
  currentIndex,
  onSelect,
  stylePreset,
  format,
}: SlideNavigatorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-teal-light mb-4">Слайды</h3>

      <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
        {slides.map((slide, index) => (
          <SlidePreview
            key={index}
            slide={slide}
            slideIndex={index}
            totalSlides={slides.length}
            isActive={index === currentIndex}
            stylePreset={stylePreset}
            format={format}
            onClick={() => onSelect(index)}
          />
        ))}
      </div>
    </div>
  );
}

interface SlidePreviewProps {
  slide: Slide;
  slideIndex: number;
  totalSlides: number;
  isActive: boolean;
  stylePreset: string;
  format: 'square' | 'portrait';
  onClick: () => void;
}

function SlidePreview({
  slide,
  slideIndex,
  totalSlides,
  isActive,
  stylePreset,
  format,
  onClick,
}: SlidePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { width, height } = FORMAT_SIZES[format];

  // Scale for thumbnail
  const thumbnailWidth = 160;
  const scale = thumbnailWidth / width;
  const thumbnailHeight = height * scale;

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

    const doc = iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(html);
    doc.close();
  }, [slide, slideIndex, totalSlides, stylePreset, width, height]);

  return (
    <button
      onClick={onClick}
      className={`
        w-full rounded-xl overflow-hidden transition-all duration-200
        ${isActive
          ? 'ring-2 ring-coral shadow-lg shadow-coral/20 scale-105'
          : 'ring-1 ring-cream hover:ring-teal-light'
        }
      `}
    >
      <div
        className="relative bg-white overflow-hidden"
        style={{ width: thumbnailWidth, height: thumbnailHeight }}
      >
        <iframe
          ref={iframeRef}
          title={`Preview ${slideIndex + 1}`}
          className="absolute top-0 left-0 border-0 pointer-events-none"
          style={{
            width: width,
            height: height,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
          tabIndex={-1}
        />

        {/* Slide number overlay */}
        <div className="absolute bottom-1 right-1 bg-charcoal/80 text-white text-xs px-2 py-0.5 rounded">
          {slideIndex + 1}
        </div>

        {/* Active indicator */}
        {isActive && (
          <div className="absolute top-1 left-1 w-2 h-2 bg-coral rounded-full" />
        )}
      </div>
    </button>
  );
}
