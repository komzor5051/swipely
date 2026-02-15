"use client";

import React from "react";
import type { SlideProps } from "../types";
import { renderTitle, getSlideDimensions } from "../utils";

export default function AppListSlide({
  slide,
  slideNumber,
  totalSlides,
  format,
  username,
}: SlideProps) {
  const { width, height } = getSlideDimensions(format);

  const highlightStyle: React.CSSProperties = {
    display: "inline",
    background: "#6366F1",
    color: "#FFFFFF",
    padding: "6px 16px",
    margin: "0 -6px",
    boxDecorationBreak: "clone",
    WebkitBoxDecorationBreak: "clone",
  };

  const isHook = slide.type === "hook";

  // Split content into list items by newlines or sentence boundaries
  const listItems = slide.content
    .split(/\n|(?:^|\. )(?=[A-ZА-ЯЁ])/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return (
    <div
      style={{
        width,
        height,
        background: "#E8E6F2",
        fontFamily: "'Inter', -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding: "50px 60px",
      }}
    >
      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* Rounded corners overlay effect */}
      <div
        style={{
          position: "absolute",
          top: 15,
          left: 15,
          right: 15,
          bottom: 15,
          borderRadius: 50,
          boxShadow: "inset 0 0 0 15px #E8E6F2",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 50,
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 26,
            fontWeight: 700,
            color: "#0A0A0A",
          }}
        >
          {username || "Swipely"}
        </div>
        {/* Hamburger menu icon */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div
            style={{
              width: 32,
              height: 3,
              background: "#0A0A0A",
              borderRadius: 2,
            }}
          />
          <div
            style={{
              width: 24,
              height: 3,
              background: "#0A0A0A",
              borderRadius: 2,
            }}
          />
        </div>
      </div>

      {/* Main title */}
      <h1
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: isHook ? 110 : 100,
          fontWeight: 900,
          lineHeight: 0.95,
          color: "#0A0A0A",
          letterSpacing: -5,
          marginBottom: 20,
        }}
      >
        {renderTitle(slide.title, highlightStyle)}
      </h1>

      {/* Arrow indicator */}
      <div
        style={{
          fontSize: 36,
          color: "#0A0A0A",
          marginBottom: 30,
          opacity: 0.6,
        }}
      >
        {"\u2199"}
      </div>

      {/* Search bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "#0A0A0A",
          borderRadius: 50,
          padding: "8px 10px 8px 30px",
          marginBottom: 50,
          maxWidth: 550,
        }}
      >
        <span
          style={{
            flex: 1,
            fontFamily: "'Inter', sans-serif",
            fontSize: 20,
            fontWeight: 500,
            color: "#FFFFFF",
            opacity: 0.8,
          }}
        >
          What can we do for you?
        </span>
        <div
          style={{
            width: 52,
            height: 52,
            background: "#6366F1",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={2.5}
          >
            <circle cx={11} cy={11} r={8} />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
      </div>

      {/* List container */}
      <div style={{ flex: 1 }}>
        {listItems.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "28px 0",
              borderBottom:
                i < listItems.length - 1
                  ? "1px solid rgba(0,0,0,0.08)"
                  : "none",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
              }}
            >
              {/* Blue dot */}
              <div
                style={{
                  width: 16,
                  height: 16,
                  background: "#6366F1",
                  borderRadius: "50%",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: listItems.length > 5 ? 26 : 30,
                  fontWeight: 600,
                  color: "#0A0A0A",
                }}
              >
                {item}
              </span>
            </div>
            <span
              style={{
                fontSize: 28,
                color: "#0A0A0A",
                opacity: 0.4,
                flexShrink: 0,
                marginLeft: 12,
              }}
            >
              {"\u203A"}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 30,
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 16,
            fontWeight: 500,
            color: "#888888",
          }}
        >
          {slideNumber}/{totalSlides}
        </div>
        {/* Corner icons */}
        <div style={{ display: "flex", gap: 12 }}>
          <div
            style={{
              width: 50,
              height: 50,
              background: "#FFFFFF",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
            }}
          >
            <svg
              width={22}
              height={22}
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
              width: 50,
              height: 50,
              background: "#FFFFFF",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
            }}
          >
            <svg
              width={22}
              height={22}
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
    </div>
  );
}
