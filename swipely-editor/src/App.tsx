import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getSession, updateSession } from './services/api';
import SlideCanvas from './components/SlideCanvas';
import SlideNavigator from './components/SlideNavigator';
import ExportButton from './components/ExportButton';
import type { SessionResponse, Slide, CarouselData } from './types';

function App() {
  const { token } = useParams<{ token: string }>();
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Токен не указан');
      setLoading(false);
      return;
    }

    loadSession(token);
  }, [token]);

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

  async function handleSlideUpdate(index: number, updatedSlide: Slide) {
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
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-coral border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-teal-light">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center card p-8 max-w-md">
          <div className="w-16 h-16 bg-coral/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-display text-teal">Swipely Editor</h1>
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
              onUpdate={(updatedSlide) => handleSlideUpdate(currentSlideIndex, updatedSlide)}
            />
          </div>

          {/* Controls */}
          <div className="w-64 flex-shrink-0">
            <div className="card p-6 sticky top-8">
              <h3 className="font-semibold text-charcoal mb-4">Редактирование</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-teal-light mb-2">Слайд</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                      disabled={currentSlideIndex === 0}
                      className="btn-secondary px-3 py-2 disabled:opacity-50"
                    >
                      ←
                    </button>
                    <span className="flex-1 text-center font-medium">
                      {currentSlideIndex + 1} / {totalSlides}
                    </span>
                    <button
                      onClick={() => setCurrentSlideIndex(Math.min(totalSlides - 1, currentSlideIndex + 1))}
                      disabled={currentSlideIndex === totalSlides - 1}
                      className="btn-secondary px-3 py-2 disabled:opacity-50"
                    >
                      →
                    </button>
                  </div>
                </div>

                <div className="border-t border-cream pt-4">
                  <p className="text-sm text-teal-light">
                    Кликните на текст на слайде чтобы отредактировать его
                  </p>
                </div>

                <div className="border-t border-cream pt-4">
                  <p className="text-xs text-teal-light/70">
                    Формат: {session.format === 'portrait' ? '1080x1350' : '1080x1080'}
                  </p>
                </div>
              </div>
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
