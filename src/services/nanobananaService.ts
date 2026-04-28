import type { CharacterScene } from '../types';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const NANOBANANA_MODEL = 'google/gemini-3-pro-image-preview';

// Retry settings
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000; // 2 seconds
const REQUEST_DELAY = 1000; // 1 second delay between requests to avoid rate limiting

/**
 * Sleep helper function
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Генерирует изображение персонажа для слайда карусели используя Gemini 3 Pro Image Preview через OpenRouter
 * С автоматическими повторными попытками при ошибках
 *
 * @param referenceImage - Base64 encoded reference image of the character
 * @param scene - Scene description with pose, emotion, and setting
 * @param retryCount - Internal retry counter
 * @returns Base64 encoded generated image (data URL)
 */
export async function generateCharacterImage(
  referenceImage: string,
  scene: CharacterScene,
  retryCount: number = 0
): Promise<string> {
  console.log(`🎨 Генерация изображения для слайда ${scene.slideNumber}...${retryCount > 0 ? ` (попытка ${retryCount + 1}/${MAX_RETRIES})` : ''}`);

  if (!OPENROUTER_API_KEY) {
    throw new Error('❌ VITE_OPENROUTER_API_KEY не настроен в .env.local');
  }

  // Add delay between requests to avoid rate limiting (except for first request)
  if (scene.slideNumber > 1 && retryCount === 0) {
    console.log(`⏳ Задержка ${REQUEST_DELAY}ms перед запросом...`);
    await sleep(REQUEST_DELAY);
  }

  try {
    const prompt = buildImagePrompt(scene);

    console.log(`📝 Промпт: ${prompt}`);

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://swipely.ai',
        'X-Title': 'Swipely.ai - Visual Storytelling'
      },
      body: JSON.stringify({
        model: NANOBANANA_MODEL,
        modalities: ['image', 'text'], // CRITICAL: Enable image generation (image first!)
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: referenceImage.startsWith('data:')
                    ? referenceImage
                    : `data:image/jpeg;base64,${referenceImage}`
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ],
        // Настройки для квадратного формата Instagram (540x540)
        image_config: {
          aspect_ratio: '1:1',
          image_size: '2K'
        },
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Ошибка OpenRouter API:', errorData);
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    console.log('📦 ПОЛНЫЙ ОТВЕТ ОТ NANO BANANA PRO:');
    console.log(JSON.stringify(data, null, 2));
    console.log('📦 Ключи верхнего уровня:', Object.keys(data));
    if (data.choices && data.choices[0]) {
      console.log('📦 Ключи choices[0]:', Object.keys(data.choices[0]));
      console.log('📦 Ключи choices[0].message:', data.choices[0].message ? Object.keys(data.choices[0].message) : 'НЕТ');
      if (data.choices[0].message?.images) {
        console.log('📦 message.images найден! Длина массива:', data.choices[0].message.images.length);
        console.log('📦 message.images[0]:', JSON.stringify(data.choices[0].message.images[0], null, 2));
      }
    }

    // Gemini 2.5 Flash Image возвращает изображение в content[0].image_url или в виде base64
    const generatedImage = extractImageFromResponse(data);

    if (!generatedImage) {
      console.error('❌ ИЗОБРАЖЕНИЕ НЕ НАЙДЕНО В ОТВЕТЕ!');
      console.error('❌ Полная структура ответа:', JSON.stringify(data, null, 2));
      throw new Error('Generated image not found in response');
    }

    console.log(`✅ Изображение для слайда ${scene.slideNumber} сгенерировано`);

    return generatedImage;
  } catch (error) {
    console.error(`❌ Ошибка генерации изображения для слайда ${scene.slideNumber}:`, error);
    throw error;
  }
}

/**
 * Создает промпт для генерации изображения персонажа
 * Оптимизирован для быстрой обработки без потери качества
 */
function buildImagePrompt(scene: CharacterScene): string {
  const baseInstructions = `
Instagram carousel: Match reference person exactly - same face, hair, features.

Slide ${scene.slideNumber}: ${scene.pose}, ${scene.emotion}
Setting: ${scene.setting}
Context: ${scene.prompt}

Style: Studio photography, cinematic lighting, modern aesthetic with 3D floating elements (spheres, shapes). Palette: blues, coral, pastels. Character dominates frame.
`.trim();

  return baseInstructions;
}

/**
 * Извлекает изображение из ответа Gemini 3 Pro Image Preview API
 * Gemini возвращает изображения как base64-encoded data URLs в message.images array
 */
function extractImageFromResponse(data: any): string | null {
  try {
    console.log('📦 Структура ответа:', JSON.stringify(data, null, 2));

    // Проверяем разные возможные форматы ответа
    if (data.choices && data.choices[0]) {
      const choice = data.choices[0];

      // Формат 1: message.images[0].image_url.url (основной формат для Gemini через OpenRouter)
      if (choice.message?.images && Array.isArray(choice.message.images)) {
        if (choice.message.images[0]) {
          const imageData = choice.message.images[0];

          // Проверяем формат OpenRouter: {type: "image_url", image_url: {url: "..."}}
          if (imageData.image_url?.url) {
            console.log('✅ Изображение найдено в message.images[0].image_url.url');
            return imageData.image_url.url;
          }

          // Альтернативный формат: прямая строка или объект с url
          const imageUrl = typeof imageData === 'string'
            ? imageData
            : imageData.url;

          if (imageUrl) {
            console.log('✅ Изображение найдено в message.images[0]');
            return imageUrl;
          }
        }
      }

      // Формат 2: message.content[0].image_url
      if (choice.message?.content && Array.isArray(choice.message.content)) {
        const imageContent = choice.message.content.find((c: any) => c.type === 'image_url');
        if (imageContent?.image_url?.url) {
          console.log('✅ Изображение найдено в message.content[].image_url');
          return imageContent.image_url.url;
        }
      }

      // Формат 3: message.content (строка с base64)
      if (typeof choice.message?.content === 'string') {
        const content = choice.message.content;
        if (content.startsWith('data:image')) {
          console.log('✅ Изображение найдено в message.content (data URL)');
          return content;
        }
        // Если это просто base64 без префикса
        if (isBase64(content)) {
          console.log('✅ Изображение найдено в message.content (base64)');
          return `data:image/png;base64,${content}`;
        }
      }
    }

    // Формат 4: data.image или data.images[0]
    if (data.image) {
      console.log('✅ Изображение найдено в data.image');
      return typeof data.image === 'string'
        ? data.image
        : data.image.url || data.image.data;
    }

    if (data.images && data.images[0]) {
      console.log('✅ Изображение найдено в data.images[0]');
      return typeof data.images[0] === 'string'
        ? data.images[0]
        : data.images[0].url || data.images[0].data;
    }

    console.error('❌ Изображение не найдено ни в одном известном формате');
    return null;
  } catch (error) {
    console.error('❌ Ошибка извлечения изображения:', error);
    return null;
  }
}

/**
 * Проверяет, является ли строка валидным base64
 */
function isBase64(str: string): boolean {
  if (!str || str.length < 100) return false; // Изображение должно быть достаточно большим
  try {
    return btoa(atob(str)) === str;
  } catch {
    return false;
  }
}

/**
 * Генерирует массив описаний сцен для всех слайдов карусели
 * Используется AI для создания консистентных описаний
 */
export async function generateSceneDescriptions(
  topic: string,
  slideCount: number,
  slideTitles: string[]
): Promise<CharacterScene[]> {
  console.log(`🎬 Генерация описаний сцен для ${slideCount} слайдов...`);

  if (!OPENROUTER_API_KEY) {
    throw new Error('❌ VITE_OPENROUTER_API_KEY не настроен');
  }

  const prompt = `
Topic: "${topic}"
Slides: ${slideCount}

${slideTitles.map((title, i) => `${i + 1}. ${title}`).join('\n')}

Create scene for each slide (pose, emotion, setting matching content).

JSON format:
[
  {
    "slideNumber": 1,
    "prompt": "image description",
    "pose": "presenting with open hands",
    "emotion": "confident",
    "setting": "studio with 3D icons"
  }
]

Requirements: diverse poses/settings, Instagram-ready, consistent character.
Return ONLY JSON array.
`.trim();

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://swipely.ai',
        'X-Title': 'Swipely.ai - Scene Generation'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-haiku', // Используем Claude для текстовой генерации
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`Scene generation failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';

    // Извлекаем JSON из ответа (может быть обернут в ```json```)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Invalid scene descriptions format');
    }

    const scenes: CharacterScene[] = JSON.parse(jsonMatch[0]);

    console.log(`✅ Сгенерировано ${scenes.length} описаний сцен`);

    return scenes;
  } catch (error) {
    console.error('❌ Ошибка генерации описаний сцен:', error);
    throw error;
  }
}
