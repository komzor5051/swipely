# Welcome / Manifesto Onboarding Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a fullscreen animated manifesto + username collection step to new users immediately after registration, before they reach `/generate`.

**Architecture:** A standalone `/welcome` route (outside the `(dashboard)` layout group so no sidebar/header renders). `DashboardLayout` redirects new users (`onboarding_completed = false`, `standard_used = 0`) to `/welcome` instead of `/generate`. The `WelcomeFlow` React component renders 4 scenes sequentially with CSS transitions, auto-advances with timers, and always shows a skip button. On completion it marks `onboarding_completed = true` in Supabase and pushes to `/generate`. Mobile-first: `100dvh`, `clamp()` fonts, tap-to-skip gesture.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind v4, Supabase client (`@/lib/supabase/client`), `next/navigation` router.

---

## Chunk 1: Route scaffold + DB check

### Task 1: Verify required columns exist in profiles

**Confirmed from `supabase-migration.sql`:**
- `onboarding_completed BOOLEAN DEFAULT false` — line 36, already present
- `username TEXT` — line 14/28, already present

No migration needed. Proceed to Task 2.

- [ ] Quick sanity check in Supabase SQL editor:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name IN ('onboarding_completed', 'username');
```
Expected: 2 rows returned.

---

### Task 2: Create `/welcome` route outside dashboard layout

**Files:**
- Create: `swipely-nextjs/app/welcome/layout.tsx`
- Create: `swipely-nextjs/app/welcome/page.tsx`

- [ ] Create `app/welcome/layout.tsx` — minimal layout, no sidebar, no header:

```tsx
export default function WelcomeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

- [ ] Create `app/welcome/page.tsx` — placeholder for now:

```tsx
"use client";
export default function WelcomePage() {
  return (
    <div style={{ background: "#0A0A0C", width: "100vw", height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "white" }}>Welcome placeholder</p>
    </div>
  );
}
```

- [ ] Start dev server: `cd swipely-nextjs && npm run dev`

- [ ] Open `http://localhost:3000/welcome` — verify dark fullscreen, no sidebar visible.

---

### Task 3: Wire signup → `/welcome` and layout guard → `/welcome`

**Files:**
- Modify: `swipely-nextjs/app/(auth)/signup/page.tsx:55`
- Modify: `swipely-nextjs/app/(dashboard)/layout.tsx:216,238`

- [ ] In `signup/page.tsx`, change line 55:
```tsx
// Before:
router.push('/generate')
// After:
router.push('/welcome')
```

- [ ] In `layout.tsx`, update the first-time redirect (match by content, not exact line — lines may shift) — change target and add `/welcome` to exception list:
```tsx
// Before:
if (!profileData.onboarding_completed && !profileData.standard_used && !pathname.includes("/onboarding") && !visitedOnboarding.current) {
  router.push("/generate");
// After:
if (!profileData.onboarding_completed && !profileData.standard_used && !pathname.includes("/onboarding") && !pathname.includes("/welcome") && !visitedOnboarding.current) {
  router.push("/welcome");
```

- [ ] Same fix for the fallback branch (line 238) where profile doesn't exist:
```tsx
// Before:
if (!pathname.includes("/onboarding") && !visitedOnboarding.current) {
  router.push("/generate");
// After:
if (!pathname.includes("/onboarding") && !pathname.includes("/welcome") && !visitedOnboarding.current) {
  router.push("/welcome");
```

- [ ] Manual test: create a test account → confirm redirect lands on `/welcome` (dark fullscreen placeholder), not `/generate`.

- [ ] Commit:
```bash
cd swipely-nextjs
git add app/welcome/layout.tsx app/welcome/page.tsx app/(auth)/signup/page.tsx app/(dashboard)/layout.tsx
git commit -m "feat(welcome): scaffold /welcome route and wire signup redirect"
```

---

## Chunk 2: WelcomeFlow component — manifesto animation

### Task 4: Build `WelcomeFlow` component — scenes 1-3 (manifesto)

**Files:**
- Create: `swipely-nextjs/components/onboarding/WelcomeFlow.tsx`

This component owns all 4 scenes. Scene state: `'pain' | 'carousel' | 'manifesto' | 'onboarding'`.

- [ ] Create `components/onboarding/WelcomeFlow.tsx`:

```tsx
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

  const clearTimers = () => timers.current.forEach(clearTimeout);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  // Carousel auto-advance
  useEffect(() => {
    if (scene !== "carousel") return;
    const id = setInterval(() => setSlideIdx(i => (i + 1) % SLIDES.length), 1800);
    return () => clearInterval(id);
  }, [scene]);

  const skipToOnboarding = useCallback(() => {
    clearTimers();
    setScene("onboarding");
  }, []);

  const finish = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const update: Record<string, unknown> = { onboarding_completed: true };
        if (username.trim()) update.username = username.trim().replace(/^@/, "");
        await supabase.from("profiles").update(update).eq("id", user.id);
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
                fontSize: "16px", // must be ≥16px — iOS Safari zooms on inputs with smaller font
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
```

- [ ] Run lint: `cd swipely-nextjs && npm run lint` — fix any TypeScript errors.

---

### Task 5: Mount WelcomeFlow in `/welcome` page

**Files:**
- Modify: `swipely-nextjs/app/welcome/page.tsx`

- [ ] Replace placeholder with real component:

```tsx
import WelcomeFlow from "@/components/onboarding/WelcomeFlow";

export default function WelcomePage() {
  return <WelcomeFlow />;
}
```

- [ ] Open `http://localhost:3000/welcome` on mobile DevTools (375px viewport, iPhone SE).

- [ ] Verify all 4 scenes render correctly:
  - Scene 1 (pain): large "3 часа" text, subtext appears after 1.5s
  - Scene 2 (carousel): appears ~3.2s, slides auto-swipe every 1.8s
  - Scene 3 (manifesto): appears ~9.5s, lines animate in with stagger
  - Scene 4 (onboarding): appears ~14.5s or on "Пропустить"

- [ ] Verify "Пропустить" button top-right jumps to onboarding step immediately.

- [ ] Verify tapping anywhere on screen advances scene.

- [ ] Commit:
```bash
git add components/onboarding/WelcomeFlow.tsx app/welcome/page.tsx
git commit -m "feat(welcome): add WelcomeFlow component with manifesto + onboarding"
```

---

## Chunk 3: Onboarding completion + guard

### Task 6: Verify onboarding_completed saves and redirect works

- [ ] Complete the onboarding flow as a new user (enter username → "Начать создавать").

- [ ] Verify redirect lands on `/generate`.

- [ ] In Supabase dashboard, check the `profiles` table row for the test user:
  - `onboarding_completed = true`
  - `username` set to entered value (without `@`)

- [ ] Sign out, sign in again as the same user → should land on `/generate` (not `/welcome`).

- [ ] Sign in as a brand new user → should go through `/welcome` flow again.

---

### Task 7: Edge case — user navigates to `/welcome` after already onboarded

**Files:**
- Modify: `swipely-nextjs/app/welcome/page.tsx`

Add a server-side guard: if the user already completed onboarding, redirect to `/generate`.

- [ ] Update `app/welcome/page.tsx` — **remove `"use client"` if present from earlier tasks**, this is a Server Component:

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WelcomeFlow from "@/components/onboarding/WelcomeFlow";

export default async function WelcomePage() {
  // createClient from lib/supabase/server.ts is async — must be awaited
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    if (profile?.onboarding_completed) {
      redirect("/generate");
    }
  }

  return <WelcomeFlow />;
}
```

- [ ] Test: visit `http://localhost:3000/welcome` as an already-onboarded user → should redirect to `/generate` instantly.

- [ ] Run lint: `npm run lint`.

- [ ] Commit:
```bash
git add app/welcome/page.tsx
git commit -m "feat(welcome): add server-side guard to skip /welcome for onboarded users"
```

---

### Task 8: Visual QA on real mobile

- [ ] Open on actual iPhone (or BrowserStack): `http://<local-ip>:3000/welcome`

- [ ] Check:
  - [ ] No content is cut off by browser chrome / safe areas
  - [ ] "Пропустить" button is reachable with thumb (top-right is ok on most phones)
  - [ ] Text is readable without zooming
  - [ ] Carousel slides don't overflow horizontally
  - [ ] Input field doesn't cause zoom on focus (font-size ≥ 16px on input — already handled by `clamp(14px,...,15px)`, may need bump to 16px if iOS zooms)
  - [ ] Tap-to-advance gesture feels responsive

- [ ] If input causes zoom on iOS: update input font-size to `16px` (iOS zooms when input font < 16px).

- [ ] Final commit:
```bash
git add -p
git commit -m "fix(welcome): mobile QA fixes"
```

---

## Notes

**`onboarding_completed` vs `onboarding_shown`:** The codebase already uses `onboarding_completed` in `layout.tsx:211`. Use that column name — do not add a new one.

**Server client path:** Check the actual path to the Supabase server client in the project. It's likely `@/lib/supabase/server` — verify by checking `lib/supabase/` directory before Task 7.

**Font loading:** WelcomeFlow injects a `<style>` with Google Fonts import. This works but causes a brief FOUT (flash of unstyled text). Acceptable for an onboarding screen — not worth adding a Next.js font loader for a one-time flow.

**`router.refresh()` after `router.push('/generate')`:** Required so `DashboardLayout` re-fetches the profile and sees `onboarding_completed = true`, preventing the redirect loop back to `/welcome`.
