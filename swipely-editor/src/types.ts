export interface Slide {
  type: 'hook' | 'content' | 'cta' | 'intro' | 'tip' | 'example' | 'story';
  title: string;
  content: string;
  emphasize?: string[];
}

export interface CarouselData {
  slides: Slide[];
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
