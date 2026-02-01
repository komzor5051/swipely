import type { TextStyles } from '../types';

type ElementType = 'title' | 'content';

interface TextEditPanelProps {
  selectedElement: ElementType;
  onSelectElement: (element: ElementType) => void;
  titleStyles: TextStyles;
  contentStyles: TextStyles;
  onStyleChange: (element: ElementType, styles: TextStyles) => void;
  currentSlideIndex: number;
  totalSlides: number;
  onSlideChange: (index: number) => void;
}

export default function TextEditPanel({
  selectedElement,
  onSelectElement,
  titleStyles,
  contentStyles,
  onStyleChange,
  currentSlideIndex,
  totalSlides,
  onSlideChange,
}: TextEditPanelProps) {
  const currentStyles = selectedElement === 'title' ? titleStyles : contentStyles;

  const handleFontSizeChange = (value: number) => {
    onStyleChange(selectedElement, { ...currentStyles, fontSize: value });
  };

  const handleColorChange = (value: string) => {
    onStyleChange(selectedElement, { ...currentStyles, color: value });
  };

  const handleAlignChange = (value: 'left' | 'center' | 'right') => {
    onStyleChange(selectedElement, { ...currentStyles, textAlign: value });
  };

  const fontSize = currentStyles.fontSize || (selectedElement === 'title' ? 48 : 24);
  const color = currentStyles.color || '#FFFFFF';
  const textAlign = currentStyles.textAlign || 'center';

  return (
    <div className="card p-6 sticky top-8">
      <h3 className="font-semibold text-charcoal mb-4">Редактирование текста</h3>

      <div className="space-y-5">
        {/* Slide navigation */}
        <div>
          <label className="block text-sm text-teal-light mb-2">Слайд</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSlideChange(Math.max(0, currentSlideIndex - 1))}
              disabled={currentSlideIndex === 0}
              className="btn-secondary px-3 py-2 disabled:opacity-50"
            >
              ←
            </button>
            <span className="flex-1 text-center font-medium">
              {currentSlideIndex + 1} / {totalSlides}
            </span>
            <button
              onClick={() => onSlideChange(Math.min(totalSlides - 1, currentSlideIndex + 1))}
              disabled={currentSlideIndex === totalSlides - 1}
              className="btn-secondary px-3 py-2 disabled:opacity-50"
            >
              →
            </button>
          </div>
        </div>

        <div className="border-t border-cream pt-4">
          {/* Element selector */}
          <label className="block text-sm text-teal-light mb-2">Выбрано</label>
          <div className="flex gap-2">
            <button
              onClick={() => onSelectElement('title')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedElement === 'title'
                  ? 'bg-primary text-white'
                  : 'bg-cream text-teal-light hover:bg-primary/20'
              }`}
            >
              Заголовок
            </button>
            <button
              onClick={() => onSelectElement('content')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedElement === 'content'
                  ? 'bg-primary text-white'
                  : 'bg-cream text-teal-light hover:bg-primary/20'
              }`}
            >
              Контент
            </button>
          </div>
        </div>

        {/* Font size slider */}
        <div>
          <label className="block text-sm text-teal-light mb-2">
            Размер шрифта: <span className="font-medium text-charcoal">{fontSize}px</span>
          </label>
          <input
            type="range"
            min={12}
            max={120}
            value={fontSize}
            onChange={(e) => handleFontSizeChange(Number(e.target.value))}
            className="w-full h-2 bg-cream rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-teal-light/60 mt-1">
            <span>12</span>
            <span>120</span>
          </div>
        </div>

        {/* Color picker */}
        <div>
          <label className="block text-sm text-teal-light mb-2">Цвет текста</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={color}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer border-2 border-cream"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => handleColorChange(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-cream text-sm font-mono uppercase"
              placeholder="#FFFFFF"
            />
          </div>
          {/* Quick colors */}
          <div className="flex gap-2 mt-2">
            {['#FFFFFF', '#000000', '#FF6B6B', '#FFE66D', '#4ECDC4'].map((c) => (
              <button
                key={c}
                onClick={() => handleColorChange(c)}
                className={`w-6 h-6 rounded border-2 transition-transform hover:scale-110 ${
                  color === c ? 'border-primary ring-2 ring-primary/30' : 'border-cream'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>

        {/* Text align */}
        <div>
          <label className="block text-sm text-teal-light mb-2">Выравнивание</label>
          <div className="flex gap-2">
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                onClick={() => handleAlignChange(align)}
                className={`flex-1 px-3 py-2 rounded-lg text-lg transition-colors ${
                  textAlign === align
                    ? 'bg-primary text-white'
                    : 'bg-cream text-teal-light hover:bg-primary/20'
                }`}
                title={align === 'left' ? 'По левому краю' : align === 'center' ? 'По центру' : 'По правому краю'}
              >
                {align === 'left' ? '≡' : align === 'center' ? '≡' : '≡'}
                <span className="sr-only">
                  {align === 'left' ? 'По левому краю' : align === 'center' ? 'По центру' : 'По правому краю'}
                </span>
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-teal-light/60 mt-1">
            <span>Лево</span>
            <span>Центр</span>
            <span>Право</span>
          </div>
        </div>

        <div className="border-t border-cream pt-4">
          <p className="text-xs text-teal-light/70">
            Перетаскивайте текст на слайде для изменения позиции
          </p>
        </div>
      </div>
    </div>
  );
}
