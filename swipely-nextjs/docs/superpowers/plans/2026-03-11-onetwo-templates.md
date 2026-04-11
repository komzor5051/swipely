# OneTwoPrime Tenant Templates Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create two brand-isolated carousel templates (`onetwo_dark`, `onetwo_white`) for the OneTwoPrime B2B tenant, accessible only via their API key, supporting square / portrait / story (9:16) formats.

**Architecture:** Two new React slide components following the existing `ClientCustomV1Slide` pattern, registered in `tenantTemplates[]` with `tenantId: "onetwo_prime"` so the existing API isolation check blocks other tenants. A new `"story"` format (1080×1920) is added to the type system so B2B clients can request Stories/Reels slides.

**Tech Stack:** React 19, TypeScript, inline styles, Google Fonts via `@import url()` in `<style>` tag, Next.js App Router.

---

## Chunk 1: Type system + format support

### Task 1: Add "story" format to type system and dimension utility

**Files:**
- Modify: `components/slides/types.ts`
- Modify: `components/slides/utils.tsx`

No tests exist for this project — verify by running TypeScript check: `cd swipely-nextjs && npx tsc --noEmit`.

- [ ] **Step 1: Extend `SlideProps.format` union in `types.ts`**

Open `components/slides/types.ts`. Change line 12 from:
```ts
format: "square" | "portrait"; // 1080x1080 or 1080x1350
```
to:
```ts
format: "square" | "portrait" | "story"; // 1080x1080 or 1080x1350 or 1080x1920
```

- [ ] **Step 2: Add "story" branch to `getSlideDimensions` in `utils.tsx`**

Open `components/slides/utils.tsx`. Replace the `getSlideDimensions` function (lines 132–136):
```ts
export function getSlideDimensions(format: "square" | "portrait" | "story") {
  if (format === "square") return { width: 1080, height: 1080 };
  if (format === "story") return { width: 1080, height: 1920 };
  return { width: 1080, height: 1350 };
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
cd swipely-nextjs && npx tsc --noEmit
```

Expected: no errors. If you see errors about `format` being narrower than expected, they are fine as long as they are not in `types.ts` or `utils.tsx`.

- [ ] **Step 4: Commit**

```bash
cd swipely-nextjs && git add components/slides/types.ts components/slides/utils.tsx
git commit -m "feat(types): add story format (1080x1920) for Stories/Reels support"
```

---

## Chunk 2: Registry + API route

### Task 2: Register templates in registry and add API design presets

**Files:**
- Modify: `lib/templates/registry.ts`
- Modify: `app/api/v1/generate/route.ts`

- [ ] **Step 1: Add OneTwoPrime entries to `tenantTemplates[]` in `registry.ts`**

Open `lib/templates/registry.ts`. At the end of the `tenantTemplates` array (after the `client_custom_v1` entry), add:

```ts
  {
    id: "onetwo_dark",
    name: "OneTwoPrime Dark",
    nameRu: "ОТП Тёмный",
    description: "Премиальный тёмный шаблон с золотыми акцентами для OneTwoPrime",
    preview: "/previews/onetwo_dark.png",
    tags: ["b2b", "тёмный", "премиальный"],
    maxWordsPerSlide: 30,
    tone: "premium, real estate, personal brand, aspirational",
    tenantId: "onetwo_prime",
  },
  {
    id: "onetwo_white",
    name: "OneTwoPrime White",
    nameRu: "ОТП Белый",
    description: "Чистый светлый шаблон с золотыми акцентами для OneTwoPrime",
    preview: "/previews/onetwo_white.png",
    tags: ["b2b", "светлый", "премиальный"],
    maxWordsPerSlide: 30,
    tone: "clean, real estate, educational, professional",
    tenantId: "onetwo_prime",
  },
```

- [ ] **Step 2: Add design presets to `app/api/v1/generate/route.ts`**

Open `app/api/v1/generate/route.ts`. In the `designPresets` object (after the `client_custom_v1` entry, around line 30), add:

```ts
  // OneTwoPrime tenant templates
  onetwo_dark: { name: "OneTwoPrime Dark", max_words_per_slide: 30, tone: "premium, real estate, personal brand, aspirational" },
  onetwo_white: { name: "OneTwoPrime White", max_words_per_slide: 30, tone: "clean, real estate, educational, professional" },
```

- [ ] **Step 3: Accept "story" format in `app/api/v1/generate/route.ts`**

Find this line (around line 307):
```ts
const resolvedFormat = (format === "square" ? "square" : "portrait") as "square" | "portrait";
```

Replace with:
```ts
const resolvedFormat = (
  format === "square" ? "square" : format === "story" ? "story" : "portrait"
) as "square" | "portrait" | "story";
```

- [ ] **Step 4: Run TypeScript check**

```bash
cd swipely-nextjs && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd swipely-nextjs && git add lib/templates/registry.ts app/api/v1/generate/route.ts
git commit -m "feat(registry): register onetwo_dark and onetwo_white tenant templates"
```

---

## Chunk 3: OneTwoPrimeDarkSlide component

### Task 3: Create `OneTwoPrimeDarkSlide.tsx`

**Files:**
- Create: `components/slides/templates/OneTwoPrimeDarkSlide.tsx`

Design: dark `#080808` background, `#C9A864` gold accents, Playfair Display 800 titles, Inter body. Three slide variants: cover (slide 1), regular content, CTA (type="cta"). Progress dots in footer right-aligned.

- [ ] **Step 1: Create the component file**

Create `components/slides/templates/OneTwoPrimeDarkSlide.tsx` with the following content:

```tsx
"use client";

import React from "react";
import type { SlideProps } from "../types";
import {
  renderTitle,
  renderContent,
  getSlideDimensions,
  scaleContentFontSize,
  getLayoutVariant,
  getContentAlignment,
} from "../utils";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800&family=Inter:wght@400;500;600;700&display=swap');`;

const GOLD = "#C9A864";
const BG = "#080808";
const TEXT = "#FFFFFF";
const TEXT_MUTED = "rgba(245,237,216,0.65)";

export default function OneTwoPrimeDarkSlide({
  slide,
  slideNumber,
  totalSlides,
  format,
}: SlideProps) {
  const { width, height } = getSlideDimensions(format);
  const isStory = format === "story";
  const isCover = slideNumber === 1;
  const isCta = slide.type === "cta";
  const layout = getLayoutVariant(slide.type, slideNumber, totalSlides);
  const alignment = getContentAlignment(layout, slideNumber);

  const vPad = isStory ? 80 : 60;
  const hPad = 72;

  const highlightStyle: React.CSSProperties = {
    color: GOLD,
    display: "inline",
  };

  const titleSize = isCover
    ? isStory ? 96 : 84
    : isStory ? 82 : 72;
  const bodySize = scaleContentFontSize(slide.content, isStory ? 38 : 34);

  return (
    <div
      style={{
        width,
        height,
        background: BG,
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{FONTS}</style>

      {/* Gold top bar */}
      <div style={{ height: 4, background: GOLD, width: "100%", flexShrink: 0 }} />

      {/* Content area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: isCover ? "center" : alignment,
          padding: `${vPad}px ${hPad}px`,
          position: "relative",
        }}
      >
        {/* Slide number — cover: absolute top-right; others: in-flow top-left */}
        {isCover ? (
          <div
            style={{
              position: "absolute",
              top: vPad,
              right: hPad,
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: "0.1em",
              color: GOLD,
            }}
          >
            {String(slideNumber).padStart(2, "0")} / {String(totalSlides).padStart(2, "0")}
          </div>
        ) : (
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: "0.1em",
              color: GOLD,
              marginBottom: 28,
            }}
          >
            {String(slideNumber).padStart(2, "0")} / {String(totalSlides).padStart(2, "0")}
          </div>
        )}

        {/* COVER layout */}
        {isCover && (
          <>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.2em",
                color: GOLD,
                textTransform: "uppercase",
                marginBottom: 24,
              }}
            >
              premium education
            </div>
            <h1
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: titleSize,
                fontWeight: 800,
                lineHeight: 1.05,
                color: TEXT,
                margin: 0,
                marginBottom: 28,
                letterSpacing: "-0.02em",
              }}
            >
              {renderTitle(slide.title, highlightStyle)}
            </h1>
            <p
              style={{
                fontSize: 26,
                fontWeight: 400,
                color: TEXT_MUTED,
                margin: 0,
                lineHeight: 1.55,
              }}
            >
              {renderContent(slide.content)}
            </p>
          </>
        )}

        {/* REGULAR content layout */}
        {!isCover && !isCta && (
          <>
            <h2
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: titleSize,
                fontWeight: 800,
                lineHeight: 1.1,
                color: TEXT,
                margin: 0,
                marginBottom: 24,
                letterSpacing: "-0.02em",
              }}
            >
              {renderTitle(slide.title, highlightStyle)}
            </h2>
            {/* Gold separator */}
            <div
              style={{
                width: 32,
                height: 2,
                background: GOLD,
                marginBottom: 24,
                borderRadius: 1,
              }}
            />
            <p
              style={{
                fontSize: bodySize,
                lineHeight: 1.65,
                color: TEXT_MUTED,
                margin: 0,
                fontWeight: 400,
              }}
            >
              {renderContent(slide.content)}
            </p>
          </>
        )}

        {/* CTA layout */}
        {isCta && (
          <>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.2em",
                color: GOLD,
                textTransform: "uppercase",
                marginBottom: 20,
              }}
            >
              следующий шаг
            </div>
            <h2
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: titleSize,
                fontWeight: 800,
                lineHeight: 1.1,
                color: TEXT,
                margin: 0,
                marginBottom: 36,
                letterSpacing: "-0.02em",
              }}
            >
              {renderTitle(slide.title, highlightStyle)}
            </h2>
            <div
              style={{
                display: "inline-flex",
                alignSelf: "flex-start",
                background: GOLD,
                color: BG,
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: "0.05em",
                padding: "16px 36px",
                borderRadius: 4,
              }}
            >
              {renderContent(slide.content)}
            </div>
          </>
        )}
      </div>

      {/* Footer — progress dots right-aligned */}
      <div
        style={{
          height: 56,
          padding: `0 ${hPad}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {Array.from({ length: totalSlides }).map((_, i) => {
            const active = i === slideNumber - 1;
            return (
              <div
                key={i}
                style={{
                  width: active ? 14 : 5,
                  height: active ? 6 : 5,
                  borderRadius: active ? 3 : "50%",
                  background: GOLD,
                  opacity: active ? 1 : 0.35,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Register in `SlideRenderer.tsx`**

Open `components/slides/SlideRenderer.tsx`. Add import after the last B2B import:
```ts
import OneTwoPrimeDarkSlide from "./templates/OneTwoPrimeDarkSlide";
```

In `TEMPLATE_MAP`, add after `client_custom_v1`:
```ts
  onetwo_dark: OneTwoPrimeDarkSlide,
```

- [ ] **Step 3: Run TypeScript check**

```bash
cd swipely-nextjs && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd swipely-nextjs && git add components/slides/templates/OneTwoPrimeDarkSlide.tsx components/slides/SlideRenderer.tsx
git commit -m "feat(templates): add onetwo_dark tenant template (dark gold premium)"
```

---

## Chunk 4: OneTwoPrimeWhiteSlide component

### Task 4: Create `OneTwoPrimeWhiteSlide.tsx`

**Files:**
- Create: `components/slides/templates/OneTwoPrimeWhiteSlide.tsx`

Design: white `#FFFFFF` background, `#C9A864` gold accents, Playfair Display 800 titles, Inter body. Header row shows slide number with gold divider line. Highlight uses `borderBottom: "3px solid #C9A864"` (inline style — `::after` is not available in React). Progress dots in footer left-aligned.

- [ ] **Step 1: Create the component file**

Create `components/slides/templates/OneTwoPrimeWhiteSlide.tsx` with the following content:

```tsx
"use client";

import React from "react";
import type { SlideProps } from "../types";
import {
  renderTitle,
  renderContent,
  getSlideDimensions,
  scaleContentFontSize,
  getLayoutVariant,
  getContentAlignment,
} from "../utils";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800&family=Inter:wght@400;500;600;700&display=swap');`;

const GOLD = "#C9A864";
const GOLD_LIGHT = "rgba(201,168,100,0.45)";
const BG = "#FFFFFF";
const TEXT = "#111111";
const TEXT_MUTED = "rgba(17,17,17,0.55)";

export default function OneTwoPrimeWhiteSlide({
  slide,
  slideNumber,
  totalSlides,
  format,
}: SlideProps) {
  const { width, height } = getSlideDimensions(format);
  const isStory = format === "story";
  const isCover = slideNumber === 1;
  const isCta = slide.type === "cta";
  const layout = getLayoutVariant(slide.type, slideNumber, totalSlides);
  const alignment = getContentAlignment(layout, slideNumber);

  const vPad = isStory ? 80 : 60;
  const hPad = 72;

  // Gold underline highlight — inline borderBottom (::after not available in React)
  const highlightStyle: React.CSSProperties = {
    display: "inline",
    borderBottom: `3px solid ${GOLD}`,
    paddingBottom: 2,
  };

  const titleSize = isCover
    ? isStory ? 96 : 84
    : isStory ? 82 : 72;
  const bodySize = scaleContentFontSize(slide.content, isStory ? 38 : 34);

  return (
    <div
      style={{
        width,
        height,
        background: BG,
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{FONTS}</style>

      {/* Header row: number — thin line — /total */}
      <div
        style={{
          height: 56,
          padding: `0 ${hPad}px`,
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexShrink: 0,
          borderBottom: "1px solid rgba(201,168,100,0.15)",
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: GOLD,
            letterSpacing: "0.1em",
          }}
        >
          {String(slideNumber).padStart(2, "0")}
        </span>
        <div style={{ flex: 1, height: 1, background: GOLD, opacity: 0.3 }} />
        <span
          style={{
            fontSize: 14,
            fontWeight: 400,
            color: GOLD_LIGHT,
            letterSpacing: "0.1em",
          }}
        >
          /{String(totalSlides).padStart(2, "0")}
        </span>
      </div>

      {/* Content area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: isCover ? "center" : alignment,
          padding: `${vPad}px ${hPad}px`,
        }}
      >
        {/* COVER layout */}
        {isCover && (
          <>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.2em",
                color: TEXT_MUTED,
                textTransform: "uppercase",
                marginBottom: 20,
              }}
            >
              education
            </div>
            {/* Gold bar accent */}
            <div
              style={{
                width: 36,
                height: 4,
                background: GOLD,
                marginBottom: 28,
                borderRadius: 2,
              }}
            />
            <h1
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: titleSize,
                fontWeight: 800,
                lineHeight: 1.05,
                color: TEXT,
                margin: 0,
                marginBottom: 28,
                letterSpacing: "-0.02em",
              }}
            >
              {renderTitle(slide.title, highlightStyle)}
            </h1>
            <p
              style={{
                fontSize: 26,
                fontWeight: 400,
                color: TEXT_MUTED,
                margin: 0,
                lineHeight: 1.55,
              }}
            >
              {renderContent(slide.content)}
            </p>
          </>
        )}

        {/* REGULAR content layout */}
        {!isCover && !isCta && (
          <>
            <h2
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: titleSize,
                fontWeight: 800,
                lineHeight: 1.15,
                color: TEXT,
                margin: 0,
                marginBottom: 32,
                letterSpacing: "-0.02em",
              }}
            >
              {renderTitle(slide.title, highlightStyle)}
            </h2>
            <p
              style={{
                fontSize: bodySize,
                lineHeight: 1.65,
                color: TEXT_MUTED,
                margin: 0,
                fontWeight: 400,
              }}
            >
              {renderContent(slide.content)}
            </p>
          </>
        )}

        {/* CTA layout */}
        {isCta && (
          <>
            {/* Gold top accent bar */}
            <div
              style={{
                width: "100%",
                height: 3,
                background: GOLD,
                marginBottom: 32,
                borderRadius: 2,
              }}
            />
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.2em",
                color: TEXT_MUTED,
                textTransform: "uppercase",
                marginBottom: 20,
              }}
            >
              следующий шаг
            </div>
            <h2
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: titleSize,
                fontWeight: 800,
                lineHeight: 1.1,
                color: TEXT,
                margin: 0,
                marginBottom: 36,
                letterSpacing: "-0.02em",
              }}
            >
              {renderTitle(slide.title, highlightStyle)}
            </h2>
            <div
              style={{
                display: "inline-flex",
                alignSelf: "flex-start",
                background: "#111111",
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: "0.05em",
                padding: "16px 36px",
                borderRadius: 4,
              }}
            >
              {renderContent(slide.content)}
            </div>
          </>
        )}
      </div>

      {/* Footer — progress dots left-aligned */}
      <div
        style={{
          height: 56,
          padding: `0 ${hPad}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          borderTop: "1px solid rgba(201,168,100,0.15)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {Array.from({ length: totalSlides }).map((_, i) => {
            const active = i === slideNumber - 1;
            return (
              <div
                key={i}
                style={{
                  width: active ? 14 : 5,
                  height: active ? 6 : 5,
                  borderRadius: active ? 3 : "50%",
                  background: GOLD,
                  opacity: active ? 1 : 0.3,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Register in `SlideRenderer.tsx`**

Open `components/slides/SlideRenderer.tsx`. Add import after `OneTwoPrimeDarkSlide`:
```ts
import OneTwoPrimeWhiteSlide from "./templates/OneTwoPrimeWhiteSlide";
```

In `TEMPLATE_MAP`, add after `onetwo_dark`:
```ts
  onetwo_white: OneTwoPrimeWhiteSlide,
```

- [ ] **Step 3: Run TypeScript check**

```bash
cd swipely-nextjs && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd swipely-nextjs && git add components/slides/templates/OneTwoPrimeWhiteSlide.tsx components/slides/SlideRenderer.tsx
git commit -m "feat(templates): add onetwo_white tenant template (clean white gold)"
```

---

## Chunk 5: Preview images + push

### Task 5: Add placeholder preview images and push

**Files:**
- Add: `public/previews/onetwo_dark.png`
- Add: `public/previews/onetwo_white.png`

Preview images are 600×600px PNGs. They appear only in the admin panel — not visible to the tenant. Use any placeholder for now; they can be replaced with real screenshots after deploy.

- [ ] **Step 1: Copy an existing preview as placeholder**

```bash
cd swipely-nextjs && cp public/previews/frame.png public/previews/onetwo_dark.png && cp public/previews/newspaper.png public/previews/onetwo_white.png
```

(These will be replaced with real screenshots after first deploy.)

- [ ] **Step 2: Final TypeScript check**

```bash
cd swipely-nextjs && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit and push**

```bash
cd swipely-nextjs && git add public/previews/onetwo_dark.png public/previews/onetwo_white.png
git commit -m "feat(templates): placeholder preview images for onetwo templates"
git push origin main
```

---

## Post-deploy DB step (manual)

After the deploy completes (GitHub Actions → rsync → pm2 restart on Selectel VPS):

In Supabase dashboard → Table Editor → `api_keys` table, find the OneTwoPrime row and set `tenant_id = "onetwo_prime"`.

This is the only step that unlocks access — without it, the API key will get 403 on any `onetwo_dark` or `onetwo_white` request.
