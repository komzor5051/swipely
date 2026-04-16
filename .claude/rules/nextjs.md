---
paths: "swipely-nextjs/**/*"
---

# swipely-nextjs Architecture

Next.js 16.1 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui (New York) + Zustand + @dnd-kit/core + React Hook Form + Zod + framer-motion + sonner

## Routes

```
/                                  # Landing page
(auth)/login, signup, callback     # Supabase auth flow
(auth)/forgot-password             # Email reset request → Supabase resetPasswordForEmail
(auth)/reset-password              # New password form — uses Supabase session from email link
(dashboard)/dashboard              # Stats dashboard
(dashboard)/dashboard/settings     # User settings + ToV re-analysis
(dashboard)/dashboard/pricing      # Pricing page (authenticated)
(dashboard)/editor                 # Drag-and-drop canvas editor
(dashboard)/generate               # 4-step carousel generation wizard (~1015 lines)
(dashboard)/history                # Generation history
(dashboard)/onboarding             # New user ToV analysis
(dashboard)/referral               # Referral program dashboard
pricing                            # Public pricing page
api/generate                       # Standard mode (Gemini 2.5 Flash Lite, REST)
api/generate/photo                 # Photo Mode SSE streaming endpoint
api/auth/signup                    # Server-side signup (bypasses email verification)
api/payments/create                # AuraPay invoice creation
api/webhooks/aurapay               # AuraPay PAID webhook
api/tov/analyze                    # Tone-of-voice analysis
api/auth/telegram                  # POST — Telegram Login Widget auth → returns {email, token} for supabase.auth.verifyOtp()
api/transcribe                     # POST — YouTube URL → Gemini 2.5 Flash transcript (Instagram disabled, returns 400)
api/referral                       # GET — fetch stats + auto-generate code; POST { referralCode } → apply code
docs/privacy, docs/terms           # Legal pages (server-rendered, shared layout)
admin                              # Admin panel — guarded by ADMIN_EMAIL env var (notFound() if mismatch)
```

Middleware (`middleware.ts`) protects `/dashboard/*`, `/generate/*`, `/history/*`, `/editor/*`.

## Generation Wizard

Steps: `input` → `platform_goal` → `template` → `settings` → `generating` → `result`

**Standard Mode** (`api/generate`): Gemini 2.5 Flash Lite via REST fetch. Validates `slideCount` 3-12 (9/12 slides PRO-only). Saves to `generations` table, increments via `increment_standard_used` RPC.

**Photo Mode** (`api/generate/photo`): Skips template step. SSE streaming endpoint. Pipeline: Gemini text → `lib/services/image-generator.ts` (per-slide). Models: `gemini-3-pro-image-preview` (primary), `gemini-2.0-flash-exp-image-generation` (fallback). 2s rate-limit delay between slides. Limited to 3-7 slides. Client: `hooks/usePhotoGeneration.ts` (phases: `idle → content → images → done/error`, `AbortController` support). Photo Mode styles: `"cartoon"` (Pixar/Disney 3D) and `"realistic"` (editorial photography) — defined in `STYLE_PROMPTS` in `lib/services/image-generator.ts`.

## Key Components

| Component | Purpose |
|-----------|---------|
| `components/slides/SlideRenderer.tsx` | Dynamic template selector via `TEMPLATE_MAP` |
| `components/slides/templates/` | 13 React templates: `Chapter` `Dispatch` `Frame` `GridMulti` `Newspaper` `Photo` `PurpleAccent` `QuoteDoodle` `Receipt` `SpeechBubble` `StarHighlight` `Street` `Swipely` |
| `components/slides/types.ts` | `SlideData` type — includes optional `imageUrl?: string` for Photo Mode |
| `components/generate/CarouselEditor.tsx` | Inline editor in result view — per-field font, color, alignment, drag repositioning |
| `components/generate/ExportPanel.tsx` | html2canvas export (lazy loaded) — renders in hidden `sr-only` div |
| `lib/templates/registry.ts` | 11 template definitions (`id`, `name`, `nameRu`, `description`, `preview`, `tags`, `maxWordsPerSlide`, `tone`, optional `proOnly`) |
| `lib/store/editorStore.ts` | Zustand store for drag canvas (`elements[]`, `selectedId`, `zoom`) |
| `components/pricing/CustomSlidePicker.tsx` | One-time slide pack purchase — 40₽/slide, 1-500 slides, `light`/`dark` variants |
| `components/generate/TemplateSwitcher.tsx` | Slide template switcher — modal (desktop) / bottom sheet (mobile), excludes `photo_mode` |
| `components/pricing/PromoPopup.tsx` | Promo popup with countdown timer — dismiss state via `sessionStorage` (key: `promo_50_dismissed`) |
| `lib/supabase/queries.ts` | Typed `Profile` + `Generation` interfaces, `checkLimit`/`incrementUsage` |

**`photo_mode` is NOT in `registry.ts`** — hardcoded in generate page when `mode === "photo"`, only registered in `TEMPLATE_MAP`.

Path alias: `@/*` maps to project root.

## Auth

Supabase SSR (`@supabase/ssr`). Separate browser/server clients in `lib/supabase/`. Admin client in `lib/supabase/admin.ts` (service_role). Signup via `POST /api/auth/signup` uses `admin.createUser({email_confirm: true})` — bypasses verification, then client signs in with password.

Password reset: `forgot-password` calls `supabase.auth.resetPasswordForEmail()` → user clicks email link → lands on `reset-password` with a live session → updates password via `supabase.auth.updateUser()`.

Telegram login: `POST /api/auth/telegram` verifies Telegram Login Widget HMAC, creates/finds user with synthetic email `tg_{id}@telegram.swipely.app`, returns `{email, token}` → client calls `supabase.auth.verifyOtp({email, token, type: "email"})`. Requires `TELEGRAM_BOT_TOKEN` env var.

## Payments (AuraPay)

Products: `pro_monthly` (990₽) · `pro_yearly` (9900₽) · `pack_15` (490₽) · `pack_50` (1490₽) · `pack_150` (3990₽)

Webhook (`api/webhooks/aurapay`): parses `body.custom_fields` JSON → updates `profiles.subscription_tier` or `profiles.photo_slides_balance`.

## ToV (Tone of Voice)

`lib/services/tov-analyzer.ts` — brand voice analysis. Onboarding: paste URL → cheerio scrape (+ Jina Reader fallback at `r.jina.ai/{url}`) → Gemini analysis → saves `tov_profile` (JSONB) + `tov_guidelines` (text) to `profiles`. Guidelines injected into generation system prompt.

## Video-to-Carousel

`api/transcribe` (POST, `maxDuration = 60`): YouTube URLs processed via Gemini 2.5 Flash `fileData` (native video understanding, no download). Instagram support disabled — server-side scraping blocked, returns 400 with user-friendly message. No `OPENAI_API_KEY` needed for currently supported flows.

## Referral System

`profiles` columns: `referral_code` (8-char unambiguous chars, lazy-generated on first `GET /api/referral`), `referral_count`, `referral_bonus_applied`.

Reward: applying a code triggers `grant_referral_bonus` Supabase RPC → `+3 Photo-slides` to both parties. One-time only (`referral_bonus_applied` flag prevents reuse). Can't use your own code.

## Admin Panel

`app/admin/` — protected by `ADMIN_EMAIL` env var (layout checks `user.email !== adminEmail` → `notFound()`).

**Server Actions** (`app/admin/actions.ts`): `updateUserTier(userId, tier)`, `broadcastMessage()` — all call `verifyAdmin()` first (re-checks session server-side).

**Components**: `StatsRow` (key metrics) · `RevenueChart` · `UsersTable` · `PaymentsTable` · `FunnelSection` · `BroadcastSection`

## PWA / OG

`app/manifest.ts` — web app manifest (installable PWA). `app/opengraph-image.tsx` — Next.js OG image generation. `app/apple-icon.svg` — Apple touch icon.

## Motion

`components/ui/motion.tsx` wraps framer-motion: `FadeIn`, `SlideIn`, `StaggerList`, `StaggerItem`, `PageTransition`. Re-exports `AnimatePresence` and `motion`.
