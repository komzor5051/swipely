export interface TextPosition {
  x: number;  // % от ширины
  y: number;  // % от высоты
}

export interface TextStyles {
  fontSize?: number;    // px
  color?: string;       // hex
  textAlign?: 'left' | 'center' | 'right';
}

export interface Slide {
  type: 'hook' | 'content' | 'cta' | 'intro' | 'tip' | 'example' | 'story' | 'cover';
  title: string;
  content: string;
  emphasize?: string[];
  titlePosition?: TextPosition;
  contentPosition?: TextPosition;
  titleStyles?: TextStyles;
  contentStyles?: TextStyles;
  // External/API-provided templates: pre-rendered HTML replaces the global template
  html?: string;
}

export interface CarouselData {
  slides: Slide[];
  // External sessions (created via /api/external/session) are locked to inline HTML
  external?: boolean;
  source?: string;
  meta?: Record<string, unknown> | null;
}

export interface EditSession {
  id: string;
  token: string;
  userId: number;
  carouselData: CarouselData;
  stylePreset: string;
  format: 'square' | 'portrait';
  username?: string;
  createdAt: string;
  expiresAt: string;
}

export interface SessionResponse {
  carouselData: CarouselData;
  stylePreset: string;
  format: 'square' | 'portrait';
  username?: string;
  images?: string[];  // Base64 images for Photo Mode
  expiresAt: string;
}

export interface CreateSessionRequest {
  userId: number;
  carouselData: CarouselData;
  stylePreset: string;
  format: 'square' | 'portrait';
  username?: string;
}

export interface CreateSessionResponse {
  token: string;
  editUrl: string;
  expiresAt: string;
}

export type FormatSize = {
  width: number;
  height: number;
};

export const FORMAT_SIZES: Record<string, FormatSize> = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
};
