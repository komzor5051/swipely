"use client";

import React from "react";
import type { SlideProps } from "./types";
import { getSlideDimensions } from "./utils";

// Template imports — each created by parallel agents
import SwipelySlide from "./templates/SwipelySlide";
import EditorialSlide from "./templates/EditorialSlide";
import LuxeSlide from "./templates/LuxeSlide";
import AuroraSlide from "./templates/AuroraSlide";
import TerminalSlide from "./templates/TerminalSlide";
import NotebookSlide from "./templates/NotebookSlide";
import GridMultiSlide from "./templates/GridMultiSlide";
import BackspaceSlide from "./templates/BackspaceSlide";
import SpeechBubbleSlide from "./templates/SpeechBubbleSlide";
import StarHighlightSlide from "./templates/StarHighlightSlide";
import ReceiptSlide from "./templates/ReceiptSlide";
import PurpleAccentSlide from "./templates/PurpleAccentSlide";
import LimeChecklistSlide from "./templates/LimeChecklistSlide";
import QuoteDoodleSlide from "./templates/QuoteDoodleSlide";
import PaperImageSlide from "./templates/PaperImageSlide";
import AppListSlide from "./templates/AppListSlide";

const TEMPLATE_MAP: Record<string, React.ComponentType<SlideProps>> = {
  swipely: SwipelySlide,
  editorial: EditorialSlide,
  luxe: LuxeSlide,
  aurora: AuroraSlide,
  terminal: TerminalSlide,
  notebook: NotebookSlide,
  grid_multi: GridMultiSlide,
  backspace: BackspaceSlide,
  speech_bubble: SpeechBubbleSlide,
  star_highlight: StarHighlightSlide,
  receipt: ReceiptSlide,
  purple_accent: PurpleAccentSlide,
  lime_checklist: LimeChecklistSlide,
  quote_doodle: QuoteDoodleSlide,
  paper_image: PaperImageSlide,
  app_list: AppListSlide,
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
