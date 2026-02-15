export interface SlideData {
  type: string;
  title: string; // May contain <hl>keyword</hl> tags for keyword highlighting
  content: string;
}

export interface SlideProps {
  slide: SlideData;
  slideNumber: number;
  totalSlides: number;
  format: "square" | "portrait"; // 1080x1080 or 1080x1350
  username?: string;
}
