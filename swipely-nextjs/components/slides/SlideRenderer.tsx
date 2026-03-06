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
import NewspaperSlide from "./templates/NewspaperSlide";

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
  newspaper: NewspaperSlide,
};

interface SlideRendererProps extends SlideProps {
  template: string;
  scale?: number;
  /** Auto-calculate scale so the slide fits within this pixel width */
  maxWidth?: number;
  /** Show Swipely watermark overlay (free tier) */
  showWatermark?: boolean;
}

/**
 * Renders a single carousel slide using the specified template.
 * Wraps the template component in a scaled container.
 * Pass `maxWidth` for responsive usage — scale is computed automatically.
 */
export default function SlideRenderer({
  template,
  scale,
  maxWidth,
  showWatermark = false,
  ...slideProps
}: SlideRendererProps) {
  const TemplateComponent = TEMPLATE_MAP[template] ?? SwipelySlide;
  const { width, height } = getSlideDimensions(slideProps.format);

  const resolvedScale =
    maxWidth != null ? maxWidth / width : (scale ?? 0.35);

  return (
    <div
      style={{
        width: width * resolvedScale,
        height: height * resolvedScale,
        overflow: "hidden",
        borderRadius: 12,
        boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "relative",
          width,
          height,
          transform: `scale(${resolvedScale})`,
          transformOrigin: "top left",
        }}
      >
        <TemplateComponent {...slideProps} />

        {/* Watermark — free tier only, not removable */}
        {showWatermark && (
          <div
            style={{
              position: "absolute",
              bottom: 28,
              left: 28,
              background: "rgba(255,255,255,0.90)",
              backdropFilter: "blur(6px)",
              borderRadius: 100,
              padding: "10px 20px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 2px 16px rgba(0,0,0,0.18)",
              pointerEvents: "none",
              userSelect: "none",
              zIndex: 9999,
            }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>⚡</span>
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#0D0D14",
                letterSpacing: "-0.3px",
                fontFamily: "sans-serif",
              }}
            >
              swipely.ru
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
