import { GoogleGenAI } from "@google/genai";
import { createAdminClient } from "@/lib/supabase/admin";

const MEME_PLACEHOLDER_REGEX = /!\[MEME:\s*(.+?)\]\(placeholder\)/g;

function buildPrompt(description: string): string {
  return `Создай мем-картинку для блога о контент-маркетинге и соцсетях.

Описание сцены: ${description}

СТИЛЬ — выбери ОДИН случайный из списка:
1. Rick and Morty — кислотные цвета, безумные глаза, гротеск
2. Тарантино — кинематографичный кадр, напряжённые лица крупным планом
3. Николас Кейдж — широко раскрытые глаза, overacting на максимум
4. Конфуций — тушь, мудрец за ноутбуком, минимализм и ирония
5. Роберт Дауни мл. — самодовольная ухмылка, хайтек-окружение
6. Мэттью Макконахи — философский взгляд, "alright alright alright" энергия

Требования:
- Персонажи с утрированными эмоциями
- Тематика: контент для соцсетей, SMM, создание постов
- Если в описании есть "подпись" — нарисуй текст НА РУССКОМ ЯЗЫКЕ крупно на картинке
- Текст на картинке: белые буквы с чёрной обводкой, крупный, читаемый
- Формат 16:9
- Картинка должна быть СМЕШНОЙ без контекста
- Тон: ирония и сарказм, без мата`;
}

async function generateImageWithGemini(prompt: string, retries = 2): Promise<Buffer> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GEMINI_API_KEY not set");

  const proxyUrl = process.env.GEMINI_PROXY_URL;
  const ai = new GoogleGenAI({
    apiKey,
    ...(proxyUrl && { httpOptions: { baseUrl: proxyUrl } }),
  });

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await ai.models.generateImages({
        model: "imagen-3.0-generate-002",
        prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: "image/png",
        },
      });

      const imageBytes = result.generatedImages?.[0]?.image?.imageBytes;
      if (!imageBytes) throw new Error("No image bytes in response");

      return Buffer.from(imageBytes, "base64");
    } catch (err) {
      if (attempt < retries) {
        console.log(`[blog-image-gen] Attempt ${attempt + 1} failed, retrying in 3s...`);
        await new Promise((r) => setTimeout(r, 3000));
      } else {
        throw err;
      }
    }
  }
  throw new Error("Unreachable");
}

async function uploadToStorage(
  buffer: Buffer,
  slug: string,
  index: number
): Promise<string> {
  const supabase = createAdminClient();
  const path = `blog-images/${slug}/img-${index}.png`;

  const { error } = await supabase.storage
    .from("swipely-blog-images")
    .upload(path, buffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from("swipely-blog-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function generateArticleImages(
  markdown: string,
  articleSlug: string,
  title?: string,
  keywords?: string[]
): Promise<{ markdown: string; coverImage: string | null }> {
  // Step 1: process inline MEME placeholders (if AI inserted them)
  const matches: { full: string; description: string }[] = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(MEME_PLACEHOLDER_REGEX.source, "g");
  while ((match = regex.exec(markdown)) !== null) {
    matches.push({ full: match[0], description: match[1] });
  }
  if (matches.length > 3) {
    for (let i = 3; i < matches.length; i++) {
      markdown = markdown.replace(matches[i].full, "");
    }
    matches.length = 3;
  }

  let result = markdown;
  let coverImage: string | null = null;

  // Step 2: generate inline images from placeholders
  for (let i = 0; i < matches.length; i++) {
    const { full, description } = matches[i];
    try {
      console.log(`[blog-image-gen] Inline ${i + 1}/${matches.length}: ${description.slice(0, 60)}...`);
      const buffer = await generateImageWithGemini(buildPrompt(description));
      const url = await uploadToStorage(buffer, articleSlug, i + 1);
      if (i === 0) coverImage = url;
      result = result.replace(full, `![${description.trim()}](${url})`);
      console.log(`[blog-image-gen] Inline image ${i + 1} uploaded: ${url}`);
    } catch (err) {
      console.error(`[blog-image-gen] Inline image ${i + 1} failed:`, err);
      result = result.replace(full, "");
    }
    if (i < matches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return { markdown: result, coverImage };
}
