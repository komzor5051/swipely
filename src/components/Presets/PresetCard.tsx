import React from 'react';
import { StylePreset } from '../../types';

interface PresetCardProps {
  preset: StylePreset;
  onSelect: (preset: StylePreset) => void;
  onDelete?: (id: string) => void;
  isSelected?: boolean;
}

export const PresetCard: React.FC<PresetCardProps> = ({ preset, onSelect, onDelete, isSelected }) => {
  const getPreviewStyle = () => {
    if (preset.backgroundPattern === 'solid') {
      return { backgroundColor: preset.backgroundColor };
    }
    if (preset.backgroundPattern.startsWith('gradient')) {
      return { background: `linear-gradient(135deg, ${preset.backgroundColor}, ${preset.accentColor})` };
    }
    return { background: `linear-gradient(135deg, ${preset.backgroundColor}, ${preset.accentColor})` };
  };

  return (
    <div
      className={`relative group cursor-pointer rounded-xl border-2 transition-all ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300'
      }`}
      onClick={() => onSelect(preset)}
    >
      {/* Превью */}
      <div
        className="h-20 rounded-t-lg"
        style={getPreviewStyle()}
      />

      {/* Название */}
      <div className="p-2 bg-white rounded-b-lg">
        <p className="text-xs font-semibold text-gray-900 truncate">{preset.name}</p>
      </div>

      {/* Кнопка удаления для пользовательских пресетов */}
      {!preset.isBuiltIn && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Удалить пресет "${preset.name}"?`)) {
              onDelete(preset.id);
            }
          }}
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-opacity"
        >
          <i className="ph ph-x text-xs"></i>
        </button>
      )}
    </div>
  );
};
