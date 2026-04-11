export type SlideLayout = "text-left" | "text-right" | "split" | "big-number" | "quote" | "default" | "hero" | "cta" | "centered";

export interface ChartItem { label: string; value: number; }

export interface NoneElementData { type: "none"; }
export interface ListElementData { type: "list"; items: ChartItem[]; }
export interface StatElementData { type: "stat"; value: string; label: string; }
export interface BarChartElementData { type: "bar_chart"; items: ChartItem[]; }
export interface PieChartElementData { type: "pie_chart"; items: ChartItem[]; }
export interface LineChartElementData { type: "line_chart"; items: ChartItem[]; }
export interface HorizontalBarElementData { type: "horizontal_bar"; items: ChartItem[]; }
export interface CodeBlockElementData { type: "code_block"; title: string; lines: string[]; }
export interface QuoteBlockElementData { type: "quote_block"; quote: string; }
export interface StatCardsElementData { type: "stat_cards"; cards: { value: string; label: string }[]; }

export type SlideElement = NoneElementData | ListElementData | StatElementData | BarChartElementData | PieChartElementData | LineChartElementData | HorizontalBarElementData | CodeBlockElementData | QuoteBlockElementData | StatCardsElementData;

export interface SlideData {
  type: string;
  title: string; // May contain <hl>keyword</hl> tags for keyword highlighting
  content: string;
  layout?: SlideLayout;
  element?: SlideElement;
  imageUrl?: string; // base64 data URL for Photo Mode
}

export interface SlideProps {
  slide: SlideData;
  slideNumber: number;
  totalSlides: number;
  format: "square" | "portrait" | "story"; // 1080x1080, 1080x1350, or 1080x1920
  username?: string;
}
