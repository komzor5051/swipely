# Video → Carousel Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Video" tab on the generate input step — user pastes YouTube or Instagram Reels URL, app downloads audio, transcribes via Whisper, pre-fills the text field.

**Architecture:** New API route `/api/transcribe` downloads audio (ytdl-core for YouTube, og:video scraping for Instagram), sends buffer to OpenAI Whisper, returns transcript. Frontend adds input mode toggle + fetch call before existing generate flow.

**Tech Stack:** `@distube/ytdl-core`, OpenAI Whisper REST API, Next.js App Router API route, React state

---

## Task 1: Install dependency + configure env

**Files:**
- Modify: `swipely-nextjs/package.json`
- Modify: `swipely-nextjs/.env.local`

**Step 1: Install ytdl-core**

```bash
cd swipely-nextjs
npm install @distube/ytdl-core
```

Expected output: `added X packages` — no errors.

**Step 2: Add type definitions**

```bash
npm install --save-dev @types/node
```

(Already installed but confirm it's there — needed for `Buffer`.)

**Step 3: Add env var**

Open `swipely-nextjs/.env.local` and add:

```
OPENAI_API_KEY=sk-...   # copy from swipely-bot/.env
```

**Step 4: Verify**

```bash
grep OPENAI_API_KEY .env.local
```

Expected: line with your key.

**Step 5: Commit**

```bash
cd swipely-nextjs
git add package.json package-lock.json
git commit -m "feat: add @distube/ytdl-core for video audio download"
```

---

## Task 2: Create `/api/transcribe/route.ts`

**Files:**
- Create: `swipely-nextjs/app/api/transcribe/route.ts`

**Step 1: Create the file with this exact content**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import ytdl from "@distube/ytdl-core";

export const maxDuration = 60; // Vercel Pro max

const YOUTUBE_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const INSTAGRAM_REGEX = /instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]+)/;

function detectPlatform(url: string): "youtube" | "instagram" | null {
  if (YOUTUBE_REGEX.test(url)) return "youtube";
  if (INSTAGRAM_REGEX.test(url)) return "instagram";
  return null;
}

async function downloadYoutubeAudio(url: string): Promise<Buffer> {
  const stream = ytdl(url, {
    filter: "audioonly",
    quality: "lowestaudio",
  });

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function downloadInstagramAudio(url: string): Promise<Buffer> {
  // Fetch public Instagram page, extract og:video URL
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!res.ok) {
    throw new Error("Не удалось загрузить страницу Instagram");
  }

  const html = await res.text();

  // Extract og:video content
  const match = html.match(/<meta property="og:video" content="([^"]+)"/);
  if (!match) {
    throw new Error(
      "Видео не найдено. Возможно, аккаунт приватный или ссылка устарела"
    );
  }

  const videoUrl = match[1].replace(/&amp;/g, "&");

  // Download the video file
  const videoRes = await fetch(videoUrl);
  if (!videoRes.ok) {
    throw new Error("Не удалось скачать видео Instagram");
  }

  const arrayBuffer = await videoRes.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function transcribeWithWhisper(
  audioBuffer: Buffer,
  mimeType = "audio/webm"
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY не настроен");
  }

  // Whisper limit: 25MB
  if (audioBuffer.length > 25 * 1024 * 1024) {
    throw new Error(
      "Видео слишком длинное. Попробуй видео покороче (до ~15 минут)"
    );
  }

  const formData = new FormData();
  formData.append(
    "file",
    new Blob([audioBuffer], { type: mimeType }),
    "audio.mp4"
  );
  formData.append("model", "whisper-1");
  // language left empty → Whisper auto-detects (works for RU/EN)

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Whisper API error: ${err}`);
  }

  const data = await res.json();
  return data.text as string;
}

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { url } = body;

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  const platform = detectPlatform(url.trim());
  if (!platform) {
    return NextResponse.json(
      {
        error:
          "Вставьте ссылку на YouTube (youtube.com, youtu.be) или Instagram Reels",
      },
      { status: 400 }
    );
  }

  try {
    let audioBuffer: Buffer;

    if (platform === "youtube") {
      audioBuffer = await downloadYoutubeAudio(url.trim());
    } else {
      audioBuffer = await downloadInstagramAudio(url.trim());
    }

    const transcript = await transcribeWithWhisper(audioBuffer);

    return NextResponse.json({ transcript });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Произошла ошибка при обработке видео";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Step 2: Verify TypeScript compiles**

```bash
cd swipely-nextjs
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors (or only pre-existing ones unrelated to transcribe route).

**Step 3: Manual test — start dev server**

```bash
npm run dev
```

In another terminal:

```bash
curl -X POST http://localhost:3000/api/transcribe \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

If not authenticated, expected: `{"error":"Unauthorized"}` — that's correct (auth works).
To test with real video, log in to the app first and use browser DevTools → Network tab.

**Step 4: Commit**

```bash
cd swipely-nextjs
git add app/api/transcribe/route.ts
git commit -m "feat: add /api/transcribe route — YouTube + Instagram → Whisper"
```

---

## Task 3: Update generate/page.tsx — add video input tab

**Files:**
- Modify: `swipely-nextjs/app/(dashboard)/generate/page.tsx`

### Step 1: Add new imports at top (after existing imports ~line 18)

Find this block:
```typescript
  X,
  Camera,
  ImageIcon,
} from "lucide-react";
```

Replace with:
```typescript
  X,
  Camera,
  ImageIcon,
  Link,
  Loader2,
} from "lucide-react";
```

### Step 2: Add new state variables (~line 118, after `const [isDragging, setIsDragging] = useState(false);`)

Find:
```typescript
  const [isDragging, setIsDragging] = useState(false);
  const [platform, setPlatform] = useState("");
```

Replace with:
```typescript
  const [isDragging, setIsDragging] = useState(false);

  // Video transcription state
  type InputMode = "text" | "video";
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [videoUrl, setVideoUrl] = useState("");
  const [transcribing, setTranscribing] = useState(false);

  const [platform, setPlatform] = useState("");
```

### Step 3: Add handleTranscribe function (~after handleDrop function, around line 192)

Find:
```typescript
  const handleGenerate = async () => {
```

Insert before it:
```typescript
  const handleTranscribe = async () => {
    if (!videoUrl.trim()) return;
    setTranscribing(true);
    try {
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: videoUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Не удалось извлечь транскрипцию");
        return;
      }
      setText(data.transcript);
      setInputMode("text");
      toast.success("Транскрипция готова! Можешь отредактировать текст.");
    } catch {
      toast.error("Ошибка соединения. Попробуй ещё раз.");
    } finally {
      setTranscribing(false);
    }
  };

```

### Step 4: Add input mode tabs in JSX — BEFORE the textarea block

Find this exact block in the JSX (around line 467):
```tsx
            <div className="space-y-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
```

Replace with:
```tsx
            {/* Input mode tabs */}
            <div className="flex rounded-xl border border-border bg-muted/50 p-1 gap-1">
              <button
                onClick={() => setInputMode("text")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  inputMode === "text"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                ✍️ Текст
              </button>
              <button
                onClick={() => setInputMode("video")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  inputMode === "video"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Link className="h-3.5 w-3.5" />
                Видео
              </button>
            </div>

            {/* Video URL input */}
            {inputMode === "video" && (
              <FadeIn className="space-y-3">
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="youtube.com/watch?v=... или instagram.com/reel/..."
                  className="w-full rounded-2xl border border-border bg-card px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--swipely-blue)]/50 focus:border-[var(--swipely-blue)] placeholder:text-muted-foreground/60 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !transcribing) handleTranscribe();
                  }}
                />
                <Button
                  onClick={handleTranscribe}
                  disabled={!videoUrl.trim() || transcribing}
                  className="w-full rounded-full bg-[var(--swipely-blue)] hover:bg-[var(--swipely-blue-dark)] transition-all"
                >
                  {transcribing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Извлекаем транскрипцию... ~30с
                    </>
                  ) : (
                    <>
                      <Link className="mr-2 h-4 w-4" />
                      Извлечь транскрипцию
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Работает с публичными YouTube и Instagram Reels
                </p>
              </FadeIn>
            )}

            <div className="space-y-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
```

### Step 5: Verify TypeScript compiles

```bash
cd swipely-nextjs
npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

### Step 6: Manual test in browser

1. `npm run dev`
2. Open `http://localhost:3000/generate`
3. On the input step, verify two tabs appear: "✍️ Текст" and "🔗 Видео"
4. Click "Видео" — URL input and button appear
5. Paste a short YouTube video URL (< 5 min recommended for quick test)
6. Click "Извлечь транскрипцию" — loader appears
7. After ~15-30s: transcript appears in text field, tab switches to "Текст"
8. Verify character count updates
9. Click "Далее: платформа" — flow continues normally

**Step 7: Commit**

```bash
cd swipely-nextjs
git add app/(dashboard)/generate/page.tsx
git commit -m "feat: add video URL input tab — YouTube/Instagram → Whisper transcript"
```

---

## Done

After all commits, the feature is complete. Manual E2E test:
1. YouTube public video → transcript → carousel generated ✓
2. Instagram public Reel → transcript → carousel generated ✓
3. Invalid URL → error toast ✓
4. Text tab still works as before ✓
