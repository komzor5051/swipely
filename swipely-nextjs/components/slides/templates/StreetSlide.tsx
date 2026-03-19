"use client";

import React from "react";
import type { SlideProps } from "../types";
import { renderTitle, renderContent, getSlideDimensions, scaleContentFontSize, getLayoutVariant, getContentAlignment, PhotoBackground } from "../utils";
import { renderElement } from "../elements";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@300;400;500&family=Barlow+Condensed:wght@400;500;600&display=swap');`;

export default function StreetSlide({
  slide,
  slideNumber,
  totalSlides,
  format,
}: SlideProps) {
  const { width, height } = getSlideDimensions(format);
  const layout = getLayoutVariant(slide.type, slideNumber, totalSlides, slide.layout);
  const hasPhoto = !!slide.imageUrl;
  const alignment = getContentAlignment(layout, slideNumber);

  const hlStyle: React.CSSProperties = {
    fontStyle: "italic",
    color: layout === "cta" ? "#F4F3F1" : "#E8001D",
  };

  // Dark slide: hook, split (tension/contrast on even slides), cta, or photo
  const isDark = layout === "hero" || layout === "cta" || hasPhoto ||
    (layout === "split" && slideNumber % 2 === 0);

  const bg = isDark ? "#0A0A0A" : "#F4F3F1";
  const textColor = isDark ? "#F4F3F1" : "#0A0A0A";
  const subtextColor = isDark ? "rgba(244,243,241,0.72)" : "#0A0A0A";
  const counterColor = isDark ? "#3C3C3C" : "#ADADAD";
  const sepColor = isDark ? "#F4F3F1" : "#0A0A0A";

  return (
    <div
      style={{
        width,
        height,
        background: bg,
        fontFamily: "'Barlow', sans-serif",
        display: "flex",
        flexDirection: "column",
        padding: "72px 92px 80px",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <style>{FONTS}</style>

      {/* Photo background */}
      {hasPhoto && (
        <PhotoBackground imageUrl={slide.imageUrl!} overlayOpacity={0.6} />
      )}

      {/* Quote: large background glyph */}
      {layout === "quote" && (
        <div
          style={{
            position: "absolute",
            top: 40,
            right: 40,
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 320,
            lineHeight: 1,
            color: isDark ? "rgba(232,0,29,0.1)" : "rgba(232,0,29,0.06)",
            userSelect: "none",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          &rdquo;
        </div>
      )}

      {/* COUNTER */}
      <div style={{ display: "flex", justifyContent: "flex-end", position: "relative", zIndex: 2, flexShrink: 0 }}>
        <span
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 22,
            fontWeight: 400,
            letterSpacing: 4,
            color: hasPhoto ? "rgba(255,255,255,0.5)" : counterColor,
            textTransform: "uppercase",
          }}
        >
          {slideNumber}&nbsp;&nbsp;/&nbsp;&nbsp;{totalSlides}
        </span>
      </div>

      {/* MAIN */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: layout === "cta" ? "center" : layout === "split" ? "space-between" : alignment,
          alignItems: layout === "cta" ? "center" : undefined,
          textAlign: layout === "cta" ? "center" : undefined,
          padding: layout === "hero" ? "48px 0 0" : "40px 0 0",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* TITLE */}
        <h1
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: layout === "hero" ? 118 : layout === "cta" ? 104 : layout === "quote" ? 84 : 96,
            lineHeight: layout === "hero" ? 0.95 : 1.0,
            letterSpacing: layout === "hero" ? 3 : 2,
            color: hasPhoto ? "#FFFFFF" : textColor,
            textTransform: "uppercase",
            marginBottom: layout === "quote" ? 32 : layout === "hero" ? 56 : layout === "split" ? 40 : 52,
            overflowWrap: "anywhere",
            wordBreak: "break-word",
            textShadow: hasPhoto ? "0 2px 12px rgba(0,0,0,0.5)" : undefined,
          }}
        >
          {renderTitle(slide.title, hlStyle)}
        </h1>

        {/* SEPARATOR */}
        {layout !== "quote" && (
          <div
            style={{
              width: layout === "hero" ? "55%" : layout === "cta" ? "40%" : "100%",
              height: layout === "hero" ? 3 : 2,
              background: layout === "cta" ? "#E8001D" : (hasPhoto ? "rgba(255,255,255,0.6)" : sepColor),
              marginBottom: layout === "hero" ? 48 : 52,
              flexShrink: 0,
              alignSelf: layout === "cta" ? "center" : undefined,
            }}
          />
        )}

        {/* CONTENT */}
        {slide.element ? (
          <div style={{ marginBottom: 16 }}>
            {renderElement({ element: slide.element, accentColor: "#E8001D" })}
            {slide.content && (
              <p style={{
                fontSize: 22,
                color: "rgba(255,255,255,0.6)",
                marginTop: 12,
                fontFamily: "'Barlow', sans-serif",
                lineHeight: 1.4,
              }}>
                {slide.content}
              </p>
            )}
          </div>
        ) : (
          <p
            style={{
              fontFamily: "'Barlow', sans-serif",
              fontSize: scaleContentFontSize(slide.content, layout === "hero" ? 42 : layout === "quote" ? 46 : 50),
              fontWeight: 300,
              lineHeight: layout === "quote" ? 1.75 : 1.65,
              fontStyle: layout === "quote" ? "italic" : undefined,
              color: hasPhoto ? "rgba(255,255,255,0.9)" : subtextColor,
              letterSpacing: 0.2,
              maxWidth: layout === "cta" ? 780 : 870,
              textShadow: hasPhoto ? "0 1px 8px rgba(0,0,0,0.4)" : undefined,
            }}
          >
            {renderContent(slide.content)}
          </p>
        )}

        {/* CTA button-like element */}
        {layout === "cta" && (
          <div
            style={{
              marginTop: 56,
              padding: "20px 64px",
              background: "#E8001D",
              color: "#F4F3F1",
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 36,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            {slide.type === "cta" ? "Подробнее" : `${slideNumber} / ${totalSlides}`}
          </div>
        )}
      </div>
    </div>
  );
}
