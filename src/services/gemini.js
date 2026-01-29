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
  const userPrompt = `Создай вирусную визуальную карусель на основе текста ниже.

Условия:
• адаптируй под формат изображений
• усили боль, выгоду или контраст
• сократи сложные формулировки
• думай как человек, который скроллит ленту

Исходный текст:
"${userText}"`;

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

  // Очистка markdown и форматирование списков
  if (carouselData.slides) {
    carouselData.slides = carouselData.slides.map(slide => ({
      ...slide,
      title: cleanMarkdown(slide.title),
      content: formatSlideContent(cleanMarkdown(slide.content))
    }));
  }

  console.log(`✅ Сгенерировано ${carouselData.slides?.length || 0} слайдов`);

  return carouselData;
}

/**
 * Очистка текста от markdown-разметки
 */
function cleanMarkdown(text) {
  if (!text) return text;

  return text
    // Убираем жирный текст **text** и __text__
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    // Убираем курсив *text* и _text_
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Убираем зачёркнутый ~~text~~
    .replace(/~~([^~]+)~~/g, '$1')
    // Убираем заголовки # ## ###
    .replace(/^#{1,6}\s*/gm, '')
    // Убираем буллеты - и *
    .replace(/^[\-\*]\s+/gm, '')
    // Убираем инлайн-код `code`
    .replace(/`([^`]+)`/g, '$1')
    // Убираем ссылки [text](url)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Убираем лишние пробелы
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Форматирование контента слайда
 * Разбивает списки вида "1. текст 2. текст" на отдельные строки
 */
function formatSlideContent(text) {
  if (!text) return text;

  // Проверяем, есть ли нумерованный список в одну строку (1. ... 2. ... 3. ...)
  const hasInlineList = /\d+\.\s+[^0-9]+\d+\.\s+/.test(text);

  if (hasInlineList) {
    // Разбиваем по паттерну "цифра. " (но не в начале строки)
    // Сначала добавляем разделитель перед каждым номером (кроме первого)
    let formatted = text.replace(/\s+(\d+)\.\s+/g, '\n$1. ');

    // Разбиваем на строки и обрабатываем каждую
    const lines = formatted.split('\n').map(line => line.trim()).filter(line => line);

    // Убираем номера и форматируем
    const cleanLines = lines.map(line => {
      // Убираем номер в начале строки "1. текст" -> "текст"
      const withoutNumber = line.replace(/^\d+\.\s*/, '');
      // Первая буква — заглавная
      return withoutNumber.charAt(0).toLowerCase() === withoutNumber.charAt(0)
        ? withoutNumber.charAt(0).toUpperCase() + withoutNumber.slice(1)
        : withoutNumber;
    });

    return cleanLines.join('\n\n');
  }

  return text;
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
  const toneSection = toneGuidelines ? `\nАДАПТИРУЙ ПОД СТИЛЬ АВТОРА:\n${toneGuidelines}\n` : '';

  return `# Viral Visual Carousel SMM Content Architecture (RU)

Ты — элитный SMM-стратег и контент-архитектор. Ты создаёшь ВИРУСНЫЕ визуальные карусели для любых платформ с изображениями.

ТВОЙ ОБРАЗ МЫШЛЕНИЯ: Ты думаешь как пользователь, который бесконечно листает ленту. Задача — остановить скролл за 0.5 секунды и удержать внимание до конца.

ГЛАВНАЯ ЦЕЛЬ: Максимальное удержание, сохранения и дочитывание карусели.

КОНТЕКСТ:
• ДИЗАЙН: ${designConfig.name}
• ТОН: ${designConfig.tone}
${toneSection}

ПОВЕДЕНЧЕСКАЯ ЛОГИКА:
• Пользователь сканирует, а не читает
• Если мысль не ясна сразу — слайд пролистывают
• Каждый следующий слайд обязан усиливать интерес

ЗАДАЧА: Создай РОВНО ${slideCount} слайдов. Каждый слайд — одна уникальная мысль. Запрещено повторять идеи, формулировки или примеры.

ОГРАНИЧЕНИЯ ПО ТЕКСТУ:
• content: 25–${designConfig.max_words_per_slide} слов
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

ФОРМАТ LIST:
"1. Название: кратко и ясно. 2. Название: кратко и ясно."

OUTPUT: Верни ТОЛЬКО валидный JSON строго по схеме ниже. Без пояснений, комментариев и лишнего текста.

{
  "slides": [
    {
      "type": "hook",
      "title": "Заголовок",
      "content": "Текст слайда",
      "emphasize": ["ключ"]
    }
  ]
}`;
}

module.exports = { generateCarouselContent };
