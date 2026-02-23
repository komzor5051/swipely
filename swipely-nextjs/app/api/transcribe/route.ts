import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60; // Vercel Pro max

const YOUTUBE_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const INSTAGRAM_REGEX = /instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]+)/;

function detectPlatform(url: string): "youtube" | "instagram" | null {
  if (YOUTUBE_REGEX.test(url)) return "youtube";
  if (INSTAGRAM_REGEX.test(url)) return "instagram";
  return null;
}

const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB — Whisper limit

// YouTube: use Gemini 1.5 Flash directly with YouTube URL (no download needed)
async function transcribeYoutubeWithGemini(url: string): Promise<string> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GEMINI_API_KEY не настроен");

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(geminiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { fileData: { mimeType: "video/mp4", fileUri: url } },
          { text: "Transcribe this video verbatim. Return only the spoken text, no timestamps, no speaker labels, no formatting." },
        ],
      }],
      generationConfig: { temperature: 0, maxOutputTokens: 8192 },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    const msg = err?.error?.message || "Не удалось транскрибировать видео";
    throw new Error(msg);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini не вернул транскрипцию");
  return text.trim();
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

  // Validate extracted URL is https:// before fetching (prevent SSRF)
  const parsedVideoUrl = new URL(videoUrl);
  if (parsedVideoUrl.protocol !== "https:") {
    throw new Error("Видео не найдено. Возможно, аккаунт приватный или ссылка устарела");
  }

  const videoRes = await fetch(videoUrl);
  if (!videoRes.ok) {
    throw new Error("Не удалось скачать видео Instagram");
  }

  if (!videoRes.body) {
    throw new Error("Не удалось скачать видео Instagram");
  }

  // Stream with byte counter to prevent OOM — Content-Length may be absent
  const chunks: Uint8Array[] = [];
  let totalSize = 0;
  const reader = videoRes.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalSize += value.length;
    if (totalSize > MAX_AUDIO_SIZE) {
      await reader.cancel();
      throw new Error("Видео слишком длинное. Попробуй видео покороче (до ~15 минут)");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
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
  const extension = mimeType === "video/mp4" ? "mp4" : "webm";
  formData.append(
    "file",
    new Blob([new Uint8Array(audioBuffer)], { type: mimeType }),
    `audio.${extension}`
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
    console.error("Whisper API error:", err);
    throw new Error("Ошибка при транскрибации. Попробуйте ещё раз");
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
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Неверный формат запроса" }, { status: 400 });
  }

  const { url } = body;

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Поле url обязательно" }, { status: 400 });
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
    let transcript: string;

    if (platform === "youtube") {
      transcript = await transcribeYoutubeWithGemini(url.trim());
    } else {
      // Instagram blocks server-side requests — scraping is unreliable
      return NextResponse.json(
        { error: "Instagram Reels пока не поддерживается. Используй YouTube-ссылку или вставь текст вручную." },
        { status: 400 }
      );
    }

    return NextResponse.json({ transcript });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Произошла ошибка при обработке видео";
    // Client input errors (file too large, video not found) → 400
    const isClientError =
      message.includes("слишком длинное") ||
      message.includes("не найдено") ||
      message.includes("приватный");
    return NextResponse.json({ error: message }, { status: isClientError ? 400 : 500 });
  }
}
