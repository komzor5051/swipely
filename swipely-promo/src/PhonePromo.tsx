import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  AbsoluteFill,
  Sequence,
  Easing,
} from "remotion";
import { loadFont as loadOutfit } from "@remotion/google-fonts/Outfit";
import { loadFont as loadSpaceMono } from "@remotion/google-fonts/SpaceMono";

const { fontFamily: bodyFont } = loadOutfit();
const { fontFamily: monoFont } = loadSpaceMono();

// ── Brand tokens ──────────────────────────────────────────────────
const INK         = "#0D0D14";
const LIME        = "#D4F542";
const WHITE       = "#FFFFFF";
const WHITE_DIM   = "rgba(255,255,255,0.5)";
const WHITE_FAINT = "rgba(255,255,255,0.08)";
const PHONE_BG    = "#141414";
const PHONE_BORDER = "#2A2A2A";

// ── Scene frame boundaries (30fps) ───────────────────────────────
// Scene 1: text intro     fr   0 –  120  (0–4s)
// Scene 2: phone in       fr 120 –  240  (4–8s)
// Seg  A:  demo input     fr 240 –  630  (8–21s)
// Seg  B:  demo templates fr 630 – 1020  (21–34s)
// Seg  C:  demo generating fr 1020 – 1410 (34–47s)
// Seg  D:  demo result    fr 1410 – 1800 (47–60s)
// Outro overlay:          fr 1750 – 1800
const F = {
  INTRO_START: 0,
  PHONE_IN:    120,
  SEG_A:       240,
  SEG_B:       630,
  SEG_C:       1020,
  SEG_D:       1410,
  OUTRO:       1750,
  END:         1800,
} as const;

// ── Helper: slide-up spring ───────────────────────────────────────
function useSlideUp(startFrame: number, damping = 20, stiffness = 100) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - startFrame, fps, config: { damping, stiffness } });
  return {
    opacity: interpolate(s, [0, 0.2], [0, 1], { extrapolateRight: "clamp" }),
    y: interpolate(s, [0, 1], [60, 0]),
  };
}

// ── Scene 1: text-only intro ──────────────────────────────────────
const TextIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const lines = ["От текста", "к карусели", "за 30 секунд."];
  const line0 = useSlideUp(F.INTRO_START + 0);
  const line1 = useSlideUp(F.INTRO_START + 8);
  const line2 = useSlideUp(F.INTRO_START + 16);
  const springs = [line0, line1, line2];

  const subtitleOp = interpolate(frame, [60, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 72px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              fontFamily: bodyFont,
              fontSize: 96,
              fontWeight: 800,
              color: WHITE,
              lineHeight: 1.05,
              letterSpacing: "-3px",
              textAlign: "center",
              opacity: springs[i].opacity,
              transform: `translateY(${springs[i].y}px)`,
            }}
          >
            {line}
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 32,
          fontFamily: monoFont,
          fontSize: 28,
          fontWeight: 700,
          color: "#6B7280",
          letterSpacing: "0.04em",
          opacity: subtitleOp,
        }}
      >
        swipely.ai
      </div>
    </AbsoluteFill>
  );
};

// ── Lime decorative rect (behind phone) ───────────────────────────
const LimeRect: React.FC<{ scale: number; opacity: number }> = ({ scale, opacity }) => (
  <div
    style={{
      position: "absolute",
      width: 280,
      height: 520,
      borderRadius: 44,
      backgroundColor: LIME,
      opacity,
      transform: `scale(${scale})`,
      transformOrigin: "center center",
      top: 20,
      left: 18,
      boxShadow: "0 0 60px rgba(212,245,66,0.35)",
      zIndex: 0,
    }}
  />
);

// ── iPhone 15 Pro mockup shell ────────────────────────────────────
const PhoneMockup: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const PHONE_W = 340;
  const PHONE_H = 680;
  return (
    <div
      style={{
        position: "relative",
        width: PHONE_W,
        height: PHONE_H,
        borderRadius: 52,
        backgroundColor: PHONE_BG,
        border: `2px solid ${PHONE_BORDER}`,
        overflow: "hidden",
        boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
      }}
    >
      {/* Dynamic Island */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: "50%",
          transform: "translateX(-50%)",
          width: 126,
          height: 36,
          borderRadius: 20,
          backgroundColor: "#000000",
          zIndex: 10,
        }}
      />
      {/* Screen */}
      <div
        style={{
          position: "absolute",
          top: 12, left: 12, right: 12, bottom: 12,
          borderRadius: 42,
          overflow: "hidden",
          backgroundColor: INK,
          paddingTop: 68,
        }}
      >
        {children}
      </div>
    </div>
  );
};

// ── Phone container with spring-in animation (fr 120–1800) ───────
const PhoneContainer: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneSpring = spring({
    frame: frame - F.PHONE_IN,
    fps,
    config: { damping: 18, stiffness: 120 },
  });
  const phoneY  = interpolate(phoneSpring, [0, 1], [800, 0]);
  const phoneOp = interpolate(phoneSpring, [0, 0.15], [0, 1], { extrapolateRight: "clamp" });

  const limeSpring = spring({
    frame: frame - (F.PHONE_IN + 8),
    fps,
    config: { damping: 18, stiffness: 120 },
  });
  const limeScale = interpolate(limeSpring, [0, 1], [0.8, 1.0]);
  const limeOp   = interpolate(limeSpring, [0, 0.2], [0, 0.9], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
    >
      <div
        style={{
          position: "relative",
          opacity: phoneOp,
          transform: `translateY(${phoneY}px)`,
          marginTop: 200,
        }}
      >
        <LimeRect scale={limeScale} opacity={limeOp} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <PhoneMockup>{children}</PhoneMockup>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Segment A: Input step (fr 240–630) ───────────────────────────
const DemoInput: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeIn  = interpolate(frame, [F.SEG_A + 15, F.SEG_A + 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const fadeOut = interpolate(frame, [F.SEG_B - 20, F.SEG_B - 5],  [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  const opacity = Math.min(fadeIn, fadeOut);

  const exampleText = "5 причин начать вести Instagram карусели в 2025 году. Охваты падают, но у каруселей всё ещё органический reach...";

  return (
    <div style={{ opacity, padding: "16px 14px", display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
      {/* Mode toggle */}
      <div style={{ display: "flex", backgroundColor: WHITE_FAINT, borderRadius: 20, padding: 3, gap: 2 }}>
        {["✨ ИИ перепишет", "✏️ Мой текст"].map((label, i) => (
          <div key={i} style={{
            flex: 1, textAlign: "center", padding: "7px 4px", borderRadius: 17,
            backgroundColor: i === 0 ? LIME : "transparent",
            fontFamily: bodyFont, fontSize: 11, fontWeight: 700,
            color: i === 0 ? INK : WHITE_DIM,
          }}>
            {label}
          </div>
        ))}
      </div>

      {/* Mock textarea */}
      <div style={{
        flex: 1, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 16,
        border: `1.5px solid ${LIME}`, padding: "12px 14px",
        fontFamily: bodyFont, fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.5, overflow: "hidden",
      }}>
        {exampleText}
        <span style={{
          display: "inline-block", width: 2, height: 14, backgroundColor: LIME,
          marginLeft: 2, opacity: Math.floor(frame / 15) % 2 === 0 ? 1 : 0, verticalAlign: "middle",
        }} />
      </div>

      {/* CTA */}
      <div style={{
        backgroundColor: LIME, borderRadius: 14, padding: "13px 0", textAlign: "center",
        fontFamily: bodyFont, fontSize: 14, fontWeight: 800, color: INK,
      }}>
        Далее: платформа →
      </div>
    </div>
  );
};

// ── Segment B: Template selection (fr 630–1020) ──────────────────
const TEMPLATES = [
  { name: "Chapter",  color: "#1A1A2E" },
  { name: "Street",   color: "#0A0A0A" },
  { name: "Frame",    color: "#1C1C1E" },
  { name: "Dispatch", color: "#0D1117" },
  { name: "Swipely",  color: "#0D0D14" },
  { name: "Receipt",  color: "#F5F5DC" },
];

const DemoTemplates: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeIn  = interpolate(frame, [F.SEG_B + 15, F.SEG_B + 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const fadeOut = interpolate(frame, [F.SEG_C - 20, F.SEG_C - 5],  [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  const opacity = Math.min(fadeIn, fadeOut);

  const highlightIndex = Math.floor((frame - F.SEG_B) / 60) % TEMPLATES.length;

  return (
    <div style={{ opacity, padding: "14px 12px", display: "flex", flexDirection: "column", gap: 10, height: "100%" }}>
      <div style={{ fontFamily: bodyFont, fontSize: 13, fontWeight: 700, color: WHITE_DIM, textAlign: "center" }}>
        Выбери стиль
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, flex: 1 }}>
        {TEMPLATES.map((t, i) => (
          <div key={i} style={{
            backgroundColor: t.color, borderRadius: 12,
            border: i === highlightIndex ? `2px solid ${LIME}` : "2px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "flex-end", padding: "8px",
            boxShadow: i === highlightIndex ? "0 0 12px rgba(212,245,66,0.4)" : "none",
          }}>
            <span style={{
              fontFamily: bodyFont, fontSize: 10, fontWeight: 700,
              color: t.name === "Receipt" ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.5)",
            }}>
              {t.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Segment C: AI generating (fr 1020–1410) ──────────────────────
const DemoGenerating: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeIn  = interpolate(frame, [F.SEG_C + 15, F.SEG_C + 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const fadeOut = interpolate(frame, [F.SEG_D - 20, F.SEG_D - 5],  [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  const opacity = Math.min(fadeIn, fadeOut);

  const progress = interpolate(frame, [F.SEG_C, F.SEG_D], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic),
  });
  const slideIndex = Math.min(Math.floor(progress * 5) + 1, 5);

  return (
    <div style={{ opacity, padding: "24px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20, height: "100%" }}>
      <div style={{ fontFamily: bodyFont, fontSize: 15, fontWeight: 700, color: WHITE, textAlign: "center", marginTop: 24 }}>
        ИИ создаёт карусель
      </div>
      <div style={{ width: "100%", height: 6, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          width: `${progress * 100}%`, height: "100%", backgroundColor: LIME,
          borderRadius: 3, boxShadow: "0 0 8px rgba(212,245,66,0.6)",
        }} />
      </div>
      <div style={{ fontFamily: monoFont, fontSize: 13, color: WHITE_DIM }}>
        Слайд {slideIndex}/5...
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: "50%", backgroundColor: LIME,
            opacity: 0.3 + Math.sin((frame + i * 12) * 0.2) * 0.4,
          }} />
        ))}
      </div>
    </div>
  );
};

// ── Segment D: Result — carousel slides (fr 1410–1800) ──────────
const SLIDES_DATA = [
  { bg: "#1A1A2E", accent: "#0A84FF",  title: "5 причин вести",   titleAccent: "карусели",   content: "Охват органических каруселей в 3× выше обычных постов." },
  { bg: "#0A0A0A", accent: LIME,       title: "Алгоритм любит",   titleAccent: "карусели",   content: "Instagram активно продвигает карусели новой аудитории." },
  { bg: "#0D0D14", accent: "#F9A8D4",  title: "Swipely делает",   titleAccent: "за 30 сек",  content: "Вставь текст → выбери шаблон → получи карусель. Готово." },
];

const DemoResult: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeIn  = interpolate(frame, [F.SEG_D + 15, F.SEG_D + 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const fadeOut = interpolate(frame, [F.OUTRO - 10, F.OUTRO + 5],  [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  const opacity = Math.min(fadeIn, fadeOut);

  const swipe1 = interpolate(frame, [F.SEG_D + 90,  F.SEG_D + 120], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const swipe2 = interpolate(frame, [F.SEG_D + 190, F.SEG_D + 220], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const currentSlide = swipe1 + swipe2;
  const trackX = -currentSlide * 316;

  return (
    <div style={{ opacity, height: "100%", position: "relative", overflow: "hidden" }}>
      <div style={{ display: "flex", height: "100%", transform: `translateX(${trackX}px)` }}>
        {SLIDES_DATA.map((slide, i) => (
          <div key={i} style={{
            minWidth: 316, height: "100%",
            backgroundColor: slide.bg,
            padding: "20px 16px",
            display: "flex", flexDirection: "column", justifyContent: "center", gap: 12,
          }}>
            <div style={{ width: 32, height: 4, borderRadius: 2, backgroundColor: slide.accent }} />
            <div style={{ fontFamily: bodyFont, fontSize: 18, fontWeight: 800, color: WHITE, lineHeight: 1.2 }}>
              {slide.title} <span style={{ color: slide.accent }}>{slide.titleAccent}</span>
            </div>
            <div style={{ fontFamily: bodyFont, fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
              {slide.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Scene headlines above phone ───────────────────────────────────
const HEADLINES = [
  { text: "Вставь текст или тему",   from: F.SEG_A, to: F.SEG_B  },
  { text: "Выбери стиль",            from: F.SEG_B, to: F.SEG_C  },
  { text: "Генерирую карусель...",   from: F.SEG_C, to: F.SEG_D  },
  { text: "Готово за 30 секунд",     from: F.SEG_D, to: F.OUTRO  },
];

const SceneHeadline: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {HEADLINES.map((h, i) => {
        const fadeIn  = interpolate(frame, [h.from, h.from + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
        const fadeOut = interpolate(frame, [h.to - 15, h.to],     [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
        const opacity = Math.min(fadeIn, fadeOut);
        const slideY  = interpolate(frame, [h.from, h.from + 20], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

        return (
          <div key={i} style={{
            position: "absolute",
            top: 230,
            left: 0, right: 0,
            textAlign: "center",
            opacity,
            transform: `translateY(${slideY}px)`,
          }}>
            <span style={{ fontFamily: bodyFont, fontSize: 44, fontWeight: 800, color: WHITE, letterSpacing: "-1px" }}>
              {h.text}
            </span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ── Outro overlay (fr 1750–1800) ──────────────────────────────────
const OutroOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [F.OUTRO, F.OUTRO + 20], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{
      backgroundColor: INK, opacity: fadeIn,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0,
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: `linear-gradient(135deg, ${LIME} 0%, #a8c422 100%)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 28, boxShadow: "0 8px 40px rgba(212,245,66,0.35)",
      }}>
        <span style={{ fontFamily: bodyFont, fontSize: 40, fontWeight: 900, color: INK }}>S</span>
      </div>
      <div style={{ fontFamily: monoFont, fontSize: 40, fontWeight: 700, color: WHITE, letterSpacing: "0.02em", marginBottom: 20 }}>
        swipely.ai
      </div>
      <div style={{ fontFamily: bodyFont, fontSize: 32, fontWeight: 700, color: WHITE_DIM, textAlign: "center" }}>
        Попробуй <span style={{ color: LIME, fontWeight: 800 }}>бесплатно</span> →
      </div>
    </AbsoluteFill>
  );
};

// ── Root export ───────────────────────────────────────────────────
export const PhonePromo: React.FC = () => {
  const frame = useCurrentFrame();

  const introOp = interpolate(frame, [105, 120], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: INK, fontFamily: bodyFont }}>

      {/* Scene 1: Text intro */}
      {frame < F.PHONE_IN && (
        <AbsoluteFill style={{ opacity: introOp }}>
          <Sequence from={F.INTRO_START} durationInFrames={F.PHONE_IN}>
            <TextIntro />
          </Sequence>
        </AbsoluteFill>
      )}

      {/* Scene 2+: Phone container */}
      {frame >= F.PHONE_IN && (
        <PhoneContainer>
          <DemoInput />
          <DemoTemplates />
          <DemoGenerating />
          <DemoResult />
        </PhoneContainer>
      )}

      {/* Headlines above phone */}
      {frame >= F.SEG_A && frame < F.OUTRO && <SceneHeadline />}

      {/* Outro */}
      {frame >= F.OUTRO && <OutroOverlay />}

    </AbsoluteFill>
  );
};
