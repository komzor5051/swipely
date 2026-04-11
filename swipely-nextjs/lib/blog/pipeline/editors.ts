import { generateFlash } from "@/lib/blog/gemini";

type EditorRole = "structure" | "coherence" | "anti-slop" | "factcheck" | "aeo";

const IMAGE_PRESERVATION = `
ВАЖНО: В статье есть плейсхолдеры для картинок в формате ![MEME: описание](placeholder).
НЕ УДАЛЯЙ и НЕ ИЗМЕНЯЙ их! Оставь точно как есть.`;

const EDITOR_PROMPTS: Record<EditorRole, string> = {
  structure: `Ты редактор-структуралист. Проверь и исправь статью:

1. Первый абзац ЦЕПЛЯЕТ? Если нет — перепиши хук.
2. После хука есть краткий пересказ "В этой статье: ..."? Если нет — добавь.
3. Заголовки логичны и информативны? Исправь размытые.
4. Используются ТОЛЬКО ## (H2) и ### (H3)? Если есть # (H1) — убери его.
5. Есть ли "мост" между секциями? Добавь переходы.
6. CTA-секция в конце есть и мотивирует попробовать Swipely?
${IMAGE_PRESERVATION}
Верни ИСПРАВЛЕННУЮ статью целиком в Markdown. Без комментариев.`,

  coherence: `Ты редактор связности. Проверь и исправь статью:

1. Нет ли повторов мыслей/фраз?
2. Абзацы перетекают логично?
3. Аргументация последовательна?
4. Примеры поддерживают тезисы?
5. Есть ссылка на https://swipely.ru? Если нет — вставь естественно.
${IMAGE_PRESERVATION}
Верни ИСПРАВЛЕННУЮ статью целиком в Markdown. Без комментариев.`,

  "anti-slop": `Ты редактор-чистильщик. Убери AI-слоп, канцелярит и штампы.

ЗАМЕНЫ (СТРОГО):
- "AI" в тексте — менять на "ИИ" (кроме устоявшихся: "AI-шаблоны")

УДАЛИ/ЗАМЕНИ следующие конструкции:
- "это не просто X, а Y" — убрать
- "в мире X", "в эпоху X" — убрать
- "в современном мире", "как известно" — убрать
- "безусловно", "несомненно", "разумеется" — убрать
- "стоит отметить", "важно понимать" — убрать
- "данный" — заменить на "этот" или убрать
- "является" — упростить форму
- "революционный", "инновационный" — убрать
- Пассивный залог — перевести в активный
- Длинные предложения (30+ слов) — разбить

ЛИМИТЫ за статью:
- "кроме того" / "более того" / "помимо этого" — максимум 1 раз
- "однако" — максимум 1 раз

Текст должен звучать как живой человек.
${IMAGE_PRESERVATION}
Верни ИСПРАВЛЕННУЮ статью целиком в Markdown. Без комментариев.`,

  aeo: `Ты AEO-редактор (Answer Engine Optimization). Твоя задача — сделать статью цитируемой ИИ-поиском (ChatGPT, Perplexity, Яндекс Нейро, Claude).

ПРОВЕРЬ И ИСПРАВЬ:

1. БЫСТРЫЙ ОТВЕТ в начале статьи (до первого H2):
   - Должен быть абзац или blockquote (>) с прямым ответом на вопрос из заголовка
   - 2-4 предложения, конкретно, с ключевым словом
   - Если его нет — ДОБАВЬ сразу после первого абзаца-хука

2. FAQ-БЛОК в конце (## Частые вопросы):
   - Должно быть 4-5 вопросов формата ### Вопрос? + ответ 2-4 предложения
   - Вопросы должны быть реальными поисковыми запросами по теме
   - Если блока нет — ДОБАВЬ перед CTA-секцией
   - Если есть, но меньше 4 вопросов — ДОПОЛНИ

3. НУМЕРОВАННЫЕ ШАГИ:
   - Любые инструкции "как сделать" — оформи как нумерованный список
   - Это помогает ИИ извлекать чёткие инструкции

4. КОНКРЕТНОСТЬ:
   - Каждый абзац должен содержать хотя бы одну конкретную деталь (платформа, число, действие)
   - Замени размытые утверждения на конкретные

5. ЦИТИРУЕМЫЕ ФАКТЫ:
   - Проверь: есть ли 3-5 конкретных числовых утверждений в статье?
   - Если меньше — добавь реалистичные статистики по теме каруселей/контента

Верни ИСПРАВЛЕННУЮ статью целиком в Markdown. Без комментариев.`,

  factcheck: `Ты фактчекер. Проверь статью:

1. Утверждения соответствуют источникам в тексте?
2. Числа и проценты правдоподобны?
3. Нет выдуманных функций или фактов?
4. Swipely упоминается корректно: ИИ-генератор каруселей, 18 шаблонов, поддержка ВКонтакте, Instagram, Telegram, LinkedIn.
5. Нет преувеличенных обещаний?

Если нашёл проблему — исправь или убери утверждение.
${IMAGE_PRESERVATION}
Верни ИСПРАВЛЕННУЮ статью целиком в Markdown. Без комментариев.`,
};

export async function editArticle(
  content: string,
  role: EditorRole
): Promise<string> {
  const prompt = `${EDITOR_PROMPTS[role]}

--- СТАТЬЯ ---
${content}
--- КОНЕЦ СТАТЬИ ---`;

  return generateFlash(prompt);
}

export async function runAllEditors(content: string): Promise<string> {
  const memeRegex = /!\[MEME:\s*.+?\]\(placeholder\)/g;
  const memePlaceholders = content.match(memeRegex) ?? [];

  const roles: EditorRole[] = ["structure", "aeo", "coherence", "anti-slop", "factcheck"];
  let result = content;
  for (const role of roles) {
    result = await editArticle(result, role);
  }

  // Re-insert lost placeholders after H2 headings
  if (memePlaceholders.length > 0) {
    const surviving = (result.match(memeRegex) ?? []).length;
    if (surviving < memePlaceholders.length) {
      const lost = memePlaceholders.filter((p) => !result.includes(p));
      const h2Positions: number[] = [];
      const h2Regex = /^## .+$/gm;
      let m: RegExpExecArray | null;
      while ((m = h2Regex.exec(result)) !== null) {
        const endOfLine = result.indexOf("\n", m.index + m[0].length);
        if (endOfLine !== -1) h2Positions.push(endOfLine + 1);
      }
      for (let i = 0; i < lost.length && i < h2Positions.length; i++) {
        const posIndex = Math.floor((i / lost.length) * h2Positions.length);
        const insertAt = h2Positions[posIndex];
        result =
          result.slice(0, insertAt) + "\n" + lost[i] + "\n\n" + result.slice(insertAt);
        const shift = lost[i].length + 3;
        for (let j = posIndex + 1; j < h2Positions.length; j++) {
          h2Positions[j] += shift;
        }
      }
    }
  }

  return result;
}
