
import React, { useState, useEffect, useRef } from 'react';
import { Slide, TextElement, BackgroundPattern, TextAnimation, StylePreset } from '../types';
import { PresetManager } from './Presets/PresetManager';
import { usePresets } from '../hooks/usePresets';

interface CarouselEditorProps {
  slides: Slide[];
  setSlides: React.Dispatch<React.SetStateAction<Slide[]>>;
}

declare global {
  interface Window {
    html2canvas: any;
  }
}

export const CarouselEditor: React.FC<CarouselEditorProps> = ({ slides, setSlides }) => {
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const exportContainerRef = useRef<HTMLDivElement>(null);

  const activeSlide = slides[activeSlideIdx];
  const { presets, savePreset, deletePreset } = usePresets();

  // Keyboard shortcuts for slide navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Arrow Left - Previous slide
      if (e.key === 'ArrowLeft' && activeSlideIdx > 0) {
        setActiveSlideIdx(activeSlideIdx - 1);
      }

      // Arrow Right - Next slide
      if (e.key === 'ArrowRight' && activeSlideIdx < slides.length - 1) {
        setActiveSlideIdx(activeSlideIdx + 1);
      }

      // Cmd/Ctrl + D - Duplicate slide
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSlideIdx, slides, activeSlide, setSlides]);

  const updateElement = (elementId: string, updates: Partial<TextElement>) => {
    setSlides(prev => prev.map((slide, idx) => {
      if (idx !== activeSlideIdx) return slide;
      return {
        ...slide,
        elements: slide.elements.map(el => el.id === elementId ? { ...el, ...updates } : el)
      };
    }));
  };

  // Helper to update global styles (ALL slides)
  const updateGlobalStyle = (updates: Partial<Slide>) => {
    setSlides(prev => prev.map(slide => ({
      ...slide,
      ...updates
    })));
  };

  // Apply preset to all slides
  const applyPreset = (preset: StylePreset) => {
    updateGlobalStyle({
      backgroundColor: preset.backgroundColor,
      accentColor: preset.accentColor,
      backgroundPattern: preset.backgroundPattern
    });
  };

  const handleDownloadAll = async () => {
    if (!exportContainerRef.current || !window.html2canvas) return;
    setIsDownloading(true);

    try {
      const slideElements = exportContainerRef.current.children;
      for (let i = 0; i < slideElements.length; i++) {
        const element = slideElements[i] as HTMLElement;
        const canvas = await window.html2canvas(element, { 
          scale: 2, // Higher quality
          backgroundColor: null,
          logging: false
        });
        
        const link = document.createElement('a');
        link.download = `slide-${i + 1}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        // Small delay to prevent browser throttling downloads
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

    // Center the drag roughly
    updateElement(draggingId, { x: x - 50, y: y - 20 });
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  // Keyboard deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
        setSlides(prev => prev.map((s, i) => {
           if (i !== activeSlideIdx) return s;
           return {
             ...s,
             elements: s.elements.filter(el => el.id !== selectedElementId)
           };
        }));
        setSelectedElementId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, activeSlideIdx, setSlides]);

  // Helper to determine if color is light or dark
  const getContrastColor = (bgColor: string): string => {
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return black text on light backgrounds, white on dark
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  // Get styles for text zone overlay (split-screen effect)
  const getTextZoneStyle = (zone: string): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      backgroundColor: activeSlide.backgroundColor,
      zIndex: 5,
    };

    switch (zone) {
      case 'left':
        return { ...baseStyle, left: 0, top: 0, width: '50%', height: '100%' };
      case 'right':
        return { ...baseStyle, right: 0, top: 0, width: '50%', height: '100%' };
      case 'top':
        return { ...baseStyle, left: 0, top: 0, width: '100%', height: '50%' };
      case 'bottom':
        return { ...baseStyle, left: 0, bottom: 0, width: '100%', height: '50%' };
      default:
        return baseStyle;
    }
  };

  const getBackgroundStyle = (slide: Slide): React.CSSProperties => {
    const { backgroundColor: bg, accentColor: accent, backgroundPattern: pattern, backgroundImage } = slide;

    const fade = (color: string) => color.length === 7 ? `${color}33` : color;
    const strongFade = (color: string) => color.length === 7 ? `${color}11` : color;

    // Base subtle texture to make it look premium
    const noise = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`;

    // If character image exists, use it as background (no overlay - text will be in separate zone)
    if (backgroundImage) {
      return {
        backgroundImage: `url("${backgroundImage}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }

    switch (pattern) {
      case 'gradient-tr':
        return { 
          background: `linear-gradient(to top right, ${bg}, ${accent})`,
          // Combine noise with gradient using pseudo-element technique or just simple multiple backgrounds if supported
          // Simplest here is just the gradient, noise on top is tricky without pseudo, but let's try multiple backgrounds
          backgroundImage: `${noise}, linear-gradient(to top right, ${bg}, ${accent})`,
          backgroundBlendMode: 'overlay, normal'
        };
      case 'gradient-bl':
        return { 
          backgroundImage: `${noise}, linear-gradient(to bottom left, ${bg}, ${accent})`,
          backgroundBlendMode: 'overlay, normal'
        };
      case 'dots':
        return { 
          backgroundColor: bg,
          backgroundImage: `radial-gradient(${fade(accent)} 2px, transparent 2px)`,
          backgroundSize: '20px 20px'
        };
      case 'stripes':
        return {
          backgroundColor: bg,
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, ${fade(accent)} 10px, ${fade(accent)} 20px)`
        };
      case 'grid':
        return {
          backgroundColor: bg,
          backgroundImage: `linear-gradient(${fade(accent)} 1px, transparent 1px), linear-gradient(90deg, ${fade(accent)} 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        };
      case 'sketch':
        return {
            backgroundColor: bg,
            backgroundImage: `
              linear-gradient(45deg, ${strongFade(accent)} 25%, transparent 25%, transparent 75%, ${strongFade(accent)} 75%, ${strongFade(accent)}), 
              linear-gradient(45deg, ${strongFade(accent)} 25%, transparent 25%, transparent 75%, ${strongFade(accent)} 75%, ${strongFade(accent)})
            `,
            backgroundPosition: '0 0, 10px 10px',
            backgroundSize: '20px 20px'
        };
      default: // Solid
        return { 
          backgroundColor: bg,
          backgroundImage: noise,
          backgroundBlendMode: 'overlay'
        };
    }
  };

  const getAnimationClass = (anim?: TextAnimation) => {
    switch (anim) {
      case 'fade-in': return 'anim-fade-in';
      case 'slide-up': return 'anim-slide-up';
      case 'slide-down': return 'anim-slide-down';
      case 'zoom-in': return 'anim-zoom-in';
      case 'bounce': return 'anim-bounce';
      default: return '';
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

  // Enhanced title rendering with multiple creative styles
  const renderTitle = (text: string, element: TextElement, slideAccentColor: string, slidePattern?: BackgroundPattern) => {
    if (!text || typeof text !== 'string') return null;

    // Determine title style based on element ID or font size
    const isMainTitle = element.id.includes('title');
    const pattern = slidePattern || activeSlide.backgroundPattern;
    const titleStyle = isMainTitle ? getTitleStyle(element, slideAccentColor, pattern) : null;

    if (!titleStyle) {
      // Not a title, render as regular styled text
      return renderStyledText(text, slideAccentColor);
    }

    // Split text into words for creative styling
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

  // Determine title style based on accent color and pattern
  const getTitleStyle = (element: TextElement, accentColor: string, bgPattern: BackgroundPattern) => {

    // Different styles for different patterns
    const styles = {
      'solid': {
        type: 'gradient' as const,
        color1: '#FF6B6B', // Coral
        color2: '#0D3B66', // Teal
      },
      'gradient-tr': {
        type: 'highlight' as const,
        highlightColor: '#FFD93D', // Butter
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
    <div className="flex flex-col lg:flex-row min-h-full gap-4 lg:gap-6 p-3 sm:p-4 lg:p-6">
      {/* Sidebar Controls */}
      <div className="w-full lg:w-80 flex flex-col gap-4 lg:gap-6 overflow-y-auto pr-2 custom-scrollbar pb-4 lg:pb-20 max-h-[50vh] lg:max-h-none">
        
        {/* Global Design Settings (Applies to ALL slides) */}
        <div className="p-5 rounded-2xl border shadow-sm" style={{background: 'var(--color-warm-white)', borderColor: 'var(--color-cream)'}}>
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{color: 'var(--color-charcoal)'}}>
              <i className="ph ph-paint-brush-broad text-lg" style={{color: 'var(--color-teal)'}}></i> Общий стиль
            </h3>
            <span className="text-[10px] font-medium px-2 py-1 rounded" style={{background: 'var(--color-cream)', color: 'var(--color-teal)'}}>
              Все слайды
            </span>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs mb-1 block font-medium" style={{color: 'var(--color-teal-light)'}}>Стиль дизайна</label>
              <select
                value={activeSlide.backgroundPattern}
                onChange={(e) => updateGlobalStyle({ backgroundPattern: e.target.value as BackgroundPattern })}
                className="w-full rounded-lg p-2.5 text-sm outline-none transition-all border"
                style={{background: 'var(--color-cream)', borderColor: 'var(--color-cream)', color: 'var(--color-charcoal)'}}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-coral)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-cream)'}
              >
                <option value="solid">Сплошной цвет</option>
                <option value="gradient-tr">Градиент (Вверх-вправо)</option>
                <option value="gradient-bl">Градиент (Вниз-влево)</option>
                <option value="dots">Точки</option>
                <option value="stripes">Полосы</option>
                <option value="grid">Сетка</option>
                <option value="sketch">Набросок</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs mb-1 block font-medium" style={{color: 'var(--color-teal-light)'}}>Осн. цвет</label>
                <div className="flex items-center gap-2 p-1.5 rounded-lg" style={{background: 'var(--color-cream)'}}>
                  <input
                    type="color"
                    value={activeSlide.backgroundColor}
                    onChange={(e) => updateGlobalStyle({ backgroundColor: e.target.value })}
                    className="h-6 w-6 rounded cursor-pointer bg-transparent border-none p-0"
                  />
                  <span className="text-xs font-mono" style={{color: 'var(--color-teal-light)'}}>{activeSlide.backgroundColor}</span>
                </div>
              </div>
              <div>
                <label className="text-xs mb-1 block font-medium" style={{color: 'var(--color-teal-light)'}}>Акцент</label>
                <div className="flex items-center gap-2 p-1.5 rounded-lg" style={{background: 'var(--color-cream)'}}>
                  <input
                    type="color"
                    value={activeSlide.accentColor}
                    onChange={(e) => updateGlobalStyle({ accentColor: e.target.value })}
                    className="h-6 w-6 rounded cursor-pointer bg-transparent border-none p-0"
                  />
                  <span className="text-xs font-mono" style={{color: 'var(--color-teal-light)'}}>{activeSlide.accentColor}</span>
                </div>
              </div>
            </div>
            
            <div className="pt-2 border-t border-gray-100">
                <p className="text-[10px] text-gray-400">Изменения здесь применяются ко всей карусели</p>
            </div>
          </div>
        </div>

        {/* Preset Styles Section */}
        <div className="p-5 rounded-2xl border shadow-sm" style={{background: 'var(--color-warm-white)', borderColor: 'var(--color-cream)'}}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{color: 'var(--color-charcoal)'}}>
              <i className="ph ph-palette text-lg" style={{color: 'var(--color-teal)'}}></i> Пресеты стилей
            </h3>
          </div>
          <PresetManager
            presets={presets}
            currentSlide={activeSlide}
            onApplyPreset={applyPreset}
            onSavePreset={savePreset}
            onDeletePreset={deletePreset}
          />
        </div>

        {/* Element Settings */}
        {selectedElementId ? (
          <div className="p-5 rounded-2xl border shadow-sm animate-fade-in" style={{background: 'var(--color-warm-white)', borderColor: 'var(--color-cream)'}}>
             <h3 className="text-xs font-bold uppercase mb-4 tracking-wider flex items-center gap-2" style={{color: 'var(--color-charcoal)'}}>
               <i className="ph ph-text-aa text-lg" style={{color: 'var(--color-teal)'}}></i> Редактор текста
             </h3>
             {activeSlide.elements.filter(el => el.id === selectedElementId).map(el => (
               <div key={el.id} className="flex flex-col gap-4">
                 <div>
                    <label className="text-xs mb-1 block font-medium" style={{color: 'var(--color-teal-light)'}}>Контент <span className="font-normal" style={{color: 'var(--color-teal-light)', opacity: 0.6}}>(**текст** для жирного)</span></label>
                    <textarea
                      value={el.text}
                      onChange={(e) => updateElement(el.id, { text: e.target.value })}
                      className="w-full border rounded-lg p-3 text-sm resize-y min-h-[80px] outline-none transition-all"
                      style={{background: 'var(--color-cream)', borderColor: 'var(--color-cream)', color: 'var(--color-charcoal)'}}
                      onFocus={(e) => e.target.style.borderColor = 'var(--color-coral)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--color-cream)'}
                    />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs mb-1 block font-medium" style={{color: 'var(--color-teal-light)'}}>Размер (px)</label>
                      <input
                        type="number"
                        value={el.fontSize}
                        onChange={(e) => updateElement(el.id, { fontSize: parseInt(e.target.value) })}
                        className="w-full border rounded-lg p-2 text-sm outline-none transition-all"
                        style={{background: 'var(--color-cream)', borderColor: 'var(--color-cream)', color: 'var(--color-charcoal)'}}
                        onFocus={(e) => e.target.style.borderColor = 'var(--color-coral)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--color-cream)'}
                      />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block font-medium" style={{color: 'var(--color-teal-light)'}}>Цвет</label>
                      <div className="flex items-center gap-2 p-1 rounded-lg h-[38px]" style={{background: 'var(--color-cream)'}}>
                        <input
                          type="color"
                          value={el.color}
                          onChange={(e) => updateElement(el.id, { color: e.target.value })}
                          className="h-full w-full rounded cursor-pointer bg-transparent"
                        />
                      </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs mb-1 block font-medium" style={{color: 'var(--color-teal-light)'}}>Шрифт</label>
                        <select
                          value={el.fontFamily}
                          onChange={(e) => updateElement(el.id, { fontFamily: e.target.value as any })}
                          className="w-full border rounded-lg p-2 text-sm outline-none transition-all"
                          style={{background: 'var(--color-cream)', borderColor: 'var(--color-cream)', color: 'var(--color-charcoal)'}}
                          onFocus={(e) => e.target.style.borderColor = 'var(--color-coral)'}
                          onBlur={(e) => e.target.style.borderColor = 'var(--color-cream)'}
                        >
                          <optgroup label="Sans-Serif">
                            <option value="Inter">Inter</option>
                            <option value="Montserrat">Montserrat</option>
                            <option value="Poppins">Poppins</option>
                            <option value="Roboto">Roboto</option>
                            <option value="Open Sans">Open Sans</option>
                            <option value="Lato">Lato</option>
                            <option value="Raleway">Raleway</option>
                            <option value="Work Sans">Work Sans</option>
                            <option value="Outfit">Outfit</option>
                            <option value="Space Grotesk">Space Grotesk</option>
                          </optgroup>
                          <optgroup label="Serif">
                            <option value="Playfair Display">Playfair Display</option>
                            <option value="Merriweather">Merriweather</option>
                            <option value="Lora">Lora</option>
                            <option value="Crimson Text">Crimson Text</option>
                            <option value="Libre Baskerville">Libre Baskerville</option>
                          </optgroup>
                          <optgroup label="Display">
                            <option value="Oswald">Oswald</option>
                            <option value="Bebas Neue">Bebas Neue</option>
                            <option value="Anton">Anton</option>
                            <option value="Righteous">Righteous</option>
                            <option value="Rubik Mono One">Rubik Mono One</option>
                          </optgroup>
                          <optgroup label="Handwriting">
                            <option value="Caveat">Caveat</option>
                            <option value="Pacifico">Pacifico</option>
                            <option value="Dancing Script">Dancing Script</option>
                          </optgroup>
                          <optgroup label="Monospace">
                            <option value="Fira Code">Fira Code</option>
                            <option value="JetBrains Mono">JetBrains Mono</option>
                          </optgroup>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block font-medium">Выравнивание</label>
                        <div className="flex bg-gray-50 rounded-lg border border-gray-200 p-1">
                          {['left', 'center', 'right'].map((align) => (
                            <button
                              key={align}
                              onClick={() => updateElement(el.id, { textAlign: align as any })}
                              className={`flex-1 p-1 rounded-md flex justify-center transition-all ${el.textAlign === align ? 'bg-white text-[#000080] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                              <i className={`ph ph-text-align-${align}`}></i>
                            </button>
                          ))}
                        </div>
                    </div>
                 </div>
                 
                 <div>
                    <label className="text-xs text-gray-500 mb-1 block font-medium">Анимация</label>
                    <select 
                      value={el.animation || 'none'}
                      onChange={(e) => updateElement(el.id, { animation: e.target.value as TextAnimation })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#000080]"
                    >
                      <option value="none">Нет</option>
                      <option value="fade-in">Появление (Fade In)</option>
                      <option value="slide-up">Вылет снизу</option>
                      <option value="slide-down">Вылет сверху</option>
                      <option value="zoom-in">Увеличение</option>
                      <option value="bounce">Прыжок</option>
                    </select>
                 </div>

                 <button 
                   onClick={() => {
                     setSlides(prev => prev.map((s, i) => {
                       if (i !== activeSlideIdx) return s;
                       return { ...s, elements: s.elements.filter(x => x.id !== el.id) };
                     }));
                     setSelectedElementId(null);
                   }}
                   className="mt-2 text-red-500 text-xs flex items-center gap-1 hover:text-red-700 transition-colors"
                 >
                   <i className="ph ph-trash"></i> Удалить слой
                 </button>
               </div>
             ))}
          </div>
        ) : (
           <button 
                onClick={() => {
                   const newEl: TextElement = {
                     id: Math.random().toString(36),
                     text: "Новый текст",
                     x: 40, y: 250,
                     fontSize: 24,
                     color: "#ffffff",
                     fontFamily: 'Inter',
                     fontWeight: 'normal',
                     width: 460,
                     textAlign: 'center',
                     animation: 'fade-in'
                   };
                   setSlides(prev => prev.map((s, i) => i === activeSlideIdx ? { ...s, elements: [...s.elements, newEl] } : s));
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 py-4 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all border border-dashed border-gray-300 hover:border-gray-400"
              >
                <i className="ph ph-plus-circle text-lg"></i> Добавить текст
              </button>
        )}
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 relative">

        {/* Slide Control Toolbar */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 flex gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl shadow-lg animate-fade-in" style={{background: 'var(--color-warm-white)', borderColor: 'var(--color-cream)', border: '1px solid'}}>
            {/* Previous Slide */}
            <button
              onClick={() => setActiveSlideIdx(Math.max(0, activeSlideIdx - 1))}
              disabled={activeSlideIdx === 0}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105"
              style={{background: activeSlideIdx === 0 ? 'var(--color-cream)' : 'var(--color-coral)', color: activeSlideIdx === 0 ? 'var(--color-teal-light)' : '#ffffff'}}
              title="Предыдущий слайд (←)"
            >
              <i className="ph ph-caret-left text-lg sm:text-xl"></i>
            </button>

            {/* Next Slide */}
            <button
              onClick={() => setActiveSlideIdx(Math.min(slides.length - 1, activeSlideIdx + 1))}
              disabled={activeSlideIdx === slides.length - 1}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105"
              style={{background: activeSlideIdx === slides.length - 1 ? 'var(--color-cream)' : 'var(--color-coral)', color: activeSlideIdx === slides.length - 1 ? 'var(--color-teal-light)' : '#ffffff'}}
              title="Следующий слайд (→)"
            >
              <i className="ph ph-caret-right text-lg sm:text-xl"></i>
            </button>

            {/* Separator */}
            <div className="w-px h-6 sm:h-8 self-center" style={{background: 'var(--color-cream)'}}></div>

            {/* Duplicate Slide */}
            <button
              onClick={() => {
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
              }}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all hover:scale-105"
              style={{background: 'var(--color-teal)', color: '#ffffff'}}
              title="Дублировать слайд (Cmd+D)"
            >
              <i className="ph ph-copy text-lg sm:text-xl"></i>
            </button>

            {/* Delete Slide */}
            <button
              onClick={() => {
                if (slides.length <= 1) {
                  alert('Нельзя удалить последний слайд');
                  return;
                }
                if (confirm(`Удалить слайд ${activeSlideIdx + 1}?`)) {
                  const newSlides = slides.filter((_, idx) => idx !== activeSlideIdx);
                  setSlides(newSlides);
                  setActiveSlideIdx(Math.min(activeSlideIdx, newSlides.length - 1));
                }
              }}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all hover:scale-105"
              style={{background: '#ef4444', color: '#ffffff'}}
              title="Удалить слайд"
            >
              <i className="ph ph-trash text-lg sm:text-xl"></i>
            </button>
        </div>

        {/* Download Toolbar */}
        <div className="absolute top-0 right-0 z-10 flex gap-2">
            <button
              onClick={handleDownloadAll}
              disabled={isDownloading}
              className="bg-[#000080] hover:bg-blue-900 text-white px-3 sm:px-4 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isDownloading ? <i className="ph ph-spinner animate-spin"></i> : <i className="ph ph-download-simple"></i>}
              <span className="hidden sm:inline">Скачать все</span>
              <span className="sm:hidden">Скачать</span>
            </button>
        </div>

        <div className="flex-1 flex items-center justify-center w-full px-2 sm:px-4">
            <div
            className="relative rounded-sm shadow-2xl overflow-hidden select-none transition-shadow hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] smooth-resize"
            style={{
                width: 'min(540px, 100%)',
                height: 'min(540px, 100%)',
                aspectRatio: '1',
                maxWidth: '540px',
                maxHeight: '540px',
                ...getBackgroundStyle(activeSlide)
            }}
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={() => setSelectedElementId(null)}
            >
            {/* Text Zone Overlay (split-screen for character images) */}
            {activeSlide.textZone && activeSlide.backgroundImage && (
              <div style={getTextZoneStyle(activeSlide.textZone)} />
            )}

            {/* Slide Number Badge */}
            <div
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                fontSize: '13px',
                fontWeight: '600',
                fontFamily: 'var(--font-mono)',
                color: '#ffffff',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(8px)',
                padding: '6px 12px',
                borderRadius: '8px',
                zIndex: 30,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                pointerEvents: 'none'
              }}
            >
              {activeSlideIdx + 1}/{slides.length}
            </div>

            {activeSlide.elements.map(el => (
                <div
                key={`${el.id}-${el.animation || 'none'}`}
                className={getAnimationClass(el.animation)}
                style={{
                    position: 'absolute',
                    left: el.x,
                    top: el.y,
                    width: `${el.width}px`,
                    fontSize: `${el.fontSize}px`,
                    // Use contrast color on character images, otherwise use element's color
                    color: activeSlide.backgroundImage
                      ? getContrastColor(activeSlide.backgroundColor)
                      : el.color,
                    fontFamily: el.fontFamily,
                    fontWeight: el.fontWeight,
                    textAlign: el.textAlign || 'left',
                    cursor: draggingId === el.id ? 'grabbing' : 'grab',
                    padding: '12px 16px',
                    lineHeight: '1.4',
                    // Selection border only
                    border: selectedElementId === el.id ? '2px dashed #000080' : '2px solid transparent',
                    borderRadius: '8px',
                    backgroundColor: selectedElementId === el.id ? 'rgba(0, 0, 128, 0.05)' : 'transparent',
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

        {/* Slide Navigation */}
        <div className="mt-4 sm:mt-6 flex gap-2 sm:gap-3 overflow-x-auto w-full max-w-3xl px-2 py-2 custom-scrollbar">
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              onClick={() => setActiveSlideIdx(idx)}
              className={`flex-shrink-0 rounded-lg cursor-pointer transition-all relative group overflow-hidden border-2 ${activeSlideIdx === idx ? 'border-[#000080] shadow-md scale-105' : 'border-transparent opacity-80 hover:opacity-100'}`}
              style={{width: 'clamp(60px, 15vw, 80px)', height: 'clamp(60px, 15vw, 80px)'}}
            >
              <div className="w-full h-full" style={getBackgroundStyle(slide)}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <span className="bg-white/90 text-gray-900 px-1.5 sm:px-2 py-0.5 rounded-full font-bold shadow-sm" style={{fontSize: 'var(--text-xs)'}}>
                   {idx + 1}
                 </span>
              </div>
            </div>
          ))}
          <button
             onClick={() => {
                const newSlide: Slide = {
                  id: Math.random().toString(36),
                  backgroundColor: activeSlide.backgroundColor, // Inherit color
                  accentColor: activeSlide.accentColor, // Inherit accent
                  backgroundPattern: activeSlide.backgroundPattern, // Inherit pattern
                  elements: []
                };
                setSlides([...slides, newSlide]);
                setActiveSlideIdx(slides.length);
             }}
             className="flex-shrink-0 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:text-[#000080] hover:border-[#000080] hover:bg-blue-50 transition-all"
             style={{width: 'clamp(60px, 15vw, 80px)', height: 'clamp(60px, 15vw, 80px)'}}
          >
            <i className="ph ph-plus text-lg sm:text-xl"></i>
          </button>
        </div>
      </div>

      {/* Hidden Container for Exporting ALL slides */}
      <div style={{ position: 'absolute', top: -9999, left: -9999, width: '540px', height: '540px' }}>
          <div ref={exportContainerRef}>
              {slides.map((slide, slideIdx) => (
                  <div
                    key={`export-${slide.id}`}
                    style={{
                        width: '540px',
                        height: '540px',
                        position: 'relative',
                        overflow: 'hidden',
                        ...getBackgroundStyle(slide)
                    }}
                  >
                     {/* Text Zone Overlay for Export */}
                     {slide.textZone && slide.backgroundImage && (() => {
                       const getExportTextZoneStyle = (zone: string): React.CSSProperties => {
                         const baseStyle: React.CSSProperties = {
                           position: 'absolute',
                           backgroundColor: slide.backgroundColor,
                           zIndex: 5,
                         };
                         switch (zone) {
                           case 'left':
                             return { ...baseStyle, left: 0, top: 0, width: '50%', height: '100%' };
                           case 'right':
                             return { ...baseStyle, right: 0, top: 0, width: '50%', height: '100%' };
                           case 'top':
                             return { ...baseStyle, left: 0, top: 0, width: '100%', height: '50%' };
                           case 'bottom':
                             return { ...baseStyle, left: 0, bottom: 0, width: '100%', height: '50%' };
                           default:
                             return baseStyle;
                         }
                       };
                       return <div style={getExportTextZoneStyle(slide.textZone)} />;
                     })()}

                     {/* Slide Number Badge for Export */}
                     <div
                       style={{
                         position: 'absolute',
                         top: '16px',
                         right: '16px',
                         fontSize: '13px',
                         fontWeight: '600',
                         fontFamily: 'JetBrains Mono, monospace',
                         color: '#ffffff',
                         backgroundColor: 'rgba(0, 0, 0, 0.5)',
                         backdropFilter: 'blur(8px)',
                         padding: '6px 12px',
                         borderRadius: '8px',
                         zIndex: 30,
                         boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                       }}
                     >
                       {slideIdx + 1}/{slides.length}
                     </div>

                     {slide.elements.map(el => (
                        <div
                        key={`export-${el.id}`}
                        style={{
                            position: 'absolute',
                            left: el.x,
                            top: el.y,
                            width: `${el.width}px`,
                            fontSize: `${el.fontSize}px`,
                            // Use contrast color on character images, otherwise use element's color
                            color: slide.backgroundImage
                              ? getContrastColor(slide.backgroundColor)
                              : el.color,
                            fontFamily: el.fontFamily,
                            fontWeight: el.fontWeight,
                            textAlign: el.textAlign || 'left',
                            padding: '12px 16px',
                            lineHeight: '1.4',
                            // No effects - clean and simple
                        }}
                        >
                        {renderTitle(el.text, el, slide.accentColor, slide.backgroundPattern)}
                        </div>
                    ))}
                  </div>
              ))}
          </div>
      </div>

    </div>
  );
};
