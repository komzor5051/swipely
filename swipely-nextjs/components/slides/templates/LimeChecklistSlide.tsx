"use client";

import React from "react";
import type { SlideProps } from "../types";
import { renderTitle, getSlideDimensions } from "../utils";

export default function LimeChecklistSlide({
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
    color: "#0A0A0A",
    padding: "4px 12px",
    margin: "0 -4px",
    boxDecorationBreak: "clone",
    WebkitBoxDecorationBreak: "clone",
  };

  const isHook = slide.type === "hook";

  // Split content into checklist items by newlines or bullet separators
  const contentItems = slide.content
    .split(/\n|(?:^|\. )(?=[A-ZА-ЯЁ])/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return (
    <div
      style={{
        width,
        height,
        background: "#D4F542",
        fontFamily: "'Inter', -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding: 60,
      }}
    >
      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* Username tag */}
      <div
        style={{
          position: "absolute",
          top: 50,
          right: 60,
          fontFamily: "'Inter', sans-serif",
          fontSize: 18,
          fontWeight: 600,
          color: "#0A0A0A",
          opacity: 0.7,
        }}
      >
        @{username || "swipely"}
      </div>

      {/* Title badge */}
      <div
        style={{
          background: "#0A0A0A",
          color: "#FFFFFF",
          padding: "20px 40px",
          borderRadius: 16,
          fontFamily: "'Inter', sans-serif",
          fontSize: isHook ? 48 : 42,
          fontWeight: 800,
          textAlign: "center",
          display: "inline-block",
          margin: "80px auto 20px",
          maxWidth: "90%",
          lineHeight: 1.2,
        }}
      >
        {renderTitle(slide.title, highlightStyle)}
      </div>

      {/* Arrow connector */}
      <div
        style={{
          width: 3,
          height: 40,
          background: "#0A0A0A",
          margin: "0 auto",
          position: "relative",
        }}
      >
        {/* Arrow tip */}
        <div
          style={{
            position: "absolute",
            bottom: -12,
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderTop: "14px solid #0A0A0A",
          }}
        />
      </div>

      {/* Notepad with checklist */}
      <div
        style={{
          background: "#F5F0E6",
          borderRadius: 20,
          padding: "50px 45px",
          margin: "30px 40px",
          flex: 1,
          maxHeight: 850,
          position: "relative",
          boxShadow:
            "8px 8px 0 rgba(0,0,0,0.15), 0 10px 40px rgba(0,0,0,0.1)",
          border: "3px solid rgba(0,0,0,0.1)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Lined paper effect */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "repeating-linear-gradient(transparent, transparent 54px, #E0DBD0 54px, #E0DBD0 56px)",
            pointerEvents: "none",
          }}
        />

        {/* Checklist items */}
        <ul
          style={{
            listStyle: "none",
            position: "relative",
            zIndex: 1,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            margin: 0,
            padding: 0,
          }}
        >
          {contentItems.map((item, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 24,
                padding: 0,
                fontFamily: "'Inter', sans-serif",
                fontSize: contentItems.length > 4 ? 36 : 44,
                fontWeight: 700,
                color: "#0A0A0A",
                lineHeight: 1.35,
                flex: 1,
              }}
            >
              {/* Checkbox */}
              <div
                style={{
                  width: 44,
                  height: 44,
                  border: "3px solid #0A0A0A",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 6,
                }}
              >
                <svg
                  width={28}
                  height={28}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0A0A0A"
                  strokeWidth={3}
                >
                  <path d="M5 12l5 5L20 7" />
                </svg>
              </div>
              <span style={{ flex: 1 }}>{item}</span>
            </li>
          ))}
        </ul>
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
          alignItems: "center",
        }}
      >
        {/* CTA Button */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "#FFFFFF",
            color: "#0A0A0A",
            padding: "14px 24px",
            borderRadius: 12,
            fontFamily: "'Inter', sans-serif",
            fontSize: 16,
            fontWeight: 600,
            boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          }}
        >
          <span style={{ fontSize: 14 }}>{"\u2197"}</span>
          Swipe for more
        </div>

        {/* Slide counter */}
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 16,
            fontWeight: 600,
            color: "#0A0A0A",
            opacity: 0.6,
          }}
        >
          {slideNumber}/{totalSlides}
        </div>
      </div>

      {/* Corner icons */}
      <div
        style={{
          position: "absolute",
          bottom: 45,
          right: 60,
          display: "flex",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 45,
            height: 45,
            background: "#FFFFFF",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          }}
        >
          <svg
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0A0A0A"
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
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          }}
        >
          <svg
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0A0A0A"
            strokeWidth={2}
          >
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
      </div>
    </div>
  );
}
