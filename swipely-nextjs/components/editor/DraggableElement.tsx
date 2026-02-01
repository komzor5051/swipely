'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useEditorStore } from '@/lib/store/editorStore';
import type { SlideElement } from '@/lib/templates/types';

interface DraggableElementProps {
  element: SlideElement;
  children: React.ReactNode;
  zoom: number;
}

export function DraggableElement({ element, children, zoom }: DraggableElementProps) {
  const { selectedId, selectElement } = useEditorStore();
  const isSelected = selectedId === element.id;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: element.id,
    data: { element },
  });

  if (!element.visible) {
    return null;
  }

  const style: React.CSSProperties = {
    position: 'absolute',
    left: element.x * zoom,
    top: element.y * zoom,
    transform: CSS.Translate.toString(transform),
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: isDragging ? 9999 : element.zIndex,
    opacity: isDragging ? 0.8 : 1,
    outline: isSelected ? '2px solid #3b82f6' : 'none',
    outlineOffset: '2px',
    borderRadius: '4px',
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectElement(element.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      {...listeners}
      {...attributes}
    >
      <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
        {children}
      </div>
    </div>
  );
}
