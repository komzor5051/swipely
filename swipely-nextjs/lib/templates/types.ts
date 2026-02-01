// Типы элементов редактора карусели

export type ElementType =
  | 'text'
  | 'heading'
  | 'avatar'
  | 'decoration'
  | 'icon'
  | 'badge'
  | 'button';

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  visible: boolean;
  locked?: boolean;
  zIndex: number;
}

export interface TextElement extends BaseElement {
  type: 'text' | 'heading';
  content: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  fontFamily?: string;
  lineHeight?: number;
  maxWidth?: number;
}

export interface AvatarElement extends BaseElement {
  type: 'avatar';
  letter: string;
  size: number;
  gradient: [string, string];
  borderColor?: string;
  borderWidth?: number;
}

export interface DecorationElement extends BaseElement {
  type: 'decoration';
  shape: 'line' | 'rect' | 'circle' | 'lines-group';
  color: string;
  rotation?: number;
  opacity?: number;
  // For lines-group
  lines?: Array<{ offsetY: number; opacity?: number }>;
}

export interface IconElement extends BaseElement {
  type: 'icon';
  icon: 'arrow' | 'share' | 'refresh' | 'bookmark' | 'heart';
  size: number;
  color: string;
  backgroundColor?: string;
  borderRadius?: number;
}

export interface BadgeElement extends BaseElement {
  type: 'badge';
  content: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  backgroundColor: string;
  padding: [number, number];
  borderRadius: number;
}

export interface ButtonElement extends BaseElement {
  type: 'button';
  content: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  backgroundColor: string;
  borderColor?: string;
  borderWidth?: number;
  padding: [number, number];
  borderRadius: number;
}

export type SlideElement =
  | TextElement
  | AvatarElement
  | DecorationElement
  | IconElement
  | BadgeElement
  | ButtonElement;

export interface SlideTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  backgroundPattern?: 'grid' | 'dots' | 'lines' | 'none';
  elements: SlideElement[];
}

export interface SlideData {
  title: string;
  content: string;
  slideNumber: number;
  totalSlides: number;
  username?: string;
}
