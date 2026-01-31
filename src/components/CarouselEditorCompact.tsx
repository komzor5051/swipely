import React, { useState, useEffect, useRef } from 'react';
import { Slide, TextElement, BackgroundPattern, TextAnimation, StylePreset, FontFamily } from '../types';
import { usePresets } from '../hooks/usePresets';

interface CarouselEditorCompactProps {
  slides: Slide[];
  setSlides: React.Dispatch<React.SetStateAction<Slide[]>>;
}

declare global {
  interface Window {
    html2canvas: any;
  }
}

type EditorTab = 'design' | 'elements' | 'presets';

export const CarouselEditorCompact: React.FC<CarouselEditorCompactProps> = ({ slides, setSlides }) => {
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTab>('design');
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetName, setPresetName] = useState('');

  const canvasRef = useRef<HTMLDivElement>(null);
  const exportContainerRef = useRef<HTMLDivElement>(null);

  const activeSlide = slides[activeSlideIdx];
  const { presets, savePreset, deletePreset } = usePresets();
  const selectedElement = activeSlide?.elements.find(el => el.id === selectedElementId);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'ArrowLeft' && activeSlideIdx > 0) {
        setActiveSlideIdx(activeSlideIdx - 1);
      }
      if (e.key === 'ArrowRight' && activeSlideIdx < slides.length - 1) {
        setActiveSlideIdx(activeSlideIdx + 1);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        handleDuplicateSlide();
      }
      if (e.key === 'Delete' && selectedElementId) {
        handleDeleteElement(selectedElementId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSlideIdx, slides, selectedElementId]);

  // Helper function to get contrast color based on background brightness
  const getContrastColor = (hexColor: string): string => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
  };

  const updateElement = (elementId: string, updates: Partial<TextElement>) => {
    setSlides(prev => prev.map((slide, idx) => {
      if (idx !== activeSlideIdx) return slide;
      return {
        ...slide,
        elements: slide.elements.map(el => el.id === elementId ? { ...el, ...updates } : el)
      };
    }));
  };

  const updateGlobalStyle = (updates: Partial<Slide>) => {
    setSlides(prev => prev.map(slide => {
      // If backgroundColor is changing, update text colors automatically
      if (updates.backgroundColor) {
        const textColor = getContrastColor(updates.backgroundColor);
        const subtleTextColor = textColor === '#ffffff' ? 'rgba(255,255,255,0.9)' : 'rgba(26,26,26,0.9)';

        return {
          ...slide,
          ...updates,
          elements: slide.elements.map(el => {
            // Update element colors based on their ID
            if (el.id.includes('title')) {
              return { ...el, color: textColor };
            } else if (el.id.includes('content')) {
              return { ...el, color: subtleTextColor };
            }
            return el;
          })
        };
      }

      return {
        ...slide,
        ...updates
      };
    }));
  };

  const applyPreset = (preset: StylePreset) => {
    updateGlobalStyle({
      backgroundColor: preset.backgroundColor,
      accentColor: preset.accentColor,
      backgroundPattern: preset.backgroundPattern
    });
  };

  const handleDuplicateSlide = () => {
    const duplicatedSlide: Slide = {
      ...activeSlide,
      id: Math.random().toString(36),
      elements: activeSlide.elements.map(el => ({
        ...el,
        id: Math.random().toString(36)
      }))
    };
    const newSlides = [...slides];
    newSlides.splice(activeSlideIdx + 1, 0, duplicatedSlide);
    setSlides(newSlides);
    setActiveSlideIdx(activeSlideIdx + 1);
  };

  const handleDeleteSlide = () => {
    if (slides.length === 1) {
      alert('Невозможно удалить последний слайд');
      return;
    }
    if (confirm('Удалить этот слайд?')) {
      const newSlides = slides.filter((_, idx) => idx !== activeSlideIdx);
      setSlides(newSlides);
      setActiveSlideIdx(Math.max(0, activeSlideIdx - 1));
    }
  };

  const handleDeleteElement = (elementId: string) => {
    setSlides(prev => prev.map((slide, idx) => {
      if (idx !== activeSlideIdx) return slide;
      return {
        ...slide,
        elements: slide.elements.filter(el => el.id !== elementId)
      };
    }));
    setSelectedElementId(null);
  };

  const handleDownloadAll = async () => {
    if (!exportContainerRef.current || !window.html2canvas) return;
    setIsDownloading(true);

    try {
      const slideElements = exportContainerRef.current.children;
      for (let i = 0; i < slideElements.length; i++) {
        const element = slideElements[i] as HTMLElement;
        const canvas = await window.html2canvas(element, {
          scale: 2,
          backgroundColor: null,
          logging: false
        });

        const link = document.createElement('a');
        link.download = `slide-${i + 1}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert("Не удалось скачать изображения.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedElementId(id);
    setDraggingId(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    updateElement(draggingId, { x: x - 50, y: y - 20 });
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      alert('Введите название пресета');
      return;
    }

    const newPreset: StylePreset = {
      id: Date.now().toString(),
      name: presetName,
      backgroundColor: activeSlide.backgroundColor,
      accentColor: activeSlide.accentColor,
      backgroundPattern: activeSlide.backgroundPattern,
      isBuiltIn: false,
      createdAt: Date.now()
    };

    savePreset(newPreset);
    setShowPresetModal(false);
    setPresetName('');
  };

  const getBackgroundStyle = (slide: Slide) => {
    const base: React.CSSProperties = {
      backgroundColor: slide.backgroundColor,
    };

    switch (slide.backgroundPattern) {
      case 'gradient-tr':
        return { ...base, backgroundImage: `linear-gradient(to top right, ${slide.backgroundColor}, ${slide.accentColor})` };
      case 'gradient-bl':
        return { ...base, backgroundImage: `linear-gradient(to bottom left, ${slide.backgroundColor}, ${slide.accentColor})` };
      case 'dots':
        return {
          ...base,
          backgroundImage: `radial-gradient(${slide.accentColor}33 2px, transparent 2px)`,
          backgroundSize: '20px 20px'
        };
      case 'stripes':
        return {
          ...base,
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, ${slide.accentColor}22 10px, ${slide.accentColor}22 20px)`
        };
      case 'grid':
        return {
          ...base,
          backgroundImage: `linear-gradient(${slide.accentColor}22 1px, transparent 1px), linear-gradient(90deg, ${slide.accentColor}22 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        };
      case 'sketch':
        return {
          ...base,
          backgroundImage: `linear-gradient(45deg, ${slide.accentColor}22 25%, transparent 25%, transparent 75%, ${slide.accentColor}22 75%, ${slide.accentColor}22), linear-gradient(45deg, ${slide.accentColor}22 25%, transparent 25%, transparent 75%, ${slide.accentColor}22 75%, ${slide.accentColor}22)`,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 10px 10px'
        };
      default:
        return base;
    }
  };

  const renderStyledText = (text: string, accentColor: string) => {
    if (!text || typeof text !== 'string') return null;

    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <span key={i} style={{ color: accentColor, fontWeight: 'bold' }}>
            {part.slice(2, -2)}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const renderTitle = (text: string, element: TextElement, slideAccentColor: string, slidePattern?: BackgroundPattern) => {
    if (!text || typeof text !== 'string') return null;

    const isMainTitle = element.id.includes('title');
    const pattern = slidePattern || activeSlide.backgroundPattern;
    const titleStyle = isMainTitle ? getTitleStyle(element, slideAccentColor, pattern) : null;

    if (!titleStyle) {
      return renderStyledText(text, slideAccentColor);
    }

    const words = text.split(' ');

    return (
      <span style={{ display: 'inline-block', position: 'relative' }}>
        {titleStyle.type === 'gradient' && (
          <span
            style={{
              background: `linear-gradient(135deg, ${titleStyle.color1} 0%, ${titleStyle.color2} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: element.fontWeight,
              display: 'inline-block',
            }}
          >
            {text}
          </span>
        )}

        {titleStyle.type === 'highlight' && (
          <span style={{ position: 'relative', display: 'inline-block' }}>
            <span
              style={{
                position: 'absolute',
                bottom: '4px',
                left: '-4px',
                right: '-4px',
                height: '50%',
                background: titleStyle.highlightColor,
                opacity: 0.3,
                borderRadius: '4px',
                zIndex: -1,
              }}
            />
            <span style={{ position: 'relative', fontWeight: element.fontWeight }}>
              {text}
            </span>
          </span>
        )}

        {titleStyle.type === 'underline' && (
          <span style={{ position: 'relative', display: 'inline-block' }}>
            <span style={{ fontWeight: element.fontWeight }}>{text}</span>
            <span
              style={{
                position: 'absolute',
                bottom: '-4px',
                left: 0,
                width: '100%',
                height: '3px',
                background: `linear-gradient(90deg, ${titleStyle.color1} 0%, ${titleStyle.color2} 100%)`,
                borderRadius: '2px',
              }}
            />
          </span>
        )}

        {titleStyle.type === 'split' && (
          <span>
            <span
              style={{
                color: titleStyle.color1,
                fontWeight: element.fontWeight,
              }}
            >
              {words[0]}{' '}
            </span>
            <span
              style={{
                color: titleStyle.color2,
                fontWeight: element.fontWeight,
              }}
            >
              {words.slice(1).join(' ')}
            </span>
          </span>
        )}

        {titleStyle.type === 'glow' && (
          <span
            style={{
              color: titleStyle.color1,
              fontWeight: element.fontWeight,
              textShadow: `0 0 20px ${titleStyle.glowColor}, 0 0 40px ${titleStyle.glowColor}`,
              display: 'inline-block',
            }}
          >
            {text}
          </span>
        )}
      </span>
    );
  };

  const getTitleStyle = (element: TextElement, accentColor: string, bgPattern: BackgroundPattern) => {
    const styles = {
      'solid': {
        type: 'gradient' as const,
        color1: '#FF6B6B',
        color2: '#0D3B66',
      },
      'gradient-tr': {
        type: 'highlight' as const,
        highlightColor: '#FFD93D',
      },
      'gradient-bl': {
        type: 'underline' as const,
        color1: '#FF6B6B',
        color2: '#FFD93D',
      },
      'dots': {
        type: 'split' as const,
        color1: '#FF6B6B',
        color2: '#0D3B66',
      },
      'stripes': {
        type: 'gradient' as const,
        color1: '#0D3B66',
        color2: '#FFD93D',
      },
      'grid': {
        type: 'glow' as const,
        color1: accentColor || '#FF6B6B',
        glowColor: 'rgba(255, 107, 107, 0.4)',
      },
      'sketch': {
        type: 'highlight' as const,
        highlightColor: '#FF6B6B',
      },
    };

    return styles[bgPattern] || styles['solid'];
  };

  if (!activeSlide) return <div className="p-10 text-center text-gray-500">Слайды еще не созданы.</div>;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-warm-white)' }}>
      {/* Left Sidebar - Vertical Tabs */}
      <div className="flex flex-row">
        {/* Tab Icons */}
        <div className="w-16 flex flex-col gap-1 p-2" style={{ background: 'var(--color-cream)', borderRight: '1px solid rgba(13, 59, 102, 0.1)' }}>
          <button
            onClick={() => setActiveTab('design')}
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
            style={{
              background: activeTab === 'design' ? 'var(--color-coral)' : 'transparent',
              color: activeTab === 'design' ? 'white' : 'var(--color-teal)',
            }}
            title="Дизайн"
          >
            <i className="ph-fill ph-paint-brush text-xl"></i>
          </button>

          <button
            onClick={() => setActiveTab('elements')}
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
            style={{
              background: activeTab === 'elements' ? 'var(--color-coral)' : 'transparent',
              color: activeTab === 'elements' ? 'white' : 'var(--color-teal)',
            }}
            title="Элементы"
          >
            <i className="ph-fill ph-text-aa text-xl"></i>
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
            style={{
              background: activeTab === 'presets' ? 'var(--color-coral)' : 'transparent',
              color: activeTab === 'presets' ? 'white' : 'var(--color-teal)',
            }}
            title="Пресеты"
          >
            <i className="ph-fill ph-stack text-xl"></i>
          </button>

          <div className="flex-1"></div>

          <button
            onClick={handleDownloadAll}
            disabled={isDownloading}
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
            style={{
              background: 'linear-gradient(135deg, var(--color-coral) 0%, var(--color-coral-dark) 100%)',
              color: 'white',
              opacity: isDownloading ? 0.6 : 1,
            }}
            title="Скачать все"
          >
            <i className={`ph-fill ${isDownloading ? 'ph-spinner animate-spin' : 'ph-download-simple'} text-xl`}></i>
          </button>
        </div>

        {/* Tab Content */}
        <div className="w-72 overflow-y-auto custom-scrollbar p-4" style={{ background: 'var(--color-warm-white)', maxHeight: '100vh' }}>
          {/* Design Tab */}
          {activeTab === 'design' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <i className="ph-fill ph-paint-brush text-2xl" style={{ color: 'var(--color-coral)' }}></i>
                <h3 className="text-lg font-bold" style={{ color: 'var(--color-charcoal)', fontFamily: 'var(--font-display)' }}>
                  Общий стиль
                </h3>
              </div>

              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--color-teal)' }}>
                  ПАТТЕРН
                </label>
                <select
                  value={activeSlide.backgroundPattern}
                  onChange={(e) => updateGlobalStyle({ backgroundPattern: e.target.value as BackgroundPattern })}
                  className="w-full rounded-lg p-2.5 text-sm outline-none transition-all border"
                  style={{ background: 'var(--color-cream)', borderColor: 'var(--color-cream)', color: 'var(--color-charcoal)' }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-coral)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--color-cream)'}
                >
                  <option value="solid">Сплошной</option>
                  <option value="gradient-tr">Градиент ↗</option>
                  <option value="gradient-bl">Градиент ↙</option>
                  <option value="dots">Точки</option>
                  <option value="stripes">Полосы</option>
                  <option value="grid">Сетка</option>
                  <option value="sketch">Набросок</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--color-teal)' }}>
                  ФОН
                </label>
                <input
                  type="color"
                  value={activeSlide.backgroundColor}
                  onChange={(e) => updateGlobalStyle({ backgroundColor: e.target.value })}
                  className="w-full h-12 rounded-lg cursor-pointer border-2"
                  style={{ borderColor: 'var(--color-cream)' }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--color-teal)' }}>
                  АКЦЕНТ
                </label>
                <input
                  type="color"
                  value={activeSlide.accentColor}
                  onChange={(e) => updateGlobalStyle({ accentColor: e.target.value })}
                  className="w-full h-12 rounded-lg cursor-pointer border-2"
                  style={{ borderColor: 'var(--color-cream)' }}
                />
              </div>
            </div>
          )}

          {/* Elements Tab */}
          {activeTab === 'elements' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <i className="ph-fill ph-text-aa text-2xl" style={{ color: 'var(--color-coral)' }}></i>
                <h3 className="text-lg font-bold" style={{ color: 'var(--color-charcoal)', fontFamily: 'var(--font-display)' }}>
                  Элементы
                </h3>
              </div>

              {!selectedElement && (
                <div className="text-sm p-4 rounded-lg text-center" style={{ background: 'var(--color-cream)', color: 'var(--color-teal-light)' }}>
                  Выберите элемент на холсте
                </div>
              )}

              {selectedElement && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--color-teal)' }}>
                      ТЕКСТ
                    </label>
                    <textarea
                      value={selectedElement.text}
                      onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                      className="w-full rounded-lg p-3 text-sm outline-none border resize-none"
                      style={{ background: 'var(--color-cream)', borderColor: 'var(--color-cream)', color: 'var(--color-charcoal)', minHeight: '80px' }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--color-coral)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--color-cream)'}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--color-teal)' }}>
                        РАЗМЕР
                      </label>
                      <input
                        type="number"
                        value={selectedElement.fontSize}
                        onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                        className="w-full rounded-lg p-2 text-sm outline-none border"
                        style={{ background: 'var(--color-cream)', borderColor: 'var(--color-cream)', color: 'var(--color-charcoal)' }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--color-coral)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--color-cream)'}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--color-teal)' }}>
                        ЦВЕТ
                      </label>
                      <input
                        type="color"
                        value={selectedElement.color}
                        onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                        className="w-full h-10 rounded-lg cursor-pointer border-2"
                        style={{ borderColor: 'var(--color-cream)' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--color-teal)' }}>
                      ШРИФТ
                    </label>
                    <select
                      value={selectedElement.fontFamily}
                      onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value as FontFamily })}
                      className="w-full rounded-lg p-2 text-sm outline-none border"
                      style={{ background: 'var(--color-cream)', borderColor: 'var(--color-cream)', color: 'var(--color-charcoal)' }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--color-coral)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--color-cream)'}
                    >
                      <optgroup label="Sans-Serif">
                        <option value="Inter">Inter</option>
                        <option value="Montserrat">Montserrat</option>
                        <option value="Poppins">Poppins</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Outfit">Outfit</option>
                      </optgroup>
                      <optgroup label="Serif">
                        <option value="Playfair Display">Playfair Display</option>
                        <option value="Merriweather">Merriweather</option>
                        <option value="Lora">Lora</option>
                      </optgroup>
                      <optgroup label="Display">
                        <option value="Oswald">Oswald</option>
                        <option value="Bebas Neue">Bebas Neue</option>
                      </optgroup>
                    </select>
                  </div>

                  <button
                    onClick={() => handleDeleteElement(selectedElement.id)}
                    className="w-full py-2 rounded-lg font-semibold text-sm transition-all"
                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#EF4444';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                      e.currentTarget.style.color = '#EF4444';
                    }}
                  >
                    <i className="ph-bold ph-trash"></i> Удалить
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Presets Tab */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <i className="ph-fill ph-stack text-2xl" style={{ color: 'var(--color-coral)' }}></i>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--color-charcoal)', fontFamily: 'var(--font-display)' }}>
                    Пресеты
                  </h3>
                </div>
                <button
                  onClick={() => setShowPresetModal(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: 'var(--color-coral)', color: 'white' }}
                >
                  <i className="ph-bold ph-plus"></i>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {presets.map(preset => (
                  <div
                    key={preset.id}
                    className="relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all"
                    style={{
                      borderColor: 'var(--color-cream)',
                      background: preset.backgroundColor
                    }}
                    onClick={() => applyPreset(preset)}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-coral)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-cream)'}
                  >
                    <div
                      className="h-20"
                      style={getBackgroundStyle({
                        ...activeSlide,
                        backgroundColor: preset.backgroundColor,
                        accentColor: preset.accentColor,
                        backgroundPattern: preset.backgroundPattern
                      })}
                    ></div>
                    <div className="p-2 bg-white/90">
                      <div className="text-xs font-semibold truncate" style={{ color: 'var(--color-charcoal)' }}>
                        {preset.name}
                      </div>
                    </div>
                    {!preset.isBuiltIn && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Удалить пресет?')) {
                            deletePreset(preset.id);
                          }
                        }}
                        className="absolute top-1 right-1 w-6 h-6 rounded-md bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                      >
                        <i className="ph-bold ph-x"></i>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Toolbar */}
        <div className="flex items-center justify-between px-6 py-3" style={{ background: 'var(--color-cream)', borderBottom: '1px solid rgba(13, 59, 102, 0.1)' }}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: 'var(--color-teal)' }}>
              Слайд {activeSlideIdx + 1} из {slides.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDuplicateSlide}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
              style={{ background: 'var(--color-warm-white)', color: 'var(--color-teal)' }}
              title="Дублировать (Cmd+D)"
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-coral)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-warm-white)'}
            >
              <i className="ph-bold ph-copy"></i>
            </button>

            <button
              onClick={handleDeleteSlide}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
              style={{ background: 'var(--color-warm-white)', color: '#EF4444' }}
              title="Удалить"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#EF4444';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--color-warm-white)';
                e.currentTarget.style.color = '#EF4444';
              }}
            >
              <i className="ph-bold ph-trash"></i>
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div
            ref={canvasRef}
            className="relative rounded-2xl shadow-2xl overflow-hidden"
            style={{
              width: 'min(540px, 90vw)',
              height: 'min(540px, 90vw)',
              ...getBackgroundStyle(activeSlide)
            }}
            onClick={() => setSelectedElementId(null)}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* Background Character Image (если есть) */}
            {activeSlide.backgroundImage && (
              <>
                <img
                  src={activeSlide.backgroundImage}
                  alt="Character"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: 0
                  }}
                />
                {/* Gradient Overlay для читаемости текста */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.4) 100%)',
                    zIndex: 1
                  }}
                />
              </>
            )}

            {/* Slide Number Badge */}
            <div
              className="absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)',
                color: 'var(--color-charcoal)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 30
              }}
            >
              {activeSlideIdx + 1}/{slides.length}
            </div>

            {/* Text Elements */}
            {activeSlide.elements.map((el) => (
              <div
                key={el.id}
                style={{
                  position: 'absolute',
                  left: el.x,
                  top: el.y,
                  width: `${el.width}px`,
                  fontSize: `${el.fontSize}px`,
                  color: el.color,
                  fontFamily: el.fontFamily,
                  fontWeight: el.fontWeight,
                  textAlign: el.textAlign || 'left',
                  cursor: draggingId === el.id ? 'grabbing' : 'grab',
                  padding: '10px',
                  lineHeight: '1.4',
                  border: selectedElementId === el.id ? '2px dashed var(--color-coral)' : '2px solid transparent',
                  borderRadius: '8px',
                  backgroundColor: selectedElementId === el.id ? 'rgba(255, 107, 107, 0.05)' : 'transparent',
                  zIndex: selectedElementId === el.id ? 20 : 10
                }}
                onMouseDown={(e) => handleMouseDown(e, el.id)}
                onClick={(e) => e.stopPropagation()}
              >
                {renderTitle(el.text, el, activeSlide.accentColor)}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Slide Navigation */}
        <div className="flex items-center justify-center gap-3 p-4" style={{ background: 'var(--color-cream)', borderTop: '1px solid rgba(13, 59, 102, 0.1)' }}>
          <button
            onClick={() => setActiveSlideIdx(Math.max(0, activeSlideIdx - 1))}
            disabled={activeSlideIdx === 0}
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-all"
            style={{
              background: activeSlideIdx === 0 ? 'rgba(0,0,0,0.05)' : 'var(--color-teal)',
              color: activeSlideIdx === 0 ? 'rgba(0,0,0,0.3)' : 'white',
              cursor: activeSlideIdx === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <i className="ph-bold ph-caret-left"></i>
          </button>

          <div className="flex gap-2 overflow-x-auto max-w-3xl px-2 custom-scrollbar">
            {slides.map((slide, idx) => (
              <div
                key={slide.id}
                onClick={() => setActiveSlideIdx(idx)}
                className="flex-shrink-0 rounded-lg cursor-pointer transition-all relative overflow-hidden border-2"
                style={{
                  width: '60px',
                  height: '60px',
                  borderColor: activeSlideIdx === idx ? 'var(--color-coral)' : 'transparent',
                  opacity: activeSlideIdx === idx ? 1 : 0.6,
                  transform: activeSlideIdx === idx ? 'scale(1.1)' : 'scale(1)'
                }}
              >
                <div className="w-full h-full" style={getBackgroundStyle(slide)}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-white/90 px-2 py-0.5 rounded-full font-bold text-xs">
                    {idx + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setActiveSlideIdx(Math.min(slides.length - 1, activeSlideIdx + 1))}
            disabled={activeSlideIdx === slides.length - 1}
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-all"
            style={{
              background: activeSlideIdx === slides.length - 1 ? 'rgba(0,0,0,0.05)' : 'var(--color-teal)',
              color: activeSlideIdx === slides.length - 1 ? 'rgba(0,0,0,0.3)' : 'white',
              cursor: activeSlideIdx === slides.length - 1 ? 'not-allowed' : 'pointer'
            }}
          >
            <i className="ph-bold ph-caret-right"></i>
          </button>
        </div>
      </div>

      {/* Hidden Export Container */}
      <div ref={exportContainerRef} style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        {slides.map((slide, slideIdx) => (
          <div
            key={slide.id}
            style={{
              width: '540px',
              height: '540px',
              position: 'relative',
              ...getBackgroundStyle(slide)
            }}
          >
            {/* Background Character Image for Export */}
            {slide.backgroundImage && (
              <>
                <img
                  src={slide.backgroundImage}
                  alt="Character"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: 0
                  }}
                />
                {/* Gradient Overlay for text readability */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.4) 100%)',
                    zIndex: 1
                  }}
                />
              </>
            )}

            {slide.elements.map((el) => (
              <div
                key={el.id}
                style={{
                  position: 'absolute',
                  left: el.x,
                  top: el.y,
                  width: `${el.width}px`,
                  fontSize: `${el.fontSize}px`,
                  color: el.color,
                  fontFamily: el.fontFamily,
                  fontWeight: el.fontWeight,
                  textAlign: el.textAlign || 'left',
                  padding: '10px',
                  lineHeight: '1.4'
                }}
              >
                {renderTitle(el.text, el, slide.accentColor, slide.backgroundPattern)}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Preset Save Modal */}
      {showPresetModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowPresetModal(false)}
        >
          <div
            className="p-6 rounded-2xl shadow-2xl"
            style={{ background: 'var(--color-warm-white)', width: '400px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-charcoal)', fontFamily: 'var(--font-display)' }}>
              Сохранить пресет
            </h3>
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Название пресета"
              className="w-full rounded-lg p-3 mb-4 outline-none border"
              style={{ background: 'var(--color-cream)', borderColor: 'var(--color-cream)', color: 'var(--color-charcoal)' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-coral)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--color-cream)'}
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowPresetModal(false)}
                className="flex-1 py-2 rounded-lg font-semibold transition-all"
                style={{ background: 'var(--color-cream)', color: 'var(--color-charcoal)' }}
              >
                Отмена
              </button>
              <button
                onClick={handleSavePreset}
                className="flex-1 py-2 rounded-lg font-semibold transition-all"
                style={{ background: 'var(--color-coral)', color: 'white' }}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
