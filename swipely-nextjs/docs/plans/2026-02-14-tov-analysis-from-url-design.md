# ToV Analysis from URL — Design Document

**Date:** 2026-02-14
**Platform:** swipely-nextjs
**Status:** Approved

## Problem

Users want carousels generated in their personal Tone of Voice (ToV). Currently, only generic content tones are available (educational, entertaining, provocative, motivational). There's no way to capture a user's unique writing style.

## Solution

Allow users to paste a URL (website or Telegram channel) to automatically analyze their Tone of Voice. The analyzed ToV is saved to their profile and applied to all future generations.

## Architecture

```
User pastes URL → API Route /api/tov/analyze
  ↓
Detect URL type (Telegram channel vs website)
  ↓
Extract text content:
  - Website: fetch HTML + cheerio → extract text
  - Telegram: parse t.me/s/channel_name (public web view)
  - Fallback: Jina Reader API (r.jina.ai/URL) if low text yield
  ↓
Send extracted text (2000-5000 words) to Gemini 2.5 Flash Lite
  ↓
Gemini returns:
  - tov_profile (JSON) — structured metrics for UI display
  - tov_guidelines (TEXT) — free-text description for prompt injection
  ↓
Save to profiles table in Supabase
  ↓
During generation: tov_guidelines injected into Gemini system prompt
```

## Components

### 1. API Route: `app/api/tov/analyze/route.ts`
- POST `{ url: string }`
- URL validation, type detection (Telegram vs website)
- Content extraction with cheerio → Jina fallback
- Gemini ToV analysis
- Save results to profiles table
- Returns JSON profile + text guidelines

### 2. Service: `lib/services/tov-analyzer.ts`
- `extractContentFromUrl(url)` — scraping + text extraction
- `extractTelegramContent(channelName)` — parse t.me/s/
- `analyzeToneOfVoice(text)` — Gemini call
- Pure business logic, no HTTP concerns

### 3. UI: Onboarding page `app/(dashboard)/onboarding/page.tsx`
- URL input field + "Analyze" button
- Loading indicator (5-10 sec)
- ToV profile card (JSON visualized + text description)
- "Save and Continue" / "Skip" buttons
- Redirects to dashboard after completion

### 4. UI: Settings section
- In `app/(dashboard)/dashboard/settings/page.tsx`
- Current ToV profile display (if exists)
- "Change" button → new URL input
- Manual edit of text guidelines

### 5. Generation integration
- In `app/api/generate/route.ts`: read tov_guidelines from profile
- Add to system prompt: "ADAPT TO AUTHOR'S STYLE:\n{tov_guidelines}"
- Content tone (educational/entertaining) remains as additional overlay

## ToV Profile Schema (JSON)

```json
{
  "sentence_length": "short | medium | long",
  "emoji_usage": "none | minimal | moderate | heavy",
  "tone": "professional | casual | enthusiastic | provocative | professional_friendly",
  "language_level": "simple | intermediate | advanced",
  "vocabulary_style": "academic | conversational | slang | modern_tech",
  "formatting_style": "freeform | structured | listicle",
  "source_url": "https://...",
  "analyzed_at": "ISO timestamp"
}
```

## Database Changes

- `tov_guidelines` (TEXT) — already exists in profiles
- `tov_profile` (JSONB) — needs migration if not present in nextjs schema

## Dependencies

- `cheerio` — HTML parsing for content extraction
- Jina Reader API — free, no npm package (fetch `https://r.jina.ai/URL`)
- Gemini 2.5 Flash Lite — already used for generation

## Content Tone vs ToV

- **Content Tone** (educational, entertaining, etc.) = style of content delivery
- **ToV** = personal writing voice (sentence structure, vocabulary, emoji usage)
- Both coexist: ToV is the base personality, content tone is the delivery mode
