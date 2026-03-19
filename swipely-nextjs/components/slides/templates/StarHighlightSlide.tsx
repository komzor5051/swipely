"use client";

import React from "react";
import type { SlideProps } from "../types";
import { renderTitle, renderContent, getSlideDimensions } from "../utils";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,800;1,400;1,700&family=Inter:wght@300;400;500;600&display=swap');`;

function StarIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} fill={color}>
      <polygon points="50,0 54,42 100,50 54,58 50,100 46,58 0,50 46,42" />
    </svg>
  );
}

export default function StarHighlightSlide({
  slide,
  slideNumber,
  totalSlides,
  format,
}: SlideProps) {
  const { width, height } = getSlideDimensions(format);
  const isHook = slideNumber === 1;

  const highlightStyle: React.CSSProperties = {
    display: "inline",
    background: "#FFF59D",
    color: "#0A0A0A",
    padding: "0px 14px",
    margin: "0 -6px",
    boxDecorationBreak: "clone" as const,
    WebkitBoxDecorationBreak: "clone" as const,
  };

  const hookHighlight: React.CSSProperties = {
    display: "inline",
    background: "#FFF59D",
    color: "#0A0A0A",
    padding: "0px 14px",
    margin: "0 -6px",
    boxDecorationBreak: "clone" as const,
    WebkitBoxDecorationBreak: "clone" as const,
  };

  /* ── HOOK — тёмный фон, большая звезда, центрированный ── */
  if (isHook) {
    return (
      <div
        style={{
          width,
          height,
          background: "#0F0F0F",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 90px",
          position: "relative",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <style>{FONTS}</style>

        {/* Фоновые звёзды */}
        <div style={{ position: "absolute", top: 60, left: 80, opacity: 0.06 }}>
          <StarIcon size={120} color="#FFF59D" />
        </div>
        <div style={{ position: "absolute", bottom: 80, right: 70, opacity: 0.04 }}>
          <StarIcon size={180} color="#FFF59D" />
        </div>

        {/* Counter */}
        <div
          style={{
            position: "absolute",
            top: 60,
            right: 80,
            fontFamily: "'Inter', sans-serif",
            fontSize: 18,
            fontWeight: 500,
            letterSpacing: 3,
            color: "rgba(255,255,255,0.15)",
          }}
        >
          01 / {String(totalSlides).padStart(2, "0")}
        </div>

        {/* Центральная звезда */}
        <div style={{ marginBottom: 48 }}>
          <StarIcon size={64} color="#FFF59D" />
        </div>

        {/* Заголовок */}
        <h1
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 96,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: -1,
            color: "#FFFFFF",
            textAlign: "center",
            marginBottom: 40,
            overflowWrap: "anywhere",
            wordBreak: "break-word",
            maxWidth: 860,
          }}
        >
          {renderTitle(slide.title, hookHighlight)}
        </h1>

        {/* Контент в жёлтом блоке */}
        <div
          style={{
            background: "rgba(255,245,157,0.08)",
            border: "1px solid rgba(255,245,157,0.15)",
            borderRadius: 12,
            padding: "20px 36px",
            maxWidth: 800,
          }}
        >
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 34,
              fontWeight: 300,
              lineHeight: 1.65,
              color: "rgba(255,255,255,0.55)",
              textAlign: "center",
            }}
          >
            {renderContent(slide.content)}
          </p>
        </div>
      </div>
    );
  }

  /* ── CONTENT SLIDES — белый фон, звезда сверху ── */
  return (
    <div
      style={{
        width,
        height,
        background: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        padding: "72px 88px",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <style>{FONTS}</style>

      {/* Декоративная звезда фоном */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          right: 70,
          opacity: 0.04,
        }}
      >
        <StarIcon size={220} color="#0A0A0A" />
      </div>

      {/* Счётчик + мини-звезда */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 56,
          flexShrink: 0,
        }}
      >
        <div style={{ opacity: 0.35 }}>
          <StarIcon size={28} color="#0A0A0A" />
        </div>
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 18,
            fontWeight: 500,
            letterSpacing: 3,
            color: "#AAAAAA",
          }}
        >
          {String(slideNumber).padStart(2, "0")}&nbsp;/&nbsp;{String(totalSlides).padStart(2, "0")}
        </span>
      </div>

      {/* Центрированный контент */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {/* Заголовок */}
        <h1
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 80,
            fontWeight: 700,
            lineHeight: 1.12,
            letterSpacing: -0.5,
            color: "#0A0A0A",
            marginBottom: 40,
            overflowWrap: "anywhere",
            wordBreak: "break-word",
            position: "relative",
            zIndex: 1,
          }}
        >
          {renderTitle(slide.title, highlightStyle)}
        </h1>

        {/* Разделитель */}
        <div
          style={{
            width: "100%",
            height: 1,
            background: "#F0F0F0",
            marginBottom: 36,
            flexShrink: 0,
          }}
        />

        {/* Контент */}
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 36,
            fontWeight: 400,
            lineHeight: 1.7,
            color: "#444444",
            position: "relative",
            zIndex: 1,
          }}
        >
          {slide.content}
        </p>
      </div>

      {/* Стрелка снизу */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginTop: 36,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 80,
            height: 2,
            background: "#0A0A0A",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: -2,
              top: -5,
              width: 12,
              height: 12,
              borderRight: "2px solid #0A0A0A",
              borderTop: "2px solid #0A0A0A",
              transform: "rotate(45deg)",
            }}
          />
        </div>
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 16,
            fontWeight: 500,
            color: "#AAAAAA",
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          дальше
        </span>
      </div>
    </div>
  );
}
