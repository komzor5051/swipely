"use client";

import React from "react";
import type { SlideProps } from "../types";
import { renderTitle, getSlideDimensions } from "../utils";

export default function ReceiptSlide({
  slide,
  slideNumber,
  totalSlides,
  format,
}: SlideProps) {
  const { width, height } = getSlideDimensions(format);

  const isHook = slide.type === "hook";

  const highlightStyle: React.CSSProperties = {
    display: "inline",
    background: "#E8725C",
    color: "#FFFFFF",
    padding: "4px 12px",
    margin: "0 -4px",
    boxDecorationBreak: "clone" as const,
    WebkitBoxDecorationBreak: "clone" as const,
  };

  const noiseTextureSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`;

  // Barcode bars pattern
  const bars: Array<"thin" | "medium" | "thick" | "space"> = [
    "thick", "space", "thin", "space", "medium", "thin", "space",
    "thick", "space", "thin", "medium", "space", "thin", "space",
    "thick", "thin", "space", "medium", "space", "thin",
    "thick", "space", "medium", "thin", "space",
    "thick", "space", "thin", "medium", "space",
    "thick", "thin", "space", "medium", "space", "thin", "thick",
  ];

  const barWidths: Record<string, number> = {
    thin: 2,
    medium: 4,
    thick: 6,
    space: 3,
  };

  return (
    <div
      style={{
        width,
        height,
        background: "#E8E8E8",
        fontFamily: "'Inter', -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');`}</style>

      {/* Paper texture background */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: noiseTextureSvg,
          opacity: 0.15,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Crumpled paper effect */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: [
            "radial-gradient(ellipse at 20% 30%, rgba(255,255,255,0.2) 0%, transparent 50%)",
            "radial-gradient(ellipse at 80% 70%, rgba(0,0,0,0.05) 0%, transparent 50%)",
            "radial-gradient(ellipse at 60% 20%, rgba(0,0,0,0.03) 0%, transparent 40%)",
          ].join(", "),
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Receipt paper */}
      <div
        style={{
          width: 680,
          background: "#FFFFFF",
          padding: "60px 50px 40px",
          position: "relative",
          zIndex: 5,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 8px 25px rgba(0,0,0,0.1)",
        }}
      >
        {/* Zigzag top edge */}
        <div
          style={{
            position: "absolute",
            top: -15,
            left: 0,
            width: "100%",
            height: 30,
            background: [
              "linear-gradient(135deg, #FFFFFF 25%, transparent 25%)",
              "linear-gradient(225deg, #FFFFFF 25%, transparent 25%)",
            ].join(", "),
            backgroundSize: "20px 30px",
            backgroundPosition: "0 0",
          }}
        />

        {/* Zigzag bottom edge */}
        <div
          style={{
            position: "absolute",
            bottom: -15,
            left: 0,
            width: "100%",
            height: 30,
            background: [
              "linear-gradient(315deg, #FFFFFF 25%, transparent 25%)",
              "linear-gradient(45deg, #FFFFFF 25%, transparent 25%)",
            ].join(", "),
            backgroundSize: "20px 30px",
            backgroundPosition: "0 0",
          }}
        />

        {/* Header with logo */}
        <div style={{ textAlign: "center" as const, marginBottom: 30 }}>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 28,
              fontWeight: 800,
              color: "#1A1A1A",
              letterSpacing: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <span>Swipely</span>
            <div style={{ display: "flex", gap: 4 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  background: "#1A1A1A",
                  borderRadius: "50%",
                }}
              />
              <div
                style={{
                  width: 8,
                  height: 8,
                  background: "#1A1A1A",
                  borderRadius: "50%",
                  opacity: 0.6,
                }}
              />
              <div
                style={{
                  width: 8,
                  height: 8,
                  background: "#1A1A1A",
                  borderRadius: "50%",
                  opacity: 0.3,
                }}
              />
            </div>
          </div>
        </div>

        {/* Separator */}
        <hr
          style={{
            border: "none",
            borderTop: "2px dashed #CCCCCC",
            margin: "25px 0",
          }}
        />

        {/* Main headline */}
        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: isHook ? 58 : 52,
            fontWeight: 800,
            lineHeight: 1.15,
            color: "#E8725C",
            textAlign: "center" as const,
            textTransform: "uppercase" as const,
            letterSpacing: -1,
            margin: "30px 0",
          }}
        >
          {renderTitle(slide.title, highlightStyle)}
        </h1>

        {/* Separator */}
        <hr
          style={{
            border: "none",
            borderTop: "2px dashed #CCCCCC",
            margin: "25px 0",
          }}
        />

        {/* Content */}
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 24,
            fontWeight: 500,
            lineHeight: 1.5,
            color: "#1A1A1A",
            textAlign: "center" as const,
            margin: "25px 0",
          }}
        >
          {slide.content}
        </p>

        {/* Separator */}
        <hr
          style={{
            border: "none",
            borderTop: "2px dashed #CCCCCC",
            margin: "25px 0",
          }}
        />

        {/* Barcode */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 2,
            margin: "30px 0 15px",
            height: 60,
          }}
        >
          {bars.map((type, i) => (
            <div
              key={i}
              style={{
                background: type === "space" ? "transparent" : "#1A1A1A",
                height: "100%",
                width: barWidths[type],
              }}
            />
          ))}
        </div>

        {/* URL and slide counter */}
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 14,
            fontWeight: 400,
            color: "#888888",
            textAlign: "center" as const,
            letterSpacing: 1,
          }}
        >
          swipely.ai &bull; {slideNumber}/{totalSlides}
        </p>
      </div>

      {/* Corner icons */}
      <div
        style={{
          position: "absolute",
          bottom: 45,
          right: 60,
          display: "flex",
          flexDirection: "column" as const,
          gap: 10,
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            background: "#FFFFFF",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width={18}
            height={18}
            stroke="#1A1A1A"
            fill="none"
            strokeWidth={2}
          >
            <path d="M7 17L17 7M17 7H7M17 7V17" />
          </svg>
        </div>
      </div>
    </div>
  );
}
