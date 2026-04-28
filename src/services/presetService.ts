import { StylePreset, BackgroundPattern } from '../types';

const STORAGE_KEY = 'instagenius_presets';

export const BUILT_IN_PRESETS: StylePreset[] = [
  // Digital Atelier Collection
  {
    id: 'coral-dream',
    name: 'Коралловая мечта',
    backgroundColor: '#FF6B6B',
    accentColor: '#FFD93D',
    backgroundPattern: 'gradient-bl',
    isBuiltIn: true
  },
  {
    id: 'teal-depth',
    name: 'Глубина океана',
    backgroundColor: '#0D3B66',
    accentColor: '#1A5F7A',
    backgroundPattern: 'dots',
    isBuiltIn: true
  },
  {
    id: 'butter-sunrise',
    name: 'Масляный рассвет',
    backgroundColor: '#FFD93D',
    accentColor: '#FF6B6B',
    backgroundPattern: 'stripes',
    isBuiltIn: true
  },
  {
    id: 'warm-minimal',
    name: 'Теплый минимал',
    backgroundColor: '#FAF8F6',
    accentColor: '#FF6B6B',
    backgroundPattern: 'solid',
    isBuiltIn: true
  },
  {
    id: 'charcoal-grid',
    name: 'Угольная сетка',
    backgroundColor: '#2D3142',
    accentColor: '#FFD93D',
    backgroundPattern: 'grid',
    isBuiltIn: true
  },

  // Vibrant Collection
  {
    id: 'electric-purple',
    name: 'Электро-фиолет',
    backgroundColor: '#7C3AED',
    accentColor: '#EC4899',
    backgroundPattern: 'gradient-tr',
    isBuiltIn: true
  },
  {
    id: 'mint-fresh',
    name: 'Свежая мята',
    backgroundColor: '#D1FAE5',
    accentColor: '#059669',
    backgroundPattern: 'sketch',
    isBuiltIn: true
  },
  {
    id: 'rose-gold',
    name: 'Розовое золото',
    backgroundColor: '#FDF2F8',
    accentColor: '#EC4899',
    backgroundPattern: 'dots',
    isBuiltIn: true
  },
  {
    id: 'navy-power',
    name: 'Сила флота',
    backgroundColor: '#1E3A8A',
    accentColor: '#60A5FA',
    backgroundPattern: 'solid',
    isBuiltIn: true
  },

  // Bold & Modern
  {
    id: 'neon-cyber',
    name: 'Неон киберпанк',
    backgroundColor: '#0A0A0A',
    accentColor: '#00FF9F',
    backgroundPattern: 'grid',
    isBuiltIn: true
  },
  {
    id: 'sunset-blaze',
    name: 'Пламя заката',
    backgroundColor: '#FB923C',
    accentColor: '#DC2626',
    backgroundPattern: 'gradient-bl',
    isBuiltIn: true
  },
  {
    id: 'forest-calm',
    name: 'Лесное спокойствие',
    backgroundColor: '#065F46',
    accentColor: '#34D399',
    backgroundPattern: 'stripes',
    isBuiltIn: true
  },

  // Soft & Pastel
  {
    id: 'lavender-dream',
    name: 'Лавандовый сон',
    backgroundColor: '#E9D5FF',
    accentColor: '#9333EA',
    backgroundPattern: 'sketch',
    isBuiltIn: true
  },
  {
    id: 'peach-cream',
    name: 'Персиковый крем',
    backgroundColor: '#FED7AA',
    accentColor: '#EA580C',
    backgroundPattern: 'dots',
    isBuiltIn: true
  },
  {
    id: 'sky-serenity',
    name: 'Небесная безмятежность',
    backgroundColor: '#DBEAFE',
    accentColor: '#2563EB',
    backgroundPattern: 'solid',
    isBuiltIn: true
  }
];

export const loadPresets = (): StylePreset[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const userPresets = saved ? JSON.parse(saved) : [];
    return [...BUILT_IN_PRESETS, ...userPresets];
  } catch (error) {
    console.error('Failed to load presets:', error);
    return BUILT_IN_PRESETS;
  }
};

export const savePreset = (preset: Omit<StylePreset, 'id' | 'isBuiltIn' | 'createdAt'>): StylePreset => {
  const newPreset: StylePreset = {
    ...preset,
    id: `custom-${Date.now()}`,
    isBuiltIn: false,
    createdAt: Date.now()
  };

  const currentPresets = loadPresets().filter(p => !p.isBuiltIn);
  const updated = [...currentPresets, newPreset];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newPreset;
};

export const deletePreset = (id: string): void => {
  const currentPresets = loadPresets().filter(p => !p.isBuiltIn && p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPresets));
};
