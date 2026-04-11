const puppeteer = require('../swipely-bot/node_modules/puppeteer');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

async function render() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const templatesDir = __dirname;
  const outputDir = path.join(templatesDir, 'output');

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  const files = fs.readdirSync(templatesDir)
    .filter(f => f.startsWith('gallery-') && f.endsWith('.html'))
    .sort();

  console.log(`\n🎨 Рендеринг ${files.length} gallery-слайдов (1080×1920)...\n`);

  for (const file of files) {
    const filePath = path.join(templatesDir, file);
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 2 });

    const fileUrl = pathToFileURL(filePath).href;
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });
    await page.evaluateHandle('document.fonts.ready');
    await new Promise(r => setTimeout(r, 600));

    const outPath = path.join(outputDir, file.replace('.html', '.png'));
    await page.screenshot({ path: outPath, type: 'png', clip: { x: 0, y: 0, width: 1080, height: 1920 } });
    await page.close();
    console.log(`✅ ${file} → output/${file.replace('.html', '.png')}`);
  }

  await browser.close();
  console.log(`\n✨ Готово! 6 слайдов в: ${outputDir}\n`);
}

render().catch(console.error);
