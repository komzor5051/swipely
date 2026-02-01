'use client';

import { useEditorStore } from '@/lib/store/editorStore';
import { Eye, EyeOff, Trash2, Type, User, Sparkles, Square, MousePointer } from 'lucide-react';
import type { ElementType } from '@/lib/templates/types';

export function LayersPanel() {
  const {
    elements,
    selectedId,
    selectElement,
    deleteElement,
    toggleVisibility,
  } = useEditorStore();

  const getIcon = (type: ElementType) => {
    switch (type) {
      case 'text':
      case 'heading':
        return <Type size={16} />;
      case 'avatar':
        return <User size={16} />;
      case 'decoration':
        return <Sparkles size={16} />;
      case 'icon':
        return <MousePointer size={16} />;
      case 'badge':
      case 'button':
        return <Square size={16} />;
      default:
        return <Square size={16} />;
    }
  };

  const getLabel = (type: ElementType, id: string) => {
    const typeName = {
      text: 'Text',
      heading: 'Heading',
      avatar: 'Avatar',
      decoration: 'Decoration',
      icon: 'Icon',
      badge: 'Badge',
      button: 'Button',
    };
    return `${typeName[type] || type} (${id.slice(0, 6)})`;
  };

  // Sort by zIndex descending (top layers first)
  const sortedElements = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="w-64 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Layers</h3>
        <p className="text-xs text-gray-500 mt-1">
          {elements.length} elements
        </p>
      </div>

      {/* Layers list */}
      <div className="flex-1 overflow-y-auto">
        {sortedElements.map((element) => {
          const isSelected = selectedId === element.id;

          return (
            <div
              key={element.id}
              onClick={() => selectElement(element.id)}
              className={`
                flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-100
                transition-colors
                ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
                ${!element.visible ? 'opacity-50' : ''}
              `}
            >
              {/* Icon */}
              <span className="text-gray-500">{getIcon(element.type)}</span>

              {/* Label */}
              <span className="flex-1 text-sm text-gray-700 truncate">
                {getLabel(element.type, element.id)}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {/* Visibility toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVisibility(element.id);
                  }}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title={element.visible ? 'Hide' : 'Show'}
                >
                  {element.visible ? (
                    <Eye size={14} className="text-gray-500" />
                  ) : (
                    <EyeOff size={14} className="text-gray-400" />
                  )}
                </button>

                {/* Delete */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteElement(element.id);
                  }}
                  className="p-1 hover:bg-red-100 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} className="text-gray-500 hover:text-red-500" />
                </button>
              </div>
            </div>
          );
        })}

        {elements.length === 0 && (
          <div className="p-4 text-center text-gray-400 text-sm">
            No elements
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          Press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Delete</kbd> to remove selected
        </p>
      </div>
    </div>
  );
}
