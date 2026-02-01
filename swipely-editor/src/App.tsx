import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getSession, updateSession } from './services/api';
import SlideCanvas from './components/SlideCanvas';
import SlideNavigator from './components/SlideNavigator';
import ExportButton from './components/ExportButton';
import TextEditPanel from './components/TextEditPanel';
import type { SessionResponse, Slide, CarouselData, TextPosition, TextStyles } from './types';

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

  useEffect(() => {
    if (!token) {
      setError('Токен не указан');
      setLoading(false);
      return;
    }

    loadSession(token);
  }, [token]);

  // Preload all images when session loads
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

    // Автосохранение с debounce
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-teal-light">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center card p-8 max-w-md">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-charcoal mb-2">Ошибка</h2>
          <p className="text-teal-light">{error}</p>
          <a
            href="https://t.me/swipely_bot"
            className="btn-primary inline-block mt-6"
          >
            Открыть бота
          </a>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const currentSlide = session.carouselData.slides[currentSlideIndex];
  const totalSlides = session.carouselData.slides.length;

  return (
    <div className="min-h-screen bg-warm-white">
      {/* Header */}
      <header className="bg-white border-b border-cream px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Swipely" className="w-8 h-8 rounded-lg" />
            <h1 className="text-xl font-semibold text-teal">Swipely Editor</h1>
            <span className="text-sm text-teal-light">
              {saving ? 'Сохранение...' : lastSaved ? `Сохранено ${formatTime(lastSaved)}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-teal-light">
              Шаблон: <span className="font-medium text-charcoal">{session.stylePreset}</span>
            </span>
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
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Slide navigator */}
          <div className="w-48 flex-shrink-0">
            <SlideNavigator
              slides={session.carouselData.slides}
              currentIndex={currentSlideIndex}
              onSelect={setCurrentSlideIndex}
              stylePreset={session.stylePreset}
              format={session.format}
              images={session.images}
            />
          </div>

          {/* Canvas */}
          <div className="flex-1">
            <SlideCanvas
              slide={currentSlide}
              slideIndex={currentSlideIndex}
              totalSlides={totalSlides}
              stylePreset={session.stylePreset}
              format={session.format}
              username={session.username}
              image={session.images?.[currentSlideIndex]}
              selectedElement={selectedElement}
              onSelectElement={setSelectedElement}
              onUpdate={(updatedSlide) => handleSlideUpdate(currentSlideIndex, updatedSlide)}
              onPositionChange={handlePositionChange}
            />
          </div>

          {/* Controls */}
          <div className="w-72 flex-shrink-0">
            <TextEditPanel
              selectedElement={selectedElement}
              onSelectElement={setSelectedElement}
              titleStyles={currentSlide.titleStyles || {}}
              contentStyles={currentSlide.contentStyles || {}}
              onStyleChange={handleStyleChange}
              currentSlideIndex={currentSlideIndex}
              totalSlides={totalSlides}
              onSlideChange={setCurrentSlideIndex}
            />
            <div className="card p-4 mt-4">
              <p className="text-xs text-teal-light/70">
                Формат: {session.format === 'portrait' ? '1080x1350' : '1080x1080'}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export default App;
