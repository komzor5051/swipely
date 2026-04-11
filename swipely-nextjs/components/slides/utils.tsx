import React from "react";
import type { SlideLayout } from "./types";

/* ── Layout variant system ── */

export type LayoutVariant = SlideLayout;

const FALLBACK_MAP: Record<string, SlideLayout> = {
  hook: "text-left",
  tension: "split",
  contrast: "split",
  value: "default",
  insight: "default",
  proof: "quote",
  cta: "default",
};

/**
 * Map slide semantic type to a layout variant.
 * When AI assigns a layout via slide.layout, that takes priority.
 * Falls back to slideNumber-based and type-based logic for unknown types.
 */
export function getLayoutVariant(
  slideType: string,
  slideNumber: number,
  totalSlides: number,
  slideLayout?: SlideLayout
): LayoutVariant {
  // If AI assigned a layout, use it directly (skip if "default" to allow fallback logic)
  if (slideLayout && slideLayout !== "default") return slideLayout;
  // Fallback: existing deterministic logic
  if (slideNumber === 1) return "text-left";
  if (slideNumber === totalSlides) return "default";
  return FALLBACK_MAP[slideType] ?? "default";
}

/**
 * Get vertical alignment for slide content based on layout variant and slide number.
 * Ensures adjacent slides look visually different by alternating text position.
 */
export function getContentAlignment(
  layout: LayoutVariant,
  slideNumber: number
): "flex-start" | "center" | "flex-end" | "space-between" {
  if (layout === "big-number" || layout === "quote") return "center";
  if (layout === "text-left") return "flex-start";
  if (layout === "text-right") return "flex-end";
  if (layout === "split") return slideNumber % 2 === 0 ? "flex-end" : "flex-start";
  // "default": alternate top/bottom
  return slideNumber % 2 === 0 ? "flex-start" : "flex-end";
}

/* ── Photo background component ── */

interface PhotoBackgroundProps {
  imageUrl: string;
  overlayColor?: string;
  overlayOpacity?: number;
}

export function PhotoBackground({
  imageUrl,
  overlayColor = "#000000",
  overlayOpacity = 0.55,
}: PhotoBackgroundProps) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          background: overlayColor,
          opacity: overlayOpacity,
          zIndex: 1,
        }}
      />
    </>
  );
}

/**
 * Parse title with <hl>keyword</hl> tags and render highlighted spans.
 * highlightStyle is applied to the <hl> content.
 */
export function renderTitle(
  title: string,
  highlightStyle: React.CSSProperties
): React.ReactNode {
  const lines = title.split("\n");
  return lines.map((line, lineIdx) => {
    const parts = line.split(/(<hl>.*?<\/hl>)/g);
    const rendered = parts.map((part, i) => {
      const match = part.match(/^<hl>(.*?)<\/hl>$/);
      if (match) {
        return (
          <span key={i} style={highlightStyle}>
            {match[1]}
          </span>
        );
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
    return (
      <React.Fragment key={lineIdx}>
        {rendered}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

/**
 * Render content text with \n → <br> support.
 */
export function renderContent(content: string): React.ReactNode {
  if (!content) return null;
  const lines = content.split("\n");
  return lines.map((line, i) => (
    <React.Fragment key={i}>
      {line}
      {i < lines.length - 1 && <br />}
    </React.Fragment>
  ));
}

/**
 * Get slide dimensions based on format.
 */
export function getSlideDimensions(format: "square" | "portrait" | "story") {
  if (format === "square") return { width: 1080, height: 1080 };
  if (format === "story") return { width: 1080, height: 1920 };
  return { width: 1080, height: 1350 };
}

/**
 * Scale content font size based on text length.
 * Prevents overflow when preserve-text mode passes long user content.
 * baseSize should be the design's ideal font size for short text (~100 chars).
 */
export function scaleContentFontSize(text: string, baseSize: number): number {
  const len = (text ?? "").length;
  if (len <= 120) return baseSize;
  if (len <= 200) return Math.round(baseSize * 0.82);
  if (len <= 300) return Math.round(baseSize * 0.68);
  if (len <= 450) return Math.round(baseSize * 0.56);
  if (len <= 650) return Math.round(baseSize * 0.46);
  return Math.round(baseSize * 0.38);
}
