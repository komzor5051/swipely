const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../../output');
const TEMPLATES_DIR = path.join(__dirname, '../templates');

// Убедимся что директория существует
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Размеры форматов
const FORMAT_SIZES = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 }
};

/**
 * Рендеринг слайдов в изображения
 * @param {Object} carouselData - данные карусели
 * @param {string} stylePreset - стиль оформления
 * @param {Object} options - дополнительные опции
 * @param {string} options.format - формат изображения ('square' | 'portrait')
 * @param {string} options.username - юзернейм для отображения в углу
 */
async function renderSlides(carouselData, stylePreset, options = {}) {
  const startTime = Date.now();
  const format = options.format || 'portrait';
  const username = options.username || null;
  const { width, height } = FORMAT_SIZES[format] || FORMAT_SIZES.portrait;
  const slideCount = carouselData.slides?.length || 0;

  console.log(`🎨 ═══════════════════════════════════════`);
  console.log(`🎨 РЕНДЕРИНГ HTML-СЛАЙДОВ`);
  console.log(`🎨 ═══════════════════════════════════════`);
  console.log(`📐 Формат: ${format} (${width}x${height})`);
  console.log(`🎭 Стиль: ${stylePreset}`);
  console.log(`📊 Слайдов: ${slideCount}`);
  console.log(`👤 Username: ${username || 'не задан'}`);

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
      const html = generateSlideHTML(slide, slideNumber, totalSlides, stylePreset, { width, height, username });

      // Рендерим в изображение
      const page = await browser.newPage();

      // Устанавливаем размер страницы
      await page.setViewport({
        width,
        height,
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

      const fileSizeKB = Math.round(fs.statSync(imagePath).size / 1024);
      console.log(`✅ Слайд ${slideNumber} сохранён (${fileSizeKB} KB)`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const totalSizeKB = imagePaths.reduce((sum, p) => sum + fs.statSync(p).size / 1024, 0);

    console.log(`🎨 ═══════════════════════════════════════`);
    console.log(`✅ РЕНДЕРИНГ ЗАВЕРШЁН`);
    console.log(`📊 Файлов: ${imagePaths.length}`);
    console.log(`⏱️ Время: ${duration}с`);
    console.log(`📦 Общий размер: ${Math.round(totalSizeKB)} KB`);
    console.log(`🎨 ═══════════════════════════════════════`);

    return imagePaths;

  } catch (error) {
    console.error('❌ Ошибка рендеринга:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Генерация HTML для слайда
 * @param {Object} slide - данные слайда
 * @param {number} slideNumber - номер слайда
 * @param {number} totalSlides - всего слайдов
 * @param {string} stylePreset - стиль оформления
 * @param {Object} options - дополнительные опции
 * @param {number} options.width - ширина изображения
 * @param {number} options.height - высота изображения
 * @param {string} options.username - юзернейм для отображения
 */
function generateSlideHTML(slide, slideNumber, totalSlides, stylePreset, options = {}) {
  const { width = 1080, height = 1350, username = null } = options;

  // Загружаем шаблон в зависимости от пресета
  let templatePath;

  switch (stylePreset) {
    case 'notebook':
      templatePath = path.join(TEMPLATES_DIR, 'notebook.html');
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
    case 'luxe':
      templatePath = path.join(TEMPLATES_DIR, 'luxe.html');
      break;
    case 'backspace':
      templatePath = path.join(TEMPLATES_DIR, 'backspace.html');
      break;
    case 'star_highlight':
      templatePath = path.join(TEMPLATES_DIR, 'star_highlight.html');
      break;
    case 'purple_accent':
      templatePath = path.join(TEMPLATES_DIR, 'purple_accent.html');
      break;
    case 'quote_doodle':
      templatePath = path.join(TEMPLATES_DIR, 'quote_doodle.html');
      break;
    case 'speech_bubble':
      templatePath = path.join(TEMPLATES_DIR, 'speech_bubble.html');
      break;
    case 'grid_multi':
      templatePath = path.join(TEMPLATES_DIR, 'grid_multi.html');
      break;
    case 'receipt':
      templatePath = path.join(TEMPLATES_DIR, 'receipt.html');
      break;
    case 'lime_checklist':
      templatePath = path.join(TEMPLATES_DIR, 'lime_checklist.html');
      break;
    case 'app_list':
      templatePath = path.join(TEMPLATES_DIR, 'app_list.html');
      break;
    case 'paper_image':
      templatePath = path.join(TEMPLATES_DIR, 'paper_image.html');
      break;
    case 'swipely':
      templatePath = path.join(TEMPLATES_DIR, 'swipely.html');
      break;
    case 'street':
      templatePath = path.join(TEMPLATES_DIR, 'street.html');
      break;
    case 'photo_split_light':
      templatePath = path.join(TEMPLATES_DIR, 'photo_split_light.html');
      break;
    case 'photo_split_dark':
      templatePath = path.join(TEMPLATES_DIR, 'photo_split_dark.html');
      break;
    default:
      templatePath = path.join(TEMPLATES_DIR, 'notebook.html');
  }

  // Если шаблон не существует, создаём базовый HTML
  let template;

  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    console.warn(`⚠️ Шаблон ${templatePath} не найден, используем встроенный`);
    template = getDefaultTemplate(stylePreset);
  }

  // Применяем размеры формата
  template = template
    .replace(/width:\s*1080px/g, `width: ${width}px`)
    .replace(/height:\s*1350px/g, `height: ${height}px`);

  // Заменяем плейсхолдеры
  const photoUrl = slide.photoUrl || slide.userPhotoUrl || '';
  const photoPosition = slide.photoPosition || slide.userPhotoPosition || 'top';
  const hasPhoto = !!photoUrl;

  let html = template
    .replace(/\{\{SLIDE_NUMBER\}\}/g, slideNumber)
    .replace(/\{\{TOTAL_SLIDES\}\}/g, totalSlides)
    .replace(/\{\{TITLE\}\}/g, slide.title || '')
    .replace(/\{\{CONTENT\}\}/g, slide.content || '')
    .replace(/\{\{TYPE\}\}/g, slide.type || 'statement')
    .replace(/\{\{PHOTO_URL\}\}/g, photoUrl)
    .replace(/\{\{PHOTO_ORDER_TOP\}\}/g, photoPosition === 'top' ? '0' : '1')
    .replace(/\{\{PHOTO_ORDER_BOTTOM\}\}/g, photoPosition === 'top' ? '1' : '0')
    .replace(/\{\{PHOTO_HIDDEN\}\}/g, hasPhoto ? '' : 'hidden')
    .replace(/\{\{TEXT_FULL_HEIGHT\}\}/g, hasPhoto ? '' : 'full-height')
    .replace(/\{\{NO_PHOTO_COUNTER\}\}/g, hasPhoto ? '' :
      `<div class="slide-counter no-photo">${slideNumber}/${totalSlides}</div>`)
    .replace(/\{\{USERNAME\}\}/g, options.username ?
      `<div class="username">@${options.username}</div>` : '');

  // Обработка выделенных слов (emphasize)
  if (slide.emphasize && slide.emphasize.length > 0) {
    slide.emphasize.forEach(word => {
      const regex = new RegExp(`\\b(${word})\\b`, 'gi');
      html = html.replace(regex, '<span class="accent">$1</span>');
    });
  }

  // Добавляем юзернейм если указан
  if (username) {
    html = injectUsernameOverlay(html, username, stylePreset);
  }

  return html;
}

/**
 * Внедрение оверлея с юзернеймом в HTML
 */
function injectUsernameOverlay(html, username, stylePreset) {
  // Определяем цвета в зависимости от стиля
  const styleColors = {
    notebook: { text: '#1A1A1A', bg: 'rgba(254,249,231,0.8)' },
    aurora: { text: '#FFFFFF', bg: 'rgba(0,0,0,0.4)' },
    terminal: { text: '#00FF00', bg: 'rgba(13,17,23,0.8)' },
    editorial: { text: '#1A1A1A', bg: 'rgba(245,245,240,0.8)' },
    luxe: { text: '#D4AF37', bg: 'rgba(26,26,26,0.8)' },
    backspace: { text: '#2D2A26', bg: 'rgba(240,239,237,0.9)' },
    star_highlight: { text: '#0A0A0A', bg: 'rgba(255,255,255,0.85)' },
    purple_accent: { text: '#0A0A0A', bg: 'rgba(255,255,255,0.9)' },
    quote_doodle: { text: '#0A0A0A', bg: 'rgba(245,243,238,0.9)' },
    speech_bubble: { text: '#1A1A1A', bg: 'rgba(255,255,255,0.9)' },
    grid_multi: { text: '#0A0A0A', bg: 'rgba(255,255,255,0.9)' },
    receipt: { text: '#1A1A1A', bg: 'rgba(255,255,255,0.95)' },
    lime_checklist: { text: '#0A0A0A', bg: 'rgba(255,255,255,0.9)' },
    app_list: { text: '#0A0A0A', bg: 'rgba(255,255,255,0.9)' },
    paper_image: { text: '#1A1A1A', bg: 'rgba(245,243,238,0.9)' },
    swipely: { text: '#FFFFFF', bg: 'rgba(10,132,255,0.3)' }
  };

  const colors = styleColors[stylePreset] || { text: '#FFFFFF', bg: 'rgba(0,0,0,0.5)' };

  // CSS для юзернейма
  const usernameStyles = `
    .username-overlay {
      position: absolute;
      bottom: 25px;
      left: 25px;
      font-family: 'Manrope', 'Inter', -apple-system, sans-serif;
      font-size: 18px;
      font-weight: 600;
      color: ${colors.text};
      background: ${colors.bg};
      padding: 8px 16px;
      border-radius: 20px;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 1000;
      letter-spacing: 0.3px;
    }
  `;

  // HTML для юзернейма
  const usernameHtml = `<div class="username-overlay">${username}</div>`;

  // Вставляем стили перед </style>
  html = html.replace('</style>', `${usernameStyles}</style>`);

  // Вставляем HTML перед </body>
  html = html.replace('</body>', `${usernameHtml}</body>`);

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

    /* Highlight для ключевых слов в заголовке */
    .hl, .headline hl {
      display: inline;
      background: #D4F542;
      color: #0A0A0A;
      padding: 6px 16px;
      margin: 0 -6px;
      box-decoration-break: clone;
      -webkit-box-decoration-break: clone;
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
 * @param {Object} carouselData - данные карусели
 * @param {Array} imageBase64Array - массив base64 изображений
 * @param {Object} options - дополнительные опции
 * @param {string} options.format - формат изображения ('square' | 'portrait')
 * @param {string} options.username - юзернейм для отображения
 */
async function renderSlidesWithImages(carouselData, imageBase64Array, options = {}) {
  const startTime = Date.now();
  const format = options.format || 'portrait';
  const username = options.username || null;
  const { width, height } = FORMAT_SIZES[format] || FORMAT_SIZES.portrait;
  const slideCount = carouselData.slides.length;
  const validImages = imageBase64Array.filter(img => img !== null).length;

  console.log(`🎨 ═══════════════════════════════════════`);
  console.log(`🎨 РЕНДЕРИНГ PHOTO MODE`);
  console.log(`🎨 ═══════════════════════════════════════`);
  console.log(`📐 Формат: ${format} (${width}x${height})`);
  console.log(`📊 Слайдов: ${slideCount}`);
  console.log(`🖼️ AI-изображений: ${validImages}/${slideCount}`);
  console.log(`👤 Username: ${username || 'не задан'}`);

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
      const html = generatePhotoSlideHTML(slide, slideNumber, totalSlides, imageBase64, { width, height, username });

      const page = await browser.newPage();

      await page.setViewport({
        width,
        height,
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

      const fileSizeKB = Math.round(fs.statSync(imagePath).size / 1024);
      console.log(`✅ Слайд ${slideNumber} с фото сохранён (${fileSizeKB} KB)`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const totalSizeKB = imagePaths.reduce((sum, p) => sum + fs.statSync(p).size / 1024, 0);

    console.log(`🎨 ═══════════════════════════════════════`);
    console.log(`✅ РЕНДЕРИНГ PHOTO MODE ЗАВЕРШЁН`);
    console.log(`📊 Файлов: ${imagePaths.length}`);
    console.log(`⏱️ Время: ${duration}с`);
    console.log(`📦 Общий размер: ${Math.round(totalSizeKB)} KB`);
    console.log(`🎨 ═══════════════════════════════════════`);

    return imagePaths;

  } catch (error) {
    console.error('❌ Ошибка рендеринга Photo Mode:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Генерация HTML для слайда с AI-изображением на фоне
 * PREMIUM Typography System — крупный, читаемый текст с динамическим масштабированием
 * @param {Object} slide - данные слайда
 * @param {number} slideNumber - номер слайда
 * @param {number} totalSlides - всего слайдов
 * @param {string} imageBase64 - base64 изображения
 * @param {Object} options - дополнительные опции
 * @param {number} options.width - ширина изображения
 * @param {number} options.height - высота изображения
 * @param {string} options.username - юзернейм для отображения
 */
function generatePhotoSlideHTML(slide, slideNumber, totalSlides, imageBase64, options = {}) {
  const { width = 1080, height = 1350, username = null } = options;

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

  // CSS для юзернейма (если указан)
  const usernameStyles = username ? `
    .username-overlay {
      position: absolute;
      bottom: 25px;
      left: 25px;
      font-family: 'Manrope', sans-serif;
      font-size: 18px;
      font-weight: 600;
      color: #FFFFFF;
      background: rgba(0,0,0,0.5);
      padding: 8px 16px;
      border-radius: 20px;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 1000;
      letter-spacing: 0.3px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    }
  ` : '';

  // HTML для юзернейма (если указан)
  const usernameHtml = username ? `<div class="username-overlay">${username}</div>` : '';

  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=${width}, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=Manrope:wght@500;700;800&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      width: ${width}px;
      height: ${height}px;
      font-family: 'Manrope', sans-serif;
      position: relative;
      overflow: hidden;
    }
    ${usernameStyles}

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

    /* Highlight для ключевых слов в заголовке */
    .hl, .headline hl {
      display: inline;
      background: #D4F542;
      color: #0A0A0A;
      padding: 6px 16px;
      margin: 0 -6px;
      box-decoration-break: clone;
      -webkit-box-decoration-break: clone;
      text-shadow: none;
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
  ${usernameHtml}
</body>
</html>
  `;
}

module.exports = {
  renderSlides,
  renderSlidesWithImages
};
