"use client";

import React from "react";
import type { SlideProps } from "../types";
import { renderTitle, getSlideDimensions } from "../utils";

export default function BackspaceSlide({
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
    color: "#2D2A26",
    padding: "6px 16px",
    margin: "0 -6px",
    boxDecorationBreak: "clone",
    WebkitBoxDecorationBreak: "clone",
  };

  const isHook = slide.type === "hook";

  return (
    <div
      style={{
        width,
        height,
        background: "#F0EFED",
        fontFamily: "'Space Grotesk', 'Manrope', sans-serif",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&display=swap');`}</style>

      {/* Noise texture overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          opacity: 0.08,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Slide counter */}
      <div
        style={{
          position: "absolute",
          top: 70,
          right: 80,
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 22,
          fontWeight: 500,
          color: "#2D2A26",
          opacity: 0.6,
          letterSpacing: 2,
          zIndex: 10,
        }}
      >
        {slideNumber} / {totalSlides}
      </div>

      {/* Decorative dot 1 (left middle) */}
      <div
        style={{
          position: "absolute",
          top: "45%",
          left: 60,
          width: 28,
          height: 28,
          background: "#5B5FE8",
          borderRadius: "50%",
          zIndex: 5,
        }}
      />

      {/* Connector line 1 */}
      <div
        style={{
          position: "absolute",
          width: 3,
          height: 100,
          top: "calc(45% + 28px)",
          left: 72,
          background: "#5B5FE8",
          zIndex: 4,
        }}
      />

      {/* Decorative dot 2 (right lower) */}
      <div
        style={{
          position: "absolute",
          bottom: "32%",
          right: 140,
          width: 28,
          height: 28,
          background: "#5B5FE8",
          borderRadius: "50%",
          zIndex: 5,
        }}
      />

      {/* Connector line 2 */}
      <div
        style={{
          position: "absolute",
          width: 3,
          height: 80,
          bottom: "calc(32% + 28px)",
          right: 152,
          background: "#5B5FE8",
          zIndex: 4,
        }}
      />

      {/* Main content */}
      <div
        style={{
          position: "relative",
          zIndex: 5,
          padding: "120px 100px",
          paddingLeft: 120,
        }}
      >
        {/* Headline */}
        <h1
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: isHook ? 96 : 88,
            fontWeight: 700,
            lineHeight: 1.0,
            color: "#2D2A26",
            letterSpacing: -3,
            marginBottom: 55,
            maxWidth: 880,
          }}
        >
          {renderTitle(slide.title, highlightStyle)}
        </h1>

        {/* Content */}
        <p
          style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: 34,
            fontWeight: 500,
            lineHeight: 1.55,
            color: "#2D2A26",
            maxWidth: 780,
            marginBottom: 60,
          }}
        >
          {slide.content}
        </p>
      </div>

      {/* Brand watermark */}
      <div
        style={{
          position: "absolute",
          bottom: 70,
          left: 100,
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 16,
          fontWeight: 500,
          color: "#2D2A26",
          opacity: 0.4,
          letterSpacing: 3,
          textTransform: "uppercase",
          zIndex: 10,
        }}
      >
        {username || "Swipely"}
      </div>

      {/* Grid pattern decoration (bottom right) */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: 300,
          height: 300,
          backgroundImage:
            "linear-gradient(rgba(93, 95, 232, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(93, 95, 232, 0.05) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
          zIndex: 1,
        }}
      />
    </div>
  );
}
