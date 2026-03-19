"use client";

import React from "react";
import type { SlideProps } from "../types";
import { renderTitle, renderContent, getSlideDimensions, scaleContentFontSize, getLayoutVariant, getContentAlignment } from "../utils";
import { renderElement } from "../elements";

export default function QuoteDoodleSlide({
  slide,
  slideNumber,
  totalSlides,
  format,
  username,
}: SlideProps) {
  const { width, height } = getSlideDimensions(format);
  const layout = getLayoutVariant(slide.type, slideNumber, totalSlides, slide.layout);
  const alignment = getContentAlignment(layout, slideNumber);

  const highlightStyle: React.CSSProperties = {
    display: "inline",
    background: "#A3E635",
    color: "#0A0A0A",
    padding: "0px 12px",
    margin: "0 -4px",
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

      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 50,
          left: 60,
          right: 60,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          zIndex: 10,
        }}
      >
        {/* Author info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #A3E635 0%, #65A30D 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 700,
              color: "#0A0A0A",
            }}
          >
            {username ? username.charAt(0).toUpperCase() : "S"}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#0A0A0A",
              }}
            >
              {username || "Swipely"}
            </span>
            <span
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: "#666666",
              }}
            >
              AI Carousel
            </span>
          </div>
        </div>
      </div>

      {/* Slide counter (subtle, positioned at top right) */}
      <div
        style={{
          position: "absolute",
          top: 60,
          right: 60,
          fontFamily: "'Inter', sans-serif",
          fontSize: 16,
          fontWeight: 500,
          color: "#666666",
          opacity: 0,
        }}
      >
        {slideNumber}/{totalSlides}
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: isHook ? "center" : alignment,
          padding: "180px 70px 250px",
        }}
      >
        {/* Opening quote mark */}
        <div
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 160,
            fontWeight: 700,
            color: "#0A0A0A",
            lineHeight: 0.5,
            marginBottom: 20,
            marginLeft: -15,
          }}
        >
          {"\u201C"}
        </div>

        {/* Headline */}
        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: isHook ? 90 : 88,
            fontWeight: 900,
            lineHeight: 1.15,
            color: "#0A0A0A",
            letterSpacing: -3,
            maxWidth: 850,
            margin: 0,
          }}
        >
          {renderTitle(slide.title, highlightStyle)}
        </h1>

        {/* Content text */}
        {slide.element ? (
          <div style={{ marginBottom: 16, marginTop: 40 }}>
            {renderElement({ element: slide.element, accentColor: "#A3E635" })}
            {slide.content && (
              <p style={{
                fontSize: 22,
                color: "rgba(0,0,0,0.6)",
                marginTop: 12,
                fontFamily: "'Inter', sans-serif",
                lineHeight: 1.4,
              }}>
                {slide.content}
              </p>
            )}
          </div>
        ) : (
          slide.content && (
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: scaleContentFontSize(slide.content, 38),
                fontWeight: 500,
                lineHeight: 1.5,
                color: "#666666",
                marginTop: 40,
                maxWidth: 700,
              }}
            >
              {renderContent(slide.content)}
            </p>
          )
        )}
      </div>

      {/* Closing quote (decorative, faint) */}
      <div
        style={{
          fontFamily: "Georgia, serif",
          fontSize: 120,
          fontWeight: 700,
          color: "#0A0A0A",
          position: "absolute",
          right: 250,
          top: "58%",
          lineHeight: 0.5,
          opacity: 0.15,
        }}
      >
        {"\u201D"}
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: 50,
          left: 60,
          right: 60,
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "'Inter', sans-serif",
          fontSize: 14,
          color: "#666666",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <span>
            {slideNumber}/{totalSlides}
          </span>
        </div>
      </div>
    </div>
  );
}
