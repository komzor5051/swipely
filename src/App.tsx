
import React, { useState, useEffect, useRef } from 'react';
import { generateCarouselContent } from './services/aiService';
import { generateSceneDescriptions, generateCharacterImage } from './services/nanobananaService';
import { Slide, HistoryItem, FormatSettings } from './types';
import { CarouselEditorCompact } from './components/CarouselEditorCompact';
import { useAuth } from './contexts/AuthContext';
import { useUsageLimit } from './hooks/useUsageLimit';
import { trackGeneration } from './services/usageService';
import { AuthModal } from './components/Auth/AuthModal';
import { UsageBadge } from './components/Subscription/UsageBadge';
import { UpgradeModal } from './components/Subscription/UpgradeModal';
import { LimitReachedModal } from './components/Subscription/LimitReachedModal';
import { AdminPanel } from './components/Admin/AdminPanel';
import { isAdmin } from './utils/constants';
import FormatSettingsModal from './components/FormatSettings/FormatSettingsModal';
import { GenerationProgress } from './components/GenerationProgress';

// Define styles with visual previews
const STYLE_OPTIONS = [
  { 
    id: 'auto', 
    label: '✨ Авто', 
    preview: { 
      background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    },
    icon: 'ph-sparkle'
  },
  { 
    id: 'solid', 
    label: 'Сплошной', 
    preview: { backgroundColor: '#000080' } 
  },
  { 
    id: 'gradient-tr', 
    label: 'Градиент', 
    preview: { background: 'linear-gradient(to top right, #000080, #3b82f6)' } 
  },
  { 
    id: 'dots', 
    label: 'Точки', 
    preview: { 
      backgroundColor: '#f0f9ff', 
      backgroundImage: 'radial-gradient(#00008033 2px, transparent 2px)', 
      backgroundSize: '10px 10px' 
    } 
  },
  { 
    id: 'stripes', 
    label: 'Полосы', 
    preview: { 
      backgroundColor: '#f0f9ff', 
      backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, #00008022 5px, #00008022 10px)' 
    } 
  },
  { 
    id: 'grid', 
    label: 'Сетка', 
    preview: { 
      backgroundColor: '#f0f9ff', 
      backgroundImage: 'linear-gradient(#00008022 1px, transparent 1px), linear-gradient(90deg, #00008022 1px, transparent 1px)', 
      backgroundSize: '10px 10px' 
    } 
  },
  { 
    id: 'sketch', 
    label: 'Набросок', 
    preview: { 
      backgroundColor: '#f0f9ff', 
      backgroundImage: `linear-gradient(45deg, #00008022 25%, transparent 25%, transparent 75%, #00008022 75%, #00008022), linear-gradient(45deg, #00008022 25%, transparent 25%, transparent 75%, #00008022 75%, #00008022)`,
      backgroundSize: '10px 10px' 
    } 
  },
];

export default function App() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [textInput, setTextInput] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('auto');
  const [isStylePickerOpen, setIsStylePickerOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generation Progress State
  const [generationProgress, setGenerationProgress] = useState({
    current: 0,
    total: 0,
    stage: 'content' as 'content' | 'scenes' | 'images'
  });

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Auth & Subscription State
  const { user, signOut } = useAuth();
  const { usageLimit, refreshLimit } = useUsageLimit();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Format Settings State
  const [showFormatSettings, setShowFormatSettings] = useState(false);
  const [pendingTopic, setPendingTopic] = useState('');

  const stylePickerRef = useRef<HTMLDivElement>(null);

  // Load history on mount and clean up background images if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem('instagenius_history');
      if (saved) {
        const parsedHistory = JSON.parse(saved);

        // Clean up background images from history to free up space
        const cleanedHistory = parsedHistory.map((item: HistoryItem) => ({
          ...item,
          data: item.data.map(slide => ({
            ...slide,
            backgroundImage: undefined
          }))
        }));

        setHistory(cleanedHistory);

        // Save cleaned version back to localStorage
        localStorage.setItem('instagenius_history', JSON.stringify(cleanedHistory));
        console.log('✅ История очищена от изображений персонажей для экономии места');
      }
    } catch (e) {
      console.error("Failed to load history", e);
      // If localStorage is corrupted, clear it
      localStorage.removeItem('instagenius_history');
    }
  }, []);

  // Close picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (stylePickerRef.current && !stylePickerRef.current.contains(event.target as Node)) {
        setIsStylePickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const addToHistory = (item: HistoryItem) => {
    const newHistory = [item, ...history].slice(0, 10); // Keep last 10 items
    setHistory(newHistory);
    try {
      localStorage.setItem('instagenius_history', JSON.stringify(newHistory));
    } catch (e) {
      console.error("Storage quota exceeded", e);
      // If quota exceeded, we might want to drop image-heavy items or just not save
    }
  };

  const handleGenerate = () => {
    if (!textInput.trim()) return;

    // Auth check - требуется регистрация для генерации
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Check usage limits for authenticated users
    if (usageLimit && !usageLimit.canGenerate) {
      setShowLimitModal(true);
      return;
    }

    // Save topic and open format settings modal
    setPendingTopic(textInput);
    setShowFormatSettings(true);
  };

  // Helper function to get contrast color based on background brightness
  const getContrastColor = (hexColor: string): string => {
    // Remove # if present
    const hex = hexColor.replace('#', '');

    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return black for light backgrounds, white for dark backgrounds
    return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
  };

  const handleGenerateWithSettings = async (settings: FormatSettings) => {
    console.log('🚀 НАЧАЛО ГЕНЕРАЦИИ');
    console.log('📝 Тема:', pendingTopic);
    console.log('🎨 Стиль:', selectedStyle);
    console.log('⚙️ Настройки:', settings);

    setIsGenerating(true);
    setGenerationProgress({ current: 0, total: 0, stage: 'content' });

    try {
      // Step 1: Generate text content
      console.log('📡 Запрос к Claude Sonnet для генерации текста...');
      const result = await generateCarouselContent(pendingTopic, selectedStyle, settings);
      console.log('✅ Текст сгенерирован:', result);

      if (!result || !result.slides) {
        alert('Ошибка генерации контента');
        setIsGenerating(false);
        return;
      }

      // Use the global design for ALL slides to ensure consistency
      const globalDesign = result.globalDesign || {
        backgroundColor: '#111827',
        accentColor: '#374151',
        pattern: 'solid'
      };

      // Auto-detect contrast color for text
      const textColor = getContrastColor(globalDesign.backgroundColor);
      const subtleTextColor = textColor === '#ffffff' ? 'rgba(255,255,255,0.9)' : 'rgba(26,26,26,0.9)';

      // Step 2: Generate character images if enabled
      let characterImages: (string | undefined)[] = [];

      if (settings.visualStorytellingEnabled && settings.characterImage) {
        console.log('🎨 Генерация персонажа для', result.slides.length, 'слайдов...');

        try {
          // Generate scene descriptions for all slides
          setGenerationProgress({ current: 0, total: result.slides.length, stage: 'scenes' });

          const slideTitles = result.slides.map(s => s.title || '');
          const scenes = await generateSceneDescriptions(
            pendingTopic,
            result.slides.length,
            slideTitles
          );

          console.log('🎬 Получены описания сцен:', scenes.length);

          // Generate images sequentially with progress tracking
          setGenerationProgress({ current: 0, total: scenes.length, stage: 'images' });
          characterImages = [];

          for (let i = 0; i < scenes.length; i++) {
            try {
              console.log(`🎨 Генерация изображения ${i + 1}/${scenes.length}...`);
              const image = await generateCharacterImage(settings.characterImage!, scenes[i]);
              characterImages.push(image);

              // Update progress
              setGenerationProgress({ current: i + 1, total: scenes.length, stage: 'images' });
            } catch (err) {
              console.error(`Ошибка генерации изображения для слайда ${scenes[i].slideNumber}:`, err);
              characterImages.push(undefined); // Fallback to undefined if generation fails

              // Still update progress
              setGenerationProgress({ current: i + 1, total: scenes.length, stage: 'images' });
            }
          }

          console.log('✅ Сгенерировано изображений:', characterImages.filter(Boolean).length);
        } catch (error) {
          console.error('Ошибка генерации персонажа:', error);
          alert('Не удалось сгенерировать изображения персонажа. Карусель будет создана без визуального сторителлинга.');
          // Continue without character images
        }
      }

      console.log('📐 Начало создания слайдов с текстовыми элементами...');

      // Helper function to calculate text position based on text zone
      const getTextPositionForZone = (
        zone: 'left' | 'right' | 'top' | 'bottom' | undefined,
        elementType: 'title' | 'content'
      ): { x: number; y: number; width: number } => {
        if (!zone) {
          // Default positions without character image
          return elementType === 'title'
            ? { x: 40, y: 60, width: 460 }
            : { x: 40, y: 280, width: 460 };
        }

        // Canvas size: 540x540
        // Half width: 270, Half height: 270
        const padding = 40;
        const halfWidth = 270;
        const halfHeight = 270;

        switch (zone) {
          case 'left':
            // Text in left half
            return {
              x: padding,
              y: elementType === 'title' ? 60 : 160,
              width: halfWidth - padding * 2 // 190px width for left zone
            };

          case 'right':
            // Text in right half
            return {
              x: halfWidth + padding,
              y: elementType === 'title' ? 60 : 160,
              width: halfWidth - padding * 2 // 190px width for right zone
            };

          case 'top':
            // Text in top half
            return {
              x: padding,
              y: elementType === 'title' ? 40 : 120,
              width: 540 - padding * 2 // Full width
            };

          case 'bottom':
            // Text in bottom half
            return {
              x: padding,
              y: elementType === 'title' ? 340 : 420,
              width: 540 - padding * 2 // Full width
            };

          default:
            return { x: padding, y: elementType === 'title' ? 60 : 280, width: 460 };
        }
      };

      // Step 3: Create slides with text elements and optional background images
      const textZones: ('left' | 'right' | 'top' | 'bottom')[] = ['left', 'right', 'top', 'bottom'];

      const newSlides: Slide[] = result.slides.map((s, idx) => {
        // Randomly choose text zone for variety (character will be opposite)
        const randomZone = textZones[Math.floor(Math.random() * textZones.length)];
        const hasCharacter = !!characterImages[idx];
        const textZone = hasCharacter ? randomZone : undefined;

        // Get positions based on text zone
        const titlePos = getTextPositionForZone(textZone, 'title');
        const contentPos = getTextPositionForZone(textZone, 'content');

        return {
        id: `slide-${idx}-${Date.now()}`,
        backgroundColor: globalDesign.backgroundColor,
        accentColor: globalDesign.accentColor,
        backgroundPattern: globalDesign.pattern,
        backgroundImage: characterImages[idx], // Add generated character image
        textZone: textZone,
        elements: [
          // Title positioned in text zone
          {
            id: `title-${idx}`,
            text: s.title || "Без названия",
            x: titlePos.x,
            y: titlePos.y,
            fontSize: hasCharacter ? 38 : 48,  // Smaller with character for better fit
            color: textColor,
            fontFamily: 'Oswald',
            fontWeight: 'bold',
            width: titlePos.width,
            textAlign: 'left',
            animation: 'slide-down'
          },
          // Content positioned in text zone
          {
            id: `content-${idx}`,
            text: s.content || "",
            x: contentPos.x,
            y: contentPos.y,
            fontSize: hasCharacter ? 18 : 24,  // Smaller with character
            color: subtleTextColor,
            fontFamily: 'Inter',
            fontWeight: 'normal',
            width: contentPos.width,
            textAlign: 'left',
            animation: 'fade-in'
          }
          // Badge с номером слайда отображается отдельно (не текстовый элемент)
        ]
        };
      });

      console.log('✅ Слайды созданы:', newSlides.length);
      console.log('💾 Сохранение слайдов в состояние...');

      setSlides(newSlides);

      console.log('📚 Сохранение в историю...');

      // Save to history WITHOUT background images (they're too large for localStorage)
      try {
        const slidesForHistory = newSlides.map(slide => ({
          ...slide,
          backgroundImage: undefined // Remove base64 images to prevent localStorage quota exceeded
        }));

        addToHistory({
          id: Date.now().toString(),
          type: 'carousel',
          timestamp: Date.now(),
          title: textInput.length > 30 ? textInput.substring(0, 30) + '...' : textInput,
          data: slidesForHistory
        });

        console.log('✅ История сохранена (без изображений персонажей)');
      } catch (historyError) {
        console.warn('⚠️ Не удалось сохранить в историю (возможно переполнен localStorage):', historyError);
        // Continue execution even if history save fails
      }
      console.log('📊 Отслеживание использования...');

      // Track usage and refresh limit
      try {
        if (user) {
          await trackGeneration(user.id, 'carousel', {
            topic: pendingTopic,
            style: selectedStyle,
            language: settings.language,
            slideCount: settings.slideCount,
            includeOriginal: settings.includeOriginalText,
            visualStorytelling: settings.visualStorytellingEnabled,
            characterType: settings.characterImage,
            generatedSlides: newSlides.length
          });
          console.log('✅ Использование отслежено');
          await refreshLimit();
          console.log('✅ Лимит обновлен');
        }
      } catch (error) {
        console.error('Failed to track usage:', error);
      }

      console.log('🧹 Очистка инпута...');
      setTextInput(''); // Clear input after generation
      console.log('✅✅✅ ВСЕ ГОТОВО! Генерация успешно завершена!');
    } catch (error) {
      console.error('❌ КРИТИЧЕСКАЯ ОШИБКА:', error);
      console.error('❌ Детали ошибки:', JSON.stringify(error, null, 2));
      alert(`Произошла ошибка при генерации карусели: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      console.log('🏁 Генерация завершена');
      setIsGenerating(false);
    }
  };

  const restoreHistoryItem = (item: HistoryItem) => {
    setSlides(item.data);
    setShowHistory(false);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("ru-RU", {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const currentStyleLabel = STYLE_OPTIONS.find(s => s.id === selectedStyle)?.label || 'Авто';

  return (
    <div className="flex flex-col min-h-screen font-sans" style={{background: 'var(--color-warm-white)', color: 'var(--color-charcoal)'}}>
      {/* Header */}
      <header className="backdrop-blur-md sticky top-0 z-50" style={{background: 'rgba(250, 248, 246, 0.8)', borderBottom: '1px solid rgba(13, 59, 102, 0.1)'}}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Swipely Logo Icon */}
            <div className="relative group cursor-pointer">
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform group-hover:scale-110">
                {/* Background Circle */}
                <rect width="44" height="44" rx="12" fill="url(#logoGradient)"/>

                {/* Swipe Arrow with Trail */}
                <path d="M12 22L28 22M28 22L24 18M28 22L24 26"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.3"/>
                <path d="M16 22L32 22M32 22L28 18M32 22L28 26"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{animation: 'swipe-motion 2s ease-in-out infinite'}}
                      className="group-hover:translate-x-1 transition-transform"/>

                {/* Gradient Definition */}
                <defs>
                  <linearGradient id="logoGradient" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FF6B6B"/>
                    <stop offset="1" stopColor="#EE5A6F"/>
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 rounded-xl opacity-30 blur-xl transition-opacity group-hover:opacity-50" style={{background: 'linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%)'}}></div>
            </div>

            {/* Brand Name */}
            <h1 className="flex items-baseline gap-1">
              <span className="font-display font-bold text-2xl" style={{color: 'var(--color-charcoal)'}}>Swipely</span>
              <span className="font-mono text-sm font-bold" style={{color: 'var(--color-coral)'}}>.ai</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(true)}
              className="p-2.5 rounded-xl transition-all hover:scale-105 relative"
              style={{color: 'var(--color-teal-light)', background: history.length > 0 ? 'var(--color-cream)' : 'transparent'}}
              title="История"
            >
              <i className="ph-fill ph-clock-counter-clockwise text-xl"></i>
              {history.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold text-white" style={{background: 'var(--color-coral)', boxShadow: '0 2px 8px rgba(255, 107, 107, 0.4)'}}>{history.length}</span>
              )}
            </button>

            {/* Admin Button */}
            {user && isAdmin(user.email) && (
              <>
                <button
                  onClick={() => setShowAdminPanel(true)}
                  className="p-2.5 rounded-xl transition-all hover:scale-105"
                  style={{color: 'var(--color-teal)', background: 'var(--color-cream)'}}
                  title="Админ-панель"
                >
                  <i className="ph-fill ph-shield text-xl"></i>
                </button>
                <div className="h-6 w-px" style={{background: 'var(--color-cream)'}}></div>
              </>
            )}

            {/* Pricing Button */}
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="text-sm font-medium px-4 py-2 rounded-xl transition-all hover:scale-105 flex items-center gap-1.5"
              style={{color: 'var(--color-coral)', background: 'var(--color-cream)'}}
              title="Тарифы"
            >
              <i className="ph-fill ph-crown text-base"></i>
              <span className="hidden sm:inline">Тарифы</span>
            </button>

            {/* Usage Badge - For authenticated users */}
            {user && usageLimit && (
              <>
                <div className="h-6 w-px" style={{background: 'var(--color-cream)'}}></div>
                <UsageBadge
                  remaining={usageLimit.remainingGenerations}
                  isPro={usageLimit.isPro}
                  onUpgradeClick={() => setShowUpgradeModal(true)}
                />
              </>
            )}

            {/* Auth Button - ВРЕМЕННО СКРЫТО для тестирования */}
            {/* TODO: Раскомментировать после настройки Supabase */}
            {/* <div className="h-6 w-px" style={{background: 'var(--color-cream)'}}></div>
            {user ? (
              <button
                onClick={() => signOut()}
                className="text-sm font-medium px-4 py-2 rounded-xl transition-all hover:scale-105"
                style={{color: 'var(--color-teal)', background: 'var(--color-cream)'}}
              >
                Выйти
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="text-sm font-semibold px-5 py-2.5 rounded-full transition-all hover:scale-105 shadow-lg"
                style={{background: 'linear-gradient(135deg, #0D3B66 0%, #1A5F7A 100%)', color: '#FFFFFF'}}
              >
                Войти
              </button>
            )} */}
          </div>
        </div>
      </header>

      {/* History Sidebar */}
      {showHistory && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setShowHistory(false)}
          ></div>
          <div className="relative w-80 shadow-2xl h-full flex flex-col animate-slide-in-right custom-scrollbar" style={{background: 'var(--color-warm-white)'}}>
            <div className="p-5 border-b flex items-center justify-between" style={{borderColor: 'var(--color-cream)', background: 'var(--color-cream)'}}>
               <h3 className="font-bold flex items-center gap-2" style={{color: 'var(--color-charcoal)'}}>
                 <i className="ph ph-clock-counter-clockwise" style={{color: 'var(--color-teal)'}}></i> История генераций
               </h3>
               <button onClick={() => setShowHistory(false)} className="transition-colors" style={{color: 'var(--color-teal-light)'}} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-coral)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-teal-light)'}>
                 <i className="ph ph-x text-lg"></i>
               </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
              {history.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  История пуста. <br/>Начните творить!
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => restoreHistoryItem(item)}
                    className="group p-3 rounded-xl border cursor-pointer transition-all flex gap-3 items-start"
                    style={{borderColor: 'var(--color-cream)'}}
                    onMouseEnter={(e) => {e.currentTarget.style.borderColor = 'var(--color-coral)'; e.currentTarget.style.background = 'var(--color-cream)'}}
                    onMouseLeave={(e) => {e.currentTarget.style.borderColor = 'var(--color-cream)'; e.currentTarget.style.background = 'transparent'}}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{background: item.type === 'carousel' ? 'var(--color-cream)' : 'var(--color-cream)', color: 'var(--color-teal)'}}>
                      <i className={`ph ${item.type === 'carousel' ? 'ph-slideshow' : 'ph-image'}`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{color: 'var(--color-charcoal)'}}>{item.title || "Без названия"}</p>
                      <p className="text-xs mt-1" style={{color: 'var(--color-teal-light)'}}>{formatDate(item.timestamp)}</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 self-center" style={{color: 'var(--color-coral)'}}>
                      <i className="ph ph-arrow-right"></i>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t" style={{borderColor: 'var(--color-cream)'}}>
              <button
                onClick={() => {
                  if(confirm("Очистить всю историю?")) {
                    setHistory([]);
                    localStorage.removeItem('instagenius_history');
                  }
                }}
                className="w-full text-xs font-medium py-2 flex items-center justify-center gap-1 transition-colors"
                style={{color: 'var(--color-coral)'}}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-coral-dark)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-coral)'}
              >
                <i className="ph ph-trash"></i> Очистить историю
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 relative">
        <div className="min-h-full flex flex-col">
            {slides.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
                {/* Decorative Blobs */}
                <div className="blob blob-coral anim-float" style={{width: '500px', height: '500px', top: '-200px', left: '-150px'}}></div>
                <div className="blob blob-teal anim-float" style={{width: '600px', height: '600px', bottom: '-250px', right: '-200px', animationDelay: '2s'}}></div>
                <div className="blob blob-butter anim-float" style={{width: '400px', height: '400px', top: '50%', right: '10%', animationDelay: '4s'}}></div>

                <div className="max-w-3xl w-full relative z-10">
                  {/* Cute Character SVG */}
                  <div className="mb-8 inline-block anim-slide-down stagger-1" style={{width: 'clamp(100px, 20vw, 140px)', height: 'clamp(100px, 20vw, 140px)'}}>
                    <svg width="100%" height="100%" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="anim-float" style={{filter: 'drop-shadow(0 10px 30px rgba(255, 107, 107, 0.2))'}}>
                      {/* Cat Body */}
                      <circle cx="70" cy="80" r="35" fill="#FF6B6B"/>

                      {/* Cat Head */}
                      <circle cx="70" cy="50" r="28" fill="#FF6B6B"/>

                      {/* Left Ear */}
                      <path d="M 50 35 L 45 15 L 60 30 Z" fill="#FF6B6B"/>

                      {/* Right Ear */}
                      <path d="M 90 35 L 95 15 L 80 30 Z" fill="#FF6B6B"/>

                      {/* Inner Left Ear */}
                      <path d="M 52 33 L 48 20 L 58 32 Z" fill="#FFD93D"/>

                      {/* Inner Right Ear */}
                      <path d="M 88 33 L 92 20 L 82 32 Z" fill="#FFD93D"/>

                      {/* Eyes */}
                      <circle cx="62" cy="48" r="3" fill="#2D3142"/>
                      <circle cx="78" cy="48" r="3" fill="#2D3142"/>

                      {/* Eye Highlights */}
                      <circle cx="63" cy="47" r="1.5" fill="white"/>
                      <circle cx="79" cy="47" r="1.5" fill="white"/>

                      {/* Nose */}
                      <path d="M 70 54 L 68 58 L 72 58 Z" fill="#EE5A6F"/>

                      {/* Smile */}
                      <path d="M 68 58 Q 70 62 72 58" stroke="#2D3142" strokeWidth="1.5" fill="none" strokeLinecap="round"/>

                      {/* Whiskers Left */}
                      <line x1="50" y1="52" x2="35" y2="50" stroke="#2D3142" strokeWidth="1.2" strokeLinecap="round"/>
                      <line x1="50" y1="56" x2="35" y2="58" stroke="#2D3142" strokeWidth="1.2" strokeLinecap="round"/>

                      {/* Whiskers Right */}
                      <line x1="90" y1="52" x2="105" y2="50" stroke="#2D3142" strokeWidth="1.2" strokeLinecap="round"/>
                      <line x1="90" y1="56" x2="105" y2="58" stroke="#2D3142" strokeWidth="1.2" strokeLinecap="round"/>

                      {/* Left Paw */}
                      <ellipse cx="55" cy="108" rx="8" ry="10" fill="#FF6B6B"/>

                      {/* Right Paw */}
                      <ellipse cx="85" cy="108" rx="8" ry="10" fill="#FF6B6B"/>

                      {/* Tail */}
                      <path d="M 100 85 Q 120 75 125 90 Q 128 100 120 105" stroke="#FF6B6B" strokeWidth="12" fill="none" strokeLinecap="round"/>

                      {/* Belly Spot */}
                      <ellipse cx="70" cy="85" rx="15" ry="18" fill="#FFD93D" opacity="0.6"/>

                      {/* Sparkle 1 */}
                      <g className="anim-sparkle" style={{transformOrigin: '25px 25px'}}>
                        <path d="M 25 20 L 26 25 L 25 30 L 24 25 Z" fill="#FFD93D"/>
                        <path d="M 20 25 L 25 26 L 30 25 L 25 24 Z" fill="#FFD93D"/>
                      </g>

                      {/* Sparkle 2 */}
                      <g className="anim-sparkle" style={{transformOrigin: '115px 35px', animationDelay: '0.3s'}}>
                        <path d="M 115 30 L 116 35 L 115 40 L 114 35 Z" fill="#0D3B66"/>
                        <path d="M 110 35 L 115 36 L 120 35 L 115 34 Z" fill="#0D3B66"/>
                      </g>
                    </svg>
                  </div>

                  {/* Hero Title */}
                  <h2 className="font-display font-bold mb-4 leading-[1.1] anim-slide-up stagger-2 px-4" style={{color: 'var(--color-charcoal)', fontSize: 'var(--text-6xl)'}}>
                    Создай карусель
                  </h2>

                  {/* Subtitle */}
                  <p className="mb-12 max-w-2xl mx-auto leading-relaxed font-light anim-slide-up stagger-3 px-4" style={{color: 'var(--color-teal-light)', fontSize: 'var(--text-xl)'}}>
                    Превращай идеи в готовые карусели<br className="hidden sm:block"/>
                    <span className="sm:hidden"> </span>для соц. сетей за секунды ✨
                  </p>

                  {/* Input Container */}
                  <div className="bg-white/80 backdrop-blur-sm p-3 sm:p-4 rounded-3xl flex flex-col gap-3 relative anim-slide-up stagger-4" style={{boxShadow: '0 20px 60px rgba(13, 59, 102, 0.15), 0 0 0 1px rgba(13, 59, 102, 0.1)'}}>
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Например: '5 советов по здоровому питанию' или вставьте текст..."
                      className="w-full bg-transparent rounded-2xl focus:outline-none resize-none font-light placeholder:font-light transition-all"
                      style={{color: 'var(--color-charcoal)', caretColor: 'var(--color-coral)', height: 'clamp(100px, 20vh, 144px)', padding: 'var(--space-md)', fontSize: 'var(--text-lg)'}}
                    />
                    <div className="flex justify-between items-center px-2 sm:px-3 pb-1 relative gap-2 sm:gap-4 flex-wrap">
                       <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                         <span className="font-mono px-2 sm:px-3 py-1.5 rounded-full" style={{background: 'var(--color-cream)', color: 'var(--color-teal)', fontSize: 'var(--text-xs)'}}>
                           <i className="ph-fill ph-brain mr-1"></i>
                           <span className="hidden xs:inline">Claude 3.5 Haiku</span>
                           <span className="xs:hidden">Claude</span>
                         </span>
                         <div className="h-4 w-px hidden sm:block" style={{background: 'var(--color-cream)'}}></div>
                         
                         {/* Visual Style Selector */}
                         <div className="relative" ref={stylePickerRef}>
                           <button
                             onClick={() => setIsStylePickerOpen(!isStylePickerOpen)}
                             className="flex items-center gap-2 text-xs font-medium py-2 px-4 rounded-full transition-all hover:scale-105"
                             style={{background: 'var(--color-cream)', color: 'var(--color-charcoal)', border: '1px solid rgba(13, 59, 102, 0.1)'}}
                           >
                             <i className="ph-fill ph-palette" style={{color: 'var(--color-coral)'}}></i>
                             <span style={{color: 'var(--color-teal)'}}>Стиль:</span>
                             <span className="font-semibold" style={{color: 'var(--color-coral)'}}>{currentStyleLabel}</span>
                             <i className={`ph ph-caret-down transition-transform ${isStylePickerOpen ? 'rotate-180' : ''}`} style={{color: 'var(--color-teal-light)'}}></i>
                           </button>

                           {isStylePickerOpen && (
                             <div className="absolute bottom-full left-0 mb-2 w-72 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-3 grid grid-cols-2 gap-2 z-30 animate-scale-in origin-bottom-left" style={{border: '1px solid rgba(13, 59, 102, 0.1)'}}>
                               <div className="col-span-2 text-xs font-bold uppercase tracking-wider mb-1 px-1" style={{color: 'var(--color-teal-light)'}}>Выберите стиль</div>
                               {STYLE_OPTIONS.map(style => (
                                 <button
                                    key={style.id}
                                    onClick={() => { setSelectedStyle(style.id); setIsStylePickerOpen(false); }}
                                    className={`flex flex-col items-center p-2.5 rounded-xl transition-all text-left group ${
                                      selectedStyle === style.id
                                        ? 'ring-2 scale-105'
                                        : 'hover:scale-105'
                                    }`}
                                    style={{
                                      background: selectedStyle === style.id ? 'var(--color-cream)' : 'transparent',
                                      border: selectedStyle === style.id ? '1px solid var(--color-coral)' : '1px solid rgba(13, 59, 102, 0.1)',
                                      ringColor: 'var(--color-coral)'
                                    }}
                                 >
                                    <div
                                      className="w-full h-10 rounded-lg mb-2 border shadow-sm overflow-hidden relative"
                                      style={{...style.preview, borderColor: 'rgba(13, 59, 102, 0.1)'}}
                                    >
                                      {style.icon && <i className={`ph ${style.icon} text-lg absolute`} style={{color: 'var(--color-teal-light)'}}></i>}
                                    </div>
                                    <span className={`text-xs font-medium w-full text-center ${selectedStyle === style.id ? 'font-semibold' : ''}`} style={{color: selectedStyle === style.id ? 'var(--color-coral)' : 'var(--color-teal)'}}>{style.label}</span>
                                 </button>
                               ))}
                             </div>
                           )}
                         </div>

                       </div>
                       {/* CTA Button */}
                       <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !textInput.trim()}
                        className={`px-4 sm:px-8 py-3 sm:py-3.5 rounded-full font-semibold flex items-center gap-2 sm:gap-3 transition-all shadow-2xl hover:scale-105 active:scale-95 ${isGenerating ? 'opacity-75 cursor-wait' : ''} w-full sm:w-auto justify-center`}
                        style={{
                          background: isGenerating ? 'var(--color-teal)' : 'linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%)',
                          color: '#FFFFFF',
                          boxShadow: '0 20px 40px rgba(255, 107, 107, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
                          fontSize: 'var(--text-base)'
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
                            <span>Создать слайды</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Brand Tag */}
                  <div className="mt-8 flex items-center justify-center gap-2 opacity-60 anim-fade-in stagger-5">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{background: 'rgba(13, 59, 102, 0.05)'}}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8L10 8M10 8L8 6M10 8L8 10" stroke="var(--color-coral)" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
                        <path d="M5 8L13 8M13 8L11 6M13 8L11 10" stroke="var(--color-coral)" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      <span className="font-mono text-xs font-medium" style={{color: 'var(--color-teal)'}}>Создано Swipely.ai</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="backdrop-blur-sm px-6 py-3 flex items-center justify-between z-10" style={{background: 'rgba(250, 248, 246, 0.9)', borderBottom: '1px solid rgba(13, 59, 102, 0.1)'}}>
                   <button
                     onClick={() => setSlides([])}
                     className="flex items-center gap-2 text-sm font-medium transition-all hover:scale-105 px-4 py-2 rounded-xl"
                     style={{color: 'var(--color-teal)', background: 'var(--color-cream)'}}
                   >
                     <i className="ph ph-arrow-left"></i> Начать заново
                   </button>
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full animate-pulse" style={{background: 'var(--color-coral)'}}></div>
                     <span className="font-mono text-xs font-medium uppercase tracking-wider" style={{color: 'var(--color-teal-light)'}}>Режим студии</span>
                   </div>
                </div>
                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar" style={{background: 'var(--color-warm-white)'}}>
                  <CarouselEditorCompact slides={slides} setSlides={setSlides} />
                </div>
              </>
            )}
          </div>
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />

      <LimitReachedModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        onUpgrade={() => setShowUpgradeModal(true)}
      />

      {/* Admin Panel */}
      <AdminPanel
        isOpen={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
      />

      {/* Format Settings Modal */}
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
