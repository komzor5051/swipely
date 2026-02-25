"use client";

import React from "react";
import type { SlideProps } from "../types";
import { renderTitle, getSlideDimensions } from "../utils";

export default function SpeechBubbleSlide({
  slide,
  slideNumber,
  totalSlides,
  format,
  username,
}: SlideProps) {
  const { width, height } = getSlideDimensions(format);

  const isHook = slide.type === "hook";

  const highlightStyle: React.CSSProperties = {
    display: "inline",
    background: "#F26B3A",
    color: "#FFFFFF",
    padding: "4px 12px",
    margin: "0 -4px",
    boxDecorationBreak: "clone" as const,
    WebkitBoxDecorationBreak: "clone" as const,
  };

  const noiseTextureSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`;

  return (
    <div
      style={{
        width,
        height,
        background: "#F8F8F8",
        fontFamily: "'Inter', -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>

      {/* Subtle noise texture overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: noiseTextureSvg,
          opacity: 0.04,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Logo header */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 70,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg viewBox="0 0 40 40" fill="none" width={40} height={40}>
              <rect x="2" y="10" width="12" height="20" rx="2" fill="#F26B3A" />
              <rect x="18" y="10" width="12" height="20" rx="2" fill="#F26B3A" />
              <circle cx="8" cy="20" r="3" fill="white" />
              <circle cx="24" cy="20" r="3" fill="white" />
            </svg>
          </div>
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 26,
              fontWeight: 700,
              color: "#1A1A1A",
            }}
          >
            {username || "Swipely"}
          </span>
        </div>
      </div>

      {/* Main content area with bubble */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "150px 70px",
          position: "relative",
          zIndex: 5,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
          }}
        >
          {/* Orange speech bubble */}
          <div
            style={{
              width: 280,
              height: 280,
              background: "#F26B3A",
              borderRadius: "20px 20px 20px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              flexShrink: 0,
            }}
          >
            {/* Bubble tail */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: -30,
                width: 60,
                height: 60,
                background: "#F26B3A",
                borderRadius: "0 0 60px 0",
                clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
              }}
            />
            <span
              style={{
                fontFamily: "Georgia, serif",
                fontSize: 180,
                fontWeight: 700,
                color: "#FFFFFF",
                lineHeight: 0.7,
                opacity: 0.95,
              }}
            >
              ,,
            </span>
          </div>

          {/* White quote box */}
          <div
            style={{
              background: "#FFFFFF",
              padding: "45px 50px",
              borderRadius: 30,
              maxWidth: 520,
              marginLeft: -40,
              boxShadow: "0 10px 60px rgba(0,0,0,0.08)",
              position: "relative",
              zIndex: 2,
            }}
          >
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: isHook ? 42 : 36,
                fontWeight: 700,
                lineHeight: 1.35,
                color: "#1A1A1A",
                marginBottom: 20,
              }}
            >
              {renderTitle(slide.title, highlightStyle)}
            </p>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 24,
                fontWeight: 600,
                color: "#F26B3A",
              }}
            >
              {slide.content}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 70,
          display: "flex",
          alignItems: "center",
          gap: 12,
          zIndex: 10,
        }}
      >
        <div style={{ width: 28, height: 28 }}>
          <svg
            viewBox="0 0 24 24"
            width={28}
            height={28}
            stroke="#F26B3A"
            fill="none"
            strokeWidth={2}
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column" as const }}>
          <span
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: "#1A1A1A",
            }}
          >
            swipely.ai
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#F26B3A",
              textTransform: "uppercase" as const,
              letterSpacing: 1,
            }}
          >
            Create your carousel
          </span>
        </div>
      </div>

      {/* Slide counter */}
      <div
        style={{
          position: "absolute",
          bottom: 65,
          right: 200,
          fontFamily: "'Inter', sans-serif",
          fontSize: 16,
          fontWeight: 500,
          color: "#888888",
        }}
      >
        {slideNumber}/{totalSlides}
      </div>

      {/* Corner icons */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          right: 70,
          display: "flex",
          flexDirection: "column" as const,
          gap: 12,
        }}
      >
        <div
          style={{
            width: 45,
            height: 45,
            background: "#FFFFFF",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width={20}
            height={20}
            stroke="#1A1A1A"
            fill="none"
            strokeWidth={2}
          >
            <path d="M7 17L17 7M17 7H7M17 7V17" />
          </svg>
        </div>
        <div
          style={{
            width: 45,
            height: 45,
            background: "#FFFFFF",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width={20}
            height={20}
            stroke="#1A1A1A"
            fill="none"
            strokeWidth={2}
          >
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
      </div>
    </div>
  );
}
