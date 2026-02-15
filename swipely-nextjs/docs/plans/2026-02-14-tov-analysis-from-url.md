# ToV Analysis from URL — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to paste a URL (website or Telegram channel) to auto-analyze their Tone of Voice, save it to their profile, and use it in all future carousel generations.

**Architecture:** New API route `/api/tov/analyze` extracts text content from URLs (cheerio + Jina Reader fallback), sends it to Gemini 2.5 Flash Lite for ToV analysis, stores structured JSON profile + text guidelines in Supabase `profiles` table. New onboarding page + enhanced Settings page for UI. Generation route reads stored ToV and injects it into the system prompt.

**Tech Stack:** Next.js 16 App Router, Gemini 2.5 Flash Lite, cheerio (HTML parsing), Jina Reader API (fallback), Supabase, TypeScript

---

## Task 1: Install cheerio dependency

**Files:**
- Modify: `package.json`

**Step 1: Install cheerio**

Run from `swipely-nextjs/`:
```bash
npm install cheerio
```

**Step 2: Verify installation**

Run: `npm ls cheerio`
Expected: `cheerio@1.x.x` in output

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add cheerio for HTML content extraction"
```

---

## Task 2: Add tov_profile JSONB column and onboarding_completed to DB

**Files:**
- Modify: `supabase-migration.sql`

**Step 1: Add new columns to migration file**

Add after line 34 (`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tov_guidelines TEXT;`):

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tov_profile JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
```

**Step 2: Run migration in Supabase**

Execute the two ALTER statements in Supabase Dashboard SQL Editor. They are idempotent (safe to re-run).

**Step 3: Update Profile TypeScript interface**

In `lib/supabase/queries.ts`, add to the `Profile` interface (after `tov_guidelines?: string;`):

```typescript
tov_profile?: {
  sentence_length: string;
  emoji_usage: string;
  tone: string;
  language_level: string;
  vocabulary_style: string;
  formatting_style: string;
  source_url: string;
  analyzed_at: string;
};
onboarding_completed?: boolean;
```

**Step 4: Update updateProfile to include new fields**

In `lib/supabase/queries.ts`, change the `updateProfile` function's `updates` parameter type from:
```typescript
updates: Partial<Pick<Profile, "username" | "first_name" | "tov_guidelines">>
```
to:
```typescript
updates: Partial<Pick<Profile, "username" | "first_name" | "tov_guidelines" | "tov_profile" | "onboarding_completed">>
```

**Step 5: Commit**

```bash
git add supabase-migration.sql lib/supabase/queries.ts
git commit -m "feat: add tov_profile and onboarding_completed to profiles schema"
```

---

## Task 3: Create ToV analyzer service

**Files:**
- Create: `lib/services/tov-analyzer.ts`

**Step 1: Create the service file**

Create `lib/services/tov-analyzer.ts` with these functions:

```typescript
const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const MIN_TEXT_LENGTH = 200; // chars — below this, fallback to Jina
const MAX_TEXT_LENGTH = 15000; // chars — truncate to this

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
  guidelines: string; // free-text description for prompt injection
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
    // t.me/channel_name or t.me/s/channel_name
    const parts = parsed.pathname.split("/").filter(Boolean);
    // Skip "s" prefix for public view
    const channel = parts.find((p) => p !== "s");
    return channel || null;
  } catch {
    return null;
  }
}

// ─── Content Extraction ───

export async function extractFromTelegram(channelName: string): Promise<string> {
  // t.me/s/ is the public web view with recent posts
  const url = `https://t.me/s/${channelName}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; bot)" },
  });

  if (!res.ok) throw new Error(`Telegram fetch failed: ${res.status}`);

  const html = await res.text();
  const cheerio = await import("cheerio");
  const $ = cheerio.load(html);

  // Extract text from message bubbles
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
  // Step 1: Try direct fetch + cheerio
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; bot)" },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`Website fetch failed: ${res.status}`);

  const html = await res.text();
  const cheerio = await import("cheerio");
  const $ = cheerio.load(html);

  // Remove noise
  $("script, style, nav, header, footer, aside, iframe, noscript").remove();

  // Extract main content
  const selectors = ["article", "main", ".post-content", ".entry-content", ".content", "body"];
  let text = "";

  for (const sel of selectors) {
    const content = $(sel).text().replace(/\s+/g, " ").trim();
    if (content.length > text.length) text = content;
  }

  // If too little text, try Jina Reader as fallback
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

// ─── Main: Extract content from any URL ───

export async function extractContentFromUrl(url: string): Promise<string> {
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

  // Parse JSON
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
```

**Step 2: Verify TypeScript compiles**

Run: `cd swipely-nextjs && npx tsc --noEmit lib/services/tov-analyzer.ts`
Expected: No errors (or only unrelated warnings)

**Step 3: Commit**

```bash
git add lib/services/tov-analyzer.ts
git commit -m "feat: add ToV analyzer service with URL content extraction"
```

---

## Task 4: Create /api/tov/analyze API route

**Files:**
- Create: `app/api/tov/analyze/route.ts`

**Step 1: Create the API route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractContentFromUrl, analyzeToneOfVoice } from "@/lib/services/tov-analyzer";

export async function POST(request: NextRequest) {
  // ─── Auth check ───
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { url: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { url } = body;

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
  }

  try {
    // 1. Extract text content from URL
    const text = await extractContentFromUrl(url);

    if (text.length < 100) {
      return NextResponse.json(
        { error: "Недостаточно текста на странице для анализа. Попробуй другую ссылку." },
        { status: 422 }
      );
    }

    // 2. Analyze ToV via Gemini
    const tovResult = await analyzeToneOfVoice(text, url);

    // 3. Save to profile
    let admin;
    try {
      admin = createAdminClient();
    } catch {
      return NextResponse.json({ error: "DB config error" }, { status: 500 });
    }

    const { error: updateErr } = await admin
      .from("profiles")
      .update({
        tov_profile: tovResult.profile,
        tov_guidelines: tovResult.guidelines,
        onboarding_completed: true,
      })
      .eq("id", user.id);

    if (updateErr) {
      console.error("ToV save error:", updateErr);
    }

    return NextResponse.json({
      profile: tovResult.profile,
      guidelines: tovResult.guidelines,
      saved: !updateErr,
    });
  } catch (error) {
    console.error("ToV analysis error:", error);
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Step 2: Verify no syntax errors**

Run: `cd swipely-nextjs && npx tsc --noEmit`

**Step 3: Commit**

```bash
git add app/api/tov/analyze/route.ts
git commit -m "feat: add /api/tov/analyze endpoint for URL-based ToV analysis"
```

---

## Task 5: Create onboarding page

**Files:**
- Create: `app/(dashboard)/onboarding/page.tsx`

**Step 1: Create the onboarding page**

This page has:
- URL input with "Analyze" button
- Loading state with progress animation
- Result card showing ToV profile + text guidelines
- "Save and Continue" and "Skip" buttons

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Loader2,
  Globe,
  MessageSquare,
  ArrowRight,
  Check,
} from "lucide-react";
import type { TovProfile } from "@/lib/services/tov-analyzer";

interface AnalysisResult {
  profile: TovProfile;
  guidelines: string;
  saved: boolean;
}

const TONE_LABELS: Record<string, string> = {
  professional: "Профессиональный",
  professional_friendly: "Профессионально-дружелюбный",
  casual: "Неформальный",
  enthusiastic: "Восторженный",
  provocative: "Провокационный",
};

const LENGTH_LABELS: Record<string, string> = {
  short: "Короткие",
  medium: "Средние",
  long: "Длинные",
};

const LEVEL_LABELS: Record<string, string> = {
  simple: "Простой",
  intermediate: "Средний",
  advanced: "Продвинутый",
};

const VOCAB_LABELS: Record<string, string> = {
  academic: "Академический",
  conversational: "Разговорный",
  slang: "Сленговый",
  modern_tech: "Современный/Tech",
};

const FORMAT_LABELS: Record<string, string> = {
  freeform: "Свободный",
  structured: "Структурированный",
  listicle: "Списки",
};

const EMOJI_LABELS: Record<string, string> = {
  none: "Не использует",
  minimal: "Минимально",
  moderate: "Умеренно",
  heavy: "Активно",
};

export default function OnboardingPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setAnalyzing(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/tov/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSkip = async () => {
    // Mark onboarding as completed without ToV
    await fetch("/api/tov/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "" }),
    }).catch(() => {}); // ignore errors for skip
    router.push("/dashboard");
  };

  const handleContinue = () => {
    router.push("/generate");
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-[var(--swipely-blue)]/10 flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="h-8 w-8 text-[var(--swipely-blue)]" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Настрой свой стиль</h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Вставь ссылку на свой сайт, блог или Telegram-канал — AI проанализирует
          твой стиль и будет создавать карусели в твоём Tone of Voice
        </p>
      </div>

      {/* URL Input */}
      {!result && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://t.me/your_channel или URL сайта"
                className="pl-10 rounded-xl h-12"
                disabled={analyzing}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              />
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={!url.trim() || analyzing}
              className="rounded-xl h-12 px-6 bg-[var(--swipely-blue)] hover:bg-[var(--swipely-blue-dark)]"
            >
              {analyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Анализировать
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {analyzing && (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[var(--swipely-blue)]/10 flex items-center justify-center mx-auto animate-pulse">
                <Sparkles className="h-7 w-7 text-[var(--swipely-blue)]" />
              </div>
              <div>
                <p className="font-semibold">Анализируем контент...</p>
                <p className="text-sm text-muted-foreground">
                  Извлекаем текст и определяем стиль. Обычно 5-10 секунд.
                </p>
              </div>
            </div>
          )}

          <div className="text-center pt-4">
            <button
              onClick={handleSkip}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Пропустить и настроить позже
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-6">
          {/* Success header */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-700">Стиль определён!</p>
              <p className="text-sm text-green-600/80">
                Твой Tone of Voice сохранён и будет применяться ко всем генерациям
              </p>
            </div>
          </div>

          {/* ToV Profile Card */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
            <h3 className="font-semibold text-lg">Твой Tone of Voice</h3>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Тон", value: TONE_LABELS[result.profile.tone] || result.profile.tone },
                { label: "Предложения", value: LENGTH_LABELS[result.profile.sentence_length] || result.profile.sentence_length },
                { label: "Уровень языка", value: LEVEL_LABELS[result.profile.language_level] || result.profile.language_level },
                { label: "Словарь", value: VOCAB_LABELS[result.profile.vocabulary_style] || result.profile.vocabulary_style },
                { label: "Форматирование", value: FORMAT_LABELS[result.profile.formatting_style] || result.profile.formatting_style },
                { label: "Эмодзи", value: EMOJI_LABELS[result.profile.emoji_usage] || result.profile.emoji_usage },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-xl bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                  <p className="font-medium text-sm">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Text guidelines */}
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Описание стиля</p>
              <p className="text-sm leading-relaxed">{result.guidelines}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleContinue}
              className="flex-1 rounded-xl h-12 bg-[var(--swipely-blue)] hover:bg-[var(--swipely-blue-dark)]"
            >
              Создать первую карусель
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => { setResult(null); setUrl(""); }}
              className="rounded-xl h-12"
            >
              Другая ссылка
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify it renders**

Run: `cd swipely-nextjs && npm run dev`
Navigate to `/onboarding` in the browser.

**Step 3: Commit**

```bash
git add app/\(dashboard\)/onboarding/page.tsx
git commit -m "feat: add onboarding page for ToV analysis from URL"
```

---

## Task 6: Enhance Settings page with URL-based ToV analysis

**Files:**
- Modify: `app/(dashboard)/dashboard/settings/page.tsx`

**Step 1: Update the ToV section in Settings**

Replace the existing ToV section (the `<div>` block starting at line 149 `{/* TOV */}`) with an enhanced version that includes:
- Display of current ToV profile (if exists) as metric cards
- URL input + "Re-analyze" button
- Editable text guidelines textarea
- Loading state during analysis

The enhanced section should:
1. Add new state: `tovProfile` (parsed JSON), `tovUrl`, `tovAnalyzing`
2. Load `tov_profile` from profile data on mount
3. Add `handleTovAnalyze` function that calls `/api/tov/analyze`
4. Show metrics grid when `tovProfile` exists
5. Keep existing textarea for manual editing of `tovGuidelines`

Key changes to the component:
- Add state variables: `const [tovProfile, setTovProfile] = useState<Record<string, string> | null>(null);`
- Add: `const [tovUrl, setTovUrl] = useState("");`
- Add: `const [tovAnalyzing, setTovAnalyzing] = useState(false);`
- On load, parse `p.tov_profile` if it exists
- Add analyze function that POSTs to `/api/tov/analyze`, updates both `tovProfile` and `tovGuidelines` state
- Replace the simple textarea TOV section with a richer card showing: current source URL, metrics grid (tone, sentence length, etc.), re-analyze input, and the editable guidelines textarea

**Step 2: Verify**

Run dev server, navigate to Settings, verify ToV section shows URL input and existing data loads.

**Step 3: Commit**

```bash
git add app/\(dashboard\)/dashboard/settings/page.tsx
git commit -m "feat: enhance Settings ToV section with URL analysis"
```

---

## Task 7: Integrate ToV guidelines into generation

**Files:**
- Modify: `app/api/generate/route.ts`

**Step 1: Read tov_guidelines from profile**

In the POST handler, after the profile query (line 188-192), change the select from:
```typescript
.select("id, subscription_tier, standard_used")
```
to:
```typescript
.select("id, subscription_tier, standard_used, tov_guidelines")
```

**Step 2: Pass tov_guidelines to buildSystemPrompt**

Change `buildSystemPrompt` signature to accept optional `tovGuidelines`:

```typescript
function buildSystemPrompt(templateId: string, slideCount: number, tone?: string, tovGuidelines?: string): string {
```

Inside the function, after the `toneSection` variable (line 52), add:

```typescript
const tovSection = tovGuidelines
  ? `\nАДАПТИРУЙ ПОД СТИЛЬ АВТОРА:\n${tovGuidelines}\n`
  : "";
```

In the system prompt template string, insert `${tovSection}` right after `${toneSection}` (around line 65).

**Step 3: Pass profile's tov_guidelines to buildSystemPrompt call**

Change line 248 from:
```typescript
const systemPrompt = buildSystemPrompt(template, slideCount, tone);
```
to:
```typescript
const tovGuidelines = profile?.tov_guidelines || undefined;
const systemPrompt = buildSystemPrompt(template, slideCount, tone, tovGuidelines);
```

**Step 4: Verify generation still works**

Run dev server, generate a carousel, check response.

**Step 5: Commit**

```bash
git add app/api/generate/route.ts
git commit -m "feat: inject user's ToV guidelines into generation prompt"
```

---

## Task 8: Add onboarding redirect for new users

**Files:**
- Modify: `app/(dashboard)/layout.tsx`

**Step 1: Add onboarding redirect logic**

In the `DashboardLayout` component's `useEffect` (line 148-192), after the profile is loaded or created, add a check:

After `setProfile(profileData as Profile);` (line 170), or after the new profile is created (line 185), check if `onboarding_completed` is false and the current path is not `/onboarding`:

```typescript
// After setting profile, check onboarding
if (profileData && !profileData.onboarding_completed) {
  // Don't redirect if already on onboarding page
  if (!window.location.pathname.includes("/onboarding")) {
    router.push("/onboarding");
  }
}
```

Same logic for newly created profiles (they should always go to onboarding).

**Step 2: Handle skip in the onboarding page**

The skip handler in onboarding should call the API to mark `onboarding_completed: true`. Update the `handleSkip` in onboarding page to make a direct Supabase call instead of the invalid empty-URL API call:

```typescript
const handleSkip = async () => {
  const supabase = (await import("@/lib/supabase/client")).createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user.id);
  }
  router.push("/dashboard");
};
```

**Step 3: Verify flow**

1. Sign up new account → should redirect to `/onboarding`
2. Skip → goes to dashboard, doesn't redirect again
3. Paste URL → analyze → continue → goes to generate

**Step 4: Commit**

```bash
git add app/\(dashboard\)/layout.tsx app/\(dashboard\)/onboarding/page.tsx
git commit -m "feat: redirect new users to onboarding for ToV setup"
```

---

## Task 9: Final verification and cleanup

**Step 1: Build check**

Run: `cd swipely-nextjs && npm run build`
Expected: Build succeeds without errors

**Step 2: Lint check**

Run: `cd swipely-nextjs && npm run lint`
Expected: No new lint errors

**Step 3: Manual E2E test**

1. Fresh signup → redirected to `/onboarding`
2. Paste `https://t.me/some_public_channel` → "Анализировать" → see ToV profile
3. "Создать первую карусель" → redirected to `/generate`
4. Generate carousel → verify ToV guidelines are applied (check AI output style)
5. Go to Settings → see ToV profile displayed
6. Re-analyze with different URL → profile updates
7. Manual edit of guidelines → save → verify persists

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete ToV analysis from URL — onboarding + settings + generation"
```

---

## File Summary

| Action | File | Purpose |
|--------|------|---------|
| Modify | `package.json` | Add cheerio dependency |
| Modify | `supabase-migration.sql` | Add tov_profile, onboarding_completed columns |
| Modify | `lib/supabase/queries.ts` | Extend Profile interface |
| Create | `lib/services/tov-analyzer.ts` | Content extraction + Gemini ToV analysis |
| Create | `app/api/tov/analyze/route.ts` | API endpoint for ToV analysis |
| Create | `app/(dashboard)/onboarding/page.tsx` | Onboarding page UI |
| Modify | `app/(dashboard)/dashboard/settings/page.tsx` | Enhanced ToV section |
| Modify | `app/api/generate/route.ts` | Inject ToV into generation prompt |
| Modify | `app/(dashboard)/layout.tsx` | Onboarding redirect for new users |
