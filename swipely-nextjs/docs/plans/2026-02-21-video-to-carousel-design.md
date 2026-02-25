# Video → Carousel Feature Design

**Date:** 2026-02-21
**Project:** swipely-nextjs
**Feature:** YouTube / Instagram Reels link → automatic carousel generation

---

## Overview

Users paste a YouTube or Instagram Reels URL. The app downloads the audio, transcribes it via OpenAI Whisper, and pre-fills the text input — then the existing carousel generation flow takes over.

---

## Architecture

### New API Route

`app/api/transcribe/route.ts`

```
POST /api/transcribe
Authorization: Supabase session (requireAuth middleware)
Body: { url: string }
Response: { transcript: string, title?: string }
Error: { error: string }
```

**Config:** `export const maxDuration = 60` (Vercel Pro max)

### Pipeline

```
URL input
  → URL validation (YouTube regex / Instagram regex)
  → ytdl-core: download audio-only stream → Buffer
  → OpenAI Whisper API (multipart/form-data, model: whisper-1)
  → Return { transcript, title }
```

### Libraries

- `@distube/ytdl-core` — YouTube + Instagram audio download (maintained ytdl fork)
- OpenAI Whisper API (REST) — already configured in swipely-bot, needs `OPENAI_API_KEY` in nextjs `.env.local`

### Constraints

- Whisper file limit: 25MB (enforces ~15 min video max for typical audio bitrate)
- Vercel serverless `/tmp`: 512MB
- Timeout: 60s max — sufficient for short-medium videos

### Environment Variables (add to swipely-nextjs/.env.local)

```
OPENAI_API_KEY=  # already exists in swipely-bot/.env
```

---

## UI Design

### Input Step (generate/page.tsx)

Add two tabs above the textarea:

```
[ ✍️ Текст ]   [ 🔗 Видео ]
```

**"Текст" tab** (default): existing textarea — no changes.

**"Видео" tab**:
1. URL input field
   - Placeholder: `youtube.com/watch?v=... или instagram.com/reel/...`
2. "Извлечь транскрипцию" button
3. Loading state: `"Скачиваем аудио... это может занять ~30с"`
4. On success: transcript fills textarea, tab switches to "Текст"
5. User can edit transcript, then proceeds normally

### State additions (generate/page.tsx)

```typescript
type InputMode = "text" | "video";
const [inputMode, setInputMode] = useState<InputMode>("text");
const [videoUrl, setVideoUrl] = useState("");
const [transcribing, setTranscribing] = useState(false);
```

### Error Messages

| Scenario | Message |
|----------|---------|
| Invalid URL | "Вставьте ссылку на YouTube или Instagram Reels" |
| Video too long (>25MB audio) | "Видео слишком длинное. Попробуй покороче (до ~15 мин)" |
| Private / unavailable | "Не удалось скачать видео. Возможно, оно приватное" |
| Timeout | "Превышено время ожидания. Попробуй с более коротким видео" |
| Auth | "Войдите, чтобы использовать эту функцию" |

---

## URL Detection

```typescript
const YOUTUBE_REGEX = /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const INSTAGRAM_REGEX = /instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]+)/;
```

---

## Files to Create / Modify

| File | Action |
|------|--------|
| `app/api/transcribe/route.ts` | CREATE — new API route |
| `app/(dashboard)/generate/page.tsx` | MODIFY — add video tab + transcribe call |
| `.env.local` | MODIFY — add `OPENAI_API_KEY` |
| `package.json` | MODIFY — add `@distube/ytdl-core` |

---

## Out of Scope (MVP)

- Videos longer than 15 min
- Private/authenticated Instagram posts
- Telegram video links
- swipely-bot support (web only)
- Caching transcriptions
