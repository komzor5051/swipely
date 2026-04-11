"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ─── Carousel slide data ───────────────────────────────────────────
const SLIDES = [
  {
    type: "hook",
    num: "01 / 05",
    title: "5 причин, почему ваши карусели не вирятся",
    handle: "@expert",
    badge: "СОХРАНИ",
  },
  {
    type: "editorial",
    index: "01",
    tag: "Причина первая",
    title: "Первый слайд не останавливает скролл",
    body: "Без крючка первые 2 секунды — карусель теряется в ленте навсегда.",
  },
  {
    type: "stat",
    big: "73%",
    unit: "читателей уходят на первом слайде",
    caption: "Если первый слайд не зацепил — остальные уже не увидят.",
  },
  {
    type: "swiss",
    label: "Как исправить",
    num: "04 / 05",
    points: [
      "Вопрос или провокация в заголовке",
      "Обещание конкретного результата",
      "Цифра или факт с первых слов",
    ],
  },
  {
    type: "cta",
    label: "Если было полезно",
    title: "Сохрани, чтобы не потерять",
    handle: "@expert · сделано в Swipely",
  },
] as const;

type Scene = "pain" | "carousel" | "manifesto" | "onboarding";

// ─── Grain SVG overlay ─────────────────────────────────────────────
function Grain() {
  return (
    <svg
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 100, opacity: 0.028, width: "100%", height: "100%" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <filter id="wf-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#wf-grain)" />
    </svg>
  );
}

// ─── Carousel slide renderer ───────────────────────────────────────
function CarouselSlide({ slide, active }: { slide: (typeof SLIDES)[number]; active: boolean }) {
  const base: React.CSSProperties = {
    position: "absolute", inset: 0,
    display: "flex", flexDirection: "column",
    transform: active ? "translateX(0)" : "translateX(100%)",
    transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)",
    willChange: "transform",
  };

  if (slide.type === "hook") {
    return (
      <div style={{ ...base, background: "#0E0E14", padding: "clamp(20px,6vw,28px)", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, color: "#C6F135", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 400 }}>{slide.num}</span>
        <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(18px,5vw,24px)", color: "#F0F0F4", lineHeight: 1.3, flex: 1, display: "flex", alignItems: "center", padding: "12px 0" }}>{slide.title}</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#50505E", fontWeight: 300 }}>{slide.handle}</span>
          <span style={{ fontSize: 9, background: "#C6F135", color: "#0A0A0C", fontWeight: 700, padding: "3px 8px", borderRadius: 3, letterSpacing: "0.04em" }}>{slide.badge}</span>
        </div>
      </div>
    );
  }

  if (slide.type === "editorial") {
    return (
      <div style={{ ...base, background: "#F4F0E8", padding: "clamp(18px,5vw,24px)", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(52px,14vw,68px)", fontWeight: 400, color: "rgba(0,0,0,0.07)", lineHeight: 1, marginBottom: -8 }}>{slide.index}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, color: "#9A8E7A", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 8 }}>{slide.tag}</div>
          <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(16px,4.5vw,20px)", color: "#1A1610", lineHeight: 1.3 }}>{slide.title}</p>
          <div style={{ width: 28, height: 1.5, background: "#C8B48A", margin: "10px 0" }} />
          <p style={{ fontSize: "clamp(10px,2.8vw,12px)", color: "#7A6E5E", lineHeight: 1.6, fontWeight: 300 }}>{slide.body}</p>
        </div>
      </div>
    );
  }

  if (slide.type === "stat") {
    return (
      <div style={{ ...base, background: "#0A0A0C", padding: "clamp(18px,5vw,24px)", justifyContent: "center", gap: 8 }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(56px,15vw,84px)", fontWeight: 700, color: "#C6F135", lineHeight: 1, letterSpacing: -2 }}>{slide.big}</div>
        <div style={{ fontSize: "clamp(11px,3vw,13px)", color: "#50505E", fontWeight: 300 }}>{slide.unit}</div>
        <div style={{ width: "100%", height: 1, background: "#1E1E28", margin: "10px 0" }} />
        <p style={{ fontSize: "clamp(11px,3vw,13px)", color: "#F0F0F4", fontWeight: 300, lineHeight: 1.55 }}>{slide.caption}</p>
      </div>
    );
  }

  if (slide.type === "swiss") {
    return (
      <div style={{ ...base, background: "#FFFFFF", padding: "clamp(18px,5vw,22px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 10, borderBottom: "2px solid #000" }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 700, color: "#000", letterSpacing: "0.12em", textTransform: "uppercase" }}>{slide.label}</span>
          <span style={{ fontSize: 9, color: "#999" }}>{slide.num}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {slide.points.map((pt, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 11, color: "#000", minWidth: 18 }}>0{i + 1}</span>
              <span style={{ fontSize: "clamp(11px,3vw,12px)", color: "#222", lineHeight: 1.45 }}>{pt}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // cta
  return (
    <div style={{ ...base, background: "#0E0E14", justifyContent: "center", alignItems: "center", textAlign: "center", gap: 0, padding: "clamp(18px,5vw,24px)" }}>
      <div style={{ fontSize: 10, color: "#50505E", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 16 }}>{slide.label}</div>
      <p style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: "clamp(20px,5vw,26px)", color: "#F0F0F4", lineHeight: 1.3, marginBottom: 22 }}>{slide.title}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid #2A2A38", borderRadius: 6, padding: "7px 16px", fontSize: 11, color: "#50505E", fontWeight: 300 }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
        Сохранить
      </div>
      <div style={{ fontSize: 9, color: "#303040", marginTop: 18, letterSpacing: "0.08em" }}>{slide.handle}</div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────
export default function WelcomeFlow() {
  const [scene, setScene] = useState<Scene>("pain");
  const [slideIdx, setSlideIdx] = useState(0);
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
  }, []);

  // Auto-advance scenes
  useEffect(() => {
    clearTimers();
    if (scene === "pain") {
      timers.current.push(setTimeout(() => setScene("carousel"), 3200));
    }
    if (scene === "carousel") {
      timers.current.push(setTimeout(() => setScene("manifesto"), 9500));
    }
    if (scene === "manifesto") {
      timers.current.push(setTimeout(() => setScene("onboarding"), 5000));
    }
    return clearTimers;
  }, [scene, clearTimers]);

  // Carousel auto-advance
  useEffect(() => {
    if (scene !== "carousel") return;
    const id = setInterval(() => setSlideIdx(i => (i + 1) % SLIDES.length), 1800);
    return () => clearInterval(id);
  }, [scene]);

  const skipToOnboarding = useCallback(() => {
    clearTimers();
    setScene("onboarding");
  }, [clearTimers]);

  const finish = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (username.trim()) {
          await supabase.from("profiles").update({ username: username.trim().replace(/^@/, "") }).eq("id", user.id);
        }
      }
    } catch {
      // non-critical — proceed anyway
    }
    router.push("/generate");
    router.refresh();
  };

  // Tap anywhere on manifesto scenes to advance
  const handleTap = () => {
    if (scene === "pain") { clearTimers(); setScene("carousel"); }
    else if (scene === "carousel") { clearTimers(); setScene("manifesto"); }
    else if (scene === "manifesto") { clearTimers(); setScene("onboarding"); }
  };

  const isManifestoScene = scene !== "onboarding";

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500&family=Space+Grotesk:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes wf-fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes wf-fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <Grain />

      <div
        style={{
          position: "fixed", inset: 0,
          background: "#0A0A0C",
          fontFamily: "'Inter', sans-serif",
          color: "#F0F0F4",
          display: "flex", alignItems: "center", justifyContent: "center",
          height: "100dvh", width: "100dvw",
          overflow: "hidden",
          cursor: isManifestoScene ? "pointer" : "default",
          WebkitTapHighlightColor: "transparent",
        }}
        onClick={isManifestoScene ? handleTap : undefined}
      >

        {/* Skip button — visible during manifesto scenes */}
        {isManifestoScene && (
          <button
            onClick={(e) => { e.stopPropagation(); skipToOnboarding(); }}
            style={{
              position: "absolute", top: "env(safe-area-inset-top, 20px)", right: 20,
              marginTop: 16,
              background: "transparent",
              border: "1px solid #1E1E28",
              color: "#50505E",
              fontFamily: "'Inter', sans-serif",
              fontSize: 12, fontWeight: 300, letterSpacing: "0.06em",
              padding: "8px 16px", borderRadius: 4, cursor: "pointer",
              zIndex: 10,
            }}
          >
            Пропустить
          </button>
        )}

        {/* ── Scene 1: Pain ── */}
        <div
          style={{
            position: "absolute",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
            opacity: scene === "pain" ? 1 : 0,
            transform: scene === "pain" ? "translateY(0)" : "translateY(-32px)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
            pointerEvents: "none",
            textAlign: "center",
            padding: "0 24px",
          }}
        >
          <span style={{
            fontSize: 12, fontWeight: 400, color: "#50505E",
            letterSpacing: "0.18em", textTransform: "uppercase",
            animation: scene === "pain" ? "wf-fadeIn 0.6s ease forwards 0.3s" : "none",
            opacity: scene === "pain" ? 0 : 1,
          }}>
            Обычный понедельник эксперта
          </span>
          <div style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: "clamp(72px,20vw,118px)",
            fontWeight: 400, letterSpacing: -2, color: "#F0F0F4", lineHeight: 1,
            animation: "wf-fadeIn 0.7s ease forwards 0.1s", opacity: 0,
          }}>
            3 часа
          </div>
          <span style={{
            fontSize: "clamp(13px,3.5vw,15px)", fontWeight: 300, color: "#50505E",
            animation: "wf-fadeIn 0.6s ease forwards 1.5s", opacity: 0,
          }}>
            в Canva ради одной карусели
          </span>
        </div>

        {/* ── Scene 2: Carousel ── */}
        <div
          style={{
            position: "absolute",
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: "clamp(12px,3vw,20px)",
            opacity: scene === "carousel" ? 1 : 0,
            transform: scene === "carousel" ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
            pointerEvents: scene === "carousel" ? "auto" : "none",
          }}
        >
          <span style={{ fontSize: 10, color: "#50505E", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 400 }}>
            Создано Swipely · за 18 секунд
          </span>

          {/* Carousel frame */}
          <div style={{
            position: "relative",
            width: "min(280px, 85vw)",
            aspectRatio: "1/1",
            borderRadius: 14,
            overflow: "hidden",
            background: "#0E0E14",
            border: "1px solid #1E1E28",
          }}>
            {SLIDES.map((slide, i) => (
              <CarouselSlide key={i} slide={slide} active={i === slideIdx} />
            ))}
          </div>

          {/* Dots */}
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {SLIDES.map((_, i) => (
              <div key={i} style={{
                width: i === slideIdx ? 16 : 5,
                height: 5,
                borderRadius: i === slideIdx ? 3 : "50%",
                background: i === slideIdx ? "#C6F135" : "#2A2A38",
                transition: "all 0.3s ease",
              }} />
            ))}
          </div>
        </div>

        {/* ── Scene 3: Manifesto text ── */}
        <div
          style={{
            position: "absolute",
            display: "flex", flexDirection: "column", alignItems: "center",
            textAlign: "center", padding: "0 clamp(24px,6vw,48px)",
            gap: 0,
            opacity: scene === "manifesto" ? 1 : 0,
            transition: "opacity 0.7s ease",
            pointerEvents: "none",
          }}
        >
          {[
            { text: "Хорошие карусели читают.", delay: "0s", color: "#F0F0F4", italic: false },
            { text: "Вирусные — сохраняют и пересылают.", delay: "0.9s", color: "#F0F0F4", italic: false },
            { text: "Swipely знает разницу.", delay: "1.7s", color: "#C6F135", italic: true },
          ].map((line, i) => (
            <div
              key={i}
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "clamp(22px,5.5vw,48px)",
                fontWeight: 400,
                lineHeight: 1.3,
                color: line.color,
                fontStyle: line.italic ? "italic" : "normal",
                animation: scene === "manifesto" ? `wf-fadeInUp 0.8s ease forwards ${line.delay}` : "none",
                opacity: scene === "manifesto" ? 0 : 0,
              }}
            >
              {line.text}
            </div>
          ))}
        </div>

        {/* ── Scene 4: Onboarding ── */}
        <div
          style={{
            position: "absolute",
            display: "flex", flexDirection: "column", alignItems: "center",
            textAlign: "center",
            padding: "0 clamp(24px,6vw,40px)",
            width: "100%", maxWidth: 400,
            gap: 0,
            opacity: scene === "onboarding" ? 1 : 0,
            transform: scene === "onboarding" ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
            pointerEvents: scene === "onboarding" ? "auto" : "none",
          }}
        >
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(24px,6vw,36px)", color: "#F0F0F4", lineHeight: 1.2, marginBottom: 8 }}>
            Как подписывать слайды?
          </div>
          <p style={{ fontSize: "clamp(13px,3.5vw,14px)", color: "#50505E", fontWeight: 300, marginBottom: 28 }}>
            Имя или @username будет на каждом слайде
          </p>

          <div style={{ position: "relative", width: "100%", marginBottom: 14 }}>
            <span style={{
              position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
              fontSize: 15, color: "#50505E", pointerEvents: "none",
            }}>@</span>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === "Enter" && finish()}
              placeholder="username"
              maxLength={32}
              autoComplete="off"
              autoCapitalize="none"
              style={{
                width: "100%",
                background: "#13131A",
                border: "1px solid #22222E",
                borderRadius: 10,
                padding: "14px 14px 14px 32px",
                fontSize: "16px",
                color: "#F0F0F4",
                fontFamily: "'Inter', sans-serif",
                outline: "none",
              }}
            />
          </div>

          <button
            onClick={finish}
            disabled={saving}
            style={{
              width: "100%",
              background: "#C6F135",
              color: "#0A0A0C",
              border: "none",
              borderRadius: 10,
              padding: "clamp(13px,3.5vw,16px)",
              fontSize: "clamp(14px,3.5vw,15px)",
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              cursor: saving ? "not-allowed" : "pointer",
              marginBottom: 14,
              opacity: saving ? 0.7 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {saving ? "Сохранение..." : "Начать создавать"}
          </button>

          <button
            onClick={finish}
            disabled={saving}
            style={{
              background: "transparent", border: "none",
              color: "#30303A", fontFamily: "'Inter', sans-serif",
              fontSize: 12, fontWeight: 300, cursor: "pointer",
              padding: "4px 0",
            }}
          >
            Пропустить
          </button>
        </div>

      </div>
    </>
  );
}
