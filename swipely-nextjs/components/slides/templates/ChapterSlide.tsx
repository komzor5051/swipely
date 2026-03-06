"use client";

import React from "react";
import type { SlideProps } from "../types";
import { renderTitle, renderContent, getSlideDimensions } from "../utils";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500&display=swap');`;

export default function ChapterSlide({
  slide,
  slideNumber,
  totalSlides,
  format,
}: SlideProps) {
  const { width, height } = getSlideDimensions(format);
  const isHook = slideNumber === 1;

  const hlStyle: React.CSSProperties = {
    fontStyle: "italic",
    color: "#8B7355",
  };

  /* ── HOOK — центрирован, драматичен ── */
  if (isHook) {
    return (
      <div
        style={{
          width,
          height,
          background: "#FAF7F2",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 100px",
          position: "relative",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <style>{FONTS}</style>

        {/* Watermark number */}
        <div
          style={{
            position: "absolute",
            bottom: -60,
            right: -20,
            fontFamily: "'Inter', sans-serif",
            fontSize: 420,
            fontWeight: 900,
            color: "#EDE9E3",
            lineHeight: 1,
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          1
        </div>

        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: 3,
            background: "linear-gradient(90deg, #8B7355 0%, #C8B89A 60%, transparent 100%)",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 96,
              fontWeight: 400,
              lineHeight: 1.07,
              letterSpacing: -0.5,
              color: "#1A1814",
              marginBottom: 44,
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            {renderTitle(slide.title, hlStyle)}
          </h1>

          {/* Rule */}
          <div
            style={{
              width: 48,
              height: 1,
              background: "#8B7355",
              marginBottom: 44,
              flexShrink: 0,
            }}
          />

          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 38,
              fontWeight: 300,
              lineHeight: 1.7,
              color: "#5A5246",
              maxWidth: 800,
            }}
          >
            {renderContent(slide.content)}
          </p>
        </div>
      </div>
    );
  }

  /* ── CONTENT SLIDES (2+) ── */
  return (
    <div
      style={{
        width,
        height,
        background: "#FAF7F2",
        display: "flex",
        flexDirection: "column",
        padding: "68px 96px 64px",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <style>{FONTS}</style>

      {/* Watermark number */}
      <div
        style={{
          position: "absolute",
          bottom: -40,
          right: -16,
          fontFamily: "'Inter', sans-serif",
          fontSize: 340,
          fontWeight: 900,
          color: "#EDE9E3",
          lineHeight: 1,
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        {slideNumber}
      </div>

      {/* Counter */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 52,
        }}
      >
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 20,
            fontWeight: 500,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#C8BFB2",
          }}
        >
          {slideNumber}&nbsp;&nbsp;/&nbsp;&nbsp;{totalSlides}
        </span>
      </div>

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <h1
          style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 76,
            fontWeight: 400,
            lineHeight: 1.1,
            letterSpacing: -0.5,
            color: "#1A1814",
            marginBottom: 36,
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
        >
          {renderTitle(slide.title, hlStyle)}
        </h1>

        {/* Rule */}
        <div
          style={{
            width: 36,
            height: 1,
            background: "#8B7355",
            marginBottom: 36,
            flexShrink: 0,
          }}
        />

        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 38,
            fontWeight: 300,
            lineHeight: 1.72,
            color: "#3A3328",
            flex: 1,
          }}
        >
          {slide.content}
        </p>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 40,
          }}
        >
          <div style={{ width: 120, height: 1, background: "#E0D8CE" }} />
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 18,
              letterSpacing: 3,
              color: "#D0C8BC",
              fontWeight: 300,
            }}
          >
            {slideNumber} из {totalSlides}
          </span>
        </div>
      </div>
    </div>
  );
}
