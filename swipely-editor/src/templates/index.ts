// HTML templates for carousel slides
// Imported from swipely-bot/src/templates/

export const templates: Record<string, string> = {
  notebook: `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width={{WIDTH}}, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Literata:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --paper: #FEF9E7;
      --ink: #1A1A1A;
      --red-ink: #C13C3C;
      --blue-ink: #3D5A80;
      --pencil: #6B6B6B;
      --line: #E5D9C3;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: {{WIDTH}}px;
      height: {{HEIGHT}}px;
      background: var(--paper);
      font-family: 'Literata', serif;
      display: flex;
      flex-direction: column;
      padding: 90px 100px 90px 130px;
      position: relative;
      overflow: hidden;
    }
    body::before {
      content: '';
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background-image: repeating-linear-gradient(0deg, transparent, transparent 54px, var(--line) 54px, var(--line) 56px);
      opacity: 0.5;
      pointer-events: none;
      z-index: 1;
    }
    .margin-line {
      position: absolute;
      left: 100px;
      top: 0;
      width: 3px;
      height: 100%;
      background: var(--red-ink);
      opacity: 0.35;
      z-index: 2;
    }
    .slide-counter {
      position: absolute;
      top: 55px;
      right: 80px;
      font-family: 'Caveat', cursive;
      font-size: 42px;
      color: var(--pencil);
      font-weight: 600;
      z-index: 10;
      transform: rotate(-3deg);
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
      font-family: 'Caveat', cursive;
      font-size: 100px;
      font-weight: 700;
      line-height: 1.0;
      color: var(--ink);
      margin-bottom: 55px;
      position: relative;
      max-width: 850px;
    }
    .headline::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 0;
      width: 320px;
      height: 6px;
      background: var(--red-ink);
      border-radius: 3px;
      opacity: 0.7;
      transform: skewY(-1deg);
    }
    .content {
      font-family: 'Literata', serif;
      font-size: 36px;
      font-weight: 400;
      line-height: 1.65;
      color: var(--ink);
      position: relative;
      z-index: 2;
      max-width: 820px;
    }
    .coffee-stain {
      position: absolute;
      bottom: 100px;
      left: 60px;
      width: 110px;
      height: 110px;
      background: radial-gradient(circle, rgba(140,100,60,0.08) 0%, transparent 70%);
      border-radius: 50%;
      z-index: 0;
    }
    .paper-fold {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, transparent 50%, #F5EDD6 50%);
      box-shadow: -3px -3px 8px rgba(0,0,0,0.05);
      z-index: 10;
    }
    .tape {
      position: absolute;
      top: 60px;
      left: 85px;
      width: 120px;
      height: 35px;
      background: rgba(255,248,200,0.75);
      transform: rotate(-5deg);
      z-index: 10;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
  </style>
</head>
<body>
  <div class="margin-line"></div>
  <div class="slide-counter">{{SLIDE_NUMBER}}/{{TOTAL_SLIDES}}</div>
  <div class="content-wrapper">
    <h1 class="headline">{{TITLE}}</h1>
    <div class="content">{{CONTENT}}</div>
  </div>
  <div class="coffee-stain"></div>
  <div class="paper-fold"></div>
  <div class="tape"></div>
</body>
</html>`,

  aurora: `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width={{WIDTH}}, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;800&family=Manrope:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --aurora-1: #7F5AF0;
      --aurora-2: #2CB67D;
      --aurora-3: #72F2EB;
      --aurora-4: #FF8E3C;
      --dark: #12121A;
      --light: #FFFFFE;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: {{WIDTH}}px;
      height: {{HEIGHT}}px;
      background: var(--dark);
      font-family: 'Manrope', sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 100px 90px;
      position: relative;
      overflow: hidden;
    }
    .aurora-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; overflow: hidden; }
    .aurora-blob { position: absolute; border-radius: 50%; filter: blur(140px); opacity: 0.7; }
    .blob-1 { width: 800px; height: 800px; background: linear-gradient(135deg, var(--aurora-1) 0%, var(--aurora-3) 100%); top: -250px; right: -150px; }
    .blob-2 { width: 600px; height: 600px; background: linear-gradient(225deg, var(--aurora-2) 0%, var(--aurora-3) 100%); bottom: 50px; left: -200px; }
    .blob-3 { width: 450px; height: 450px; background: linear-gradient(180deg, var(--aurora-4) 0%, var(--aurora-1) 100%); bottom: -150px; right: 150px; opacity: 0.5; }
    .slide-counter {
      position: absolute;
      top: 70px;
      right: 90px;
      font-size: 28px;
      font-weight: 600;
      color: var(--light);
      letter-spacing: 4px;
      z-index: 10;
      opacity: 0.7;
    }
    .slide-counter .current { font-size: 42px; font-weight: 800; opacity: 1; }
    .content-wrapper { position: relative; z-index: 5; flex: 1; display: flex; flex-direction: column; justify-content: center; }
    .headline {
      font-family: 'Fraunces', serif;
      font-size: 88px;
      font-weight: 800;
      line-height: 1.05;
      color: var(--light);
      margin-bottom: 55px;
      letter-spacing: -2px;
      max-width: 900px;
    }
    .content {
      font-family: 'Manrope', sans-serif;
      font-size: 36px;
      font-weight: 400;
      line-height: 1.6;
      color: var(--light);
      max-width: 850px;
      opacity: 0.88;
    }
    .float-ring { position: absolute; border: 3px solid var(--aurora-3); border-radius: 50%; opacity: 0.35; }
    .ring-1 { width: 250px; height: 250px; bottom: 100px; right: 80px; }
    .ring-2 { width: 150px; height: 150px; top: 180px; left: 60px; border-color: var(--aurora-1); }
    .line-accent { position: absolute; bottom: 90px; left: 90px; width: 200px; height: 2px; background: linear-gradient(90deg, var(--aurora-2), transparent); z-index: 10; }
  </style>
</head>
<body>
  <div class="aurora-bg">
    <div class="aurora-blob blob-1"></div>
    <div class="aurora-blob blob-2"></div>
    <div class="aurora-blob blob-3"></div>
  </div>
  <div class="slide-counter"><span class="current">{{SLIDE_NUMBER}}</span>/{{TOTAL_SLIDES}}</div>
  <div class="content-wrapper">
    <h1 class="headline">{{TITLE}}</h1>
    <p class="content">{{CONTENT}}</p>
  </div>
  <div class="float-ring ring-1"></div>
  <div class="float-ring ring-2"></div>
  <div class="line-accent"></div>
</body>
</html>`,

  terminal: `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width={{WIDTH}}, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0A0A0A;
      --phosphor: #33FF00;
      --phosphor-dim: #1A9900;
      --amber: #FFB000;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: {{WIDTH}}px;
      height: {{HEIGHT}}px;
      background: var(--bg);
      font-family: 'JetBrains Mono', monospace;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 100px 85px;
      position: relative;
      overflow: hidden;
    }
    body::before {
      content: '';
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.5) 100%);
      pointer-events: none;
      z-index: 10;
    }
    .scanlines {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(51,255,0,0.03) 3px, rgba(51,255,0,0.03) 6px);
      pointer-events: none;
      z-index: 8;
    }
    .glow-overlay {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: radial-gradient(ellipse at 50% 50%, rgba(51,255,0,0.04) 0%, transparent 70%);
      pointer-events: none;
      z-index: 1;
    }
    .slide-counter {
      position: absolute;
      top: 60px;
      right: 85px;
      font-family: 'Space Mono', monospace;
      font-size: 28px;
      font-weight: 700;
      color: var(--phosphor-dim);
      z-index: 15;
    }
    .slide-counter::before { content: '> '; color: var(--phosphor); }
    .terminal-header {
      position: absolute;
      top: 60px;
      left: 85px;
      font-size: 20px;
      font-weight: 600;
      color: var(--phosphor-dim);
      z-index: 15;
    }
    .content-wrapper { position: relative; z-index: 5; flex: 1; display: flex; flex-direction: column; justify-content: center; }
    .headline {
      font-family: 'Space Mono', monospace;
      font-size: 78px;
      font-weight: 700;
      line-height: 1.1;
      color: var(--phosphor);
      margin-bottom: 55px;
      text-transform: uppercase;
      letter-spacing: -2px;
      max-width: 900px;
      text-shadow: 0 0 15px var(--phosphor), 0 0 30px rgba(51,255,0,0.6);
    }
    .headline::after { content: '_'; color: var(--phosphor); opacity: 0.9; margin-left: 10px; }
    .content {
      font-family: 'JetBrains Mono', monospace;
      font-size: 32px;
      font-weight: 400;
      line-height: 1.75;
      color: var(--phosphor);
      max-width: 880px;
      opacity: 0.8;
    }
    .content::before { content: '$ '; color: var(--amber); font-weight: 700; }
    .status-bar {
      position: absolute;
      bottom: 55px;
      left: 85px;
      right: 85px;
      display: flex;
      justify-content: space-between;
      font-size: 18px;
      font-weight: 600;
      color: var(--phosphor-dim);
      z-index: 15;
      border-top: 2px solid rgba(51,255,0,0.25);
      padding-top: 18px;
    }
    .status-item { display: flex; align-items: center; gap: 10px; }
    .status-dot { width: 10px; height: 10px; background: var(--phosphor); border-radius: 50%; box-shadow: 0 0 12px var(--phosphor); }
    .v-line {
      position: absolute;
      left: 65px;
      top: 170px;
      bottom: 170px;
      width: 3px;
      background: linear-gradient(180deg, transparent 0%, var(--phosphor-dim) 20%, var(--phosphor-dim) 80%, transparent 100%);
      opacity: 0.35;
      z-index: 5;
    }
  </style>
</head>
<body>
  <div class="scanlines"></div>
  <div class="glow-overlay"></div>
  <div class="v-line"></div>
  <div class="terminal-header">swipely@terminal:~</div>
  <div class="slide-counter">{{SLIDE_NUMBER}}/{{TOTAL_SLIDES}}</div>
  <div class="content-wrapper">
    <h1 class="headline">{{TITLE}}</h1>
    <p class="content">{{CONTENT}}</p>
  </div>
  <div class="status-bar">
    <div class="status-item"><span class="status-dot"></span><span>CONNECTED</span></div>
    <div class="status-item">SWIPELY.AI</div>
    <div class="status-item">2026</div>
  </div>
</body>
</html>`,

  editorial: `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width={{WIDTH}}, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700;900&family=Outfit:wght@300;400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --ink: #141414;
      --cream: #F8F5F0;
      --red: #E63946;
      --tan: #D4A574;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: {{WIDTH}}px;
      height: {{HEIGHT}}px;
      background: var(--cream);
      font-family: 'Outfit', sans-serif;
      position: relative;
      overflow: hidden;
    }
    .color-block { position: absolute; top: 0; right: 0; width: 380px; height: 100%; background: var(--ink); z-index: 1; }
    .accent-strip { position: absolute; top: 0; right: 380px; width: 20px; height: 100%; background: var(--red); z-index: 2; }
    .content-area {
      position: absolute;
      top: 0;
      left: 0;
      right: 400px;
      height: 100%;
      padding: 100px 80px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      z-index: 3;
    }
    .big-number {
      position: absolute;
      top: 60px;
      left: 60px;
      font-family: 'Playfair Display', serif;
      font-size: 200px;
      font-weight: 900;
      color: var(--ink);
      opacity: 0.06;
      line-height: 1;
      z-index: 4;
    }
    .slide-indicator {
      position: absolute;
      bottom: 80px;
      left: 80px;
      font-size: 18px;
      font-weight: 500;
      color: var(--ink);
      letter-spacing: 5px;
      text-transform: uppercase;
      z-index: 4;
    }
    .headline {
      font-family: 'Playfair Display', serif;
      font-size: 86px;
      font-weight: 900;
      line-height: 1.0;
      color: var(--ink);
      margin-bottom: 50px;
      letter-spacing: -3px;
      max-width: 580px;
    }
    .content {
      font-family: 'Outfit', sans-serif;
      font-size: 34px;
      font-weight: 400;
      line-height: 1.6;
      color: var(--ink);
      max-width: 540px;
      opacity: 0.85;
    }
    .sidebar {
      position: absolute;
      top: 50%;
      right: 50px;
      transform: translateY(-50%);
      width: 280px;
      z-index: 5;
    }
    .sidebar-text {
      font-size: 16px;
      font-weight: 300;
      color: var(--cream);
      opacity: 0.5;
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      letter-spacing: 3px;
      text-transform: uppercase;
    }
    .dark-number {
      position: absolute;
      bottom: 120px;
      right: 60px;
      font-family: 'Playfair Display', serif;
      font-size: 320px;
      font-weight: 900;
      color: var(--cream);
      opacity: 0.08;
      line-height: 1;
      z-index: 2;
    }
    .dot-pattern {
      position: absolute;
      top: 120px;
      right: 430px;
      width: 80px;
      height: 80px;
      background-image: radial-gradient(var(--tan) 2.5px, transparent 2.5px);
      background-size: 14px 14px;
      opacity: 0.6;
      z-index: 2;
    }
    .brand-mark {
      position: absolute;
      top: 80px;
      right: 430px;
      font-size: 14px;
      font-weight: 500;
      color: var(--red);
      letter-spacing: 4px;
      text-transform: uppercase;
      z-index: 5;
    }
  </style>
</head>
<body>
  <div class="color-block"></div>
  <div class="accent-strip"></div>
  <div class="content-area">
    <h1 class="headline">{{TITLE}}</h1>
    <p class="content">{{CONTENT}}</p>
  </div>
  <div class="big-number">{{SLIDE_NUMBER}}</div>
  <div class="slide-indicator">{{SLIDE_NUMBER}} — {{TOTAL_SLIDES}}</div>
  <div class="sidebar"><p class="sidebar-text">Swipely Editorial</p></div>
  <div class="dark-number">{{SLIDE_NUMBER}}</div>
  <div class="dot-pattern"></div>
  <div class="brand-mark">Swipely</div>
</body>
</html>`,

  luxe: `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width={{WIDTH}}, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Outfit:wght@300;400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0C0C0C;
      --gold: #C9A96E;
      --cream: #F5F0E8;
      --gray: #6B6B6B;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: {{WIDTH}}px;
      height: {{HEIGHT}}px;
      background: var(--bg);
      font-family: 'Outfit', sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 110px 100px;
      position: relative;
      overflow: hidden;
    }
    .gold-frame {
      position: absolute;
      top: 55px; left: 55px; right: 55px; bottom: 55px;
      border: 1px solid var(--gold);
      opacity: 0.45;
      z-index: 1;
    }
    .gold-frame::before {
      content: '';
      position: absolute;
      top: 18px; left: 18px; right: 18px; bottom: 18px;
      border: 1px solid var(--gold);
      opacity: 0.65;
    }
    .corner-ornament { position: absolute; width: 70px; height: 70px; z-index: 2; }
    .corner-ornament svg { width: 100%; height: 100%; }
    .corner-tl { top: 40px; left: 40px; }
    .corner-tr { top: 40px; right: 40px; transform: rotate(90deg); }
    .corner-bl { bottom: 40px; left: 40px; transform: rotate(-90deg); }
    .corner-br { bottom: 40px; right: 40px; transform: rotate(180deg); }
    .slide-counter {
      position: absolute;
      top: 80px;
      right: 100px;
      font-size: 22px;
      font-weight: 400;
      color: var(--gold);
      letter-spacing: 10px;
      z-index: 10;
      text-transform: uppercase;
    }
    .content-wrapper { position: relative; z-index: 5; flex: 1; display: flex; flex-direction: column; justify-content: center; }
    .headline {
      font-family: 'Cormorant Garamond', serif;
      font-size: 92px;
      font-weight: 600;
      line-height: 1.1;
      color: var(--cream);
      margin-bottom: 55px;
      letter-spacing: 1px;
      max-width: 880px;
    }
    .headline::after {
      content: '';
      display: block;
      width: 150px;
      height: 2px;
      background: linear-gradient(90deg, var(--gold), transparent);
      margin-top: 40px;
    }
    .content {
      font-family: 'Outfit', sans-serif;
      font-size: 34px;
      font-weight: 300;
      line-height: 1.75;
      color: var(--cream);
      max-width: 820px;
      opacity: 0.85;
    }
    .brand-vertical {
      position: absolute;
      left: 80px;
      top: 50%;
      transform: translateY(-50%) rotate(-90deg);
      font-size: 14px;
      font-weight: 400;
      color: var(--gold);
      letter-spacing: 8px;
      text-transform: uppercase;
      opacity: 0.55;
      z-index: 5;
    }
    .diamond { position: absolute; width: 14px; height: 14px; background: var(--gold); transform: rotate(45deg); opacity: 0.65; }
    .diamond-1 { bottom: 110px; left: 220px; }
    .diamond-2 { top: 240px; right: 140px; width: 10px; height: 10px; opacity: 0.45; }
    .glow {
      position: absolute;
      width: 600px; height: 600px;
      background: radial-gradient(ellipse, rgba(201,169,110,0.1) 0%, transparent 70%);
      border-radius: 50%;
      top: 50%; left: 50%; transform: translate(-50%, -50%);
      z-index: 0;
      pointer-events: none;
    }
    .tagline {
      position: absolute;
      bottom: 75px;
      left: 100px;
      font-size: 15px;
      font-weight: 400;
      color: var(--gray);
      letter-spacing: 5px;
      text-transform: uppercase;
      z-index: 5;
    }
  </style>
</head>
<body>
  <div class="glow"></div>
  <div class="gold-frame"></div>
  <div class="corner-ornament corner-tl"><svg viewBox="0 0 70 70"><path d="M0,0 L35,0 L35,6 L6,6 L6,35 L0,35 Z" fill="#C9A96E" opacity="0.65"/><circle cx="18" cy="18" r="4" fill="#C9A96E" opacity="0.45"/></svg></div>
  <div class="corner-ornament corner-tr"><svg viewBox="0 0 70 70"><path d="M0,0 L35,0 L35,6 L6,6 L6,35 L0,35 Z" fill="#C9A96E" opacity="0.65"/><circle cx="18" cy="18" r="4" fill="#C9A96E" opacity="0.45"/></svg></div>
  <div class="corner-ornament corner-bl"><svg viewBox="0 0 70 70"><path d="M0,0 L35,0 L35,6 L6,6 L6,35 L0,35 Z" fill="#C9A96E" opacity="0.65"/><circle cx="18" cy="18" r="4" fill="#C9A96E" opacity="0.45"/></svg></div>
  <div class="corner-ornament corner-br"><svg viewBox="0 0 70 70"><path d="M0,0 L35,0 L35,6 L6,6 L6,35 L0,35 Z" fill="#C9A96E" opacity="0.65"/><circle cx="18" cy="18" r="4" fill="#C9A96E" opacity="0.45"/></svg></div>
  <div class="slide-counter">{{SLIDE_NUMBER}} — {{TOTAL_SLIDES}}</div>
  <div class="brand-vertical">Swipely Luxe</div>
  <div class="content-wrapper">
    <h1 class="headline">{{TITLE}}</h1>
    <p class="content">{{CONTENT}}</p>
  </div>
  <div class="diamond diamond-1"></div>
  <div class="diamond diamond-2"></div>
  <div class="tagline">Excellence in Every Detail</div>
</body>
</html>`,

  photo_overlay: `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width={{WIDTH}}, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=Manrope:wght@500;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: {{WIDTH}}px;
      height: {{HEIGHT}}px;
      font-family: 'Manrope', sans-serif;
      position: relative;
      overflow: hidden;
      background: linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    }
    .gradient-overlay {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 15%, rgba(0,0,0,0.0) 30%, rgba(0,0,0,0.0) 55%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.92) 100%);
    }
    .content-wrapper {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 70px 65px;
    }
    .top-section { flex: 0 0 auto; padding-top: 10px; }
    .headline {
      font-family: 'Unbounded', sans-serif;
      font-size: 72px;
      font-weight: 900;
      color: #FFFFFF;
      line-height: 1.05;
      text-transform: uppercase;
      letter-spacing: -2px;
      max-width: 95%;
      text-shadow: 0 0 40px rgba(0,0,0,0.95), 0 4px 8px rgba(0,0,0,0.9), 0 8px 30px rgba(0,0,0,0.7);
    }
    .bottom-section { flex: 0 0 auto; padding-bottom: 15px; }
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
      font-size: 36px;
      font-weight: 600;
      color: #FFFFFF;
      line-height: 1.5;
      text-shadow: 0 2px 8px rgba(0,0,0,0.8);
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
      padding: 12px 22px;
      border-radius: 50px;
      border: 1px solid rgba(255,255,255,0.15);
    }
    .photo-hint {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 18px;
      color: rgba(255,255,255,0.3);
      text-align: center;
      z-index: 0;
    }
  </style>
</head>
<body>
  <div class="gradient-overlay"></div>
  <div class="photo-hint">📸 AI-изображение будет здесь</div>
  <div class="content-wrapper">
    <div class="top-section">
      <h1 class="headline">{{TITLE}}</h1>
    </div>
    <div class="bottom-section">
      <div class="content-glass">
        <p class="content">{{CONTENT}}</p>
      </div>
    </div>
  </div>
  <div class="slide-counter">{{SLIDE_NUMBER}}/{{TOTAL_SLIDES}}</div>
</body>
</html>`,

  backspace: `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width={{WIDTH}}, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #F0EFED;
      --ink: #2D2A26;
      --accent: #5B5FE8;
      --highlight-bg: #C5C7F7;
      --white: #FFFFFF;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: {{WIDTH}}px;
      height: {{HEIGHT}}px;
      background: var(--bg);
      font-family: 'Space Grotesk', 'Manrope', sans-serif;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    body::before {
      content: '';
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
      opacity: 0.08;
      pointer-events: none;
      z-index: 0;
    }
    .slide-counter {
      position: absolute;
      top: 70px;
      right: 80px;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 22px;
      font-weight: 500;
      color: var(--ink);
      opacity: 0.6;
      letter-spacing: 2px;
      z-index: 10;
    }
    .dot {
      position: absolute;
      width: 28px;
      height: 28px;
      background: var(--accent);
      border-radius: 50%;
      z-index: 5;
    }
    .dot-1 { top: 45%; left: 60px; }
    .dot-2 { bottom: 32%; right: 140px; }
    .connector {
      position: absolute;
      background: var(--accent);
      z-index: 4;
    }
    .connector-1 {
      width: 3px;
      height: 100px;
      top: calc(45% + 28px);
      left: 72px;
    }
    .connector-2 {
      width: 3px;
      height: 80px;
      bottom: calc(32% + 28px);
      right: 152px;
    }
    .content-wrapper {
      position: relative;
      z-index: 5;
      padding: 120px 100px;
      padding-left: 120px;
    }
    .headline {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 88px;
      font-weight: 700;
      line-height: 1.0;
      color: var(--ink);
      letter-spacing: -3px;
      margin-bottom: 55px;
      max-width: 880px;
    }
    .content {
      font-family: 'Manrope', sans-serif;
      font-size: 34px;
      font-weight: 500;
      line-height: 1.55;
      color: var(--ink);
      max-width: 780px;
      margin-bottom: 60px;
    }
    .accent {
      display: inline;
      background: var(--highlight-bg);
      padding: 4px 10px;
      margin: 0 2px;
      position: relative;
    }
    .accent::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      border: 2px solid var(--accent);
      pointer-events: none;
    }
    .brand-mark {
      position: absolute;
      bottom: 70px;
      left: 100px;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 16px;
      font-weight: 500;
      color: var(--ink);
      opacity: 0.4;
      letter-spacing: 3px;
      text-transform: uppercase;
      z-index: 10;
    }
    .grid-pattern {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 300px;
      height: 300px;
      background-image:
        linear-gradient(rgba(93, 95, 232, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(93, 95, 232, 0.05) 1px, transparent 1px);
      background-size: 30px 30px;
      z-index: 1;
    }
  </style>
</head>
<body>
  <div class="slide-counter">{{SLIDE_NUMBER}} / {{TOTAL_SLIDES}}</div>
  <div class="dot dot-1"></div>
  <div class="connector connector-1"></div>
  <div class="dot dot-2"></div>
  <div class="connector connector-2"></div>
  <div class="content-wrapper">
    <h1 class="headline">{{TITLE}}</h1>
    <p class="content">{{CONTENT}}</p>
  </div>
  <div class="brand-mark">Swipely</div>
  <div class="grid-pattern"></div>
</body>
</html>`,

  star_highlight: `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width={{WIDTH}}, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #FFFFFF;
      --ink: #0A0A0A;
      --highlight: #FFF59D;
      --gray: #666666;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: {{WIDTH}}px;
      height: {{HEIGHT}}px;
      background: var(--bg);
      font-family: 'Playfair Display', Georgia, serif;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px;
    }
    .category-tag {
      position: absolute;
      top: 60px;
      left: 50%;
      transform: translateX(-50%);
      font-family: 'Inter', sans-serif;
      font-size: 18px;
      font-weight: 600;
      color: var(--ink);
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .star-icon {
      width: 80px;
      height: 80px;
      margin-bottom: 40px;
    }
    .star-icon svg {
      width: 100%;
      height: 100%;
      fill: var(--ink);
    }
    .content-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      max-width: 900px;
    }
    .headline {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 78px;
      font-weight: 500;
      line-height: 1.15;
      color: var(--ink);
      letter-spacing: -1px;
      margin-bottom: 30px;
      text-align: center;
    }
    .highlight-box {
      display: inline;
      background: var(--highlight);
      padding: 4px 16px;
      font-family: 'Inter', sans-serif;
      font-size: 32px;
      font-weight: 500;
      color: var(--ink);
      letter-spacing: 1px;
    }
    .highlight-box::before { content: '[ '; }
    .highlight-box::after { content: ' ]'; }
    .accent {
      background: var(--highlight);
      padding: 2px 8px;
      display: inline;
    }
    .content {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 36px;
      font-weight: 400;
      line-height: 1.5;
      color: var(--ink);
      text-align: center;
      max-width: 800px;
      margin-top: 20px;
    }
    .arrow-container {
      position: absolute;
      bottom: 180px;
      left: 50%;
      transform: translateX(-50%);
    }
    .arrow-line {
      width: 120px;
      height: 2px;
      background: var(--ink);
      position: relative;
    }
    .arrow-line::after {
      content: '';
      position: absolute;
      right: -2px;
      top: -6px;
      width: 14px;
      height: 14px;
      border-right: 2px solid var(--ink);
      border-top: 2px solid var(--ink);
      transform: rotate(45deg);
    }
    .slide-counter {
      position: absolute;
      top: 60px;
      right: 80px;
      font-family: 'Inter', sans-serif;
      font-size: 16px;
      font-weight: 500;
      color: var(--gray);
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="category-tag">[ {{TYPE}} ]</div>
  <div class="slide-counter">{{SLIDE_NUMBER}}/{{TOTAL_SLIDES}}</div>
  <div class="content-wrapper">
    <div class="star-icon">
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <polygon points="50,0 54,42 100,50 54,58 50,100 46,58 0,50 46,42" />
      </svg>
    </div>
    <h1 class="headline">{{TITLE}}</h1>
    <span class="highlight-box">{{CONTENT}}</span>
  </div>
  <div class="arrow-container">
    <div class="arrow-line"></div>
  </div>
</body>
</html>`,

  purple_accent: `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width={{WIDTH}}, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #E8E6F2;
      --ink: #0A0A0A;
      --purple: #9B8FD9;
      --pink-dot: #E91E8C;
      --white: #FFFFFF;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: {{WIDTH}}px;
      height: {{HEIGHT}}px;
      background: var(--bg);
      font-family: 'Inter', -apple-system, sans-serif;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .header {
      position: absolute;
      top: 60px;
      left: 70px;
      right: 70px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 10;
    }
    .logo {
      font-family: 'Inter', sans-serif;
      font-size: 42px;
      font-weight: 800;
      color: var(--ink);
      letter-spacing: -1px;
    }
    .logo::after { content: '.'; color: var(--ink); }
    .arrow-right {
      width: 50px;
      height: 2px;
      background: var(--ink);
      position: relative;
    }
    .arrow-right::after {
      content: '';
      position: absolute;
      right: -2px;
      top: -7px;
      width: 16px;
      height: 16px;
      border-right: 2px solid var(--ink);
      border-top: 2px solid var(--ink);
      transform: rotate(45deg);
    }
    .content-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 160px 70px 200px;
    }
    .headline {
      font-family: 'Inter', sans-serif;
      font-size: 92px;
      font-weight: 800;
      line-height: 1.0;
      color: var(--ink);
      letter-spacing: -4px;
    }
    .accent {
      display: inline-block;
      background: var(--purple);
      color: var(--white);
      padding: 12px 28px;
      font-weight: 800;
      transform: rotate(-3deg);
      box-shadow: 6px 8px 0px rgba(0,0,0,0.15);
      margin: 10px 0;
      position: relative;
      letter-spacing: -2px;
    }
    .pink-dot {
      display: inline-block;
      width: 18px;
      height: 18px;
      background: var(--pink-dot);
      border-radius: 50%;
      margin-left: 8px;
      vertical-align: middle;
    }
    .content {
      font-family: 'Inter', sans-serif;
      font-size: 34px;
      font-weight: 500;
      line-height: 1.5;
      color: var(--ink);
      margin-top: 40px;
      max-width: 700px;
      opacity: 0.85;
    }
    .footer {
      position: absolute;
      bottom: 60px;
      left: 70px;
      right: 70px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .cta-button {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: var(--white);
      color: var(--ink);
      padding: 16px 28px;
      border-radius: 12px;
      font-family: 'Inter', sans-serif;
      font-size: 18px;
      font-weight: 600;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    .cta-button::before { content: '↗'; font-size: 16px; }
    .slide-counter {
      font-family: 'Inter', sans-serif;
      font-size: 16px;
      font-weight: 500;
      color: var(--ink);
      opacity: 0.5;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">K</div>
    <div class="arrow-right"></div>
  </div>
  <div class="content-wrapper">
    <h1 class="headline">{{TITLE}}<span class="pink-dot"></span></h1>
    <p class="content">{{CONTENT}}</p>
  </div>
  <div class="footer">
    <div class="cta-button">Swipe to learn</div>
    <div class="slide-counter">{{SLIDE_NUMBER}}/{{TOTAL_SLIDES}}</div>
  </div>
</body>
</html>`,

  quote_doodle: `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width={{WIDTH}}, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #F5F3EE;
      --ink: #0A0A0A;
      --gray: #666666;
      --green: #A3E635;
      --green-dark: #1A1A1A;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: {{WIDTH}}px;
      height: {{HEIGHT}}px;
      background: var(--bg);
      font-family: 'Inter', -apple-system, sans-serif;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .header {
      position: absolute;
      top: 50px;
      left: 60px;
      right: 60px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      z-index: 10;
    }
    .author-info { display: flex; align-items: center; gap: 16px; }
    .avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--green) 0%, #65A30D 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: 700;
      color: var(--ink);
    }
    .author-text { display: flex; flex-direction: column; }
    .author-name { font-size: 22px; font-weight: 700; color: var(--ink); }
    .author-role { font-size: 16px; font-weight: 500; color: var(--gray); }
    .content-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 180px 70px 250px;
    }
    .quote-mark {
      font-family: Georgia, serif;
      font-size: 160px;
      font-weight: 700;
      color: var(--ink);
      line-height: 0.5;
      margin-bottom: 20px;
      margin-left: -15px;
    }
    .headline {
      font-family: 'Inter', sans-serif;
      font-size: 82px;
      font-weight: 900;
      line-height: 1.05;
      color: var(--ink);
      letter-spacing: -3px;
      max-width: 850px;
    }
    .dashed-arrow {
      position: absolute;
      right: 180px;
      top: 55%;
      width: 200px;
      height: 200px;
    }
    .dashed-arrow svg { width: 100%; height: 100%; }
    .dashed-arrow path {
      fill: none;
      stroke: var(--ink);
      stroke-width: 3;
      stroke-dasharray: 12, 8;
      stroke-linecap: round;
    }
    .content {
      font-family: 'Inter', sans-serif;
      font-size: 32px;
      font-weight: 500;
      line-height: 1.5;
      color: var(--gray);
      margin-top: 40px;
      max-width: 700px;
    }
    .accent { color: var(--ink); font-weight: 700; }
    .cta-circle {
      position: absolute;
      bottom: 100px;
      right: 100px;
      width: 80px;
      height: 80px;
      background: var(--green-dark);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .cta-circle svg {
      width: 28px;
      height: 28px;
      stroke: var(--green);
      fill: none;
      stroke-width: 2.5;
    }
    .footer {
      position: absolute;
      bottom: 50px;
      left: 60px;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      color: var(--gray);
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="author-info">
      <div class="avatar">S</div>
      <div class="author-text">
        <span class="author-name">Swipely</span>
        <span class="author-role">AI Carousel</span>
      </div>
    </div>
  </div>
  <div class="content-wrapper">
    <div class="quote-mark">"</div>
    <h1 class="headline">{{TITLE}}</h1>
    <p class="content">{{CONTENT}}</p>
  </div>
  <div class="dashed-arrow">
    <svg viewBox="0 0 200 200">
      <path d="M 20 100 Q 100 20, 100 100 Q 100 160, 140 180 L 160 160 M 140 180 L 130 155"/>
    </svg>
  </div>
  <div class="cta-circle">
    <svg viewBox="0 0 24 24">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  </div>
  <div class="footer">{{SLIDE_NUMBER}}/{{TOTAL_SLIDES}}</div>
</body>
</html>`,

  speech_bubble: `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width={{WIDTH}}, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #F8F8F8;
      --ink: #1A1A1A;
      --orange: #F26B3A;
      --white: #FFFFFF;
      --gray: #888888;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: {{WIDTH}}px;
      height: {{HEIGHT}}px;
      background: var(--bg);
      font-family: 'Inter', -apple-system, sans-serif;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    body::before {
      content: '';
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
      opacity: 0.04;
      pointer-events: none;
      z-index: 0;
    }
    .header {
      position: absolute;
      top: 60px;
      left: 70px;
      z-index: 10;
    }
    .logo { display: flex; align-items: center; gap: 12px; }
    .logo-text {
      font-family: 'Inter', sans-serif;
      font-size: 26px;
      font-weight: 700;
      color: var(--ink);
    }
    .content-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 150px 70px;
      position: relative;
      z-index: 5;
    }
    .quote-container { display: flex; align-items: center; gap: 0; }
    .speech-bubble {
      width: 280px;
      height: 280px;
      background: var(--orange);
      border-radius: 20px 20px 20px 0;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      flex-shrink: 0;
    }
    .speech-bubble::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: -30px;
      width: 60px;
      height: 60px;
      background: var(--orange);
      border-radius: 0 0 60px 0;
      clip-path: polygon(100% 0, 100% 100%, 0 100%);
    }
    .bubble-quotes {
      font-family: Georgia, serif;
      font-size: 180px;
      font-weight: 700;
      color: var(--white);
      line-height: 0.7;
      opacity: 0.95;
    }
    .quote-box {
      background: var(--white);
      padding: 45px 50px;
      border-radius: 30px;
      max-width: 520px;
      margin-left: -40px;
      box-shadow: 0 10px 60px rgba(0,0,0,0.08);
      position: relative;
      z-index: 2;
    }
    .quote-text {
      font-family: 'Inter', sans-serif;
      font-size: 36px;
      font-weight: 700;
      line-height: 1.35;
      color: var(--ink);
      margin-bottom: 20px;
    }
    .quote-author {
      font-family: 'Inter', sans-serif;
      font-size: 24px;
      font-weight: 600;
      color: var(--orange);
    }
    .accent { color: var(--orange); }
    .footer {
      position: absolute;
      bottom: 60px;
      left: 70px;
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 10;
    }
    .slide-counter {
      position: absolute;
      bottom: 65px;
      right: 200px;
      font-family: 'Inter', sans-serif;
      font-size: 16px;
      font-weight: 500;
      color: var(--gray);
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      <span class="logo-text">Swipely</span>
    </div>
  </div>
  <div class="content-wrapper">
    <div class="quote-container">
      <div class="speech-bubble">
        <span class="bubble-quotes">,,</span>
      </div>
      <div class="quote-box">
        <p class="quote-text">{{TITLE}}</p>
        <span class="quote-author">{{CONTENT}}</span>
      </div>
    </div>
  </div>
  <div class="slide-counter">{{SLIDE_NUMBER}}/{{TOTAL_SLIDES}}</div>
</body>
</html>`,

  grid_multi: `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width={{WIDTH}}, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #FAFAFA;
      --ink: #0A0A0A;
      --pink: #F9A8D4;
      --lime: #D4F542;
      --blue: #60A5FA;
      --gray: #888888;
      --white: #FFFFFF;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: {{WIDTH}}px;
      height: {{HEIGHT}}px;
      background: var(--bg);
      font-family: 'Inter', -apple-system, sans-serif;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    body::before {
      content: '';
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background-image:
        linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px);
      background-size: 40px 40px;
      z-index: 0;
    }
    .deco-lines {
      position: absolute;
      top: 40px;
      right: 40px;
      width: 180px;
      height: 180px;
      z-index: 1;
    }
    .deco-line {
      position: absolute;
      width: 200px;
      height: 12px;
      background: var(--lime);
      border-radius: 6px;
      transform-origin: right center;
    }
    .deco-line:nth-child(1) { top: 0; transform: rotate(-25deg); }
    .deco-line:nth-child(2) { top: 25px; transform: rotate(-25deg); }
    .deco-line:nth-child(3) { top: 50px; transform: rotate(-25deg); }
    .deco-line:nth-child(4) { top: 75px; transform: rotate(-25deg); opacity: 0.5; }
    .header {
      position: absolute;
      top: 60px;
      left: 70px;
      display: flex;
      align-items: center;
      gap: 16px;
      z-index: 10;
    }
    .avatar {
      width: 70px;
      height: 70px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--pink) 0%, var(--lime) 100%);
      border: 4px solid var(--white);
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      font-weight: 800;
      color: var(--ink);
    }
    .content-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 200px 70px 250px;
      position: relative;
      z-index: 5;
    }
    .headline {
      font-family: 'Inter', sans-serif;
      font-size: 88px;
      font-weight: 800;
      line-height: 1.05;
      color: var(--ink);
      letter-spacing: -3px;
      max-width: 850px;
    }
    .accent {
      display: inline-block;
      background: var(--lime);
      padding: 4px 16px;
      transform: rotate(-2deg);
      position: relative;
    }
    .accent::after {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 15%;
      width: 70%;
      height: 3px;
      background: var(--blue);
      border-radius: 2px;
    }
    .content {
      font-family: 'Inter', sans-serif;
      font-size: 32px;
      font-weight: 500;
      line-height: 1.5;
      color: var(--gray);
      margin-top: 50px;
      max-width: 700px;
    }
    .footer {
      position: absolute;
      bottom: 60px;
      left: 70px;
      right: 70px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 10;
    }
    .swipe-button {
      display: inline-flex;
      align-items: center;
      background: var(--white);
      border: 2px solid var(--ink);
      border-radius: 50px;
      padding: 16px 32px;
      font-family: 'Inter', sans-serif;
      font-size: 18px;
      font-weight: 600;
      color: var(--ink);
      letter-spacing: 1px;
    }
    .footer-right { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
    .footer-handle { font-size: 18px; font-weight: 600; color: var(--ink); }
  </style>
</head>
<body>
  <div class="deco-lines">
    <div class="deco-line"></div>
    <div class="deco-line"></div>
    <div class="deco-line"></div>
    <div class="deco-line"></div>
  </div>
  <div class="header">
    <div class="avatar">S</div>
  </div>
  <div class="content-wrapper">
    <h1 class="headline">{{TITLE}}</h1>
    <p class="content">{{CONTENT}}</p>
  </div>
  <div class="footer">
    <div class="swipe-button">SWIPE TO LEARN</div>
    <div class="footer-right">
      <span class="footer-handle">{{SLIDE_NUMBER}}/{{TOTAL_SLIDES}}</span>
    </div>
  </div>
</body>
</html>`,

  receipt: `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width={{WIDTH}}, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #E8E8E8;
      --paper: #FFFFFF;
      --ink: #1A1A1A;
      --coral: #E8725C;
      --gray: #888888;
      --light-gray: #CCCCCC;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: {{WIDTH}}px;
      height: {{HEIGHT}}px;
      background: var(--bg);
      font-family: 'Inter', -apple-system, sans-serif;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    body::before {
      content: '';
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
      opacity: 0.15;
      pointer-events: none;
      z-index: 0;
    }
    .receipt {
      width: 680px;
      background: var(--paper);
      padding: 60px 50px 40px;
      position: relative;
      z-index: 5;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15), 0 8px 25px rgba(0,0,0,0.1);
    }
    .receipt::before {
      content: '';
      position: absolute;
      top: -15px;
      left: 0;
      width: 100%;
      height: 30px;
      background: linear-gradient(135deg, var(--paper) 25%, transparent 25%),
                  linear-gradient(225deg, var(--paper) 25%, transparent 25%);
      background-size: 20px 30px;
    }
    .receipt::after {
      content: '';
      position: absolute;
      bottom: -15px;
      left: 0;
      width: 100%;
      height: 30px;
      background: linear-gradient(315deg, var(--paper) 25%, transparent 25%),
                  linear-gradient(45deg, var(--paper) 25%, transparent 25%);
      background-size: 20px 30px;
    }
    .receipt-header { text-align: center; margin-bottom: 30px; }
    .logo {
      font-family: 'Inter', sans-serif;
      font-size: 28px;
      font-weight: 800;
      color: var(--ink);
      letter-spacing: 2px;
    }
    .separator {
      border: none;
      border-top: 2px dashed var(--light-gray);
      margin: 25px 0;
    }
    .headline {
      font-family: 'Inter', sans-serif;
      font-size: 52px;
      font-weight: 800;
      line-height: 1.15;
      color: var(--coral);
      text-align: center;
      text-transform: uppercase;
      letter-spacing: -1px;
      margin: 30px 0;
    }
    .content {
      font-family: 'Inter', sans-serif;
      font-size: 24px;
      font-weight: 500;
      line-height: 1.5;
      color: var(--ink);
      text-align: center;
      margin: 25px 0;
    }
    .accent { color: var(--coral); font-weight: 700; }
    .barcode {
      display: flex;
      justify-content: center;
      gap: 2px;
      margin: 30px 0 15px;
      height: 60px;
    }
    .bar { background: var(--ink); height: 100%; }
    .bar-thin { width: 2px; }
    .bar-medium { width: 4px; }
    .bar-thick { width: 6px; }
    .bar-space { width: 3px; background: transparent; }
    .receipt-url {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      font-weight: 400;
      color: var(--gray);
      text-align: center;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="receipt-header">
      <div class="logo">Swipely</div>
    </div>
    <hr class="separator">
    <h1 class="headline">{{TITLE}}</h1>
    <hr class="separator">
    <p class="content">{{CONTENT}}</p>
    <hr class="separator">
    <div class="barcode">
      <div class="bar bar-thick"></div>
      <div class="bar bar-space"></div>
      <div class="bar bar-thin"></div>
      <div class="bar bar-space"></div>
      <div class="bar bar-medium"></div>
      <div class="bar bar-thin"></div>
      <div class="bar bar-space"></div>
      <div class="bar bar-thick"></div>
      <div class="bar bar-space"></div>
      <div class="bar bar-thin"></div>
      <div class="bar bar-medium"></div>
      <div class="bar bar-space"></div>
      <div class="bar bar-thick"></div>
    </div>
    <p class="receipt-url">swipely.ai • {{SLIDE_NUMBER}}/{{TOTAL_SLIDES}}</p>
  </div>
</body>
</html>`,

  lime_checklist: `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width={{WIDTH}}, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #D4F542;
      --ink: #0A0A0A;
      --paper: #F5F0E6;
      --paper-line: #E0DBD0;
      --white: #FFFFFF;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: {{WIDTH}}px;
      height: {{HEIGHT}}px;
      background: var(--bg);
      font-family: 'Inter', -apple-system, sans-serif;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      padding: 60px;
    }
    .title-badge {
      background: var(--ink);
      color: var(--white);
      padding: 20px 40px;
      border-radius: 16px;
      font-family: 'Inter', sans-serif;
      font-size: 42px;
      font-weight: 800;
      text-align: center;
      display: inline-block;
      margin: 80px auto 20px;
      max-width: 90%;
      line-height: 1.2;
    }
    .arrow-connector {
      width: 3px;
      height: 40px;
      background: var(--ink);
      margin: 0 auto;
      position: relative;
    }
    .arrow-connector::after {
      content: '';
      position: absolute;
      bottom: -12px;
      left: 50%;
      transform: translateX(-50%);
      border-left: 10px solid transparent;
      border-right: 10px solid transparent;
      border-top: 14px solid var(--ink);
    }
    .notepad {
      background: var(--paper);
      border-radius: 20px;
      padding: 50px 45px;
      margin: 30px 40px;
      flex: 1;
      max-height: 750px;
      position: relative;
      box-shadow: 8px 8px 0 rgba(0,0,0,0.15), 0 10px 40px rgba(0,0,0,0.1);
      border: 3px solid rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .notepad::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: repeating-linear-gradient(transparent, transparent 54px, var(--paper-line) 54px, var(--paper-line) 56px);
      pointer-events: none;
    }
    .checklist { list-style: none; position: relative; z-index: 1; }
    .checklist-item {
      display: flex;
      align-items: flex-start;
      gap: 20px;
      padding: 18px 0;
      font-family: 'Inter', sans-serif;
      font-size: 36px;
      font-weight: 700;
      color: var(--ink);
      line-height: 1.3;
    }
    .checkbox {
      width: 36px;
      height: 36px;
      border: 3px solid var(--ink);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 4px;
    }
    .checkbox svg {
      width: 22px;
      height: 22px;
      stroke: var(--ink);
      stroke-width: 3;
      fill: none;
    }
    .accent { text-decoration: underline; text-decoration-thickness: 3px; text-underline-offset: 4px; }
    .footer {
      position: absolute;
      bottom: 50px;
      left: 60px;
      right: 60px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .cta-button {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: var(--white);
      color: var(--ink);
      padding: 14px 24px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    .cta-button::before { content: '↗'; font-size: 14px; }
    .slide-counter { font-size: 16px; font-weight: 600; color: var(--ink); opacity: 0.6; }
  </style>
</head>
<body>
  <div class="title-badge">{{TITLE}}</div>
  <div class="arrow-connector"></div>
  <div class="notepad">
    <ul class="checklist">
      <li class="checklist-item">
        <div class="checkbox">
          <svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>
        </div>
        <span>{{CONTENT}}</span>
      </li>
    </ul>
  </div>
  <div class="footer">
    <div class="cta-button">Swipe for more</div>
    <div class="slide-counter">{{SLIDE_NUMBER}}/{{TOTAL_SLIDES}}</div>
  </div>
</body>
</html>`,

  app_list: `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width={{WIDTH}}, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #E8E6F2;
      --ink: #0A0A0A;
      --blue: #6366F1;
      --white: #FFFFFF;
      --gray: #888888;
      --border: rgba(0,0,0,0.08);
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: {{WIDTH}}px;
      height: {{HEIGHT}}px;
      background: var(--bg);
      font-family: 'Inter', -apple-system, sans-serif;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      padding: 50px 60px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 50px;
    }
    .logo { font-size: 26px; font-weight: 700; color: var(--ink); }
    .menu-icon { display: flex; flex-direction: column; gap: 6px; }
    .menu-line { width: 32px; height: 3px; background: var(--ink); border-radius: 2px; }
    .menu-line:nth-child(2) { width: 24px; }
    .main-title {
      font-family: 'Inter', sans-serif;
      font-size: 110px;
      font-weight: 900;
      line-height: 0.95;
      color: var(--ink);
      letter-spacing: -5px;
      margin-bottom: 20px;
    }
    .arrow-indicator { font-size: 36px; color: var(--ink); margin-bottom: 30px; opacity: 0.6; }
    .search-bar {
      display: flex;
      align-items: center;
      background: var(--ink);
      border-radius: 50px;
      padding: 8px 10px 8px 30px;
      margin-bottom: 50px;
      max-width: 550px;
    }
    .search-text {
      flex: 1;
      font-size: 20px;
      font-weight: 500;
      color: var(--white);
      opacity: 0.8;
    }
    .search-button {
      width: 52px;
      height: 52px;
      background: var(--blue);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .search-button svg {
      width: 24px;
      height: 24px;
      stroke: var(--white);
      fill: none;
      stroke-width: 2.5;
    }
    .list-container { flex: 1; }
    .list-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 28px 0;
      border-bottom: 1px solid var(--border);
    }
    .item-left { display: flex; align-items: center; gap: 20px; }
    .item-dot { width: 16px; height: 16px; background: var(--blue); border-radius: 50%; }
    .item-text { font-size: 30px; font-weight: 600; color: var(--ink); }
    .item-arrow { font-size: 28px; color: var(--ink); opacity: 0.4; }
    .accent { color: var(--blue); }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 30px;
    }
    .slide-counter { font-size: 16px; font-weight: 500; color: var(--gray); }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Swipely</div>
    <div class="menu-icon">
      <div class="menu-line"></div>
      <div class="menu-line"></div>
    </div>
  </div>
  <h1 class="main-title">{{TITLE}}</h1>
  <div class="arrow-indicator">↙</div>
  <div class="search-bar">
    <span class="search-text">What can we do for you?</span>
    <div class="search-button">
      <svg viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8"/>
        <path d="M21 21l-4.35-4.35"/>
      </svg>
    </div>
  </div>
  <div class="list-container">
    <div class="list-item">
      <div class="item-left">
        <div class="item-dot"></div>
        <span class="item-text">{{CONTENT}}</span>
      </div>
      <span class="item-arrow">›</span>
    </div>
  </div>
  <div class="footer">
    <div class="slide-counter">{{SLIDE_NUMBER}}/{{TOTAL_SLIDES}}</div>
  </div>
</body>
</html>`,

  paper_image: `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width={{WIDTH}}, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #F5F3EE;
      --ink: #1A1A1A;
      --orange: #E8725C;
      --gray: #888888;
      --white: #FFFFFF;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: {{WIDTH}}px;
      height: {{HEIGHT}}px;
      background: var(--bg);
      font-family: 'Inter', -apple-system, sans-serif;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    body::before {
      content: '';
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
      opacity: 0.12;
      pointer-events: none;
      z-index: 0;
    }
    body::after {
      content: '';
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background:
        linear-gradient(135deg, transparent 40%, rgba(0,0,0,0.03) 45%, transparent 50%),
        linear-gradient(225deg, transparent 40%, rgba(255,255,255,0.5) 45%, transparent 50%),
        radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.3) 0%, transparent 40%),
        radial-gradient(ellipse at 70% 80%, rgba(0,0,0,0.04) 0%, transparent 40%);
      pointer-events: none;
      z-index: 0;
    }
    .header {
      position: absolute;
      top: 50px;
      left: 0; right: 0;
      text-align: center;
      z-index: 10;
    }
    .logo { font-size: 28px; font-weight: 700; color: var(--ink); letter-spacing: -0.5px; }
    .logo-dot { color: var(--orange); }
    .content-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      padding: 160px 70px 200px;
      position: relative;
      z-index: 5;
    }
    .headline {
      font-family: 'Inter', sans-serif;
      font-size: 86px;
      font-weight: 900;
      line-height: 1.05;
      color: var(--ink);
      letter-spacing: -3px;
      max-width: 900px;
      text-align: center;
      margin: 0 auto;
    }
    .accent { color: var(--orange); }
    .dashed-arrow {
      position: absolute;
      right: 200px;
      top: 45%;
      width: 150px;
      height: 180px;
    }
    .dashed-arrow svg { width: 100%; height: 100%; }
    .dashed-arrow path {
      fill: none;
      stroke: var(--ink);
      stroke-width: 3;
      stroke-dasharray: 10, 8;
      stroke-linecap: round;
    }
    .content {
      font-family: 'Inter', sans-serif;
      font-size: 32px;
      font-weight: 500;
      line-height: 1.5;
      color: var(--gray);
      text-align: center;
      margin-top: 60px;
      max-width: 700px;
      margin-left: auto;
      margin-right: auto;
    }
    .footer {
      position: absolute;
      bottom: 50px;
      right: 70px;
      z-index: 10;
    }
    .slide-counter { font-size: 16px; font-weight: 500; color: var(--gray); }
  </style>
</head>
<body>
  <div class="header">
    <span class="logo">swipely<span class="logo-dot">.</span></span>
  </div>
  <div class="content-wrapper">
    <h1 class="headline">{{TITLE}}</h1>
    <p class="content">{{CONTENT}}</p>
  </div>
  <div class="dashed-arrow">
    <svg viewBox="0 0 150 180">
      <path d="M 20 10 Q 80 40, 60 90 Q 40 140, 90 160 L 110 145 M 90 160 L 75 140"/>
    </svg>
  </div>
  <div class="footer">
    <span class="slide-counter">{{SLIDE_NUMBER}}/{{TOTAL_SLIDES}}</span>
  </div>
</body>
</html>`,
};

export function getTemplate(name: string): string | null {
  return templates[name] || null;
}

export function renderTemplate(
  templateName: string,
  data: {
    title: string;
    content: string;
    slideNumber: number;
    totalSlides: number;
    width: number;
    height: number;
  }
): string | null {
  const template = getTemplate(templateName);
  if (!template) return null;

  return template
    .replace(/\{\{TITLE\}\}/g, data.title)
    .replace(/\{\{CONTENT\}\}/g, data.content)
    .replace(/\{\{SLIDE_NUMBER\}\}/g, String(data.slideNumber))
    .replace(/\{\{TOTAL_SLIDES\}\}/g, String(data.totalSlides))
    .replace(/\{\{WIDTH\}\}/g, String(data.width))
    .replace(/\{\{HEIGHT\}\}/g, String(data.height))
    .replace(/\{\{TYPE\}\}/g, 'INSIGHT');
}

export const templateList = Object.keys(templates);
