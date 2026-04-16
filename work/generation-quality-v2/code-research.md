# Code Research: Generation Quality v2

## 1. Entry Points

### Main Generation Endpoint

**File:** `swipely-nextjs/app/api/generate/route.ts` (664 lines)

Single POST handler that handles both standard AI rewrite and "preserve text" modes. Flow:

1. Auth check (Supabase cookie session)
2. Email verification check
3. Profile lookup / auto-create
4. Monthly counter reset (lazy, via `reset_monthly_if_needed` RPC)
5. Subscription expiry check
6. Parse request body
7. Input validation (text length 3000 max, brief 500 max, injection filter)
8. Tier gating (slide counts 9/12, pro-only templates)
9. Atomic slot claim via `claim_generation_slot` DB RPC (cooldown + limit + increment)
10. Build system prompt
11. Call Gemini API
12. Parse and clean response
13. Save generation to DB
14. Return JSON

Key signatures:
- `buildSystemPrompt(templateId: string, slideCount: number, tone?: string, tovGuidelines?: string, brief?: string): string` (line 105)
- `buildPreservePrompt(slideCount: number): string` (line 256)
- `buildSlideStructure(count: number): string` (line 63)
- `callGemini(): Promise<Response>` (line 554, closure over geminiRequestBody)

### V1 B2B API Endpoint

**File:** `swipely-nextjs/app/api/v1/generate/route.ts` (363 lines)

Separate endpoint for B2B API key access. Key differences from main endpoint:

- Auth via Bearer token (`swp_live_*`), not Supabase session
- Uses `gemini-2.5-flash` (not `flash-lite`) -- higher quality model
- Has `detectLanguage()` for auto-detecting Russian vs other languages
- Simpler prompt (English-first, no contentTones system)
- No ToV guidelines injection
- No preserve-text mode
- Has optional server-side PNG rendering (`render: boolean` param) via `renderAndUploadSlides()`
- Returns `generation_id`, `view_url`, `edit_url` in response
- `maxOutputTokens: 3000` (vs 8192 in main endpoint)
- No `responseSchema` in generationConfig -- relies on prompt-based JSON formatting only
- Duplicates `cleanMarkdown`, `containsInjection`, `designPresets`, `buildSlideStructure`, `buildSystemPrompt` locally (not shared from lib)
- `claimApiKeySlot()` for quota management (non-atomic, read-then-update pattern in `lib/supabase/queries.ts` line 290)

### Photo Mode Endpoint

**File:** `swipely-nextjs/app/api/generate/photo/route.ts`

SSE streaming endpoint for photo mode. Completely separate flow -- uses `@google/genai` SDK (not REST), generates AI images per slide. Has its own `PHOTO_SYSTEM_PROMPT` constant. Photo mode is unaffected by the multi-agent pipeline scope (per user-spec: scope is text generation only).

### Generation UI Page

**File:** `swipely-nextjs/app/(dashboard)/generate/page.tsx` (~1000+ lines)

Client component with multi-step form flow: `form -> template -> generating -> result`.

State variables relevant to the pipeline:
- `text`, `brief`, `selectedTemplate`, `slideCount`, `format`, `tone`, `preserveText`
- `mode`: "standard" | "photo"
- `inputMode`: "text" | "video"

The `handleGenerate()` function (line 361) calls `/api/generate` with `{ text, brief, template, slideCount, format, tone, preserveText }`.

## 2. Data Layer

### SlideData Type System

**File:** `swipely-nextjs/components/slides/types.ts` (34 lines)

```typescript
type SlideLayout = "text-left" | "text-right" | "split" | "big-number" | "quote" | "default" | "hero" | "cta" | "centered";

interface ChartItem { label: string; value: number; }

// 10 element types:
type SlideElement = NoneElementData | ListElementData | StatElementData | BarChartElementData
  | PieChartElementData | LineChartElementData | HorizontalBarElementData
  | CodeBlockElementData | QuoteBlockElementData | StatCardsElementData;

interface SlideData {
  type: string;         // "hook" | "tension" | "value" | "accent" | "insight" | "proof" | "contrast" | "steps" | "cta"
  title: string;        // May contain <hl>keyword</hl> tags
  content: string;
  layout?: SlideLayout;
  element?: SlideElement;
  imageUrl?: string;    // base64 data URL for Photo Mode
}
```

The Gemini `responseSchema` in route.ts (line 494-551) mirrors this structure with a flat `element` object where unused fields are `nullable: true`. The formatter agent must produce output matching this exact schema.

### Gemini Response Schema (enforced by API)

Defined inline in the route at line 494. Uses `responseMimeType: "application/json"` with explicit `responseSchema` object. The schema enforces:
- `slides[]` array with required fields: `type`, `title`, `content`, `layout`, `element`
- `post_caption` string
- Element type enum, with nullable sub-fields for different element types
- `thinkingBudget: 0` (no chain-of-thought)

### Database Tables

`profiles` table fields used by generation: `id`, `subscription_tier`, `subscription_end`, `standard_used`, `tov_guidelines`, `tov_profile`

`generations` table: `user_id`, `template`, `slide_count`, `format`, `tone`, `input_text`, `output_json`, `created_at`

`api_keys` table (B2B): `key_hash`, `tenant_id`, `active`, `monthly_limit`, `used_this_month`

DB RPCs: `claim_generation_slot(p_user_id)`, `reset_monthly_if_needed(user_id_param)`, `increment_standard_used(user_id_param)`

## 3. Similar Features / Patterns

### Preserve-Text Mode

`buildPreservePrompt()` (line 256) is a simpler prompt that structures user text into slides without rewriting. Returns same JSON schema. This is the closest analog to the "formatter" agent concept -- it takes existing content and structures it into valid slide JSON.

### Photo Mode Generation

Uses an entirely different prompt (`PHOTO_SYSTEM_PROMPT`) and different API (`@google/genai` SDK with image generation). Produces the same `SlideData` output structure but without `element` or `layout` fields.

### V1 B2B Prompt

Simpler English-first prompt with a concrete example in the prompt text. No contentTones, no ToV. Shows that the system can work with less complex prompts.

## 4. Integration Points

### Prompt Construction Dependencies

The `buildSystemPrompt()` function combines:
1. `designPresets[templateId]` -- 23 preset objects with `name`, `max_words_per_slide`, `tone`
2. `contentTones[tone]` -- 4 tone presets (educational, entertaining, provocative, motivational)
3. `tovGuidelines` -- user's custom ToV guidelines from profile
4. `brief` -- user's per-generation instructions (max 500 chars, sanitized)
5. `buildSlideStructure(count)` -- slide progression structure for 3/5/7/9/12 slides

All five must flow into the multi-agent pipeline. The strategist needs all context; the copywriter needs the strategy + original text + design constraints; the formatter needs the schema and word limits.

### Template Registry

**File:** `swipely-nextjs/lib/templates/registry.ts` (278 lines)

23 templates defined with metadata. `PRO_ONLY_TEMPLATE_IDS` array (16 templates). Each template has `maxWordsPerSlide` (20-30 range, except terracot at 30 in registry vs 45 in designPresets).

Note: `designPresets` in route.ts has different `max_words_per_slide` values than `registry.ts` `maxWordsPerSlide`. The prompt uses `designPresets` values, not registry values. These are out of sync.

### SlideRenderer

**File:** `swipely-nextjs/components/slides/SlideRenderer.tsx`

`TEMPLATE_MAP` maps 24 template IDs to React components. The formatter agent output must produce valid data for these components -- particularly `layout`, `element.type`, and word count constraints.

### Video Transcription

`/api/transcribe` endpoint fills the `text` field from video URL. The transcribed text then goes through the same generation pipeline. No special handling needed.

### ToV Guidelines

Stored in `profiles.tov_guidelines` as a string. Injected into the system prompt when present. The multi-agent pipeline must pass this through to the copywriter agent.

## 5. Existing Tests

No test suites exist in swipely-nextjs (confirmed in root CLAUDE.md: "No test suites exist in any sub-project").

## 6. Shared Utilities

### AI Utils

**File:** `swipely-nextjs/lib/ai-utils.ts` (43 lines)

- `cleanMarkdown(text: string): string` -- strips bold, italic, strikethrough, headings, lists, inline code, links, collapses whitespace
- `containsInjection(text: string): boolean` -- checks 17 regex patterns for prompt injection attempts
- `INJECTION_PATTERNS` -- exported array of RegExp

Note: V1 endpoint and photo endpoint duplicate these locally instead of importing from `lib/ai-utils.ts`.

### Supabase Queries

**File:** `swipely-nextjs/lib/supabase/queries.ts`

- `resetMonthlyIfNeeded(supabase, userId)` -- calls `reset_monthly_if_needed` RPC
- `checkSubscriptionExpiry(supabase, userId, profile)` -- checks expiry, downgrades if expired
- `claimApiKeySlot(supabase, keyHash)` -- B2B quota check (non-atomic read-then-update)
- `Profile` interface with all tier/subscription fields

### Supabase Clients

**File:** `lib/supabase/client.ts` -- browser (anon key)
**File:** `lib/supabase/server.ts` -- server with cookies
**File:** `lib/supabase/admin.ts` -- service_role, bypasses RLS

## 7. Potential Problems

### Duplicated Code Across Endpoints

`designPresets`, `buildSlideStructure`, `buildSystemPrompt`, `cleanMarkdown`, `containsInjection` are duplicated in `/api/generate/route.ts`, `/api/v1/generate/route.ts`, and `/api/generate/photo/route.ts`. Multi-agent refactor should extract shared prompt logic to a shared module to avoid maintaining 2-3 copies.

### JSON Parsing Fragility

Current parsing chain (route.ts lines 598-611):
1. Strip ` ```json ` / ` ``` ` wrappers
2. Regex match `\{[\s\S]*\}` to extract first JSON object
3. `JSON.parse(jsonMatch[0])`
4. Validate `slides` array is non-empty
5. Clean markdown from title/content
6. Filter out blank slides

If `JSON.parse` throws, the whole request returns 500. The `responseSchema` on Gemini should prevent malformed JSON, but the regex extraction (`\{[\s\S]*\}`) could match a partial JSON object if the response is truncated by token limits. The formatter agent should eliminate this class of errors.

### No Retry on Content Errors

Retry logic exists only for HTTP 503/429 (line 574). No retry if:
- Response is valid HTTP but has empty content
- JSON parsing fails
- Slides array is empty after filtering
- Content doesn't match template constraints (wrong word count, bad layouts)

### responseSchema vs No Schema

Main endpoint uses Gemini `responseSchema` for structured output (line 494-551). V1 endpoint does NOT use `responseSchema` (line 252), relying only on prompt instructions. This means V1 is more prone to malformed output.

### Token Budget

Main endpoint: `maxOutputTokens: 8192`, `thinkingBudget: 0`
V1 endpoint: `maxOutputTokens: 3000`, no schema

For 3-agent pipeline, total output tokens will be: strategist (~500) + copywriter (~2000-4000) + formatter (~2000-4000). Using flash-lite for all three, this is feasible within cost constraints.

### Timeout

55-second AbortController timeout on main endpoint (line 556). For 3 sequential Gemini calls, each call would need to complete within ~15-18 seconds to stay under 55 total. Alternatively, the overall timeout should be raised.

### designPresets vs Registry Out of Sync

`designPresets` in route.ts has `max_words_per_slide` values that differ from `registry.ts` `maxWordsPerSlide` for several templates. For example, `swipely` is 35 in designPresets but 30 in registry. This causes inconsistency between what the prompt requests and what the UI shows.

## 8. Constraints & Infrastructure

### Gemini API

- Model: `gemini-2.5-flash-lite` (main), `gemini-2.5-flash` (V1 B2B)
- Proxy: Cloudflare Worker at `GEMINI_PROXY_URL` (required on Selectel VPS due to geo-blocking)
- API style: REST `v1beta/models/{model}:generateContent`
- Structured output via `responseMimeType: "application/json"` + `responseSchema`
- `thinkingBudget: 0` disables internal chain-of-thought
- `temperature: 0.7`

### Deployment

- Selectel VPS (185.240.48.14), PM2, standalone Next.js build
- CI/CD: `.github/workflows/deploy.yml` on push to main
- No test step in CI pipeline

### Cost Model

flash-lite pricing: $0.075/M input tokens, $0.30/M output tokens. Current single call ~$0.001-0.002 per carousel. 3-agent pipeline at 3x would be ~$0.003-0.006 -- still under $0.01/carousel, well within economics.

### Environment Variables

`GOOGLE_GEMINI_API_KEY` and `GEMINI_PROXY_URL` are the only AI-relevant env vars. No new env vars needed for multi-agent since it uses the same Gemini API.

## 9. External Libraries

### Gemini REST API

Used via raw `fetch()` to `v1beta/models/{model}:generateContent`. Key config:
- `contents[].parts[].text` -- single turn, system + user prompt concatenated
- `generationConfig.responseMimeType: "application/json"` -- forces JSON output
- `generationConfig.responseSchema` -- defines expected JSON structure
- `generationConfig.thinkingConfig.thinkingBudget` -- controls internal reasoning

Response structure: `candidates[0].content.parts[0].text` contains the JSON string. `usageMetadata` has token counts.

For the multi-agent pipeline, each agent call will use the same REST endpoint but with different prompts and potentially different `responseSchema` objects (strategist output schema vs copywriter vs formatter).

---

## Key Files Summary

| File | Role |
|------|------|
| `app/api/generate/route.ts` | Main generation endpoint (664 lines) -- primary refactor target |
| `app/api/v1/generate/route.ts` | B2B API endpoint (363 lines) -- needs same multi-agent treatment |
| `app/api/generate/photo/route.ts` | Photo mode -- out of scope, separate flow |
| `app/api/transcribe/route.ts` | Video transcription -- feeds text into generation, no changes needed |
| `components/slides/types.ts` | SlideData/SlideElement types -- formatter schema target |
| `components/slides/SlideRenderer.tsx` | Template map (24 templates) -- no changes needed |
| `lib/templates/registry.ts` | Template metadata (23 templates + getTemplate) |
| `lib/ai-utils.ts` | cleanMarkdown, containsInjection -- shared utilities |
| `lib/supabase/queries.ts` | Profile, Generation, Usage, Subscription queries |
| `hooks/usePhotoGeneration.ts` | Photo mode SSE hook -- out of scope |
| `app/(dashboard)/generate/page.tsx` | Generation UI -- needs framework selector added |

## Data Flow Trace (Current)

```
User Input -> page.tsx handleGenerate() -> POST /api/generate
  -> auth + profile + tier checks
  -> buildSystemPrompt(template, slideCount, tone, tovGuidelines, brief)
  -> single Gemini API call (flash-lite, responseSchema, temp 0.7)
  -> parse JSON from response
  -> cleanMarkdown on title/content
  -> filter blank slides
  -> save to generations table
  -> return { slides, post_caption }
-> page.tsx setResult() -> SlideRenderer renders each slide
```

## Data Flow Trace (Target: Multi-Agent)

```
User Input -> page.tsx handleGenerate() (+ framework choice) -> POST /api/generate
  -> auth + profile + tier checks
  -> Agent 1 (Strategist): topic + tone + framework -> hook type, slide structure, angles
  -> Agent 2 (Copywriter): strategy + topic + ToV + brief -> slide content
  -> Agent 3 (Formatter): copywriter output -> validated JSON matching SlideData schema
  -> save to generations table
  -> return { slides, post_caption }
```

## UI Integration Point for Framework Selector

In `page.tsx`, the right column (line 768) currently has: slide count, tone, format. A "framework" selector should be added between the tone and format sections. The constant `TONES` (line 63) shows the pattern: array of `{ id, label }` objects rendered as a 2-column grid of toggle buttons.

The selected framework value would be sent to the API as a new `framework` field alongside existing `tone`, `brief`, etc.
