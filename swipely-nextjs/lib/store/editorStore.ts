import { create } from 'zustand';
import type { SlideElement, SlideTemplate } from '@/lib/templates/types';

interface EditorState {
  // Template & Elements
  template: SlideTemplate | null;
  elements: SlideElement[];

  // Selection
  selectedId: string | null;

  // View
  zoom: number;

  // Actions
  setTemplate: (template: SlideTemplate) => void;
  setElements: (elements: SlideElement[]) => void;

  selectElement: (id: string | null) => void;

  moveElement: (id: string, x: number, y: number) => void;
  deleteElement: (id: string) => void;
  toggleVisibility: (id: string) => void;
  updateElement: (id: string, updates: Partial<Omit<SlideElement, 'type'>>) => void;

  setZoom: (zoom: number) => void;

  // Helpers
  getSelectedElement: () => SlideElement | undefined;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // Initial state
  template: null,
  elements: [],
  selectedId: null,
  zoom: 0.5, // 50% scale by default (1080 -> 540)

  // Template actions
  setTemplate: (template) => set({
    template,
    elements: template.elements,
    selectedId: null
  }),

  setElements: (elements) => set({ elements }),

  // Selection
  selectElement: (id) => set({ selectedId: id }),

  // Element manipulation
  moveElement: (id, x, y) => set((state) => ({
    elements: state.elements.map((el) =>
      el.id === id ? { ...el, x, y } : el
    ),
  })),

  deleteElement: (id) => set((state) => ({
    elements: state.elements.filter((el) => el.id !== id),
    selectedId: state.selectedId === id ? null : state.selectedId,
  })),

  toggleVisibility: (id) => set((state) => ({
    elements: state.elements.map((el) =>
      el.id === id ? { ...el, visible: !el.visible } : el
    ),
  })),

  updateElement: (id, updates) => set((state) => ({
    elements: state.elements.map((el) =>
      el.id === id ? { ...el, ...updates } as SlideElement : el
    ),
  })),

  // View
  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(1, zoom)) }),

  // Helpers
  getSelectedElement: () => {
    const state = get();
    return state.elements.find((el) => el.id === state.selectedId);
  },
}));
