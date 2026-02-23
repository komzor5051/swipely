import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkSubscriptionExpiry } from "@/lib/supabase/queries";
import {
  generateSlideImage,
  type SlideData,
} from "@/lib/services/image-generator";

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

const PHOTO_SYSTEM_PROMPT = `# Viral Visual Carousel Content (Photo Mode)

Ты создаёшь КОРОТКИЙ, УДАРНЫЙ текст НА РУССКОМ ЯЗЫКЕ для слайдов карусели, где главный визуал — AI-сгенерированное фото.

КРИТИЧЕСКИ ВАЖНО — ЯЗЫК:
- ВСЕ тексты ТОЛЬКО НА РУССКОМ ЯЗЫКЕ
- Заголовки на русском
- Контент слайдов на русском
- Подпись к посту на русском
- Даже если тема на английском — пиши на русском

КОНТЕКСТ:
- Это ФОТО-РЕЖИМ — изображение главное, текст минимальный оверлей
- Максимум 25 слов на слайд
- Заголовки 3-5 слов, ударные, подходят для CAPS

ПРАВИЛА:
- Каждый слайд: одна чёткая мысль
- Контент: короткие ударные фразы (НЕ полные предложения)
- Без markdown, без эмодзи, без спецсимволов
- Отметь 1-2 ключевых слова в заголовке тегом <hl>слово</hl>

HOOK ENGINE (первый слайд):
Выбери ОДИН: CONTRARIAN, SHOCK DATA, PAIN MIRROR, PROMISE, FEAR, CURIOUS GAP

СТРУКТУРА:
1. hook — мгновенная остановка скролла
2. tension — усиление боли или проблемы
3. value — конкретная польза
4. value — пример или доказательство
5. insight — неожиданный вывод
6. cta — одно простое действие

ТЕКСТ ПОСТА (post_caption):
- 150-300 слов НА РУССКОМ
- Дополняет карусель, а не повторяет
- Цепляющее начало, основная мысль, призыв к действию
- Абзацы для читаемости
- В конце — вопрос или простой CTA
- Без хештегов

OUTPUT: Верни ТОЛЬКО валидный JSON:
{
  "slides": [
    { "type": "hook", "title": "Заголовок с <hl>ключевым</hl> словом", "content": "Короткий ударный текст" }
  ],
  "post_caption": "Текст поста на русском"
}`;

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

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: "AI service not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return new Response(JSON.stringify({ error: "DB config error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("id, subscription_tier, subscription_end, photo_slides_balance")
    .eq("id", user.id)
    .single();

  // ─── Subscription expiry check ───
  if (profile) {
    await checkSubscriptionExpiry(admin, user.id, profile);
  }

  let body: {
    text: string;
    slideCount: number;
    format: string;
    style: string;
    referencePhoto: string;
  };

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { text, slideCount, format, style, referencePhoto } = body;

  if (!text || !slideCount || !style || !referencePhoto) {
    return new Response(
      JSON.stringify({
        error: "Missing required fields: text, slideCount, style, referencePhoto",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (slideCount < 3 || slideCount > 7) {
    return new Response(
      JSON.stringify({ error: "slideCount must be between 3 and 7" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // ─── Photo balance check (must be before stream starts) ───
  const balance = profile?.photo_slides_balance ?? 0;
  if (balance < slideCount) {
    return new Response(
      JSON.stringify({
        error: `Недостаточно Photo-слайдов. У тебя ${balance}, нужно ${slideCount}. Пополни баланс на странице /pricing.`,
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      }

      try {
        send({ type: "content", message: "Generating content..." });

        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY! });

        const contentResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash-lite",
          contents: `${PHOTO_SYSTEM_PROMPT}\n\nCreate a ${slideCount}-slide carousel about:\n"${text}"`,
        });

        const rawContent = contentResponse.text || "";
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
          send({ type: "error", message: "Failed to parse AI content" });
          controller.close();
          return;
        }

        const carouselData = JSON.parse(jsonMatch[0]);

        if (carouselData.slides) {
          carouselData.slides = carouselData.slides.map(
            (slide: { title: string; content: string; type: string }) => ({
              ...slide,
              title: cleanMarkdown(slide.title),
              content: cleanMarkdown(slide.content),
            })
          );
        }

        const imageStyle = (style === "realistic" ? "realistic" : "cartoon") as
          | "cartoon"
          | "realistic";
        const imageFormat = (
          format === "square" ? "square" : "portrait"
        ) as "portrait" | "square";

        const slides = [];

        for (let i = 0; i < carouselData.slides.length; i++) {
          send({
            type: "progress",
            current: i + 1,
            total: carouselData.slides.length,
          });

          const slideData: SlideData = {
            title: carouselData.slides[i].title,
            content: carouselData.slides[i].content,
            type: carouselData.slides[i].type || "value",
            slideNumber: i + 1,
          };

          let imageBase64: string | null = null;
          try {
            imageBase64 = await generateSlideImage(
              referencePhoto,
              slideData,
              imageStyle,
              imageFormat
            );
          } catch (err) {
            console.error(`Image gen failed for slide ${i + 1}:`, err);
          }

          slides.push({
            ...carouselData.slides[i],
            imageUrl: imageBase64
              ? `data:image/png;base64,${imageBase64}`
              : undefined,
          });

          if (i < carouselData.slides.length - 1) {
            await new Promise((r) => setTimeout(r, 2000));
          }
        }

        const result = {
          slides,
          post_caption: carouselData.post_caption || "",
        };

        send({ type: "result", data: result });

        try {
          await admin.from("generations").insert({
            user_id: user.id,
            template: "photo_mode",
            slide_count: slideCount,
            format: format || "portrait",
            tone: null,
            input_text: text,
            output_json: result,
          });
          // Deduct photo slides balance (generation succeeded)
          await admin.rpc("decrement_photo_balance", {
            user_id_param: user.id,
            amount: slideCount,
          });
        } catch (dbErr) {
          console.error("DB save error:", dbErr);
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        console.error("Photo generation error:", error);
        send({
          type: "error",
          message:
            error instanceof Error ? error.message : "Generation failed",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
