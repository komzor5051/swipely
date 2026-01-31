/**
 * OpenRouter API service (proxy to Claude 3.5 Haiku)
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'anthropic/claude-3.5-haiku';

/**
 * Generate carousel content using Claude 3.5 Haiku
 * @param {string} topic - User's topic/text
 * @param {object} settings - Generation settings
 * @returns {Promise<object>} Generated carousel data
 */
async function generateCarouselContent(topic, settings = {}) {
  const {
    language = 'ru',
    slideCount = 5,
    style = 'auto',
    includeOriginalText = false
  } = settings;

  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not configured');
  }

  const systemPrompt = buildSystemPrompt(language, slideCount, style);
  const userPrompt = buildUserPrompt(topic, includeOriginalText);

  console.log(`🚀 Generating carousel: ${slideCount} slides, ${language}, style: ${style}`);

  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://swipely.ai',
      'X-Title': 'Swipely Mini App'
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ OpenRouter API error:', error);
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Empty response from AI');
  }

  // Parse JSON from response (may be wrapped in ```json```)
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
                    content.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    console.error('❌ Failed to parse AI response:', content);
    throw new Error('Invalid AI response format');
  }

  const jsonStr = jsonMatch[1] || jsonMatch[0];
  const result = JSON.parse(jsonStr);

  console.log(`✅ Generated ${result.slides?.length || 0} slides`);

  return result;
}

/**
 * Build system prompt for carousel generation
 */
function buildSystemPrompt(language, slideCount, style) {
  const langInstructions = language === 'ru'
    ? 'Весь контент ДОЛЖЕН быть на русском языке.'
    : 'All content MUST be in English.';

  return `Ты — топовый SMM-стратег, создающий вирусные карусели для Instagram.

${langInstructions}

ЗАДАЧА: Создать карусель из ${slideCount} слайдов.

ПРАВИЛА ДЛЯ ЗАГОЛОВКОВ:
- СТРОГО 3-6 слов
- Используй триггеры: числа, шок, боль → решение
- НЕ начинай с "Как...", "Почему...", "Что..."
- Примеры: "5 ошибок убивают продажи", "Секрет миллионеров раскрыт"

ПРАВИЛА ДЛЯ КОНТЕНТА:
- 25-50 слов на слайд
- Списки форматируй: "1. Название: Описание"
- Каждый слайд — законченная мысль

ТИПЫ СЛАЙДОВ:
- hook (первый): Цепляющий заголовок + интрига
- statement: Утверждение или факт
- list: Список пунктов
- cta (последний): Призыв к действию

ФОРМАТ ОТВЕТА (JSON):
{
  "globalDesign": {
    "backgroundColor": "#HEX",
    "accentColor": "#HEX",
    "backgroundPattern": "solid|gradient-tr|gradient-bl|dots|stripes|grid"
  },
  "slides": [
    {
      "title": "Заголовок 3-6 слов",
      "content": "Текст слайда 25-50 слов",
      "type": "hook|statement|list|cta",
      "emphasize": ["ключевое", "слово"]
    }
  ]
}

Отвечай ТОЛЬКО валидным JSON без пояснений.`;
}

/**
 * Build user prompt
 */
function buildUserPrompt(topic, includeOriginalText) {
  let prompt = `Тема: ${topic}`;

  if (includeOriginalText) {
    prompt += '\n\nИспользуй оригинальный текст пользователя в контенте слайдов, адаптируя его для карусели.';
  }

  return prompt;
}

module.exports = {
  generateCarouselContent
};
