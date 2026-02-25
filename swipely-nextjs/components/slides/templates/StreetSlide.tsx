"use client";

import React from "react";
import type { SlideProps } from "../types";
import { renderTitle, getSlideDimensions } from "../utils";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@300;400;500&family=Barlow+Condensed:wght@400;500;600&display=swap');`;

export default function StreetSlide({
  slide,
  slideNumber,
  totalSlides,
  format,
}: SlideProps) {
  const { width, height } = getSlideDimensions(format);
  const isHook = slideNumber === 1;

  /* ── HOOK SLIDE (slide 1) — black, dramatic, full-impact ── */
  if (isHook) {
    const hookHighlight: React.CSSProperties = {
      fontStyle: "italic",
      color: "#E8001D",
    };

    return (
      <div
        style={{
          width,
          height,
          background: "#0A0A0A",
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

        {/* COUNTER only — no Drop label */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 22,
              fontWeight: 400,
              letterSpacing: 4,
              color: "#3C3C3C",
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
            justifyContent: "center",
            padding: "48px 0 0",
          }}
        >
          {/* BIG TITLE */}
          <h1
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 118,
              lineHeight: 0.95,
              letterSpacing: 3,
              color: "#F4F3F1",
              textTransform: "uppercase",
              marginBottom: 56,
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            {renderTitle(slide.title, hookHighlight)}
          </h1>

          {/* SEPARATOR — 55% width */}
          <div
            style={{
              width: "55%",
              height: 3,
              background: "#F4F3F1",
              marginBottom: 48,
              flexShrink: 0,
            }}
          />

          {/* CONTENT */}
          <p
            style={{
              fontFamily: "'Barlow', sans-serif",
              fontSize: 42,
              fontWeight: 300,
              lineHeight: 1.6,
              color: "rgba(244, 243, 241, 0.72)",
              letterSpacing: 0.2,
              maxWidth: 820,
            }}
          >
            {slide.content}
          </p>
        </div>
      </div>
    );
  }

  /* ── CONTENT SLIDES (2+) — off-white, calm, readable ── */
  const contentHighlight: React.CSSProperties = {
    fontStyle: "italic",
    color: "#E8001D",
  };

  return (
    <div
      style={{
        width,
        height,
        background: "#F4F3F1",
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

      {/* COUNTER only — no Drop label */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <span
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 22,
            fontWeight: 400,
            letterSpacing: 4,
            color: "#ADADAD",
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
          justifyContent: "center",
          padding: "40px 0 0",
        }}
      >
        {/* TITLE */}
        <h1
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 96,
            lineHeight: 1.0,
            letterSpacing: 2,
            color: "#0A0A0A",
            textTransform: "uppercase",
            marginBottom: 52,
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
        >
          {renderTitle(slide.title, contentHighlight)}
        </h1>

        {/* SEPARATOR */}
        <div
          style={{
            width: "100%",
            height: 2,
            background: "#0A0A0A",
            marginBottom: 52,
            flexShrink: 0,
          }}
        />

        {/* CONTENT */}
        <p
          style={{
            fontFamily: "'Barlow', sans-serif",
            fontSize: 44,
            fontWeight: 300,
            lineHeight: 1.65,
            color: "#0A0A0A",
            letterSpacing: 0.2,
            maxWidth: 870,
          }}
        >
          {slide.content}
        </p>
      </div>
    </div>
  );
}
