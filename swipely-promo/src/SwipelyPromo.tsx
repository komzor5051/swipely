import React, { useMemo } from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  AbsoluteFill,
  Sequence,
  Easing,
} from "remotion";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadOutfit } from "@remotion/google-fonts/Outfit";
import { loadFont as loadSpaceMono } from "@remotion/google-fonts/SpaceMono";

// ════════════════════════════════════════════════════════════════
// BRAND TOKENS — from swipely landing page
// ════════════════════════════════════════════════════════════════

const C = {
  bg: "#FFFFFF",
  charcoal: "#1A1A2E",
  charcoalLight: "#2D2D44",
  blue: "#0A84FF",
  blueDark: "#0066CC",
  blueLight: "#3D9FFF",
  lime: "#D4F542",
  pink: "#F9A8D4",
  coral: "#FF6B6B",
  cardBg: "#FAFAFA",
  muted: "rgba(26, 26, 46, 0.6)",
  border: "rgba(26, 26, 46, 0.08)",
  tagBg: "rgba(10, 132, 255, 0.1)",
  tagBorder: "rgba(10, 132, 255, 0.2)",
};

const { fontFamily: displayFont } = loadPlayfair();
const { fontFamily: bodyFont } = loadOutfit();
const { fontFamily: monoFont } = loadSpaceMono();

const SCENES = {
  hook: { from: 0, duration: 105 },
  demo: { from: 105, duration: 270 },
  templates: { from: 375, duration: 165 },
  stats: { from: 540, duration: 150 },
  cta: { from: 690, duration: 210 },
};

// ════════════════════════════════════════════════════════════════
// LIGHT GRADIENT BACKGROUND — matches landing .gradient-bg
// ════════════════════════════════════════════════════════════════

const LightBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const bg = `
    radial-gradient(
      ellipse 80% 50% at ${20 + Math.sin(frame * 0.006) * 8}% ${40 + Math.cos(frame * 0.004) * 6}%,
      rgba(10, 132, 255, 0.08) 0%, transparent 50%
    ),
    radial-gradient(
      ellipse 60% 60% at ${80 + Math.sin(frame * 0.005) * 6}% ${20 + Math.cos(frame * 0.007) * 5}%,
      rgba(10, 132, 255, 0.05) 0%, transparent 50%
    ),
    radial-gradient(
      ellipse 50% 80% at ${60 + Math.cos(frame * 0.003) * 8}% ${80 + Math.sin(frame * 0.005) * 6}%,
      rgba(61, 159, 255, 0.06) 0%, transparent 50%
    ),
    #FFFFFF
  `;
  return <AbsoluteFill style={{ background: bg }} />;
};

// ════════════════════════════════════════════════════════════════
// BLUE FLOATING PARTICLES — subtle dots like landing
// ════════════════════════════════════════════════════════════════

const BlueParticles: React.FC = () => {
  const frame = useCurrentFrame();
  const dots = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => {
        const seed = i * 137.508;
        return {
          baseX: ((Math.sin(seed) + 1) / 2) * 100,
          baseY: ((Math.cos(seed * 0.7) + 1) / 2) * 100,
          size: 3 + (i % 3),
          speed: 0.15 + (i % 4) * 0.08,
          phase: i * 3.1,
        };
      }),
    []
  );
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {dots.map((d, i) => {
        const x = d.baseX + Math.sin((frame + d.phase) * d.speed * 0.015) * 3;
        const y =
          d.baseY + Math.cos((frame + d.phase) * d.speed * 0.012) * 2.5;
        const op = 0.2 + Math.sin((frame + d.phase) * 0.02) * 0.08;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: d.size,
              height: d.size,
              borderRadius: "50%",
              backgroundColor: C.blue,
              opacity: op,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════
// SECTION TAG — blue pill badge like landing
// ════════════════════════════════════════════════════════════════

const Tag: React.FC<{ children: React.ReactNode; opacity?: number; y?: number }> = ({
  children,
  opacity = 1,
  y = 0,
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 20px",
      background: C.tagBg,
      border: `1px solid ${C.tagBorder}`,
      borderRadius: 100,
      fontSize: 16,
      fontWeight: 600,
      color: C.blue,
      fontFamily: bodyFont,
      opacity,
      transform: `translateY(${y}px)`,
    }}
  >
    {children}
  </div>
);

// ════════════════════════════════════════════════════════════════
// GRID MULTI CARD — exact replica of landing slide style
// ════════════════════════════════════════════════════════════════

const GridCard: React.FC<{
  num: string;
  title: React.ReactNode;
  subtitle: string;
  w?: number;
  h?: number;
}> = ({ num, title, subtitle, w = 260, h = 325 }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: 24,
      background: C.cardBg,
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 25px 80px -20px rgba(0, 0, 0, 0.12)",
    }}
  >
    {/* Grid dot pattern */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "15px 15px",
      }}
    />

    {/* Lime deco lines — top right */}
    <div
      style={{
        position: "absolute",
        top: 16,
        right: 16,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {[1, 0.7, 0.5].map((op, i) => (
        <div
          key={i}
          style={{
            width: 50,
            height: 5,
            background: C.lime,
            borderRadius: 3,
            transform: "rotate(-25deg)",
            opacity: op,
          }}
        />
      ))}
    </div>

    {/* Content */}
    <div
      style={{
        position: "relative",
        zIndex: 1,
        padding: "24px 22px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: monoFont,
          fontSize: 11,
          color: "#888",
          marginBottom: 12,
        }}
      >
        {num}
      </div>
      <div
        style={{
          fontFamily: displayFont,
          fontSize: 22,
          fontWeight: 800,
          color: "#0A0A0A",
          lineHeight: 1.15,
          letterSpacing: "-0.3px",
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: bodyFont,
          fontSize: 13,
          color: "#888",
          lineHeight: 1.5,
        }}
      >
        {subtitle}
      </div>
    </div>

    {/* Footer: avatar + CTA */}
    <div
      style={{
        position: "absolute",
        bottom: 14,
        left: 20,
        right: 20,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.pink}, ${C.lime})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 9,
          fontWeight: 800,
          color: "#0A0A0A",
        }}
      >
        S
      </div>
      <div
        style={{
          fontFamily: bodyFont,
          fontSize: 9,
          color: "#aaa",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        SWIPE →
      </div>
    </div>
  </div>
);

// Landing-style highlight
const Hl: React.FC<{ children: React.ReactNode; color?: string }> = ({
  children,
  color = C.lime,
}) => (
  <span style={{ position: "relative", display: "inline" }}>
    <span
      style={{
        background: color,
        padding: "1px 7px",
        position: "relative",
      }}
    >
      {children}
      {color === C.lime && (
        <span
          style={{
            position: "absolute",
            bottom: -2,
            left: "10%",
            width: "80%",
            height: 2,
            background: "#60A5FA",
            borderRadius: 1,
          }}
        />
      )}
    </span>
  </span>
);

// ════════════════════════════════════════════════════════════════
// SCENE 1: HOOK — bold headline on light bg
// ════════════════════════════════════════════════════════════════

const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeSpring = spring({ frame: frame - 8, fps, config: { damping: 12 } });
  const badgeOp = interpolate(badgeSpring, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });
  const badgeY = interpolate(badgeSpring, [0, 1], [25, 0]);

  const titleSpring = spring({ frame: frame - 16, fps, config: { damping: 12, stiffness: 80 } });
  const titleOp = interpolate(titleSpring, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(titleSpring, [0, 1], [40, 0]);

  const subSpring = spring({ frame: frame - 28, fps, config: { damping: 12, stiffness: 80 } });
  const subOp = interpolate(subSpring, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });
  const subY = interpolate(subSpring, [0, 1], [30, 0]);

  const fadeOut = interpolate(frame, [85, 105], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", opacity: fadeOut }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ opacity: badgeOp, transform: `translateY(${badgeY}px)`, marginBottom: 24 }}>
          <Tag>AI-генератор каруселей</Tag>
        </div>

        <div
          style={{
            fontFamily: displayFont,
            fontSize: 96,
            fontWeight: 800,
            color: C.charcoal,
            lineHeight: 1.08,
            letterSpacing: "-2px",
            opacity: titleOp,
            transform: `translateY(${titleY}px)`,
            maxWidth: 1100,
          }}
        >
          От текста к{" "}
          <span
            style={{
              background: `linear-gradient(135deg, ${C.blue}, ${C.blueLight})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontStyle: "italic",
            }}
          >
            готовой карусели
          </span>
          <br />
          за 30 секунд
        </div>

        <div
          style={{
            fontFamily: bodyFont,
            fontSize: 24,
            fontWeight: 400,
            color: C.muted,
            marginTop: 20,
            opacity: subOp,
            transform: `translateY(${subY}px)`,
          }}
        >
          Отправь текст — получи дизайнерские слайды для Instagram
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════
// SCENE 2: DEMO — chat + cards fan (grid_multi style)
// ════════════════════════════════════════════════════════════════

const CARDS = [
  { num: "01 / 05", title: <><Hl>5 способов</Hl> привлечь клиентов</>, sub: "Проверенные стратегии для роста вашего бизнеса" },
  { num: "02 / 05", title: <>Создай <Hl color={C.pink}>контент</Hl>, который цепляет</>, sub: "AI сделает тексты за вас" },
  { num: "03 / 05", title: <>Экономьте до <Hl>5 часов</Hl> в неделю</>, sub: "Автоматизация вместо рутины" },
];

const FAN = [
  { x: -300, y: 20, rotate: -12 },
  { x: 0, y: -20, rotate: 0 },
  { x: 300, y: 20, rotate: 12 },
];

const DemoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Chat bubble
  const chatSpring = spring({ frame, fps, config: { damping: 12 } });
  const chatOp = interpolate(chatSpring, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });
  const chatY = interpolate(chatSpring, [0, 1], [40, 0]);

  // Typing
  const text = "Напиши про 5 способов привлечь клиентов";
  const chars = interpolate(frame, [8, 8 + text.length * 1.5], [0, text.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const displayText = text.slice(0, Math.floor(chars));
  const cursor = Math.floor(frame * 0.12) % 2 === 0 && frame < 75;

  // Bot response
  const botOp = interpolate(frame, [70, 82], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const botY = interpolate(frame, [70, 82], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  // Chat fade
  const chatFade = interpolate(frame, [90, 110], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Cards
  const sceneFade = interpolate(frame, [250, 270], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", opacity: sceneFade }}>

      {/* Chat mockup */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) translateY(${chatY}px)`,
          opacity: chatOp * chatFade,
          width: 560,
        }}
      >
        {/* Demo container (like landing) */}
        <div
          style={{
            background: "#FFFFFF",
            border: `1px solid ${C.border}`,
            borderRadius: 28,
            padding: "28px 32px",
            boxShadow: "0 8px 40px rgba(0, 0, 0, 0.05)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Top blue line */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: `linear-gradient(90deg, transparent, rgba(10, 132, 255, 0.5), transparent)`,
            }}
          />

          {/* User message */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <div
              style={{
                maxWidth: "75%",
                padding: "14px 20px",
                borderRadius: 18,
                background: "rgba(26, 26, 46, 0.05)",
                border: `1px solid rgba(26, 26, 46, 0.1)`,
                fontFamily: bodyFont,
                fontSize: 17,
                color: C.charcoal,
                lineHeight: 1.5,
              }}
            >
              {displayText}
              {cursor && <span style={{ color: C.blue }}>|</span>}
            </div>
          </div>

          {/* Bot response */}
          <div style={{ display: "flex", gap: 12, opacity: botOp, transform: `translateY(${botY}px)` }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: `linear-gradient(135deg, ${C.blue}, ${C.blueDark})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: 16,
                color: "white",
                fontWeight: 700,
                fontFamily: bodyFont,
              }}
            >
              S
            </div>
            <div
              style={{
                padding: "14px 20px",
                borderRadius: 18,
                background: "rgba(10, 132, 255, 0.08)",
                fontFamily: bodyFont,
                fontSize: 16,
                color: C.charcoal,
                lineHeight: 1.5,
              }}
            >
              Карусель готова! 5 слайдов в стиле Grid Multi + подпись к посту
            </div>
          </div>
        </div>
      </div>

      {/* Cards fan */}
      {frame >= 105 &&
        CARDS.map((card, i) => {
          const delay = 110 + i * 12;
          const s = spring({ frame: frame - delay, fps, config: { damping: 13, stiffness: 85 } });
          const pos = FAN[i];
          const x = interpolate(s, [0, 1], [0, pos.x]);
          const y = interpolate(s, [0, 1], [60, pos.y]);
          const rot = interpolate(s, [0, 1], [0, pos.rotate]);
          const scale = interpolate(s, [0, 1], [0.7, 1]);
          const op = interpolate(s, [0, 0.2], [0, 1], { extrapolateRight: "clamp" });
          const settled = frame - delay - 30;
          const float = settled > 0 ? Math.sin(settled * 0.03 + i * 1.5) * 4 : 0;

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: `translate(-50%, -50%) translate(${x}px, ${y + float}px) rotate(${rot}deg) scale(${scale})`,
                opacity: op,
                zIndex: i === 1 ? 2 : 1,
              }}
            >
              <GridCard num={card.num} title={card.title} subtitle={card.sub} />
            </div>
          );
        })}

      {/* Label */}
      {frame >= 155 && (
        <div
          style={{
            position: "absolute",
            bottom: 130,
            left: "50%",
            transform: "translateX(-50%)",
            opacity: interpolate(frame, [155, 170], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        >
          <Tag>
            <span style={{ fontSize: 14 }}>&#10003;</span>
            <span>5 слайдов + подпись к посту</span>
          </Tag>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════
// SCENE 3: TEMPLATES — style showcase
// ════════════════════════════════════════════════════════════════

const TEMPLATES = [
  { name: "Grid Multi", color: C.cardBg, accent: C.lime, dark: false },
  { name: "Aurora", color: "#1A1A2E", accent: "#818CF8", dark: true },
  { name: "Terminal", color: "#0F172A", accent: "#4ADE80", dark: true },
  { name: "Editorial", color: "#FFFFFF", accent: C.charcoal, dark: false },
  { name: "Luxe", color: "#1C1917", accent: "#FDE68A", dark: true },
  { name: "Notebook", color: "#FFFBEB", accent: "#92400E", dark: false },
  { name: "Swipely", color: C.blue, accent: C.lime, dark: true },
  { name: "Backspace", color: "#0F172A", accent: "#F97316", dark: true },
];

const TemplatesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame: frame - 5, fps, config: { damping: 12 } });
  const titleOp = interpolate(titleSpring, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(titleSpring, [0, 1], [30, 0]);

  const fadeIn = interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [145, 165], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: fadeIn * fadeOut }}>

      <div style={{ opacity: titleOp, transform: `translateY(${titleY}px)`, marginBottom: 16 }}>
        <Tag>Шаблоны</Tag>
      </div>

      <div
        style={{
          fontFamily: displayFont,
          fontSize: 64,
          fontWeight: 800,
          color: C.charcoal,
          letterSpacing: "-1.5px",
          marginBottom: 44,
          opacity: titleOp,
          transform: `translateY(${titleY}px)`,
        }}
      >
        16 дизайн-стилей
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center", maxWidth: 960 }}>
        {TEMPLATES.map((t, i) => {
          const delay = 20 + i * 6;
          const s = spring({ frame: frame - delay, fps, config: { damping: 11 } });
          const scale = interpolate(s, [0, 1], [0.5, 1]);
          const op = interpolate(s, [0, 0.25], [0, 1], { extrapolateRight: "clamp" });
          const y = interpolate(s, [0, 1], [25, 0]);

          return (
            <div
              key={t.name}
              style={{
                width: 215,
                height: 120,
                borderRadius: 18,
                background: t.color,
                border: t.dark ? "none" : `1px solid ${C.border}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "flex-end",
                padding: "14px 18px",
                boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
                transform: `translateY(${y}px) scale(${scale})`,
                opacity: op,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  right: 12,
                  width: 20,
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: t.accent,
                }}
              />
              <div
                style={{
                  fontFamily: displayFont,
                  fontSize: 15,
                  fontWeight: 700,
                  color: t.dark ? "#FFFFFF" : C.charcoal,
                }}
              >
                {t.name}
              </div>
              <div
                style={{
                  fontFamily: monoFont,
                  fontSize: 9,
                  color: t.dark ? "rgba(255,255,255,0.4)" : "rgba(26,26,46,0.35)",
                  marginTop: 2,
                }}
              >
                template
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════
// SCENE 4: STATS — landing-style numbers
// ════════════════════════════════════════════════════════════════

const STATS = [
  { target: 30, suffix: "с", label: "генерация" },
  { target: 16, suffix: "", label: "шаблонов" },
  { target: 0, suffix: "₽", label: "старт" },
];

const StatsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [130, 150], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", opacity: fadeIn * fadeOut }}>
      <div style={{ display: "flex", gap: 80 }}>
        {STATS.map((stat, i) => {
          const delay = 8 + i * 20;
          const s = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 80 } });
          const scale = interpolate(s, [0, 1], [0.5, 1]);
          const op = interpolate(s, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });
          const y = interpolate(s, [0, 1], [30, 0]);

          const counter = interpolate(frame, [delay + 5, delay + 35], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });
          const value = Math.round(stat.target * counter);

          return (
            <div
              key={stat.label}
              style={{
                textAlign: "center",
                transform: `translateY(${y}px) scale(${scale})`,
                opacity: op,
                padding: "36px 48px",
                background: "#FFFFFF",
                borderRadius: 24,
                border: `1px solid ${C.border}`,
                boxShadow: "0 8px 40px rgba(0, 0, 0, 0.05)",
                minWidth: 200,
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: monoFont,
                    fontSize: 72,
                    fontWeight: 700,
                    color: C.blue,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {value}
                </span>
                <span
                  style={{
                    fontFamily: bodyFont,
                    fontSize: 28,
                    fontWeight: 500,
                    color: C.blue,
                    opacity: 0.7,
                  }}
                >
                  {stat.suffix}
                </span>
              </div>
              <div
                style={{
                  fontFamily: bodyFont,
                  fontSize: 16,
                  fontWeight: 500,
                  color: C.muted,
                  marginTop: 8,
                }}
              >
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════
// SCENE 5: CTA — clean landing-style
// ════════════════════════════════════════════════════════════════

const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoSpring = spring({ frame: frame - 10, fps, config: { damping: 10 } });
  const logoScale = interpolate(logoSpring, [0, 1], [0.3, 1]);
  const logoOp = interpolate(logoSpring, [0, 0.2], [0, 1], { extrapolateRight: "clamp" });

  const titleOp = interpolate(frame, [30, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [30, 45], [15, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  const ctaOp = interpolate(frame, [55, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ctaY = interpolate(frame, [55, 70], [12, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  const btnsOp = interpolate(frame, [80, 95], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Subtle button glow pulse
  const glowPulse = 0.35 + Math.sin(frame * 0.06) * 0.1;

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        {/* Logo */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: `linear-gradient(135deg, ${C.blue}, ${C.blueDark})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            transform: `scale(${logoScale})`,
            opacity: logoOp,
            boxShadow: `0 8px 32px rgba(10, 132, 255, 0.3)`,
          }}
        >
          <span style={{ fontFamily: bodyFont, fontSize: 42, fontWeight: 900, color: "white" }}>S</span>
        </div>

        {/* Title */}
        <div
          style={{
            fontFamily: displayFont,
            fontSize: 64,
            fontWeight: 800,
            color: C.charcoal,
            letterSpacing: "-1.5px",
            lineHeight: 1.1,
            opacity: titleOp,
            transform: `translateY(${titleY}px)`,
          }}
        >
          Готов создать первую{" "}
          <span
            style={{
              background: `linear-gradient(135deg, ${C.blue}, ${C.blueLight})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontStyle: "italic",
            }}
          >
            карусель
          </span>
          ?
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontFamily: bodyFont,
            fontSize: 22,
            color: C.muted,
            marginTop: 16,
            opacity: ctaOp,
            transform: `translateY(${ctaY}px)`,
          }}
        >
          Бесплатный старт. 3 карусели каждый месяц. Без привязки карты.
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 40, opacity: btnsOp }}>
          <div
            style={{
              background: `linear-gradient(135deg, ${C.blue}, ${C.blueDark})`,
              color: "white",
              borderRadius: 100,
              padding: "16px 36px",
              fontFamily: bodyFont,
              fontSize: 18,
              fontWeight: 600,
              boxShadow: `0 4px 24px rgba(10, 132, 255, ${glowPulse})`,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            Начать бесплатно
            <span style={{ fontSize: 16 }}>→</span>
          </div>

          <div
            style={{
              background: "rgba(26, 26, 46, 0.05)",
              color: C.charcoal,
              border: "1px solid rgba(26, 26, 46, 0.15)",
              borderRadius: 100,
              padding: "16px 36px",
              fontFamily: bodyFont,
              fontSize: 18,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 16 }}>✈</span>
            Telegram-бот
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            fontFamily: monoFont,
            fontSize: 15,
            color: C.blue,
            marginTop: 28,
            opacity: btnsOp,
          }}
        >
          swipely.ai
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════
// MAIN COMPOSITION
// ════════════════════════════════════════════════════════════════

export const SwipelyPromo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <LightBackground />
      <BlueParticles />

      <Sequence from={SCENES.hook.from} durationInFrames={SCENES.hook.duration}>
        <HookScene />
      </Sequence>

      <Sequence from={SCENES.demo.from} durationInFrames={SCENES.demo.duration}>
        <DemoScene />
      </Sequence>

      <Sequence from={SCENES.templates.from} durationInFrames={SCENES.templates.duration}>
        <TemplatesScene />
      </Sequence>

      <Sequence from={SCENES.stats.from} durationInFrames={SCENES.stats.duration}>
        <StatsScene />
      </Sequence>

      <Sequence from={SCENES.cta.from} durationInFrames={SCENES.cta.duration}>
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};
