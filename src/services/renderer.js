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
 * PREMIUM fallback с крупной типографикой
 */
function getDefaultTemplate(stylePreset) {
  // Universal premium fallback template
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1080, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=Manrope:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      width: 1080px;
      height: 1350px;
      background: #0A0A0A;
      font-family: 'Manrope', sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 100px 90px;
      position: relative;
      overflow: hidden;
    }

    /* Gradient accent */
    .accent-bar {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 8px;
      background: linear-gradient(90deg, #FF2D6A 0%, #FF6B35 50%, #FFD93D 100%);
    }

    .slide-counter {
      position: absolute;
      top: 70px;
      right: 90px;
      font-family: 'Unbounded', sans-serif;
      font-size: 48px;
      font-weight: 900;
      color: #FFFFFF;
      opacity: 0.15;
    }

    .content-wrapper {
      position: relative;
      z-index: 5;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .headline {
      font-family: 'Unbounded', sans-serif;
      font-size: 82px;
      font-weight: 900;
      line-height: 1.0;
      color: #FFFFFF;
      margin-bottom: 50px;
      text-transform: uppercase;
      letter-spacing: -2px;
      max-width: 900px;
    }

    .content {
      font-family: 'Manrope', sans-serif;
      font-size: 34px;
      font-weight: 500;
      line-height: 1.6;
      color: #FFFFFF;
      max-width: 850px;
      opacity: 0.85;
    }

    .accent {
      background: linear-gradient(135deg, #FF2D6A 0%, #FF6B35 100%);
      color: white;
      padding: 6px 16px;
      font-weight: 700;
      border-radius: 4px;
      display: inline-block;
    }

    /* Decorative circle */
    .deco-circle {
      position: absolute;
      bottom: 100px;
      right: 100px;
      width: 120px;
      height: 120px;
      border: 4px solid rgba(255,255,255,0.1);
      border-radius: 50%;
    }
  </style>
</head>
<body>
  <div class="accent-bar"></div>
  <div class="slide-counter">{{SLIDE_NUMBER}}</div>

  <div class="content-wrapper">
    <h1 class="headline">{{TITLE}}</h1>
    <p class="content">{{CONTENT}}</p>
  </div>

  <div class="deco-circle"></div>
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
 * PREMIUM Typography System — крупный, читаемый текст с динамическим масштабированием
 */
function generatePhotoSlideHTML(slide, slideNumber, totalSlides, imageBase64) {
  // Если изображение null, используем градиентный фон
  const backgroundStyle = imageBase64
    ? `background-image: url('data:image/png;base64,${imageBase64}'); background-size: cover; background-position: center;`
    : `background: linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);`;

  // Определяем длину текста для адаптивного размера
  const titleLength = (slide.title || '').length;
  const contentLength = (slide.content || '').length;

  // Адаптивные размеры заголовка (больше = меньше шрифт)
  let titleSize = 72; // базовый размер
  if (titleLength <= 20) titleSize = 96;
  else if (titleLength <= 35) titleSize = 80;
  else if (titleLength <= 50) titleSize = 68;
  else if (titleLength <= 70) titleSize = 58;
  else titleSize = 48;

  // Адаптивные размеры контента
  let contentSize = 36; // базовый размер
  if (contentLength <= 50) contentSize = 44;
  else if (contentLength <= 100) contentSize = 40;
  else if (contentLength <= 150) contentSize = 36;
  else if (contentLength <= 200) contentSize = 32;
  else contentSize = 28;

  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1080, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=Manrope:wght@500;700;800&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      width: 1080px;
      height: 1350px;
      font-family: 'Manrope', sans-serif;
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

    /* Премиальный многослойный градиент */
    .gradient-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        180deg,
        rgba(0,0,0,0.85) 0%,
        rgba(0,0,0,0.4) 15%,
        rgba(0,0,0,0.0) 30%,
        rgba(0,0,0,0.0) 55%,
        rgba(0,0,0,0.5) 70%,
        rgba(0,0,0,0.92) 100%
      );
    }

    /* Виньетка по краям */
    .vignette {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(
        ellipse at center,
        transparent 50%,
        rgba(0,0,0,0.4) 100%
      );
      pointer-events: none;
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
      padding: 70px 65px;
    }

    .top-section {
      flex: 0 0 auto;
      padding-top: 10px;
    }

    .headline {
      font-family: 'Unbounded', sans-serif;
      font-size: ${titleSize}px;
      font-weight: 900;
      color: #FFFFFF;
      line-height: 1.05;
      text-transform: uppercase;
      letter-spacing: -2px;
      max-width: 95%;
      word-wrap: break-word;
      /* Мощная многослойная тень для читаемости */
      text-shadow:
        0 0 40px rgba(0,0,0,0.95),
        0 4px 8px rgba(0,0,0,0.9),
        0 8px 30px rgba(0,0,0,0.7),
        0 15px 60px rgba(0,0,0,0.5);
      /* Мягкое свечение букв */
      filter: drop-shadow(0 0 2px rgba(255,255,255,0.1));
    }

    .bottom-section {
      flex: 0 0 auto;
      padding-bottom: 15px;
    }

    /* Стеклянная подложка под текст */
    .content-glass {
      background: rgba(0,0,0,0.35);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-radius: 20px;
      padding: 28px 32px;
      border: 1px solid rgba(255,255,255,0.08);
    }

    .content {
      font-family: 'Manrope', sans-serif;
      font-size: ${contentSize}px;
      font-weight: 600;
      color: #FFFFFF;
      line-height: 1.5;
      letter-spacing: -0.3px;
      text-shadow:
        0 2px 8px rgba(0,0,0,0.8),
        0 4px 20px rgba(0,0,0,0.5);
    }

    .slide-counter {
      position: absolute;
      top: 65px;
      right: 65px;
      font-family: 'Unbounded', sans-serif;
      font-size: 28px;
      font-weight: 700;
      color: #FFFFFF;
      background: rgba(0,0,0,0.45);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      padding: 12px 22px;
      border-radius: 50px;
      border: 1px solid rgba(255,255,255,0.15);
      text-shadow: 0 2px 10px rgba(0,0,0,0.8);
    }

    .accent {
      color: #FFE566;
      text-shadow:
        0 0 20px rgba(255,229,102,0.5),
        0 2px 8px rgba(0,0,0,0.9);
    }

    /* Декоративная линия-акцент */
    .accent-line {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 6px;
      background: linear-gradient(90deg,
        transparent 0%,
        rgba(255,255,255,0.3) 20%,
        rgba(255,255,255,0.5) 50%,
        rgba(255,255,255,0.3) 80%,
        transparent 100%
      );
    }
  </style>
</head>
<body>
  <div class="background-image"></div>
  <div class="gradient-overlay"></div>
  <div class="vignette"></div>

  <div class="content-wrapper">
    <div class="top-section">
      <h1 class="headline">${slide.title || ''}</h1>
    </div>
    <div class="bottom-section">
      <div class="content-glass">
        <p class="content">${slide.content || ''}</p>
      </div>
    </div>
  </div>

  <div class="slide-counter">${slideNumber}/${totalSlides}</div>
  <div class="accent-line"></div>
</body>
</html>
  `;
}

module.exports = {
  renderSlides,
  renderSlidesWithImages
};
