import { useRef, useEffect, useCallback } from 'react';
import { renderTemplate } from '../templates';
import { FORMAT_SIZES, type Slide, type TextPosition, type TextStyles } from '../types';

type ElementType = 'title' | 'content';

interface SlideCanvasProps {
  slide: Slide;
  slideIndex: number;
  totalSlides: number;
  stylePreset: string;
  format: 'square' | 'portrait';
  username?: string;
  image?: string;  // Base64 image for Photo Mode
  selectedElement: ElementType;
  onSelectElement: (element: ElementType) => void;
  onUpdate: (slide: Slide) => void;
  onPositionChange: (element: ElementType, position: TextPosition) => void;
}

export default function SlideCanvas({
  slide,
  slideIndex,
  totalSlides,
  stylePreset,
  format,
  image,
  selectedElement,
  onSelectElement,
  onUpdate,
  onPositionChange,
}: SlideCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const dragStateRef = useRef<{
    isDragging: boolean;
    element: HTMLElement | null;
    elementType: ElementType | null;
    startX: number;
    startY: number;
    initialLeft: number;
    initialTop: number;
  }>({
    isDragging: false,
    element: null,
    elementType: null,
    startX: 0,
    startY: 0,
    initialLeft: 0,
    initialTop: 0,
  });

  const { width, height } = FORMAT_SIZES[format];

  // Scale for preview (fit in viewport)
  const scale = 0.5;
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;

  // Apply styles to element in iframe
  const applyStyles = useCallback((el: HTMLElement, styles: TextStyles | undefined) => {
    if (!styles) return;
    if (styles.fontSize) el.style.fontSize = `${styles.fontSize}px`;
    if (styles.color) el.style.color = styles.color;
    if (styles.textAlign) el.style.textAlign = styles.textAlign;
  }, []);

  // Apply position to element
  const applyPosition = useCallback((el: HTMLElement, position: TextPosition | undefined) => {
    if (!position) return;
    el.style.position = 'absolute';
    el.style.left = `${position.x}%`;
    el.style.top = `${position.y}%`;
    el.style.transform = 'translate(-50%, -50%)';
  }, []);

  const updateSlideContent = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument) return;

    const doc = iframe.contentDocument;

    // Get current text from contenteditable elements
    const headlineEl = doc.querySelector('.headline');
    const contentEl = doc.querySelector('.content');

    const newTitle = headlineEl?.textContent || slide.title;
    const newContent = contentEl?.textContent || slide.content;

    // Only update if changed
    if (newTitle !== slide.title || newContent !== slide.content) {
      onUpdate({
        ...slide,
        title: newTitle,
        content: newContent,
      });
    }
  }, [slide, onUpdate]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let html = renderTemplate(stylePreset, {
      title: slide.title,
      content: slide.content,
      slideNumber: slideIndex + 1,
      totalSlides,
      width,
      height,
    });

    if (!html) return;

    // If image is provided (Photo Mode), inject it as background
    if (image) {
      // Determine if image is a URL or base64
      const isUrl = image.startsWith('http://') || image.startsWith('https://');
      const imageUrl = isUrl ? image : `data:image/png;base64,${image}`;

      // Add background image style to body
      const bgImageStyle = `
        body {
          background-image: url('${imageUrl}');
          background-size: cover;
          background-position: center;
        }
        .photo-hint { display: none !important; }
      `;
      html = html.replace('</style>', `${bgImageStyle}</style>`);
    }

    // Write HTML to iframe
    const doc = iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(html);
    doc.close();

    // Make headline and content editable after load
    iframe.onload = () => {
      const iframeDoc = iframe.contentDocument;
      if (!iframeDoc) return;

      const headlineEl = iframeDoc.querySelector('.headline') as HTMLElement;
      const contentEl = iframeDoc.querySelector('.content') as HTMLElement;

      // Setup draggable element
      const setupDraggable = (el: HTMLElement, elementType: ElementType) => {
        // Move element to body level for proper absolute positioning
        const body = iframeDoc.body;
        if (el.parentElement !== body) {
          body.appendChild(el);
        }

        el.setAttribute('contenteditable', 'true');
        el.style.outline = 'none';
        el.style.cursor = 'move';
        el.style.userSelect = 'text';
        el.style.position = 'absolute';
        el.style.width = '90%';
        el.style.boxSizing = 'border-box';
        el.style.zIndex = '100';

        // Apply saved position or set default
        const savedPosition = elementType === 'title' ? slide.titlePosition : slide.contentPosition;
        if (savedPosition) {
          applyPosition(el, savedPosition);
        } else {
          // Default positions - title higher, content lower
          const defaultY = elementType === 'title' ? 25 : 55;
          el.style.left = '50%';
          el.style.top = `${defaultY}%`;
          el.style.transform = 'translate(-50%, -50%)';
        }

        // Apply saved styles
        const savedStyles = elementType === 'title' ? slide.titleStyles : slide.contentStyles;
        applyStyles(el, savedStyles);

        el.addEventListener('blur', updateSlideContent);

        // Click to select element
        el.addEventListener('click', () => {
          onSelectElement(elementType);
        });

        // Mousedown to start drag
        el.addEventListener('mousedown', (e: MouseEvent) => {
          // Only start drag if clicking on the element itself (not editing text)
          const selection = iframeDoc.getSelection();
          if (selection && selection.toString().length > 0) return;

          // Check if this is a double-click scenario (text editing)
          if ((e.target as HTMLElement).isContentEditable && e.detail === 1) {
            // Start drag after short delay if no text selection
            const startDrag = () => {
              dragStateRef.current = {
                isDragging: true,
                element: el,
                elementType,
                startX: e.clientX,
                startY: e.clientY,
                initialLeft: parseFloat(el.style.left) || 50,
                initialTop: parseFloat(el.style.top) || 50,
              };
              el.style.cursor = 'grabbing';
              onSelectElement(elementType);
            };

            const timeout = setTimeout(startDrag, 150);

            const cancelDrag = () => {
              clearTimeout(timeout);
              el.removeEventListener('mouseup', cancelDrag);
              el.removeEventListener('mousemove', cancelDrag);
            };

            el.addEventListener('mouseup', cancelDrag, { once: true });
          }
        });
      };

      if (headlineEl) setupDraggable(headlineEl, 'title');
      if (contentEl) setupDraggable(contentEl, 'content');

      // Mousemove for dragging
      iframeDoc.addEventListener('mousemove', (e: MouseEvent) => {
        const state = dragStateRef.current;
        if (!state.isDragging || !state.element) return;

        const deltaX = ((e.clientX - state.startX) / width) * 100;
        const deltaY = ((e.clientY - state.startY) / height) * 100;

        const newX = Math.max(0, Math.min(100, state.initialLeft + deltaX));
        const newY = Math.max(0, Math.min(100, state.initialTop + deltaY));

        state.element.style.left = `${newX}%`;
        state.element.style.top = `${newY}%`;
      });

      // Mouseup to end drag
      iframeDoc.addEventListener('mouseup', () => {
        const state = dragStateRef.current;
        if (!state.isDragging || !state.element || !state.elementType) return;

        const newX = parseFloat(state.element.style.left);
        const newY = parseFloat(state.element.style.top);

        state.element.style.cursor = 'move';
        onPositionChange(state.elementType, { x: newX, y: newY });

        dragStateRef.current = {
          isDragging: false,
          element: null,
          elementType: null,
          startX: 0,
          startY: 0,
          initialLeft: 0,
          initialTop: 0,
        };
      });

      // Add edit indicator styles
      const style = iframeDoc.createElement('style');
      style.textContent = `
        .headline, .content {
          transition: outline 0.15s ease;
        }
        .headline:hover, .content:hover {
          outline: 2px dashed rgba(255, 107, 107, 0.5) !important;
          outline-offset: 8px;
        }
        .headline:focus, .content:focus {
          outline: 2px solid #0A84FF !important;
          outline-offset: 8px;
        }
        .headline.selected, .content.selected {
          outline: 2px solid #0A84FF !important;
          outline-offset: 8px;
        }
      `;
      iframeDoc.head.appendChild(style);

      // Mark selected element
      if (selectedElement === 'title' && headlineEl) {
        headlineEl.classList.add('selected');
      } else if (selectedElement === 'content' && contentEl) {
        contentEl.classList.add('selected');
      }
    };

    // Trigger load for inline content
    setTimeout(() => {
      if (iframe.onload) {
        iframe.onload(new Event('load'));
      }
    }, 100);
  }, [slide.title, slide.content, slideIndex, totalSlides, stylePreset, width, height, image, updateSlideContent, applyStyles, applyPosition, onSelectElement, onPositionChange, selectedElement, slide.titlePosition, slide.contentPosition, slide.titleStyles, slide.contentStyles]);

  // Apply styles when they change (without re-rendering the whole iframe)
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument) return;

    const doc = iframe.contentDocument;
    const headlineEl = doc.querySelector('.headline') as HTMLElement;
    const contentEl = doc.querySelector('.content') as HTMLElement;

    if (headlineEl && slide.titleStyles) {
      applyStyles(headlineEl, slide.titleStyles);
    }
    if (contentEl && slide.contentStyles) {
      applyStyles(contentEl, slide.contentStyles);
    }

    // Update selected element visual
    headlineEl?.classList.toggle('selected', selectedElement === 'title');
    contentEl?.classList.toggle('selected', selectedElement === 'content');
  }, [slide.titleStyles, slide.contentStyles, selectedElement, applyStyles]);

  return (
    <div className="flex flex-col items-center">
      {/* Canvas container */}
      <div
        ref={containerRef}
        className="relative bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{
          width: scaledWidth,
          height: scaledHeight,
        }}
      >
        <iframe
          ref={iframeRef}
          title={`Slide ${slideIndex + 1}`}
          className="absolute top-0 left-0 border-0"
          style={{
            width: width,
            height: height,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
          sandbox="allow-same-origin"
        />

        {/* Edit overlay hint */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-center pointer-events-none">
          <div className="bg-charcoal/80 text-white text-sm px-4 py-2 rounded-lg backdrop-blur-sm">
            Зажмите и перетащите текст, или кликните для редактирования
          </div>
        </div>
      </div>

      {/* Slide info */}
      <div className="mt-6 text-center">
        <p className="text-sm text-teal-light">
          Слайд {slideIndex + 1} из {totalSlides}
        </p>
        <p className="text-xs text-teal-light/60 mt-1">
          {width} x {height} px
        </p>
      </div>
    </div>
  );
}
