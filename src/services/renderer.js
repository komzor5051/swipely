const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../../output');
const TEMPLATES_DIR = path.join(__dirname, '../templates');

// Убедимся что директория существует
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Рендеринг слайдов в изображения
 */
async function renderSlides(carouselData, stylePreset) {
  console.log(`🎨 Рендеринг ${carouselData.slides?.length || 0} слайдов (стиль: ${stylePreset})...`);

  if (!carouselData.slides || carouselData.slides.length === 0) {
    throw new Error('Нет слайдов для рендеринга');
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const imagePaths = [];

  try {
    for (let i = 0; i < carouselData.slides.length; i++) {
      const slide = carouselData.slides[i];
      const slideNumber = i + 1;
      const totalSlides = carouselData.slides.length;

      console.log(`📄 Рендеринг слайда ${slideNumber}/${totalSlides}...`);

      // Генерируем HTML для слайда
      const html = generateSlideHTML(slide, slideNumber, totalSlides, stylePreset);

      // Рендерим в изображение
      const page = await browser.newPage();

      // Устанавливаем размер страницы (Instagram 1080x1350)
      await page.setViewport({
        width: 1080,
        height: 1350,
        deviceScaleFactor: 2 // Для высокого качества
      });

      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Путь для сохранения
      const imagePath = path.join(OUTPUT_DIR, `slide_${Date.now()}_${slideNumber}.png`);

      // Делаем скриншот
      await page.screenshot({
        path: imagePath,
        type: 'png',
        fullPage: false
      });

      await page.close();

      imagePaths.push(imagePath);

      console.log(`✅ Слайд ${slideNumber} сохранён: ${imagePath}`);
    }

    console.log(`✅ Все слайды отрендерены: ${imagePaths.length} файлов`);

    return imagePaths;

  } catch (error) {
    console.error('❌ Ошибка рендеринга:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Генерация HTML для слайда
 */
function generateSlideHTML(slide, slideNumber, totalSlides, stylePreset) {
  // Загружаем шаблон в зависимости от пресета
  let templatePath;

  switch (stylePreset) {
    case 'minimal_pop':
      templatePath = path.join(TEMPLATES_DIR, 'minimal_pop.html');
      break;
    case 'notebook':
      templatePath = path.join(TEMPLATES_DIR, 'notebook.html');
      break;
    case 'darkest':
      templatePath = path.join(TEMPLATES_DIR, 'darkest.html');
      break;
    case 'aurora':
      templatePath = path.join(TEMPLATES_DIR, 'aurora.html');
      break;
    case 'terminal':
      templatePath = path.join(TEMPLATES_DIR, 'terminal.html');
      break;
    case 'editorial':
      templatePath = path.join(TEMPLATES_DIR, 'editorial.html');
      break;
    case 'zen':
      templatePath = path.join(TEMPLATES_DIR, 'zen.html');
      break;
    case 'memphis':
      templatePath = path.join(TEMPLATES_DIR, 'memphis.html');
      break;
    case 'luxe':
      templatePath = path.join(TEMPLATES_DIR, 'luxe.html');
      break;
    default:
      templatePath = path.join(TEMPLATES_DIR, 'minimal_pop.html');
  }

  // Если шаблон не существует, создаём базовый HTML
  let template;

  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    console.warn(`⚠️ Шаблон ${templatePath} не найден, используем встроенный`);
    template = getDefaultTemplate(stylePreset);
  }

  // Заменяем плейсхолдеры
  let html = template
    .replace(/\{\{SLIDE_NUMBER\}\}/g, slideNumber)
    .replace(/\{\{TOTAL_SLIDES\}\}/g, totalSlides)
    .replace(/\{\{TITLE\}\}/g, slide.title || '')
    .replace(/\{\{CONTENT\}\}/g, slide.content || '')
    .replace(/\{\{TYPE\}\}/g, slide.type || 'statement');

  // Обработка выделенных слов (emphasize)
  if (slide.emphasize && slide.emphasize.length > 0) {
    slide.emphasize.forEach(word => {
      const regex = new RegExp(`\\b(${word})\\b`, 'gi');
      html = html.replace(regex, '<span class="accent">$1</span>');
    });
  }

  return html;
}

/**
 * Получение встроенного шаблона если файл не найден
 */
function getDefaultTemplate(stylePreset) {
  if (stylePreset === 'minimal_pop') {
    return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1080, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      width: 1080px;
      height: 1350px;
      background: #FFFFFF;
      font-family: 'Roboto', 'Inter', sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      padding: 80px 60px;
      position: relative;
    }

    .headline {
      font-size: 70px;
      font-weight: 300;
      line-height: 1.15;
      color: #000000;
      max-width: 900px;
      margin-bottom: 40px;
    }

    .content {
      font-size: 26px;
      font-weight: 400;
      line-height: 1.4;
      color: #000000;
      max-width: 900px;
    }

    .accent {
      background: #FF0080;
      color: #FFFFFF;
      padding: 8px 15px;
      font-weight: 700;
      display: inline-block;
    }

    .decorative-circle {
      position: absolute;
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: #00BCD4;
      bottom: 60px;
      right: 60px;
    }

    .slide-counter {
      position: absolute;
      top: 40px;
      right: 60px;
      font-size: 14px;
      color: #999999;
      font-weight: 400;
    }
  </style>
</head>
<body>
  <div class="slide-counter">{{SLIDE_NUMBER}}/{{TOTAL_SLIDES}}</div>
  <h1 class="headline">{{TITLE}}</h1>
  <p class="content">{{CONTENT}}</p>
  <div class="decorative-circle"></div>
</body>
</html>
    `;
  }

  // Базовый шаблон для других стилей
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      width: 1080px;
      height: 1350px;
      background: #000000;
      color: #FFFFFF;
      font-family: Arial, sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 80px;
    }
    h1 { font-size: 60px; margin-bottom: 30px; }
    p { font-size: 24px; line-height: 1.5; }
  </style>
</head>
<body>
  <h1>{{TITLE}}</h1>
  <p>{{CONTENT}}</p>
  <div style="position: absolute; top: 40px; right: 80px; font-size: 14px;">
    {{SLIDE_NUMBER}}/{{TOTAL_SLIDES}}
  </div>
</body>
</html>
  `;
}

/**
 * Рендеринг слайдов с AI-сгенерированными фоновыми изображениями
 * Накладывает текст поверх изображений
 */
async function renderSlidesWithImages(carouselData, imageBase64Array) {
  console.log(`🎨 Рендеринг ${carouselData.slides.length} слайдов с AI-изображениями...`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const imagePaths = [];

  try {
    for (let i = 0; i < carouselData.slides.length; i++) {
      const slide = carouselData.slides[i];
      const imageBase64 = imageBase64Array[i];
      const slideNumber = i + 1;
      const totalSlides = carouselData.slides.length;

      console.log(`📄 Рендеринг слайда с фото ${slideNumber}/${totalSlides}...`);

      // Генерируем HTML с фоновым изображением
      const html = generatePhotoSlideHTML(slide, slideNumber, totalSlides, imageBase64);

      const page = await browser.newPage();

      await page.setViewport({
        width: 1080,
        height: 1350,
        deviceScaleFactor: 2
      });

      await page.setContent(html, { waitUntil: 'networkidle0' });

      const imagePath = path.join(OUTPUT_DIR, `slide_photo_${Date.now()}_${slideNumber}.png`);

      await page.screenshot({
        path: imagePath,
        type: 'png',
        fullPage: false
      });

      await page.close();
      imagePaths.push(imagePath);

      console.log(`✅ Слайд с фото ${slideNumber} сохранён`);
    }

    console.log(`✅ Все слайды с фото отрендерены: ${imagePaths.length} файлов`);
    return imagePaths;

  } catch (error) {
    console.error('❌ Ошибка рендеринга слайдов с фото:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Генерация HTML для слайда с AI-изображением на фоне
 * Текст накладывается поверх изображения с улучшенной читаемостью
 */
function generatePhotoSlideHTML(slide, slideNumber, totalSlides, imageBase64) {
  // Если изображение null, используем градиентный фон
  const backgroundStyle = imageBase64
    ? `background-image: url('data:image/png;base64,${imageBase64}'); background-size: cover; background-position: center;`
    : `background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);`;

  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1080, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700;900&family=Inter:wght@600;800&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      width: 1080px;
      height: 1350px;
      font-family: 'Montserrat', sans-serif;
      position: relative;
      overflow: hidden;
    }

    .background-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      ${backgroundStyle}
    }

    /* Улучшенный градиент для читаемости текста */
    .gradient-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        to bottom,
        rgba(0,0,0,0.75) 0%,
        rgba(0,0,0,0.3) 20%,
        rgba(0,0,0,0.05) 35%,
        rgba(0,0,0,0.05) 60%,
        rgba(0,0,0,0.4) 75%,
        rgba(0,0,0,0.85) 100%
      );
    }

    .content-wrapper {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 50px 55px;
    }

    .top-section {
      padding-top: 20px;
    }

    .headline {
      font-family: 'Montserrat', sans-serif;
      font-size: 52px;
      font-weight: 900;
      color: #FFFFFF;
      line-height: 1.1;
      text-transform: uppercase;
      letter-spacing: -1px;
      max-width: 85%;
      /* Улучшенная тень для читаемости на любом фоне */
      text-shadow:
        0 2px 4px rgba(0,0,0,0.8),
        0 4px 20px rgba(0,0,0,0.6),
        0 8px 40px rgba(0,0,0,0.4);
    }

    .bottom-section {
      margin-top: auto;
      padding-bottom: 20px;
    }

    .content {
      font-family: 'Inter', sans-serif;
      font-size: 26px;
      font-weight: 600;
      color: #FFFFFF;
      line-height: 1.45;
      max-width: 90%;
      text-shadow:
        0 1px 3px rgba(0,0,0,0.8),
        0 3px 15px rgba(0,0,0,0.5);
    }

    .slide-counter {
      position: absolute;
      top: 50px;
      right: 55px;
      font-family: 'Montserrat', sans-serif;
      font-size: 22px;
      font-weight: 700;
      color: rgba(255,255,255,0.95);
      text-shadow:
        0 2px 8px rgba(0,0,0,0.8),
        0 4px 20px rgba(0,0,0,0.5);
      /* Тонкая подложка для лучшей видимости */
      background: rgba(0,0,0,0.25);
      padding: 8px 16px;
      border-radius: 20px;
      backdrop-filter: blur(4px);
    }

    .accent {
      color: #FFD93D;
      text-shadow:
        0 2px 4px rgba(0,0,0,0.9),
        0 4px 20px rgba(255,217,61,0.3);
    }
  </style>
</head>
<body>
  <div class="background-image"></div>
  <div class="gradient-overlay"></div>

  <div class="content-wrapper">
    <div class="top-section">
      <h1 class="headline">${slide.title || ''}</h1>
    </div>
    <div class="bottom-section">
      <p class="content">${slide.content || ''}</p>
    </div>
  </div>

  <div class="slide-counter">${slideNumber}/${totalSlides}</div>
</body>
</html>
  `;
}

module.exports = {
  renderSlides,
  renderSlidesWithImages
};
