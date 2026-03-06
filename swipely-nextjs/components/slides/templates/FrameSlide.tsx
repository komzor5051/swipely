"use client";

import React from "react";
import type { SlideProps } from "../types";
import { renderTitle, renderContent, getSlideDimensions } from "../utils";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500&display=swap');`;

const GOLD = "#FFD764";
const GOLD_DIM = "rgba(255,215,100,0.3)";

export default function FrameSlide({
  slide,
  slideNumber,
  totalSlides,
  format,
}: SlideProps) {
  const { width, height } = getSlideDimensions(format);
  const isHook = slideNumber === 1;

  const hlStyle: React.CSSProperties = {
    fontStyle: "italic",
    color: GOLD,
  };

  /* ── Corner decoration helper ── */
  const corners = (size = 20, color = GOLD_DIM, inset = 12) => (
    <>
      {[
        { top: inset, left: inset, borderWidth: "1px 0 0 1px" },
        { top: inset, right: inset, borderWidth: "1px 1px 0 0" },
        { bottom: inset, left: inset, borderWidth: "0 0 1px 1px" },
        { bottom: inset, right: inset, borderWidth: "0 1px 1px 0" },
      ].map((style, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderColor: color,
            borderStyle: "solid",
            ...style,
          }}
        />
      ))}
    </>
  );

  /* ── HOOK — центрированный, рамка со свечением ── */
  if (isHook) {
    return (
      <div
        style={{
          width,
          height,
          background: "#131316",
          display: "flex",
          flexDirection: "column",
          padding: 32,
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <style>{FONTS}</style>

        {/* Inner frame */}
        <div
          style={{
            flex: 1,
            border: `1px solid rgba(255,215,100,0.22)`,
            borderRadius: 12,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "60px 72px",
            position: "relative",
            overflow: "hidden",
            background: "linear-gradient(160deg, #19191D 0%, #131316 100%)",
          }}
        >
          {/* Gold glow from top */}
          <div
            style={{
              position: "absolute",
              top: -100,
              left: "50%",
              transform: "translateX(-50%)",
              width: 400,
              height: 300,
              background: `radial-gradient(ellipse, ${GOLD}10 0%, transparent 70%)`,
              pointerEvents: "none",
            }}
          />

          {corners(22, "rgba(255,215,100,0.45)", 16)}

          <h1
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: 96,
              fontWeight: 400,
              lineHeight: 1.08,
              color: "#F5F4F0",
              marginBottom: 40,
              overflowWrap: "anywhere",
              wordBreak: "break-word",
              position: "relative",
              zIndex: 1,
            }}
          >
            {renderTitle(slide.title, hlStyle)}
          </h1>

          <div
            style={{
              width: 40,
              height: 1,
              background: GOLD_DIM,
              marginBottom: 36,
              flexShrink: 0,
              position: "relative",
              zIndex: 1,
            }}
          />

          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 34,
              fontWeight: 300,
              lineHeight: 1.7,
              color: "rgba(245,244,240,0.45)",
              maxWidth: 760,
              position: "relative",
              zIndex: 1,
            }}
          >
            {renderContent(slide.content)}
          </p>
        </div>
      </div>
    );
  }

  /* ── CONTENT SLIDES (2+) ── */
  const dots = Array.from({ length: totalSlides }, (_, i) => i + 1);

  return (
    <div
      style={{
        width,
        height,
        background: "#131316",
        display: "flex",
        flexDirection: "column",
        padding: "28px 28px 20px",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <style>{FONTS}</style>

      {/* Inner frame */}
      <div
        style={{
          flex: 1,
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 10,
          display: "flex",
          flexDirection: "column",
          padding: "36px 44px 32px",
          position: "relative",
          background: "linear-gradient(160deg, #18181B 0%, #131316 100%)",
          overflow: "hidden",
        }}
      >
        {corners(14, "rgba(255,215,100,0.2)", 10)}

        {/* Counter */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: 32,
          }}
        >
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 18,
              fontWeight: 500,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "rgba(255,215,100,0.22)",
            }}
          >
            {String(slideNumber).padStart(2, "0")}&nbsp;/&nbsp;{String(totalSlides).padStart(2, "0")}
          </span>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <h1
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: 72,
              fontWeight: 400,
              lineHeight: 1.08,
              color: "#F5F4F0",
              marginBottom: 28,
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
              background: "rgba(255,255,255,0.06)",
              marginBottom: 28,
              flexShrink: 0,
            }}
          />

          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 36,
              fontWeight: 300,
              lineHeight: 1.75,
              color: "rgba(245,244,240,0.45)",
            }}
          >
            {renderContent(slide.content)}
          </p>
        </div>
      </div>

      {/* Footer — outside frame */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 14,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", gap: 7 }}>
          {dots.map((n) => (
            <div
              key={n}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: n === slideNumber ? GOLD : "#222",
                flexShrink: 0,
              }}
            />
          ))}
        </div>
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 16,
            letterSpacing: 3,
            color: "#222",
            textTransform: "uppercase",
            fontWeight: 400,
          }}
        >
          Frame
        </span>
      </div>
    </div>
  );
}
