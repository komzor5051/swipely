# External Integrations

**Analysis Date:** 2026-03-19

## APIs & External Services

**AI Generation:**
- Google Gemini 2.5 Flash (text generation)
  - SDK: `@google/generative-ai` (0.24.1) and `@google/genai` (1.0.0, 0.14.1)
  - Auth: `GOOGLE_GEMINI_API_KEY` environment variable
  - Usage: `swipely-nextjs/app/api/generate/route.ts`, `swipely-bot/src/services/gemini.js`
  - Endpoints: Gemini REST API v1beta, configurable base URL via `GEMINI_PROXY_URL`

- Google GenAI (image generation for photo mode)
  - Model: `gemini-3-pro-image-preview` (primary), `gemini-2.0-flash-exp-image-generation` (fallback)
  - Auth: Same `GOOGLE_GEMINI_API_KEY`
  - Usage: `swipely-nextjs/lib/services/image-generator.ts`

- Claude API (optional fallback)
  - SDK: `@anthropic-ai/sdk` (0.30.1)
  - Auth: `ANTHROPIC_API_KEY` (optional)
  - Status: Imported but not actively used in current routes

- OpenAI (optional voice transcription)
  - SDK: `openai` (4.73.0)
  - Auth: `OPENAI_API_KEY` (optional)
  - Usage: `/api/transcribe` route (if implemented)
  - Model: Whisper v3

**Telegram:**
- Telegram Bot API (polling)
  - SDK: `node-telegram-bot-api` (0.67.0)
  - Auth: `TELEGRAM_BOT_TOKEN` environment variable
  - Usage: swipely-bot polling bot, currently a redirect stub (see `swipely-bot/src/index.js`)
  - Bot polls for `/message` and `/callback_query` updates

- Telegram Mini App
  - Entry: Web Mini App iframe embedded in Telegram client
  - Auth: Telegram Mini App Widget API (HMAC verification via `tg_` prefix email auth)
  - Handler: `swipely-nextjs/app/api/auth/telegram/route.ts` — verifies Telegram hash
  - Bot integration: `swipely-nextjs/app/api/auth/signup` captures `TELEGRAM_BOT_TOKEN` for verification

- Telegram Stars
  - Payment integration via Telegram Bot API (not fully implemented)
  - Configuration: Stub pricing in Telegram Stars equivalents (RUB × 0.693 = Stars)

## Data Storage

**Databases:**
- Supabase PostgreSQL (shared instance across all sub-projects)
  - Connection: `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (admin) or `SUPABASE_ANON_KEY` (client)
  - Client library: `@supabase/supabase-js` (2.89-2.90.1)
  - Auth: Native Supabase Auth (email signup, Telegram OAuth, magic links)

**Tables:**
- `auth.users` — Supabase native auth table
- `profiles` — User metadata (subscription tier, usage counters, Telegram ID)
- `generations` — Carousel generation history (template, slides, output JSON)
- `api_keys` — B2B API key management (tenant-scoped, RLS)
- `payments` — Payment records (product, status, Telegram user mappings)
- `carousel_edit_sessions` — Editor session tokens (expires_at tracking)

**File Storage:**
- Local filesystem only (no S3/cloud storage integration)
- PNG exports: Generated client-side via html2canvas or rendered server-side via Puppeteer
- Image uploads: Handled via form data, stored in Supabase via base64 in JSONB

**Caching:**
- None — stateless architecture, all state in Supabase and client-side Zustand
- Browser LocalStorage: Session tokens, draft carousels (not persisted to DB)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (native)
  - Email signup with IP rate limiting (3 accounts per IP per 24h)
  - Disposable email blocking via `disposable-email-domains` package
  - Telegram Mini App sign-in via HMAC verification
  - Magic link password reset

**Auth Routes:**
- `POST /api/auth/signup` — Email registration with rate limiting
- `POST /api/auth/telegram` — Telegram Mini App login (HMAC hash verification)
- `POST /api/auth/callback` — OAuth callback (Supabase native redirects)
- `POST /api/auth/reset-password` — Password reset initiation

**Session Management:**
- Supabase cookies (via `@supabase/ssr`) — server-side session cookies
- Next.js middleware detects auth status
- Bot uses Telegram user ID as identifier
- Editor uses stateless tokens (`carousel_edit_sessions.token`)

## Monitoring & Observability

**Error Tracking:**
- None detected — using console.error and try/catch
- No Sentry, LogRocket, or similar integration

**Logs:**
- Console logging throughout
- Railway/Docker stdout for bot logs
- Vercel runtime logs for Next.js routes

**Analytics:**
- Admin dashboard at `swipely-nextjs/app/admin/analytics/page.tsx` (gate: `ADMIN_EMAIL`)
- Charting: Recharts 3.7.0 (in-app visualization)
- No external analytics service detected (no GA, Posthog, etc.)

## CI/CD & Deployment

**Hosting:**
- swipely-nextjs: Vercel (primary SaaS app) or Selectel VPS (178.72.168.235)
- swipely-bot: Railway.app (Docker)
- swipely-editor: Vercel (edit.swipely.ai)
- swipely-api: Railway (Telegram Mini App backend)

**CI Pipeline:**
- None detected — manual git push to deploy
- Vercel auto-deploys on git push
- Railway auto-deploys on git push or Docker push

**Deployment Files:**
- `railway.json` (swipely-bot) — Railway configuration
- `.vercelignore` (swipely-editor) — Vercel ignore rules
- `Dockerfile` (swipely-bot) — Docker image definition for Railway

## Environment Configuration

**Required env vars (swipely-nextjs):**
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase public key (browser auth)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase admin key (API routes)
- `GOOGLE_GEMINI_API_KEY` — Google Gemini API key
- `AURAPAY_API_KEY` — AuraPay payment API key
- `AURAPAY_SHOP_ID` — AuraPay merchant shop ID
- `ADMIN_EMAIL` — Email address with admin panel access
- `TELEGRAM_BOT_TOKEN` — Telegram Bot token (Mini App HMAC verification)
- `EXA_API_KEY` — Exa AI search API (optional, for topic mining)
- `CRON_SECRET` — Bearer token for cron route auth
- `WORDSTAT_TOKEN` — Yandex Wordstat OAuth token (optional, topic scoring)
- `GEMINI_PROXY_URL` — Cloudflare Worker proxy URL (optional, for geo-blocking bypass)
- `NEXT_PUBLIC_APP_URL` — Base URL for payment callbacks (default: http://localhost:3000)

**Required env vars (swipely-bot):**
- `TELEGRAM_BOT_TOKEN` — Telegram Bot token
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_ANON_KEY` — Supabase key (actually service_role, misleading name)
- `GOOGLE_GEMINI_API_KEY` — Google Gemini API key
- Optional: `OPENAI_API_KEY` (voice transcription)
- Optional: `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY` (YooKassa payments, legacy)

**Required env vars (swipely-editor):**
- `VITE_SUPABASE_URL` — Supabase URL
- `VITE_SUPABASE_ANON_KEY` — Supabase public key
- `SUPABASE_SERVICE_KEY` — Admin key (if server-side needed)
- `EDITOR_BOT_SECRET` — Shared secret with bot for session verification

**Required env vars (swipely-api):**
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_KEY` — Supabase admin key
- `TELEGRAM_BOT_TOKEN` — Telegram Bot token
- `OPENROUTER_API_KEY` — OpenRouter LLM aggregator (if used)

**Secrets location:**
- Environment variables only (no `.env` files in git)
- Railway/Vercel secrets UI
- Cloudflare Workers (for Gemini proxy)

## Webhooks & Callbacks

**Incoming:**
- `POST /api/webhooks/aurapay` — AuraPay payment confirmation webhook
  - Verifies payment status, updates user subscription tier and slide balance
  - Handles subscription duration logic (monthly/yearly)
  - Slide pack topup handling
  - Hosted at swipely-nextjs

**Outgoing:**
- None detected — SaaS acts as webhook receiver only

**Cron Jobs:**
- `GET /api/cron/payment-reminder` — Subscription expiry reminders (Cron Job scheduling)
- `GET /api/cron/generate` — Blog article batch generation
- `GET /api/cron/mine-topics` — Topic discovery and scoring (Exa API)
- Auth: `CRON_SECRET` bearer token (external cron service → app)

## Rate Limiting & Security

**IP-based:**
- Signup: 3 accounts per IP per 24h (Supabase RPC `check_ip_signup`)
- Implementation: `swipely-nextjs/app/api/auth/signup/route.ts`

**API Rate Limiting (B2B):**
- `claim_api_key_slot` Supabase RPC — atomic rate limiting for API key usage
- Handles: Daily limits, monthly resets, usage counting

**Generation Rate Limiting:**
- `claim_generation_slot` Supabase RPC — cooldown (15s), daily limits per tier
- Implementation: `swipely-nextjs/lib/supabase/queries.ts`

**Email Validation:**
- Disposable email blocking via `disposable-email-domains`
- Domain whitelist/blacklist not configured

**Telegram Auth Verification:**
- HMAC-SHA256 hash verification of Telegram Mini App data
- Hash must be valid and data must be <10 minutes old
- Implementation: `swipely-nextjs/app/api/auth/telegram/route.ts`

## Multi-Tenancy & B2B

**API Key Management:**
- Table: `api_keys` with fields `key_hash`, `tenant_id`, `monthly_limit`, `used_this_month`
- Key generation: Hash-based (not plaintext storage)
- Rate limiting: Per-key monthly quota + per-request cooldown
- Route: `POST /api/v1/generate/route.ts` (B2B carousel generation endpoint)

**RLS (Row-Level Security):**
- Enabled on `profiles`, `generations`, `api_keys` tables
- Policy: Users can only see their own records
- API keys scoped by tenant_id, RPC handles authorization

## Third-Party Image Services

**Cloudflare Worker (Gemini Proxy):**
- File: `swipely-nextjs/cloudflare-worker/gemini-proxy.js`
- Purpose: Bypass Google geo-blocking when running from Selectel VPS
- Deployment: Manual via Cloudflare dashboard
- No auto-build pipeline

**Photo Generation:**
- Direct Gemini API call via `@google/genai` SDK
- Models: `gemini-3-pro-image-preview` (primary), fallback to `gemini-2.0-flash-exp-image-generation`
- Prompts include style (cartoon/realistic) and format (portrait/square)

**HTML→PNG Rendering:**
- Puppeteer (Node.js, swipely-bot, backend)
- html2canvas (browser, swipely-editor client-side)
- html-to-image (alternative, installed but status unknown)

---

*Integration audit: 2026-03-19*
