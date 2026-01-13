# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Swipely Telegram Bot** - AI-powered Instagram carousel generator. Users send text or voice → bot generates viral-ready carousel slides (PNG images) using Google Gemini AI with professional design templates.

**Tech Stack:**
- `node-telegram-bot-api` v0.67.0 (NOT Telegraf - important!)
- Google Gemini API (`gemini-2.5-flash-lite`) for AI content generation
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

## Architecture

```
User Input (text/voice)
    ↓
[Onboarding] (optional 3-phase setup)
    Phase 1: Context ("who are you?")
    Phase 2: Tone of Voice analysis (Gemini)
    Phase 3: Role selection (expert/visionary/friend)
    ↓
[Session] (in-memory: transcription, slide count)
    ↓
[Gemini] Content generation with viral hooks
    System Prompt: SMM strategist, 3-6 word headlines
    Tone Adaptation: matches user's writing style
    ↓
[Puppeteer] HTML templates → PNG (1080x1350px)
    minimal_pop.html / notebook.html / darkest.html
    ↓
[Telegram] sendMediaGroup() - delivers carousel
    ↓
[Supabase] Logs generation + usage tracking
```

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
- **Process**:
  1. Load HTML template for selected style
  2. Inject content via **string replacement** (NOT template engine):
     ```javascript
     html = html.replace(/\{\{TITLE\}\}/g, slide.title);
     html = html.replace(/\{\{CONTENT\}\}/g, slide.content);
     ```
  3. Screenshot at 1080x1350px (2x scale for quality)
  4. Save to `/output/slide_<timestamp>_<num>.png`
- **Auto-formatting**: `notebook.html` has JavaScript that runs on `DOMContentLoaded` to format numbered lists

### src/services/supabaseService.js (Database)
- **Key Functions**:
  - `upsertUser(telegramUser)` - create/update via SQL function
  - `saveMessage()` - log for tone analysis
  - `getUserMessageHistory()` - fetch last N messages
  - `checkOnboardingStatus()` - check if user completed setup
- **Tables**: `profiles`, `user_messages`, `usage_tracking`, `projects`

### src/services/whisper.js (Voice Transcription)
- **Optional**: If `OPENAI_API_KEY` missing, voice input disabled gracefully
- Downloads Telegram voice (OGG) → Whisper API → Russian text

### src/utils/copy.js (UI Text)
- **Centralized** Russian-language strings for all bot messages
- Organized by feature: `start`, `onboarding`, `mainFlow`, `errors`

## User Flow

```
/start
  ├─→ First-time user:
  │   ├─→ Welcome Screen [Demo] [How it Works] [View Styles]
  │   └─→ Optional Onboarding (3 phases)
  │
  └─→ Returning user: Main Menu

Text/Voice Input
  ↓
Select slide count [3] [5] [7] [10] [12]
  ↓
Select style [Minimal Pop] [Notebook] [Darkest]
  ↓
Gemini generates content → Puppeteer renders → Telegram delivers
```

## Design Templates

**Three Templates** (1080x1350px Instagram format):

1. **minimal_pop.html** - Neo-brutalist editorial
   - Massive diagonal gradient slash (15° angle)
   - Ultra-thick 14px black border
   - Typography: Syne + IBM Plex Sans
   - 25-40 words/slide

2. **notebook.html** - Handwritten notes
   - Caveat (cursive) + Lora (serif)
   - Paper texture with ruled lines
   - Auto-formats lists: "1. Name: Description"
   - JavaScript formatContent() on page load
   - 25-45 words/slide

3. **darkest.html** - Cyberpunk/dark professional
   - Bebas Neue + Montserrat
   - Neon effects, grid background
   - 25-50 words/slide

**Rendering Pattern**: Load template → Replace `{{VARIABLES}}` → Screenshot → PNG

## Database Schema (Supabase)

**profiles** - Unified user table (web + Telegram)
- `telegram_id` BIGINT (for bot users)
- `auth_user_id` UUID (for web users)
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
  onboarding_phase: string    // Current onboarding step
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

- `src/index.js` (519 lines) - Main bot logic, all handlers
- `src/services/gemini.js` - AI content generation with retry logic
- `src/services/renderer.js` - Puppeteer HTML→PNG pipeline
- `src/services/supabaseService.js` - Database CRUD operations
- `src/utils/copy.js` - All UI text (Russian)
- `src/templates/*.html` - Design templates with inline CSS
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
- **404 Not Found**: Model name incorrect, use `gemini-2.5-flash-lite`

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
