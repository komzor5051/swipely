'use client';

import { useEditorStore } from '@/lib/store/editorStore';
import { ZoomIn, ZoomOut, Trash2, RotateCcw } from 'lucide-react';

export function Toolbar() {
  const { zoom, setZoom, selectedId, deleteElement, template, setElements } = useEditorStore();

  const zoomPercentage = Math.round(zoom * 100);

  const handleZoomIn = () => setZoom(zoom + 0.1);
  const handleZoomOut = () => setZoom(zoom - 0.1);

  const handleDelete = () => {
    if (selectedId) {
      deleteElement(selectedId);
    }
  };

  const handleReset = () => {
    if (template) {
      setElements(template.elements);
    }
  };

  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      {/* Left: Title */}
      <div className="flex items-center gap-4">
        <h1 className="font-semibold text-gray-900">Slide Editor</h1>
        {template && (
          <span className="text-sm text-gray-500">
            {template.name}
          </span>
        )}
      </div>

      {/* Center: Zoom controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 0.25}
          className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Zoom out"
        >
          <ZoomOut size={18} className="text-gray-600" />
        </button>

        <span className="w-16 text-center text-sm font-medium text-gray-700">
          {zoomPercentage}%
        </span>

        <button
          onClick={handleZoomIn}
          disabled={zoom >= 1}
          className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Zoom in"
        >
          <ZoomIn size={18} className="text-gray-600" />
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Reset to original"
        >
          <RotateCcw size={16} className="text-gray-600" />
          <span className="text-sm text-gray-600">Reset</span>
        </button>

        <button
          onClick={handleDelete}
          disabled={!selectedId}
          className="flex items-center gap-2 px-3 py-2 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Delete selected"
        >
          <Trash2 size={16} className="text-red-500" />
          <span className="text-sm text-red-500">Delete</span>
        </button>
      </div>
    </div>
  );
}
