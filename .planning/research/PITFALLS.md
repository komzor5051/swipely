# Domain Pitfalls

**Domain:** Carousel generator SaaS — adding rich slide features to html-to-image export pipeline
**Researched:** 2026-03-19
**Scope:** Milestone 2 additions: layout variants, SVG charts, user photo upload, content calendar

---

## Critical Pitfalls

Mistakes that cause broken exports, silent data loss, or full rewrites.

---

### Pitfall 1: html-to-image Does Not Render `backdrop-filter: blur()`

**What goes wrong:** The export PNG shows no blur on frosted-glass elements. The element renders correctly in the browser but the blur is silently dropped in the PNG output.

**Why it happens:** html-to-image serializes the DOM to SVG `foreignObject`, then rasterizes it. CSS `backdrop-filter` requires compositing against what is visually behind the element — this concept does not survive SVG serialization. This is a confirmed, long-standing issue (html-to-image GitHub Issue #239, unfixed as of 2026).

**Consequences:** Any new slide layout using `backdropFilter: "blur(...)"` will look correct in the editor preview but broken in the exported PNG. SwipelySlide footer already uses `backdropFilter: "blur(10px)"` — this is already broken in exports, but may not be visible due to the dark background masking it. Photo slides use `backdropFilter: "blur(8-12px)"` on the content box — this will visibly degrade exports.

**Prevention:**
- Never use `backdropFilter` in slide template JSX. Replace all existing usages with a semi-transparent solid or a separate blurred `<div>` using standard `filter: blur()` on the background layer (not the foreground).
- Audit all templates before adding new layouts: `grep -r "backdropFilter" components/slides/`.
- For new layouts (photo+text, quote-center): use `background: "rgba(0,0,0,0.55)"` instead of blur.

**Warning signs:** Export PNG looks different from the browser preview. Frosted elements appear opaque or transparent instead of blurred.

**Phase:** Address in Phase 1 (layout variants) before adding any new templates.

---

### Pitfall 2: Cross-Origin Images Break html-to-image PNG Export

**What goes wrong:** Slide exports silently produce a blank image or throw a SecurityError. Photos loaded from Supabase Storage render fine in the browser but fail during `toPng()`.

**Why it happens:** html-to-image clones the DOM and serializes it to SVG. When it tries to embed external images (via `backgroundImage: url(...)` or `<img src="...">`), the browser applies taint-checking. If the image was served without `Access-Control-Allow-Origin: *`, the canvas is "tainted" and export fails. Supabase Storage private buckets require signed URLs with authenticated requests — these URLs do not carry cross-origin headers by default when used as CSS background images.

**Consequences:**
- `PhotoBackground` component uses `backgroundImage: url(${imageUrl})` — this is the exact pattern that fails.
- User-uploaded photos from the planned `user-photos` bucket will fail to export if served as signed URLs without proper CORS headers.
- The failure is silent: `toPng()` either throws or produces a blank slide.

**Prevention:**
- All user-uploaded photos must be served from a **public** bucket with `Access-Control-Allow-Origin: *` headers, OR converted to base64 data URIs client-side before passing to the slide component as `imageUrl`.
- Preferred approach: on upload, store the file and immediately create a base64 blob URL (`URL.createObjectURL(file)`) for use in the current session. On reload, fetch the image via Supabase client (authenticated) and convert to base64 data URI before rendering.
- Set `crossOrigin="anonymous"` on any `<img>` tags (does not apply to CSS `backgroundImage`).
- Test export explicitly during development: run `toPng()` with a Supabase-hosted image, not a local blob.

**Warning signs:** Export works with local/placeholder images but fails with Supabase-hosted user photos. Console shows SecurityError or tainted canvas.

**Phase:** Address in Phase 2 (user photo upload) before shipping that feature.

---

### Pitfall 3: Google Fonts Not Embedded in Export (Race Condition + CORS)

**What goes wrong:** Exported PNG shows fallback system font instead of the design's Google Font (Outfit, Space Mono, etc.). Intermittent — works on second export attempt but not first.

**Why it happens:** Two separate failure modes:

1. **Font not yet loaded:** `document.fonts.ready` resolves when fonts are available but the promise can resolve before all font variants (700, 800 weight) are fetched. html-to-image then serializes before the heavy weights are ready.

2. **CORS on font CSS:** html-to-image fetches all stylesheets and tries to inline them. Google Fonts CSS (`@import url('https://fonts.googleapis.com/...')`) is loaded via `<style>` tags inside slide components. The library fetches this URL, which returns a CSS file that itself references `.woff2` files. These cross-origin font fetches require the font server to send `Access-Control-Allow-Origin` — Google Fonts does send this, but the fetch timing creates a race condition with the canvas render.

**Consequences:** Exported PNG looks different from preview. Text is in wrong font. Client-facing defect.

**Prevention:**
- Replace `@import url(...)` inside slide components with Next.js `<head>` font preloading (already possible via `next/font/google`). This ensures fonts are loaded before any export attempt.
- Add explicit font-ready check beyond `document.fonts.ready`: use `document.fonts.check('800 16px Outfit')` before starting export loop.
- After `document.fonts.ready`, add a 100ms delay as a safety buffer for font rasterization to complete.

**Warning signs:** Exported fonts look like Arial/Helvetica. Issue is intermittent (disappears on second export, reproducible on hard refresh).

**Phase:** Validate in Phase 1 (layout variants add no new fonts). If adding new Google Fonts for new templates, address immediately before shipping that template.

---

## Moderate Pitfalls

---

### Pitfall 4: Gemini Ignores `layout` Field Unless Constrained by Schema

**What goes wrong:** Gemini returns `layout: "text-left"` for every slide (ignores variety), or returns unexpected string values like `"text_left"`, `"left-text"`, or omits the field entirely.

**Why it happens:** The current prompt uses `responseMimeType: "application/json"` without a `responseSchema`. This makes Gemini output JSON but does not constrain field values to an enum. Without an enum constraint, the model uses its own judgment about field values and tends to pick the most common value or hallucinate variants.

**Consequences:** All slides render with the same layout, defeating the purpose of the feature. Renderer receives an unrecognized `layout` value and falls back to default — silent degradation rather than an error.

**Prevention:**
- Use Gemini's `responseSchema` parameter with an enum for `layout`:
  ```typescript
  responseSchema: {
    type: "ARRAY",
    items: {
      type: "OBJECT",
      properties: {
        layout: { type: "STRING", enum: ["text-left", "text-right", "split", "big-number", "quote"] },
        type: { type: "STRING", enum: ["hook", "tension", "value", "accent", "insight", "cta"] },
        title: { type: "STRING" },
        content: { type: "STRING" }
      }
    }
  }
  ```
- Add a Zod validation step after JSON.parse to catch unexpected values before they reach the renderer. Fall back to a default layout (e.g., `"text-left"`) rather than passing invalid values downstream.
- In the prompt, explicitly distribute layouts across slide positions: "slide 1: big-number, slides 2-3: text-left, slide 4: split..." This nudges variety without relying purely on the model's choices.

**Warning signs:** All slides from a test generation have the same `layout` value. Gemini response includes `layout` values not in the defined enum.

**Phase:** Address in Phase 1 when the `layout` field is first introduced to the schema.

---

### Pitfall 5: SVG Chart Elements Require Explicit Pixel Dimensions for Export

**What goes wrong:** SVG charts render at correct size in the browser preview but appear as a tiny 0px box or are clipped in the exported PNG.

**Why it happens:** html-to-image/`toPng` sizes elements based on `offsetWidth`/`offsetHeight`. SVG elements with `width="100%"` or no explicit dimensions have `offsetWidth: 0` when not in the live DOM layout (during the hidden export container render). The library cannot resolve percentage-based SVG dimensions during serialization.

**Consequences:** Bar charts, progress bars, and stat visualizations are invisible or clipped in exports. Preview looks perfect; PNG is broken.

**Prevention:**
- All chart/SVG components must use explicit pixel `width` and `height` attributes (e.g., `<svg width={800} height={200}>`), not `width="100%"`.
- Use the existing `getSlideDimensions()` utility to derive chart pixel widths relative to slide size. Pass dimensions as props, not CSS percentages.
- When adding progress bars: use inline `<div>` with explicit pixel width set via `style.width = "${percent}%"` based on computed pixel total, not CSS `%`.

**Warning signs:** SVG chart looks correct in editor but is a blank rectangle or zero-size in export. Only reproducible by actually running `toPng()`.

**Phase:** Must be designed in from the start of Phase 1 (rich elements). Do not prototype with `width="100%"` and plan to fix later.

---

### Pitfall 6: Content Plan Generation Fails Silently Mid-Way with No Recovery State

**What goes wrong:** User generates a 30-day content plan. Gemini returns 30 items successfully, but the Supabase `INSERT` fails (network error, schema mismatch, RLS policy missing). The user sees a success message, navigates away, and the plan is gone. Or: Gemini times out after returning only 18 of 30 items, and the partial result is discarded.

**Why it happens:**
- The existing `/api/generate` route has no partial-save mechanism — it's all-or-nothing.
- A new content plan endpoint that calls Gemini for 30 items will have higher timeout risk than carousel generation (more tokens, longer response).
- The `content_plans` table does not yet exist — RLS policies must be set up correctly or all writes silently fail.

**Consequences:** User has no plan, no error message, and the generation quota was consumed. High frustration. May not retry.

**Prevention:**
- Save the plan to Supabase **before** returning success to the client. Use a try/catch that distinguishes Gemini failure from DB failure.
- If Gemini returns fewer items than requested (e.g., due to `MAX_TOKENS`), save the partial plan with a `status: "partial"` field rather than discarding it. Let the user complete it manually.
- When creating the `content_plans` table, add an explicit RLS test: insert a row as a test user before shipping. Missing `INSERT` policy means silent failure with no error in Next.js (Supabase client swallows the 403).
- Do not consume the rate-limit slot before content plan generation succeeds — release it on any failure.

**Warning signs:** Supabase insert errors appear in server logs but not in the UI. Users report "it said success but nothing saved." Missing `INSERT` policy shows as a `{}` empty data return with no error in the Supabase client.

**Phase:** Address in Phase 3 (content calendar). The table schema and RLS policies must be migration-tested before the endpoint goes live.

---

### Pitfall 7: Supabase Storage — Signed URL CORS Mismatch on User Photos

**What goes wrong:** User uploads a photo. The upload succeeds. The photo displays in the editor (via signed URL). User exports the carousel. The photo-as-background slide is blank in the PNG.

**Why it happens:** This is distinct from Pitfall 2 but related. Signed URLs from Supabase private storage are single-use authenticated URLs. They work for `<img>` tags and direct fetch with auth headers. They do NOT work as CSS `backgroundImage` values in html-to-image because the background image fetch happens during SVG serialization without auth headers — the browser treats this as an unauthenticated cross-origin request, which fails against a private bucket.

Additionally: Supabase free tier has a global upload limit of 50MB per file. This is fine for photos, but if no per-bucket limit is set, users could theoretically upload 50MB RAW images, causing slow base64 conversion and massive memory use during export.

**Prevention:**
- For the `user-photos` bucket: set max file size to 10MB at the bucket level in Supabase dashboard.
- Enforce file type restrictions: `allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"]`.
- On the client side, after upload, fetch the image back via `supabase.storage.from('user-photos').download(path)`, convert to base64 data URI, and store that in component state. Pass the data URI (not the signed URL) to the slide component.
- Add client-side pre-upload validation: reject files > 8MB before upload with a clear error message.

**Warning signs:** Photo shows in preview, blank in export. Supabase network tab shows 403 on storage requests during `toPng()`.

**Phase:** Address in Phase 2 (user photo upload). Must be the first thing tested after upload is wired up.

---

## Minor Pitfalls

---

### Pitfall 8: Tailwind v4 CSS Variables Not Resolved by html-to-image

**What goes wrong:** Slide template uses a Tailwind v4 CSS variable like `var(--color-accent)` defined in `@theme`. In the browser preview the color resolves. In the exported PNG the element has no background color.

**Why it happens:** html-to-image inlines computed styles by reading `getComputedStyle()`. This should resolve CSS variables. However, if the variable is defined in a `@layer` or `@theme` block that is not applied to the element's computed style chain, `getComputedStyle()` may return the literal `var(--color-accent)` string rather than the resolved value. The `toPng()` serializer does not evaluate unresolved CSS variables.

**Consequences:** Template colors disappear in export. The bug is invisible during development because the preview uses normal CSS rendering.

**Prevention:**
- All slide templates use `style={{}}` prop objects with explicit hex/rgba values. This is already the existing pattern — do not break it by introducing Tailwind class-based styling inside slide components.
- When adding new layouts: keep all colors as inline style values. Do not use `className="bg-accent"` or Tailwind utility classes inside slide component JSX.

**Warning signs:** Specific color areas are wrong in export but correct in preview. Colors defined in `globals.css @theme` block are affected.

**Phase:** Low risk if existing pattern is maintained. Becomes a risk if developer adds Tailwind classes to slide components for speed.

---

### Pitfall 9: `accent` Slide Type Overrepresented When AI Selects Layouts

**What goes wrong:** When layout selection is combined with slide type, Gemini tends to pair every `accent` slide with `big-number` layout and every `cta` with `quote-center` layout. This creates visual pattern repetition: if a 7-slide carousel has 2 accent slides, both look identical in layout.

**Why it happens:** The model learns associations between slide types and visual treatments. Without explicit distribution instructions, it falls back to the "most correct" pairing rather than varying layouts for visual rhythm.

**Consequences:** The stated goal ("every slide looks different") is not achieved. Users notice the carousel looks formulaic.

**Prevention:**
- In the system prompt, explicitly assign different layouts per slide index position, not just per slide type:
  - "Slide 1 (hook): big-number. Slide 2 (tension): text-right. Slide 3 (value): text-left. Slide 4 (accent): split. ..."
- Alternatively, generate layout assignments separately from content generation, with a post-processing step that forces layout diversity (no two adjacent slides can share the same layout).

**Warning signs:** Generated carousels have visually repetitive structure. Two consecutive slides use identical layout + element combinations.

**Phase:** Phase 1. Part of the layout assignment algorithm design.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| New slide layouts (text-left, split, etc.) | Gemini ignores `layout` field without schema enforcement (Pitfall 4) | Add `responseSchema` enum before shipping any layout-aware generation |
| New slide layouts | `backdropFilter` invisible in export (Pitfall 1) | Audit and replace all `backdropFilter` before adding new templates |
| SVG/chart elements in slides | SVG with `width="100%"` invisible in export (Pitfall 5) | Design with explicit pixel dimensions from day one |
| User photo upload | Signed URL CORS breaks export (Pitfalls 2 & 7) | Convert uploaded images to base64 data URI in client state |
| User photo upload | Large file upload causing memory issues | Set 10MB bucket limit, validate client-side before upload |
| Content calendar page | Partial generation silently discarded (Pitfall 6) | Save partial result with `status: "partial"`, never discard |
| Content calendar page | Missing RLS policy causes silent insert failure | Test RLS policies before wiring up UI |
| Any new template | Google Font race condition in export (Pitfall 3) | Use `next/font/google` instead of `@import` in component `<style>` |
| Any new template | Tailwind v4 variables not resolved in export (Pitfall 8) | Keep all colors as explicit inline hex/rgba in slide component JSX |

---

## Sources

- html-to-image `backdrop-filter` issue (Issue #239): https://github.com/bubkoo/html-to-image/issues/239
- html-to-image Google Fonts CORS issue: https://github.com/bubkoo/html-to-image/issues/207
- html-to-image cross-origin image issue: https://github.com/bubkoo/html-to-image/issues/40
- MDN: CORS and canvas taint: https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image
- Supabase Storage file size limits: https://supabase.com/docs/guides/storage/uploads/file-limits
- Supabase Storage access control: https://supabase.com/docs/guides/storage/security/access-control
- Gemini Structured Outputs (enums): https://ai.google.dev/gemini-api/docs/structured-output
- Gemini structured output enum limitation: https://github.com/googleapis/python-genai/issues/950
- Best HTML-to-Canvas solutions (2025 overview): https://portalzine.de/best-html-to-canvas-solutions-in-2025/
