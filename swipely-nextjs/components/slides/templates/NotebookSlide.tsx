"use client";

import React from "react";
import type { SlideProps } from "../types";
import { renderTitle, getSlideDimensions } from "../utils";

/**
 * Format content text: detect numbered lists (1. / 1)) and render
 * them with large handwritten numbers; otherwise render plain text
 * with quote-underline and dash-bold styling.
 */
function formatContent(text: string): React.ReactNode {
  const isNumberedList = /^\d+[.)]\s/.test(text.trim());

  if (isNumberedList) {
    const items = text
      .split(/\d+[.)]\s/)
      .filter((item) => item.trim());

    return (
      <div>
        {items.map((item, index) => {
          const trimmed = item.trim();
          let formattedContent: React.ReactNode = trimmed;

          if (trimmed.includes(":")) {
            const colonIndex = trimmed.indexOf(":");
            formattedContent = (
              <>
                <span style={{ fontWeight: 700, color: "#C13C3C" }}>
                  {trimmed.slice(0, colonIndex + 1)}
                </span>
                {trimmed.slice(colonIndex + 1)}
              </>
            );
          }

          return (
            <div
              key={index}
              style={{
                display: "flex",
                marginBottom: 32,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: 72,
                  fontWeight: 700,
                  color: "#C13C3C",
                  minWidth: 90,
                  lineHeight: 0.9,
                  marginTop: -8,
                  flexShrink: 0,
                }}
              >
                {index + 1}
              </div>
              <div
                style={{
                  flex: 1,
                  paddingTop: 8,
                  fontSize: 34,
                }}
              >
                {formattedContent}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Plain text mode: apply underline for quoted text, bold for dashes
  const parts = text.split(/(\"[^\"]+\")/g);
  const rendered = parts.map((part, i) => {
    const quoteMatch = part.match(/^\"([^\"]+)\"$/);
    if (quoteMatch) {
      return (
        <span
          key={i}
          style={{
            background:
              "linear-gradient(120deg, rgba(255,243,184,0.8) 0%, rgba(255,243,184,0.95) 100%)",
            padding: "4px 12px",
            borderRadius: 4,
            fontWeight: 600,
          }}
        >
          {quoteMatch[0]}
        </span>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });

  return <>{rendered}</>;
}

export default function NotebookSlide({
  slide,
  slideNumber,
  totalSlides,
  format,
  username,
}: SlideProps) {
  const { width, height } = getSlideDimensions(format);

  const highlightStyle: React.CSSProperties = {
    display: "inline",
    background: "#D4F542",
    color: "#1A1A1A",
    padding: "4px 12px",
    margin: "0 -4px",
    boxDecorationBreak: "clone",
    WebkitBoxDecorationBreak: "clone",
  };

  const isHook = slide.type === "hook";

  return (
    <div
      style={{
        width,
        height,
        background: "#FEF9E7",
        fontFamily: "'Literata', serif",
        display: "flex",
        flexDirection: "column",
        padding: "90px 100px 90px 130px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Literata:wght@400;500;600;700&display=swap');`}</style>

      {/* Notebook lines */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 54px, #E5D9C3 54px, #E5D9C3 56px)",
          opacity: 0.5,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Paper texture (noise via SVG) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          opacity: 0.04,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Red margin line */}
      <div
        style={{
          position: "absolute",
          left: 100,
          top: 0,
          width: 3,
          height: "100%",
          background: "#C13C3C",
          opacity: 0.35,
          zIndex: 2,
        }}
      />

      {/* Slide counter */}
      <div
        style={{
          position: "absolute",
          top: 55,
          right: 80,
          fontFamily: "'Caveat', cursive",
          fontSize: 42,
          color: "#6B6B6B",
          fontWeight: 600,
          zIndex: 10,
          transform: "rotate(-3deg)",
        }}
      >
        {slideNumber}/{totalSlides}
      </div>

      {/* Main content wrapper */}
      <div
        style={{
          position: "relative",
          zIndex: 5,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {/* Headline */}
        <h1
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: isHook ? 110 : 100,
            fontWeight: 700,
            lineHeight: 1.0,
            color: "#1A1A1A",
            marginBottom: 55,
            position: "relative",
            maxWidth: 850,
            textShadow: "1px 1px 0px rgba(0,0,0,0.03)",
          }}
        >
          {renderTitle(slide.title, highlightStyle)}
          {/* Handwritten underline */}
          <span
            style={{
              position: "absolute",
              bottom: -8,
              left: 0,
              width: 320,
              height: 6,
              background: "#C13C3C",
              borderRadius: 3,
              opacity: 0.7,
              transform: "skewY(-1deg) rotate(-0.5deg)",
              display: "block",
            }}
          />
        </h1>

        {/* Content */}
        <div
          style={{
            fontFamily: "'Literata', serif",
            fontSize: 36,
            fontWeight: 400,
            lineHeight: 1.65,
            color: "#1A1A1A",
            position: "relative",
            zIndex: 2,
            maxWidth: 820,
            letterSpacing: 0.2,
          }}
        >
          {formatContent(slide.content)}
        </div>
      </div>

      {/* Doodle: star */}
      <svg
        style={{
          position: "absolute",
          bottom: 140,
          right: 120,
          width: 100,
          height: 100,
          zIndex: 1,
          opacity: 0.2,
        }}
        viewBox="0 0 100 100"
      >
        <path
          d="M50,10 L55,38 L85,42 L58,55 L62,85 L50,62 L38,85 L42,55 L15,42 L45,38 Z"
          stroke="#3D5A80"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
        />
      </svg>

      {/* Doodle: arrow */}
      <svg
        style={{
          position: "absolute",
          top: 180,
          left: 40,
          width: 80,
          height: 50,
          zIndex: 1,
          opacity: 0.2,
        }}
        viewBox="0 0 80 50"
      >
        <path
          d="M5,25 Q40,5 75,25 M75,25 L65,18 M75,25 L68,35"
          stroke="#3D5A80"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
        />
      </svg>

      {/* Coffee stain */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: 60,
          width: 110,
          height: 110,
          background:
            "radial-gradient(circle, rgba(140,100,60,0.08) 0%, transparent 70%)",
          borderRadius: "50%",
          zIndex: 0,
        }}
      />

      {/* Paper fold corner */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: 80,
          height: 80,
          background: "linear-gradient(135deg, transparent 50%, #F5EDD6 50%)",
          boxShadow: "-3px -3px 8px rgba(0,0,0,0.05)",
          zIndex: 10,
        }}
      />

      {/* Tape decoration */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 85,
          width: 120,
          height: 35,
          background: "rgba(255,248,200,0.75)",
          transform: "rotate(-5deg)",
          zIndex: 10,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      />
    </div>
  );
}
