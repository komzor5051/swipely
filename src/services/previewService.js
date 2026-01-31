const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const PREVIEWS_DIR = path.join(__dirname, '../../previews');
const TEMPLATES_DIR = path.join(__dirname, '../templates');

// Убедимся что директория существует
if (!fs.existsSync(PREVIEWS_DIR)) {
  fs.mkdirSync(PREVIEWS_DIR, { recursive: true });
}

// Информация о стилях для превью
const STYLE_INFO = {
  minimal_pop: {
    name: 'Minimal Pop',
    emoji: '✨',
    description: 'Neo-brutalism'
  },
  notebook: {
    name: 'Notebook',
    emoji: '📓',
    description: 'Крафтовый стиль'
  },
  darkest: {
    name: 'Darkest',
    emoji: '🌚',
    description: 'Премиум тёмный'
  },
  aurora: {
    name: 'Aurora',
    emoji: '🌌',
    description: 'Градиенты'
  },
  terminal: {
    name: 'Terminal',
    emoji: '💻',
    description: 'Ретро-компьютер'
  },
  editorial: {
    name: 'Editorial',
    emoji: '📰',
    description: 'Журнальный стиль'
  },
  zen: {
    name: 'Zen',
    emoji: '🍃',
    description: 'Минимализм'
  },
  memphis: {
    name: 'Memphis',
    emoji: '🎨',
    description: '80-е, яркий'
  },
  luxe: {
    name: 'Luxe',
    emoji: '💎',
    description: 'Премиум'
  },
  backspace: {
    name: 'Backspace',
    emoji: '🔲',
    description: 'Агентский'
  }
};

// Порядок стилей для отображения
const STYLE_ORDER = [
  'minimal_pop',
  'notebook',
  'darkest',
  'aurora',
  'terminal',
  'editorial',
  'zen',
  'memphis',
  'luxe',
  'backspace'
];

/**
 * Генерация HTML для превью стиля (квадратное изображение 540x540)
 */
function generatePreviewHTML(styleKey, styleName) {
  const templatePath = path.join(TEMPLATES_DIR, `${styleKey}.html`);

  if (!fs.existsSync(templatePath)) {
    console.warn(`⚠️ Шаблон ${styleKey} не найден`);
    return null;
  }

  let template = fs.readFileSync(templatePath, 'utf-8');

  // Заменяем размеры на квадратные 540x540 для превью
  template = template.replace(/width:\s*1080px/g, 'width: 540px');
  template = template.replace(/height:\s*1350px/g, 'height: 540px');

  // Уменьшаем все размеры шрифтов и отступов вдвое
  template = template.replace(/font-size:\s*(\d+)px/g, (match, size) => {
    return `font-size: ${Math.round(parseInt(size) * 0.5)}px`;
  });
  template = template.replace(/padding:\s*(\d+)px\s+(\d+)px/g, (match, v, h) => {
    return `padding: ${Math.round(parseInt(v) * 0.4)}px ${Math.round(parseInt(h) * 0.4)}px`;
  });

  // Заменяем контент на название стиля
  template = template.replace(/\{\{TITLE\}\}/g, styleName);
  template = template.replace(/\{\{CONTENT\}\}/g, '');
  template = template.replace(/\{\{SLIDE_NUMBER\}\}/g, '');
  template = template.replace(/\{\{TOTAL_SLIDES\}\}/g, '');

  // Убираем счётчик слайдов
  template = template.replace(/<div class="slide-counter">[\s\S]*?<\/div>/g, '');

  return template;
}

/**
 * Специальный шаблон превью с названием стиля по центру
 */
function getPreviewTemplate(styleKey) {
  const info = STYLE_INFO[styleKey];

  // Базовые цвета для каждого стиля
  const styleColors = {
    minimal_pop: { bg: '#FAFAFA', text: '#0A0A0A', accent: '#FF2D6A' },
    notebook: { bg: '#FEF9E7', text: '#1A1A1A', accent: '#C13C3C' },
    darkest: { bg: '#0A0A0F', text: '#FFFFFF', accent: '#00D4FF' },
    aurora: { bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', text: '#FFFFFF', accent: '#E94560' },
    terminal: { bg: '#0D1117', text: '#00FF00', accent: '#00FF00' },
    editorial: { bg: '#F5F5F0', text: '#1A1A1A', accent: '#D4AF37' },
    zen: { bg: '#F8F6F0', text: '#2D2D2D', accent: '#7C9885' },
    memphis: { bg: '#FFE66D', text: '#2D2D2D', accent: '#FF6B6B' },
    luxe: { bg: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', text: '#D4AF37', accent: '#D4AF37' },
    backspace: { bg: '#F0EFED', text: '#2D2A26', accent: '#5B5FE8' }
  };

  const colors = styleColors[styleKey] || { bg: '#FFFFFF', text: '#000000', accent: '#FF0000' };
  const bgStyle = colors.bg.includes('gradient') ? `background: ${colors.bg}` : `background-color: ${colors.bg}`;

  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=540, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@600;800;900&family=Manrope:wght@500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      width: 540px;
      height: 540px;
      ${bgStyle};
      font-family: 'Manrope', sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      position: relative;
      overflow: hidden;
    }

    .emoji {
      font-size: 80px;
      margin-bottom: 24px;
    }

    .name {
      font-family: 'Unbounded', sans-serif;
      font-size: 48px;
      font-weight: 800;
      color: ${colors.text};
      text-transform: uppercase;
      letter-spacing: -1px;
      text-align: center;
      margin-bottom: 16px;
    }

    .description {
      font-family: 'Manrope', sans-serif;
      font-size: 24px;
      font-weight: 500;
      color: ${colors.text};
      opacity: 0.6;
      text-align: center;
    }

    .accent-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 8px;
      background: ${colors.accent};
    }

    /* Стиль-специфичные декорации */
    ${styleKey === 'minimal_pop' ? `
      .diagonal-slash {
        position: absolute;
        width: 700px;
        height: 80px;
        background: linear-gradient(135deg, #FF2D6A 0%, #FF6B35 100%);
        transform: rotate(-12deg);
        top: 65%;
        left: -100px;
        z-index: 0;
        opacity: 0.9;
      }
      body::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: radial-gradient(circle, rgba(10,10,10,0.04) 1.5px, transparent 1.5px);
        background-size: 20px 20px;
        z-index: 0;
      }
      .frame {
        position: absolute;
        top: 25px;
        left: 25px;
        right: 25px;
        bottom: 25px;
        border: 5px solid #0A0A0A;
        z-index: 0;
      }
    ` : ''}

    ${styleKey === 'notebook' ? `
      body::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image:
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 34px,
            #E5D9C3 34px,
            #E5D9C3 36px
          );
        opacity: 0.5;
        z-index: 0;
      }
      .margin-line {
        position: absolute;
        left: 50px;
        top: 0;
        width: 2px;
        height: 100%;
        background: #C13C3C;
        opacity: 0.35;
        z-index: 1;
      }
    ` : ''}

    ${styleKey === 'darkest' ? `
      body::before {
        content: '';
        position: absolute;
        width: 300px;
        height: 300px;
        background: radial-gradient(circle, rgba(0,212,255,0.2) 0%, transparent 70%);
        top: -100px;
        right: -100px;
        z-index: 0;
      }
    ` : ''}

    ${styleKey === 'terminal' ? `
      body::before {
        content: '>';
        position: absolute;
        top: 30px;
        left: 30px;
        font-family: monospace;
        font-size: 32px;
        color: #00FF00;
        opacity: 0.5;
      }
      body::after {
        content: '_';
        position: absolute;
        bottom: 30px;
        right: 30px;
        font-family: monospace;
        font-size: 32px;
        color: #00FF00;
        animation: blink 1s infinite;
      }
      @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
      }
    ` : ''}

    ${styleKey === 'memphis' ? `
      .circle {
        position: absolute;
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: #FF6B6B;
        top: 30px;
        right: 40px;
        z-index: 0;
      }
      .triangle {
        position: absolute;
        width: 0;
        height: 0;
        border-left: 40px solid transparent;
        border-right: 40px solid transparent;
        border-bottom: 70px solid #4ECDC4;
        bottom: 40px;
        left: 40px;
        z-index: 0;
      }
      .squiggle {
        position: absolute;
        bottom: 100px;
        right: 30px;
        width: 60px;
        height: 30px;
        border: 4px solid #2D2D2D;
        border-radius: 50% 50% 0 0;
        border-bottom: none;
        z-index: 0;
      }
    ` : ''}

    ${styleKey === 'luxe' ? `
      body::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        z-index: 0;
      }
    ` : ''}

    ${styleKey === 'zen' ? `
      .circle-zen {
        position: absolute;
        width: 200px;
        height: 200px;
        border: 2px solid rgba(124, 152, 133, 0.2);
        border-radius: 50%;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 0;
      }
    ` : ''}

    ${styleKey === 'backspace' ? `
      body::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        opacity: 0.08;
        pointer-events: none;
        z-index: 0;
      }
      .dot-backspace {
        position: absolute;
        width: 20px;
        height: 20px;
        background: #5B5FE8;
        border-radius: 50%;
      }
      .dot-1 { top: 120px; left: 50px; }
      .dot-2 { bottom: 150px; right: 80px; }
      .connector-backspace {
        position: absolute;
        width: 3px;
        height: 60px;
        background: #5B5FE8;
      }
      .conn-1 { top: 140px; left: 58px; }
    ` : ''}

    .content {
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
  </style>
</head>
<body>
  ${styleKey === 'minimal_pop' ? '<div class="frame"></div><div class="diagonal-slash"></div>' : ''}
  ${styleKey === 'notebook' ? '<div class="margin-line"></div>' : ''}
  ${styleKey === 'memphis' ? '<div class="circle"></div><div class="triangle"></div><div class="squiggle"></div>' : ''}
  ${styleKey === 'zen' ? '<div class="circle-zen"></div>' : ''}
  ${styleKey === 'backspace' ? '<div class="dot-backspace dot-1"></div><div class="connector-backspace conn-1"></div><div class="dot-backspace dot-2"></div>' : ''}

  <div class="content">
    <div class="emoji">${info.emoji}</div>
    <div class="name">${info.name}</div>
    <div class="description">${info.description}</div>
  </div>

  <div class="accent-bar"></div>
</body>
</html>
  `;
}

/**
 * Генерация превью для одного стиля
 */
async function generatePreview(browser, styleKey) {
  const previewPath = path.join(PREVIEWS_DIR, `${styleKey}.png`);

  // Проверяем, существует ли уже превью
  if (fs.existsSync(previewPath)) {
    console.log(`✅ Превью ${styleKey} уже существует`);
    return previewPath;
  }

  console.log(`🎨 Генерирую превью для ${styleKey}...`);

  const html = getPreviewTemplate(styleKey);

  const page = await browser.newPage();

  await page.setViewport({
    width: 540,
    height: 540,
    deviceScaleFactor: 2
  });

  await page.setContent(html, { waitUntil: 'networkidle0' });

  await page.screenshot({
    path: previewPath,
    type: 'png',
    fullPage: false
  });

  await page.close();

  console.log(`✅ Превью ${styleKey} сохранено: ${previewPath}`);

  return previewPath;
}

/**
 * Генерация превью для всех стилей
 */
async function generateAllPreviews() {
  console.log('🚀 Генерация превью для всех стилей...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const previewPaths = [];

  try {
    for (const styleKey of STYLE_ORDER) {
      const previewPath = await generatePreview(browser, styleKey);
      previewPaths.push({
        styleKey,
        path: previewPath,
        info: STYLE_INFO[styleKey]
      });
    }

    console.log(`✅ Все превью сгенерированы: ${previewPaths.length} файлов`);

    return previewPaths;

  } catch (error) {
    console.error('❌ Ошибка генерации превью:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Получение путей к превью (генерирует если не существуют)
 */
async function getPreviewPaths() {
  // Проверяем, все ли превью существуют
  const missingPreviews = STYLE_ORDER.filter(styleKey => {
    const previewPath = path.join(PREVIEWS_DIR, `${styleKey}.png`);
    return !fs.existsSync(previewPath);
  });

  // Если есть недостающие превью, генерируем все
  if (missingPreviews.length > 0) {
    console.log(`📦 Недостающие превью: ${missingPreviews.join(', ')}`);
    await generateAllPreviews();
  }

  // Возвращаем пути ко всем превью
  return STYLE_ORDER.map(styleKey => ({
    styleKey,
    path: path.join(PREVIEWS_DIR, `${styleKey}.png`),
    info: STYLE_INFO[styleKey]
  }));
}

/**
 * Получение информации о стиле
 */
function getStyleInfo(styleKey) {
  return STYLE_INFO[styleKey] || null;
}

module.exports = {
  generateAllPreviews,
  getPreviewPaths,
  getStyleInfo,
  STYLE_ORDER,
  STYLE_INFO
};
