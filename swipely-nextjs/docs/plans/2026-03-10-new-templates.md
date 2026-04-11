# New Templates Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 4 new slide templates (Terminal, Polaroid, Blueprint, Magazine) to the Swipely carousel generator.

**Architecture:** Each template is a self-contained React component in `components/slides/templates/`. After creating the component, register it in two places: `SlideRenderer.tsx` (TEMPLATE_MAP) and `lib/templates/registry.ts` (templates array). No tests exist in this project — verify visually via `npm run dev`.

**Tech Stack:** Next.js 16, React 19, inline styles only (no Tailwind in slide components), Google Fonts via `@import` in `<style>` tag, TypeScript.

---

## Checklist for every template

Per-template registration steps (identical for all 4):

```
A. Create: swipely-nextjs/components/slides/templates/<Name>Slide.tsx
B. Modify: swipely-nextjs/components/slides/SlideRenderer.tsx  — add import + TEMPLATE_MAP entry
C. Modify: swipely-nextjs/lib/templates/registry.ts            — add templates[] entry
```

### Layout variants reference

```
slideNumber === 1           → "hero"   (hook, large title, dramatic)
slide.type === "tension"    → "split"  (problem statement, alternating position)
slide.type === "contrast"   → "split"
slide.type === "value"      → "centered"
slide.type === "insight"    → "centered"
slide.type === "proof"      → "quote"
last slide / type === "cta" → "cta"
```

Use `getLayoutVariant(slide.type, slideNumber, totalSlides)` from `../utils`.

---

## Task 1: TerminalSlide

### Files
- Create: `swipely-nextjs/components/slides/templates/TerminalSlide.tsx`
- Modify: `swipely-nextjs/components/slides/SlideRenderer.tsx`
- Modify: `swipely-nextjs/lib/templates/registry.ts`

### Design spec
- **Palette:** background `#0A0A0A`, title `#00FF88`, body `rgba(229,229,229,0.9)`, muted `#555555`, counter `#2A2A2A`
- **Fonts:** JetBrains Mono (400, 500, 700) — imported via Google Fonts
- **Scanline texture:** `repeating-linear-gradient` over the entire slide, `rgba(0,255,136,0.015)` every 4px — gives a CRT screen feel
- **Top bar:** 3 colored dots (red `#FF5F56`, yellow `#FFBD2E`, green `#27C93F`) + filename label in `#444`

### Layout variants

**hero (slide 1):**
- Top bar with dots + `$ swipely run --generate`
- Giant title (JetBrains Mono, 112px, bold, `#00FF88`)
- Dashed separator `──────────────`
- Body text (`#888`, 30px)
- Blinking cursor `$ ▌` bottom-left (green bg, black text char)
- Counter bottom-right `01 / N`

**split (tension/contrast):**
- `$ cat errors/XX-slug.txt` prompt line
- Large faded number (150px, `#1A1A1A`) + "ОШИБКА" label beside it
- Title (80px, `#E5E5E5`)
- Body with `<hl>` text in `#00FF88`

**centered (value/insight):**
- Prompt line
- Green tag badge (`background:#00FF88`, text `#0A0A0A`)
- Title (84–96px, `#E5E5E5`)
- Bulleted list with `→` arrows in `#00FF88`, body in `#666`

**quote (proof):**
- Top border: `linear-gradient(90deg, #00FF88, transparent)` 4px
- Giant `"` (220px, `#00FF88`, opacity 0.15)
- Left border 4px `#00FF88`
- Title italic (68px, `#E5E5E5`) + body (`#555`)
- Counter bottom-right

**cta (last slide):**
- Background inverted to `#00FF88`
- Scanline with `rgba(0,0,0,0.04)`
- Prompt `$ swipely --help` in `rgba(0,0,0,0.3)`
- Title (112px, bold, `#0A0A0A`)
- Black button `background:#0A0A0A`, text `#00FF88`, `→ swipely.ai`
- Subtext `rgba(0,0,0,0.5)`

### Steps

- [ ] **Step 1: Create TerminalSlide.tsx**

```tsx
"use client";
import React from "react";
import type { SlideProps } from "../types";
import { renderTitle, renderContent, getSlideDimensions, scaleContentFontSize, getLayoutVariant } from "../utils";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');`;
const SCANLINE = `repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,255,136,0.015) 3px,rgba(0,255,136,0.015) 4px)`;

function TopBar({ filename = "swipely — content.sh" }: { filename?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 52, zIndex: 2, flexShrink: 0 }}>
      <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#FF5F56" }} />
      <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#FFBD2E" }} />
      <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#27C93F" }} />
      <span style={{ color: "#444", fontSize: 22, marginLeft: 16, fontFamily: "'JetBrains Mono', monospace" }}>{filename}</span>
    </div>
  );
}

export default function TerminalSlide({ slide, slideNumber, totalSlides, format }: SlideProps) {
  const { width, height } = getSlideDimensions(format);
  const layout = getLayoutVariant(slide.type, slideNumber, totalSlides);

  const hlStyle: React.CSSProperties = { color: "#00FF88" };
  const counter = <div style={{ position: "absolute", bottom: 72, right: 80, color: "#2A2A2A", fontSize: 22, zIndex: 2, fontFamily: "'JetBrains Mono', monospace" }}>{slideNumber}&nbsp;/&nbsp;{totalSlides}</div>;
  const base: React.CSSProperties = { width, height, background: "#0A0A0A", padding: "72px 80px", display: "flex", flexDirection: "column", fontFamily: "'JetBrains Mono', monospace", position: "relative", overflow: "hidden", boxSizing: "border-box" };
  const scanDiv = <div style={{ position: "absolute", inset: 0, backgroundImage: SCANLINE, pointerEvents: "none", zIndex: 1 }} />;

  // ── CTA ──
  if (layout === "cta") {
    return (
      <div style={{ ...base, background: "#00FF88", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <style>{FONTS}</style>
        <div style={{ position: "absolute", inset: 0, backgroundImage: SCANLINE.replace("0,255,136,0.015", "0,0,0,0.04"), pointerEvents: "none", zIndex: 1 }} />
        <div style={{ color: "rgba(0,0,0,0.3)", fontSize: 22, marginBottom: 48, zIndex: 2 }}>$ swipely --help</div>
        <h1 style={{ fontSize: 112, fontWeight: 700, color: "#0A0A0A", lineHeight: 0.95, letterSpacing: -4, marginBottom: 48, zIndex: 2 }}>
          {renderTitle(slide.title, { color: "#0A0A0A" })}
        </h1>
        <div style={{ background: "#0A0A0A", color: "#00FF88", fontSize: 30, fontWeight: 700, padding: "24px 64px", marginBottom: 40, zIndex: 2, letterSpacing: 2 }}>
          → swipely.ai
        </div>
        <p style={{ color: "rgba(0,0,0,0.5)", fontSize: 24, zIndex: 2 }}>{slide.content}</p>
        {counter}
      </div>
    );
  }

  // ── QUOTE ──
  if (layout === "quote") {
    return (
      <div style={{ ...base, justifyContent: "center" }}>
        <style>{FONTS}</style>
        {scanDiv}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg,#00FF88,transparent)" }} />
        <div style={{ fontSize: 220, fontWeight: 700, color: "#00FF88", lineHeight: 0.7, marginBottom: 32, opacity: 0.15, zIndex: 2 }}>"</div>
        <div style={{ borderLeft: "4px solid #00FF88", paddingLeft: 48, zIndex: 2 }}>
          <h1 style={{ fontSize: 68, fontWeight: 700, color: "#E5E5E5", lineHeight: 1.2, letterSpacing: -1, marginBottom: 40 }}>
            {renderTitle(slide.title, hlStyle)}
          </h1>
          <p style={{ fontSize: scaleContentFontSize(slide.content, 28), color: "#555", lineHeight: 1.65 }}>
            {renderContent(slide.content)}
          </p>
        </div>
        {counter}
      </div>
    );
  }

  // ── HERO ──
  if (layout === "hero") {
    return (
      <div style={base}>
        <style>{FONTS}</style>
        {scanDiv}
        <TopBar />
        <div style={{ color: "#555", fontSize: 26, marginBottom: 12, zIndex: 2, flexShrink: 0 }}>$ swipely run --generate</div>
        <h1 style={{ fontSize: 112, fontWeight: 700, color: "#00FF88", lineHeight: 1.0, letterSpacing: -3, marginBottom: 48, zIndex: 2, flex: 1, alignSelf: "flex-start" as const }}>
          {renderTitle(slide.title, { color: "#FFFFFF" })}
        </h1>
        <div style={{ color: "#2A2A2A", fontSize: 22, marginBottom: 32, zIndex: 2, flexShrink: 0 }}>──────────────────────────</div>
        <p style={{ color: "#888", fontSize: scaleContentFontSize(slide.content, 30), lineHeight: 1.6, zIndex: 2, flexShrink: 0 }}>
          {renderContent(slide.content)}
        </p>
        <div style={{ position: "absolute", bottom: 72, left: 80, color: "#00FF88", fontSize: 26, zIndex: 2 }}>
          $&nbsp;<span style={{ background: "#00FF88", color: "#0A0A0A", padding: "0 4px" }}>▌</span>
        </div>
        {counter}
      </div>
    );
  }

  // ── SPLIT (tension/contrast) ──
  if (layout === "split") {
    const num = String(slideNumber).padStart(2, "0");
    return (
      <div style={base}>
        <style>{FONTS}</style>
        {scanDiv}
        <div style={{ color: "#2A2A2A", fontSize: 22, marginBottom: 32, zIndex: 2, flexShrink: 0 }}>
          $ cat slide/{num}.txt
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginBottom: 40, zIndex: 2, flexShrink: 0 }}>
          <span style={{ fontSize: 140, fontWeight: 700, color: "#1A1A1A", lineHeight: 1 }}>{num}</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 24, color: "#555", letterSpacing: 2 }}>СЛАЙД</span>
            <div style={{ width: 80, height: 3, background: "#00FF88" }} />
          </div>
        </div>
        <h1 style={{ fontSize: 80, fontWeight: 700, color: "#E5E5E5", lineHeight: 1.05, letterSpacing: -2, marginBottom: 40, zIndex: 2, flex: 1 }}>
          {renderTitle(slide.title, hlStyle)}
        </h1>
        <p style={{ color: "#555", fontSize: scaleContentFontSize(slide.content, 28), lineHeight: 1.7, zIndex: 2, flexShrink: 0 }}>
          {renderContent(slide.content)}
        </p>
        {counter}
      </div>
    );
  }

  // ── CENTERED (value/insight) ──
  return (
    <div style={{ ...base, justifyContent: "space-between" }}>
      <style>{FONTS}</style>
      {scanDiv}
      <div style={{ color: "#2A2A2A", fontSize: 22, zIndex: 2 }}>$ insight.log --slide {String(slideNumber).padStart(2, "0")}</div>
      <div style={{ zIndex: 2 }}>
        <div style={{ background: "#00FF88", color: "#0A0A0A", fontSize: 22, fontWeight: 700, letterSpacing: 3, padding: "12px 20px", marginBottom: 40, display: "inline-block" }}>
          {slide.type === "value" ? "ЦЕННОСТЬ" : "ИНСАЙТ"}
        </div>
        <h1 style={{ fontSize: scaleContentFontSize(slide.title, 96), fontWeight: 700, color: "#E5E5E5", lineHeight: 1.05, letterSpacing: -2, marginBottom: 40 }}>
          {renderTitle(slide.title, hlStyle)}
        </h1>
        <div style={{ color: "#2A2A2A", fontSize: 20, marginBottom: 24 }}>──────────────────────────</div>
        <p style={{ color: "#666", fontSize: scaleContentFontSize(slide.content, 30), lineHeight: 1.65 }}>
          {renderContent(slide.content)}
        </p>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", zIndex: 2 }}>
        <span style={{ color: "#2A2A2A", fontSize: 22 }}>{slideNumber}&nbsp;/&nbsp;{totalSlides}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Register in SlideRenderer.tsx**

Add after the last import:
```tsx
import TerminalSlide from "./templates/TerminalSlide";
```

Add to TEMPLATE_MAP:
```tsx
terminal: TerminalSlide,
```

- [ ] **Step 3: Register in registry.ts**

Add to `templates` array:
```ts
{
  id: "terminal",
  name: "Terminal",
  nameRu: "Терминал",
  description: "Тёмный CLI-стиль с зелёным акцентом и моноширинным шрифтом",
  preview: "/previews/terminal.png",
  tags: ["тёмный", "моно", "tech"],
  maxWordsPerSlide: 25,
  tone: "provocative",
},
```

- [ ] **Step 4: Verify**

```bash
cd swipely-nextjs && npm run dev
```

Open `http://localhost:3000/generate`, выбери шаблон "Терминал", сгенерируй карусель. Проверь все 6 слайдов.

- [ ] **Step 5: Commit**

```bash
cd swipely-nextjs && git add components/slides/templates/TerminalSlide.tsx components/slides/SlideRenderer.tsx lib/templates/registry.ts
git commit -m "feat(templates): add Terminal slide template"
```

---

## Task 2: PolaroidSlide

### Files
- Create: `swipely-nextjs/components/slides/templates/PolaroidSlide.tsx`
- Modify: `swipely-nextjs/components/slides/SlideRenderer.tsx`
- Modify: `swipely-nextjs/lib/templates/registry.ts`

### Design spec
- **Palette:** background `#F2EDE6` (cream), card `#FFFFFF`, dark photo area `#1A1A1A`, body `#555`, muted `#999`
- **Fonts:** Playfair Display (700, 900) + Space Grotesk (400, 500, 600) via Google Fonts
- **Dot texture:** `radial-gradient(circle, #C8BFB3 1px, transparent 1px)` at `32px 32px`, opacity 0.25
- **Tape strip:** yellow `rgba(255,220,80,0.75)` horizontal bar, 36px tall, absolute-positioned above the polaroid, slightly rotated
- **Polaroid card:** white bg, `padding: 44px 44px 88px`, box-shadow, slight `rotate(±1.5deg)`
- **Slide counter:** handwritten-feel, absolute at `bottom: -52px right: 8px`, slight rotation

### Layout variants

**hero:** Dark photo area (460px tall) inside polaroid with white Playfair title, caption below, tape strip

**split (tension):** Retro date box (large faded year as watermark) + "ТОГДА" label + big number/stat, heading + body below

**centered (value):** Text-only polaroid: category label, big Playfair heading, divider, body paragraph + blockquote pull-quote

**quote:** Dark background for outer slide (inverted), white polaroid, giant `"` in `#F2EDE6`, italic serif quote

**cta:** Dark polaroid (`#1A1A1A` bg inside), white Playfair heading, white CTA button

### Steps

- [ ] **Step 1: Create PolaroidSlide.tsx**

```tsx
"use client";
import React from "react";
import type { SlideProps } from "../types";
import { renderTitle, renderContent, getSlideDimensions, scaleContentFontSize, getLayoutVariant } from "../utils";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Space+Grotesk:wght@400;500;600;700&display=swap');`;
const DOT_BG = `radial-gradient(circle, #C8BFB3 1px, transparent 1px)`;

function PolaroidCard({
  dark = false,
  rotate = 1.2,
  children,
  counter,
}: {
  dark?: boolean;
  rotate?: number;
  children: React.ReactNode;
  counter: React.ReactNode;
}) {
  return (
    <div style={{ position: "relative", zIndex: 5 }}>
      <div
        style={{
          background: dark ? "#1A1A1A" : "#FFFFFF",
          padding: "44px 44px 88px",
          boxShadow: dark
            ? "0 24px 80px rgba(0,0,0,0.6), 0 4px 20px rgba(0,0,0,0.4)"
            : "0 16px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)",
          transform: `rotate(${rotate}deg)`,
          width: 800,
        }}
      >
        {children}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: -52,
          right: 8,
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 22,
          color: dark ? "#666" : "#BBB",
          transform: `rotate(${-rotate - 1}deg)`,
        }}
      >
        {counter}
      </div>
    </div>
  );
}

function TapeStrip({ rotate = -2 }: { rotate?: number }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 96,
        left: "50%",
        transform: `translateX(-50%) rotate(${rotate}deg)`,
        width: 180,
        height: 36,
        background: "rgba(255,220,80,0.75)",
        zIndex: 10,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    />
  );
}

function OuterSlide({
  dark = false,
  children,
}: {
  dark?: boolean;
  children: React.ReactNode;
}) {
  const bg = dark ? "#1A1A1A" : "#F2EDE6";
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: DOT_BG,
          backgroundSize: "32px 32px",
          opacity: dark ? 0.08 : 0.25,
        }}
      />
      {children}
    </div>
  );
}

export default function PolaroidSlide({ slide, slideNumber, totalSlides, format }: SlideProps) {
  const { width, height } = getSlideDimensions(format);
  const layout = getLayoutVariant(slide.type, slideNumber, totalSlides);
  const hlStyle: React.CSSProperties = {
    background: "#1A1A1A",
    color: "#FFFFFF",
    padding: "0 8px",
    boxDecorationBreak: "clone" as const,
    WebkitBoxDecorationBreak: "clone" as const,
  };
  const counter = `${slideNumber} of ${totalSlides}`;

  const wrapStyle: React.CSSProperties = { width, height, fontFamily: "'Space Grotesk', sans-serif", overflow: "hidden", boxSizing: "border-box", position: "relative" };

  // ── HERO ──
  if (layout === "hero") {
    return (
      <div style={wrapStyle}>
        <style>{FONTS}</style>
        <OuterSlide>
          <TapeStrip rotate={-2} />
          <PolaroidCard rotate={1.2} counter={counter}>
            <div style={{ background: "#1A1A1A", height: 460, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 32, overflow: "hidden" }}>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 88, fontWeight: 900, color: "#FFFFFF", textAlign: "center", lineHeight: 1.05, padding: "0 32px" }}>
                {renderTitle(slide.title, { color: "#FFFFFF", fontStyle: "italic" })}
              </h1>
            </div>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 500, color: "#999", textAlign: "center", letterSpacing: 1 }}>
              {slide.content}
            </p>
          </PolaroidCard>
        </OuterSlide>
      </div>
    );
  }

  // ── QUOTE ──
  if (layout === "quote") {
    return (
      <div style={wrapStyle}>
        <style>{FONTS}</style>
        <OuterSlide dark>
          <TapeStrip rotate={1.5} />
          <PolaroidCard dark rotate={-1.5} counter={counter}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 180, fontWeight: 900, color: "#F2EDE6", lineHeight: 0.7, marginBottom: 28 }}>"</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 64, fontWeight: 700, fontStyle: "italic", color: "#FFFFFF", lineHeight: 1.15, marginBottom: 36 }}>
              {renderTitle(slide.title, { color: "#FFFFFF" })}
            </h2>
            <div style={{ width: 40, height: 2, background: "#FFFFFF", marginBottom: 20 }} />
            <p style={{ fontSize: 26, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>{slide.content}</p>
          </PolaroidCard>
        </OuterSlide>
      </div>
    );
  }

  // ── CTA ──
  if (layout === "cta") {
    return (
      <div style={wrapStyle}>
        <style>{FONTS}</style>
        <OuterSlide>
          <TapeStrip rotate={-3} />
          <PolaroidCard dark rotate={1.8} counter={counter}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 84, fontWeight: 900, color: "#FFFFFF", lineHeight: 1.0, marginBottom: 40, letterSpacing: -2 }}>
              {renderTitle(slide.title, { color: "#FFFFFF" })}
            </h2>
            <div style={{ width: 60, height: 3, background: "#FFFFFF", marginBottom: 36 }} />
            <p style={{ fontSize: scaleContentFontSize(slide.content, 28), color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: 44 }}>
              {renderContent(slide.content)}
            </p>
            <div style={{ background: "#FFFFFF", color: "#1A1A1A", fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, padding: "18px 0", textAlign: "center", letterSpacing: 1 }}>
              swipely.ai — бесплатно
            </div>
          </PolaroidCard>
        </OuterSlide>
      </div>
    );
  }

  // ── SPLIT ──
  if (layout === "split") {
    const bg = slideNumber % 2 === 0 ? "#EDEAE4" : "#F2EDE6";
    return (
      <div style={wrapStyle}>
        <style>{FONTS}</style>
        <OuterSlide>
          <PolaroidCard rotate={-0.8} counter={counter}>
            <div style={{ background: "#F5F0E8", height: 260, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 32, border: "1px solid #E8E0D4", position: "relative", overflow: "hidden" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 180, fontWeight: 900, color: "#E8E0D4", lineHeight: 1, position: "absolute" }}>{new Date().getFullYear()}</div>
              <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, color: "#888", letterSpacing: 2, marginBottom: 10, textTransform: "uppercase" as const }}>Слайд {slideNumber}</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 48, fontWeight: 700, color: "#1A1A1A" }}>
                  {renderTitle(slide.title, hlStyle)}
                </div>
              </div>
            </div>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: scaleContentFontSize(slide.content, 28), color: "#666", lineHeight: 1.65 }}>
              {renderContent(slide.content)}
            </p>
          </PolaroidCard>
        </OuterSlide>
      </div>
    );
  }

  // ── CENTERED ──
  return (
    <div style={wrapStyle}>
      <style>{FONTS}</style>
      <OuterSlide>
        <TapeStrip rotate={1.5} />
        <PolaroidCard rotate={0.5} counter={counter}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, color: "#BBB", letterSpacing: 3, textTransform: "uppercase" as const, marginBottom: 24 }}>
            {slide.type === "value" ? "Ценность" : "Инсайт"}
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: scaleContentFontSize(slide.title, 72), fontWeight: 900, color: "#1A1A1A", lineHeight: 1.0, marginBottom: 36, letterSpacing: -2 }}>
            {renderTitle(slide.title, hlStyle)}
          </h2>
          <div style={{ width: 60, height: 3, background: "#1A1A1A", marginBottom: 32 }} />
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: scaleContentFontSize(slide.content, 28), color: "#555", lineHeight: 1.65, marginBottom: 36 }}>
            {renderContent(slide.content)}
          </p>
        </PolaroidCard>
      </OuterSlide>
    </div>
  );
}
```

- [ ] **Step 2: Register in SlideRenderer.tsx**

```tsx
import PolaroidSlide from "./templates/PolaroidSlide";
// ...
polaroid: PolaroidSlide,
```

- [ ] **Step 3: Register in registry.ts**

```ts
{
  id: "polaroid",
  name: "Polaroid",
  nameRu: "Поляроид",
  description: "Тёплый аналоговый стиль — белая карточка, скотч и Playfair Display",
  preview: "/previews/polaroid.png",
  tags: ["светлый", "серифный", "личный"],
  maxWordsPerSlide: 30,
  tone: "friendly",
},
```

- [ ] **Step 4: Verify & commit**

```bash
cd swipely-nextjs && npm run dev
# проверить все типы слайдов
git add components/slides/templates/PolaroidSlide.tsx components/slides/SlideRenderer.tsx lib/templates/registry.ts
git commit -m "feat(templates): add Polaroid slide template"
```

---

## Task 3: BlueprintSlide

### Files
- Create: `swipely-nextjs/components/slides/templates/BlueprintSlide.tsx`
- Modify: `swipely-nextjs/components/slides/SlideRenderer.tsx`
- Modify: `swipely-nextjs/lib/templates/registry.ts`

### Design spec
- **Palette:** background `#0D1B2A`, accent `#FF6B35`, text `#FFFFFF`, muted `rgba(255,255,255,0.5)`, dimmed `rgba(255,255,255,0.25)`
- **Fonts:** Space Grotesk (400, 500, 600, 700) + Playfair Display italic for quote
- **Grid texture:** `linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)` both axes at `54px 54px`
- **Accents:** left orange border (4px), annotation arrows `►`, dimension lines, legend box bottom-right

### Layout variants

**hero:** `SCHEMA v1.0` + `REV 01/N` header, `► ТЕМА` annotation, huge title (118px), orange divider with label, body text, legend box

**split:** Left 4px orange border, "COMPONENT NN" label, `► ПРОБЛЕМА/РЕШЕНИЕ`, title (84px), horizontal rule, body paragraph

**centered (value/insight):** annotation tag, title, numbered list with orange circles (`border: 1.5px solid #FF6B35`), last item filled orange

**quote:** Top 3px orange bar, huge faint `"`, left border, italic Playfair title, divider, attribution

**cta:** Left 4px orange bar (full height), `► СЛЕДУЮЩИЙ ШАГ`, big title, orange filled button `→ swipely.ai`, subtext, legend box

### Steps

- [ ] **Step 1: Create BlueprintSlide.tsx**

```tsx
"use client";
import React from "react";
import type { SlideProps } from "../types";
import { renderTitle, renderContent, getSlideDimensions, scaleContentFontSize, getLayoutVariant } from "../utils";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Playfair+Display:ital,wght@1,700&display=swap');`;
const GRID_BG = `linear-gradient(rgba(255,255,255,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.035) 1px,transparent 1px)`;
const BG = "#0D1B2A";
const ACCENT = "#FF6B35";

function GridSlide({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: BG, padding: "72px 80px", display: "flex", flexDirection: "column", fontFamily: "'Space Grotesk', sans-serif", position: "relative", overflow: "hidden", boxSizing: "border-box", ...style }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: GRID_BG, backgroundSize: "54px 54px" }} />
    </div>
  );
}

function LegendBox({ text = "SWIPELY.AI" }: { text?: string }) {
  return (
    <div style={{ position: "absolute", bottom: 60, right: 72, border: `1px solid rgba(255,255,255,0.12)`, padding: "18px 24px", zIndex: 5 }}>
      <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 18, letterSpacing: 2 }}>{text}</div>
    </div>
  );
}

function Label({ text }: { text: string }) {
  return <div style={{ color: ACCENT, fontSize: 22, letterSpacing: 2, marginBottom: 20, fontWeight: 600 }}>► {text}</div>;
}

export default function BlueprintSlide({ slide, slideNumber, totalSlides, format }: SlideProps) {
  const { width, height } = getSlideDimensions(format);
  const layout = getLayoutVariant(slide.type, slideNumber, totalSlides);
  const hlStyle: React.CSSProperties = { color: ACCENT };
  const rev = `REV ${String(slideNumber).padStart(2, "0")} / ${String(totalSlides).padStart(2, "0")}`;
  const base: React.CSSProperties = { width, height };

  // ── HERO ──
  if (layout === "hero") {
    return (
      <div style={{ ...base, background: BG, padding: "72px 80px", display: "flex", flexDirection: "column", fontFamily: "'Space Grotesk', sans-serif", position: "relative", overflow: "hidden", boxSizing: "border-box" }}>
        <style>{FONTS}</style>
        <div style={{ position: "absolute", inset: 0, backgroundImage: GRID_BG, backgroundSize: "54px 54px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 64, zIndex: 5, flexShrink: 0 }}>
          <span style={{ fontSize: 18, fontWeight: 500, color: "rgba(255,255,255,0.35)", letterSpacing: 4, textTransform: "uppercase" as const }}>SCHEMA v1.0</span>
          <span style={{ fontSize: 18, color: "rgba(255,255,255,0.25)", letterSpacing: 2 }}>{rev}</span>
        </div>
        <div style={{ position: "relative", zIndex: 5, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Label text={slide.type?.toUpperCase() || "ОБЗОР"} />
          <h1 style={{ fontSize: 118, fontWeight: 700, color: "#FFFFFF", lineHeight: 0.92, letterSpacing: -5, marginBottom: 52 }}>
            {renderTitle(slide.title, hlStyle)}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 40 }}>
            <div style={{ flex: 1, height: 1, background: ACCENT, opacity: 0.5 }} />
            <span style={{ color: ACCENT, fontSize: 18, letterSpacing: 3, opacity: 0.7 }}>РАЗБОР</span>
            <div style={{ flex: 1, height: 1, background: ACCENT, opacity: 0.5 }} />
          </div>
          <p style={{ fontSize: scaleContentFontSize(slide.content, 30), fontWeight: 400, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
            {renderContent(slide.content)}
          </p>
        </div>
        <LegendBox />
      </div>
    );
  }

  // ── QUOTE ──
  if (layout === "quote") {
    return (
      <div style={{ ...base, background: "#0A1520", padding: "80px", display: "flex", flexDirection: "column", fontFamily: "'Space Grotesk', sans-serif", position: "relative", overflow: "hidden", boxSizing: "border-box", justifyContent: "center" }}>
        <style>{FONTS}</style>
        <div style={{ position: "absolute", inset: 0, backgroundImage: GRID_BG, backgroundSize: "54px 54px" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: ACCENT }} />
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 200, color: ACCENT, opacity: 0.15, lineHeight: 0.7, marginBottom: 32, position: "relative", zIndex: 2 }}>"</div>
        <div style={{ borderLeft: `3px solid rgba(255,107,53,0.5)`, paddingLeft: 48, position: "relative", zIndex: 2 }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: scaleContentFontSize(slide.title, 72), fontWeight: 700, fontStyle: "italic", color: "#FFFFFF", lineHeight: 1.15, marginBottom: 40 }}>
            {renderTitle(slide.title, { color: ACCENT, fontStyle: "italic" })}
          </h1>
          <div style={{ height: 1, background: "rgba(255,255,255,0.1)", marginBottom: 28 }} />
          <p style={{ fontSize: 26, color: `rgba(255,107,53,0.7)`, letterSpacing: 1 }}>{slide.content}</p>
        </div>
        <div style={{ position: "absolute", bottom: 60, right: 72, fontSize: 18, color: "rgba(255,255,255,0.15)", letterSpacing: 2, zIndex: 5 }}>{slideNumber} / {totalSlides}</div>
      </div>
    );
  }

  // ── CTA ──
  if (layout === "cta") {
    return (
      <div style={{ ...base, background: BG, padding: "80px", display: "flex", flexDirection: "column", fontFamily: "'Space Grotesk', sans-serif", position: "relative", overflow: "hidden", boxSizing: "border-box", justifyContent: "center" }}>
        <style>{FONTS}</style>
        <div style={{ position: "absolute", inset: 0, backgroundImage: GRID_BG, backgroundSize: "54px 54px" }} />
        <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 4, background: ACCENT }} />
        <div style={{ position: "relative", zIndex: 5, width: "100%" }}>
          <Label text="СЛЕДУЮЩИЙ ШАГ" />
          <h1 style={{ fontSize: 100, fontWeight: 700, color: "#FFFFFF", lineHeight: 0.95, letterSpacing: -4, marginBottom: 56 }}>
            {renderTitle(slide.title, { color: ACCENT })}
          </h1>
          <div style={{ background: ACCENT, color: "#FFFFFF", fontSize: 28, fontWeight: 700, padding: "24px 48px", display: "inline-block", letterSpacing: 1, marginBottom: 40 }}>
            → swipely.ai
          </div>
          <p style={{ fontSize: scaleContentFontSize(slide.content, 24), color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
            {renderContent(slide.content)}
          </p>
        </div>
        <LegendBox text={rev} />
      </div>
    );
  }

  // ── SPLIT ──
  if (layout === "split") {
    const label = slide.type === "tension" ? "ПРОБЛЕМА" : "РЕШЕНИЕ";
    return (
      <div style={{ ...base, background: BG, padding: "72px 80px", display: "flex", flexDirection: "column", fontFamily: "'Space Grotesk', sans-serif", position: "relative", overflow: "hidden", boxSizing: "border-box" }}>
        <style>{FONTS}</style>
        <div style={{ position: "absolute", inset: 0, backgroundImage: GRID_BG, backgroundSize: "54px 54px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 48, zIndex: 5, flexShrink: 0 }}>
          <span style={{ fontSize: 18, color: "rgba(255,255,255,0.25)", letterSpacing: 3 }}>COMPONENT {String(slideNumber).padStart(2, "0")}</span>
          <span style={{ fontSize: 18, color: "rgba(255,255,255,0.2)" }}>{rev}</span>
        </div>
        <div style={{ display: "flex", gap: 0, zIndex: 5, flex: 1, alignItems: "stretch" }}>
          <div style={{ width: 4, background: ACCENT, opacity: 0.6, flexShrink: 0, marginRight: 48 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <Label text={label} />
              <h1 style={{ fontSize: scaleContentFontSize(slide.title, 84), fontWeight: 700, color: "#FFFFFF", lineHeight: 0.95, letterSpacing: -3, marginBottom: 40 }}>
                {renderTitle(slide.title, hlStyle)}
              </h1>
            </div>
            <div>
              <div style={{ height: 1, background: "rgba(255,255,255,0.1)", marginBottom: 32 }} />
              <p style={{ fontSize: scaleContentFontSize(slide.content, 28), color: "rgba(255,255,255,0.5)", lineHeight: 1.65 }}>
                {renderContent(slide.content)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── CENTERED (value/insight) ──
  return (
    <div style={{ ...base, background: BG, padding: "72px 80px", display: "flex", flexDirection: "column", fontFamily: "'Space Grotesk', sans-serif", position: "relative", overflow: "hidden", boxSizing: "border-box" }}>
      <style>{FONTS}</style>
      <div style={{ position: "absolute", inset: 0, backgroundImage: GRID_BG, backgroundSize: "54px 54px" }} />
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 40, zIndex: 5, flexShrink: 0 }}>
        <span style={{ fontSize: 18, color: "rgba(255,255,255,0.25)", letterSpacing: 3 }}>COMPONENT {String(slideNumber).padStart(2, "0")}</span>
        <span style={{ fontSize: 18, color: "rgba(255,255,255,0.2)" }}>{slideNumber} / {totalSlides}</span>
      </div>
      <div style={{ zIndex: 5, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <Label text={slide.type === "value" ? "ЦЕННОСТЬ" : "ИНСАЙТ"} />
          <h1 style={{ fontSize: scaleContentFontSize(slide.title, 84), fontWeight: 700, color: "#FFFFFF", lineHeight: 0.95, letterSpacing: -3, marginBottom: 48 }}>
            {renderTitle(slide.title, hlStyle)}
          </h1>
        </div>
        <div>
          <p style={{ fontSize: scaleContentFontSize(slide.content, 30), color: "rgba(255,255,255,0.6)", lineHeight: 1.65 }}>
            {renderContent(slide.content)}
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Register in SlideRenderer.tsx**

```tsx
import BlueprintSlide from "./templates/BlueprintSlide";
// ...
blueprint: BlueprintSlide,
```

- [ ] **Step 3: Register in registry.ts**

```ts
{
  id: "blueprint",
  name: "Blueprint",
  nameRu: "Чертёж",
  description: "Тёмно-синий технический стиль с оранжевым акцентом и сеткой",
  preview: "/previews/blueprint.png",
  tags: ["тёмный", "tech", "структурированный"],
  maxWordsPerSlide: 30,
  tone: "professional",
},
```

- [ ] **Step 4: Verify & commit**

```bash
cd swipely-nextjs && npm run dev
git add components/slides/templates/BlueprintSlide.tsx components/slides/SlideRenderer.tsx lib/templates/registry.ts
git commit -m "feat(templates): add Blueprint slide template"
```

---

## Task 4: MagazineSlide

### Files
- Create: `swipely-nextjs/components/slides/templates/MagazineSlide.tsx`
- Modify: `swipely-nextjs/components/slides/SlideRenderer.tsx`
- Modify: `swipely-nextjs/lib/templates/registry.ts`

### Design spec
- **Palette:** background `#F8F6F1` (off-white), left panel `#1A1A1A` (or `#E8001D` accent), text `#1A1A1A`, muted `#888`, red `#E8001D`
- **Fonts:** Bebas Neue (number in left panel) + Playfair Display (title) + Inter (body/UI)
- **Structure:** Two-column — left panel 260px wide with slide number, right panel flex:1 with content
- **Top bar:** `#1A1A1A`, 12px height
- **Bottom bar:** `#E8001D` or `#1A1A1A`, 10px height — alternates for visual rhythm
- **Left panel number:** Bebas Neue 200px, white on dark bg; ghost number 360px opacity 0.06 as watermark
- **Author block:** small avatar circle + name + subtitle, bottom of right panel, separated by `border-top: 1px solid #E0E0E0`

### Layout variants

**hero:** black left panel, red bottom bar, red divider bar (4px) before title, Playfair Display title

**split (tension/contrast):** red left panel (red number), black bottom bar, "Проблема"/"Решение" badge tag

**centered (value/insight):** grey/light left panel (`#F0EDE6`), black number, red bottom bar, body with `→` list items in `#E8001D`

**quote:** full-width dark slide (no two-column), white italic Playfair quote, red top bar, ghost `"` mark

**cta:** red left panel, red top + black bottom bar, Playfair title, black CTA button

### Steps

- [ ] **Step 1: Create MagazineSlide.tsx**

```tsx
"use client";
import React from "react";
import type { SlideProps } from "../types";
import { renderTitle, renderContent, getSlideDimensions, scaleContentFontSize, getLayoutVariant } from "../utils";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Inter:wght@400;500;600;700;800&display=swap');`;
const RED = "#E8001D";
const DARK = "#1A1A1A";
const BG = "#F8F6F1";

function TopBar({ color = DARK }: { color?: string }) {
  return <div style={{ background: color, height: 12, width: "100%", flexShrink: 0 }} />;
}
function BottomBar({ color = RED }: { color?: string }) {
  return <div style={{ background: color, height: 10, width: "100%", flexShrink: 0 }} />;
}

function NumberPanel({
  num,
  bg = DARK,
  textColor = "#FFFFFF",
}: {
  num: string;
  bg?: string;
  textColor?: string;
}) {
  return (
    <div style={{ width: 260, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative", overflow: "hidden" }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 360, color: textColor, opacity: 0.06, position: "absolute", lineHeight: 1 }}>{num}</div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 200, color: textColor, lineHeight: 1, position: "relative", zIndex: 2 }}>{num}</div>
    </div>
  );
}

function AuthorBlock({ username }: { username?: string }) {
  const name = username || "swipely";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, borderTop: "1px solid #E0E0E0", paddingTop: 20 }}>
      <div style={{ width: 48, height: 48, borderRadius: "50%", background: DARK, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#FFF", flexShrink: 0 }}>
        {name.charAt(0).toUpperCase()}
      </div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: DARK }}>@{name}</div>
        <div style={{ fontSize: 14, color: "#888" }}>AI Carousel</div>
      </div>
    </div>
  );
}

export default function MagazineSlide({ slide, slideNumber, totalSlides, format, username }: SlideProps) {
  const { width, height } = getSlideDimensions(format);
  const layout = getLayoutVariant(slide.type, slideNumber, totalSlides);
  const num = String(slideNumber).padStart(2, "0");
  const hlStyle: React.CSSProperties = { color: RED };
  const base: React.CSSProperties = { width, height, fontFamily: "'Inter', sans-serif", overflow: "hidden", boxSizing: "border-box", display: "flex", flexDirection: "column" };
  const masthead = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 18, fontWeight: 500, color: "#888", letterSpacing: 3, textTransform: "uppercase" as const }}>Swipely Review</span>
      <span style={{ fontSize: 18, color: "#888" }}>{slideNumber} / {totalSlides}</span>
    </div>
  );

  // ── QUOTE — full width dark ──
  if (layout === "quote") {
    return (
      <div style={{ ...base, background: DARK }}>
        <style>{FONTS}</style>
        <TopBar color={RED} />
        <div style={{ flex: 1, padding: "72px 80px", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 280, color: "rgba(255,255,255,0.04)", lineHeight: 0.7, position: "absolute", top: 60, left: 60 }}>"</div>
          <div style={{ position: "relative", zIndex: 2 }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: scaleContentFontSize(slide.title, 88), fontWeight: 900, fontStyle: "italic", color: "#FFFFFF", lineHeight: 1.1, letterSpacing: -2, marginBottom: 48 }}>
              {renderTitle(slide.title, { color: RED, fontStyle: "italic" })}
            </h1>
            <div style={{ width: 60, height: 3, background: RED, marginBottom: 28 }} />
            <p style={{ fontSize: 24, color: "#555", fontWeight: 500, letterSpacing: 1 }}>{slide.content}</p>
          </div>
        </div>
        <div style={{ background: DARK, borderTop: "1px solid #2A2A2A", height: 56, display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 80px", flexShrink: 0 }}>
          <span style={{ fontSize: 18, color: "#333" }}>{slideNumber} / {totalSlides}</span>
        </div>
      </div>
    );
  }

  // ── HERO ──
  if (layout === "hero") {
    return (
      <div style={base}>
        <style>{FONTS}</style>
        <TopBar color={DARK} />
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <NumberPanel num={num} bg={DARK} />
          <div style={{ flex: 1, padding: "60px 60px 60px 52px", display: "flex", flexDirection: "column", justifyContent: "space-between", background: BG }}>
            {masthead}
            <div>
              <div style={{ width: 56, height: 4, background: RED, marginBottom: 28 }} />
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: scaleContentFontSize(slide.title, 100), fontWeight: 900, color: DARK, lineHeight: 0.95, letterSpacing: -3, marginBottom: 32 }}>
                {renderTitle(slide.title, hlStyle)}
              </h1>
              <p style={{ fontSize: scaleContentFontSize(slide.content, 26), fontWeight: 400, color: "#666", lineHeight: 1.6 }}>
                {renderContent(slide.content)}
              </p>
            </div>
            <AuthorBlock username={username} />
          </div>
        </div>
        <BottomBar color={RED} />
      </div>
    );
  }

  // ── SPLIT ──
  if (layout === "split") {
    const panelBg = RED;
    const badge = slide.type === "tension" ? "Проблема" : "Решение";
    return (
      <div style={base}>
        <style>{FONTS}</style>
        <TopBar color={DARK} />
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <NumberPanel num={num} bg={panelBg} />
          <div style={{ flex: 1, padding: "60px 60px 60px 52px", display: "flex", flexDirection: "column", justifyContent: "space-between", background: BG }}>
            {masthead}
            <div>
              <div style={{ background: DARK, color: "#FFFFFF", fontSize: 20, fontWeight: 700, letterSpacing: 2, padding: "10px 18px", display: "inline-block", marginBottom: 28, textTransform: "uppercase" as const }}>{badge}</div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: scaleContentFontSize(slide.title, 86), fontWeight: 900, color: DARK, lineHeight: 1.0, letterSpacing: -2, marginBottom: 28 }}>
                {renderTitle(slide.title, hlStyle)}
              </h1>
              <p style={{ fontSize: scaleContentFontSize(slide.content, 26), color: "#555", lineHeight: 1.6 }}>
                {renderContent(slide.content)}
              </p>
            </div>
            <div style={{ borderTop: "1px solid #E0E0E0", paddingTop: 20, fontSize: 18, color: "#AAA" }}>@{username || "swipely"} · AI Carousel</div>
          </div>
        </div>
        <BottomBar color={DARK} />
      </div>
    );
  }

  // ── CENTERED ──
  if (layout === "centered") {
    return (
      <div style={base}>
        <style>{FONTS}</style>
        <TopBar color={DARK} />
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <NumberPanel num={num} bg="#F0EDE6" textColor={DARK} />
          <div style={{ flex: 1, padding: "60px 60px 60px 52px", display: "flex", flexDirection: "column", justifyContent: "space-between", background: BG, borderLeft: "1px solid #E0DDD6" }}>
            {masthead}
            <div>
              <div style={{ width: 56, height: 4, background: DARK, marginBottom: 28 }} />
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: scaleContentFontSize(slide.title, 76), fontWeight: 900, color: DARK, lineHeight: 1.05, letterSpacing: -2, marginBottom: 32 }}>
                {renderTitle(slide.title, hlStyle)}
              </h1>
              <p style={{ fontSize: scaleContentFontSize(slide.content, 24), color: "#555", lineHeight: 1.65 }}>
                {renderContent(slide.content)}
              </p>
            </div>
            <div style={{ borderTop: "1px solid #E0E0E0", paddingTop: 20, fontSize: 16, color: "#AAA" }}>@{username || "swipely"} · AI Carousel</div>
          </div>
        </div>
        <BottomBar color={RED} />
      </div>
    );
  }

  // ── CTA ──
  return (
    <div style={base}>
      <style>{FONTS}</style>
      <TopBar color={RED} />
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <NumberPanel num={num} bg={RED} />
        <div style={{ flex: 1, padding: "60px 60px 60px 52px", display: "flex", flexDirection: "column", justifyContent: "space-between", background: BG }}>
          {masthead}
          <div>
            <div style={{ width: 56, height: 4, background: RED, marginBottom: 28 }} />
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: scaleContentFontSize(slide.title, 96), fontWeight: 900, color: DARK, lineHeight: 0.95, letterSpacing: -3, marginBottom: 36 }}>
              {renderTitle(slide.title, hlStyle)}
            </h1>
            <div style={{ background: DARK, color: "#FFFFFF", fontSize: 26, fontWeight: 700, padding: "20px 32px", display: "inline-block", marginBottom: 24, letterSpacing: 1 }}>
              → swipely.ai
            </div>
            <p style={{ fontSize: 22, color: "#888" }}>{slide.content}</p>
          </div>
          <AuthorBlock username={username} />
        </div>
      </div>
      <BottomBar color={DARK} />
    </div>
  );
}
```

- [ ] **Step 2: Register in SlideRenderer.tsx**

```tsx
import MagazineSlide from "./templates/MagazineSlide";
// ...
magazine: MagazineSlide,
```

- [ ] **Step 3: Register in registry.ts**

```ts
{
  id: "magazine",
  name: "Magazine",
  nameRu: "Журнал",
  description: "Редакционный двухколоночный стиль — Bebas Neue, Playfair Display, красный акцент",
  preview: "/previews/magazine.png",
  tags: ["светлый", "серифный", "эдиториал"],
  maxWordsPerSlide: 35,
  tone: "professional",
},
```

- [ ] **Step 4: Verify & commit**

```bash
cd swipely-nextjs && npm run dev
git add components/slides/templates/MagazineSlide.tsx components/slides/SlideRenderer.tsx lib/templates/registry.ts
git commit -m "feat(templates): add Magazine slide template"
```

---

## Final commit

После всех 4 шаблонов:

```bash
cd swipely-nextjs && npm run lint
git log --oneline -5
```
