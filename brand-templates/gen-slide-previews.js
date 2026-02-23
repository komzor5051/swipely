const puppeteer = require('../swipely-bot/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../swipely-nextjs/public/previews');

const CHAPTER_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1080px; height: 1080px; overflow: hidden; }
  .slide {
    width: 1080px; height: 1080px;
    background: #FAF7F2;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 80px 100px;
    position: relative; overflow: hidden;
  }
  .watermark {
    position: absolute; bottom: -60px; right: -20px;
    font-family: 'Inter', sans-serif;
    font-size: 420px; font-weight: 900;
    color: #EDE9E3; line-height: 1;
    user-select: none; pointer-events: none;
  }
  .top-line {
    position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, #8B7355 0%, #C8B89A 60%, transparent 100%);
  }
  .content { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; text-align: center; }
  h1 {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: 88px; font-weight: 400; line-height: 1.07;
    letter-spacing: -0.5px; color: #1A1814;
    margin-bottom: 44px;
  }
  .rule { width: 48px; height: 1px; background: #8B7355; margin-bottom: 44px; }
  p {
    font-family: 'Inter', sans-serif;
    font-size: 36px; font-weight: 300; line-height: 1.7;
    color: #5A5246; max-width: 800px;
  }
</style>
</head>
<body>
<div class="slide">
  <div class="top-line"></div>
  <div class="watermark">1</div>
  <div class="content">
    <h1>Всё начинается <em style="color:#8B7355">с одной идеи</em></h1>
    <div class="rule"></div>
    <p>Самые большие перемены начинаются с маленького решения. Вот как это работает</p>
  </div>
</div>
</body>
</html>`;

const DISPATCH_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Space+Grotesk:wght@400;500;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1080px; height: 1080px; overflow: hidden; }
  .slide {
    width: 1080px; height: 1080px;
    background: #0D0D18;
    display: flex; flex-direction: column;
    position: relative; overflow: hidden;
  }
  .glow {
    position: absolute; top: -200px; left: 50%;
    transform: translateX(-50%);
    width: 800px; height: 600px;
    background: radial-gradient(ellipse, rgba(91,79,232,0.25) 0%, transparent 70%);
    pointer-events: none;
  }
  .top-stripe {
    width: 100%; height: 5px;
    background: linear-gradient(90deg, #5B4FE8 0%, rgba(91,79,232,0.4) 100%);
    flex-shrink: 0;
  }
  .content {
    position: relative; z-index: 1;
    flex: 1; display: flex; flex-direction: column;
    justify-content: center; padding: 60px 72px;
  }
  .label {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 18px; font-weight: 600;
    color: #5B4FE8; letter-spacing: 4px;
    text-transform: uppercase; margin-bottom: 36px;
  }
  h1 {
    font-family: 'Syne', sans-serif;
    font-size: 100px; font-weight: 800; line-height: 1.0;
    letter-spacing: -3px; color: #FFFFFF;
    margin-bottom: 48px;
    overflow-wrap: anywhere; word-break: break-word;
  }
  h1 em { color: #5B4FE8; font-style: normal; }
  p {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 32px; font-weight: 400; line-height: 1.65;
    color: rgba(255,255,255,0.55); max-width: 840px;
  }
</style>
</head>
<body>
<div class="slide">
  <div class="glow"></div>
  <div class="top-stripe"></div>
  <div class="content">
    <div class="label">Dispatch</div>
    <h1>3 вещи, которые <em>меняют</em> всё</h1>
    <p>Разбираем то, о чём не говорят вслух — но все думают</p>
  </div>
</div>
</body>
</html>`;

const FRAME_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1080px; height: 1080px; overflow: hidden; }
  .slide {
    width: 1080px; height: 1080px;
    background: #131316;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    position: relative; overflow: hidden;
  }
  .glow {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 700px; height: 700px;
    background: radial-gradient(ellipse, rgba(255,215,100,0.06) 0%, transparent 70%);
    pointer-events: none;
  }
  .frame {
    position: absolute;
    top: 48px; left: 48px; right: 48px; bottom: 48px;
    border: 1px solid rgba(255,215,100,0.25);
    box-shadow: inset 0 0 60px rgba(255,215,100,0.04);
  }
  .corner {
    position: absolute;
    width: 28px; height: 28px;
    border-color: rgba(255,215,100,0.7);
    border-style: solid;
  }
  .corner-tl { top: 44px; left: 44px; border-width: 2px 0 0 2px; }
  .corner-tr { top: 44px; right: 44px; border-width: 2px 2px 0 0; }
  .corner-bl { bottom: 44px; left: 44px; border-width: 0 0 2px 2px; }
  .corner-br { bottom: 44px; right: 44px; border-width: 0 2px 2px 0; }
  .content {
    position: relative; z-index: 1;
    display: flex; flex-direction: column;
    align-items: center; text-align: center;
    padding: 0 120px;
  }
  .ornament {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: 28px; color: rgba(255,215,100,0.5);
    letter-spacing: 8px; margin-bottom: 40px;
  }
  h1 {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: 96px; font-weight: 400; line-height: 1.08;
    letter-spacing: -0.5px; color: #F5F0E8;
    margin-bottom: 44px;
    overflow-wrap: anywhere; word-break: break-word;
  }
  h1 em { color: #FFD764; font-style: italic; }
  .rule { width: 48px; height: 1px; background: rgba(255,215,100,0.4); margin-bottom: 40px; }
  p {
    font-family: 'Inter', sans-serif;
    font-size: 32px; font-weight: 300; line-height: 1.7;
    color: rgba(245,240,232,0.5); max-width: 760px;
  }
</style>
</head>
<body>
<div class="slide">
  <div class="glow"></div>
  <div class="frame"></div>
  <div class="corner corner-tl"></div>
  <div class="corner corner-tr"></div>
  <div class="corner corner-bl"></div>
  <div class="corner corner-br"></div>
  <div class="content">
    <div class="ornament">✦</div>
    <h1>Момент, когда всё <em>изменилось</em></h1>
    <div class="rule"></div>
    <p>Некоторые идеи не ждут подходящего момента. Они его создают.</p>
  </div>
</div>
</body>
</html>`;

async function renderHTML(html, outputPath) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500)); // wait for Google Fonts
    await page.screenshot({ path: outputPath, type: 'png', fullPage: false });
    console.log(`✅ ${outputPath}`);
  } finally {
    await browser.close();
  }
}

async function main() {
  await renderHTML(CHAPTER_HTML, path.join(OUTPUT_DIR, 'chapter.png'));
  await renderHTML(DISPATCH_HTML, path.join(OUTPUT_DIR, 'dispatch.png'));
  await renderHTML(FRAME_HTML, path.join(OUTPUT_DIR, 'frame.png'));
  console.log('\n🎉 Preview images generated!');
}

main().catch(console.error);
