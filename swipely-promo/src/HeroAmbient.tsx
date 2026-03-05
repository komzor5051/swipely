import React from "react";
import { useCurrentFrame, useVideoConfig, AbsoluteFill } from "remotion";
import { loadFont as loadOutfit } from "@remotion/google-fonts/Outfit";
import { loadFont as loadSpaceMono } from "@remotion/google-fonts/SpaceMono";

const { fontFamily: bodyFont } = loadOutfit();
const { fontFamily: monoFont } = loadSpaceMono();

const WHITE    = "#FFFFFF";
const BLUE     = "#0A84FF";
const BLUE_DK  = "#0066CC";
const LIME     = "#D4F542";
const PINK     = "#F9A8D4";
const CHARCOAL = "#1A1A2E";

// ── Background: white + grid dots + breathing blue gradients ──────────────────
const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const gradient = `
    radial-gradient(
      ellipse 80% 50% at ${20 + Math.sin(frame * 0.006) * 8}% ${40 + Math.cos(frame * 0.004) * 6}%,
      rgba(10,132,255,0.07) 0%, transparent 55%
    ),
    radial-gradient(
      ellipse 60% 60% at ${80 + Math.sin(frame * 0.005) * 6}% ${20 + Math.cos(frame * 0.007) * 5}%,
      rgba(10,132,255,0.04) 0%, transparent 50%
    ),
    ${WHITE}
  `;
  return (
    <AbsoluteFill style={{ background: gradient }}>
      {/* Grid dot pattern — matches site CSS */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          opacity: 0.5,
        }}
      />
    </AbsoluteFill>
  );
};

// ── Card styles — matching the Hero stack on swipely.ru ───────────────────────

const CardBlue: React.FC<{ w: number; h: number }> = ({ w, h }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: 20,
      background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DK})`,
      boxShadow: "0 20px 60px rgba(10,132,255,0.2)",
      padding: 20,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      overflow: "hidden",
    }}
  >
    <div style={{ fontFamily: monoFont, fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>
      01 / 05
    </div>
    <div style={{ fontFamily: bodyFont, fontSize: 20, fontWeight: 800, color: WHITE, lineHeight: 1.2, marginBottom: 8 }}>
      <span style={{ background: LIME, color: BLUE_DK, padding: "2px 8px" }}>5 способов</span>
      <br />привлечь клиентов
    </div>
    <div style={{ fontFamily: bodyFont, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
      Проверенные стратегии для роста
    </div>
  </div>
);

const CardDark: React.FC<{ w: number; h: number }> = ({ w, h }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: 20,
      background: CHARCOAL,
      boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      padding: 20,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div style={{ position: "absolute", top: 14, right: 14, display: "flex", flexDirection: "column", gap: 5 }}>
      {[1, 0.7, 0.4].map((op, i) => (
        <div
          key={i}
          style={{ width: 40, height: 4, background: LIME, borderRadius: 2, transform: "rotate(-25deg)", opacity: op }}
        />
      ))}
    </div>
    <div style={{ fontFamily: monoFont, fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>
      02 / 05
    </div>
    <div style={{ fontFamily: bodyFont, fontSize: 20, fontWeight: 800, color: WHITE, lineHeight: 1.2, marginBottom: 8 }}>
      Создай <span style={{ background: PINK, color: CHARCOAL, padding: "2px 7px" }}>контент</span>,<br />
      который цепляет
    </div>
    <div style={{ fontFamily: bodyFont, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
      AI сделает тексты за вас
    </div>
  </div>
);

const CardLight: React.FC<{ w: number; h: number }> = ({ w, h }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: 20,
      background: "linear-gradient(135deg, #F0F4F8, #FFFFFF)",
      border: "1px solid rgba(0,0,0,0.07)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.06)",
      padding: 20,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      overflow: "hidden",
    }}
  >
    <div style={{ fontFamily: monoFont, fontSize: 10, color: "#999", marginBottom: 10 }}>03 / 05</div>
    <div style={{ fontFamily: bodyFont, fontSize: 20, fontWeight: 800, color: CHARCOAL, lineHeight: 1.2, marginBottom: 8 }}>
      Экономьте
      <br />
      <span
        style={{
          background: `linear-gradient(135deg, ${BLUE}, #3D9FFF)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        до 5 часов
      </span>{" "}
      в неделю
    </div>
    <div style={{ fontFamily: bodyFont, fontSize: 12, color: "#888" }}>Автоматизация вместо рутины</div>
  </div>
);

const CardReceipt: React.FC<{ w: number; h: number }> = ({ w, h }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: 20,
      background: "#FAFAFA",
      border: "1px solid rgba(0,0,0,0.06)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.05)",
      padding: 20,
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
      overflow: "hidden",
    }}
  >
    <div style={{ fontFamily: monoFont, fontSize: 9, color: "#aaa", marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 }}>
      ────────────────
    </div>
    <div style={{ fontFamily: monoFont, fontSize: 14, fontWeight: 700, color: CHARCOAL, lineHeight: 1.5, marginBottom: 12 }}>
      #swipely
      <br />
      AI-карусель
      <br />
      готова ✓
    </div>
    <div style={{ fontFamily: monoFont, fontSize: 9, color: "#bbb" }}>
      ────────────────
      <br />
      5 слайдов · PNG
    </div>
  </div>
);

// ── ParallaxLayer — seamless modulo wrap ──────────────────────────────────────

type CardType = "blue" | "dark" | "light" | "receipt";

interface CardDef {
  type: CardType;
  startX: number; // 0–1 fraction of canvas width
  startY: number; // 0–1 fraction of canvas height
  scale: number;
  rotation: number; // base rotation degrees
  speedX: number;  // pixels per frame
  speedY: number;
  floatAmp: number;   // sinusoidal float amplitude px
  floatPhase: number;
}

const CARD_W = 260;
const CARD_H = 325;

const ParallaxLayer: React.FC<{
  cards: CardDef[];
  opacity: number;
  blur: number;
}> = ({ cards, opacity, blur }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ opacity, filter: blur > 0 ? `blur(${blur}px)` : undefined }}>
      {cards.map((card, i) => {
        const scaledW = CARD_W * card.scale;
        const scaledH = CARD_H * card.scale;

        // Total virtual canvas size (includes offscreen margins)
        const totalW = width + scaledW * 2;
        const totalH = height + scaledH * 2;

        const rawX = card.startX * width + frame * card.speedX;
        const rawY = card.startY * height + frame * card.speedY;

        // Seamless modulo wrap
        const x = ((rawX % totalW) + totalW) % totalW - scaledW;
        const y = ((rawY % totalH) + totalH) % totalH - scaledH;

        // Sinusoidal float
        const floatY = Math.sin(frame * 0.02 + card.floatPhase) * card.floatAmp;
        const floatRot = Math.sin(frame * 0.015 + card.floatPhase) * 2;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y + floatY,
              width: scaledW,
              height: scaledH,
              transform: `rotate(${card.rotation + floatRot}deg)`,
              transformOrigin: "center center",
            }}
          >
            <div
              style={{
                width: CARD_W,
                height: CARD_H,
                transform: `scale(${card.scale})`,
                transformOrigin: "top left",
              }}
            >
              {card.type === "blue"    && <CardBlue    w={CARD_W} h={CARD_H} />}
              {card.type === "dark"    && <CardDark    w={CARD_W} h={CARD_H} />}
              {card.type === "light"   && <CardLight   w={CARD_W} h={CARD_H} />}
              {card.type === "receipt" && <CardReceipt w={CARD_W} h={CARD_H} />}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ── Card data for 3 parallax layers ──────────────────────────────────────────

const FAR_CARDS: CardDef[] = [
  { type: "blue",    startX: 0.05, startY: 0.1,  scale: 1.3,  rotation: -8,  speedX: 0.18, speedY: 0.05, floatAmp: 6, floatPhase: 0   },
  { type: "dark",    startX: 0.5,  startY: 0.6,  scale: 1.2,  rotation: 10,  speedX: 0.15, speedY: 0.07, floatAmp: 5, floatPhase: 2.1 },
  { type: "light",   startX: 0.85, startY: 0.2,  scale: 1.25, rotation: -5,  speedX: 0.12, speedY: 0.06, floatAmp: 7, floatPhase: 4.2 },
  { type: "receipt", startX: 0.3,  startY: 0.75, scale: 1.1,  rotation: 12,  speedX: 0.20, speedY: 0.04, floatAmp: 4, floatPhase: 1.5 },
];

const MID_CARDS: CardDef[] = [
  { type: "dark",    startX: 0.15, startY: 0.4,  scale: 1.0,  rotation: -12, speedX: 0.40, speedY: 0.10, floatAmp: 8, floatPhase: 0.7 },
  { type: "blue",    startX: 0.6,  startY: 0.15, scale: 1.0,  rotation: 8,   speedX: 0.35, speedY: 0.12, floatAmp: 6, floatPhase: 3.1 },
  { type: "receipt", startX: 0.9,  startY: 0.55, scale: 0.95, rotation: -6,  speedX: 0.45, speedY: 0.08, floatAmp: 9, floatPhase: 1.8 },
  { type: "light",   startX: 0.4,  startY: 0.85, scale: 1.0,  rotation: 14,  speedX: 0.38, speedY: 0.09, floatAmp: 7, floatPhase: 5.0 },
  { type: "dark",    startX: 0.75, startY: 0.7,  scale: 0.9,  rotation: -4,  speedX: 0.42, speedY: 0.11, floatAmp: 5, floatPhase: 2.5 },
];

const NEAR_CARDS: CardDef[] = [
  { type: "light",   startX: 0.0,  startY: 0.3,  scale: 0.8,  rotation: 6,   speedX: 0.75, speedY: 0.18, floatAmp: 5, floatPhase: 0.3 },
  { type: "blue",    startX: 0.45, startY: 0.5,  scale: 0.75, rotation: -10, speedX: 0.80, speedY: 0.15, floatAmp: 6, floatPhase: 2.8 },
  { type: "receipt", startX: 0.8,  startY: 0.1,  scale: 0.7,  rotation: 5,   speedX: 0.70, speedY: 0.20, floatAmp: 4, floatPhase: 4.5 },
];

// ── Main composition ──────────────────────────────────────────────────────────

export const HeroAmbient: React.FC = () => (
  <AbsoluteFill>
    <Background />
    <ParallaxLayer cards={FAR_CARDS}  opacity={0.12} blur={6} />
    <ParallaxLayer cards={MID_CARDS}  opacity={0.30} blur={1} />
    <ParallaxLayer cards={NEAR_CARDS} opacity={0.55} blur={0} />
  </AbsoluteFill>
);
