'use client';

import { useCallback, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useEditorStore } from '@/lib/store/editorStore';
import { DraggableElement } from './DraggableElement';
import { ElementRenderer } from './ElementRenderer';

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1350;

export function SlideCanvas() {
  const {
    template,
    elements,
    zoom,
    selectedId,
    selectElement,
    moveElement,
    deleteElement,
  } = useEditorStore();

  // Sensors for drag detection
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 5 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 100, tolerance: 5 },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, delta } = event;
      if (!delta) return;

      const elementId = active.id as string;
      const element = elements.find((el) => el.id === elementId);
      if (!element) return;

      // Calculate new position (accounting for zoom)
      const newX = Math.round(element.x + delta.x / zoom);
      const newY = Math.round(element.y + delta.y / zoom);

      moveElement(elementId, newX, newY);
    },
    [elements, zoom, moveElement]
  );

  // Handle canvas click (deselect)
  const handleCanvasClick = () => {
    selectElement(null);
  };

  // Handle Delete key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        // Don't delete if user is typing in an input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }
        e.preventDefault();
        deleteElement(selectedId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, deleteElement]);

  const canvasStyle: React.CSSProperties = {
    width: CANVAS_WIDTH * zoom,
    height: CANVAS_HEIGHT * zoom,
    backgroundColor: template?.backgroundColor || '#FAFAFA',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    borderRadius: '8px',
  };

  // Grid pattern background
  const gridStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: `
      linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)
    `,
    backgroundSize: `${40 * zoom}px ${40 * zoom}px`,
    pointerEvents: 'none',
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div
        style={canvasStyle}
        onClick={handleCanvasClick}
        className="select-none"
      >
        {/* Grid pattern */}
        {template?.backgroundPattern === 'grid' && <div style={gridStyle} />}

        {/* Elements */}
        {elements.map((element) => (
          <DraggableElement key={element.id} element={element} zoom={zoom}>
            <ElementRenderer element={element} />
          </DraggableElement>
        ))}
      </div>
    </DndContext>
  );
}
