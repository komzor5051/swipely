'use client';

import { useEffect } from 'react';
import { useEditorStore } from '@/lib/store/editorStore';
import { SlideCanvas } from '@/components/editor/SlideCanvas';
import { LayersPanel } from '@/components/editor/LayersPanel';
import { Toolbar } from '@/components/editor/Toolbar';
import { gridMultiTemplate } from '@/lib/templates/grid_multi';

export default function EditorPage() {
  const { setTemplate, template } = useEditorStore();

  // Load template on mount
  useEffect(() => {
    if (!template) {
      setTemplate(gridMultiTemplate);
    }
  }, [template, setTemplate]);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Toolbar */}
      <Toolbar />

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas area */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
          <SlideCanvas />
        </div>

        {/* Layers panel */}
        <LayersPanel />
      </div>
    </div>
  );
}
