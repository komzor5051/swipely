"use client";

import React from "react";
import type { SlideProps } from "../types";
import { renderTitle, getSlideDimensions } from "../utils";

export default function TerminalSlide({
  slide,
  slideNumber,
  totalSlides,
  format,
  username,
}: SlideProps) {
  const { width, height } = getSlideDimensions(format);

  const highlightStyle: React.CSSProperties = {
    display: "inline",
    background: "#FFB000",
    color: "#0A0A0A",
    padding: "4px 14px",
    margin: "0 -4px",
    boxDecorationBreak: "clone",
    WebkitBoxDecorationBreak: "clone",
    textShadow: "none",
  };

  const isHook = slide.type === "hook";

  return (
    <div
      style={{
        width,
        height,
        background: "#0A0A0A",
        fontFamily: "'JetBrains Mono', monospace",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "100px 85px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap');`}</style>

      {/* CRT curvature overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.5) 100%)",
          pointerEvents: "none",
          zIndex: 10,
        }}
      />

      {/* Scanlines */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background:
            "repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(51, 255, 0, 0.03) 3px, rgba(51, 255, 0, 0.03) 6px)",
          pointerEvents: "none",
          zIndex: 8,
        }}
      />

      {/* Glow overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(51, 255, 0, 0.04) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Vertical line */}
      <div
        style={{
          position: "absolute",
          left: 65,
          top: 170,
          bottom: 170,
          width: 3,
          background:
            "linear-gradient(180deg, transparent 0%, #1A9900 20%, #1A9900 80%, transparent 100%)",
          opacity: 0.35,
          zIndex: 5,
        }}
      />

      {/* Terminal header */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 85,
          fontSize: 20,
          fontWeight: 600,
          color: "#1A9900",
          zIndex: 15,
          letterSpacing: 1,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {username ? `${username}@terminal:~` : "swipely@terminal:~"}
      </div>

      {/* Slide counter */}
      <div
        style={{
          position: "absolute",
          top: 60,
          right: 85,
          fontFamily: "'Space Mono', monospace",
          fontSize: 28,
          fontWeight: 700,
          color: "#1A9900",
          zIndex: 15,
        }}
      >
        <span style={{ color: "#33FF00" }}>{">"} </span>
        {slideNumber}/{totalSlides}
      </div>

      {/* Content wrapper */}
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
            fontFamily: "'Space Mono', monospace",
            fontSize: isHook ? 88 : 78,
            fontWeight: 700,
            lineHeight: 1.1,
            color: "#33FF00",
            marginBottom: 55,
            textTransform: "uppercase",
            letterSpacing: -2,
            maxWidth: 900,
            textShadow:
              "0 0 15px #33FF00, 0 0 30px rgba(51, 255, 0, 0.6), 0 0 60px rgba(51, 255, 0, 0.4)",
          }}
        >
          {renderTitle(slide.title, highlightStyle)}
          <span style={{ color: "#33FF00", opacity: 0.9, marginLeft: 10 }}>
            _
          </span>
        </h1>

        {/* Content */}
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 32,
            fontWeight: 400,
            lineHeight: 1.75,
            color: "#33FF00",
            maxWidth: 880,
            opacity: 0.8,
            letterSpacing: 0.3,
          }}
        >
          <span style={{ color: "#FFB000", fontWeight: 700 }}>$ </span>
          {slide.content}
        </p>
      </div>

      {/* ASCII corner — top left */}
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 85,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 16,
          color: "#1A9900",
          opacity: 0.5,
          lineHeight: 1.3,
          zIndex: 5,
          whiteSpace: "pre",
        }}
      >
        {`+--[SWP]--+\n|         |\n|  :::    |\n|         |\n+---------+`}
      </div>

      {/* ASCII corner — bottom right */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          right: 85,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 16,
          color: "#1A9900",
          opacity: 0.5,
          lineHeight: 1.3,
          zIndex: 5,
          whiteSpace: "pre",
          textAlign: "right",
        }}
      >
        {`+---------+\n|         |\n|    :::  |\n|         |\n+--[END]--+`}
      </div>

      {/* Status bar */}
      <div
        style={{
          position: "absolute",
          bottom: 55,
          left: 85,
          right: 85,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 18,
          fontWeight: 600,
          color: "#1A9900",
          zIndex: 15,
          borderTop: "2px solid rgba(51, 255, 0, 0.25)",
          paddingTop: 18,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 10,
              height: 10,
              background: "#33FF00",
              borderRadius: "50%",
              boxShadow: "0 0 12px #33FF00",
              display: "inline-block",
            }}
          />
          <span>CONNECTED</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          SWIPELY.AI
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          2026
        </div>
      </div>
    </div>
  );
}
