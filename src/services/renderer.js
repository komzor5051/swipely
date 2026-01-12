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

module.exports = {
  renderSlides
};
