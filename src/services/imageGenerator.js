/**
 * Image Generator Service — Gemini 3 Pro Image (Nano Banana Pro)
 *
 * Генерация изображений через @google/genai SDK (ESM)
 * Модель: gemini-3-pro-image-preview
 * Качество: 2K (2048px)
 * Поддержка: до 5 reference фото людей
 * Стоимость: ~$0.04 за изображение
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const GOOGLE_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const IMAGE_MODEL = 'gemini-3-pro-image-preview';

const OUTPUT_DIR = path.join(__dirname, '../../output');

// Стили для генерации (визуал без текста!)
const STYLE_PROMPTS = {
  cartoon: {
    name: 'Мультяшный',
    prompt: `3D Pixar/Disney animation style illustration.
      Vibrant saturated colors, soft lighting, expressive cartoon features.
      The person transformed into an animated character while keeping recognizable face.
      Professional studio lighting, clean background with soft bokeh.`
  },
  realistic: {
    name: 'Реалистичный',
    prompt: `High-end professional photography, cinematic lighting.
      Magazine cover quality, natural skin tones, shallow depth of field.
      Professional studio setup, soft diffused lighting.
      Commercial advertising aesthetic.`
  }
};

// Соотношения сторон для разных форматов
const ASPECT_RATIOS = {
  portrait: '4:5',  // 1080x1350
  square: '1:1'     // 1080x1080
};

let genAI = null;

/**
 * Инициализация GoogleGenAI (dynamic import для ESM модуля)
 */
async function initGenAI() {
  if (!GOOGLE_API_KEY) return null;
  if (!genAI) {
    const { GoogleGenAI } = await import('@google/genai');
    genAI = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
  }
  return genAI;
}

/**
 * Скачать фото из Telegram и конвертировать в base64
 */
async function downloadTelegramPhoto(bot, fileId) {
  console.log('📥 Скачиваю фото из Telegram...');

  const fileLink = await bot.getFileLink(fileId);
  const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
  const base64 = Buffer.from(response.data).toString('base64');

  console.log('✅ Фото скачано и конвертировано в base64');
  return base64;
}

/**
 * Генерация одного изображения с reference photo
 * Использует Gemini 3 Pro Image (Nano Banana Pro)
 * ВАЖНО: Изображение генерируется БЕЗ текста - текст накладывается отдельно
 * @param {string} format - 'portrait' (4:5) или 'square' (1:1)
 */
async function generateImageWithReference(slideContent, referencePhotoBase64, style, slideNumber, totalSlides, format = 'portrait') {
  const ai = await initGenAI();
  if (!ai) throw new Error('Gemini не настроен');

  const styleConfig = STYLE_PROMPTS[style] || STYLE_PROMPTS.cartoon;
  const aspectRatio = ASPECT_RATIOS[format] || ASPECT_RATIOS.portrait;
  const aspectDescription = format === 'square' ? '1:1 square' : '4:5 portrait';

  console.log(`🎨 Генерация изображения ${slideNumber}/${totalSlides} (стиль: ${styleConfig.name}, формат: ${aspectDescription})...`);

  // Промпт с чеклистом и валидацией
  const prompt = `# Purpose
Create a high-quality image for use in a visual carousel, transforming the reference person into a specified visual style while meeting strict compositional and content constraints.

Begin with a concise checklist (3-7 bullets) of the core visual transformation and compositional steps before generating the image; keep items high-level.

## VISUAL STYLE
- Use: ${styleConfig.prompt}

## IMAGE FORMAT
- Aspect ratio: ${aspectDescription}

## COMPOSITION REQUIREMENTS
- Transform the individual from the reference photo into the given style.
- Ensure the face remains clearly recognizable and expressive.
- Use a confident, natural pose.
- Background should be clean and uncluttered, with a soft blur.
- Provide clear space for text overlay:
  - Top: 20% of the frame
  - Bottom: 25% of the frame
- Subject must be centered in the middle of the frame.
- Focus must be sharp on the face; ensure high image quality.

After creating the image, review it for compliance with all compositional and critical requirements. If any issue is detected, self-correct and repeat the process once to achieve validity.

## CRITICAL REQUIREMENTS (ABSOLUTE)
- ⛔ NO text of any kind.
- ⛔ NO letters, numbers, symbols, or typography.
- ⛔ NO captions, logos, watermarks, or UI elements.
- ⛔ NO text-like shapes or symbols.

> **If ANY text, letters, or text-like marks appear, the result is INVALID.**
> The image must be purely visual.`;

  try {
    const contents = [
      { text: prompt },
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: referencePhotoBase64
        }
      }
    ];

    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: contents,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: '2K'
        }
      }
    });

    // Проверяем ответ на наличие изображения
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          console.log(`✅ Изображение ${slideNumber} сгенерировано (2K качество)`);
          return part.inlineData.data;
        }
      }
    }

    console.log(`⚠️ Модель не вернула изображение для слайда ${slideNumber}`);
    return null;

  } catch (error) {
    console.error(`❌ Ошибка генерации изображения ${slideNumber}:`, error.message);
    // Если ошибка связана с моделью, попробуем fallback
    if (error.message.includes('not found') || error.message.includes('not supported')) {
      console.log(`🔄 Пробую fallback модель...`);
      return await generateImageWithReferenceFallback(slideContent, referencePhotoBase64, style, slideNumber, totalSlides, format);
    }
    return null;
  }
}

/**
 * Fallback на старую модель если gemini-3-pro-image-preview недоступна
 * @param {string} format - 'portrait' (4:5) или 'square' (1:1)
 */
async function generateImageWithReferenceFallback(slideContent, referencePhotoBase64, style, slideNumber, totalSlides, format = 'portrait') {
  const ai = await initGenAI();
  if (!ai) return null;

  const styleConfig = STYLE_PROMPTS[style] || STYLE_PROMPTS.cartoon;
  const aspectRatio = ASPECT_RATIOS[format] || ASPECT_RATIOS.portrait;
  const aspectDescription = format === 'square' ? '1:1 square' : '4:5 portrait';
  const FALLBACK_MODEL = 'gemini-2.0-flash-exp-image-generation';

  console.log(`🔄 Fallback: используем ${FALLBACK_MODEL} (формат: ${aspectDescription})`);

  const prompt = `Create an image (${aspectDescription} ratio).
Style: ${styleConfig.prompt}
Transform the person from reference photo into this style.
Keep face recognizable. Professional pose. Clean background with soft blur.
Leave 20% space at top and 25% at bottom for text overlay.
Center subject in frame. Sharp focus on face.
⛔ CRITICAL: ABSOLUTELY NO TEXT, LETTERS, NUMBERS OR TYPOGRAPHY IN THE IMAGE.
The image must be purely visual.`;

  try {
    const contents = [
      { text: prompt },
      { inlineData: { mimeType: 'image/jpeg', data: referencePhotoBase64 } }
    ];

    const response = await ai.models.generateContent({
      model: FALLBACK_MODEL,
      contents: contents,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: aspectRatio
        }
      }
    });

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          console.log(`✅ Fallback: изображение ${slideNumber} сгенерировано`);
          return part.inlineData.data;
        }
      }
    }
    return null;
  } catch (error) {
    console.error(`❌ Fallback ошибка:`, error.message);
    return null;
  }
}

/**
 * Генерация изображения без reference (только по тексту)
 * Используется как fallback когда reference photo не сработало
 * @param {string} format - 'portrait' (4:5) или 'square' (1:1)
 */
async function generateImageFromText(themeDescription, style, format = 'portrait') {
  const ai = await initGenAI();
  if (!ai) throw new Error('Gemini не настроен');

  const styleConfig = STYLE_PROMPTS[style] || STYLE_PROMPTS.cartoon;
  const aspectRatio = ASPECT_RATIOS[format] || ASPECT_RATIOS.portrait;
  const aspectDescription = format === 'square' ? '1:1 square' : '4:5 portrait';

  const fullPrompt = `Begin with a concise checklist (3-7 bullets) of the approach to creating the image; keep points conceptual rather than implementation-specific.

Create an abstract or conceptual image for a visual carousel.

VISUAL STYLE:
- Follow the provided style configuration: ${styleConfig.prompt}

IMAGE FORMAT:
- Aspect ratio: ${aspectDescription}

THEME:
- Develop a visual metaphor related to: "${themeDescription}"

GUIDELINES:
- Utilize symbolic shapes, colors, and mood
- Ensure a strong visual focus
- Maintain a clean composition
- Use a soft background
- Leave 20% of space at the TOP and 25% at the BOTTOM for future text overlay

CRITICAL REQUIREMENTS:
- ⛔ Absolutely NO text, letters, numbers, symbols, or any kind of typography
- ⛔ The image must be exclusively visual, with 100% non-textual elements only

After generating the image concept, validate that (1) the space allocation for future overlays is clearly visible, and (2) no typographic elements are present. If validation fails, revise the concept accordingly.`;

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: fullPrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: '2K'
        }
      }
    });

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('❌ Ошибка генерации изображения:', error.message);
    return null;
  }
}

/**
 * Генерация всех изображений для карусели
 * Использует Gemini 3 Pro Image для высокого качества
 * @param {string} format - 'portrait' (4:5) или 'square' (1:1)
 */
async function generateCarouselImages(carouselData, referencePhotoBase64, style, format = 'portrait') {
  const totalSlides = carouselData.slides.length;
  const aspectDescription = format === 'square' ? '1:1 квадрат' : '4:5 портрет';

  console.log(`🖼️ Начинаю генерацию ${totalSlides} изображений...`);
  console.log(`📸 Модель: ${IMAGE_MODEL} (2K качество)`);
  console.log(`📐 Формат: ${aspectDescription}`);
  console.log(`💰 Примерная стоимость: $${(totalSlides * 0.04).toFixed(2)}`);

  const images = [];

  for (let i = 0; i < totalSlides; i++) {
    const slide = carouselData.slides[i];

    try {
      // Пробуем сгенерировать с reference photo (включая fallback внутри)
      let imageBase64 = await generateImageWithReference(
        slide,
        referencePhotoBase64,
        style,
        i + 1,
        totalSlides,
        format
      );

      // Если всё ещё не получилось, пробуем без reference вообще
      if (!imageBase64) {
        console.log(`🔄 Fallback: генерация абстрактного визуала для слайда ${i + 1}`);
        imageBase64 = await generateImageFromText(
          slide.title || 'professional creative visual',
          style,
          format
        );
      }

      images.push(imageBase64);

      // Задержка между запросами для избежания rate limit
      if (i < totalSlides - 1) {
        await new Promise(r => setTimeout(r, 2000)); // Увеличили до 2 сек для стабильности
      }

    } catch (error) {
      console.error(`❌ Ошибка на слайде ${i + 1}:`, error.message);
      images.push(null);
    }
  }

  const successCount = images.filter(img => img !== null).length;
  console.log(`✅ Сгенерировано ${successCount}/${totalSlides} изображений`);

  return images;
}

/**
 * Сохранить base64 изображение в файл
 */
function saveBase64Image(base64Data, filename) {
  const filePath = path.join(OUTPUT_DIR, filename);
  const buffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

module.exports = {
  generateImageWithReference,
  generateImageFromText,
  generateCarouselImages,
  downloadTelegramPhoto,
  saveBase64Image,
  STYLE_PROMPTS
};
