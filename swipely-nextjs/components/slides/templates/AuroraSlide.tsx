"use client";

import React from "react";
import type { SlideProps } from "../types";
import { renderTitle, getSlideDimensions } from "../utils";

export default function AuroraSlide({
  slide,
  slideNumber,
  totalSlides,
  format,
  username,
}: SlideProps) {
  const { width, height } = getSlideDimensions(format);

  const highlightStyle: React.CSSProperties = {
    display: "inline",
    background: "#D4F542",
    color: "#12121A",
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
        background: "#12121A",
        fontFamily: "'Manrope', sans-serif",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "100px 90px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;800&family=Manrope:wght@400;500;600&display=swap');`}</style>

      {/* Aurora gradient blobs */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          overflow: "hidden",
        }}
      >
        {/* Blob 1 — purple-to-cyan, top right */}
        <div
          style={{
            position: "absolute",
            borderRadius: "50%",
            filter: "blur(140px)",
            opacity: 0.7,
            width: 800,
            height: 800,
            background:
              "linear-gradient(135deg, #7F5AF0 0%, #72F2EB 100%)",
            top: -250,
            right: -150,
          }}
        />
        {/* Blob 2 — green-to-cyan, bottom left */}
        <div
          style={{
            position: "absolute",
            borderRadius: "50%",
            filter: "blur(140px)",
            opacity: 0.7,
            width: 600,
            height: 600,
            background:
              "linear-gradient(225deg, #2CB67D 0%, #72F2EB 100%)",
            bottom: 50,
            left: -200,
          }}
        />
        {/* Blob 3 — orange-to-purple, bottom right */}
        <div
          style={{
            position: "absolute",
            borderRadius: "50%",
            filter: "blur(140px)",
            opacity: 0.5,
            width: 450,
            height: 450,
            background:
              "linear-gradient(180deg, #FF8E3C 0%, #7F5AF0 100%)",
            bottom: -150,
            right: 150,
          }}
        />
      </div>

      {/* Grain overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.04,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Slide counter */}
      <div
        style={{
          position: "absolute",
          top: 70,
          right: 90,
          fontSize: 28,
          fontWeight: 600,
          color: "#FFFFFE",
          letterSpacing: 4,
          zIndex: 10,
          opacity: 0.7,
        }}
      >
        <span
          style={{
            fontSize: 42,
            fontWeight: 800,
            opacity: 1,
          }}
        >
          {slideNumber}
        </span>
        /{totalSlides}
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
            fontFamily: "'Fraunces', serif",
            fontSize: isHook ? 98 : 88,
            fontWeight: 800,
            lineHeight: 1.05,
            color: "#FFFFFE",
            marginBottom: 55,
            letterSpacing: -2,
            maxWidth: 900,
          }}
        >
          {renderTitle(slide.title, highlightStyle)}
        </h1>
        {slide.content && (
          <p
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: 36,
              fontWeight: 400,
              lineHeight: 1.6,
              color: "#FFFFFE",
              maxWidth: 850,
              opacity: 0.88,
              letterSpacing: 0.2,
            }}
          >
            {slide.content}
          </p>
        )}
      </div>

      {/* Decorative rings */}
      <div
        style={{
          position: "absolute",
          width: 250,
          height: 250,
          bottom: 100,
          right: 80,
          border: "3px solid #72F2EB",
          borderRadius: "50%",
          opacity: 0.35,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 150,
          height: 150,
          top: 180,
          left: 60,
          border: "3px solid #7F5AF0",
          borderRadius: "50%",
          opacity: 0.35,
        }}
      />

      {/* Dots */}
      <div
        style={{
          position: "absolute",
          top: 280,
          right: 130,
          width: 12,
          height: 12,
          background: "#2CB67D",
          borderRadius: "50%",
          opacity: 0.7,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 220,
          left: 130,
          width: 10,
          height: 10,
          background: "#7F5AF0",
          borderRadius: "50%",
          opacity: 0.7,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 420,
          left: 180,
          width: 8,
          height: 8,
          background: "#72F2EB",
          borderRadius: "50%",
          opacity: 0.7,
        }}
      />

      {/* Line accent (bottom left) */}
      <div
        style={{
          position: "absolute",
          bottom: 90,
          left: 90,
          width: 200,
          height: 2,
          background: "linear-gradient(90deg, #2CB67D, transparent)",
          zIndex: 10,
        }}
      />
    </div>
  );
}
