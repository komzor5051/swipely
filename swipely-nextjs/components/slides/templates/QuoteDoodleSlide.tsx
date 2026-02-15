"use client";

import React from "react";
import type { SlideProps } from "../types";
import { renderTitle, getSlideDimensions } from "../utils";

export default function QuoteDoodleSlide({
  slide,
  slideNumber,
  totalSlides,
  format,
  username,
}: SlideProps) {
  const { width, height } = getSlideDimensions(format);

  const highlightStyle: React.CSSProperties = {
    display: "inline",
    background: "#A3E635",
    color: "#0A0A0A",
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
          justifyContent: "center",
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
            fontSize: isHook ? 90 : 82,
            fontWeight: 900,
            lineHeight: 1.05,
            color: "#0A0A0A",
            letterSpacing: -3,
            maxWidth: 850,
            margin: 0,
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
              color: "#666666",
              marginTop: 40,
              maxWidth: 700,
            }}
          >
            {slide.content}
          </p>
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

      {/* Dashed arrow decoration */}
      <div
        style={{
          position: "absolute",
          right: 180,
          top: "55%",
          width: 200,
          height: 200,
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 200 200">
          <path
            d="M 20 100 Q 100 20, 100 100 Q 100 160, 140 180 L 160 160 M 140 180 L 130 155"
            fill="none"
            stroke="#0A0A0A"
            strokeWidth={3}
            strokeDasharray="12, 8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* CTA circle button */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          right: 100,
          width: 80,
          height: 80,
          background: "#1A1A1A",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width={28}
          height={28}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#A3E635"
          strokeWidth={2.5}
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: 50,
          left: 60,
          right: 200,
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
