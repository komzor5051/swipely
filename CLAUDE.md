# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Swipely Telegram Bot** - AI-powered Instagram carousel generator. Users send text/voice → bot generates viral-ready carousel slides (PNG images) using Claude 3.5 Haiku via OpenRouter, with 3 professional design templates.

**Tech Stack:**
- node-telegram-bot-api (NOT Telegraf - important!)
- OpenRouter API (Claude 3.5 Haiku: `anthropic/claude-3.5-haiku`)
- Supabase (profiles, user_messages, usage_tracking, projects) - unified DB for web + bot
- Puppeteer (HTML → PNG rendering at 1080x1350px Instagram format)
- better-sqlite3 (legacy local DB, being phased out)

## Development Commands

```bash
# Install dependencies
npm install

# Run in development mode (with auto-reload via nodemon)
npm run dev

# Run in production mode
npm start

# The bot runs as a long-lived process with polling
# Check console for logs: ✅🤖📊🎨 emoji indicators
```

## Environment Setup

Required `.env` variables:

```env
TELEGRAM_BOT_TOKEN=<bot_token>
OPENROUTER_API_KEY=<openrouter_key>          # REQUIRED for Claude
OPENAI_API_KEY=<openai_key>                  # OPTIONAL for voice (Whisper)
SUPABASE_URL=<supabase_project_url>
SUPABASE_ANON_KEY=<supabase_service_role_key> # Use service_role NOT anon for bot backend
```

**CRITICAL**: Bot uses `service_role` key (not `anon`) to bypass RLS policies. Telegram bot = backend service.

## Architecture

### Core Flow

1. **User Input** (src/index.js):
   - `/start` → registers user in Supabase + SQLite
   - Text message → saves to `user_messages` for tone analysis
   - Voice message → transcribes via Whisper (optional)
   - Shows slide count selection (3/5/7/10/12) → inline keyboard buttons
   - Shows style selection → inline keyboard callback_query

2. **Content Generation** (src/services/claude.js):
   - `generateCarouselContent(userText, stylePreset, slideCount, toneGuidelines)`
   - Model: `anthropic/claude-3.5-haiku` via OpenRouter
   - System prompt = expert SMM strategist with viral content formulas
   - Returns JSON: `{ slides: [{ type, title, content, emphasize, template_id }] }`
   - Cleans response (removes ```json wrappers via regex)

3. **Visual Rendering** (src/services/renderer.js):
   - `renderSlides(carouselData, stylePreset)`
   - Loads HTML template (minimal_pop.html / notebook.html / darkest.html)
   - Injects content via string replacement: {{TITLE}}, {{CONTENT}}, {{SLIDE_NUMBER}}, {{TOTAL_SLIDES}}
   - Puppeteer renders at 1080x1350px (Instagram carousel format)
   - Saves to `/output/slide_<timestamp>_<num>.png`
   - Returns array of file paths

4. **Delivery**:
   - `bot.sendMediaGroup(chatId, mediaGroup)` - sends all slides as album

### Design Templates

Located in `src/templates/`:

**1. minimal_pop.html** - Neo-Brutalist Editorial
- Typography: Syne (ultra-bold) + IBM Plex Sans
- Signature: Massive diagonal gradient slash (pink→orange) at 15° angle
- Frame: Ultra-thick 14px black border
- Counter: Giant geometric numbers (96px)
- Features: Halftone dots, corner marks, arrow decorations

**2. notebook.html** - Handwritten Notes
- Typography: Caveat (cursive) + Lora (serif)
- Paper texture with ruled lines
- Auto-formatting: Detects numbered lists "1. Name: Description"
- JavaScript: formatContent() runs on DOMContentLoaded
- Features: Large handwritten numbers (52px), bold red accents, coffee stains

**3. darkest.html** - Cyberpunk/Dark Professional
- Typography: Bebas Neue + Montserrat
- Neon effects with electric colors
- Grid background, scanline overlay

### Session Management

In-memory session storage (NOT persistent):
```javascript
sessions[userId] = {
  transcription: string,  // User's text/voice
  slideCount: number      // Selected count
}
```

Sessions cleared after carousel generation completes.

### Database Architecture

**Dual System** (transitioning from SQLite to Supabase):

**Legacy SQLite** (src/services/database.js):
- `users` table: user_id, username, subscription_tier, generation_count
- `generations` table: history
- Being phased out, kept for backward compatibility

**Supabase** (src/services/supabaseService.js):
- `profiles`: unified user table for web + Telegram
  - `auth_user_id` UUID (for web users via auth.users)
  - `telegram_id` BIGINT (for Telegram users, no auth)
  - `telegram_username`, `last_interaction_at`
- `user_messages`: message history for tone-of-voice analysis
  - `profile_id` → profiles(id)
  - `telegram_id`, `message_text`, `message_type`
- `usage_tracking`: generation limits (free: 5/month, pro: 50/month)
  - `user_id`, `generation_type`, `metadata` JSONB
- `projects`: saved carousels
  - `user_id`, `project_type`, `title`, `data` JSONB

**SQL Functions:**
- `upsert_telegram_profile(telegram_id, username, first_name, last_name)` → UUID
- `get_telegram_message_history(telegram_id, limit)` → message history

**IMPORTANT**: Supabase logging currently disabled (commented out in src/index.js) due to unresolved permission issues. Lines 123-124 and 253-254 have TODO comments.

### Callback Query Flow

**CRITICAL**: Long-running operations (15-20 seconds for generation) cause Telegram callback query timeouts. Solution:

```javascript
try {
  await bot.answerCallbackQuery(query.id);
} catch (err) {
  if (!err.message.includes('too old')) {
    console.error('Ошибка answerCallbackQuery:', err.message);
  }
}
```

Wrap ALL `answerCallbackQuery()` calls in try-catch to ignore "query too old" errors.

## System Prompt Engineering

**src/services/claude.js:buildSystemPrompt()**

The prompt is designed as a **top-tier SMM strategist** with 10+ years viral content experience:

**Key Sections:**
1. **Viral headline formulas** - Numbers + benefit, shocking facts, pain → solution
2. **Strict headline rules** - 3-6 words ONLY, trigger-based, avoid "How...", "Why..."
3. **Content formatting** - For lists: "1. Name: Description" format
4. **Slide types** - hook (first slide), statement, list, cta
5. **Tone analysis** - Adapts to user's message history if available

**Content Limits:**
- Minimal Pop: 25-40 words per slide
- Notebook: 25-45 words per slide
- Darkest Hour: 25-50 words per slide
- Minimum: 25 words (enforced)

## Important Patterns

### 1. Framework: node-telegram-bot-api (NOT Telegraf)

**CRITICAL**: Project was rewritten from Telegraf to node-telegram-bot-api due to Node.js v24 compatibility issues. DO NOT suggest Telegraf.

```javascript
// Correct:
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(token, { polling: true });

// Wrong (DO NOT USE):
const { Telegraf } = require('telegraf');
```

### 2. HTML Template Variable Injection

Templates use simple string replacement (NOT template engines):

```javascript
html = html.replace(/\{\{TITLE\}\}/g, slide.title || '');
html = html.replace(/\{\{CONTENT\}\}/g, slide.content || '');
html = html.replace(/\{\{SLIDE_NUMBER\}\}/g, slideNumber);
html = html.replace(/\{\{TOTAL_SLIDES\}\}/g, totalSlides);
```

### 3. Auto-Formatting in Templates

notebook.html has JavaScript that runs on page load:

```javascript
window.addEventListener('DOMContentLoaded', formatContent);
```

- Detects numbered lists: `/^\d+[\.\)]\s/`
- Splits by "1. 2. 3." or "1) 2) 3)"
- Formats as: `<div class="list-number">1</div><div class="list-text">Name: Description</div>`
- Bolds text before colon in list items

### 4. Supabase Service_Role Key

Bot uses `SUPABASE_ANON_KEY` env var but it should contain `service_role` key (not `anon` key). This bypasses RLS policies since Telegram bot is a backend service, not a frontend client.

### 5. Tone-of-Voice Analysis

Bot retrieves last 20 messages via `getUserMessageHistory(userId, 20)` and passes to Claude as context:

```javascript
const toneGuidelines = messageHistory.length > 0 ?
  `История сообщений пользователя:\n${messageHistory.map(m => `- ${m.message_text}`).join('\n')}` :
  null;
```

Claude adapts writing style to match user's formality, emoji usage, sentence length.

## Common Issues

### 1. Permission Denied for Supabase Tables

**Symptom**: `permission denied for table user_messages`
**Cause**: Using `anon` key instead of `service_role` key
**Solution**: Update `.env` with `service_role` key from Supabase Dashboard → Settings → API

### 2. Callback Query Timeout

**Symptom**: Bot crashes with "query is too old and response timeout expired"
**Cause**: Generation takes 15-20 seconds, Telegram callbacks expire
**Solution**: Already implemented - try-catch wrapper ignores timeout errors

### 3. Voice Input Not Working

**Symptom**: "Голосовой ввод пока недоступен"
**Cause**: `OPENAI_API_KEY` missing or empty
**Solution**: Voice is optional - bot works with text only. Add OpenAI key to enable.

### 4. Puppeteer Launch Failure

**Symptom**: "Failed to launch browser"
**Solution**: Add Chromium dependencies (macOS: `brew install chromium`)

## Code Style

- Russian UI text and console logs (emoji indicators: ✅🤖📊🎨💾🔥)
- All services return null on error (not throwing)
- Extensive console logging for debugging
- No TypeScript (plain Node.js)
- ES6 modules NOT used (require/module.exports)

## Critical Files

- `src/index.js` - Main bot logic, all handlers
- `src/services/claude.js` - Content generation + system prompt (most important for quality)
- `src/services/renderer.js` - HTML → PNG pipeline
- `src/templates/*.html` - Design templates with inline CSS
- `src/services/supabaseService.js` - Database operations
- `.env` - Configuration (NEVER commit, contains secrets)

## Testing

No automated tests. Manual testing via Telegram:

1. Send `/start` to bot
2. Send text message
3. Select slide count
4. Select style
5. Verify carousel generation + delivery
6. Check console logs for errors

## Future Improvements

- Re-enable Supabase logging (fix RLS permissions)
- Add payment integration (YooKassa)
- Implement watermarks for free users
- Add carousel editing functionality
- Create admin panel
