"use client";

import React from "react";
import type { SlideProps } from "../types";
import { renderTitle, getSlideDimensions } from "../utils";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Space+Grotesk:wght@300;400;500&display=swap');`;

const ACCENT = "#5B4FE8";
const ACCENT_LIGHT = "#A89AFF";

export default function DispatchSlide({
  slide,
  slideNumber,
  totalSlides,
  format,
}: SlideProps) {
  const { width, height } = getSlideDimensions(format);
  const isHook = slideNumber === 1;

  const hlStyle: React.CSSProperties = {
    color: ACCENT_LIGHT,
    fontStyle: "normal",
  };

  /* ── HOOK — без шапки, крупный, ударный ── */
  if (isHook) {
    return (
      <div
        style={{
          width,
          height,
          background: "#0D0D18",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
          boxSizing: "border-box",
        }}
      >
        <style>{FONTS}</style>

        {/* Accent top bar */}
        <div style={{ height: 6, background: ACCENT, flexShrink: 0 }} />

        {/* Purple ambient glow */}
        <div
          style={{
            position: "absolute",
            top: -120,
            left: -120,
            width: 600,
            height: 600,
            background: `radial-gradient(circle, ${ACCENT}22 0%, transparent 65%)`,
            pointerEvents: "none",
          }}
        />

        {/* Body */}
        <div
          style={{
            flex: 1,
            padding: "56px 88px 72px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Counter top-right */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 20,
                fontWeight: 500,
                letterSpacing: 4,
                color: "#2A2A40",
                textTransform: "uppercase",
              }}
            >
              01&nbsp;&nbsp;/&nbsp;&nbsp;{String(totalSlides).padStart(2, "0")}
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 104,
              fontWeight: 800,
              lineHeight: 0.98,
              color: "#F5F5F3",
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            {renderTitle(slide.title, hlStyle)}
          </h1>

          {/* Bottom: divider + content */}
          <div>
            <div
              style={{
                width: "100%",
                height: 1,
                background: "#1A1A2E",
                marginBottom: 32,
                flexShrink: 0,
              }}
            />
            <p
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 38,
                fontWeight: 300,
                lineHeight: 1.65,
                color: "#555570",
                maxWidth: 840,
              }}
            >
              {slide.content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── CONTENT SLIDES — с шапкой ── */
  const dots = Array.from({ length: totalSlides }, (_, i) => i + 1);

  return (
    <div
      style={{
        width,
        height,
        background: "#0D0D18",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <style>{FONTS}</style>

      {/* Header bar */}
      <div
        style={{
          background: ACCENT,
          padding: "18px 44px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.45)",
          }}
        >
          Dispatch
        </span>
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 18,
            fontWeight: 500,
            letterSpacing: 3,
            color: "rgba(255,255,255,0.45)",
          }}
        >
          {String(slideNumber).padStart(2, "0")}&nbsp;/&nbsp;{String(totalSlides).padStart(2, "0")}
        </span>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          padding: "44px 44px 36px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 76,
            fontWeight: 800,
            lineHeight: 1.02,
            color: "#F5F5F3",
            marginBottom: 32,
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
        >
          {renderTitle(slide.title, hlStyle)}
        </h1>

        <div
          style={{
            width: "100%",
            height: 1,
            background: "#1A1A2E",
            marginBottom: 32,
            flexShrink: 0,
          }}
        />

        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 36,
            fontWeight: 300,
            lineHeight: 1.7,
            color: "#666680",
            flex: 1,
          }}
        >
          {slide.content}
        </p>

        {/* Footer: dots + step */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 28,
            borderTop: "1px solid #141420",
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            {dots.map((n) => (
              <div
                key={n}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: n === slideNumber ? ACCENT : "#1E1E30",
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 18,
              color: "#222230",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            {slideNumber === totalSlides ? "финал" : `шаг ${slideNumber} из ${totalSlides}`}
          </span>
        </div>
      </div>
    </div>
  );
}
