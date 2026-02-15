"use client";

import React from "react";
import type { SlideProps } from "../types";
import { renderTitle, getSlideDimensions } from "../utils";

export default function PaperImageSlide({
  slide,
  slideNumber,
  totalSlides,
  format,
  username,
}: SlideProps) {
  const { width, height } = getSlideDimensions(format);

  const highlightStyle: React.CSSProperties = {
    display: "inline",
    background: "#E8725C",
    color: "#FFFFFF",
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
        background: "#F5F3EE",
        fontFamily: "'Inter', -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* Crumpled paper texture (noise overlay) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: 0.12,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Paper fold shadows */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: [
            "linear-gradient(135deg, transparent 40%, rgba(0,0,0,0.03) 45%, transparent 50%)",
            "linear-gradient(225deg, transparent 40%, rgba(255,255,255,0.5) 45%, transparent 50%)",
            "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.3) 0%, transparent 40%)",
            "radial-gradient(ellipse at 70% 80%, rgba(0,0,0,0.04) 0%, transparent 40%)",
          ].join(", "),
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Header with logo */}
      <div
        style={{
          position: "absolute",
          top: 50,
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 10,
        }}
      >
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 28,
            fontWeight: 700,
            color: "#1A1A1A",
            letterSpacing: -0.5,
          }}
        >
          {username || "swipely"}
          <span style={{ color: "#E8725C" }}>.</span>
        </span>
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          padding: "160px 70px 200px",
          position: "relative",
          zIndex: 5,
        }}
      >
        {/* Headline */}
        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: isHook ? 92 : 86,
            fontWeight: 900,
            lineHeight: 1.05,
            color: "#1A1A1A",
            letterSpacing: -3,
            maxWidth: 900,
            textAlign: "center",
            margin: "0 auto",
          }}
        >
          {renderTitle(slide.title, highlightStyle)}
        </h1>

        {/* Content text */}
        {slide.content && (
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 32,
              fontWeight: 500,
              lineHeight: 1.5,
              color: "#888888",
              textAlign: "center",
              marginTop: 60,
              maxWidth: 700,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {slide.content}
          </p>
        )}
      </div>

      {/* Dashed arrow decoration */}
      <div
        style={{
          position: "absolute",
          right: 200,
          top: "45%",
          width: 150,
          height: 180,
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 150 180">
          <path
            d="M 20 10 Q 80 40, 60 90 Q 40 140, 90 160 L 110 145 M 90 160 L 75 140"
            fill="none"
            stroke="#1A1A1A"
            strokeWidth={3}
            strokeDasharray="10, 8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Bottom illustration area */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 500,
          height: 450,
          background:
            "linear-gradient(180deg, transparent 0%, rgba(200,200,200,0.15) 100%)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          zIndex: 2,
        }}
      >
        {/* Stylized engraving lines effect */}
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: 350,
              height: 350,
              background:
                "repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(100,100,100,0.08) 4px, rgba(100,100,100,0.08) 6px)",
              borderRadius: "50% 50% 0 0",
              WebkitMaskImage:
                "radial-gradient(ellipse at center bottom, black 60%, transparent 100%)",
              maskImage:
                "radial-gradient(ellipse at center bottom, black 60%, transparent 100%)",
            }}
          />
        </div>
      </div>

      {/* Slide counter */}
      <div
        style={{
          position: "absolute",
          bottom: 50,
          right: 70,
          zIndex: 10,
        }}
      >
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 16,
            fontWeight: 500,
            color: "#888888",
          }}
        >
          {slideNumber}/{totalSlides}
        </span>
      </div>

      {/* Corner icons */}
      <div
        style={{
          position: "absolute",
          bottom: 45,
          right: 60,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: 45,
            height: 45,
            background: "#FFFFFF",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
          }}
        >
          <svg
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1A1A1A"
            strokeWidth={2}
          >
            <path d="M7 17L17 7M17 7H7M17 7V17" />
          </svg>
        </div>
        <div
          style={{
            width: 45,
            height: 45,
            background: "#FFFFFF",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
          }}
        >
          <svg
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1A1A1A"
            strokeWidth={2}
          >
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
      </div>
    </div>
  );
}
