# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Swipely** - AI-powered Instagram carousel generator platform. This is a **monorepo** containing multiple interconnected projects.

## Monorepo Structure

```
swipely/
├── swipely-bot/          # Main Telegram bot (Node.js) - PRODUCTION
├── swipely-editor/       # Web editor for carousels (React + Vite) - edit.swipely.ai
├── swipely-api/          # Backend API for Mini App (Express) - api.swipely.ai
├── swipely-nextjs/       # Next.js frontend (WIP SaaS boilerplate)
└── src/                  # Duplicate of swipely-bot/src (keep in sync)
```

## Development Commands by Project

### swipely-bot (Main Bot)
```bash
cd swipely-bot
npm install && npm run dev   # Development with nodemon
npm start                    # Production
```

### swipely-editor (Web Editor)
```bash
cd swipely-editor
npm install && npm run dev   # Vite dev server (localhost:3001)
npm run build                # Production build
```

### swipely-api (Backend API)
```bash
cd swipely-api
npm install && npm run dev   # Express server (localhost:3001)
```

### swipely-nextjs (Next.js App)
```bash
cd swipely-nextjs
npm install && npm run dev   # Next.js dev (localhost:3000)
npm run lint                 # ESLint
```

## Tech Stack Summary

| Project | Stack |
|---------|-------|
| swipely-bot | Node.js, node-telegram-bot-api, Gemini AI, Puppeteer, SQLite, Supabase, YooKassa |
| swipely-editor | React 18, TypeScript, Vite, Tailwind, html2canvas, Supabase, Vercel Edge Functions |
| swipely-api | Express, Supabase, OpenRouter (Claude), Telegram initData verification |
| swipely-nextjs | Next.js 16, React 19, Tailwind v4, Supabase SSR, Zustand, React Hook Form |

---

## swipely-bot Architecture (Main Product)

### Generation Modes

**Standard Mode:** `User Input → Gemini Content → Puppeteer HTML→PNG → Telegram`
- 9 templates: minimal_pop, notebook, darkest, aurora, terminal, editorial, zen, memphis, luxe

**Photo Mode:** `User Input + Photo → Gemini Content → Gemini Image Gen → Text Overlay → Telegram`
- Styles: cartoon (Pixar/Disney), realistic (professional photography)
- Max 7 slides, ~$0.04/image cost

### Core Bot Files

| File | Purpose |
|------|---------|
| `src/index.js` | Main bot logic, all Telegram handlers (~90KB) |
| `src/services/gemini.js` | AI content generation with OpenRouter fallback |
| `src/services/imageGenerator.js` | AI image generation (Photo Mode) |
| `src/services/renderer.js` | Puppeteer HTML→PNG rendering |
| `src/services/database.js` | SQLite with schema migrations |
| `src/services/editorService.js` | Web editor integration |
| `src/utils/copy.js` | All UI text (Russian) |
| `src/templates/*.html` | Design templates with `{{TITLE}}`, `{{CONTENT}}` placeholders |

### Session State (In-Memory)

```javascript
sessions[userId] = {
  transcription, slideCount, format, generationMode,
  awaitingPhoto, referencePhoto, imageStyle, awaitingUsername
}
```

### Callback Data Prefixes

`menu_*`, `slides_*`, `format_*`, `mode_*`, `style_*`, `imgstyle_*`, `buy_*`, `view_*`, `check_payment_*`, `pay_photo_*`, `topup_*`

---

## swipely-editor Architecture

### Flow
```
Bot generates carousel → Creates session via API (24h token) →
User edits at edit.swipely.ai/{token} → Exports PNG via html2canvas
```

### API Endpoints (Vercel Edge Functions)
- `POST /api/sessions` - Create session (bot-only, requires Bearer token)
- `GET /api/sessions/{token}` - Get session data
- `PUT /api/sessions/{token}` - Update carousel data

---

## swipely-api Architecture

Backend for Telegram Mini App. Handles:
- Telegram initData verification (HMAC-SHA256)
- AI generation via OpenRouter (Claude 3.5 Haiku)
- Usage tracking in Supabase

### Endpoints
- `POST /api/auth/telegram` - Verify initData, get/create profile
- `POST /api/carousel/generate` - Generate carousel content
- `GET /api/usage/check` - Check remaining generations

Auth header: `Authorization: tma <initData>`

---

## Critical Patterns

### Telegram Bot Framework
```javascript
// CORRECT - node-telegram-bot-api
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(token, { polling: true });

// WRONG - DO NOT USE Telegraf (Node.js v24 incompatibility)
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

### Services Return null on Error
Error messages come from `src/utils/copy.js`, not exceptions.

---

## Environment Variables

### swipely-bot/.env
```env
TELEGRAM_BOT_TOKEN=
GOOGLE_GEMINI_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=        # Use service_role key!
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=
OPENAI_API_KEY=           # Optional (voice)
EDITOR_API_URL=           # https://edit.swipely.ai
EDITOR_BOT_SECRET=
```

### swipely-editor/.env.local
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
EDITOR_BOT_SECRET=
```

### swipely-api/.env
```env
TELEGRAM_BOT_TOKEN=
OPENROUTER_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
```

---

## Pricing Model

- **FREE:** 3 Standard carousels/month
- **PRO (990₽/mo):** Unlimited Standard, 20% Photo Mode discount
- **Photo Mode:** 149-349₽ per carousel (3-7 slides)
- **Slide Packs:** 490₽ (15), 1490₽ (50), 3990₽ (150)
- **Cost:** ~13.5₽/Photo slide, ~0.5₽/Standard carousel

---

## Adding New Templates

1. Create `src/templates/{name}.html` with placeholders
2. Add preset to `getDesignConfig()` in `gemini.js`
3. Add mapping in `generateSlideHTML()` in `renderer.js`
4. Add callback handler for `style_{name}` in `index.js`
5. Update `styleDescriptions` in `copy.js`
6. Add preview to `previews/{name}.png`

---

## Common Issues

| Issue | Solution |
|-------|----------|
| Callback timeout | Already handled - ignores "too old" errors |
| Gemini 429 | Quota exceeded, wait or upgrade |
| Gemini 503 | Server overloaded, retry logic handles |
| Voice not working | OPENAI_API_KEY missing (optional feature) |
| Puppeteer on Linux | Install chromium-browser, use --no-sandbox |

---

## File Locations

- **Database:** `swipely-bot/data/swipely.db`
- **Output:** `swipely-bot/output/` (temporary PNGs)
- **Templates:** `swipely-bot/src/templates/`
- **Supabase migration:** `supabase_migration.sql`
