import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// ─── Design Config (from swipely-bot/src/services/gemini.js) ───

const designPresets: Record<string, { name: string; max_words_per_slide: number; tone: string }> = {
  notebook: { name: "Notebook Sketch", max_words_per_slide: 45, tone: "personal, educational, handwritten-feel" },
  aurora: { name: "Aurora", max_words_per_slide: 45, tone: "ethereal, modern, dreamy" },
  terminal: { name: "Terminal", max_words_per_slide: 40, tone: "technical, retro-computer, hacker" },
  editorial: { name: "Editorial", max_words_per_slide: 45, tone: "high-fashion, magazine, bold" },
  luxe: { name: "Luxe", max_words_per_slide: 40, tone: "premium, luxury, elegant" },
  backspace: { name: "Backspace", max_words_per_slide: 40, tone: "modern agency, bold typography, minimalist" },
  star_highlight: { name: "Star Highlight", max_words_per_slide: 25, tone: "elegant, sophisticated, designer-focused, serif typography" },
  purple_accent: { name: "Purple Accent", max_words_per_slide: 35, tone: "bold, modern branding, professional, impactful statements" },
  quote_doodle: { name: "Quote Doodle", max_words_per_slide: 30, tone: "thoughtful, question-based, conversational, insightful" },
  speech_bubble: { name: "Speech Bubble", max_words_per_slide: 20, tone: "quotable, memorable, wisdom-based, attribution-style" },
  grid_multi: { name: "Grid Multi", max_words_per_slide: 30, tone: "data-driven, statistics, educational, engaging hooks" },
  receipt: { name: "Receipt", max_words_per_slide: 25, tone: "bold statements, brand messaging, manifesto-style, concise" },
  lime_checklist: { name: "Lime Checklist", max_words_per_slide: 35, tone: "benefit-focused, list-style, actionable tips, positive energy" },
  app_list: { name: "App List", max_words_per_slide: 30, tone: "service-oriented, professional, menu-style, clear offerings" },
  paper_image: { name: "Paper Texture", max_words_per_slide: 30, tone: "provocative, attention-grabbing, money/business focused, impactful" },
  swipely: { name: "Swipely", max_words_per_slide: 35, tone: "modern, tech-savvy, energetic, startup vibe, bold statements" },
};

const contentTones: Record<string, string> = {
  educational: `СТИЛЬ ПОДАЧИ: Обучающий, экспертный
• Давай конкретную пользу и практические советы
• Используй факты, статистику, примеры
• Структурируй информацию (шаги, списки, чек-листы)
• Позиционируй как эксперта, который делится знаниями`,
  entertaining: `СТИЛЬ ПОДАЧИ: Развлекательный, лёгкий
• Используй юмор, иронию, самоиронию
• Пиши как будто рассказываешь другу за кофе
• Добавляй неожиданные повороты и сравнения`,
  provocative: `СТИЛЬ ПОДАЧИ: Провокационный, вызывающий
• Ломай стереотипы и общепринятые мнения
• Используй контрастные, спорные заявления
• Задавай неудобные вопросы`,
  motivational: `СТИЛЬ ПОДАЧИ: Мотивационный, вдохновляющий
• Используй истории успеха и трансформации
• Говори о преодолении трудностей
• Вдохновляй на действие`,
};

function buildSystemPrompt(templateId: string, slideCount: number, tone?: string, tovGuidelines?: string): string {
  const design = designPresets[templateId] || designPresets.notebook;
  const toneSection = tone && contentTones[tone] ? `\n${contentTones[tone]}\n` : "";
  const tovSection = tovGuidelines ? `\nАДАПТИРУЙ ПОД СТИЛЬ АВТОРА:\n${tovGuidelines}\n` : "";

  return `# Viral Visual Carousel SMM Content Architecture (RU)

Ты — элитный SMM-стратег и контент-архитектор. Ты создаёшь ВИРУСНЫЕ визуальные карусели для любых платформ с изображениями.

ТВОЙ ОБРАЗ МЫШЛЕНИЯ: Ты думаешь как пользователь, который бесконечно листает ленту. Задача — остановить скролл за 0.5 секунды и удержать внимание до конца.

ГЛАВНАЯ ЦЕЛЬ: Максимальное удержание, сохранения и дочитывание карусели.

КОНТЕКСТ:
• ДИЗАЙН: ${design.name}
• ТОН ДИЗАЙНА: ${design.tone}
${toneSection}
${tovSection}
ПОВЕДЕНЧЕСКАЯ ЛОГИКА:
• Пользователь сканирует, а не читает
• Если мысль не ясна сразу — слайд пролистывают
• Каждый следующий слайд обязан усиливать интерес

ЗАДАЧА: Создай РОВНО ${slideCount} слайдов. Каждый слайд — одна уникальная мысль. Запрещено повторять идеи, формулировки или примеры.

ОГРАНИЧЕНИЯ ПО ТЕКСТУ:
• content: 25–${design.max_words_per_slide} слов
• Короткие предложения
• Простая разговорная лексика
• Текст должен легко читаться на изображении

КРИТИЧЕСКИ ВАЖНО — ЧИСТЫЙ ТЕКСТ:
❌ Никакого markdown
❌ Никаких эмодзи
❌ Никаких кавычек
❌ Никаких спецсимволов
✅ Только обычный текст

HOOK ENGINE (обязательно для первого слайда):
Выбери ОДИН паттерн:
• CONTRARIAN — ломает привычное мнение
• SHOCK DATA — цифра или факт
• PAIN MIRROR — отражение боли пользователя
• PROMISE — сильное и конкретное обещание
• FEAR — риск или потеря
• CURIOUS GAP — недосказанность

ЗАГОЛОВКИ:
• 3–6 слов
• Без символов
• Понятны за 1 секунду
• Один чёткий смысл, без абстракций
• ОБЯЗАТЕЛЬНО выдели 1-2 ключевых слова тегом <hl>слово</hl>

СТРУКТУРА СЛАЙДОВ:
1. hook — мгновенная остановка скролла
2. tension — усиление боли или проблемы
3. value — конкретная польза или причина
4. value — продолжение или пример
5. insight — неожиданный вывод или ошибка
6. cta — одно простое действие

CTA:
• Только одно действие
• Без давления
• Универсально для любых соцсетей

ТЕКСТ ПОСТА (post_caption):
После слайдов создай текст для публикации под каруселью:
• 150-300 слов
• Дополняет карусель, а не повторяет её
• Содержит: цепляющее начало, основную мысль, призыв к действию
• Используй абзацы для читаемости
• В конце — вопрос для вовлечения или простой CTA
• Хештеги НЕ добавляй

OUTPUT: Верни ТОЛЬКО валидный JSON строго по схеме ниже. Без пояснений, комментариев и лишнего текста.

{
  "slides": [
    {
      "type": "hook",
      "title": "Заголовок с <hl>ключевым</hl> словом",
      "content": "Текст слайда"
    }
  ],
  "post_caption": "Текст поста для публикации под каруселью"
}`;
}

function cleanMarkdown(text: string): string {
  if (!text) return text;
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── POST Handler ───

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "AI service not configured" },
      { status: 500 }
    );
  }

  // ─── Auth check ───
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Admin client for DB operations (bypasses RLS)
  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return NextResponse.json(
      { error: "DB config error", detail: String(e) },
      { status: 500 }
    );
  }

  // ─── Ensure profile exists ───
  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("id, subscription_tier, standard_used, tov_guidelines")
    .eq("id", user.id)
    .single();

  if (!profile && !profileErr?.message?.includes("multiple")) {
    const { error: createErr } = await admin.from("profiles").insert({
      id: user.id,
      email: user.email,
      subscription_tier: "free",
      standard_used: 0,
      onboarding_completed: false,
    });
    if (createErr) {
      console.error("Create profile error:", createErr);
    }
  }

  // ─── Usage limit check ───
  const tier = profile?.subscription_tier || "free";
  const used = profile?.standard_used || 0;
  const limit = tier === "pro" ? -1 : 3;

  if (limit !== -1 && used >= limit) {
    return NextResponse.json(
      { error: "Лимит генераций исчерпан. Перейди на PRO для безлимита." },
      { status: 429 }
    );
  }

  let body: {
    text: string;
    template: string;
    slideCount: number;
    format?: string;
    tone?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { text, template, slideCount, format, tone } = body;

  if (!text || !template || !slideCount) {
    return NextResponse.json(
      { error: "Missing required fields: text, template, slideCount" },
      { status: 400 }
    );
  }

  if (slideCount < 3 || slideCount > 10) {
    return NextResponse.json(
      { error: "slideCount must be between 3 and 10" },
      { status: 400 }
    );
  }

  const tovGuidelines = profile?.tov_guidelines as string | undefined;
  const systemPrompt = buildSystemPrompt(template, slideCount, tone, tovGuidelines);

  const userPrompt = `Создай вирусную визуальную карусель на основе текста ниже.

Условия:
• адаптируй под формат изображений
• усили боль, выгоду или контраст
• сократи сложные формулировки
• думай как человек, который скроллит ленту

Исходный текст:
"${text}"`;

  try {
    const geminiResponse = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 3000,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json().catch(() => null);
      console.error("Gemini API error:", errorData);
      return NextResponse.json(
        { error: "AI generation failed" },
        { status: 502 }
      );
    }

    const geminiData = await geminiResponse.json();
    const rawContent =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!rawContent) {
      return NextResponse.json(
        { error: "Empty AI response" },
        { status: 502 }
      );
    }

    // Parse JSON from response
    let cleanedContent = rawContent.trim();
    if (cleanedContent.startsWith("```json")) {
      cleanedContent = cleanedContent
        .replace(/^```json\s*\n?/, "")
        .replace(/\n?```\s*$/, "");
    } else if (cleanedContent.startsWith("```")) {
      cleanedContent = cleanedContent
        .replace(/^```\s*\n?/, "")
        .replace(/\n?```\s*$/, "");
    }

    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Could not extract JSON from:", rawContent.slice(0, 500));
      return NextResponse.json(
        { error: "Could not parse AI response" },
        { status: 502 }
      );
    }

    const carouselData = JSON.parse(jsonMatch[0]);

    // Clean markdown from slides
    if (carouselData.slides) {
      carouselData.slides = carouselData.slides.map(
        (slide: { title: string; content: string; type: string }) => ({
          ...slide,
          title: cleanMarkdown(slide.title),
          content: cleanMarkdown(slide.content),
        })
      );
    }

    // ─── Save generation + increment usage (admin client, bypasses RLS) ───
    const { data: savedGen, error: saveErr } = await admin
      .from("generations")
      .insert({
        user_id: user.id,
        template,
        slide_count: slideCount,
        format: format || "portrait",
        tone,
        input_text: text,
        output_json: carouselData,
      })
      .select("id")
      .single();

    if (saveErr) {
      console.error("Save generation error:", saveErr);
    }

    const { error: rpcErr } = await admin.rpc("increment_standard_used", {
      user_id_param: user.id,
    });

    return NextResponse.json({
      ...carouselData,
      _debug: {
        saved: !!savedGen,
        saveError: saveErr?.message || null,
        rpcError: rpcErr?.message || null,
        userId: user.id,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Generation failed. Please try again." },
      { status: 500 }
    );
  }
}
