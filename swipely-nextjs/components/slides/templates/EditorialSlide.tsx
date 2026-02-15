"use client";

import React from "react";
import type { SlideProps } from "../types";
import { renderTitle, getSlideDimensions } from "../utils";

export default function EditorialSlide({
  slide,
  slideNumber,
  totalSlides,
  format,
  username,
}: SlideProps) {
  const { width, height } = getSlideDimensions(format);

  const highlightStyle: React.CSSProperties = {
    display: "inline",
    background: "#E63946",
    color: "#F8F5F0",
    padding: "6px 16px",
    margin: "0 -6px",
    boxDecorationBreak: "clone",
    WebkitBoxDecorationBreak: "clone",
  };

  const isHook = slide.type === "hook";

  // Scale color block and content area proportionally for square format
  const colorBlockWidth = 380;
  const accentStripWidth = 20;
  const contentRightOffset = colorBlockWidth + accentStripWidth;

  return (
    <div
      style={{
        width,
        height,
        background: "#F8F5F0",
        fontFamily: "'Outfit', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700;900&family=Outfit:wght@300;400;500&display=swap');`}</style>

      {/* Large color block (right side) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: colorBlockWidth,
          height: "100%",
          background: "#141414",
          zIndex: 1,
        }}
      />

      {/* Red accent strip */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: colorBlockWidth,
          width: accentStripWidth,
          height: "100%",
          background: "#E63946",
          zIndex: 2,
        }}
      />

      {/* Main content area */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: contentRightOffset,
          height: "100%",
          padding: "100px 80px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          zIndex: 3,
        }}
      >
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: isHook ? 96 : 86,
            fontWeight: 900,
            lineHeight: 1.0,
            color: "#141414",
            marginBottom: 50,
            letterSpacing: -3,
            maxWidth: 580,
          }}
        >
          {renderTitle(slide.title, highlightStyle)}
        </h1>
        {slide.content && (
          <p
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 34,
              fontWeight: 400,
              lineHeight: 1.6,
              color: "#141414",
              maxWidth: 540,
              letterSpacing: 0.2,
              opacity: 0.85,
            }}
          >
            {slide.content}
          </p>
        )}
      </div>

      {/* Giant faded number (top left, on cream bg) */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 60,
          fontFamily: "'Playfair Display', serif",
          fontSize: 200,
          fontWeight: 900,
          color: "#141414",
          opacity: 0.06,
          lineHeight: 1,
          zIndex: 4,
        }}
      >
        {slideNumber}
      </div>

      {/* Slide indicator (bottom left) */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 80,
          fontSize: 18,
          fontWeight: 500,
          color: "#141414",
          letterSpacing: 5,
          textTransform: "uppercase" as const,
          zIndex: 4,
        }}
      >
        {slideNumber} — {totalSlides}
      </div>

      {/* Sidebar text (vertical, on dark block) */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          right: 50,
          transform: "translateY(-50%)",
          width: 280,
          zIndex: 5,
        }}
      >
        <p
          style={{
            fontSize: 16,
            fontWeight: 300,
            lineHeight: 1.8,
            color: "#F8F5F0",
            opacity: 0.5,
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            transform: "rotate(180deg)",
            letterSpacing: 3,
            textTransform: "uppercase" as const,
          }}
        >
          {username ? `${username} Editorial` : "Swipely Editorial"}
        </p>
      </div>

      {/* Large number on dark side */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          right: 60,
          fontFamily: "'Playfair Display', serif",
          fontSize: 320,
          fontWeight: 900,
          color: "#F8F5F0",
          opacity: 0.08,
          lineHeight: 1,
          zIndex: 2,
        }}
      >
        {slideNumber}
      </div>

      {/* Decorative horizontal lines */}
      <div
        style={{
          position: "absolute",
          height: 2,
          background: "#141414",
          opacity: 0.12,
          top: 280,
          left: 80,
          width: 120,
        }}
      />
      <div
        style={{
          position: "absolute",
          height: 2,
          background: "#141414",
          opacity: 0.12,
          bottom: 180,
          left: 80,
          width: 80,
        }}
      />

      {/* Dot pattern */}
      <div
        style={{
          position: "absolute",
          top: 120,
          right: colorBlockWidth + accentStripWidth + 30,
          width: 80,
          height: 80,
          backgroundImage:
            "radial-gradient(#D4A574 2.5px, transparent 2.5px)",
          backgroundSize: "14px 14px",
          opacity: 0.6,
          zIndex: 2,
        }}
      />

      {/* Brand mark */}
      <div
        style={{
          position: "absolute",
          top: 80,
          right: colorBlockWidth + accentStripWidth + 30,
          fontSize: 14,
          fontWeight: 500,
          color: "#E63946",
          letterSpacing: 4,
          textTransform: "uppercase" as const,
          zIndex: 5,
        }}
      >
        {username || "Swipely"}
      </div>
    </div>
  );
}
