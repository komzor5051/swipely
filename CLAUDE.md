# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Swipely** — AI-powered Instagram carousel generator. Telegram bot that turns voice/text into beautifully designed carousels. Monorepo with multiple interconnected projects.

## Monorepo Structure

```
swipely/
├── swipely-bot/          # Main Telegram bot (Node.js) — PRODUCTION [own git repo]
├── swipely-editor/       # Web editor for carousels (React + Vite) — edit.swipely.ai
├── swipely-api/          # Backend API for Mini App (Express) — api.swipely.ai [has own CLAUDE.md]
├── swipely-nextjs/       # Next.js SaaS app (WIP) [own git repo]
├── brand-templates/      # Brand marketing post templates (HTML → PNG via Puppeteer)
├── landing/              # Static landing page [SEPARATE GIT REPO — never commit from root]
├── src/                  # ⚠️ STALE DUPLICATE of swipely-bot/src — DO NOT EDIT
└── docs/                 # PRICING.md, PROMPTS.md, legal PDFs
```

### ⚠️ Stale Duplicates — DO NOT EDIT

- Root `src/` is an outdated copy of `swipely-bot/src/`. Always work in `swipely-bot/src/`.
- Root `package.json` is a duplicate of `swipely-bot/package.json`.
- `swipely-bot/` contains nested copies of other sub-projects (`swipely-bot/swipely-api/`, `swipely-bot/swipely-editor/`, `swipely-bot/swipely-nextjs/`) — these are duplicates, always use the top-level directories.
- Root `README.md` and `.gitignore` have unresolved git merge conflict markers — ignore them.

### Multiple Git Repos

This is NOT a standard monorepo. Three sub-projects have their own `.git`: `swipely-bot/`, `swipely-nextjs/`, `landing/`. Be careful with git operations — always `cd` into the right directory before committing.

## Development Commands

### swipely-bot (Main Product)
```bash
cd swipely-bot
npm install
npm run dev          # nodemon hot-reload
npm start            # production (node src/index.js)
```
Production: `pm2 start ecosystem.config.js` or Docker

### swipely-editor
```bash
cd swipely-editor
npm install
npm run dev          # Vite dev server
npm run build        # tsc && vite build
```
Deployed on Vercel (edit.swipely.ai)

### swipely-api
```bash
cd swipely-api
npm install
npm run dev          # Express + nodemon (port 3001)
```

### swipely-nextjs (WIP)
```bash
cd swipely-nextjs
npm install
npm run dev          # Next.js (port 3000)
npm run build
npm run lint         # ESLint
```

### brand-templates
```bash
cd brand-templates
node render.js       # Render single template
node render-all.js   # Batch render all templates
```

### Utility Scripts (run from swipely-bot/)
```bash
node broadcast.js          # Send message to all users
node get-users.js          # Export user list
node render-updates.js     # Re-render template previews
node generate-previews.js  # Generate style preview images
```

**No test framework.** Manual test scripts exist (`test-bot.js`, `test-supabase.js`) but there's no jest/vitest/mocha setup.

---

## swipely-bot Architecture

### Mixed JS/TS Codebase

The bot uses both JavaScript and TypeScript. TypeScript files are used directly (no build step). The main `index.js` is JavaScript; many services are `.ts`. `tsconfig.json` at root: `target: ES2020, module: commonjs`.

### The Monolith

`src/index.js` is a **~2,500-line monolith** containing all Telegram handlers, callback routing, and bot logic. All user interaction flows go through this file.

### Generation Pipeline

**Standard Mode:** `User Input → Gemini AI Content → HTML Template → Puppeteer PNG → Telegram`

**Photo Mode:** `User Input + Photo → Gemini Content → Gemini Image Gen → Text Overlay → Telegram`
- Styles: cartoon (Pixar/Disney), realistic (professional photography)
- Max 7 slides, cost ~13.5₽/slide

### Services Layer (swipely-bot/src/services/)

| File | Purpose |
|------|---------|
| `gemini.js` | Primary AI — content generation (Gemini 2.5 Flash), design presets via `getDesignConfig()` |
| `aiService.ts` | AI abstraction layer over multiple providers |
| `claude.js` | Claude AI integration (large file, ~13K lines) |
| `imageGenerator.js` | Photo Mode — Gemini 3 Pro Image generation (~15K lines) |
| `nanobananaService.ts` | Character/avatar image generation for editor |
| `renderer.js` | Puppeteer HTML→PNG rendering, `generateSlideHTML()` template mapping |
| `previewService.js` | Preview image paths and style info |
| `supabaseService.js` | Primary database — 19+ functions for profiles, payments, generations |
| `supabase.ts` | Supabase client initialization |
| `database.js` | Legacy SQLite wrapper (mostly superseded by Supabase) |
| `editorService.js` | Creates edit sessions, uploads images to Supabase Storage |
| `yookassa.js` | YooKassa payment processing |
| `whisper.js` | Voice→text via OpenAI Whisper (optional) |
| `tovAnalyzer.js` | Tone-of-voice analysis for brand consistency |
| `presetService.ts` | Template preset management |
| `adminService.ts` | Admin panel operations (~2K lines) |
| `usageService.ts` | Usage tracking and limits |
| `api.ts` | API client wrapper |
| `userLogger.js` | User activity logging |

### Templates (16 total)

Located in `src/templates/`: `app_list`, `aurora`, `backspace`, `editorial`, `grid_multi`, `lime_checklist`, `luxe`, `notebook`, `paper_image`, `purple_accent`, `quote_doodle`, `receipt`, `speech_bubble`, `star_highlight`, `swipely`, `terminal`

Templates use `{{TITLE}}`, `{{CONTENT}}`, `{{SLIDE_NUMBER}}` placeholders.

### Session State (In-Memory)

```javascript
sessions[userId] = {
  transcription, slideCount, format, generationMode,
  awaitingPhoto, referencePhoto, imageStyle, awaitingUsername
}
```
Sessions are ephemeral — lost on bot restart.

### Callback Data Routing

All Telegram inline keyboard callbacks are routed in `index.js`:

**Exact matches (`===`):** `menu_account`, `menu_buy`, `menu_create`, `menu_legal`, `menu_main`, `menu_referral`, `mode_photo`, `mode_standard`, `view_packs`, `view_pro`, `view_styles`

**Prefix matches (`startsWith`):** `confirm_custom_`, `stars_custom_`, `rub_custom_`, `buy_pack_`, `stars_pack_`, `rub_pack_`, `check_payment_`, `pay_photo_`, `stars_photo_`, `rub_photo_`, `topup_`, `stars_topup_`, `rub_topup_`, `admin_`, `slides_`, `format_`, `tone_`, `imgstyle_`, `style_`

### Telegram Stars Integration

`bot.on('pre_checkout_query')` and `bot.on('successful_payment')` handlers process Telegram Stars payments directly (in addition to YooKassa rubles).

### Pricing (from `src/config/pricing.js`)

| Tier | Price | Standard | Photo Mode |
|------|-------|----------|------------|
| Free | 0₽ | 3/month | Not available |
| PRO Monthly | 990₽/mo | Unlimited | 20% discount |
| PRO Yearly | 9,900₽/yr | Unlimited | 20% discount |

Photo Mode per-carousel: 149₽ (3 slides), 249₽ (5), 349₽ (7)
Slide packs: 490₽ (15), 1490₽ (50), 3990₽ (150)
Per-slide top-up: 49₽ (free) / 39₽ (PRO)
Telegram Stars multiplier: RUB × 0.693 = Stars

### Database (Supabase PostgreSQL)

Primary tables: `profiles` (users, subscriptions, balances, referrals, TOV), `payments` (transactions with YooKassa/Stars), `generations` (tracking)
Schema: `supabase_migration.sql`. RLS is commented out (not enabled).

### Legacy React Structure

`src/components/`, `src/contexts/`, `src/hooks/` exist in `swipely-bot/src/` from an earlier React app. These are leftover artifacts, not used by the current bot.

---

## swipely-editor Architecture

```
Bot generates carousel → Creates Supabase session (24h token) →
User edits at edit.swipely.ai/{token} → Exports PNG via html2canvas
```

**Main file:** `src/App.tsx` (~700 lines). Components: `ExportButton`, `SlideCanvas`, `SlideNavigator`, `TextEditPanel`.

**Vercel Edge Functions** in `api/`:
- `POST /api/sessions` — Create session (bot-only, Bearer auth)
- `GET /api/sessions/{token}` — Get session data
- `PUT /api/sessions/{token}` — Update carousel data

---

## swipely-api Architecture

Backend for Telegram Mini App. Express server on port 3001.

**Auth:** `Authorization: tma <initData>` — HMAC-SHA256 verification of Telegram initData

**Routes:**
- `POST /api/auth/telegram` — Verify initData, get/create profile
- `GET /api/auth/me` — Get current user
- `POST /api/carousel/generate` — AI generation via OpenRouter (Claude 3.5 Haiku)
- `GET /api/usage/check` — Check remaining generations
- `GET /api/usage/stats` — Usage statistics

**Structure:** `src/routes/` (auth, carousel, usage), `src/middleware/auth.js` (requireAuth, optionalAuth), `src/services/` (openrouter, supabase, telegram).

---

## swipely-nextjs Architecture (WIP — Active Development)

Next.js 16.1 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui (New York style) + Zustand + @dnd-kit.

### App Routes

```
(auth)/login, signup, callback     # Supabase auth flow
(dashboard)/dashboard              # Main dashboard
(dashboard)/dashboard/settings     # User settings
(dashboard)/editor                 # Drag-and-drop canvas editor
(dashboard)/generate               # AI carousel generation page
(dashboard)/history                # Generation history
pricing                            # Public pricing page
api/generate                       # AI generation API route
api/webhooks                       # Payment webhooks
```

### Key Architecture Layers

**Editor** — Drag-and-drop canvas (1080x1350 scaled to 50%) using @dnd-kit + Zustand:
- `lib/store/editorStore.ts` — State: `elements[]`, `selectedId`, `zoom`. Actions: `moveElement`, `deleteElement`, `selectElement`, `toggleVisibility`
- `lib/templates/types.ts` — Element types: text, avatar, decoration, icon, badge, button
- `lib/templates/registry.ts` — All 16 template definitions (metadata, colors, fonts)
- `components/editor/` — SlideCanvas, DraggableElement, ElementRenderer, LayersPanel, Toolbar

**Auth** — Supabase SSR (`@supabase/ssr`) with middleware route protection. Separate browser/server clients in `lib/supabase/`.

**Shared Components** — `components/shared/` includes Navbar, Footer, SectionHeader, Logo.

**DB Queries** — `lib/supabase/queries.ts` for database operations.

### Development Progress (per TODO.md)

| Phase | Status |
|-------|--------|
| Phase 1: Basic Canvas | Done |
| Phase 2: State & UI | Done |
| Phase 3: Templates (JSON conversion, loading, rendering) | In progress |
| Phase 4: Bot Integration (API endpoints, Puppeteer dynamic rendering) | Not started |

### swipely-nextjs Environment Variables (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## brand-templates Architecture

10 HTML templates for social media marketing posts. Rendered to PNG via Puppeteer.

**Brand colors:** `--primary: #0A84FF`, `--lime: #D4F542`, `--pink: #F9A8D4`, `--charcoal: #1A1A2E`. **Fonts:** Outfit (400-800), Space Mono (numbers).

Template categories: announcements (square/vertical/dark), educational (square/vertical/tips-list), brand (blue/dark).

---

## Critical Patterns

### DO NOT use Telegraf
```javascript
// CORRECT — node-telegram-bot-api
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(token, { polling: true });
// Telegraf has Node.js v24 incompatibility — never use it
```

### Callback Query Timeout
```javascript
try {
  await bot.answerCallbackQuery(query.id);
} catch (err) {
  if (!err.message.includes('too old')) console.error(err);
}
```

### AI Response Parsing
Always strip markdown wrappers before JSON.parse:
```javascript
cleanedContent = content.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '');
```

### Error Convention
Services return `null` on error. User-facing error messages come from `src/utils/copy.js` (534 lines, all Russian), not from thrown exceptions.

### All UI Text
Every user-facing string is in `src/utils/copy.js`. Constants in `src/utils/constants.ts`.

---

## Adding New Templates

1. Create `src/templates/{name}.html` with `{{TITLE}}`, `{{CONTENT}}` placeholders
2. Add preset to `getDesignConfig()` in `gemini.js`
3. Add mapping in `generateSlideHTML()` in `renderer.js`
4. Add callback handler for `style_{name}` in `index.js`
5. Update `styleDescriptions` in `copy.js`
6. Add preview image to `previews/{name}.png`

---

## Environment Variables

### swipely-bot/.env
```
TELEGRAM_BOT_TOKEN=
GOOGLE_GEMINI_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=        # Actually service_role key (misleading name)
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=
OPENAI_API_KEY=           # Optional — voice transcription
EDITOR_API_URL=           # https://edit.swipely.ai
EDITOR_BOT_SECRET=
```

### swipely-editor/.env.local
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
EDITOR_BOT_SECRET=
```

### swipely-api/.env
```
TELEGRAM_BOT_TOKEN=
OPENROUTER_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
```

---

## Deployment

| Project | Platform | Config |
|---------|----------|--------|
| swipely-bot | Railway / VPS | `Dockerfile`, `railway.json`, `ecosystem.config.js` (PM2) |
| swipely-editor | Vercel | `vercel.json` (edit.swipely.ai) |
| swipely-api | Manual / VPS | Express server (port 3001) |
| swipely-nextjs | Not deployed | WIP |
| landing | Vercel | Static HTML (separate git repo) |
| brand-templates | Local only | Puppeteer rendering scripts |

Docker uses `node:18-slim` with Chromium for Puppeteer, runs as non-root `botuser`. Note: Dockerfiles exist at both root and `swipely-bot/` (same content).

---

## Common Issues

| Issue | Solution |
|-------|----------|
| Callback timeout | Already handled — ignores "too old" errors |
| Gemini 429 | Quota exceeded, wait or upgrade plan |
| Gemini 503 | Server overloaded, built-in retry logic |
| Voice not working | `OPENAI_API_KEY` not set (optional feature) |
| Puppeteer on Linux | Install `chromium-browser`, use `--no-sandbox` |
| Root `src/` confusion | Always use `swipely-bot/src/` — root copy is stale |
| README.md conflicts | Has unresolved git merge markers — ignore it |
