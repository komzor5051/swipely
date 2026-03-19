"use client";

import React from "react";
import type { SlideProps } from "../types";
import { renderTitle, renderContent, getSlideDimensions, getLayoutVariant, getContentAlignment } from "../utils";
import { renderElement } from "../elements";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=Manrope:wght@500;600;700;800&display=swap');`;

export default function PhotoSlide({
  slide,
  slideNumber,
  totalSlides,
  format,
  username,
}: SlideProps) {
  const { width, height } = getSlideDimensions(format);
  const layout = getLayoutVariant(slide.type, slideNumber, totalSlides, slide.layout);
  const alignment = getContentAlignment(layout, slideNumber);
  const isHook = slideNumber === 1;

  const titleLength = (slide.title || "").length;
  const contentLength = (slide.content || "").length;

  // Hook: заголовок всегда большой
  let titleSize = isHook ? 96 : 72;
  if (!isHook) {
    if (titleLength <= 20) titleSize = 88;
    else if (titleLength <= 35) titleSize = 76;
    else if (titleLength <= 50) titleSize = 64;
    else if (titleLength <= 70) titleSize = 56;
    else titleSize = 48;
  } else {
    if (titleLength <= 20) titleSize = 108;
    else if (titleLength <= 35) titleSize = 96;
    else if (titleLength <= 50) titleSize = 80;
    else titleSize = 68;
  }

  let contentSize = 36;
  if (contentLength <= 50) contentSize = 44;
  else if (contentLength <= 100) contentSize = 40;
  else if (contentLength <= 150) contentSize = 36;
  else if (contentLength <= 200) contentSize = 32;
  else contentSize = 28;

  const hasImage = !!slide.imageUrl;

  const highlightStyle: React.CSSProperties = {
    display: "inline",
    color: "#D4F542",
  };

  return (
    <div
      style={{
        width,
        height,
        fontFamily: "'Manrope', sans-serif",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <style>{FONTS}</style>

      {/* Background */}
      <div
        style={{
          position: "absolute", inset: 0,
          ...(hasImage
            ? { backgroundImage: `url('${slide.imageUrl}')`, backgroundSize: "cover", backgroundPosition: "center" }
            : { background: "#0A0A0A" }),
        }}
      />

      {/* Gradient overlay — hook сильнее снизу, content равномернее */}
      <div
        style={{
          position: "absolute", inset: 0,
          background: isHook
            ? `linear-gradient(180deg,
                rgba(0,0,0,0.6) 0%,
                rgba(0,0,0,0.2) 25%,
                rgba(0,0,0,0.0) 45%,
                rgba(0,0,0,0.0) 55%,
                rgba(0,0,0,0.45) 72%,
                rgba(0,0,0,0.85) 100%
              )`
            : `linear-gradient(180deg,
                rgba(0,0,0,0.7) 0%,
                rgba(0,0,0,0.3) 15%,
                rgba(0,0,0,0.0) 35%,
                rgba(0,0,0,0.0) 55%,
                rgba(0,0,0,0.4) 70%,
                rgba(0,0,0,0.85) 100%
              )`,
        }}
      />

      {/* Vignette */}
      <div
        style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* HOOK: акцентная полоса вверху */}
      {isHook && (
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: 6,
            background: "linear-gradient(90deg, #D4F542 0%, rgba(212,245,66,0.3) 100%)",
          }}
        />
      )}

      {/* Content wrapper */}
      <div
        style={{
          position: "absolute", inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: alignment,
          padding: isHook ? "80px 68px 72px" : "70px 65px",
        }}
      >
        {/* Top: headline */}
        <div style={{ flex: "0 0 auto", paddingTop: isHook ? 16 : 10 }}>
          <h1
            style={{
              fontFamily: "'Unbounded', sans-serif",
              fontSize: titleSize,
              fontWeight: 900,
              color: "#FFFFFF",
              lineHeight: 1.05,
              textTransform: "uppercase",
              letterSpacing: -2,
              maxWidth: "95%",
              wordWrap: "break-word",
              overflowWrap: "anywhere",
              textShadow: "0 0 40px rgba(0,0,0,0.95), 0 4px 8px rgba(0,0,0,0.9)",
              margin: 0,
            }}
          >
            {renderTitle(slide.title, highlightStyle)}
          </h1>

          {/* Hook: лайм-разделитель под заголовком */}
          {isHook && (
            <div
              style={{
                width: 56,
                height: 4,
                background: "#D4F542",
                borderRadius: 2,
                marginTop: 28,
              }}
            />
          )}
        </div>

        {/* Bottom: контент */}
        {slide.element ? (
          <div style={{ flex: "0 0 auto", paddingBottom: 15 }}>
            <div
              style={{
                background: isHook ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.55)",
                borderRadius: 20,
                padding: "28px 32px",
                border: isHook
                  ? "1px solid rgba(212,245,66,0.2)"
                  : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {renderElement({ element: slide.element, accentColor: "#FFFFFF" })}
              {slide.content && (
                <p style={{ fontSize: 22, color: "rgba(255,255,255,0.6)", marginTop: 12, fontFamily: "'Manrope', sans-serif", lineHeight: 1.4 }}>
                  {slide.content}
                </p>
              )}
            </div>
          </div>
        ) : (
          slide.content && (
            <div style={{ flex: "0 0 auto", paddingBottom: 15 }}>
              <div
                style={{
                  background: isHook ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.55)",
                  borderRadius: 20,
                  padding: "28px 32px",
                  border: isHook
                    ? "1px solid rgba(212,245,66,0.2)"
                    : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <p
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: contentSize,
                    fontWeight: 600,
                    color: "#FFFFFF",
                    lineHeight: 1.5,
                    letterSpacing: -0.3,
                    textShadow: "0 2px 8px rgba(0,0,0,0.8)",
                    margin: 0,
                  }}
                >
                  {renderContent(slide.content)}
                </p>
              </div>
            </div>
          )
        )}
      </div>

      {/* Slide counter */}
      <div
        style={{
          position: "absolute",
          top: isHook ? 44 : 65,
          right: isHook ? 68 : 65,
          fontFamily: "'Unbounded', sans-serif",
          fontSize: 24,
          fontWeight: 700,
          color: "#FFFFFF",
          background: "rgba(0,0,0,0.65)",
          padding: "10px 20px",
          borderRadius: 50,
          border: isHook
            ? "1px solid rgba(212,245,66,0.3)"
            : "1px solid rgba(255,255,255,0.15)",
          textShadow: "0 2px 10px rgba(0,0,0,0.8)",
        }}
      >
        {slideNumber}/{totalSlides}
      </div>

      {/* Bottom accent line */}
      <div
        style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: isHook ? 6 : 5,
          background: isHook
            ? "linear-gradient(90deg, #D4F542 0%, rgba(212,245,66,0.4) 50%, transparent 100%)"
            : "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 20%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.3) 80%, transparent 100%)",
        }}
      />

      {/* Username */}
      {username && (
        <div
          style={{
            position: "absolute",
            bottom: 20, left: 24,
            fontFamily: "'Manrope', sans-serif",
            fontSize: 18,
            fontWeight: 600,
            color: "#FFFFFF",
            background: "rgba(0,0,0,0.7)",
            padding: "8px 16px",
            borderRadius: 20,
            zIndex: 10,
            letterSpacing: 0.3,
          }}
        >
          {username}
        </div>
      )}
    </div>
  );
}
