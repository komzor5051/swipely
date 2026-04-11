import { generatePro } from "@/lib/blog/gemini";
import { Source } from "@/lib/blog/researcher";
import { createAdminClient } from "@/lib/supabase/admin";
import { SWIPELY_STYLE_GUIDE } from "./style-guide";

interface WriterInput {
  title: string;
  angle: string;
  keywords: string[];
  sources: Source[];
}

async function getExistingArticles(): Promise<string> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("swipely_blog_posts")
    .select("title, slug")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(30);

  if (!data || data.length === 0) return "";

  return data
    .map((p: { title: string; slug: string }) => `- [${p.title}](/blog/${p.slug})`)
    .join("\n");
}

export async function writeArticle(input: WriterInput): Promise<string> {
  const sourcesContext = input.sources
    .map((s) => `[${s.title}](${s.url}): ${s.summary}`)
    .join("\n\n");

  const existingArticles = await getExistingArticles();

  const today = new Date().toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const internalLinksBlock = existingArticles
    ? `\nВНУТРЕННИЕ ССЫЛКИ (желательно):
Опубликованные статьи:
${existingArticles}
Вставь 1-3 ссылки на релевантные статьи органично по тексту. Используй ТОЧНЫЕ URL.\n`
    : "";

  const prompt = `Ты старший автор блога Swipely — ИИ-сервиса для создания каруселей для соцсетей.
Пишешь по-русски, как опытный SMM-практик с реальными кейсами.
Дата публикации: ${today}

━━━ ЗАДАНИЕ ━━━
Тема: "${input.title}"
Угол: ${input.angle}
SEO-ключи (вставить естественно, не спамить): ${input.keywords.join(", ")}

━━━ ИСТОЧНИКИ (используй факты, не копируй) ━━━
${sourcesContext}

━━━ СТАЙЛГАЙД ━━━
${SWIPELY_STYLE_GUIDE}

━━━ ОБЯЗАТЕЛЬНАЯ СТРУКТУРА ━━━

**[БЫСТРЫЙ ОТВЕТ]** (сразу после заголовков, до первого H2)
Блок 2-4 предложения с прямым ответом на вопрос из заголовка.
Пример: "Карусели получают в 3 раза больше охвата, чем обычные посты. Алгоритм ВКонтакте и Instagram засчитывают каждый свайп как взаимодействие..."
Этот блок выделяется жирным или как blockquote (>). Именно его цитируют ChatGPT, Perplexity, Яндекс Нейро.

**Хук** (1-2 предложения)
Конкретная боль или провокационный факт. Не вопрос "А вы знаете что...?".

**Основная часть** (5-7 разделов H2)
- Каждый H2 содержит ключевое слово или его синоним
- В каждом разделе: тезис → пример/цифра → практический совет
- Нумерованные шаги там, где описываешь процесс (ИИ-поиск легко извлекает)
- Минимум 2 конкретных примера с платформами (ВКонтакте, Instagram, Telegram)

**[ЧАСТЫЕ ВОПРОСЫ]** — ОБЯЗАТЕЛЬНЫЙ раздел в конце (## Частые вопросы)
Ровно 4-5 вопросов в формате:
### Вопрос?
Ответ в 2-4 предложениях. Конкретно, без воды.

Темы вопросов — реальные запросы пользователей по теме статьи.
ВАЖНО: этот блок индексируется как FAQ schema и цитируется ИИ-поиском.

**CTA** (в конце, после FAQ)
Предложи попробовать [Swipely](https://swipely.ru) — конкретно, с пользой, не навязчиво.

━━━ ССЫЛКИ ━━━
- [Swipely](https://swipely.ru) — 1-2 раза по тексту, органично
${internalLinksBlock}

━━━ ТРЕБОВАНИЯ ━━━
- Объём: 1500-2200 слов
- Формат: Markdown
- Заголовок H1 НЕ нужен (добавляется автоматически)
- Никаких картинок и MEME-плейсхолдеров
- Пиши "ИИ", не "AI"

Напиши ТОЛЬКО статью в Markdown. Без вводных фраз от себя.`;

  return generatePro(prompt);
}
