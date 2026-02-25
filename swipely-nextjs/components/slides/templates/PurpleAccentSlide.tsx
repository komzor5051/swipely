"use client";

import React from "react";
import type { SlideProps } from "../types";
import { renderTitle, getSlideDimensions } from "../utils";

export default function PurpleAccentSlide({
  slide,
  slideNumber,
  totalSlides,
  format,
  username,
}: SlideProps) {
  const { width, height } = getSlideDimensions(format);

  const isHook = slide.type === "hook";

  const highlightStyle: React.CSSProperties = {
    display: "inline",
    background: "#F9A8D4",
    color: "#0A0A0A",
    padding: "6px 16px",
    margin: "0 -6px",
    boxDecorationBreak: "clone" as const,
    WebkitBoxDecorationBreak: "clone" as const,
  };

  return (
    <div
      style={{
        width,
        height,
        background: "#E8E6F2",
        fontFamily: "'Inter', -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* Rounded corners inset effect */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          right: 20,
          bottom: 20,
          borderRadius: 40,
          boxShadow: "inset 0 0 0 20px #E8E6F2",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Header with logo and arrow */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 70,
          right: 70,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 42,
            fontWeight: 800,
            color: "#0A0A0A",
            letterSpacing: -1,
          }}
        >
          {username ? username.charAt(0).toUpperCase() : "K"}
          <span style={{ color: "#0A0A0A" }}>.</span>
        </div>

        {/* Arrow right */}
        <div
          style={{
            width: 50,
            height: 2,
            background: "#0A0A0A",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: -2,
              top: -7,
              width: 16,
              height: 16,
              borderRight: "2px solid #0A0A0A",
              borderTop: "2px solid #0A0A0A",
              transform: "rotate(45deg)",
            }}
          />
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "160px 70px 200px",
        }}
      >
        {/* Headline */}
        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: isHook ? 100 : 92,
            fontWeight: 800,
            lineHeight: 1.0,
            color: "#0A0A0A",
            letterSpacing: -4,
          }}
        >
          {renderTitle(slide.title, highlightStyle)}
          {/* Pink dot at the end */}
          <span
            style={{
              display: "inline-block",
              width: 18,
              height: 18,
              background: "#E91E8C",
              borderRadius: "50%",
              marginLeft: 8,
              verticalAlign: "middle",
            }}
          />
        </h1>

        {/* Content text (subtitle) */}
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 34,
            fontWeight: 500,
            lineHeight: 1.5,
            color: "#0A0A0A",
            marginTop: 40,
            maxWidth: 700,
            opacity: 0.85,
          }}
        >
          {slide.content}
        </p>
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 70,
          right: 70,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* CTA button */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "#FFFFFF",
            color: "#0A0A0A",
            padding: "16px 28px",
            borderRadius: 12,
            fontFamily: "'Inter', sans-serif",
            fontSize: 18,
            fontWeight: 600,
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >
          <span style={{ fontSize: 16 }}>{"\u2197"}</span>
          Swipe to learn
        </div>

        {/* Slide counter */}
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 16,
            fontWeight: 500,
            color: "#0A0A0A",
            opacity: 0.5,
          }}
        >
          {slideNumber}/{totalSlides}
        </div>
      </div>

      {/* Corner icons */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          right: 70,
          display: "flex",
          flexDirection: "column" as const,
          gap: 12,
        }}
      >
        <div
          style={{
            width: 50,
            height: 50,
            background: "#FFFFFF",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width={22}
            height={22}
            stroke="#0A0A0A"
            fill="none"
            strokeWidth={2}
          >
            <path d="M7 17L17 7M17 7H7M17 7V17" />
          </svg>
        </div>
        <div
          style={{
            width: 50,
            height: 50,
            background: "#FFFFFF",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width={22}
            height={22}
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
