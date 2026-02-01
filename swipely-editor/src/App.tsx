import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getSession, updateSession } from './services/api';
import ExportButton from './components/ExportButton';
import { renderTemplate } from './templates';
import { FORMAT_SIZES, type SessionResponse, type Slide, type CarouselData } from './types';

function App() {
  const { token } = useParams<{ token: string }>();
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) {
      setError('Токен не указан');
      setLoading(false);
      return;
    }
    loadSession(token);
  }, [token]);

  // Preload images
  useEffect(() => {
    if (!session?.images) return;
    session.images.forEach((imageUrl) => {
      if (imageUrl) {
        const img = new Image();
        img.src = imageUrl;
      }
    });
  }, [session?.images]);

  async function loadSession(token: string) {
    setLoading(true);
    const data = await getSession(token);
    if (!data) {
      setError('Сессия не найдена или истекла');
      setLoading(false);
      return;
    }
    setSession(data);
    setLoading(false);
  }

  const handleSlideUpdate = useCallback(async (index: number, updatedSlide: Slide) => {
    if (!session || !token) return;

    const newCarouselData: CarouselData = {
      slides: session.carouselData.slides.map((slide, i) =>
        i === index ? updatedSlide : slide
      ),
    };

    setSession({ ...session, carouselData: newCarouselData });

    setSaving(true);
    const success = await updateSession(token, newCarouselData);
    setSaving(false);

    if (success) {
      setLastSaved(new Date());
    }
  }, [session, token]);

  const scrollToSlide = (index: number) => {
    setCurrentSlideIndex(index);
    const container = scrollContainerRef.current;
    if (container) {
      const slideWidth = 400; // approximate width with gap
      container.scrollTo({
        left: index * slideWidth - container.clientWidth / 2 + slideWidth / 2,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-warm-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-teal-light">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-warm-white">
        <div className="text-center card p-8 max-w-md">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-charcoal mb-2">Ошибка</h2>
          <p className="text-teal-light">{error}</p>
          <a href="https://t.me/swipely_bot" className="btn-primary inline-block mt-6">
            Открыть бота
          </a>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const totalSlides = session.carouselData.slides.length;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Swipely" className="w-8 h-8 rounded-lg" />
            <h1 className="text-lg font-semibold text-slate-800">Swipely Editor</h1>
            <span className="text-sm text-slate-400">
              {saving ? 'Сохранение...' : lastSaved ? `Сохранено ${formatTime(lastSaved)}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Navigation */}
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => scrollToSlide(Math.max(0, currentSlideIndex - 1))}
                disabled={currentSlideIndex === 0}
                className="p-2 rounded hover:bg-white disabled:opacity-30 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="px-3 text-sm font-medium text-slate-600">
                {currentSlideIndex + 1} / {totalSlides}
              </span>
              <button
                onClick={() => scrollToSlide(Math.min(totalSlides - 1, currentSlideIndex + 1))}
                disabled={currentSlideIndex === totalSlides - 1}
                className="p-2 rounded hover:bg-white disabled:opacity-30 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <ExportButton
              slides={session.carouselData.slides}
              stylePreset={session.stylePreset}
              format={session.format}
              username={session.username}
            />
          </div>
        </div>
      </header>

      {/* Horizontal slide canvas */}
      <main
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        <div className="flex items-center gap-8 h-full px-12 py-8" style={{ minWidth: 'max-content' }}>
          {session.carouselData.slides.map((slide, index) => (
            <SlideCard
              key={index}
              slide={slide}
              index={index}
              totalSlides={totalSlides}
              isActive={index === currentSlideIndex}
              stylePreset={session.stylePreset}
              format={session.format}
              image={session.images?.[index]}
              onSelect={() => setCurrentSlideIndex(index)}
              onUpdate={(updatedSlide) => handleSlideUpdate(index, updatedSlide)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

interface SlideCardProps {
  slide: Slide;
  index: number;
  totalSlides: number;
  isActive: boolean;
  stylePreset: string;
  format: 'square' | 'portrait';
  image?: string;
  onSelect: () => void;
  onUpdate: (slide: Slide) => void;
}

function SlideCard({
  slide,
  index,
  totalSlides,
  isActive,
  stylePreset,
  format,
  image,
  onSelect,
  onUpdate,
}: SlideCardProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { width, height } = FORMAT_SIZES[format];

  // Scale to fit viewport height
  const scale = 0.45;
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let html = renderTemplate(stylePreset, {
      title: slide.title,
      content: slide.content,
      slideNumber: index + 1,
      totalSlides,
      width,
      height,
    });

    if (!html) return;

    // Inject image background for Photo Mode
    if (image) {
      const isUrl = image.startsWith('http://') || image.startsWith('https://');
      const imageUrl = isUrl ? image : `data:image/png;base64,${image}`;
      const bgImageStyle = `
        body {
          background-image: url('${imageUrl}');
          background-size: cover;
          background-position: center;
        }
        .photo-hint { display: none !important; }
      `;
      html = html.replace('</style>', `${bgImageStyle}</style>`);
    }

    const doc = iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(html);
    doc.close();

    // Setup editing after load
    const setupEditing = () => {
      const iframeDoc = iframe.contentDocument;
      if (!iframeDoc) return;

      const headlineEl = iframeDoc.querySelector('.headline') as HTMLElement;
      const contentEl = iframeDoc.querySelector('.content') as HTMLElement;

      const makeEditable = (el: HTMLElement, field: 'title' | 'content') => {
        if (!el) return;

        el.setAttribute('contenteditable', 'true');
        el.style.outline = 'none';
        el.style.cursor = 'text';

        el.addEventListener('focus', () => {
          el.style.outline = '2px solid #0A84FF';
          el.style.outlineOffset = '4px';
          el.style.borderRadius = '4px';
        });

        el.addEventListener('blur', () => {
          el.style.outline = 'none';
          const newValue = el.textContent || '';
          if (field === 'title' && newValue !== slide.title) {
            onUpdate({ ...slide, title: newValue });
          } else if (field === 'content' && newValue !== slide.content) {
            onUpdate({ ...slide, content: newValue });
          }
        });

        // Prevent default drag behavior
        el.addEventListener('mousedown', (e) => {
          e.stopPropagation();
        });
      };

      if (headlineEl) makeEditable(headlineEl, 'title');
      if (contentEl) makeEditable(contentEl, 'content');

      // Add hover styles
      const style = iframeDoc.createElement('style');
      style.textContent = `
        .headline, .content {
          transition: outline 0.15s ease;
          cursor: text !important;
        }
        .headline:hover, .content:hover {
          outline: 2px dashed rgba(10, 132, 255, 0.4) !important;
          outline-offset: 4px;
        }
      `;
      iframeDoc.head.appendChild(style);
    };

    // Delay to ensure content is loaded
    setTimeout(setupEditing, 150);
  }, [slide.title, slide.content, index, totalSlides, stylePreset, width, height, image, slide, onUpdate]);

  return (
    <div
      onClick={onSelect}
      className={`
        relative flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300
        ${isActive
          ? 'ring-4 ring-primary shadow-2xl shadow-primary/20 scale-100'
          : 'ring-1 ring-slate-200 shadow-lg opacity-70 scale-95 hover:opacity-90 hover:scale-[0.97]'
        }
      `}
      style={{
        width: scaledWidth,
        height: scaledHeight,
        scrollSnapAlign: 'center',
      }}
    >
      <iframe
        ref={iframeRef}
        title={`Slide ${index + 1}`}
        className="absolute top-0 left-0 border-0"
        style={{
          width: width,
          height: height,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          pointerEvents: isActive ? 'auto' : 'none',
        }}
      />

      {/* Slide number badge */}
      <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded-md backdrop-blur-sm">
        {index + 1}/{totalSlides}
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export default App;
