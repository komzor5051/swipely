import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Swipely — AI-генератор каруселей";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#0D0D14",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 80px",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background accent — lime glow top right */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212,245,66,0.18) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Background accent — blue glow bottom left */}
        <div
          style={{
            position: "absolute",
            bottom: -100,
            left: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(10,132,255,0.15) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Decorative slide mockups */}
        <div
          style={{
            position: "absolute",
            right: 64,
            top: 90,
            display: "flex",
            gap: 16,
            opacity: 0.9,
          }}
        >
          {/* Slide 1 */}
          <div
            style={{
              width: 160,
              height: 200,
              borderRadius: 16,
              background: "#0A84FF",
              display: "flex",
              flexDirection: "column",
              padding: 20,
              justifyContent: "flex-end",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ width: 80, height: 8, background: "#D4F542", borderRadius: 4, marginBottom: 10, display: "flex" }} />
            <div style={{ width: 120, height: 6, background: "rgba(255,255,255,0.5)", borderRadius: 4, marginBottom: 6, display: "flex" }} />
            <div style={{ width: 100, height: 6, background: "rgba(255,255,255,0.3)", borderRadius: 4, display: "flex" }} />
          </div>

          {/* Slide 2 */}
          <div
            style={{
              width: 160,
              height: 200,
              borderRadius: 16,
              background: "#1A1A2E",
              border: "1px solid rgba(212,245,66,0.3)",
              display: "flex",
              flexDirection: "column",
              padding: 20,
              justifyContent: "flex-end",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              marginTop: 30,
            }}
          >
            <div style={{ width: 60, height: 8, background: "#D4F542", borderRadius: 4, marginBottom: 10, display: "flex" }} />
            <div style={{ width: 130, height: 6, background: "rgba(255,255,255,0.4)", borderRadius: 4, marginBottom: 6, display: "flex" }} />
            <div style={{ width: 90, height: 6, background: "rgba(255,255,255,0.2)", borderRadius: 4, display: "flex" }} />
          </div>

          {/* Slide 3 */}
          <div
            style={{
              width: 160,
              height: 200,
              borderRadius: 16,
              background: "#F5F3EE",
              display: "flex",
              flexDirection: "column",
              padding: 20,
              justifyContent: "flex-end",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ width: 100, height: 8, background: "#0D0D14", borderRadius: 4, marginBottom: 10, display: "flex" }} />
            <div style={{ width: 130, height: 6, background: "rgba(0,0,0,0.25)", borderRadius: 4, marginBottom: 6, display: "flex" }} />
            <div style={{ width: 80, height: 6, background: "rgba(0,0,0,0.15)", borderRadius: 4, display: "flex" }} />
          </div>
        </div>

        {/* Top: Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <svg viewBox="0 0 48 48" fill="none" width={38} height={38}>
            <path
              d="M24 4 C24.6 15, 27 21, 42 24 C27 27, 24.6 33, 24 44 C23.4 33, 21 27, 6 24 C21 21, 23.4 15, 24 4Z"
              fill="white"
              opacity="0.9"
            />
            <circle cx="24" cy="24" r="3.5" fill="#D4F542" />
          </svg>
          <span style={{ fontSize: 28, fontWeight: 700, color: "#ffffff", letterSpacing: -0.5 }}>
            Swipely
          </span>
        </div>

        {/* Center: Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 620 }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.05,
              letterSpacing: -2,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Карусели,</span>
            <span>которые{" "}
              <span
                style={{
                  background: "#D4F542",
                  color: "#0D0D14",
                  padding: "0 12px",
                  borderRadius: 8,
                }}
              >
                останавливают
              </span>
            </span>
            <span>скролл</span>
          </div>

          <div style={{ fontSize: 24, color: "rgba(255,255,255,0.55)", fontWeight: 400, display: "flex" }}>
            AI создаёт карусель за 10 секунд — ты просто вставляешь текст
          </div>
        </div>

        {/* Bottom: CTA + URL */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              background: "#D4F542",
              color: "#0D0D14",
              fontSize: 20,
              fontWeight: 700,
              padding: "14px 28px",
              borderRadius: 100,
              display: "flex",
            }}
          >
            Попробовать →
          </div>

          <span style={{ fontSize: 20, color: "rgba(255,255,255,0.35)", display: "flex" }}>
            swipely.ru
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
