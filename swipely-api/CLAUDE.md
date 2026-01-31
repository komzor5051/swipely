# CLAUDE.md

This file provides guidance to Claude Code when working with the Swipely API backend.

## Project Overview

**Swipely API** - Backend server for Swipely Telegram Mini App. Handles Telegram authentication, proxies AI requests to OpenRouter (Claude 3.5 Haiku), and manages usage tracking.

**Tech Stack:**
- Node.js + Express
- Supabase (PostgreSQL) with service_role access
- OpenRouter API (Claude 3.5 Haiku)
- Telegram WebApp initData verification

## Development Commands

```bash
# Install dependencies
npm install

# Development mode (auto-reload)
npm run dev

# Production mode
npm start

# Server runs on PORT 3001 by default
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Bot token from BotFather (for initData verification) |
| `OPENROUTER_API_KEY` | API key from openrouter.ai |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | **service_role** key (NOT anon!) |
| `PORT` | Server port (default: 3001) |

## API Endpoints

### Authentication

**POST /api/auth/telegram**
- Verify Telegram initData and get/create profile
- Body: `{ initData: string }`
- Returns: `{ success, user, profile }`

**GET /api/auth/me**
- Get current user profile
- Header: `Authorization: tma <initData>`

### Carousel Generation

**POST /api/carousel/generate**
- Generate carousel content using AI
- Header: `Authorization: tma <initData>`
- Body: `{ topic: string, settings: { language, slideCount, style, includeOriginalText } }`
- Returns: `{ success, data: { globalDesign, slides }, usage }`

### Usage Tracking

**GET /api/usage/check**
- Check remaining generations
- Header: `Authorization: tma <initData>`
- Returns: `{ success, usage: { canGenerate, remaining, limit, used, isPro } }`

**GET /api/usage/stats**
- Detailed usage statistics
- Returns: `{ success, stats: { thisMonth, total, lastGeneration } }`

## Architecture

```
src/
├── index.js                 # Express server entry
├── routes/
│   ├── auth.js              # /api/auth/* endpoints
│   ├── carousel.js          # /api/carousel/* endpoints
│   └── usage.js             # /api/usage/* endpoints
├── services/
│   ├── telegram.js          # initData verification (HMAC-SHA256)
│   ├── supabase.js          # Database operations
│   └── openrouter.js        # AI content generation
└── middleware/
    └── auth.js              # requireAuth, optionalAuth middleware
```

## Telegram initData Verification

The server verifies initData using HMAC-SHA256:

1. Parse initData as URLSearchParams
2. Extract and remove `hash` parameter
3. Sort remaining params alphabetically
4. Create data-check-string: `key=value\nkey=value...`
5. Generate secret: `HMAC_SHA256("WebAppData", BOT_TOKEN)`
6. Calculate hash: `HMAC_SHA256(secret, data_check_string)`
7. Compare with provided hash

Auth header format: `Authorization: tma <initData>`

## Database Migration

Before running, execute `migrations/001_add_telegram_fields.sql` in Supabase SQL Editor. This adds:

- `telegram_id BIGINT UNIQUE` column to profiles
- `telegram_username TEXT` column
- `full_name TEXT` column
- `upsert_telegram_profile()` function
- `check_generation_limit_by_telegram()` function

## Security Notes

- Uses `service_role` key for full database access
- All AI API keys are server-side only
- initData verified with bot token before any operation
- 24-hour expiry check on initData
- CORS restricted to known origins

## Integration with Mini App

Frontend should:

1. Get `Telegram.WebApp.initData` on load
2. Send to `/api/auth/telegram` to verify and get profile
3. Include `Authorization: tma ${initData}` header in all requests
4. Handle 401 errors by re-authenticating

Example:
```javascript
const initData = window.Telegram.WebApp.initData;

const response = await fetch('https://api.swipely.ai/api/carousel/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `tma ${initData}`
  },
  body: JSON.stringify({ topic: '5 tips for productivity', settings: { slideCount: 5 } })
});
```
