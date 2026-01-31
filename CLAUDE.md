# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Swipely Telegram Bot** - AI-powered Instagram carousel generator. Users send text or voice, bot generates viral-ready carousel slides (PNG images) using Google Gemini AI with professional design templates.

**Tech Stack:**
- `node-telegram-bot-api` v0.67.0 (NOT Telegraf - migrated due to Node.js v24 issues)
- Google Gemini API:
  - `gemini-2.5-flash-lite` for content generation
  - `gemini-3-pro-image-preview` for AI image generation (Photo Mode)
- Puppeteer v23.11.1 for HTML → PNG rendering (1080x1350px Instagram format)
- better-sqlite3 for local database (users, payments, generations)
- Supabase for cloud backup and analytics
- OpenAI Whisper (optional) for voice transcription
- YooKassa for payment processing

## Development Commands

```bash
npm install     # Install dependencies
npm run dev     # Development mode (nodemon auto-reload)
npm start       # Production mode
```

Bot runs as long-lived process with polling. Check logs for emoji indicators: `✅🤖📊🎨💳`

## Environment Setup

Required `.env` variables:

```env
TELEGRAM_BOT_TOKEN=<from BotFather>
GOOGLE_GEMINI_API_KEY=<from aistudio.google.com>
SUPABASE_URL=<supabase project URL>
SUPABASE_ANON_KEY=<service_role key>  # Use service_role, NOT anon
OPENAI_API_KEY=<optional for voice>
YOOKASSA_SHOP_ID=<from YooKassa>
YOOKASSA_SECRET_KEY=<from YooKassa>
```

Optional: `OPENROUTER_API_KEY` for fallback content generation.

## Architecture

### Two Generation Modes

**Standard Mode (HTML Templates):**
```
User Input → Gemini Content → Puppeteer HTML→PNG → Telegram
9 templates: minimal_pop, notebook, darkest, aurora, terminal, editorial, zen, memphis, luxe
```

**Photo Mode (AI-Generated Images):**
```
User Input + Reference Photo → Gemini Content → Gemini Image Gen → Puppeteer overlay → Telegram
Max 7 slides, styles: cartoon (Pixar/Disney), realistic (professional photography)
```

### Core Files

| File | Purpose |
|------|---------|
| `src/index.js` | Main bot logic, all Telegram handlers (~1500 lines) |
| `src/services/gemini.js` | AI content generation with Gemini + OpenRouter fallback |
| `src/services/imageGenerator.js` | AI image generation (Photo Mode) with 2K quality |
| `src/services/renderer.js` | Puppeteer HTML→PNG pipeline with adaptive typography |
| `src/services/database.js` | SQLite database with schema migrations |
| `src/services/yookassa.js` | YooKassa payment integration |
| `src/services/supabaseService.js` | Cloud backup and analytics |
| `src/config/pricing.js` | Pricing configuration with margin calculations |
| `src/utils/copy.js` | All UI text (Russian) - single source of truth |
| `src/templates/*.html` | 9 design templates with CSS-in-HTML |
| `src/data/demoCarousel.js` | Static JSON for demo carousel |

### Session Management (In-Memory)

```javascript
sessions[userId] = {
  transcription: string,      // User's text or voice
  slideCount: number,         // 3, 5, 7, 10, or 12
  format: string,             // 'square' (1080×1080) or 'portrait' (1080×1350)
  generationMode: string,     // 'standard' or 'photo'
  awaitingPhoto: boolean,     // Waiting for user photo (Photo Mode)
  referencePhoto: string,     // Base64 of user's photo
  imageStyle: string,         // 'cartoon' or 'realistic'
  awaitingUsername: boolean   // Waiting for username input
}
```

Sessions are cleared after carousel generation.

### Data Flow: Standard Mode

1. User sends text → stored in `sessions[userId].transcription`
2. User selects slide count → `sessions[userId].slideCount`
3. User selects format (square/portrait) → `sessions[userId].format`
4. User selects template style → triggers generation:
   - `gemini.generateCarouselContent()` → returns JSON with slides array
   - `renderer.renderSlides()` → Puppeteer renders each slide to PNG
   - Bot sends media group to Telegram
   - `db.deductStandard()` decrements monthly limit

### Data Flow: Photo Mode

1. Steps 1-3 same as Standard
2. User selects Photo Mode → checks `db.canGeneratePhoto()` for balance
3. User selects image style (cartoon/realistic)
4. User sends photo → `imageGenerator.downloadTelegramPhoto()` converts to base64
5. `gemini.generateCarouselContent()` with `photo_mode` preset (shorter text)
6. `imageGenerator.generateCarouselImages()` → Gemini generates AI images
7. `renderer.renderSlidesWithImages()` → overlays text on AI images
8. `db.deductPhotoSlides()` decrements slide balance

## Pricing Model

**Subscriptions:**
- FREE: 3 Standard carousels/month, no Photo Mode
- PRO (990₽/mo): Unlimited Standard, 20% discount on Photo Mode

**Photo Mode (Pay-per-use):**
- 3 slides: 149₽ (FREE) / 119₽ (PRO)
- 5 slides: 249₽ (FREE) / 199₽ (PRO)
- 7 slides: 349₽ (FREE) / 279₽ (PRO)

**Per-Slide Top-Up:** 49₽/slide (FREE) / 39₽/slide (PRO)

**Slide Packs:** 15 slides (490₽), 50 slides (1490₽), 150 slides (3990₽)

**Referral Program:** Inviter gets 5 Photo slides, invited gets 3 Photo slides

**Cost structure:** ~13.5₽/Photo slide, ~0.5₽/Standard carousel. Target margin ≥66%.

## Important Code Patterns

### 1. Framework: node-telegram-bot-api (NOT Telegraf)

```javascript
// Correct:
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(token, { polling: true });

// Wrong (DO NOT USE):
const { Telegraf } = require('telegraf');
```

### 2. Callback Query Timeout Handling

Long operations (15-20 seconds) cause Telegram timeout errors:

```javascript
try {
  await bot.answerCallbackQuery(query.id);
} catch (err) {
  if (!err.message.includes('too old')) {
    console.error(err.message);
  }
}
```

### 3. HTML Template Injection

Templates use simple string replacement, NOT a template engine:

```javascript
html = html.replace(/\{\{TITLE\}\}/g, slide.title || '');
html = html.replace(/\{\{CONTENT\}\}/g, slide.content || '');
html = html.replace(/\{\{SLIDE_NUMBER\}\}/g, slideNumber);
```

### 4. Error Handling Pattern

Services return `null` on error instead of throwing exceptions. User-friendly error messages come from `src/utils/copy.js`.

### 5. Database Operations

Primary storage is SQLite (`src/services/database.js`). Supabase is used for cloud backup (`src/services/supabaseService.js`).

Key database functions:
- `db.init()` - Initialize tables with migrations
- `db.getUserStatus(userId)` - Get user tier, limits, balance
- `db.canGenerateStandard(userId)` - Check monthly limit
- `db.canGeneratePhoto(userId, slideCount)` - Check Photo Mode balance
- `db.processSuccessfulPayment(paymentId)` - Handle YooKassa callback
- `db.resetMonthlyLimitsIfNeeded(userId)` - Auto-resets on new month

### 6. AI Content Generation with Fallback

```javascript
// gemini.js tries Gemini first, then OpenRouter as fallback
try {
  content = await generateViaGemini(prompt, systemPrompt);
} catch (error) {
  content = await generateViaOpenRouter(prompt, systemPrompt);
}
```

### 7. AI Response Parsing

Gemini responses may include markdown wrappers - always clean before parsing:

```javascript
let cleanedContent = content.trim();
if (cleanedContent.startsWith('```json')) {
  cleanedContent = cleanedContent.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '');
}
const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
```

### 8. Image Format Sizes

```javascript
const FORMAT_SIZES = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 }
};
```

## User Flow

```
/start → Main Menu
    ├── ✨ Create Carousel → Text/Voice Input → Slide Count → Format → Mode
    │       ├── Standard → Style Preview → Select Template → Generate
    │       └── Photo Mode → Style (Cartoon/Realistic) → Send Photo → Generate
    ├── 💳 Buy → Slide Packs or PRO subscription
    ├── 👤 Account → Status, balance, subscription
    ├── 👥 Referral → Referral link and stats
    └── /username → Set display username (shows in corner of slides)
```

## Callback Data Prefixes

| Prefix | Purpose |
|--------|---------|
| `menu_*` | Main menu navigation (create, buy, account, main, referral, legal) |
| `slides_*` | Slide count selection (3, 5, 7, 10, 12) |
| `format_*` | Format selection (square, portrait) |
| `mode_*` | Generation mode (standard, photo) |
| `style_*` | HTML template selection (minimal_pop, notebook, etc.) |
| `imgstyle_*` | Photo Mode image style (cartoon, realistic) |
| `buy_*` | Purchase actions (pack_small, pack_medium, pro_month, etc.) |
| `view_*` | View details (packs, pro, styles) |
| `check_payment_*` | Payment status check |
| `pay_photo_*` | Direct Photo Mode payment |
| `topup_*` | Per-slide top-up purchase |

## Common Issues

### Callback Query Timeout
**Symptom:** "query is too old and response timeout expired"
**Solution:** Already handled - try-catch wrapper ignores timeout errors

### Voice Input Not Working
**Cause:** `OPENAI_API_KEY` missing
**Solution:** Voice is optional - bot works with text only

### Gemini API Errors
- **429:** Quota exceeded, wait or upgrade
- **503:** Server overloaded, retry logic handles this
- **404:** Model name incorrect (content: `gemini-2.5-flash-lite`, images: `gemini-3-pro-image-preview`)

### Payment Issues
Check YooKassa credentials in `.env`. Bot creates payment → user pays externally → returns via deep link `/start payment_<id>` → bot checks status.

### Puppeteer on Linux
Requires system dependencies:
```bash
sudo apt-get install -y chromium-browser
```
Bot uses `--no-sandbox --disable-setuid-sandbox` flags.

## File Locations

- **Database:** `./data/swipely.db` (SQLite, auto-created)
- **Output images:** `./output/` (temporary PNGs, sent to Telegram)
- **Temp files:** `./temp/` (voice messages)
- **Legal docs:** `./docs/*.pdf` (privacy policy, offer)

## Prompts

All AI prompts are documented in `docs/PROMPTS.md`:
- Content generation: Expert SMM strategist, viral headline formulas, 3-6 word headlines
- Image generation: No text/letters on images, clear space for overlay

## Testing

No automated tests. Manual testing via Telegram:

1. Send `/start` to bot
2. Send text: "5 tips for productivity"
3. Select slide count, format, mode
4. Select style (Standard) or send photo (Photo Mode)
5. Verify carousel generation + delivery
