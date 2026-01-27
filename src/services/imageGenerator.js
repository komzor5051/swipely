/**
 * Image Generator Service — Gemini 2.5 Flash Image (Nano Banana)
 *
 * Генерация изображений через новый @google/genai SDK
 * Модель: gemini-2.5-flash-preview-05-20 (с поддержкой image generation)
 * Стоимость: ~$0.039 за изображение
 */

const { GoogleGenAI } = require('@google/genai');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const GOOGLE_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const IMAGE_MODEL = 'gemini-2.0-flash-exp-image-generation';

const OUTPUT_DIR = path.join(__dirname, '../../output');

// Стили для генерации
const STYLE_PROMPTS = {
  cartoon: {
    name: 'Мультяшный',
    prompt: `Vibrant cartoon illustration style, similar to Pixar or Disney animation.
      Bold colors, clean lines, expressive features, playful and engaging.
      The person should look like an animated character version of themselves.`
  },
  realistic: {
    name: 'Реалистичный',
    prompt: `Professional photography style with cinematic lighting.
      High-end commercial photography look, natural skin tones,
      shallow depth of field effect, professional studio quality.`
  }
};

let genAI = null;

function initGenAI() {
  if (!GOOGLE_API_KEY) return null;
  if (!genAI) {
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
 */
async function generateImageWithReference(slideContent, referencePhotoBase64, style, slideNumber, totalSlides) {
  const ai = initGenAI();
  if (!ai) throw new Error('Gemini не настроен');

  const styleConfig = STYLE_PROMPTS[style] || STYLE_PROMPTS.cartoon;

  console.log(`🎨 Генерация изображения ${slideNumber}/${totalSlides} (стиль: ${styleConfig.name})...`);

  const prompt = `Generate an Instagram carousel slide image in portrait orientation (4:5 aspect ratio).

STYLE: ${styleConfig.prompt}

SLIDE CONTENT:
- Title: "${slideContent.title}"
- Message: "${slideContent.content}"
- This is slide ${slideNumber} of ${totalSlides}

REQUIREMENTS:
1. Use the person from the reference photo as the main subject
2. Transform them into the specified style while keeping recognizable features
3. Create a scene that matches the slide content/message
4. Portrait orientation for Instagram (1080x1350)
5. Leave space at top and bottom for text overlay
6. Make it visually engaging and professional
7. The person should be in a relevant pose or setting

DO NOT include any text in the image - text will be added separately.`;

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
        responseModalities: ['TEXT', 'IMAGE']
      }
    });

    // Проверяем ответ на наличие изображения
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          console.log(`✅ Изображение ${slideNumber} сгенерировано`);
          return part.inlineData.data;
        }
      }
    }

    console.log(`⚠️ Модель не вернула изображение для слайда ${slideNumber}`);
    return null;

  } catch (error) {
    console.error(`❌ Ошибка генерации изображения ${slideNumber}:`, error.message);
    return null;
  }
}

/**
 * Генерация изображения без reference (только по тексту)
 */
async function generateImageFromText(prompt, style) {
  const ai = initGenAI();
  if (!ai) throw new Error('Gemini не настроен');

  const styleConfig = STYLE_PROMPTS[style] || STYLE_PROMPTS.cartoon;

  const fullPrompt = `Generate an Instagram carousel slide image in portrait orientation (4:5).

STYLE: ${styleConfig.prompt}

CONTENT: ${prompt}

Create a visually engaging, professional image.
Leave space for text overlay at top and bottom.
NO text in the image.`;

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: fullPrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE']
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
 */
async function generateCarouselImages(carouselData, referencePhotoBase64, style) {
  console.log(`🖼️ Начинаю генерацию ${carouselData.slides.length} изображений...`);
  console.log(`💰 Примерная стоимость: $${(carouselData.slides.length * 0.039).toFixed(2)}`);

  const images = [];
  const totalSlides = carouselData.slides.length;

  for (let i = 0; i < totalSlides; i++) {
    const slide = carouselData.slides[i];

    try {
      // Пробуем сгенерировать с reference photo
      let imageBase64 = await generateImageWithReference(
        slide,
        referencePhotoBase64,
        style,
        i + 1,
        totalSlides
      );

      // Если не получилось, пробуем без reference
      if (!imageBase64) {
        console.log(`🔄 Fallback: генерация без reference для слайда ${i + 1}`);
        imageBase64 = await generateImageFromText(
          `${slide.title}. ${slide.content}`,
          style
        );
      }

      images.push(imageBase64);

      // Задержка между запросами для избежания rate limit
      if (i < totalSlides - 1) {
        await new Promise(r => setTimeout(r, 1500));
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
