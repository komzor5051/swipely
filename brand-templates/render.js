const puppeteer = require('../swipely-bot/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

async function renderTemplate(htmlPath, outputPath, width = 1080, height = 1080) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    await page.setViewport({
      width,
      height,
      deviceScaleFactor: 2
    });

    const html = fs.readFileSync(htmlPath, 'utf-8');
    await page.setContent(html, { waitUntil: 'networkidle0' });

    await page.screenshot({
      path: outputPath,
      type: 'png',
      fullPage: false
    });

    console.log(`✅ Saved: ${outputPath}`);
  } finally {
    await browser.close();
  }
}

async function main() {
  const templatesDir = __dirname;

  // Render blue template
  await renderTemplate(
    path.join(templatesDir, 'template-blue.html'),
    path.join(templatesDir, 'swipely-brand-blue.png'),
    1080, 1080
  );

  // Render dark template
  await renderTemplate(
    path.join(templatesDir, 'template-dark.html'),
    path.join(templatesDir, 'swipely-brand-dark.png'),
    1080, 1080
  );

  console.log('\n🎉 All templates rendered!');
}

main().catch(console.error);
