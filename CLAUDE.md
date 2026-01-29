# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Swipely Telegram Bot** - AI-powered Instagram carousel generator. Users send text or voice → bot generates viral-ready carousel slides (PNG images) using Google Gemini AI with professional design templates.

**Tech Stack:**
- `node-telegram-bot-api` v0.67.0 (NOT Telegraf - important!)
- Google Gemini API:
  - `gemini-2.5-flash-lite` for AI content generation
  - `gemini-3-pro-image-preview` for AI image generation (Nano Banana Pro, 2K quality)
- Puppeteer v23.11.1 for HTML → PNG rendering (1080x1350px Instagram format)
- Supabase (PostgreSQL) for user profiles, messages, usage tracking
- OpenAI Whisper (optional) for voice transcription

## Development Commands

```bash
# Install dependencies
npm install

# Development mode (auto-reload with nodemon)
npm run dev

# Production mode
npm start

# The bot runs as long-lived process with polling
# Check logs for: ✅🤖📊🎨 emoji indicators
```

## Environment Setup

Required `.env` variables:

```env
TELEGRAM_BOT_TOKEN=<from BotFather>
GOOGLE_GEMINI_API_KEY=<from aistudio.google.com>
SUPABASE_URL=<supabase project URL>
SUPABASE_ANON_KEY=<service_role key>  # CRITICAL: Use service_role, NOT anon
OPENAI_API_KEY=<optional for voice>
```

**CRITICAL**: Bot uses `service_role` key (not `anon`) because it's a backend service. Variable name says `ANON_KEY` but should contain `service_role` value.

## Pricing & Monetization

**Model: Subscriptions + Pay-per-use**

### Subscriptions
| Tier | Price | Standard | Photo Mode |
|------|-------|----------|------------|
| FREE | 0₽ | 3/month | unavailable |
| PRO | 990₽/mo | unlimited | -20% discount |

### Photo Mode Pricing (Pay-per-use)
| Slides | FREE price | PRO price | Cost | Margin |
|--------|------------|-----------|------|--------|
| 3 | 149₽ | 119₽ | 40₽ | 73%/66% |
| 5 | 249₽ | 199₽ | 67₽ | 73%/66% |
| 7 | 349₽ | 279₽ | 94₽ | 73%/66% |

### Slide Packs (bulk discount)
| Pack | Slides | Price | Per slide |
|------|--------|-------|-----------|
| Small | 15 | 490₽ | 33₽ |
| Medium | 50 | 1490₽ | 30₽ |
| Large | 150 | 3990₽ | 27₽ |

**Key files:**
- `src/config/pricing.js` - All prices and limits
- `src/services/database.js` - Balance/limit functions
- `src/utils/copy.js` - Payment UI text (section `pricing`)
- `docs/PRICING.md` - Full documentation

**Bot commands:**
- `/account` - View balance and subscription status
- `/buy` - Purchase packs or PRO

## Architecture

**Two Generation Modes:**

### Standard Mode (HTML Templates)
```
User Input (text/voice)
    ↓
[Session] (in-memory: transcription, slide count)
    ↓
[Gemini] Content generation with viral hooks
    ↓
[Puppeteer] HTML templates → PNG (1080x1350px)
    9 templates: minimal_pop, notebook, darkest, aurora, terminal, editorial, zen, memphis, luxe
    ↓
[Telegram] sendMediaGroup()
```

### Photo Mode (AI-Avatars / Nano Banana)
```
User Input (text/voice) + Reference Photo
    ↓
[Gemini Content] Short text for overlay (25 words/slide)
    ↓
[Gemini 3 Pro Image] AI image generation (2K, no text on image)
    - cartoon style (Pixar/Disney)
    - realistic style (professional photography)
    ↓
[Puppeteer] Overlay text on AI images → PNG
    ↓
[Telegram] sendMediaGroup()
```

**Max 7 slides** in Photo Mode (API cost optimization)

## Core Services

### src/services/gemini.js (Content Generation)
- **Model**: `gemini-2.5-flash-lite` (fast, free tier)
- **Retry Logic**: 3 attempts with exponential backoff for 503 errors
- **Function**: `generateCarouselContent(userText, stylePreset, slideCount, toneGuidelines)`
- **System Prompt**: Expert SMM strategist with viral headline formulas
  - Headlines: STRICTLY 3-6 words, trigger-based
  - Content: 25-50 words per slide (varies by template)
  - Tone Adaptation: reads user's message history to match style

### src/services/renderer.js (Visual Rendering)
- **Framework**: Puppeteer (headless Chrome)
- **Formats**: square (1080×1080) and portrait (1080×1350)
- **Username overlay**: If user has set username via /username, it's injected as bottom-left overlay
- **Process**:
  1. Load HTML template for selected style
  2. Inject content via **string replacement** (NOT template engine):
     ```javascript
     html = html.replace(/\{\{TITLE\}\}/g, slide.title);
     html = html.replace(/\{\{CONTENT\}\}/g, slide.content);
     ```
  3. Apply format dimensions and inject username overlay CSS/HTML
  4. Screenshot at selected format (2x scale for quality)
  5. Save to `/output/slide_<timestamp>_<num>.png`
- **Auto-formatting**: `notebook.html` has JavaScript that runs on `DOMContentLoaded` to format numbered lists

### src/services/supabaseService.js (Database)
- **Key Functions**:
  - `upsertUser(telegramUser)` - create/update via SQL function
  - `saveMessage()` - log for tone analysis
  - `getUserMessageHistory()` - fetch last N messages
  - `checkOnboardingStatus()` - check if user completed setup
  - `saveDisplayUsername(telegramId, username)` - save custom username
  - `getDisplayUsername(telegramId)` - get username for slide overlay
- **Tables**: `profiles`, `user_messages`, `usage_tracking`, `projects`

### src/services/imageGenerator.js (AI Image Generation)
- **Model**: `gemini-3-pro-image-preview` (Nano Banana Pro)
- **Fallback**: `gemini-2.0-flash-exp-image-generation` if primary unavailable
- **Quality**: 2K resolution, 4:5 aspect ratio
- **Key Functions**:
  - `generateImageWithReference(slideContent, photoBase64, style, slideNum, total)` - with user photo
  - `generateImageFromText(theme, style)` - fallback without photo
  - `generateCarouselImages(carouselData, photoBase64, style)` - orchestrator
  - `downloadTelegramPhoto(bot, fileId)` - download and convert to base64
- **Styles**: `cartoon` (Pixar/Disney) and `realistic` (professional photography)
- **CRITICAL**: Prompts explicitly forbid any text/letters on generated images

### src/services/whisper.js (Voice Transcription)
- **Optional**: If `OPENAI_API_KEY` missing, voice input disabled gracefully
- Downloads Telegram voice (OGG) → Whisper API → Russian text

### src/services/previewService.js (Style Previews)
- Generates 540×540 preview images for each style
- Previews stored in `/previews/` folder (auto-generated on first use)
- Sent as media album when user selects "Standard" mode or "View Styles"

### src/utils/copy.js (UI Text)
- **Centralized** Russian-language strings for all bot messages
- Organized by feature: `start`, `onboarding`, `mainFlow`, `photoMode`, `username`, `errors`

## User Flow

```
/start → Main Menu

/username → Set display username (shows in corner of all slides)

Text/Voice Input
  ↓
Select slide count [3] [5] [7] [10] [12]
  ↓
Select format:
  ├─→ [◻️ Квадрат] (1080×1080) - Instagram feed
  └─→ [▯ Портрет] (1080×1350) - Instagram Stories
  ↓
Select mode:
  ├─→ [🎨 Standard] → Preview album (9 styles) → Select template → Generate
  └─→ [📸 Photo Mode] → Select style [Cartoon/Realistic] → Send photo → Generate
```

## Design Templates

**9 HTML Templates** (1080x1350px Instagram format):

| Template | Style | Typography |
|----------|-------|------------|
| `minimal_pop` | Neo-brutalist, diagonal slash | Syne + IBM Plex Sans |
| `notebook` | Handwritten notes, paper texture | Caveat + Lora |
| `darkest` | Cyberpunk, neon effects | Bebas Neue + Montserrat |
| `aurora` | Ethereal gradients | — |
| `terminal` | Retro computer | — |
| `editorial` | Fashion magazine | — |
| `zen` | Japanese minimalism | — |
| `memphis` | 80s retro | — |
| `luxe` | Luxury (gold + marble) | — |

**Rendering Pattern**: Load template → Replace `{{TITLE}}`, `{{CONTENT}}`, `{{SLIDE_NUMBER}}` → Screenshot → PNG

**Photo Mode Rendering**: AI image (base64) → CSS background-image → Gradient overlay → Text with text-shadow

## Database Schema (Supabase)

**profiles** - Unified user table (web + Telegram)
- `telegram_id` BIGINT (for bot users)
- `auth_user_id` UUID (for web users)
- `display_username` TEXT (custom username shown on slides)
- `onboarding_completed` BOOLEAN
- `user_context` TEXT (who are you?)
- `user_role` TEXT (expert/visionary/friend)
- `tov_profile` JSONB (tone analysis)

**user_messages** - Message history for tone analysis
- `profile_id` → profiles(id)
- `message_text` TEXT
- `created_at` TIMESTAMP

**usage_tracking** - Generation limits
- Free: 5/month, Pro: 50/month
- Resets monthly via `DATE_TRUNC('month', NOW())`

**SQL Functions**:
- `upsert_telegram_profile()` - create/update user
- `check_generation_limit()` - validate monthly quota

**RLS**: Bot uses `service_role` key to bypass Row Level Security (it's a backend service, not frontend client)

## Session Management

**In-Memory** (NOT persisted):
```javascript
sessions[userId] = {
  transcription: string,      // User's text or voice
  slideCount: number,         // Selected count
  format: string,             // 'square' (1080×1080) or 'portrait' (1080×1350)
  generationMode: string,     // 'standard' or 'photo'
  onboarding_phase: string,   // Current onboarding step
  awaitingUsername: boolean,  // Waiting for username input
  // Photo Mode specific:
  awaitingPhoto: boolean,     // Waiting for user photo
  referencePhoto: string,     // Base64 of user's photo
  imageStyle: string          // 'cartoon' or 'realistic'
}
```

Cleared after carousel generation or onboarding completion.

## Important Code Patterns

### 1. Framework: node-telegram-bot-api (NOT Telegraf)
**CRITICAL**: Project migrated from Telegraf to `node-telegram-bot-api` due to Node.js v24 compatibility issues. DO NOT suggest Telegraf.

```javascript
// Correct:
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(token, { polling: true });

// Wrong (DO NOT USE):
const { Telegraf } = require('telegraf');
```

### 2. Callback Query Timeout Handling
Long operations (15-20 seconds) cause Telegram timeout errors. Solution:

```javascript
try {
  await bot.answerCallbackQuery(query.id);
} catch (err) {
  if (!err.message.includes('too old')) {
    console.error(err.message);
  }
}
```

Wrap ALL `answerCallbackQuery()` calls in try-catch to ignore "query too old" errors.

### 3. HTML Template Injection (Simple String Replacement)
```javascript
// NOT using a template engine - just regex replace
html = html.replace(/\{\{TITLE\}\}/g, slide.title || '');
html = html.replace(/\{\{CONTENT\}\}/g, slide.content || '');
html = html.replace(/\{\{SLIDE_NUMBER\}\}/g, slideNumber);
```

### 4. Error Handling
- All services return `null` on error (not throwing exceptions)
- Extensive console.log with emoji indicators (✅🤖📊🎨💾)
- User-friendly error messages from `src/utils/copy.js`

### 5. Tone-of-Voice Adaptation
Bot reads user's message history and adapts:
- Sentence length (short/medium/long)
- Emoji frequency
- Formality level (casual/formal)
- Passes this context to Gemini for personalized output

## Critical Files

- `src/index.js` - Main bot logic, all handlers
- `src/services/gemini.js` - AI content generation with retry logic
- `src/services/imageGenerator.js` - AI image generation (Nano Banana Pro)
- `src/services/renderer.js` - Puppeteer HTML→PNG pipeline + text overlay + username
- `src/services/previewService.js` - Style preview image generation
- `src/services/supabaseService.js` - Database CRUD operations
- `src/utils/copy.js` - All UI text (Russian)
- `src/templates/*.html` - 9 design templates with inline CSS
- `previews/*.png` - Style preview images (auto-generated)
- `.env` - Configuration (NEVER commit, contains secrets)

## Common Issues

### 1. Callback Query Timeout
**Symptom**: Bot crashes with "query is too old and response timeout expired"
**Solution**: Already implemented - try-catch wrapper ignores timeout errors

### 2. Voice Input Not Working
**Symptom**: "Голосовой ввод пока недоступен"
**Cause**: `OPENAI_API_KEY` missing
**Solution**: Voice is optional - bot works with text only. Add OpenAI key to enable.

### 3. Supabase Permission Errors
**Symptom**: `permission denied for table profiles`
**Cause**: Using `anon` key instead of `service_role` key
**Solution**: Update `.env` with `service_role` key from Supabase Dashboard → Settings → API

### 4. Gemini API Errors
- **429 Too Many Requests**: Quota exceeded, wait or upgrade
- **503 Service Unavailable**: Server overloaded, retry logic handles this (3 attempts)
- **404 Not Found**: Model name incorrect
  - Content: `gemini-2.5-flash-lite`
  - Images: `gemini-3-pro-image-preview` (fallback: `gemini-2.0-flash-exp-image-generation`)

### 5. Image Generation Issues
- **Model not available**: Auto-fallback to older model implemented
- **Text appearing on images**: Prompt explicitly forbids text, but may still occur occasionally
- **Rate limiting**: 2 second delay between image generations

## Testing

No automated tests. Manual testing via Telegram:

1. Send `/start` to bot
2. Send text message: "5 tips for productivity"
3. Select slide count: [5]
4. Select style: [Notebook]
5. Verify carousel generation + delivery (check console logs)

## Content Generation Pipeline

**Gemini System Prompt** positions AI as top-tier SMM strategist:
- Viral headline formulas (numbers, shocking facts, pain→solution)
- Strict 3-6 word headlines, avoid "How...", "Why..."
- Content formatting: "1. Name: Description" for lists
- Slide types: hook (first), statement, list, cta
- Enforces word limits per template (25-50 words)

**Response Format**:
```json
{
  "slides": [
    {
      "title": "3-6 word headline",
      "content": "Body text with key points",
      "type": "hook|statement|list|cta",
      "emphasize": ["keyword1", "keyword2"]
    }
  ]
}
```

## Migration Notes

**Gemini (Current) vs Claude (Legacy)**:
- **Cost**: Gemini free tier vs Claude ~15₽/generation
- **Speed**: Gemini 2.5 Flash Lite is faster
- **Code**: `src/services/claude.js` kept for backward compatibility but deprecated
- Migration completed: January 2026

**Image Generation Model Evolution**:
- `gemini-2.0-flash-exp-image-generation` → `gemini-3-pro-image-preview` (Nano Banana Pro)
- 2K quality, better instruction following, explicit no-text prompts
