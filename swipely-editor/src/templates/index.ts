// HTML templates for carousel slides
// Imported from swipely-bot/src/templates/

export const templates: Record<string, string> = {
  minimal_pop: `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width={{WIDTH}}, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@600;800;900&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --white: #FAFAFA;
      --black: #0A0A0A;
      --gray-light: #F0F0F0;
      --electric-pink: #FF2D6A;
      --electric-orange: #FF6B35;
      --accent-gradient: linear-gradient(135deg, var(--electric-pink) 0%, var(--electric-orange) 100%);
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: {{WIDTH}}px;
      height: {{HEIGHT}}px;
      background: var(--white);
      font-family: 'Manrope', sans-serif;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    body::before {
      content: '';
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background-image: radial-gradient(circle, rgba(10,10,10,0.04) 1.5px, transparent 1.5px);
      background-size: 32px 32px;
      z-index: 0;
      pointer-events: none;
    }
    .diagonal-slash {
      position: absolute;
      width: 1400px;
      height: 220px;
      background: var(--accent-gradient);
      transform: rotate(-12deg);
      top: 42%;
      left: -200px;
      z-index: 1;
      box-shadow: 0 30px 80px rgba(255, 45, 106, 0.25), 0 15px 40px rgba(255, 107, 53, 0.2);
    }
    .frame {
      position: absolute;
      top: 50px; left: 50px; right: 50px; bottom: 50px;
      border: 10px solid var(--black);
      z-index: 0;
      pointer-events: none;
    }
    .slide-counter {
      position: absolute;
      top: 85px;
      right: 90px;
      font-family: 'Unbounded', sans-serif;
      z-index: 10;
      text-align: right;
    }
    .slide-counter .current {
      font-size: 120px;
      font-weight: 900;
      color: var(--black);
      letter-spacing: -6px;
      line-height: 0.85;
      display: block;
    }
    .slide-counter .total {
      font-size: 32px;
      font-weight: 600;
      color: var(--black);
      opacity: 0.25;
      margin-top: 5px;
    }
    .content-wrapper {
      position: relative;
      z-index: 5;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 120px 90px;
      padding-right: 220px;
    }
    .headline {
      font-family: 'Unbounded', sans-serif;
      font-size: 82px;
      font-weight: 900;
      line-height: 0.95;
      color: var(--black);
      letter-spacing: -3px;
      margin-bottom: 50px;
      text-transform: uppercase;
      position: relative;
      max-width: 800px;
    }
    .headline::before {
      content: '\\2197';
      position: absolute;
      left: -65px;
      top: 0;
      font-size: 50px;
      color: var(--electric-pink);
      font-weight: 400;
      font-family: sans-serif;
    }
    .content {
      font-family: 'Manrope', sans-serif;
      font-size: 34px;
      font-weight: 500;
      line-height: 1.55;
      color: var(--black);
      max-width: 780px;
      position: relative;
    }
    .corner-mark {
      position: absolute;
      bottom: 90px;
      left: 90px;
      z-index: 10;
    }
    .corner-mark-line {
      width: 100px;
      height: 5px;
      background: var(--black);
    }
    .accent-dot {
      position: absolute;
      bottom: 100px;
      right: 100px;
      width: 32px;
      height: 32px;
      background: var(--accent-gradient);
      border-radius: 50%;
      z-index: 10;
      box-shadow: 0 8px 25px rgba(255, 45, 106, 0.45);
    }
    .watermark-arrow {
      position: absolute;
      top: 50%;
      right: 80px;
      transform: translateY(-50%);
      font-size: 300px;
      color: var(--black);
      opacity: 0.03;
      z-index: 0;
      font-weight: 900;
      line-height: 1;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <div class="frame"></div>
  <div class="diagonal-slash"></div>
  <div class="slide-counter">
    <span class="current">{{SLIDE_NUMBER}}</span>
    <span class="total">/{{TOTAL_SLIDES}}</span>
  </div>
  <div class="content-wrapper">
    <h1 class="headline">{{TITLE}}</h1>
    <p class="content">{{CONTENT}}</p>
  </div>
  <div class="corner-mark">
    <div class="corner-mark-line"></div>
  </div>
  <div class="accent-dot"></div>
  <div class="watermark-arrow">\u2192</div>
</body>
</html>`,

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

  darkest: `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width={{WIDTH}}, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --void: #050510;
      --deep: #0A0A1F;
      --surface: #12122A;
      --cyan: #00FFE5;
      --magenta: #FF00AA;
      --white: #FFFFFF;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: {{WIDTH}}px;
      height: {{HEIGHT}}px;
      background: linear-gradient(170deg, var(--void) 0%, var(--deep) 60%, var(--surface) 100%);
      font-family: 'Space Grotesk', sans-serif;
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
      background-image: linear-gradient(rgba(0,255,229,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,229,0.03) 1px, transparent 1px);
      background-size: 80px 80px;
      opacity: 0.6;
      pointer-events: none;
      z-index: 0;
    }
    body::after {
      content: '';
      position: absolute;
      width: 900px;
      height: 900px;
      background: radial-gradient(circle, rgba(0,255,229,0.1) 0%, rgba(255,0,170,0.05) 40%, transparent 70%);
      border-radius: 50%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 0;
      pointer-events: none;
    }
    .slide-counter {
      position: absolute;
      top: 60px;
      right: 85px;
      font-family: 'Unbounded', sans-serif;
      font-size: 32px;
      font-weight: 700;
      color: var(--cyan);
      letter-spacing: 6px;
      z-index: 10;
      text-shadow: 0 0 20px rgba(0,255,229,0.7), 0 0 40px rgba(0,255,229,0.4);
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
      font-size: 92px;
      font-weight: 900;
      line-height: 1.0;
      color: var(--white);
      margin-bottom: 55px;
      letter-spacing: -2px;
      text-transform: uppercase;
      max-width: 900px;
      text-shadow: 0 0 40px rgba(0,255,229,0.4), 0 0 80px rgba(0,255,229,0.2);
    }
    .headline::after {
      content: '';
      position: absolute;
      bottom: -20px;
      left: 0;
      width: 220px;
      height: 5px;
      background: linear-gradient(90deg, var(--cyan) 0%, transparent 100%);
      box-shadow: 0 0 20px var(--cyan), 0 0 40px var(--cyan);
    }
    .content {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 34px;
      font-weight: 400;
      line-height: 1.65;
      color: var(--white);
      position: relative;
      z-index: 2;
      max-width: 880px;
      opacity: 0.92;
    }
    .corner { position: absolute; width: 100px; height: 100px; z-index: 1; }
    .corner-tl { top: 70px; left: 70px; border-top: 4px solid var(--cyan); border-left: 4px solid var(--cyan); opacity: 0.5; }
    .corner-br { bottom: 70px; right: 70px; border-bottom: 4px solid var(--magenta); border-right: 4px solid var(--magenta); opacity: 0.5; }
    .particle { position: absolute; width: 6px; height: 6px; border-radius: 50%; opacity: 0.8; }
    .p1 { top: 220px; left: 140px; background: var(--cyan); box-shadow: 0 0 15px var(--cyan); }
    .p2 { top: 500px; right: 180px; background: var(--magenta); box-shadow: 0 0 15px var(--magenta); }
    .scanlines {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, transparent 1px, transparent 3px, rgba(0,0,0,0.12) 4px);
      pointer-events: none;
      z-index: 8;
      opacity: 0.4;
    }
  </style>
</head>
<body>
  <div class="scanlines"></div>
  <div class="slide-counter">{{SLIDE_NUMBER}}/{{TOTAL_SLIDES}}</div>
  <div class="content-wrapper">
    <h1 class="headline">{{TITLE}}</h1>
    <p class="content">{{CONTENT}}</p>
  </div>
  <div class="corner corner-tl"></div>
  <div class="corner corner-br"></div>
  <div class="particle p1"></div>
  <div class="particle p2"></div>
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
  <div class="slide-indicator">{{SLIDE_NUMBER}} \u2014 {{TOTAL_SLIDES}}</div>
  <div class="sidebar"><p class="sidebar-text">Swipely Editorial</p></div>
  <div class="dark-number">{{SLIDE_NUMBER}}</div>
  <div class="dot-pattern"></div>
  <div class="brand-mark">Swipely</div>
</body>
</html>`,

  zen: `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width={{WIDTH}}, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@300;500;700&family=Zen+Kaku+Gothic+New:wght@300;400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --paper: #FAF9F5;
      --ink: #1C1C1C;
      --stone: #8B8680;
      --bamboo: #6B7F5E;
      --sand: #D4CFC4;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: {{WIDTH}}px;
      height: {{HEIGHT}}px;
      background: var(--paper);
      font-family: 'Zen Kaku Gothic New', sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 120px 110px;
      position: relative;
      overflow: hidden;
    }
    .slide-counter {
      position: absolute;
      top: 75px;
      right: 110px;
      font-size: 20px;
      color: var(--stone);
      font-weight: 300;
      letter-spacing: 8px;
      z-index: 10;
    }
    .vertical-text {
      position: absolute;
      right: 100px;
      top: 50%;
      transform: translateY(-50%);
      writing-mode: vertical-rl;
      font-family: 'Noto Serif JP', serif;
      font-size: 24px;
      color: var(--sand);
      letter-spacing: 16px;
      z-index: 5;
    }
    .content-wrapper { position: relative; z-index: 5; max-width: 800px; flex: 1; display: flex; flex-direction: column; justify-content: center; }
    .headline {
      font-family: 'Noto Serif JP', serif;
      font-size: 82px;
      font-weight: 500;
      line-height: 1.25;
      color: var(--ink);
      margin-bottom: 60px;
      letter-spacing: 3px;
      max-width: 750px;
    }
    .content {
      font-family: 'Zen Kaku Gothic New', sans-serif;
      font-size: 34px;
      font-weight: 300;
      line-height: 1.85;
      color: var(--ink);
      max-width: 700px;
      opacity: 0.85;
    }
    .enso {
      position: absolute;
      top: 160px;
      left: 90px;
      width: 150px;
      height: 150px;
      border: 4px solid var(--stone);
      border-radius: 50%;
      opacity: 0.12;
      z-index: 1;
      clip-path: polygon(0 0, 100% 0, 100% 100%, 20% 100%, 0 80%);
    }
    .horizon-line {
      position: absolute;
      bottom: 200px;
      left: 110px;
      width: 250px;
      height: 2px;
      background: linear-gradient(90deg, var(--stone), transparent);
      opacity: 0.25;
      z-index: 5;
    }
    .seal {
      position: absolute;
      bottom: 75px;
      left: 110px;
      width: 60px;
      height: 60px;
      border: 3px solid var(--bamboo);
      opacity: 0.3;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Noto Serif JP', serif;
      font-size: 26px;
      color: var(--bamboo);
      z-index: 5;
    }
  </style>
</head>
<body>
  <div class="slide-counter">{{SLIDE_NUMBER}} \u00B7 {{TOTAL_SLIDES}}</div>
  <div class="vertical-text">\u548C\u306E\u5FC3</div>
  <div class="content-wrapper">
    <h1 class="headline">{{TITLE}}</h1>
    <p class="content">{{CONTENT}}</p>
  </div>
  <div class="enso"></div>
  <div class="horizon-line"></div>
  <div class="seal">\u7985</div>
</body>
</html>`,

  memphis: `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width={{WIDTH}}, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Bowlby+One&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #FEF8ED;
      --pink: #FF6B9D;
      --yellow: #FFE156;
      --blue: #4ECDC4;
      --purple: #9B5DE5;
      --orange: #FF9F43;
      --black: #1A1A2E;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: {{WIDTH}}px;
      height: {{HEIGHT}}px;
      background: var(--bg);
      font-family: 'DM Sans', sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 100px 90px;
      position: relative;
      overflow: hidden;
    }
    body::before {
      content: '';
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background-image: radial-gradient(var(--black) 2px, transparent 2px);
      background-size: 35px 35px;
      opacity: 0.05;
      pointer-events: none;
      z-index: 0;
    }
    .slide-counter {
      position: absolute;
      top: 65px;
      right: 85px;
      font-family: 'Bowlby One', cursive;
      font-size: 64px;
      color: var(--purple);
      z-index: 10;
      text-shadow: 5px 5px 0 var(--yellow);
    }
    .content-wrapper { position: relative; z-index: 5; flex: 1; display: flex; flex-direction: column; justify-content: center; }
    .headline {
      font-family: 'Bowlby One', cursive;
      font-size: 88px;
      line-height: 1.05;
      color: var(--black);
      margin-bottom: 50px;
      text-transform: uppercase;
      position: relative;
      max-width: 850px;
    }
    .headline::after {
      content: '';
      position: absolute;
      bottom: -18px;
      left: 0;
      width: 280px;
      height: 16px;
      background: url("data:image/svg+xml,%3Csvg width='40' height='16' viewBox='0 0 40 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,8 Q10,0 20,8 T40,8' stroke='%23FF6B9D' stroke-width='5' fill='none'/%3E%3C/svg%3E") repeat-x;
    }
    .content {
      font-family: 'DM Sans', sans-serif;
      font-size: 36px;
      font-weight: 500;
      line-height: 1.6;
      color: var(--black);
      max-width: 820px;
      position: relative;
    }
    .shape { position: absolute; z-index: 1; }
    .circle-big { width: 320px; height: 320px; background: var(--yellow); border-radius: 50%; top: -80px; right: -80px; opacity: 0.95; }
    .rect-stripe {
      width: 140px; height: 200px;
      background: repeating-linear-gradient(45deg, var(--blue), var(--blue) 10px, var(--bg) 10px, var(--bg) 20px);
      bottom: 130px; left: 50px; transform: rotate(-12deg);
    }
    .circle-small { width: 100px; height: 100px; background: var(--pink); border-radius: 50%; bottom: 90px; right: 180px; }
    .triangle {
      width: 0; height: 0;
      border-left: 75px solid transparent;
      border-right: 75px solid transparent;
      border-bottom: 120px solid var(--purple);
      top: 280px; right: 90px; transform: rotate(18deg); opacity: 0.85;
    }
    .semi-circle {
      width: 120px; height: 60px;
      background: var(--blue);
      border-radius: 120px 120px 0 0;
      bottom: 60px; left: 240px; transform: rotate(-25deg);
    }
  </style>
</head>
<body>
  <div class="slide-counter">{{SLIDE_NUMBER}}</div>
  <div class="content-wrapper">
    <h1 class="headline">{{TITLE}}</h1>
    <p class="content">{{CONTENT}}</p>
  </div>
  <div class="shape circle-big"></div>
  <div class="shape rect-stripe"></div>
  <div class="shape circle-small"></div>
  <div class="shape triangle"></div>
  <div class="shape semi-circle"></div>
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
  <div class="slide-counter">{{SLIDE_NUMBER}} \u2014 {{TOTAL_SLIDES}}</div>
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
    .replace(/\{\{HEIGHT\}\}/g, String(data.height));
}

export const templateList = Object.keys(templates);
