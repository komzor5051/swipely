"use client";

import React from "react";
import type { SlideProps } from "../types";
import { renderTitle, getSlideDimensions } from "../utils";

export default function GridMultiSlide({
  slide,
  slideNumber,
  totalSlides,
  format,
  username,
}: SlideProps) {
  const { width, height } = getSlideDimensions(format);

  const highlightStyle: React.CSSProperties = {
    display: "inline",
    background: "#F9A8D4",
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
        background: "#FAFAFA",
        fontFamily: "'Inter', -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* Grid pattern background */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          zIndex: 0,
        }}
      />

      {/* Decorative lines in top-right */}
      <div
        style={{
          position: "absolute",
          top: 40,
          right: 40,
          width: 180,
          height: 180,
          zIndex: 1,
        }}
      >
        {[0, 25, 50, 75].map((topOffset, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 200,
              height: 12,
              background: "#D4F542",
              borderRadius: 6,
              transformOrigin: "right center",
              top: topOffset,
              transform: "rotate(-25deg)",
              opacity: i === 3 ? 0.5 : 1,
            }}
          />
        ))}
      </div>

      {/* Header with avatar */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 70,
          display: "flex",
          alignItems: "center",
          gap: 16,
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: 70,
            height: 70,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #F9A8D4 0%, #D4F542 100%)",
            border: "4px solid #FFFFFF",
            boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            fontWeight: 800,
            color: "#0A0A0A",
          }}
        >
          {username ? username.charAt(0).toUpperCase() : "S"}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#0A0A0A",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {username || "Swipely"}
          </span>
          <span
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: "#888888",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            @{username || "swipely"}
          </span>
        </div>
      </div>

      {/* Slide counter (invisible in original, opacity 0) */}
      <div
        style={{
          position: "absolute",
          top: 65,
          right: 250,
          fontFamily: "'Inter', sans-serif",
          fontSize: 16,
          fontWeight: 500,
          color: "#888888",
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
          padding: "200px 70px 250px",
          position: "relative",
          zIndex: 5,
        }}
      >
        {/* Headline */}
        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: isHook ? 96 : 88,
            fontWeight: 800,
            lineHeight: 1.05,
            color: "#0A0A0A",
            letterSpacing: -3,
            maxWidth: 850,
          }}
        >
          {renderTitle(slide.title, highlightStyle)}
        </h1>

        {/* Content */}
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 32,
            fontWeight: 500,
            lineHeight: 1.5,
            color: "#888888",
            marginTop: 50,
            maxWidth: 700,
          }}
        >
          {slide.content}
        </p>
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 70,
          right: 70,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        {/* Left side empty in original — swipe button removed from footer-left */}
        <div />

        {/* Footer right */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 5,
          }}
        >
          <span
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#0A0A0A",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {slideNumber}/{totalSlides}
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "#888888",
              textTransform: "uppercase",
              letterSpacing: 1,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Follow for more
          </span>
        </div>
      </div>
    </div>
  );
}
