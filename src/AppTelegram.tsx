/**
 * Telegram Mini App Version of Swipely
 * Mobile-first, uses Telegram auth and backend API
 */

import React, { useState, useEffect } from 'react';
import { Slide, HistoryItem, FormatSettings } from './types';
import { CarouselEditorCompact } from './components/CarouselEditorCompact';
import { useTelegram } from './contexts/TelegramContext';
import { useUsageLimitTelegram } from './hooks/useUsageLimitTelegram';
import { api } from './services/api';
import { UsageBadge } from './components/Subscription/UsageBadge';
import { UpgradeModal } from './components/Subscription/UpgradeModal';
import { LimitReachedModal } from './components/Subscription/LimitReachedModal';
import FormatSettingsModal from './components/FormatSettings/FormatSettingsModal';
import { GenerationProgress } from './components/GenerationProgress';

// Style options
const STYLE_OPTIONS = [
  { id: 'auto', label: '✨ Авто' },
  { id: 'solid', label: 'Сплошной' },
  { id: 'gradient-tr', label: 'Градиент' },
  { id: 'dots', label: 'Точки' },
  { id: 'stripes', label: 'Полосы' },
  { id: 'grid', label: 'Сетка' },
];

export default function AppTelegram() {
  // Telegram context
  const { user, profile, isLoading: authLoading, initData, haptic, showAlert, webApp } = useTelegram();

  // Usage limit
  const { usageLimit, refreshLimit } = useUsageLimitTelegram();

  // App state
  const [slides, setSlides] = useState<Slide[]>([]);
  const [textInput, setTextInput] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('auto');
  const [isGenerating, setIsGenerating] = useState(false);

  // Progress state
  const [generationProgress, setGenerationProgress] = useState({
    current: 0,
    total: 0,
    stage: 'content' as 'content' | 'scenes' | 'images'
  });

  // History
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Modals
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showFormatSettings, setShowFormatSettings] = useState(false);
  const [pendingTopic, setPendingTopic] = useState('');

  // Initialize API with initData
  useEffect(() => {
    if (initData) {
      api.setInitData(initData);
    }
  }, [initData]);

  // Load history
  useEffect(() => {
    try {
      const saved = localStorage.getItem('swipely_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load history', e);
    }
  }, []);

  // Setup Telegram back button
  useEffect(() => {
    if (!webApp) return;

    const handleBack = () => {
      if (slides.length > 0) {
        setSlides([]);
        webApp.BackButton.hide();
      }
    };

    if (slides.length > 0) {
      webApp.BackButton.show();
      webApp.BackButton.onClick(handleBack);
    } else {
      webApp.BackButton.hide();
    }

    return () => {
      webApp.BackButton.offClick(handleBack);
    };
  }, [slides.length, webApp]);

  // Add to history
  const addToHistory = (item: HistoryItem) => {
    const newHistory = [item, ...history].slice(0, 10);
    setHistory(newHistory);
    try {
      localStorage.setItem('swipely_history', JSON.stringify(newHistory));
    } catch (e) {
      console.error('Storage quota exceeded', e);
    }
  };

  // Handle generate button
  const handleGenerate = () => {
    if (!textInput.trim()) return;

    haptic('light');

    // Check usage limits
    if (usageLimit && !usageLimit.canGenerate) {
      haptic('warning');
      setShowLimitModal(true);
      return;
    }

    // Open settings modal
    setPendingTopic(textInput);
    setShowFormatSettings(true);
  };

  // Get contrast color
  const getContrastColor = (hexColor: string): string => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
  };

  // Generate with settings
  const handleGenerateWithSettings = async (settings: FormatSettings) => {
    console.log('🚀 Starting generation...');
    setIsGenerating(true);
    setGenerationProgress({ current: 0, total: 0, stage: 'content' });

    try {
      // Call backend API
      const result = await api.generateCarousel(pendingTopic, {
        language: settings.language,
        slideCount: settings.slideCount,
        style: selectedStyle,
        includeOriginalText: settings.includeOriginalText,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Generation failed');
      }

      const { globalDesign, slides: generatedSlides } = result.data;

      // Auto-detect text color
      const textColor = getContrastColor(globalDesign.backgroundColor);
      const subtleTextColor = textColor === '#ffffff' ? 'rgba(255,255,255,0.9)' : 'rgba(26,26,26,0.9)';

      // Create slides
      const newSlides: Slide[] = generatedSlides.map((s, idx) => ({
        id: `slide-${idx}-${Date.now()}`,
        backgroundColor: globalDesign.backgroundColor,
        accentColor: globalDesign.accentColor,
        backgroundPattern: globalDesign.pattern as any,
        elements: [
          {
            id: `title-${idx}`,
            text: s.title || 'Без названия',
            x: 40,
            y: 60,
            fontSize: 48,
            color: textColor,
            fontFamily: 'Oswald',
            fontWeight: 'bold',
            width: 460,
            textAlign: 'left' as const,
            animation: 'slide-down'
          },
          {
            id: `content-${idx}`,
            text: s.content || '',
            x: 40,
            y: 280,
            fontSize: 24,
            color: subtleTextColor,
            fontFamily: 'Inter',
            fontWeight: 'normal',
            width: 460,
            textAlign: 'left' as const,
            animation: 'fade-in'
          }
        ]
      }));

      setSlides(newSlides);
      haptic('success');

      // Save to history
      addToHistory({
        id: Date.now().toString(),
        type: 'carousel',
        timestamp: Date.now(),
        title: textInput.length > 30 ? textInput.substring(0, 30) + '...' : textInput,
        data: newSlides
      });

      // Refresh usage limit
      await refreshLimit();

      // Clear input
      setTextInput('');

      console.log('✅ Generation complete!');
    } catch (error) {
      console.error('❌ Generation error:', error);
      haptic('error');
      showAlert(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Restore from history
  const restoreHistoryItem = (item: HistoryItem) => {
    setSlides(item.data);
    setShowHistory(false);
    haptic('light');
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ru-RU', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-warm-white)' }}>
        <div className="text-center">
          <i className="ph ph-spinner animate-spin text-4xl" style={{ color: 'var(--color-coral)' }}></i>
          <p className="mt-4 text-sm" style={{ color: 'var(--color-teal-light)' }}>Загрузка...</p>
        </div>
      </div>
    );
  }

  const currentStyleLabel = STYLE_OPTIONS.find(s => s.id === selectedStyle)?.label || 'Авто';

  return (
    <div className="flex flex-col min-h-screen font-sans" style={{ background: 'var(--color-warm-white)', color: 'var(--color-charcoal)' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 safe-area-top" style={{ background: 'var(--color-warm-white)', borderBottom: '1px solid rgba(13, 59, 102, 0.1)' }}>
        <div className="px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%)' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 10L15 10M15 10L12 7M15 10L12 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-bold text-lg" style={{ color: 'var(--color-charcoal)' }}>Swipely</span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* History */}
            <button
              onClick={() => { setShowHistory(true); haptic('light'); }}
              className="p-2 rounded-lg relative"
              style={{ color: 'var(--color-teal-light)', background: history.length > 0 ? 'var(--color-cream)' : 'transparent' }}
            >
              <i className="ph-fill ph-clock-counter-clockwise text-xl"></i>
              {history.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: 'var(--color-coral)' }}>
                  {history.length}
                </span>
              )}
            </button>

            {/* Usage Badge */}
            {usageLimit && (
              <UsageBadge
                remaining={usageLimit.remainingGenerations}
                isPro={usageLimit.isPro}
                onUpgradeClick={() => setShowUpgradeModal(true)}
              />
            )}
          </div>
        </div>
      </header>

      {/* History Sidebar */}
      {showHistory && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowHistory(false)}></div>
          <div className="relative w-[85%] max-w-sm h-full flex flex-col animate-slide-in-right" style={{ background: 'var(--color-warm-white)' }}>
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-cream)' }}>
              <h3 className="font-bold" style={{ color: 'var(--color-charcoal)' }}>История</h3>
              <button onClick={() => setShowHistory(false)} style={{ color: 'var(--color-teal-light)' }}>
                <i className="ph ph-x text-xl"></i>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {history.length === 0 ? (
                <div className="text-center py-10 text-sm" style={{ color: 'var(--color-teal-light)' }}>
                  История пуста
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => restoreHistoryItem(item)}
                    className="p-3 rounded-xl border cursor-pointer active:scale-98"
                    style={{ borderColor: 'var(--color-cream)' }}
                  >
                    <p className="font-medium text-sm truncate" style={{ color: 'var(--color-charcoal)' }}>{item.title}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-teal-light)' }}>{formatDate(item.timestamp)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {slides.length === 0 ? (
          /* Input Screen */
          <div className="flex-1 flex flex-col p-4">
            {/* Welcome */}
            <div className="text-center mb-6 pt-4">
              <h2 className="font-bold text-2xl mb-2" style={{ color: 'var(--color-charcoal)' }}>
                Привет{user?.first_name ? `, ${user.first_name}` : ''}!
              </h2>
              <p className="text-sm" style={{ color: 'var(--color-teal-light)' }}>
                Создай карусель за секунды
              </p>
            </div>

            {/* Input */}
            <div className="flex-1 flex flex-col">
              <div className="bg-white rounded-2xl p-4 flex-1 flex flex-col" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="О чём будет карусель? Например: '5 советов по продуктивности'"
                  className="flex-1 w-full bg-transparent resize-none focus:outline-none text-base"
                  style={{ color: 'var(--color-charcoal)', minHeight: '120px' }}
                />

                {/* Style selector */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-cream)' }}>
                  <span className="text-xs" style={{ color: 'var(--color-teal-light)' }}>Стиль:</span>
                  <div className="flex gap-1 flex-wrap">
                    {STYLE_OPTIONS.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => { setSelectedStyle(style.id); haptic('light'); }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedStyle === style.id ? 'scale-105' : ''}`}
                        style={{
                          background: selectedStyle === style.id ? 'var(--color-coral)' : 'var(--color-cream)',
                          color: selectedStyle === style.id ? 'white' : 'var(--color-teal)'
                        }}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !textInput.trim()}
                className="mt-4 w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
                style={{
                  background: isGenerating ? 'var(--color-teal)' : 'linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%)',
                  color: 'white',
                  boxShadow: '0 8px 24px rgba(255, 107, 107, 0.4)'
                }}
              >
                {isGenerating ? (
                  <>
                    <i className="ph ph-spinner animate-spin text-xl"></i>
                    <span>Генерация...</span>
                  </>
                ) : (
                  <>
                    <i className="ph-fill ph-sparkle text-xl"></i>
                    <span>Создать карусель</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Editor Screen */
          <div className="flex-1 flex flex-col">
            <div className="px-4 py-2 flex items-center justify-between" style={{ background: 'var(--color-cream)' }}>
              <span className="text-xs font-medium" style={{ color: 'var(--color-teal)' }}>
                {slides.length} слайдов
              </span>
              <button
                onClick={() => { setSlides([]); haptic('light'); }}
                className="text-xs font-medium px-3 py-1.5 rounded-lg"
                style={{ color: 'var(--color-coral)', background: 'white' }}
              >
                Заново
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CarouselEditorCompact slides={slides} setSlides={setSlides} />
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />

      <LimitReachedModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        onUpgrade={() => setShowUpgradeModal(true)}
      />

      <FormatSettingsModal
        isOpen={showFormatSettings}
        onClose={() => setShowFormatSettings(false)}
        onGenerate={handleGenerateWithSettings}
        userTopic={pendingTopic}
      />

      {/* Generation Progress */}
      {isGenerating && (
        <GenerationProgress
          current={generationProgress.current}
          total={generationProgress.total}
          stage={generationProgress.stage}
        />
      )}
    </div>
  );
}
