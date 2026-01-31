
export type BackgroundPattern = 'solid' | 'gradient-tr' | 'gradient-bl' | 'dots' | 'stripes' | 'grid' | 'sketch';

export type TextAnimation = 'none' | 'fade-in' | 'slide-up' | 'slide-down' | 'zoom-in' | 'bounce';

export type FontFamily =
  // Sans-Serif (универсальные)
  | 'Inter'
  | 'Montserrat'
  | 'Poppins'
  | 'Roboto'
  | 'Open Sans'
  | 'Lato'
  | 'Raleway'
  | 'Work Sans'
  | 'Outfit'
  | 'Space Grotesk'
  // Serif (элегантные)
  | 'Playfair Display'
  | 'Merriweather'
  | 'Lora'
  | 'Crimson Text'
  | 'Libre Baskerville'
  // Display (заголовки)
  | 'Oswald'
  | 'Bebas Neue'
  | 'Anton'
  | 'Righteous'
  | 'Rubik Mono One'
  // Handwriting (акценты)
  | 'Caveat'
  | 'Pacifico'
  | 'Dancing Script'
  // Monospace
  | 'Fira Code'
  | 'JetBrains Mono';

export interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: FontFamily;
  fontWeight: string;
  width: number;
  textAlign?: 'left' | 'center' | 'right';
  animation?: TextAnimation;
}

export type TextZone = 'left' | 'right' | 'top' | 'bottom';

export interface Slide {
  id: string;
  backgroundColor: string;
  accentColor: string;
  backgroundPattern: BackgroundPattern;
  backgroundImage?: string; // URL or base64 of generated character scene
  textZone?: TextZone; // Where text should be positioned (opposite to character)
  elements: TextElement[];
}

export interface CarouselGenerationResponse {
  globalDesign: {
    backgroundColor: string;
    accentColor: string;
    pattern: BackgroundPattern;
  };
  slides: {
    content: string;
    title: string;
    sceneDescription?: string; // For character image generation
  }[];
}

export interface CharacterScene {
  slideNumber: number;
  prompt: string; // Full description for image generation
  pose: string; // "presenting", "thinking", "excited", "confident"
  emotion: string; // "happy", "curious", "determined"
  setting: string; // "studio with 3D icons", "minimal background", "office"
}

export interface HistoryItem {
  id: string;
  type: 'carousel';
  timestamp: number;
  title: string;
  data: Slide[];
}

export interface StylePreset {
  id: string;
  name: string;
  backgroundColor: string;
  accentColor: string;
  backgroundPattern: BackgroundPattern;
  isBuiltIn: boolean;
  createdAt?: number;
}

export interface FormatSettings {
  language: 'ru' | 'en';
  slideCount: number; // 3-15
  includeOriginalText: boolean;
  customStyleGuide?: string; // Pro feature
  characterImage?: string; // Base64 encoded reference image for character generation
  visualStorytellingEnabled: boolean; // Whether to generate character scenes
}
