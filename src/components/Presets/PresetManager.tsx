import React, { useState } from 'react';
import { StylePreset, Slide } from '../../types';
import { usePresets } from '../../hooks/usePresets';
import { PresetCard } from './PresetCard';

interface PresetManagerProps {
  currentSlides: Slide[];
  onApplyPreset: (preset: StylePreset) => void;
}

export const PresetManager: React.FC<PresetManagerProps> = ({ currentSlides, onApplyPreset }) => {
  const { presets, savePreset, deletePreset } = usePresets();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [presetName, setPresetName] = useState('');

  const handleSaveCurrentStyle = () => {
    if (!currentSlides.length) {
      alert('Сначала создайте карусель');
      return;
    }

    if (!presetName.trim()) {
      alert('Введите название пресета');
      return;
    }

    const currentStyle = currentSlides[0]; // Берем стиль первого слайда
    savePreset({
      name: presetName,
      backgroundColor: currentStyle.backgroundColor,
      accentColor: currentStyle.accentColor,
      backgroundPattern: currentStyle.backgroundPattern
    });

    setPresetName('');
    setShowSaveModal(false);
  };

  const builtInPresets = presets.filter(p => p.isBuiltIn);
  const userPresets = presets.filter(p => !p.isBuiltIn);

  return (
    <div className="space-y-4">
      {/* Кнопка сохранения текущего стиля */}
      <button
        onClick={() => setShowSaveModal(true)}
        className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 px-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
      >
        <i className="ph ph-floppy-disk"></i>
        Сохранить текущий стиль
      </button>

      {/* Встроенные пресеты */}
      <div>
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Встроенные пресеты</h4>
        <div className="grid grid-cols-2 gap-2">
          {builtInPresets.map(preset => (
            <PresetCard
              key={preset.id}
              preset={preset}
              onSelect={onApplyPreset}
            />
          ))}
        </div>
      </div>

      {/* Пользовательские пресеты */}
      {userPresets.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Мои пресеты</h4>
          <div className="grid grid-cols-2 gap-2">
            {userPresets.map(preset => (
              <PresetCard
                key={preset.id}
                preset={preset}
                onSelect={onApplyPreset}
                onDelete={deletePreset}
              />
            ))}
          </div>
        </div>
      )}

      {/* Модалка сохранения */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Сохранить пресет</h3>
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Название пресета"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveCurrentStyle}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
              >
                Сохранить
              </button>
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
