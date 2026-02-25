const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const MIN_TEXT_LENGTH = 200;
const MAX_TEXT_LENGTH = 15000;

// ─── Types ───

export interface TovProfile {
  sentence_length: string;
  emoji_usage: string;
  tone: string;
  language_level: string;
  vocabulary_style: string;
  formatting_style: string;
  source_url: string;
  analyzed_at: string;
}

export interface TovResult {
  profile: TovProfile;
  guidelines: string;
}

// ─── SSRF Protection ───

const BLOCKED_HOSTNAMES = ["localhost", "127.0.0.1", "0.0.0.0", "[::1]", "metadata.google.internal"];
const BLOCKED_IP_PREFIXES = ["10.", "172.16.", "172.17.", "172.18.", "172.19.", "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.", "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31.", "192.168.", "169.254.", "0."];

export function validateUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL format");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only HTTP/HTTPS URLs are allowed");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    throw new Error("This URL is not allowed");
  }
  if (BLOCKED_IP_PREFIXES.some((p) => hostname.startsWith(p))) {
    throw new Error("This URL is not allowed");
  }
}

// ─── URL Detection ───

export function isTelegramUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "t.me" || parsed.hostname === "telegram.me";
  } catch {
    return false;
  }
}

export function extractTelegramChannel(url: string): string | null {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const channel = parts.find((p) => p !== "s");
    return channel || null;
  } catch {
    return null;
  }
}

// ─── Content Extraction ───

export async function extractFromTelegram(channelName: string): Promise<string> {
  const url = `https://t.me/s/${channelName}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; bot)" },
  });

  if (!res.ok) throw new Error(`Telegram fetch failed: ${res.status}`);

  const html = await res.text();
  let cheerio: typeof import("cheerio");
  try {
    cheerio = await import("cheerio");
  } catch {
    throw new Error("HTML parsing library not available");
  }
  const $ = cheerio.load(html);

  const messages: string[] = [];
  $(".tgme_widget_message_text").each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 20) messages.push(text);
  });

  if (messages.length === 0) {
    throw new Error("No public messages found in channel");
  }

  return messages.join("\n\n").slice(0, MAX_TEXT_LENGTH);
}

export async function extractFromWebsite(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; bot)" },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`Website fetch failed: ${res.status}`);

  const html = await res.text();
  let cheerio: typeof import("cheerio");
  try {
    cheerio = await import("cheerio");
  } catch {
    throw new Error("HTML parsing library not available");
  }
  const $ = cheerio.load(html);

  $("script, style, nav, header, footer, aside, iframe, noscript").remove();

  const selectors = ["article", "main", ".post-content", ".entry-content", ".content", "body"];
  let text = "";

  for (const sel of selectors) {
    const content = $(sel).text().replace(/\s+/g, " ").trim();
    if (content.length > text.length) text = content;
  }

  if (text.length < MIN_TEXT_LENGTH) {
    text = await extractViaJina(url);
  }

  return text.slice(0, MAX_TEXT_LENGTH);
}

async function extractViaJina(url: string): Promise<string> {
  const jinaUrl = `https://r.jina.ai/${url}`;
  const res = await fetch(jinaUrl, {
    headers: { Accept: "text/plain" },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`Jina Reader failed: ${res.status}`);
  return await res.text();
}

export async function extractContentFromUrl(url: string): Promise<string> {
  validateUrl(url);
  if (isTelegramUrl(url)) {
    const channel = extractTelegramChannel(url);
    if (!channel) throw new Error("Could not extract Telegram channel name from URL");
    return extractFromTelegram(channel);
  }
  return extractFromWebsite(url);
}

// ─── Gemini ToV Analysis ───

export async function analyzeToneOfVoice(text: string, sourceUrl: string): Promise<TovResult> {
  if (!GEMINI_API_KEY) throw new Error("GOOGLE_GEMINI_API_KEY not configured");

  const systemPrompt = `Ты — эксперт по анализу стиля текста (Tone of Voice). Твоя задача — проанализировать текст и выдать точный профиль ToV.

Проанализируй ДВА формата:

ФОРМАТ 1 — JSON-профиль (структурированные метрики):
{
  "sentence_length": "short" (1-10 слов) | "medium" (11-20) | "long" (20+),
  "emoji_usage": "none" | "minimal" | "moderate" | "heavy",
  "tone": "professional" | "professional_friendly" | "casual" | "enthusiastic" | "provocative",
  "language_level": "simple" | "intermediate" | "advanced",
  "vocabulary_style": "academic" | "conversational" | "slang" | "modern_tech",
  "formatting_style": "freeform" | "structured" | "listicle"
}

ФОРМАТ 2 — Текстовое описание стиля (3-5 предложений на русском):
Напиши описание стиля автора так, чтобы другой AI мог воспроизвести этот стиль.
Включи: длину предложений, любимые приёмы, уровень формальности, использование метафор/юмора, характерные паттерны.

Верни СТРОГО JSON:
{
  "profile": { ... формат 1 ... },
  "guidelines": "... формат 2 ..."
}`;

  const geminiResponse = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        { parts: [{ text: `${systemPrompt}\n\nТЕКСТ ДЛЯ АНАЛИЗА:\n\n${text}` }] },
      ],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1500 },
    }),
  });

  if (!geminiResponse.ok) {
    throw new Error(`Gemini API error: ${geminiResponse.status}`);
  }

  const data = await geminiResponse.json();
  const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  let cleaned = rawContent.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*\n?/, "").replace(/\n?```\s*$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse Gemini ToV response");

  const result = JSON.parse(jsonMatch[0]);

  return {
    profile: {
      ...result.profile,
      source_url: sourceUrl,
      analyzed_at: new Date().toISOString(),
    },
    guidelines: result.guidelines,
  };
}
