'use client';

import type { SlideElement, TextElement, AvatarElement, DecorationElement, IconElement, BadgeElement, ButtonElement } from '@/lib/templates/types';
import { ArrowUpRight, Share2, RefreshCw, Bookmark, Heart } from 'lucide-react';

interface ElementRendererProps {
  element: SlideElement;
}

export function ElementRenderer({ element }: ElementRendererProps) {
  switch (element.type) {
    case 'text':
    case 'heading':
      return <TextElementComponent element={element as TextElement} />;
    case 'avatar':
      return <AvatarElementComponent element={element as AvatarElement} />;
    case 'decoration':
      return <DecorationElementComponent element={element as DecorationElement} />;
    case 'icon':
      return <IconElementComponent element={element as IconElement} />;
    case 'badge':
      return <BadgeElementComponent element={element as BadgeElement} />;
    case 'button':
      return <ButtonElementComponent element={element as ButtonElement} />;
    default:
      return null;
  }
}

// Text Element
function TextElementComponent({ element }: { element: TextElement }) {
  const style: React.CSSProperties = {
    fontSize: element.fontSize,
    fontWeight: element.fontWeight,
    color: element.color,
    fontFamily: element.fontFamily || 'Inter, sans-serif',
    lineHeight: element.lineHeight || 1.3,
    maxWidth: element.maxWidth,
    whiteSpace: 'pre-wrap',
  };

  return <div style={style}>{element.content}</div>;
}

// Avatar Element
function AvatarElementComponent({ element }: { element: AvatarElement }) {
  const style: React.CSSProperties = {
    width: element.size,
    height: element.size,
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${element.gradient[0]} 0%, ${element.gradient[1]} 100%)`,
    border: element.borderWidth
      ? `${element.borderWidth}px solid ${element.borderColor || '#fff'}`
      : 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: element.size * 0.4,
    fontWeight: 800,
    color: '#0A0A0A',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
  };

  return <div style={style}>{element.letter}</div>;
}

// Decoration Element
function DecorationElementComponent({ element }: { element: DecorationElement }) {
  if (element.shape === 'lines-group' && element.lines) {
    return (
      <div style={{ position: 'relative', width: 200, height: 100 }}>
        {element.lines.map((line, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: line.offsetY,
              width: 200,
              height: 12,
              background: element.color,
              borderRadius: 6,
              transform: `rotate(${element.rotation || 0}deg)`,
              opacity: line.opacity ?? element.opacity ?? 1,
            }}
          />
        ))}
      </div>
    );
  }

  if (element.shape === 'line') {
    return (
      <div
        style={{
          width: element.width || 200,
          height: element.height || 12,
          background: element.color,
          borderRadius: 6,
          transform: `rotate(${element.rotation || 0}deg)`,
          opacity: element.opacity ?? 1,
        }}
      />
    );
  }

  if (element.shape === 'circle') {
    return (
      <div
        style={{
          width: element.width || 50,
          height: element.height || 50,
          background: element.color,
          borderRadius: '50%',
          opacity: element.opacity ?? 1,
        }}
      />
    );
  }

  // Default rect
  return (
    <div
      style={{
        width: element.width || 100,
        height: element.height || 100,
        background: element.color,
        borderRadius: 4,
        opacity: element.opacity ?? 1,
      }}
    />
  );
}

// Icon Element
function IconElementComponent({ element }: { element: IconElement }) {
  const containerStyle: React.CSSProperties = {
    width: element.size,
    height: element.size,
    backgroundColor: element.backgroundColor || '#fff',
    borderRadius: element.borderRadius ?? 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  };

  const iconSize = element.size * 0.45;

  const iconProps = {
    size: iconSize,
    color: element.color,
    strokeWidth: 2,
  };

  const getIcon = () => {
    switch (element.icon) {
      case 'arrow':
        return <ArrowUpRight {...iconProps} />;
      case 'share':
        return <Share2 {...iconProps} />;
      case 'refresh':
        return <RefreshCw {...iconProps} />;
      case 'bookmark':
        return <Bookmark {...iconProps} />;
      case 'heart':
        return <Heart {...iconProps} />;
      default:
        return null;
    }
  };

  return <div style={containerStyle}>{getIcon()}</div>;
}

// Badge Element
function BadgeElementComponent({ element }: { element: BadgeElement }) {
  const style: React.CSSProperties = {
    display: 'inline-block',
    backgroundColor: element.backgroundColor,
    color: element.color,
    fontSize: element.fontSize,
    fontWeight: element.fontWeight,
    padding: `${element.padding[0]}px ${element.padding[1]}px`,
    borderRadius: element.borderRadius,
    fontFamily: 'Inter, sans-serif',
  };

  return <div style={style}>{element.content}</div>;
}

// Button Element
function ButtonElementComponent({ element }: { element: ButtonElement }) {
  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: element.backgroundColor,
    color: element.color,
    fontSize: element.fontSize,
    fontWeight: element.fontWeight,
    padding: `${element.padding[0]}px ${element.padding[1]}px`,
    borderRadius: element.borderRadius,
    border: element.borderWidth
      ? `${element.borderWidth}px solid ${element.borderColor || '#000'}`
      : 'none',
    fontFamily: 'Inter, sans-serif',
    letterSpacing: 1,
  };

  return <div style={style}>{element.content}</div>;
}
