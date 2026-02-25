const puppeteer = require('../swipely-bot/node_modules/puppeteer');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

async function render() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const templatesDir = __dirname;
  const outputDir = path.join(templatesDir, 'output');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.html'));
  console.log(`\n🎨 Рендеринг ${files.length} шаблонов...\n`);

  for (const file of files) {
    const filePath = path.join(templatesDir, file);
    const html = fs.readFileSync(filePath, 'utf8');
    const wMatch = html.match(/width:\s*(\d+)px/);
    const hMatch = html.match(/height:\s*(\d+)px/);
    const w = wMatch ? parseInt(wMatch[1]) : 1080;
    const h = hMatch ? parseInt(hMatch[1]) : 1080;

    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 2 });

    // Use pathToFileURL to handle spaces in paths
    const fileUrl = pathToFileURL(filePath).href;
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });
    await page.evaluateHandle('document.fonts.ready');
    await new Promise(r => setTimeout(r, 500));

    const outPath = path.join(outputDir, file.replace('.html', '.png'));
    await page.screenshot({ path: outPath, type: 'png', clip: { x: 0, y: 0, width: w, height: h } });
    await page.close();
    console.log(`✅ ${file} → output/${file.replace('.html', '.png')} (${w}x${h})`);
  }

  await browser.close();
  console.log(`\n✨ Готово! Файлы в: ${outputDir}\n`);
}

render().catch(console.error);
