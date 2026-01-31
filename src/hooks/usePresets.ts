import { useState, useEffect } from 'react';
import { StylePreset } from '../types';
import { loadPresets, savePreset as savePresetToStorage, deletePreset as deletePresetFromStorage } from '../services/presetService';

export const usePresets = () => {
  const [presets, setPresets] = useState<StylePreset[]>([]);

  useEffect(() => {
    setPresets(loadPresets());
  }, []);

  const savePreset = (preset: Omit<StylePreset, 'id' | 'isBuiltIn' | 'createdAt'>) => {
    const newPreset = savePresetToStorage(preset);
    setPresets(loadPresets());
    return newPreset;
  };

  const deletePreset = (id: string) => {
    deletePresetFromStorage(id);
    setPresets(loadPresets());
  };

  return { presets, savePreset, deletePreset };
};
