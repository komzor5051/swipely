import { generatePro } from "@/lib/blog/gemini";
import { searchSources } from "@/lib/blog/researcher";
import { collectSeedQueries, getSearchVolume } from "@/lib/blog/wordstat";
import { createAdminClient } from "@/lib/supabase/admin";

interface GeneratedTopic {
  title: string;
  angle: string;
  keywords: string[];
  score: number;
}

const WORDSTAT_SEEDS = [
  "карусель вконтакте",
  "карусель instagram",
  "карусель для соцсетей",
  "контент для соцсетей",
  "создать карусель онлайн",
  "карусель в телеграм",
  "генератор постов AI",
  "SMM инструменты",
];

export async function mineTopics(): Promise<GeneratedTopic[]> {
  const supabase = createAdminClient();

  // 1. Research current SMM/carousel trends
  const trends = await searchSources(
    "карусели соцсети контент-маркетинг Instagram ВКонтакте тренды 2026",
    8
  );
  const trendSummary = trends.map((t) => `- ${t.title}: ${t.summary}`).join("\n");

  // 2. Fetch real search demand from Wordstat (best-effort)
  let searchDemandContext = "";
  try {
    const seedData = await collectSeedQueries(WORDSTAT_SEEDS, 5);
    if (seedData.length > 0) {
      searchDemandContext = `\nРЕАЛЬНЫЙ ПОИСКОВЫЙ СПРОС (Яндекс Wordstat):\n${
        seedData.map((q) => `- "${q.phrase}" — ${q.volume} запросов/мес`).join("\n")
      }\nУчитывай эти данные при выборе тем и ключевых слов.\n`;
    }
  } catch {
    // Wordstat is optional
  }

  // 3. Avoid duplicate topics
  const { data: existing } = await supabase
    .from("swipely_blog_topics")
    .select("title")
    .order("created_at", { ascending: false })
    .limit(50);

  const existingTitles = (existing ?? []).map((t: { title: string }) => t.title).join("\n");

  // 4. Generate topics
  const prompt = `Ты контент-стратег блога Swipely — AI-генератора каруселей для соцсетей.

Swipely помогает авторам и бизнесу создавать карусели для ВКонтакте, Instagram, Telegram, LinkedIn за 30 секунд с помощью ИИ. 18 шаблонов, бесплатный старт.

Тренды:
${trendSummary}
${searchDemandContext}
Уже опубликованные темы (НЕ повторяй):
${existingTitles || "Пока нет публикаций"}

Сгенерируй 10 тем для блога.

ТЕМАТИКА — карусели и контент для соцсетей:
- Как создавать карусели (структура, тексты, дизайн)
- Почему карусели работают лучше обычных постов (охваты, алгоритмы)
- Примеры и разборы каруселей по нишам (бизнес, эксперты, блогеры)
- Контент-план: что выкладывать в карусели
- ИИ в контент-маркетинге: реальная польза
- Ошибки при создании каруселей
- Руководства по конкретным форматам (ВКонтакте, Instagram, Telegram)

СТИЛЬ ЗАГОЛОВКОВ — конкретный, практичный. Примеры ХОРОШИХ тем:
- "5 структур каруселей с самым высоким охватом"
- "Почему алгоритм ВКонтакте любит карусели больше обычных постов"
- "Карусель за 30 секунд: пошаговый процесс с Swipely"
- "Что писать в карусели: 7 форматов, которые работают"
- "Как эксперт может заменить Stories на карусели и выиграть в охвате"

Примеры ПЛОХИХ тем:
- "Инновационные подходы к контент-стратегии" — слишком размыто
- "Тренды SMM в 2026 году" — скучно и общо
- "Цифровая трансформация маркетинга" — клише

Каждая тема:
- Практичная, с конкретным углом
- Заголовок ≤ 55 символов
- Должна быть интересна для SMM-специалистов, экспертов, предпринимателей

Ответь СТРОГО в JSON-формате (массив):
[{
  "title": "Заголовок статьи",
  "angle": "Уникальный угол раскрытия",
  "keywords": ["ключ1", "ключ2", "ключ3"],
  "score": 1-10
}]

Только JSON, без markdown-обёрток.`;

  const raw = await generatePro(prompt);
  const cleaned = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  const topics: GeneratedTopic[] = JSON.parse(cleaned);

  // 5. Enrich scores with Wordstat volumes (best-effort)
  for (const topic of topics) {
    try {
      const mainKeyword = topic.keywords[0];
      if (mainKeyword) {
        const volume = await getSearchVolume(mainKeyword);
        if (volume > 0) {
          const boost = volume >= 1000 ? 3 : volume >= 300 ? 2 : volume >= 100 ? 1 : 0;
          topic.score = Math.min(10, topic.score + boost);
        }
      }
    } catch {
      // best-effort
    }
  }

  // 6. Save to Supabase
  const rows = topics.map((t) => ({
    title: t.title,
    angle: t.angle,
    keywords: t.keywords,
    source: "trend",
    score: t.score,
    search_volume: 0,
    status: "pending",
  }));

  const { error } = await supabase.from("swipely_blog_topics").insert(rows);
  if (error) throw new Error(`Failed to save topics: ${error.message}`);

  return topics;
}
