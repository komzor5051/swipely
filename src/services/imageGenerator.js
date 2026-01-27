/**
 * Image Generator Service — Gemini 2.5 Flash Image (Nano Banana)
 *
 * Генерация изображений с reference photo пользователя
 * Стоимость: ~$0.039 за изображение
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const GOOGLE_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const IMAGE_MODEL = 'gemini-2.0-flash-exp'; // Модель с поддержкой генерации изображений

const OUTPUT_DIR = path.join(__dirname, '../../output');

// Стили для генерации
const STYLE_PROMPTS = {
  cartoon: {
    name: 'Мультяшный',
    prompt: `Create in vibrant cartoon illustration style, similar to Pixar or Disney animation.
      Bold colors, clean lines, expressive features, playful and engaging.
      The person should look like an animated character version of themselves.`
  },
  realistic: {
    name: 'Реалистичный',
    prompt: `Create in professional photography style with cinematic lighting.
      High-end commercial photography look, natural skin tones,
      shallow depth of field effect, professional studio quality.`
  }
};

let genAI = null;

function initGenAI() {
  if (!GOOGLE_API_KEY) return null;
  if (!genAI) {
    genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
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

  // Модель для генерации изображений
  const model = ai.getGenerativeModel({
    model: IMAGE_MODEL,
    generationConfig: {
      temperature: 1,
      topP: 0.95,
      topK: 40,
    }
  });

  const prompt = `Generate an Instagram carousel slide image.

STYLE: ${styleConfig.prompt}

SLIDE CONTENT:
- Title: "${slideContent.title}"
- Message: "${slideContent.content}"
- This is slide ${slideNumber} of ${totalSlides}

REQUIREMENTS:
1. Use the person from the reference photo as the main subject
2. Transform them into the specified style while keeping recognizable features
3. Create a scene that matches the slide content/message
4. Portrait orientation (4:5 aspect ratio for Instagram)
5. Leave space at top for title text and bottom for content text
6. Make it visually engaging and professional
7. The person should be in a relevant pose or setting for the content

DO NOT include any text in the image - text will be added later.`;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: referencePhotoBase64
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();

    // Gemini 2.0 Flash Exp может не поддерживать генерацию изображений напрямую
    // В этом случае используем альтернативный подход
    console.log('📝 Ответ модели получен');

    // Проверяем есть ли изображение в ответе
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          console.log('✅ Изображение сгенерировано');
          return part.inlineData.data;
        }
      }
    }

    // Если изображения нет, возвращаем null (будем использовать fallback)
    console.log('⚠️ Модель не вернула изображение');
    return null;

  } catch (error) {
    console.error('❌ Ошибка генерации изображения:', error.message);
    throw error;
  }
}

/**
 * Генерация изображения без reference (только по тексту)
 */
async function generateImageFromText(prompt, style) {
  const ai = initGenAI();
  if (!ai) throw new Error('Gemini не настроен');

  const styleConfig = STYLE_PROMPTS[style] || STYLE_PROMPTS.cartoon;

  const model = ai.getGenerativeModel({
    model: IMAGE_MODEL,
    generationConfig: {
      temperature: 1,
      topP: 0.95,
    }
  });

  const fullPrompt = `Generate an image for Instagram carousel.

STYLE: ${styleConfig.prompt}

CONTENT: ${prompt}

Create a visually engaging, professional image in portrait orientation (4:5).
Leave space for text overlay at top and bottom.
NO text in the image.`;

  try {
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;

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
    throw error;
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
      const imageBase64 = await generateImageWithReference(
        slide,
        referencePhotoBase64,
        style,
        i + 1,
        totalSlides
      );

      if (imageBase64) {
        images.push(imageBase64);
      } else {
        // Fallback: генерируем без reference
        console.log(`🔄 Fallback: генерация без reference для слайда ${i + 1}`);
        const fallbackImage = await generateImageFromText(
          `${slide.title}. ${slide.content}`,
          style
        );
        images.push(fallbackImage);
      }

      // Задержка между запросами для избежания rate limit
      if (i < totalSlides - 1) {
        await new Promise(r => setTimeout(r, 1000));
      }

    } catch (error) {
      console.error(`❌ Ошибка на слайде ${i + 1}:`, error.message);
      // Добавляем null, чтобы не прерывать процесс
      images.push(null);
    }
  }

  console.log(`✅ Сгенерировано ${images.filter(img => img !== null).length}/${totalSlides} изображений`);
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
