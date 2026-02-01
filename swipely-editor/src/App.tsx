import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getSession, updateSession } from './services/api';
import ExportButton from './components/ExportButton';
import { renderTemplate } from './templates';
import { FORMAT_SIZES, type SessionResponse, type Slide, type CarouselData, type TextStyles, type TextPosition } from './types';

type ElementType = 'title' | 'content';

function App() {
  const { token } = useParams<{ token: string }>();
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [selectedElement, setSelectedElement] = useState<ElementType>('title');
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

  const handleStyleChange = useCallback((element: ElementType, styles: TextStyles) => {
    if (!session) return;
    const currentSlide = session.carouselData.slides[currentSlideIndex];
    const updatedSlide: Slide = {
      ...currentSlide,
      ...(element === 'title'
        ? { titleStyles: styles }
        : { contentStyles: styles }
      ),
    };
    handleSlideUpdate(currentSlideIndex, updatedSlide);
  }, [session, currentSlideIndex, handleSlideUpdate]);

  const handlePositionChange = useCallback((element: ElementType, position: TextPosition) => {
    if (!session) return;
    const currentSlide = session.carouselData.slides[currentSlideIndex];
    const updatedSlide: Slide = {
      ...currentSlide,
      ...(element === 'title'
        ? { titlePosition: position }
        : { contentPosition: position }
      ),
    };
    handleSlideUpdate(currentSlideIndex, updatedSlide);
  }, [session, currentSlideIndex, handleSlideUpdate]);

  const scrollToSlide = (index: number) => {
    setCurrentSlideIndex(index);
    const container = scrollContainerRef.current;
    if (container) {
      const slideWidth = 360;
      container.scrollTo({
        left: index * slideWidth - container.clientWidth / 2 + slideWidth / 2,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center card p-8 max-w-md">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Ошибка</h2>
          <p className="text-slate-500">{error}</p>
          <a href="https://t.me/swipely_bot" className="btn-primary inline-block mt-6">
            Открыть бота
          </a>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const totalSlides = session.carouselData.slides.length;
  const currentSlide = session.carouselData.slides[currentSlideIndex];

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

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Horizontal slides */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden"
        >
          <div className="flex items-center gap-6 h-full px-8 py-6" style={{ minWidth: 'max-content' }}>
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
                selectedElement={selectedElement}
                onSelect={() => setCurrentSlideIndex(index)}
                onSelectElement={setSelectedElement}
                onUpdate={(updatedSlide) => handleSlideUpdate(index, updatedSlide)}
                onPositionChange={handlePositionChange}
              />
            ))}
          </div>
        </div>

        {/* Right panel - Edit controls */}
        <div className="w-80 bg-white border-l border-slate-200 p-5 overflow-y-auto flex-shrink-0">
          <h3 className="font-semibold text-slate-800 mb-4">Редактирование</h3>

          {/* Element selector */}
          <div className="mb-5">
            <label className="block text-sm text-slate-500 mb-2">Выбрано</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedElement('title')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedElement === 'title'
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Заголовок
              </button>
              <button
                onClick={() => setSelectedElement('content')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedElement === 'content'
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Контент
              </button>
            </div>
          </div>

          {/* Text editing */}
          <div className="mb-5">
            <label className="block text-sm text-slate-500 mb-2">
              {selectedElement === 'title' ? 'Заголовок' : 'Текст'}
            </label>
            <textarea
              value={selectedElement === 'title' ? currentSlide.title : currentSlide.content}
              onChange={(e) => {
                const updatedSlide = {
                  ...currentSlide,
                  [selectedElement]: e.target.value
                };
                handleSlideUpdate(currentSlideIndex, updatedSlide);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              rows={selectedElement === 'title' ? 2 : 4}
            />
          </div>

          {/* Font size */}
          <div className="mb-5">
            <label className="block text-sm text-slate-500 mb-2">
              Размер шрифта: {(selectedElement === 'title' ? currentSlide.titleStyles?.fontSize : currentSlide.contentStyles?.fontSize) || (selectedElement === 'title' ? 48 : 24)}px
            </label>
            <input
              type="range"
              min={12}
              max={120}
              value={(selectedElement === 'title' ? currentSlide.titleStyles?.fontSize : currentSlide.contentStyles?.fontSize) || (selectedElement === 'title' ? 48 : 24)}
              onChange={(e) => {
                const currentStyles = selectedElement === 'title' ? currentSlide.titleStyles : currentSlide.contentStyles;
                handleStyleChange(selectedElement, { ...currentStyles, fontSize: Number(e.target.value) });
              }}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Color */}
          <div className="mb-5">
            <label className="block text-sm text-slate-500 mb-2">Цвет текста</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={(selectedElement === 'title' ? currentSlide.titleStyles?.color : currentSlide.contentStyles?.color) || '#FFFFFF'}
                onChange={(e) => {
                  const currentStyles = selectedElement === 'title' ? currentSlide.titleStyles : currentSlide.contentStyles;
                  handleStyleChange(selectedElement, { ...currentStyles, color: e.target.value });
                }}
                className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
              />
              <div className="flex gap-2">
                {['#FFFFFF', '#000000', '#0A84FF', '#FF6B6B', '#FFE66D'].map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      const currentStyles = selectedElement === 'title' ? currentSlide.titleStyles : currentSlide.contentStyles;
                      handleStyleChange(selectedElement, { ...currentStyles, color: c });
                    }}
                    className="w-7 h-7 rounded border border-slate-200 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Alignment */}
          <div className="mb-5">
            <label className="block text-sm text-slate-500 mb-2">Выравнивание</label>
            <div className="flex gap-2">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => {
                    const currentStyles = selectedElement === 'title' ? currentSlide.titleStyles : currentSlide.contentStyles;
                    handleStyleChange(selectedElement, { ...currentStyles, textAlign: align });
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg transition-colors ${
                    (selectedElement === 'title' ? currentSlide.titleStyles?.textAlign : currentSlide.contentStyles?.textAlign) === align
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {align === 'left' ? '←' : align === 'center' ? '↔' : '→'}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 mt-4">
            <p className="text-xs text-slate-400">
              Перетаскивайте текст на активном слайде для изменения позиции
            </p>
          </div>
        </div>
      </div>
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
  selectedElement: ElementType;
  onSelect: () => void;
  onSelectElement: (element: ElementType) => void;
  onUpdate: (slide: Slide) => void;
  onPositionChange: (element: ElementType, position: TextPosition) => void;
}

function SlideCard({
  slide,
  index,
  totalSlides,
  isActive,
  stylePreset,
  format,
  image,
  selectedElement,
  onSelect,
  onSelectElement,
  onUpdate,
  onPositionChange,
}: SlideCardProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { width, height } = FORMAT_SIZES[format];
  const dragStateRef = useRef<{
    isDragging: boolean;
    element: HTMLElement | null;
    elementType: ElementType | null;
    startX: number;
    startY: number;
    initialLeft: number;
    initialTop: number;
  }>({
    isDragging: false,
    element: null,
    elementType: null,
    startX: 0,
    startY: 0,
    initialLeft: 0,
    initialTop: 0,
  });

  const scale = 0.42;
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

    const setupEditing = () => {
      const iframeDoc = iframe.contentDocument;
      if (!iframeDoc) return;

      // Find elements by multiple possible selectors (different templates use different classes)
      const headlineEl = (
        iframeDoc.querySelector('.headline') ||
        iframeDoc.querySelector('.quote-text') ||
        iframeDoc.querySelector('h1')
      ) as HTMLElement;

      const contentEl = (
        iframeDoc.querySelector('.content') ||
        iframeDoc.querySelector('.quote-author') ||
        iframeDoc.querySelector('.highlight-box') ||
        iframeDoc.querySelector('p:not(.quote-text)')
      ) as HTMLElement;

      const setupElement = (el: HTMLElement, elementType: ElementType) => {
        if (!el) return;

        el.style.cursor = 'move';
        el.style.userSelect = 'text';
        el.style.position = 'absolute';
        el.style.width = '90%';
        el.style.boxSizing = 'border-box';

        const savedPosition = elementType === 'title' ? slide.titlePosition : slide.contentPosition;
        if (savedPosition) {
          el.style.left = `${savedPosition.x}%`;
          el.style.top = `${savedPosition.y}%`;
          el.style.transform = 'translate(-50%, -50%)';
        } else {
          const defaultY = elementType === 'title' ? 35 : 60;
          el.style.left = '50%';
          el.style.top = `${defaultY}%`;
          el.style.transform = 'translate(-50%, -50%)';
        }

        const savedStyles = elementType === 'title' ? slide.titleStyles : slide.contentStyles;
        if (savedStyles?.fontSize) el.style.fontSize = `${savedStyles.fontSize}px`;
        if (savedStyles?.color) el.style.color = savedStyles.color;
        if (savedStyles?.textAlign) el.style.textAlign = savedStyles.textAlign;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelectElement(elementType);
        });

        el.addEventListener('mousedown', (e: MouseEvent) => {
          if (!isActive) return;

          dragStateRef.current = {
            isDragging: true,
            element: el,
            elementType,
            startX: e.clientX,
            startY: e.clientY,
            initialLeft: parseFloat(el.style.left) || 50,
            initialTop: parseFloat(el.style.top) || 50,
          };
          el.style.cursor = 'grabbing';
          onSelectElement(elementType);
        });
      };

      if (headlineEl) setupElement(headlineEl, 'title');
      if (contentEl) setupElement(contentEl, 'content');

      iframeDoc.addEventListener('mousemove', (e: MouseEvent) => {
        const state = dragStateRef.current;
        if (!state.isDragging || !state.element) return;

        const deltaX = ((e.clientX - state.startX) / scale / width) * 100;
        const deltaY = ((e.clientY - state.startY) / scale / height) * 100;

        const newX = Math.max(10, Math.min(90, state.initialLeft + deltaX));
        const newY = Math.max(5, Math.min(95, state.initialTop + deltaY));

        state.element.style.left = `${newX}%`;
        state.element.style.top = `${newY}%`;
      });

      iframeDoc.addEventListener('mouseup', () => {
        const state = dragStateRef.current;
        if (!state.isDragging || !state.element || !state.elementType) return;

        const newX = parseFloat(state.element.style.left);
        const newY = parseFloat(state.element.style.top);

        state.element.style.cursor = 'move';
        onPositionChange(state.elementType, { x: newX, y: newY });

        dragStateRef.current = {
          isDragging: false,
          element: null,
          elementType: null,
          startX: 0,
          startY: 0,
          initialLeft: 0,
          initialTop: 0,
        };
      });

      const style = iframeDoc.createElement('style');
      style.textContent = `
        .headline, .content, .quote-text, .quote-author, .highlight-box, h1, p {
          transition: outline 0.15s ease;
        }
        .editable-element:hover {
          outline: 2px dashed rgba(10, 132, 255, 0.5) !important;
          outline-offset: 8px;
        }
        .editable-element.selected {
          outline: 2px solid #0A84FF !important;
          outline-offset: 8px;
        }
      `;
      iframeDoc.head.appendChild(style);

      // Add editable-element class to found elements
      if (headlineEl) headlineEl.classList.add('editable-element');
      if (contentEl) contentEl.classList.add('editable-element');

      if (isActive) {
        if (selectedElement === 'title' && headlineEl) {
          headlineEl.classList.add('selected');
          contentEl?.classList.remove('selected');
        } else if (selectedElement === 'content' && contentEl) {
          contentEl.classList.add('selected');
          headlineEl?.classList.remove('selected');
        }
      }
    };

    setTimeout(setupEditing, 100);
  }, [slide, index, totalSlides, stylePreset, width, height, image, isActive, selectedElement, onSelectElement, onPositionChange, scale, onUpdate]);

  return (
    <div
      onClick={onSelect}
      className={`
        relative flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300
        ${isActive
          ? 'ring-4 ring-primary shadow-2xl shadow-primary/20 scale-100'
          : 'ring-1 ring-slate-200 shadow-lg opacity-60 scale-95 hover:opacity-80 hover:scale-[0.97]'
        }
      `}
      style={{
        width: scaledWidth,
        height: scaledHeight,
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
