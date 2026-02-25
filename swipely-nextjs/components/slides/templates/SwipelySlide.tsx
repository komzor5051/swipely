"use client";

import React from "react";
import type { SlideProps } from "../types";
import { renderTitle, getSlideDimensions } from "../utils";

export default function SwipelySlide({
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
    color: "#0066CC",
    padding: "6px 20px",
    margin: "0 -8px",
    boxDecorationBreak: "clone",
    WebkitBoxDecorationBreak: "clone",
  };

  const isHook = slide.type === "hook";

  return (
    <div
      style={{
        width,
        height,
        background: "linear-gradient(165deg, #0A84FF 0%, #0066CC 100%)",
        fontFamily: "'Outfit', -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');`}</style>

      {/* Grid pattern */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
          zIndex: 1,
        }}
      />

      {/* Top glow */}
      <div
        style={{
          position: "absolute",
          top: -200,
          right: -100,
          width: 600,
          height: 600,
          background:
            "radial-gradient(ellipse, rgba(61, 159, 255, 0.4) 0%, transparent 70%)",
          borderRadius: "50%",
          zIndex: 0,
        }}
      />

      {/* Bottom glow */}
      <div
        style={{
          position: "absolute",
          bottom: -150,
          left: -100,
          width: 500,
          height: 500,
          background:
            "radial-gradient(ellipse, rgba(0, 102, 204, 0.5) 0%, transparent 70%)",
          borderRadius: "50%",
          zIndex: 0,
        }}
      />

      {/* Lime accent glow */}
      <div
        style={{
          position: "absolute",
          bottom: 300,
          right: -50,
          width: 300,
          height: 300,
          background:
            "radial-gradient(ellipse, rgba(212, 245, 66, 0.15) 0%, transparent 70%)",
          borderRadius: "50%",
          zIndex: 0,
        }}
      />

      {/* Decorative diagonal lines */}
      <div
        style={{
          position: "absolute",
          top: 60,
          right: 60,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          zIndex: 10,
        }}
      >
        {[120, 95, 70, 50].map((w, i) => (
          <div
            key={i}
            style={{
              width: w,
              height: 10,
              background: "#D4F542",
              borderRadius: 5,
              transform: "rotate(-25deg)",
              transformOrigin: "right center",
              opacity: i === 0 ? 1 : i === 1 ? 0.7 : i === 2 ? 0.5 : 0.3,
            }}
          />
        ))}
      </div>

      {/* Dot pattern */}
      <div
        style={{
          position: "absolute",
          bottom: 200,
          left: 60,
          width: 150,
          height: 150,
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.25) 3px, transparent 3px)",
          backgroundSize: "24px 24px",
          zIndex: 2,
        }}
      />

      {/* Circle decorations */}
      <div
        style={{
          position: "absolute",
          width: 200,
          height: 200,
          top: 250,
          left: -80,
          border: "2px solid rgba(255,255,255,0.15)",
          borderRadius: "50%",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 120,
          height: 120,
          bottom: 400,
          right: 80,
          border: "2px solid rgba(255,255,255,0.15)",
          borderRadius: "50%",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 80,
          height: 80,
          top: 180,
          right: 250,
          border: "2px solid rgba(212, 245, 66, 0.3)",
          borderRadius: "50%",
        }}
      />

      {/* Floating shapes */}
      <div
        style={{
          position: "absolute",
          width: 20,
          height: 20,
          background: "#D4F542",
          borderRadius: "50%",
          top: 400,
          right: 120,
          opacity: 0.6,
          zIndex: 2,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 14,
          height: 14,
          background: "#F9A8D4",
          borderRadius: "50%",
          top: 300,
          left: 200,
          opacity: 0.5,
          zIndex: 2,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 24,
          height: 24,
          background: "rgba(255,255,255,0.3)",
          transform: "rotate(45deg)",
          bottom: 350,
          right: 200,
          zIndex: 2,
        }}
      />

      {/* Wave decoration */}
      <div
        style={{
          position: "absolute",
          bottom: 150,
          right: 70,
          zIndex: 2,
        }}
      >
        <svg width={180} height={60} viewBox="0 0 180 60" fill="none">
          <path
            d="M0 30 Q30 0 60 30 T120 30 T180 30"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M0 40 Q30 10 60 40 T120 40 T180 40"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </div>

      {/* Logo */}
      <div
        style={{
          position: "absolute",
          top: 70,
          left: 70,
          display: "flex",
          alignItems: "center",
          gap: 16,
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            background: "#FFFFFF",
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
          }}
        >
          <svg width={36} height={36} viewBox="0 0 32 32" fill="none">
            <path
              d="M8 10h16M8 16h16M8 22h10"
              stroke="#0A84FF"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <span
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#FFFFFF",
            letterSpacing: -0.5,
          }}
        >
          {username || "Swipely"}
        </span>
      </div>

      {/* Main content */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          padding: "200px 70px 200px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          zIndex: 5,
        }}
      >
        <h1
          style={{
            fontSize: isHook ? 92 : 82,
            fontWeight: 800,
            lineHeight: 1.05,
            color: "#FFFFFF",
            letterSpacing: -2,
            maxWidth: 900,
            margin: 0,
          }}
        >
          {renderTitle(slide.title, highlightStyle)}
        </h1>
        {slide.content && (
          <p
            style={{
              fontSize: 34,
              fontWeight: 400,
              lineHeight: 1.6,
              color: "rgba(255, 255, 255, 0.8)",
              marginTop: 45,
              maxWidth: 800,
            }}
          >
            {slide.content}
          </p>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: 70,
          left: 70,
          right: 70,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 20,
            fontWeight: 700,
            color: "rgba(255, 255, 255, 0.6)",
            letterSpacing: 3,
          }}
        >
          {slideNumber} / {totalSlides}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 28px",
            background: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: 100,
            fontSize: 18,
            fontWeight: 600,
            color: "#FFFFFF",
          }}
        >
          <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
          </svg>
          @swipelybot
        </div>
      </div>
    </div>
  );
}
