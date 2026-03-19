# Architecture

**Analysis Date:** 2026-03-19

## Pattern Overview

**Overall:** Distributed generation pipeline with shared Supabase backend

Swipely is a **carousel generation SaaS** with parallel AI pipelines: a legacy Telegram bot, a modern Next.js web application, and a web-based carousel editor. All three share a single Supabase instance but operate independently through separate generation services.

**Key Characteristics:**
- Two independent generation engines (bot and web) feeding the same database
- Template-driven slide rendering with 23 public + 3 B2B tenant-specific templates
- Rate limiting via atomic Supabase RPC (`claim_generation_slot`, `claim_api_key_slot`)
- No cross-app state sharing — each system is a self-contained pipeline

## Layers

**Presentation Layer:**
- Location: `swipely-nextjs/components/`, `swipely-editor/src/components/`
- Contains: React components for auth, dashboard, generation UI, slide canvas, editor
- Renders slides via centralized `SlideRenderer.tsx` using template registry
- Design system: Tailwind v4 (dark theme, lime accent)
- Route groups organize auth, dashboard, admin, public pages

**Generation Layer (AI):**
- **Nextjs**: `swipely-nextjs/app/api/generate/route.ts` — Gemini 2.5 Flash Lite + fallback OpenRouter
- **Bot**: `swipely-bot/src/services/gemini.js` — Gemini generation with OpenRouter fallback
- Both use system prompts with design presets, tone guidelines, tone-of-voice profiles
- Output: JSON with slide array (`{ type, title, content }`) and post caption
- Markdown stripping and JSON validation happen post-generation

**Rendering Layer (HTML → PNG):**
- **Bot**: `swipely-bot/src/services/renderer.js` — Puppeteer renders HTML templates to PNG
- **Nextjs B2B API**: `swipely-nextjs/lib/render/` — Puppeteer server-side rendering for API clients
- **Web Editor**: `swipely-editor/src/` — Client-side html2canvas export (no server rendering)
- All use Puppeteer with 2x device scale factor for quality

**Slide Template Layer:**
- **Registry**: `swipely-nextjs/lib/templates/registry.ts` — 23 public + 3 B2B templates
- **Renderer**: `swipely-nextjs/components/slides/SlideRenderer.tsx` — maps template IDs to React components
- **Components**: `swipely-nextjs/components/slides/templates/*.tsx` — individual template implementations
- Each template is a React component implementing `SlideProps` (title, content, index, totalSlides, format, highlightColor)
- Template support: `<hl>keyword</hl>` tags for keyword highlighting (each template renders differently)

**Database/State Layer:**
- Location: Supabase PostgreSQL (shared across all apps)
- Key tables: `profiles`, `generations`, `api_keys`, `blog_posts`, `blog_topics`
- Rate limiting: `claim_generation_slot` RPC (cooldown 15s, daily limits), `claim_api_key_slot` RPC (B2B)
- Auth: Supabase auth with JWT tokens
- RLS: Enabled on most tables, bypassed by admin client in API routes

**Integration Points:**
- **Payments**: AuraPay (nextjs) + YooKassa (bot) — trigger subscription tiers
- **AI APIs**: Gemini 2.5 Flash (primary), OpenRouter fallback (Claude/Gemini)
- **Image Gen**: Gemini 3 Pro Image (bot photo mode, user reference photos)
- **ToV Analysis**: URL scraping or pasted content analysis (buildToVProfile)
- **Blog Pipeline**: Exa search (topic mining), Gemini (drafting), Supabase (storage)
- **Telegram Auth**: HMAC-SHA256 verification of initData in web/API

**Supabase Clients (Three Types):**
- `lib/supabase/client.ts` — browser client (createBrowserClient)
- `lib/supabase/server.ts` — server/route-handler client (createServerClient with cookies)
- `lib/supabase/admin.ts` — service-role admin client (bypass RLS for DB writes)

## Data Flow

**Standard Generation Flow (Web):**

1. User inputs text + selects template/tone/brief in `/generate` UI
2. Frontend calls `POST /api/generate` with auth header (JWT or service key)
3. Route handler:
   - Auth check (server Supabase client)
   - Email verification check
   - Load profile + reset monthly counter if needed (RPC `reset_monthly_if_needed`)
   - Call `claim_generation_slot` RPC → returns `{ allowed, reason, wait_seconds }`
   - If blocked: return 429 (cooldown) or limit error
   - Build system prompt (design config + tone section + ToV guidelines)
   - Call Gemini API → parse JSON → clean markdown → validate slides
   - Save to `generations` table
   - Return JSON slides + post_caption to frontend
4. Frontend renders slides via `SlideRenderer` component
5. User can edit in `/editor/[id]` or export to PNG

**Photo Mode Flow (Bot):**

1. User sends photo to bot + optional prompt
2. Bot handler:
   - Download photo from Telegram + base64 encode
   - Generate content text via Gemini (using photo description)
   - Call image generator service for each slide (Gemini 3 Pro Image with reference photo)
   - Overlay text on each generated image via PIL/Sharp
   - Render final carousel + send to Telegram
3. Database: save to `generations` table

**B2B API Flow:**

1. Client authenticates with API key (hash-based)
2. Calls `POST /api/v1/generate` with carousel JSON
3. Route:
   - Hash provided key, lookup in `api_keys` table
   - Call `claim_api_key_slot` RPC (check tenant limits)
   - Call Gemini generation (same as web)
   - Call Puppeteer renderer (server-side PNG output)
   - Return PNG binary directly
4. Rate limited by monthly tenant quota

**Blog Generation Pipeline:**

1. Cron trigger (or manual `npx tsx scripts/batch-generate.ts`)
2. `topic-miner.ts` — mines new topics via Exa search → stores in `blog_topics`
3. `writer.ts` — Gemini drafts article from topic
4. `editors.ts` — multiple Gemini passes (SEO, clarity, examples)
5. `publisher.ts` — saves to `blog_posts` table
6. Blog routes serve as static ISR (incremental static regeneration)

**State Management:**

- **Auth**: Supabase JWT + refresh token (browser client handles rotation)
- **Profile**: lazy-loaded on first generation (reset monthly counters on-demand)
- **Generations**: stored in DB, fetched client-side for history list
- **User preferences**: `tov_guidelines`, `subscription_tier` cached in profile
- **Bot session state**: in-memory map `sessions[userId]` (lost on bot restart, no persistence)

## Key Abstractions

**Template System:**
- **Purpose**: Decouple content (slides) from visual design (React components)
- **Examples**: `swipely-nextjs/components/slides/templates/SwipelySlide.tsx`, `StreetSlide.tsx`, `ChapterSlide.tsx`
- **Pattern**: Each template is a React component receiving `SlideProps`, rendering independently
- **Registry**: `lib/templates/registry.ts` maps template IDs to metadata (name, tone, maxWordsPerSlide)
- **Lookup**: `SlideRenderer.tsx` uses `TEMPLATE_MAP` to route ID → Component

**Carousel Data Structure:**
```json
{
  "slides": [
    {
      "type": "hook|tension|value|accent|insight|cta",
      "title": "3-6 words with <hl>keyword</hl>",
      "content": "20-35 words, no markdown"
    }
  ],
  "post_caption": "Teaser + 2-3 sentences + CTA"
}
```

**Design Presets (Prompting):**
- **Purpose**: Instruct Gemini on slide structure, tone, word limits per template
- **Location**: `app/api/generate/route.ts` → `designPresets` object
- **Example**: `swipely: { tone: "modern, tech-savvy, energetic, startup vibe" }`
- **Tone-of-Voice (ToV)**: Optional user profile (analyzed from URL or pasted samples) injected into system prompt

**Rate Limiting Gate:**
- **Purpose**: Atomic enforcement of cooldown (15s) + daily limits per subscription tier
- **Mechanism**: Supabase RPC `claim_generation_slot` runs inside transaction
- **Tiers**: free (3/mo), start (20/mo), pro (unlimited)
- **B2B**: `claim_api_key_slot` RPC handles per-tenant monthly quotas

**Prompt Injection Filter:**
- **Purpose**: Detect prompt injection attempts in user input
- **Location**: `app/api/generate/route.ts` → `containsInjection()` function
- **Pattern**: User input wrapped in `<user_content>` tags to signal it's data, not instruction
- **Examples blocked**: "ignore previous instructions", "system override", etc.

## Entry Points

**Telegram Bot:**
- Location: `swipely-bot/src/index.js`
- Triggers: User messages or callback button presses
- Responsibilities: Telegram polling loop, session management, command routing
- Current state (2026-03-19): **Redirect stub** — all bot interactions redirect to swipely.ru

**Web App:**
- Location: `swipely-nextjs/app/`
- Entry: `app/layout.tsx` (root layout)
- Routes: Auth group `(auth)/`, dashboard group `(dashboard)/`, admin, public (pricing, blog, viewer)
- Dashboard guards: `(dashboard)/layout.tsx` checks Supabase auth + triggers redirect if unauthenticated

**Web Editor:**
- Location: `swipely-editor/src/App.tsx`
- Standalone React + Vite app deployed on Vercel
- Receives carousel JSON via URL params or props, allows editing + export

**API Routes:**
- `POST /api/generate` — main generation endpoint (web + mobile)
- `POST /api/v1/generate` — B2B API endpoint (API-key authenticated)
- `POST /api/payments/create` — AuraPay payment link creation
- `POST /api/auth/telegram` — Telegram OAuth initData verification
- `GET /api/cron/generate` — auto-generate carousels from topic pool
- `GET /api/cron/mine-topics` — discover new blog topics via Exa

## Error Handling

**Strategy:** Fail gracefully with user-facing messages; log server errors.

**Patterns:**

- **API routes return JSON**: `{ error: "Reason", reason: "technical_code" }`
- **RPC failures**: caught, logged, return reason string from `claim_generation_slot` (e.g., `"cooldown"`, `"limit_exceeded"`)
- **Generation failures**: if Gemini fails, bot tries OpenRouter fallback; if both fail, returns null and bot sends "попробуй позже"
- **Auth failures**: 401 or redirect to `/login`
- **Admin routes**: use `notFound()` (not 403) for unauthorized access — hides existence
- **Timeout handling**: Gemini calls have 30s timeout; image generation has generous timeout
- **Database errors**: caught, logged server-side; never expose raw Supabase errors to client

## Cross-Cutting Concerns

**Logging:**
- **Bot**: Console logs with emoji prefixes (🤖, 🔄, ✅, ❌)
- **Nextjs**: Server logs via `console.log` + Vercel logs (request ID in context)
- **Image Gen**: Per-slide logs with progress indicators

**Validation:**
- **User input**: text capped at 3000 chars, brief at 500 chars
- **JSON slides**: must have `title` and `content` for each slide
- **Markdown cleanup**: all markdown removed from titles + content before returning
- **Template ID**: validated against registry; defaults to 'swipely' if not found

**Authentication:**
- **Web**: Supabase email/password signup (email verification skipped in signup, enforced elsewhere)
- **Bot (legacy)**: Telegram ID as unique identifier
- **B2B API**: API key (SHA-256 hashed) stored in `api_keys` table, verified on each request
- **Telegram Mini App**: HMAC-SHA256 verification of `initData` using bot token as secret

**Rate Limiting:**
- **Web generation**: 15s cooldown between requests + monthly usage limits
- **B2B API**: per-tenant monthly quota enforcement
- **Blog cron**: runs on schedule (every 2h for generation, weekly for mining)
- **Webhooks**: no rate limiting; YooKassa/AuraPay signature verification before processing

**Security:**
- **RLS**: enabled on `profiles`, `generations`, `api_keys` tables (but admin client bypasses for backend ops)
- **API key storage**: hashed (SHA-256), never returned in plaintext
- **Telegram verification**: HMAC-SHA256 of initData using bot token
- **Admin access**: gated by `ADMIN_EMAIL` env var; unauthorized access returns 404 (not 403)
- **User content isolation**: multi-tenancy enforced via `user_id` or `tenant_id` on all rows

---

*Architecture analysis: 2026-03-19*
