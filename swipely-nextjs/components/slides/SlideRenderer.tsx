"use client";

import React from "react";
import type { SlideProps } from "./types";
import { getSlideDimensions } from "./utils";

// Template imports
import SwipelySlide from "./templates/SwipelySlide";
import GridMultiSlide from "./templates/GridMultiSlide";
import SpeechBubbleSlide from "./templates/SpeechBubbleSlide";
import StarHighlightSlide from "./templates/StarHighlightSlide";
import ReceiptSlide from "./templates/ReceiptSlide";
import PurpleAccentSlide from "./templates/PurpleAccentSlide";
import QuoteDoodleSlide from "./templates/QuoteDoodleSlide";
import PhotoSlide from "./templates/PhotoSlide";
import StreetSlide from "./templates/StreetSlide";
import ChapterSlide from "./templates/ChapterSlide";
import DispatchSlide from "./templates/DispatchSlide";
import FrameSlide from "./templates/FrameSlide";

const TEMPLATE_MAP: Record<string, React.ComponentType<SlideProps>> = {
  swipely: SwipelySlide,
  grid_multi: GridMultiSlide,
  speech_bubble: SpeechBubbleSlide,
  star_highlight: StarHighlightSlide,
  receipt: ReceiptSlide,
  purple_accent: PurpleAccentSlide,
  quote_doodle: QuoteDoodleSlide,
  photo_mode: PhotoSlide,
  street: StreetSlide,
  chapter: ChapterSlide,
  dispatch: DispatchSlide,
  frame: FrameSlide,
};

interface SlideRendererProps extends SlideProps {
  template: string;
  scale?: number;
}

/**
 * Renders a single carousel slide using the specified template.
 * Wraps the template component in a scaled container.
 */
export default function SlideRenderer({
  template,
  scale = 0.35,
  ...slideProps
}: SlideRendererProps) {
  const TemplateComponent = TEMPLATE_MAP[template] ?? SwipelySlide;
  const { width, height } = getSlideDimensions(slideProps.format);

  return (
    <div
      style={{
        width: width * scale,
        height: height * scale,
        overflow: "hidden",
        borderRadius: 12,
        boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
      }}
    >
      <div
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <TemplateComponent {...slideProps} />
      </div>
    </div>
  );
}
