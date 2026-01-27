/**
 * AI Service — Gemini + OpenRouter fallback
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

const GOOGLE_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const DEFAULT_MODEL = 'gemini-2.5-flash-lite';

let genAI = null;

function initGemini() {
  if (!GOOGLE_API_KEY) return null;
  if (!genAI) {
    genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
  }
  return genAI;
}

/**
 * Генерация через OpenRouter (fallback)
 */
async function generateViaOpenRouter(prompt, systemPrompt) {
  console.log('🔄 Fallback: OpenRouter...');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://swipely.ai',
      'X-Title': 'Swipely Bot'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-001',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2500,
      temperature: 0.7
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content;
}

/**
 * Генерация через Gemini напрямую
 */
async function generateViaGemini(prompt, systemPrompt) {
  const ai = initGemini();
  if (!ai) throw new Error('Gemini не настроен');

  const model = ai.getGenerativeModel({
    model: DEFAULT_MODEL,
    generationConfig: { temperature: 0.7, maxOutputTokens: 2500 }
  });

  const fullPrompt = `${systemPrompt}\n\n${prompt}`;
  const result = await model.generateContent(fullPrompt);
  return result.response.text();
}

/**
 * Генерация контента карусели
 */
async function generateCarouselContent(userText, stylePreset, slideCount = 5, toneGuidelines = null) {
  console.log(`🤖 Генерация (стиль: ${stylePreset}, слайдов: ${slideCount})...`);

  const designConfig = getDesignConfig(stylePreset);
  const systemPrompt = buildSystemPrompt(designConfig, slideCount, toneGuidelines);
  const userPrompt = `Создай карусель на основе этого текста:\n\n"${userText}"`;

  let content = null;

  // Пробуем Gemini напрямую
  try {
    console.log('🔄 Попытка: Gemini Direct...');
    content = await generateViaGemini(userPrompt, systemPrompt);
    console.log('✅ Gemini Direct OK');
  } catch (error) {
    console.error('❌ Gemini Direct failed:', error.message);

    // Fallback на OpenRouter
    if (OPENROUTER_API_KEY) {
      try {
        console.log('🔄 Fallback: OpenRouter...');
        content = await generateViaOpenRouter(userPrompt, systemPrompt);
        console.log('✅ OpenRouter OK');
      } catch (e) {
        console.error('❌ OpenRouter failed:', e.message);
        throw e;
      }
    } else {
      throw error;
    }
  }

  if (!content) throw new Error('Пустой ответ от AI');

  // Парсим JSON
  let cleanedContent = content.trim();
  if (cleanedContent.startsWith('```json')) {
    cleanedContent = cleanedContent.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '');
  } else if (cleanedContent.startsWith('```')) {
    cleanedContent = cleanedContent.replace(/^```\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('Ответ AI:', content);
    throw new Error('Не удалось извлечь JSON');
  }

  const carouselData = JSON.parse(jsonMatch[0]);
  console.log(`✅ Сгенерировано ${carouselData.slides?.length || 0} слайдов`);

  return carouselData;
}

function getDesignConfig(stylePreset) {
  const presets = {
    minimal_pop: { name: 'Minimal Pop', max_words_per_slide: 40, tone: 'energetic, modern, minimalist' },
    notebook: { name: 'Notebook Sketch', max_words_per_slide: 45, tone: 'personal, educational, handwritten-feel' },
    darkest: { name: 'Darkest Hour', max_words_per_slide: 50, tone: 'professional, elegant, cyberpunk' },
    aurora: { name: 'Aurora', max_words_per_slide: 45, tone: 'ethereal, modern, dreamy' },
    terminal: { name: 'Terminal', max_words_per_slide: 40, tone: 'technical, retro-computer, hacker' },
    editorial: { name: 'Editorial', max_words_per_slide: 45, tone: 'high-fashion, magazine, bold' },
    zen: { name: 'Zen', max_words_per_slide: 35, tone: 'minimalist, japanese, calm' },
    memphis: { name: 'Memphis', max_words_per_slide: 40, tone: '80s retro, playful, vibrant' },
    luxe: { name: 'Luxe', max_words_per_slide: 40, tone: 'premium, luxury, elegant' },
    // Режим с AI-аватарами - короткие тексты для overlay поверх изображений
    photo_mode: { name: 'AI Photo', max_words_per_slide: 25, tone: 'impactful, concise, visual-first' }
  };
  return presets[stylePreset] || presets.minimal_pop;
}

function buildSystemPrompt(designConfig, slideCount, toneGuidelines) {
  const toneSection = toneGuidelines ? `\nАДАПТИРУЙ ПОД СТИЛЬ:\n${toneGuidelines}\n` : '';

  return `Ты — топовый SMM-стратег. Создаёшь ВИРУСНЫЕ карусели для Instagram.

ДИЗАЙН: ${designConfig.name}
ТОН: ${designConfig.tone}
${toneSection}

ЗАДАЧА: Создай РОВНО ${slideCount} слайдов. Каждый: 25-${designConfig.max_words_per_slide} слов.

ЗАГОЛОВКИ (3-6 слов):
• Цифры: "5 ошибок", "3 способа"
• Шок: "99% делают неправильно"
• Боль: "Устал продавать?"

ТИПЫ СЛАЙДОВ:
1. HOOK: Зацепить внимание
2. STATEMENT: Факты и боль
3. LIST: Нумерованный список "1. Название: Описание"
4. CTA: Призыв к действию

OUTPUT ONLY JSON:
{
  "slides": [
    {"type": "hook", "title": "5 ошибок", "content": "Текст слайда...", "emphasize": ["ошибки"]}
  ]
}`;
}

module.exports = { generateCarouselContent };
