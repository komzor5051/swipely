"use client";

import React from "react";
import type { SlideProps } from "../types";
import { renderTitle, getSlideDimensions } from "../utils";

export default function LuxeSlide({
  slide,
  slideNumber,
  totalSlides,
  format,
  username,
}: SlideProps) {
  const { width, height } = getSlideDimensions(format);

  const highlightStyle: React.CSSProperties = {
    display: "inline",
    background: "#C9A96E",
    color: "#0C0C0C",
    padding: "6px 16px",
    margin: "0 -6px",
    boxDecorationBreak: "clone",
    WebkitBoxDecorationBreak: "clone",
  };

  const isHook = slide.type === "hook";

  const cornerOrnamentSvg = (
    <svg viewBox="0 0 70 70" width={70} height={70}>
      <path
        d="M0,0 L35,0 L35,6 L6,6 L6,35 L0,35 Z"
        fill="#C9A96E"
        opacity="0.65"
      />
      <circle cx="18" cy="18" r="4" fill="#C9A96E" opacity="0.45" />
    </svg>
  );

  return (
    <div
      style={{
        width,
        height,
        background: "#0C0C0C",
        fontFamily: "'Outfit', sans-serif",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "110px 100px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Outfit:wght@300;400;500&display=swap');`}</style>

      {/* Marble texture overlay (via CSS pseudo-element simulation) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 600 600' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.015' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.035,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Central glow */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          background:
            "radial-gradient(ellipse, rgba(201, 169, 110, 0.1) 0%, transparent 70%)",
          borderRadius: "50%",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* Gold frame — outer */}
      <div
        style={{
          position: "absolute",
          top: 55,
          left: 55,
          right: 55,
          bottom: 55,
          border: "1px solid #C9A96E",
          opacity: 0.45,
          zIndex: 1,
        }}
      >
        {/* Gold frame — inner */}
        <div
          style={{
            position: "absolute",
            top: 18,
            left: 18,
            right: 18,
            bottom: 18,
            border: "1px solid #C9A96E",
            opacity: 0.65,
          }}
        />
      </div>

      {/* Corner ornaments */}
      {/* Top-left */}
      <div style={{ position: "absolute", top: 40, left: 40, zIndex: 2 }}>
        {cornerOrnamentSvg}
      </div>
      {/* Top-right */}
      <div
        style={{
          position: "absolute",
          top: 40,
          right: 40,
          transform: "rotate(90deg)",
          zIndex: 2,
        }}
      >
        {cornerOrnamentSvg}
      </div>
      {/* Bottom-left */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 40,
          transform: "rotate(-90deg)",
          zIndex: 2,
        }}
      >
        {cornerOrnamentSvg}
      </div>
      {/* Bottom-right */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          right: 40,
          transform: "rotate(180deg)",
          zIndex: 2,
        }}
      >
        {cornerOrnamentSvg}
      </div>

      {/* Slide counter */}
      <div
        style={{
          position: "absolute",
          top: 80,
          right: 100,
          fontSize: 22,
          fontWeight: 400,
          color: "#C9A96E",
          letterSpacing: 10,
          zIndex: 10,
          textTransform: "uppercase" as const,
        }}
      >
        {slideNumber} — {totalSlides}
      </div>

      {/* Vertical brand text */}
      <div
        style={{
          position: "absolute",
          left: 80,
          top: "50%",
          transform: "translateY(-50%) rotate(-90deg)",
          fontSize: 14,
          fontWeight: 400,
          color: "#C9A96E",
          letterSpacing: 8,
          textTransform: "uppercase" as const,
          opacity: 0.55,
          zIndex: 5,
        }}
      >
        {username ? `${username} Luxe` : "Swipely Luxe"}
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
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: isHook ? 102 : 92,
            fontWeight: 600,
            lineHeight: 1.1,
            color: "#F5F0E8",
            marginBottom: 55,
            letterSpacing: 1,
            maxWidth: 880,
          }}
        >
          {renderTitle(slide.title, highlightStyle)}
          {/* Gold line after headline */}
          <span
            style={{
              display: "block",
              width: 150,
              height: 2,
              background: "linear-gradient(90deg, #C9A96E, transparent)",
              marginTop: 40,
            }}
          />
        </h1>
        {slide.content && (
          <p
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 34,
              fontWeight: 300,
              lineHeight: 1.75,
              color: "#F5F0E8",
              maxWidth: 820,
              letterSpacing: 0.8,
              opacity: 0.85,
            }}
          >
            {slide.content}
          </p>
        )}
      </div>

      {/* Gold accent wave (bottom right) */}
      <div
        style={{
          position: "absolute",
          bottom: 160,
          right: 100,
          zIndex: 5,
        }}
      >
        <svg width={180} height={90} viewBox="0 0 180 90">
          <path
            d="M0,45 Q45,0 90,45 T180,45"
            stroke="#C9A96E"
            strokeWidth="1.5"
            fill="none"
            opacity="0.55"
          />
          <path
            d="M25,45 Q55,18 90,45 T155,45"
            stroke="#C9A96E"
            strokeWidth="1.5"
            fill="none"
            opacity="0.35"
          />
        </svg>
      </div>

      {/* Diamonds */}
      <div
        style={{
          position: "absolute",
          width: 14,
          height: 14,
          background: "#C9A96E",
          transform: "rotate(45deg)",
          opacity: 0.65,
          bottom: 110,
          left: 220,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 10,
          height: 10,
          background: "#C9A96E",
          transform: "rotate(45deg)",
          opacity: 0.45,
          top: 240,
          right: 140,
        }}
      />

      {/* Tagline */}
      <div
        style={{
          position: "absolute",
          bottom: 75,
          left: 100,
          fontSize: 15,
          fontWeight: 400,
          color: "#6B6B6B",
          letterSpacing: 5,
          textTransform: "uppercase" as const,
          zIndex: 5,
        }}
      >
        Excellence in Every Detail
      </div>
    </div>
  );
}
