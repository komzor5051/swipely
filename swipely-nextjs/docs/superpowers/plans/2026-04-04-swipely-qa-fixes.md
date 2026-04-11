# Swipely QA Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 5 confirmed production bugs found during QA audit: missing designPresets, broken B2B presets sync, webhook error swallowing, missing slide validation, and no 429 retry.

**Architecture:** All fixes are isolated patches to existing files — no new abstractions, no new files. Each task is a targeted edit in one or two files.

**Tech Stack:** Next.js 16, TypeScript, Supabase, Gemini AI, AuraPay webhooks

---

## Files Modified

- `app/api/generate/route.ts` — add `newspaper` preset, slide validation, 429 retry
- `app/api/v1/generate/route.ts` — sync 9 missing designPresets from main route
- `app/api/webhooks/aurapay/route.ts` — fix catch block to return 500 on unexpected errors

---

## Task 1: Add `newspaper` to main generate designPresets

**Problem:** `newspaper` template (proOnly) exists in `lib/templates/registry.ts` but has NO entry in `designPresets` in `app/api/generate/route.ts`. When selected, Gemini uses `designPresets.swipely` fallback — wrong tone and style for a newspaper template.

**Files:**
- Modify: `app/api/generate/route.ts:35` (after `wabi` entry, before `onetwo_dark`)

- [ ] **Step 1: Add newspaper to designPresets**

In `app/api/generate/route.ts`, find the `designPresets` object. After the `wabi` entry (line ~35) and before `onetwo_dark`, add:

```typescript
  newspaper: { name: "Newspaper", max_words_per_slide: 30, tone: "classic editorial, authoritative, structured. Заголовки как газетные — информативные, точные, без кликбейта. Content — факты и аргументы, чёткие абзацы. Стиль The Times: серьёзный, уважительный к читателю." },
```

The current sequence is:
```
  wabi: { name: "Wabi", ... },
  onetwo_dark: { name: "OneTwoPrime Dark", ... },
```

It should become:
```
  wabi: { name: "Wabi", max_words_per_slide: 25, tone: "wabi-sabi, earthy, textured, imperfect beauty. Заголовки созерцательные и философские." },
  newspaper: { name: "Newspaper", max_words_per_slide: 30, tone: "classic editorial, authoritative, structured. Заголовки как газетные — информативные, точные, без кликбейта. Content — факты и аргументы, чёткие абзацы. Стиль The Times: серьёзный, уважительный к читателю." },
  onetwo_dark: { name: "OneTwoPrime Dark", max_words_per_slide: 30, tone: "corporate, strict, professional, dark theme. Заголовки деловые и прямые." },
```

- [ ] **Step 2: Verify count**

The designPresets object should now have 24 entries (was 23). Count the keys manually to confirm.

- [ ] **Step 3: Commit**

```bash
cd "/Users/lvmn/Desktop/Бизнес/02_SaaS_Продукты/ai projects /swipely /swipely-nextjs"
git add app/api/generate/route.ts
git commit -m "fix: add newspaper to designPresets in main generate route"
```

---

## Task 2: Sync B2B API designPresets (9 missing templates)

**Problem:** `app/api/v1/generate/route.ts` (B2B API) has only 15 designPresets while main route has 24. Missing: terminal, nikkei, swiss, kinfolk, blueprint, polaroid, magazine, wabi, terracot. B2B clients requesting these templates get swipely fallback — wrong AI output.

**Files:**
- Modify: `app/api/v1/generate/route.ts:16-34`

- [ ] **Step 1: Add 9 missing presets to B2B designPresets**

In `app/api/v1/generate/route.ts`, find the `designPresets` object (lines 16-34). After `frame` and before `newspaper`, add the 7 missing non-tenant templates. Then after `onetwo_white` add `terracot`.

Current ending of the object:
```typescript
  frame: { name: "Frame", max_words_per_slide: 30, tone: "premium, refined, poetic" },
  newspaper: { name: "Newspaper", max_words_per_slide: 30, tone: "classic editorial, structured, authoritative" },
  // Tenant-specific template presets
  client_custom_v1: { name: "Client Custom", max_words_per_slide: 30, tone: "professional, direct, results-oriented" },
  // OneTwoPrime tenant templates
  onetwo_dark: { name: "OneTwoPrime Dark", max_words_per_slide: 30, tone: "premium, real estate, personal brand, aspirational" },
  onetwo_white: { name: "OneTwoPrime White", max_words_per_slide: 30, tone: "clean, real estate, educational, professional" },
};
```

Replace with (add terminal through wabi before newspaper, add terracot before onetwo_dark):
```typescript
  frame: { name: "Frame", max_words_per_slide: 30, tone: "premium, refined, poetic" },
  terminal: { name: "Terminal", max_words_per_slide: 30, tone: "hacker, tech, monospace, CLI-style. Заголовки как команды терминала — короткие, технические." },
  nikkei: { name: "Nikkei", max_words_per_slide: 25, tone: "Japanese minimalism, editorial, contrast. Заголовки лаконичные, как заголовки в Nikkei Asia." },
  swiss: { name: "Swiss", max_words_per_slide: 30, tone: "Swiss typography, grid-based, Helvetica-style, structured. Заголовки строгие, информативные." },
  kinfolk: { name: "Kinfolk", max_words_per_slide: 30, tone: "warm minimalism, serif, calm, thoughtful. Заголовки тихие и глубокие, как статьи Kinfolk." },
  blueprint: { name: "Blueprint", max_words_per_slide: 30, tone: "engineering, technical, schematic. Заголовки как названия чертежей — точные и функциональные." },
  polaroid: { name: "Polaroid", max_words_per_slide: 25, tone: "nostalgic, handwritten, personal. Заголовки как подписи к полароидным снимкам — тёплые и личные." },
  magazine: { name: "Magazine", max_words_per_slide: 30, tone: "glossy editorial, bold typography, magazine cover style. Заголовки крупные и цепляющие." },
  wabi: { name: "Wabi", max_words_per_slide: 25, tone: "wabi-sabi, earthy, textured, imperfect beauty. Заголовки созерцательные и философские." },
  newspaper: { name: "Newspaper", max_words_per_slide: 30, tone: "classic editorial, structured, authoritative" },
  // Tenant-specific template presets
  client_custom_v1: { name: "Client Custom", max_words_per_slide: 30, tone: "professional, direct, results-oriented" },
  // OneTwoPrime tenant templates
  terracot: { name: "Terracot", max_words_per_slide: 45, tone: "editorial, warm, premium cheatsheet style. Section labels are short category words. Headlines are bold declarative statements, 4-8 words max. Content is substantive — 2-3 short paragraphs with useful information. For slides with type 'tension' or 'contrast', write content as terminal commands or step-by-step pipeline." },
  onetwo_dark: { name: "OneTwoPrime Dark", max_words_per_slide: 30, tone: "premium, real estate, personal brand, aspirational" },
  onetwo_white: { name: "OneTwoPrime White", max_words_per_slide: 30, tone: "clean, real estate, educational, professional" },
};
```

- [ ] **Step 2: Verify count**

The B2B designPresets should now have 24 entries (was 15). Count manually.

- [ ] **Step 3: Commit**

```bash
cd "/Users/lvmn/Desktop/Бизнес/02_SaaS_Продукты/ai projects /swipely /swipely-nextjs"
git add app/api/v1/generate/route.ts
git commit -m "fix: sync 9 missing designPresets from main route to B2B API"
```

---

## Task 3: Fix webhook catch block — return 500 on unexpected errors

**Problem:** `app/api/webhooks/aurapay/route.ts` catch block (line 197-200) returns HTTP 200 for ALL exceptions including DB connection failures. If the DB is down during subscription activation, AuraPay sees 200 and stops retrying → user paid but subscription not activated.

The CORRECT behaviour:
- Intentional early returns (status not PAID, unknown invoice, already processed) → 200 (don't retry)
- Unexpected catch-all exceptions → 500 (let AuraPay retry)

**Files:**
- Modify: `app/api/webhooks/aurapay/route.ts:197-200`

- [ ] **Step 1: Change catch block to return 500**

Find the catch block at the bottom of the file:
```typescript
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: true }); // Always return 200 to AuraPay
  }
```

Replace with:
```typescript
  } catch (error) {
    console.error("Webhook unexpected error:", error);
    // Return 500 so AuraPay retries on transient failures (DB down, network errors).
    // Intentional early returns (unknown invoice, already processed) above still return 200.
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
```

- [ ] **Step 2: Verify the intentional 200 returns above are untouched**

Confirm that these specific early returns still return 200 (they are intentional — not errors, not retriable):
- Line 50: `if (body.status !== "PAID")` → `return NextResponse.json({ ok: true })` ✓
- Line 56: `if (!invoiceId)` → `return NextResponse.json({ ok: true })` ✓  
- Line 71: unknown invoice → `return NextResponse.json({ ok: true })` ✓
- Line 77: already processed → `return NextResponse.json({ ok: true })` ✓

These stay as 200. Only the catch block changes.

- [ ] **Step 3: Commit**

```bash
cd "/Users/lvmn/Desktop/Бизнес/02_SaaS_Продукты/ai projects /swipely /swipely-nextjs"
git add app/api/webhooks/aurapay/route.ts
git commit -m "fix: return 500 on unexpected webhook errors so AuraPay retries"
```

---

## Task 4: Add slide validation after JSON.parse

**Problem:** `app/api/generate/route.ts` at line 612 checks `if (carouselData.slides)` but doesn't check for empty array or empty title/content fields. An empty `slides: []` gets saved to DB as a valid generation. Slides with `title: ""` render as blank.

Note: Gemini uses `responseMimeType: "application/json"` with a `responseSchema`, which enforces structure. But Gemini can still return `slides: []` or slides with empty strings.

**Files:**
- Modify: `app/api/generate/route.ts:609-620`

- [ ] **Step 1: Add validation after JSON.parse**

Current code at line 609-620:
```typescript
    const carouselData = JSON.parse(jsonMatch[0]);

    // Clean markdown from slides
    if (carouselData.slides) {
      carouselData.slides = carouselData.slides.map(
        (slide: { title: string; content: string; type: string }) => ({
          ...slide,
          title: cleanMarkdown(slide.title),
          content: preserveText ? slide.content : cleanMarkdown(slide.content),
        })
      );
    }
```

Replace with:
```typescript
    const carouselData = JSON.parse(jsonMatch[0]);

    // Validate parsed structure
    if (!Array.isArray(carouselData.slides) || carouselData.slides.length === 0) {
      console.error("AI returned empty or missing slides array");
      return NextResponse.json({ error: "AI returned empty content. Please try again." }, { status: 502 });
    }

    // Clean markdown from slides and filter out blank slides
    carouselData.slides = carouselData.slides
      .map((slide: { title: string; content: string; type: string }) => ({
        ...slide,
        title: cleanMarkdown(slide.title ?? ""),
        content: preserveText ? (slide.content ?? "") : cleanMarkdown(slide.content ?? ""),
      }))
      .filter((slide: { title: string; content: string }) =>
        slide.title.trim().length > 0 && slide.content.trim().length > 0
      );

    if (carouselData.slides.length === 0) {
      console.error("All slides had empty title or content after cleaning");
      return NextResponse.json({ error: "AI returned empty content. Please try again." }, { status: 502 });
    }
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/lvmn/Desktop/Бизнес/02_SaaS_Продукты/ai projects /swipely /swipely-nextjs"
git add app/api/generate/route.ts
git commit -m "fix: validate slides array after JSON.parse, filter blank slides"
```

---

## Task 5: Add Gemini 429 retry with backoff

**Problem:** `app/api/generate/route.ts` at line 572-575 only retries on 503 (Service Unavailable). Gemini also returns 429 (Too Many Requests / quota exceeded) which is equally transient. Without retry, users see immediate error on quota spikes.

**Files:**
- Modify: `app/api/generate/route.ts:572-576`

- [ ] **Step 1: Add 429 retry**

Current code at line 569-585:
```typescript
  try {
    let geminiResponse = await callGemini();

    // Retry once on 503 Service Unavailable
    if (geminiResponse.status === 503) {
      await new Promise((r) => setTimeout(r, 2000));
      geminiResponse = await callGemini();
    }

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json().catch(() => null);
      console.error("Gemini API error:", geminiResponse.status, errorData);
      return NextResponse.json(
        { error: "AI generation failed" },
        { status: 502 }
      );
    }
```

Replace with:
```typescript
  try {
    let geminiResponse = await callGemini();

    // Retry once on 503 (Service Unavailable) or 429 (Rate Limited) — both are transient
    if (geminiResponse.status === 503 || geminiResponse.status === 429) {
      const retryDelay = geminiResponse.status === 429 ? 3000 : 2000;
      await new Promise((r) => setTimeout(r, retryDelay));
      geminiResponse = await callGemini();
    }

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json().catch(() => null);
      console.error("Gemini API error:", geminiResponse.status, errorData);
      return NextResponse.json(
        { error: "AI generation failed" },
        { status: 502 }
      );
    }
```

- [ ] **Step 2: Verify the change is in the right spot**

Confirm that `callGemini()` is defined above this block (it starts at line 553) and this retry logic is inside the outer try-catch that wraps the full generation.

- [ ] **Step 3: Commit**

```bash
cd "/Users/lvmn/Desktop/Бизнес/02_SaaS_Продукты/ai projects /swipely /swipely-nextjs"
git add app/api/generate/route.ts
git commit -m "fix: retry Gemini on 429 rate limit with 3s backoff"
```

---

## Self-Review Checklist

- [x] Task 1: newspaper preset added to main route → correct template tone for pro users
- [x] Task 2: 9 presets synced to B2B route → B2B clients get proper AI output for all templates
- [x] Task 3: webhook catch returns 500 → AuraPay retries on DB failures → no lost subscriptions
- [x] Task 4: empty slides validated → no blank carousels saved to DB
- [x] Task 5: 429 retried → users see fewer errors during Gemini quota spikes
- [x] No new files created — all fixes are targeted edits
- [x] No placeholders — all code blocks contain actual production code
- [x] Tasks 4 and 5 both modify `app/api/generate/route.ts` — they should be done sequentially (Task 4 first, Task 5 second) to avoid conflicts
