import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getSession, updateSession } from './services/api';
import ExportButton from './components/ExportButton';
import { renderTemplate } from './templates';
import { FORMAT_SIZES, type SessionResponse, type Slide, type CarouselData, type TextStyles, type TextPosition } from './types';

type ElementType = 'title' | 'content';

const TEMPLATE_LIST = [
  { id: 'notebook', name: 'Тетрадь', color: '#FEF9E7' },
  { id: 'aurora', name: 'Аврора', color: '#7c3aed' },
  { id: 'terminal', name: 'Терминал', color: '#0d120a' },
  { id: 'editorial', name: 'Редакция', color: '#f5f0e8' },
  { id: 'luxe', name: 'Люкс', color: '#0d0b12' },
  { id: 'photo_overlay', name: 'Фото', color: '#1a1a2e' },
  { id: 'backspace', name: 'Бэкспейс', color: '#e8f0fe' },
  { id: 'star_highlight', name: 'Звезда', color: '#1a1a1a' },
  { id: 'purple_accent', name: 'Пурпур', color: '#6b21a8' },
  { id: 'quote_doodle', name: 'Цитата', color: '#fff8f0' },
  { id: 'speech_bubble', name: 'Пузырь', color: '#ff7a45' },
  { id: 'grid_multi', name: 'Сетка', color: '#0D0D14' },
  { id: 'receipt', name: 'Чек', color: '#fafaf7' },
  { id: 'lime_checklist', name: 'Чеклист', color: '#D4F542' },
  { id: 'app_list', name: 'Приложение', color: '#ffffff' },
  { id: 'paper_image', name: 'Бумага', color: '#f5f3ef' },
];

function App() {
  const { token } = useParams<{ token: string }>();
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [selectedElement, setSelectedElement] = useState<ElementType>('title');
  const [activeTab, setActiveTab] = useState<'text' | 'template' | null>(null);
  const [localStylePreset, setLocalStylePreset] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) {
      setError('Токен не указан');
      setLoading(false);
      return;
    }
    loadSession(token);
  }, [token]);

  // Sync localStylePreset when session loads
  useEffect(() => {
    if (session) setLocalStylePreset(session.stylePreset);
  }, [session?.stylePreset]);

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

  async function loadSession(tok: string) {
    setLoading(true);
    const data = await getSession(tok);
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

  const handleTemplateChange = useCallback(async (newPreset: string) => {
    if (!session || !token) return;
    setLocalStylePreset(newPreset);
    setSession({ ...session, stylePreset: newPreset });
    setSaving(true);
    const success = await updateSession(token, session.carouselData, newPreset);
    setSaving(false);
    if (success) setLastSaved(new Date());
  }, [session, token]);

  const handleContainerScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const cards = Array.from(container.querySelectorAll('[data-slide-index]')) as HTMLElement[];
    const containerCenter = container.scrollLeft + container.clientWidth / 2;
    let closest = 0;
    let closestDist = Infinity;
    cards.forEach((card) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(cardCenter - containerCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closest = parseInt(card.dataset.slideIndex || '0', 10);
      }
    });
    setCurrentSlideIndex(closest);
  }, []);

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

  const renderEditControls = () => {
    if (!session) return null;
    const currentSlide = session.carouselData.slides[currentSlideIndex];
    return (
      <>
        {/* Element selector */}
        <div className="mb-4 sm:mb-5">
          <label className="block text-sm text-white/50 mb-2">Выбрано</label>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedElement('title')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedElement === 'title'
                  ? 'bg-[#D4F542] text-[#0D0D14]'
                  : 'bg-white/10 text-white/60 hover:bg-white/15'
              }`}
            >
              Заголовок
            </button>
            <button
              onClick={() => setSelectedElement('content')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedElement === 'content'
                  ? 'bg-[#D4F542] text-[#0D0D14]'
                  : 'bg-white/10 text-white/60 hover:bg-white/15'
              }`}
            >
              Контент
            </button>
          </div>
        </div>

        {/* Text editing */}
        <div className="mb-4 sm:mb-5">
          <label className="block text-sm text-white/50 mb-2">
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
            className="w-full px-3 py-2 border border-white/10 bg-white/5 text-white rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#D4F542]/50 placeholder:text-white/30"
            rows={selectedElement === 'title' ? 2 : 3}
          />
        </div>

        {/* Font size & Alignment - side by side on mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 mb-4 sm:mb-5">
          {/* Font size */}
          <div>
            <label className="block text-sm text-white/50 mb-2">
              Размер: {(selectedElement === 'title' ? currentSlide.titleStyles?.fontSize : currentSlide.contentStyles?.fontSize) || (selectedElement === 'title' ? 48 : 24)}px
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
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#D4F542]"
            />
          </div>

          {/* Alignment */}
          <div>
            <label className="block text-sm text-white/50 mb-2">Выравнивание</label>
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => {
                    const currentStyles = selectedElement === 'title' ? currentSlide.titleStyles : currentSlide.contentStyles;
                    handleStyleChange(selectedElement, { ...currentStyles, textAlign: align });
                  }}
                  className={`flex-1 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                    (selectedElement === 'title' ? currentSlide.titleStyles?.textAlign : currentSlide.contentStyles?.textAlign) === align
                      ? 'bg-[#D4F542] text-[#0D0D14]'
                      : 'bg-white/10 text-white/60 hover:bg-white/15'
                  }`}
                >
                  {align === 'left' ? '←' : align === 'center' ? '↔' : '→'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Color */}
        <div className="mb-4 sm:mb-5">
          <label className="block text-sm text-white/50 mb-2">Цвет текста</label>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <input
              type="color"
              value={(selectedElement === 'title' ? currentSlide.titleStyles?.color : currentSlide.contentStyles?.color) || '#FFFFFF'}
              onChange={(e) => {
                const currentStyles = selectedElement === 'title' ? currentSlide.titleStyles : currentSlide.contentStyles;
                handleStyleChange(selectedElement, { ...currentStyles, color: e.target.value });
              }}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg cursor-pointer border border-white/10 bg-transparent"
            />
            <div className="flex gap-1.5 sm:gap-2">
              {['#FFFFFF', '#000000', '#0D0D14', '#D4F542', '#FF6B6B'].map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    const currentStyles = selectedElement === 'title' ? currentSlide.titleStyles : currentSlide.contentStyles;
                    handleStyleChange(selectedElement, { ...currentStyles, color: c });
                  }}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded border border-white/15 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-3 sm:pt-4 mt-1">
          <p className="text-xs text-white/30">
            Перетаскивайте текст на активном слайде для изменения позиции
          </p>
        </div>
      </>
    );
  };

  const renderTemplatePicker = () => (
    <div className="grid grid-cols-4 gap-2">
      {TEMPLATE_LIST.map(t => (
        <button
          key={t.id}
          onClick={() => handleTemplateChange(t.id)}
          className={`rounded-xl p-2 flex flex-col items-center gap-1 border transition-all ${
            localStylePreset === t.id
              ? 'border-[#D4F542] bg-[#D4F542]/10'
              : 'border-white/10 bg-white/5 hover:bg-white/10'
          }`}
        >
          <div
            className="w-full h-8 rounded-lg"
            style={{ backgroundColor: t.color }}
          />
          <span className="text-[10px] text-white/60 text-center leading-tight">{t.name}</span>
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center blueprint-bg">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#D4F542] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center blueprint-bg">
        <div className="text-center card p-8 max-w-md">
          <div className="w-16 h-16 bg-[#D4F542]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#D4F542]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Ошибка</h2>
          <p className="text-slate-500">{error}</p>
          <a href="https://t.me/swipelybot" className="btn-primary inline-block mt-6">
            Открыть бота
          </a>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const totalSlides = session.carouselData.slides.length;

  return (
    <div className="h-screen flex flex-col overflow-hidden blueprint-bg">
      {/* Header */}
      <header className="bg-[#0D0D14] border-b border-white/10 px-3 sm:px-6 py-2 sm:py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src="/logo.png" alt="Swipely" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg" />
            <h1 className="text-base sm:text-lg font-semibold text-white hidden xs:block">Swipely Editor</h1>
            <span className="text-xs sm:text-sm text-white/40 hidden sm:block">
              {saving ? 'Сохранение...' : lastSaved ? `Сохранено ${formatTime(lastSaved)}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Navigation */}
            <div className="flex items-center gap-1 sm:gap-2 bg-white/10 rounded-lg p-0.5 sm:p-1">
              <button
                onClick={() => scrollToSlide(Math.max(0, currentSlideIndex - 1))}
                disabled={currentSlideIndex === 0}
                className="p-1.5 sm:p-2 rounded hover:bg-white/20 disabled:opacity-30 transition-colors text-white"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="px-2 sm:px-3 text-xs sm:text-sm font-medium text-white">
                {currentSlideIndex + 1}/{totalSlides}
              </span>
              <button
                onClick={() => scrollToSlide(Math.min(totalSlides - 1, currentSlideIndex + 1))}
                disabled={currentSlideIndex === totalSlides - 1}
                className="p-1.5 sm:p-2 rounded hover:bg-white/20 disabled:opacity-30 transition-colors text-white"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <ExportButton
              slides={session.carouselData.slides}
              stylePreset={localStylePreset}
              format={session.format}
              username={session.username}
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Slides area — margin accounts for bottom tab bar + sheet on mobile */}
        <div
          ref={scrollContainerRef}
          onScroll={handleContainerScroll}
          className={`flex-1 overflow-x-auto overflow-y-hidden flex items-center transition-all duration-300 snap-x snap-mandatory ${
            activeTab ? 'mb-[calc(56px+50vh)]' : 'mb-[56px]'
          } lg:mb-0`}
        >
          <div className="flex flex-row items-center gap-4 lg:gap-6 h-full px-4 sm:px-8 py-4" style={{ minWidth: 'max-content' }}>
            {session.carouselData.slides.map((slide, index) => (
              <SlideCard
                key={index}
                slide={slide}
                index={index}
                totalSlides={totalSlides}
                isActive={index === currentSlideIndex}
                stylePreset={localStylePreset}
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

        {/* Desktop sidebar only */}
        <div className="hidden lg:flex flex-col w-80 bg-[#0D0D14] border-l border-white/10 overflow-y-auto flex-shrink-0 p-5">
          <h3 className="font-semibold text-white mb-3 sm:mb-4">Редактирование</h3>
          {renderEditControls()}
        </div>
      </div>

      {/* Bottom sheet — mobile only */}
      {activeTab && (
        <div className="fixed bottom-[56px] left-0 right-0 max-h-[50vh] bg-[#0D0D14] border-t border-white/10 rounded-t-2xl z-30 overflow-y-auto lg:hidden">
          <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-[#0D0D14]">
            <div className="w-10 h-1 bg-white/20 rounded-full" />
          </div>
          <div className="flex items-center justify-between px-4 py-2 sticky top-6 bg-[#0D0D14]">
            <h3 className="font-semibold text-white">
              {activeTab === 'text' ? 'Текст' : 'Шаблон'}
            </h3>
            <button onClick={() => setActiveTab(null)} className="p-1 rounded-lg hover:bg-white/10">
              <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="px-4 pb-6">
            {activeTab === 'text' && renderEditControls()}
            {activeTab === 'template' && renderTemplatePicker()}
          </div>
        </div>
      )}

      {/* Bottom tab bar — mobile only */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0D0D14] border-t border-white/10 z-40 lg:hidden">
        <div className="flex items-stretch h-14">
          {([
            {
              id: 'template' as const,
              label: 'Шаблон',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <rect x="3" y="3" width="8" height="8" rx="1" />
                  <rect x="13" y="3" width="8" height="8" rx="1" />
                  <rect x="3" y="13" width="8" height="8" rx="1" />
                  <rect x="13" y="13" width="8" height="8" rx="1" />
                </svg>
              ),
            },
            {
              id: 'text' as const,
              label: 'Текст',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h8m-8 6h16" />
                </svg>
              ),
            },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(activeTab === tab.id ? null : tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${
                activeTab === tab.id ? 'text-[#D4F542]' : 'text-white/40'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
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
  const containerRef = useRef<HTMLDivElement>(null);
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

  // Responsive scale based on screen width
  const [scale, setScale] = useState(0.42);

  useEffect(() => {
    const updateScale = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      if (screenWidth < 640) {
        // Mobile: fit slide to screen height (minus header ~60px and padding)
        const maxHeight = screenHeight - 120;
        const heightScale = maxHeight / height;
        const widthScale = (screenWidth * 0.8) / width;
        setScale(Math.min(heightScale, widthScale, 0.35));
      } else if (screenWidth < 1024) {
        // Tablet
        setScale(0.38);
      } else {
        // Desktop
        setScale(0.42);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [width, height]);

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

        el.addEventListener('touchstart', (e: TouchEvent) => {
          if (!isActive) return;
          e.preventDefault();
          const touch = e.touches[0];
          dragStateRef.current = {
            isDragging: true,
            element: el,
            elementType,
            startX: touch.clientX,
            startY: touch.clientY,
            initialLeft: parseFloat(el.style.left) || 50,
            initialTop: parseFloat(el.style.top) || 50,
          };
          el.style.cursor = 'grabbing';
          onSelectElement(elementType);
        }, { passive: false });
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

      iframeDoc.addEventListener('touchmove', (e: TouchEvent) => {
        const state = dragStateRef.current;
        if (!state.isDragging || !state.element) return;
        e.preventDefault();
        const touch = e.touches[0];
        const deltaX = ((touch.clientX - state.startX) / scale / width) * 100;
        const deltaY = ((touch.clientY - state.startY) / scale / height) * 100;
        const newX = Math.max(10, Math.min(90, state.initialLeft + deltaX));
        const newY = Math.max(5, Math.min(95, state.initialTop + deltaY));
        state.element.style.left = `${newX}%`;
        state.element.style.top = `${newY}%`;
      }, { passive: false });

      iframeDoc.addEventListener('touchend', () => {
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
          outline: 2px dashed rgba(212, 245, 66, 0.6) !important;
          outline-offset: 8px;
        }
        .editable-element.selected {
          outline: 2px solid #D4F542 !important;
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
      ref={containerRef}
      data-slide-index={index}
      onClick={onSelect}
      className={`
        snap-center relative flex-shrink-0 rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer transition-all duration-300
        ${isActive
          ? 'ring-2 sm:ring-4 ring-[#D4F542] shadow-xl sm:shadow-2xl shadow-[#D4F542]/20 scale-100'
          : 'ring-1 ring-white/10 shadow-md sm:shadow-lg opacity-70 sm:opacity-60 scale-[0.98] sm:scale-95 hover:opacity-80 hover:scale-[0.99] sm:hover:scale-[0.97]'
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

      <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 bg-black/60 text-white text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md backdrop-blur-sm">
        {index + 1}/{totalSlides}
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export default App;
