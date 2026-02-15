"use client";

import React from "react";
import type { SlideProps } from "../types";
import { renderTitle, getSlideDimensions } from "../utils";

export default function StarHighlightSlide({
  slide,
  slideNumber,
  totalSlides,
  format,
}: SlideProps) {
  const { width, height } = getSlideDimensions(format);

  const isHook = slide.type === "hook";

  const highlightStyle: React.CSSProperties = {
    display: "inline",
    background: "#FFF59D",
    color: "#0A0A0A",
    padding: "4px 16px",
    margin: "0 -6px",
    boxDecorationBreak: "clone" as const,
    WebkitBoxDecorationBreak: "clone" as const,
  };

  return (
    <div
      style={{
        width,
        height,
        background: "#FFFFFF",
        fontFamily: "'Playfair Display', Georgia, serif",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
      }}
    >
      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');`}</style>

      {/* Category tag */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "'Inter', sans-serif",
          fontSize: 18,
          fontWeight: 600,
          color: "#0A0A0A",
          letterSpacing: 2,
          textTransform: "uppercase" as const,
        }}
      >
        [ {slide.type} ]
      </div>

      {/* Slide counter */}
      <div
        style={{
          position: "absolute",
          top: 60,
          right: 80,
          fontFamily: "'Inter', sans-serif",
          fontSize: 16,
          fontWeight: 500,
          color: "#666666",
          letterSpacing: 1,
        }}
      >
        {slideNumber}/{totalSlides}
      </div>

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center" as const,
          maxWidth: 900,
        }}
      >
        {/* Star icon */}
        <div style={{ width: 80, height: 80, marginBottom: 40 }}>
          <svg
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            width={80}
            height={80}
            fill="#0A0A0A"
          >
            <polygon points="50,0 54,42 100,50 54,58 50,100 46,58 0,50 46,42" />
          </svg>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: isHook ? 88 : 78,
            fontWeight: 500,
            lineHeight: 1.15,
            color: "#0A0A0A",
            letterSpacing: -1,
            marginBottom: 30,
            textAlign: "center" as const,
          }}
        >
          {renderTitle(slide.title, highlightStyle)}
        </h1>

        {/* Highlighted subtitle / content */}
        <span
          style={{
            display: "inline",
            background: "#FFF59D",
            padding: "4px 16px",
            fontFamily: "'Inter', sans-serif",
            fontSize: 32,
            fontWeight: 500,
            color: "#0A0A0A",
            letterSpacing: 1,
          }}
        >
          {"[ "}
          {slide.content}
          {" ]"}
        </span>
      </div>

      {/* Arrow at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 180,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <div
          style={{
            width: 120,
            height: 2,
            background: "#0A0A0A",
            position: "relative",
          }}
        >
          {/* Arrow head */}
          <div
            style={{
              position: "absolute",
              right: -2,
              top: -6,
              width: 14,
              height: 14,
              borderRight: "2px solid #0A0A0A",
              borderTop: "2px solid #0A0A0A",
              transform: "rotate(45deg)",
            }}
          />
        </div>
      </div>

      {/* Corner decorative icons */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          right: 80,
          display: "flex",
          flexDirection: "column" as const,
          gap: 15,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: "2px solid #0A0A0A",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width={20}
            height={20}
            stroke="#0A0A0A"
            fill="none"
            strokeWidth={2}
          >
            <path d="M7 17L17 7M17 7H7M17 7V17" />
          </svg>
        </div>
        <div
          style={{
            width: 40,
            height: 40,
            border: "2px solid #0A0A0A",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width={20}
            height={20}
            stroke="#0A0A0A"
            fill="none"
            strokeWidth={2}
          >
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
      </div>
    </div>
  );
}
