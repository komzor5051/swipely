"use client";

import React from "react";
import type { SlideProps } from "../types";
import { renderTitle, renderContent, getSlideDimensions } from "../utils";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');`;

export default function ReceiptSlide({
  slide,
  slideNumber,
  totalSlides,
  format,
}: SlideProps) {
  const { width, height } = getSlideDimensions(format);
  const isHook = slideNumber === 1;

  const highlightStyle: React.CSSProperties = {
    display: "inline",
    background: "#E8725C",
    color: "#FFFFFF",
    padding: "0px 12px",
    margin: "0 -4px",
    boxDecorationBreak: "clone" as const,
    WebkitBoxDecorationBreak: "clone" as const,
  };

  const hookHighlight: React.CSSProperties = {
    display: "inline",
    background: "#FFFFFF",
    color: "#1A1A1A",
    padding: "0px 12px",
    margin: "0 -4px",
    boxDecorationBreak: "clone" as const,
    WebkitBoxDecorationBreak: "clone" as const,
  };

  const noiseTexture = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`;

  const bars: Array<"thin" | "medium" | "thick" | "space"> = [
    "thick","space","thin","space","medium","thin","space",
    "thick","space","thin","medium","space","thin","space",
    "thick","thin","space","medium","space","thin",
    "thick","space","medium","thin","space",
    "thick","space","thin","medium","space",
    "thick","thin","space","medium","space","thin","thick",
  ];
  const barWidths: Record<string, number> = { thin: 2, medium: 4, thick: 6, space: 3 };

  /* ── HOOK — тёмный фон, белый чек, максимально драматичный ── */
  if (isHook) {
    return (
      <div
        style={{
          width,
          height,
          background: "#1A1A1A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <style>{FONTS}</style>

        {/* Noise */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: noiseTexture, opacity: 0.06, pointerEvents: "none" }} />

        {/* Glow */}
        <div
          style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600, height: 400,
            background: "radial-gradient(ellipse, rgba(232,114,92,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Receipt */}
        <div
          style={{
            width: "82%",
            maxWidth: 800,
            background: "#FFFFFF",
            padding: "52px 56px 36px",
            position: "relative",
            zIndex: 5,
            boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 8px 30px rgba(0,0,0,0.3)",
          }}
        >
          {/* Zigzag top */}
          <div
            style={{
              position: "absolute", top: -14, left: 0, width: "100%", height: 28,
              background: "linear-gradient(135deg, #1A1A1A 25%, transparent 25%), linear-gradient(225deg, #1A1A1A 25%, transparent 25%)",
              backgroundSize: "18px 28px",
            }}
          />
          {/* Zigzag bottom */}
          <div
            style={{
              position: "absolute", bottom: -14, left: 0, width: "100%", height: 28,
              background: "linear-gradient(315deg, #1A1A1A 25%, transparent 25%), linear-gradient(45deg, #1A1A1A 25%, transparent 25%)",
              backgroundSize: "18px 28px",
            }}
          />

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 22, fontWeight: 800, color: "#1A1A1A", letterSpacing: 3 }}>
              Swipely
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "2px dashed #DDDDDD", margin: "20px 0" }} />

          {/* Main headline */}
          <h1
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 62,
              fontWeight: 800,
              lineHeight: 1.1,
              color: "#E8725C",
              textAlign: "center",
              textTransform: "uppercase",
              letterSpacing: -1,
              margin: "24px 0",
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            {renderTitle(slide.title, hookHighlight)}
          </h1>

          <hr style={{ border: "none", borderTop: "2px dashed #DDDDDD", margin: "20px 0" }} />

          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 22, fontWeight: 500, lineHeight: 1.5, color: "#444", textAlign: "center", margin: "20px 0" }}>
            {renderContent(slide.content)}
          </p>

          <hr style={{ border: "none", borderTop: "2px dashed #DDDDDD", margin: "20px 0" }} />

          {/* Barcode */}
          <div style={{ display: "flex", justifyContent: "center", gap: 2, margin: "24px 0 12px", height: 52 }}>
            {bars.map((type, i) => (
              <div key={i} style={{ background: type === "space" ? "transparent" : "#1A1A1A", height: "100%", width: barWidths[type] }} />
            ))}
          </div>

          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#AAAAAA", textAlign: "center", letterSpacing: 1 }}>
            swipely.ai &bull; 01/{String(totalSlides).padStart(2, "0")}
          </p>
        </div>
      </div>
    );
  }

  /* ── CONTENT SLIDES — светло-серый фон, чек ── */
  return (
    <div
      style={{
        width,
        height,
        background: "#E8E8E8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <style>{FONTS}</style>

      <div style={{ position: "absolute", inset: 0, backgroundImage: noiseTexture, opacity: 0.12, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 30%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(0,0,0,0.05) 0%, transparent 50%)", pointerEvents: "none" }} />

      {/* Receipt */}
      <div
        style={{
          width: "82%",
          maxWidth: 800,
          background: "#FFFFFF",
          padding: "52px 56px 36px",
          position: "relative",
          zIndex: 5,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 8px 25px rgba(0,0,0,0.1)",
        }}
      >
        {/* Zigzag top */}
        <div
          style={{
            position: "absolute", top: -14, left: 0, width: "100%", height: 28,
            background: "linear-gradient(135deg, #E8E8E8 25%, transparent 25%), linear-gradient(225deg, #E8E8E8 25%, transparent 25%)",
            backgroundSize: "18px 28px",
          }}
        />
        {/* Zigzag bottom */}
        <div
          style={{
            position: "absolute", bottom: -14, left: 0, width: "100%", height: 28,
            background: "linear-gradient(315deg, #E8E8E8 25%, transparent 25%), linear-gradient(45deg, #E8E8E8 25%, transparent 25%)",
            backgroundSize: "18px 28px",
          }}
        />

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 22, fontWeight: 800, color: "#1A1A1A", letterSpacing: 2 }}>Swipely</div>
        </div>

        <hr style={{ border: "none", borderTop: "2px dashed #CCCCCC", margin: "18px 0" }} />

        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 52,
            fontWeight: 800,
            lineHeight: 1.12,
            color: "#E8725C",
            textAlign: "center",
            textTransform: "uppercase",
            letterSpacing: -1,
            margin: "20px 0",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
        >
          {renderTitle(slide.title, highlightStyle)}
        </h1>

        <hr style={{ border: "none", borderTop: "2px dashed #CCCCCC", margin: "18px 0" }} />

        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 22, fontWeight: 500, lineHeight: 1.5, color: "#1A1A1A", textAlign: "center", margin: "18px 0" }}>
          {slide.content}
        </p>

        <hr style={{ border: "none", borderTop: "2px dashed #CCCCCC", margin: "18px 0" }} />

        <div style={{ display: "flex", justifyContent: "center", gap: 2, margin: "20px 0 10px", height: 48 }}>
          {bars.map((type, i) => (
            <div key={i} style={{ background: type === "space" ? "transparent" : "#1A1A1A", height: "100%", width: barWidths[type] }} />
          ))}
        </div>

        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#888", textAlign: "center", letterSpacing: 1 }}>
          swipely.ai &bull; {slideNumber}/{totalSlides}
        </p>
      </div>
    </div>
  );
}
