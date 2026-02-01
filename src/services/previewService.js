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
  notebook: {
    name: 'Notebook',
    emoji: '📓',
    description: 'Крафтовый стиль'
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
  luxe: {
    name: 'Luxe',
    emoji: '💎',
    description: 'Премиум'
  },
  backspace: {
    name: 'Backspace',
    emoji: '🔲',
    description: 'Агентский'
  },
  star_highlight: {
    name: 'Star Highlight',
    emoji: '⭐',
    description: 'Жёлтый хайлайт'
  },
  purple_accent: {
    name: 'Purple Accent',
    emoji: '💜',
    description: 'Фиолетовый бейдж'
  },
  quote_doodle: {
    name: 'Quote Doodle',
    emoji: '✍️',
    description: 'Для цитат'
  },
  speech_bubble: {
    name: 'Speech Bubble',
    emoji: '💬',
    description: 'Баббл с цитатой'
  },
  grid_multi: {
    name: 'Grid Multi',
    emoji: '📊',
    description: 'Для статистики'
  },
  receipt: {
    name: 'Receipt',
    emoji: '🧾',
    description: 'Стиль чека'
  },
  lime_checklist: {
    name: 'Lime Checklist',
    emoji: '🍋',
    description: 'Чеклист'
  },
  app_list: {
    name: 'App List',
    emoji: '📱',
    description: 'Меню приложения'
  },
  paper_image: {
    name: 'Paper Texture',
    emoji: '📜',
    description: 'Мятая бумага'
  }
};

// Порядок стилей для отображения
const STYLE_ORDER = [
  'notebook',
  'aurora',
  'terminal',
  'editorial',
  'luxe',
  'backspace',
  'star_highlight',
  'purple_accent',
  'quote_doodle',
  'speech_bubble',
  'grid_multi',
  'receipt',
  'lime_checklist',
  'app_list',
  'paper_image'
];

/**
 * Специальный шаблон превью с названием стиля по центру
 */
function getPreviewTemplate(styleKey) {
  const info = STYLE_INFO[styleKey];

  // Базовые цвета для каждого стиля
  const styleColors = {
    notebook: { bg: '#FEF9E7', text: '#1A1A1A', accent: '#C13C3C' },
    aurora: { bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', text: '#FFFFFF', accent: '#E94560' },
    terminal: { bg: '#0D1117', text: '#00FF00', accent: '#00FF00' },
    editorial: { bg: '#F5F5F0', text: '#1A1A1A', accent: '#D4AF37' },
    luxe: { bg: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', text: '#D4AF37', accent: '#D4AF37' },
    backspace: { bg: '#F0EFED', text: '#2D2A26', accent: '#5B5FE8' },
    star_highlight: { bg: '#FFFFFF', text: '#0A0A0A', accent: '#FFF59D' },
    purple_accent: { bg: '#E8E6F2', text: '#0A0A0A', accent: '#9B8FD9' },
    quote_doodle: { bg: '#F5F3EE', text: '#0A0A0A', accent: '#A3E635' },
    speech_bubble: { bg: '#F8F8F8', text: '#1A1A1A', accent: '#F26B3A' },
    grid_multi: { bg: '#FAFAFA', text: '#0A0A0A', accent: '#D4F542' },
    receipt: { bg: '#E8E8E8', text: '#1A1A1A', accent: '#E8725C' },
    lime_checklist: { bg: '#D4F542', text: '#0A0A0A', accent: '#0A0A0A' },
    app_list: { bg: '#E8E6F2', text: '#0A0A0A', accent: '#6366F1' },
    paper_image: { bg: '#F5F3EE', text: '#1A1A1A', accent: '#E8725C' }
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
      font-size: 42px;
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
    ` : ''}

    ${styleKey === 'star_highlight' ? `
      .star-icon {
        position: absolute;
        top: 40px;
        left: 50%;
        transform: translateX(-50%);
        width: 50px;
        height: 50px;
      }
      .star-icon svg {
        width: 100%;
        height: 100%;
        fill: #0A0A0A;
      }
      .highlight-badge {
        position: absolute;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: #FFF59D;
        padding: 8px 20px;
        font-size: 18px;
        font-weight: 600;
        color: #0A0A0A;
      }
    ` : ''}

    ${styleKey === 'purple_accent' ? `
      .purple-badge {
        position: absolute;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%) rotate(-3deg);
        background: #9B8FD9;
        color: white;
        padding: 10px 24px;
        font-size: 20px;
        font-weight: 700;
        box-shadow: 4px 6px 0 rgba(0,0,0,0.15);
      }
      .pink-dot {
        position: absolute;
        bottom: 60px;
        right: 150px;
        width: 14px;
        height: 14px;
        background: #E91E8C;
        border-radius: 50%;
      }
    ` : ''}

    ${styleKey === 'quote_doodle' ? `
      .quote-mark {
        position: absolute;
        top: 60px;
        left: 60px;
        font-family: Georgia, serif;
        font-size: 100px;
        font-weight: 700;
        color: #0A0A0A;
        line-height: 0.5;
      }
      .green-circle {
        position: absolute;
        bottom: 60px;
        right: 60px;
        width: 50px;
        height: 50px;
        background: #1A1A1A;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .green-circle::after {
        content: '→';
        color: #A3E635;
        font-size: 24px;
      }
    ` : ''}

    ${styleKey === 'speech_bubble' ? `
      .bubble {
        position: absolute;
        top: 80px;
        left: 60px;
        width: 100px;
        height: 100px;
        background: #F26B3A;
        border-radius: 15px 15px 15px 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .bubble::after {
        content: ',,';
        font-family: Georgia, serif;
        font-size: 60px;
        color: white;
        line-height: 0.5;
      }
    ` : ''}

    ${styleKey === 'grid_multi' ? `
      body::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image:
          linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px);
        background-size: 30px 30px;
        z-index: 0;
      }
      .deco-lines {
        position: absolute;
        top: 30px;
        right: 30px;
      }
      .deco-line {
        width: 80px;
        height: 8px;
        background: #D4F542;
        margin-bottom: 8px;
        border-radius: 4px;
        transform: rotate(-25deg);
      }
    ` : ''}

    ${styleKey === 'receipt' ? `
      .receipt-paper {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 280px;
        background: white;
        padding: 30px 20px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.15);
      }
      .receipt-paper::before {
        content: '';
        position: absolute;
        top: -10px;
        left: 0;
        width: 100%;
        height: 20px;
        background: linear-gradient(135deg, white 25%, transparent 25%),
                    linear-gradient(225deg, white 25%, transparent 25%);
        background-size: 14px 20px;
      }
      .barcode {
        display: flex;
        gap: 2px;
        justify-content: center;
        margin-top: 20px;
      }
      .bar { background: #1A1A1A; height: 30px; }
      .bar-thin { width: 2px; }
      .bar-thick { width: 4px; }
    ` : ''}

    ${styleKey === 'lime_checklist' ? `
      .notepad {
        position: absolute;
        bottom: 60px;
        left: 50%;
        transform: translateX(-50%);
        width: 300px;
        background: #F5F0E6;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 5px 5px 0 rgba(0,0,0,0.15);
      }
      .checkbox {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 0;
        border-bottom: 1px solid #E0DBD0;
        font-size: 16px;
        color: #0A0A0A;
      }
      .checkbox::before {
        content: '✓';
        width: 20px;
        height: 20px;
        border: 2px solid #0A0A0A;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      }
    ` : ''}

    ${styleKey === 'app_list' ? `
      .search-bar {
        position: absolute;
        top: 120px;
        left: 50%;
        transform: translateX(-50%);
        width: 280px;
        background: #0A0A0A;
        border-radius: 30px;
        padding: 12px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .search-bar span {
        color: white;
        font-size: 14px;
        opacity: 0.7;
      }
      .search-btn {
        width: 30px;
        height: 30px;
        background: #6366F1;
        border-radius: 50%;
      }
      .list-item {
        position: absolute;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .list-dot {
        width: 12px;
        height: 12px;
        background: #6366F1;
        border-radius: 50%;
      }
      .list-text {
        font-size: 18px;
        font-weight: 600;
        color: #0A0A0A;
      }
    ` : ''}

    ${styleKey === 'paper_image' ? `
      body::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        opacity: 0.12;
        z-index: 0;
      }
      .dashed-arrow {
        position: absolute;
        bottom: 80px;
        right: 80px;
        width: 80px;
        height: 80px;
      }
      .dashed-arrow svg {
        width: 100%;
        height: 100%;
      }
      .dashed-arrow path {
        fill: none;
        stroke: #1A1A1A;
        stroke-width: 3;
        stroke-dasharray: 8, 6;
      }
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
  ${styleKey === 'notebook' ? '<div class="margin-line"></div>' : ''}
  ${styleKey === 'backspace' ? '<div class="dot-backspace dot-1"></div><div class="dot-backspace dot-2"></div>' : ''}
  ${styleKey === 'star_highlight' ? '<div class="star-icon"><svg viewBox="0 0 100 100"><polygon points="50,0 54,42 100,50 54,58 50,100 46,58 0,50 46,42"/></svg></div><div class="highlight-badge">[ highlight ]</div>' : ''}
  ${styleKey === 'purple_accent' ? '<div class="purple-badge">accent</div><div class="pink-dot"></div>' : ''}
  ${styleKey === 'quote_doodle' ? '<div class="quote-mark">"</div><div class="green-circle"></div>' : ''}
  ${styleKey === 'speech_bubble' ? '<div class="bubble"></div>' : ''}
  ${styleKey === 'grid_multi' ? '<div class="deco-lines"><div class="deco-line"></div><div class="deco-line"></div><div class="deco-line"></div></div>' : ''}
  ${styleKey === 'receipt' ? '<div class="receipt-paper"><div class="barcode"><div class="bar bar-thick"></div><div class="bar bar-thin"></div><div class="bar bar-thick"></div><div class="bar bar-thin"></div><div class="bar bar-thick"></div><div class="bar bar-thin"></div><div class="bar bar-thick"></div></div></div>' : ''}
  ${styleKey === 'lime_checklist' ? '<div class="notepad"><div class="checkbox">Item one</div><div class="checkbox">Item two</div></div>' : ''}
  ${styleKey === 'app_list' ? '<div class="search-bar"><span>Search...</span><div class="search-btn"></div></div><div class="list-item"><div class="list-dot"></div><span class="list-text">Service item</span></div>' : ''}
  ${styleKey === 'paper_image' ? '<div class="dashed-arrow"><svg viewBox="0 0 80 80"><path d="M 10 10 Q 50 20, 40 50 Q 30 70, 60 70 L 70 60 M 60 70 L 55 55"/></svg></div>' : ''}

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
