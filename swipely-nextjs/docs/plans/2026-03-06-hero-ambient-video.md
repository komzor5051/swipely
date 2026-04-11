# Hero Ambient Video Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a 25-second looping ambient background video for the Hero section of swipely.ru showing floating carousel cards with parallax depth effect.

**Architecture:** New Remotion composition `HeroAmbient` in `swipely-promo/src/HeroAmbient.tsx`. White background + grid dots + 3 parallax card layers. Rendered to WebM/MP4, placed in `swipely-nextjs/public/`, integrated as `<video>` tag in Hero section replacing the static 3D card stack.

**Tech Stack:** Remotion 4, React, @remotion/google-fonts, Next.js `<video>` tag

---

### Task 1: Create HeroAmbient.tsx composition

**Files:**
- Create: `swipely-promo/src/HeroAmbient.tsx`

**Brand tokens (copy from SwipelyPromo.tsx):**
```ts
const WHITE    = "#FFFFFF";
const BLUE     = "#0A84FF";
const BLUE_DK  = "#0066CC";
const LIME     = "#D4F542";
const PINK     = "#F9A8D4";
const CHARCOAL = "#1A1A2E";
```

**Step 1: Create the file with Background component**

```tsx
import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, interpolate, AbsoluteFill } from "remotion";
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

// ── Background: white + grid dots + breathing blue gradients ──
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
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `
          radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)
        `,
        backgroundSize: "24px 24px",
        opacity: 0.5,
      }} />
    </AbsoluteFill>
  );
};
```

**Step 2: Add MiniCard components (3 styles matching the hero stack)**

```tsx
// Style A: Blue gradient (like Card 1 on hero)
const CardBlue: React.FC<{ w?: number; h?: number }> = ({ w = 260, h = 325 }) => (
  <div style={{
    width: w, height: h, borderRadius: 20,
    background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DK})`,
    boxShadow: "0 20px 60px rgba(10,132,255,0.2)",
    padding: 20, display: "flex", flexDirection: "column", justifyContent: "center",
    overflow: "hidden",
  }}>
    <div style={{ fontFamily: monoFont, fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>01 / 05</div>
    <div style={{ fontFamily: bodyFont, fontSize: 20, fontWeight: 800, color: WHITE, lineHeight: 1.2, marginBottom: 8 }}>
      <span style={{ background: LIME, color: BLUE_DK, padding: "2px 8px" }}>5 способов</span>
      <br />привлечь клиентов
    </div>
    <div style={{ fontFamily: bodyFont, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
      Проверенные стратегии для роста
    </div>
  </div>
);

// Style B: Dark charcoal (like Card 2 on hero)
const CardDark: React.FC<{ w?: number; h?: number }> = ({ w = 260, h = 325 }) => (
  <div style={{
    width: w, height: h, borderRadius: 20,
    background: CHARCOAL,
    boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
    padding: 20, display: "flex", flexDirection: "column", justifyContent: "center",
    position: "relative", overflow: "hidden",
  }}>
    {/* Lime deco lines */}
    <div style={{ position: "absolute", top: 14, right: 14, display: "flex", flexDirection: "column", gap: 5 }}>
      {[1, 0.7, 0.4].map((op, i) => (
        <div key={i} style={{ width: 40, height: 4, background: LIME, borderRadius: 2, transform: "rotate(-25deg)", opacity: op }} />
      ))}
    </div>
    <div style={{ fontFamily: monoFont, fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>02 / 05</div>
    <div style={{ fontFamily: bodyFont, fontSize: 20, fontWeight: 800, color: WHITE, lineHeight: 1.2, marginBottom: 8 }}>
      Создай <span style={{ background: PINK, color: CHARCOAL, padding: "2px 7px" }}>контент</span>,<br />
      который цепляет
    </div>
    <div style={{ fontFamily: bodyFont, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>AI сделает тексты за вас</div>
  </div>
);

// Style C: Light/white card (like Card 3 on hero)
const CardLight: React.FC<{ w?: number; h?: number }> = ({ w = 260, h = 325 }) => (
  <div style={{
    width: w, height: h, borderRadius: 20,
    background: "linear-gradient(135deg, #F0F4F8, #FFFFFF)",
    border: "1px solid rgba(0,0,0,0.07)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.06)",
    padding: 20, display: "flex", flexDirection: "column", justifyContent: "center",
    overflow: "hidden",
  }}>
    <div style={{ fontFamily: monoFont, fontSize: 10, color: "#999", marginBottom: 10 }}>03 / 05</div>
    <div style={{ fontFamily: bodyFont, fontSize: 20, fontWeight: 800, color: CHARCOAL, lineHeight: 1.2, marginBottom: 8 }}>
      Экономьте<br />
      <span style={{ background: `linear-gradient(135deg, ${BLUE}, #3D9FFF)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        до 5 часов
      </span> в неделю
    </div>
    <div style={{ fontFamily: bodyFont, fontSize: 12, color: "#888" }}>Автоматизация вместо рутины</div>
  </div>
);

// Style D: Receipt/mono style
const CardReceipt: React.FC<{ w?: number; h?: number }> = ({ w = 260, h = 325 }) => (
  <div style={{
    width: w, height: h, borderRadius: 20,
    background: "#FAFAFA",
    border: "1px solid rgba(0,0,0,0.06)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.05)",
    padding: 20, display: "flex", flexDirection: "column", justifyContent: "flex-start",
    overflow: "hidden",
  }}>
    <div style={{ fontFamily: monoFont, fontSize: 9, color: "#aaa", marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 }}>
      ━━━━━━━━━━━━━━━━
    </div>
    <div style={{ fontFamily: monoFont, fontSize: 14, fontWeight: 700, color: CHARCOAL, lineHeight: 1.5, marginBottom: 12 }}>
      #swipely<br />
      AI-карусель<br />
      готова ✓
    </div>
    <div style={{ fontFamily: monoFont, fontSize: 9, color: "#bbb" }}>
      ━━━━━━━━━━━━━━━━<br />
      5 слайдов · PNG
    </div>
  </div>
);
```

**Step 3: Add the ParallaxLayer component with seamless loop**

```tsx
type CardType = "blue" | "dark" | "light" | "receipt";

interface CardDef {
  type: CardType;
  // Start position as % of canvas (can be > 100 or < 0 for offscreen)
  startX: number; // 0–1 of canvas width
  startY: number; // 0–1 of canvas height
  scale: number;
  rotation: number; // base rotation degrees
  speedX: number;   // pixels per frame (can be negative)
  speedY: number;
  floatAmp: number; // sinusoidal float amplitude px
  floatPhase: number;
}

const ParallaxLayer: React.FC<{
  cards: CardDef[];
  opacity: number;
  blur: number;
}> = ({ cards, opacity, blur }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const CARD_W = 260;
  const CARD_H = 325;

  return (
    <AbsoluteFill style={{ opacity, filter: blur > 0 ? `blur(${blur}px)` : undefined }}>
      {cards.map((card, i) => {
        // Move linearly, wrap around when out of bounds
        const totalW = width + CARD_W * card.scale * 2;
        const totalH = height + CARD_H * card.scale * 2;
        const rawX = (card.startX * width + frame * card.speedX);
        const rawY = (card.startY * height + frame * card.speedY);

        // Seamless wrap
        const x = ((rawX % totalW) + totalW) % totalW - CARD_W * card.scale;
        const y = ((rawY % totalH) + totalH) % totalH - CARD_H * card.scale;

        // Sinusoidal float
        const floatY = Math.sin(frame * 0.02 + card.floatPhase) * card.floatAmp;
        const floatRot = Math.sin(frame * 0.015 + card.floatPhase) * 2;

        const w = CARD_W * card.scale;
        const h = CARD_H * card.scale;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y + floatY,
              transform: `rotate(${card.rotation + floatRot}deg)`,
              width: w,
              height: h,
              transformOrigin: "center center",
            }}
          >
            <div style={{ transform: `scale(${card.scale})`, transformOrigin: "top left", width: CARD_W, height: CARD_H }}>
              {card.type === "blue"    && <CardBlue w={CARD_W} h={CARD_H} />}
              {card.type === "dark"    && <CardDark w={CARD_W} h={CARD_H} />}
              {card.type === "light"   && <CardLight w={CARD_W} h={CARD_H} />}
              {card.type === "receipt" && <CardReceipt w={CARD_W} h={CARD_H} />}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
```

**Step 4: Define card data for 3 layers and export main component**

```tsx
// Layer 1 — Far (slow, large, blurry)
const FAR_CARDS: CardDef[] = [
  { type: "blue",    startX: 0.05, startY: 0.1,  scale: 1.3, rotation: -8,  speedX: 0.18, speedY: 0.05, floatAmp: 6,  floatPhase: 0 },
  { type: "dark",    startX: 0.5,  startY: 0.6,  scale: 1.2, rotation: 10,  speedX: 0.15, speedY: 0.07, floatAmp: 5,  floatPhase: 2.1 },
  { type: "light",   startX: 0.85, startY: 0.2,  scale: 1.25, rotation: -5, speedX: 0.12, speedY: 0.06, floatAmp: 7,  floatPhase: 4.2 },
  { type: "receipt", startX: 0.3,  startY: 0.75, scale: 1.1, rotation: 12,  speedX: 0.20, speedY: 0.04, floatAmp: 4,  floatPhase: 1.5 },
];

// Layer 2 — Mid
const MID_CARDS: CardDef[] = [
  { type: "dark",    startX: 0.15, startY: 0.4,  scale: 1.0, rotation: -12, speedX: 0.40, speedY: 0.10, floatAmp: 8,  floatPhase: 0.7 },
  { type: "blue",    startX: 0.6,  startY: 0.15, scale: 1.0, rotation: 8,   speedX: 0.35, speedY: 0.12, floatAmp: 6,  floatPhase: 3.1 },
  { type: "receipt", startX: 0.9,  startY: 0.55, scale: 0.95, rotation: -6, speedX: 0.45, speedY: 0.08, floatAmp: 9,  floatPhase: 1.8 },
  { type: "light",   startX: 0.4,  startY: 0.85, scale: 1.0, rotation: 14,  speedX: 0.38, speedY: 0.09, floatAmp: 7,  floatPhase: 5.0 },
  { type: "dark",    startX: 0.75, startY: 0.7,  scale: 0.9, rotation: -4,  speedX: 0.42, speedY: 0.11, floatAmp: 5,  floatPhase: 2.5 },
];

// Layer 3 — Near (fast, smaller, sharp)
const NEAR_CARDS: CardDef[] = [
  { type: "light",   startX: 0.0,  startY: 0.3,  scale: 0.8, rotation: 6,   speedX: 0.75, speedY: 0.18, floatAmp: 5,  floatPhase: 0.3 },
  { type: "blue",    startX: 0.45, startY: 0.5,  scale: 0.75, rotation: -10, speedX: 0.80, speedY: 0.15, floatAmp: 6,  floatPhase: 2.8 },
  { type: "receipt", startX: 0.8,  startY: 0.1,  scale: 0.7, rotation: 5,   speedX: 0.70, speedY: 0.20, floatAmp: 4,  floatPhase: 4.5 },
];

export const HeroAmbient: React.FC = () => (
  <AbsoluteFill>
    <Background />
    <ParallaxLayer cards={FAR_CARDS}  opacity={0.12} blur={6} />
    <ParallaxLayer cards={MID_CARDS}  opacity={0.30} blur={1} />
    <ParallaxLayer cards={NEAR_CARDS} opacity={0.55} blur={0} />
  </AbsoluteFill>
);
```

**Step 5: Verify file is complete and has no TypeScript errors (visual check)**

---

### Task 2: Register composition in Root.tsx

**Files:**
- Modify: `swipely-promo/src/Root.tsx`

**Step 1: Add import and Composition**

Add to `Root.tsx`:
```tsx
import { HeroAmbient } from "./HeroAmbient";

// Inside RemotionRoot, add:
<Composition
  id="HeroAmbient"
  component={HeroAmbient}
  durationInFrames={750}
  fps={30}
  width={1920}
  height={1080}
/>
```

**Step 2: Start Remotion studio and preview**

```bash
cd "swipely-promo"
npm run studio
```

Open browser at `http://localhost:3000` → select `HeroAmbient` composition → preview the animation. Check:
- White background visible
- Grid dots pattern visible
- Cards floating across screen in 3 layers
- Parallax depth difference noticeable
- No flickering or teleport glitches at loop point

---

### Task 3: Tune card positions for seamless loop

**Files:**
- Modify: `swipely-promo/src/HeroAmbient.tsx`

The seamless loop works by wrapping coordinates via modulo. Verify it looks smooth by:

**Step 1: Check loop point in studio**

Scrub to frame 748-750 then back to frame 0 in Remotion Studio. Cards should appear in same position — no visible jump.

**Step 2: Fix any teleport glitches**

If a card jumps at the loop, adjust its `startX`/`startY` so it's fully offscreen at frame 0 and frame 750. The modulo logic handles the rest.

---

### Task 4: Render to video files

**Files:**
- Output: `swipely-promo/out/hero-ambient.webm`
- Output: `swipely-promo/out/hero-ambient.mp4`

**Step 1: Check package.json for render scripts**

```bash
cat swipely-promo/package.json | grep render
```

**Step 2: Render WebM (best for web, smaller size)**

```bash
cd "swipely-promo"
npx remotion render HeroAmbient out/hero-ambient.webm --codec=vp8 --crf=28
```

Expected: ~5-15MB file, 25 seconds.

**Step 3: Render MP4 (Safari fallback)**

```bash
npx remotion render HeroAmbient out/hero-ambient.mp4 --codec=h264 --crf=28
```

**Step 4: Verify output**

Open both files in a video player. Check:
- ~25 seconds duration
- Smooth parallax motion
- White background
- No artifacts

---

### Task 5: Copy video to Next.js public folder

**Files:**
- Output: `swipely-nextjs/public/hero-ambient.webm`
- Output: `swipely-nextjs/public/hero-ambient.mp4`

**Step 1: Copy files**

```bash
cp "swipely-promo/out/hero-ambient.webm" "swipely-nextjs/public/hero-ambient.webm"
cp "swipely-promo/out/hero-ambient.mp4"  "swipely-nextjs/public/hero-ambient.mp4"
```

**Step 2: Verify sizes are reasonable**

```bash
ls -lh swipely-nextjs/public/hero-ambient.*
```

If WebM > 20MB, re-render with higher CRF (32-36). If < 2MB, lower CRF (22-24).

---

### Task 6: Integrate video in Hero section

**Files:**
- Modify: `swipely-nextjs/app/page.tsx` (Hero function, lines 22-137)

**Goal:** Add the video as an absolute overlay behind the right column cards. Keep the static card stack as a fallback for when video hasn't loaded.

**Step 1: Add video element to Hero section**

The `<section>` already has `relative` class. Add video as first child of the `<section>`:

```tsx
function Hero() {
  return (
    <section className="min-h-screen flex items-center pt-24 sm:pt-32 pb-16 px-6 relative overflow-hidden">
      {/* Ambient background video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ opacity: 0.65 }}
      >
        <source src="/hero-ambient.webm" type="video/webm" />
        <source src="/hero-ambient.mp4"  type="video/mp4" />
      </video>

      {/* Existing content stays exactly as-is */}
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center w-full relative z-10">
        ...
      </div>
    </section>
  );
}
```

Note: add `relative z-10` to the inner `div` so text stays above video.

**Step 2: Start Next.js dev server and check**

```bash
cd swipely-nextjs
npm run dev
```

Open `http://localhost:3000`. Check:
- Video plays automatically behind text
- Text is still readable
- Cards in right column still visible (they're above video)
- No layout shift

**Step 3: Tune opacity if needed**

If video is too strong (distracting from text), lower `opacity` from `0.65` to `0.45-0.5`.
If too subtle, raise to `0.8`.

**Step 4: Add `overflow-hidden` to section if cards bleed outside**

Already added in Step 1. Confirm no visual overflow.

---

### Task 7: Commit

**Step 1: Commit promo source**

```bash
cd "swipely-promo"
git add src/HeroAmbient.tsx src/Root.tsx
git commit -m "feat(promo): add HeroAmbient composition — parallax card background"
```

Note: `swipely-promo/` has no own `.git`, commits go to the monorepo root. Verify with `git status` from monorepo root first.

**Step 2: Commit Next.js changes**

```bash
cd "swipely-nextjs"
git add public/hero-ambient.webm public/hero-ambient.mp4 app/page.tsx
git commit -m "feat(landing): hero ambient video background — parallax floating cards"
```
