export type SlideLayout = "text-left" | "text-right" | "split" | "big-number" | "quote" | "default";

// Rich element data types
export interface ChartItem {
  label: string;
  value: number;
}

export interface ListElementData {
  type: "list";
  items: ChartItem[]; // 3-7 items; only label is used for display, value is ignored (unified schema with charts for Gemini compatibility)
}

export interface StatElementData {
  type: "stat";
  value: string;  // e.g. "87%", "2.4M", "$150K"
  label: string;  // supporting description
}

export interface BarChartElementData {
  type: "bar_chart";
  items: ChartItem[]; // 3-5 bars
}

export interface PieChartElementData {
  type: "pie_chart";
  items: ChartItem[]; // 3-5 slices, raw numbers (component computes %)
}

export type SlideElement = ListElementData | StatElementData | BarChartElementData | PieChartElementData;

export interface SlideData {
  type: string;
  title: string; // May contain <hl>keyword</hl> tags for keyword highlighting
  content: string;
  imageUrl?: string; // base64 data URL for Photo Mode
  layout?: SlideLayout; // AI-assigned visual composition per slide
  element?: SlideElement; // Rich element — at most one per slide
}

export interface SlideProps {
  slide: SlideData;
  slideNumber: number;
  totalSlides: number;
  format: "square" | "portrait" | "story"; // 1080x1080 or 1080x1350 or 1080x1920
  username?: string;
}
