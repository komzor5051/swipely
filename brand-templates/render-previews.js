const puppeteer = require('../swipely-bot/node_modules/puppeteer');
const path = require('path');
const { pathToFileURL } = require('url');

async function render() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const files = ['preview-kinfolk', 'preview-swiss', 'preview-wabi', 'preview-nikkei'];
  const outputDir = path.join(__dirname, '..', 'swipely-nextjs', 'public', 'previews');

  for (const name of files) {
    const filePath = path.join(__dirname, `${name}.html`);
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });
    await page.goto(pathToFileURL(filePath).href, { waitUntil: 'networkidle0' });
    await page.evaluateHandle('document.fonts.ready');
    await new Promise(r => setTimeout(r, 800));
    const templateName = name.replace('preview-', '');
    const outPath = path.join(outputDir, `${templateName}.png`);
    await page.screenshot({ path: outPath, type: 'png', clip: { x: 0, y: 0, width: 1080, height: 1080 } });
    await page.close();
    console.log(`rendered ${templateName}.png`);
  }

  await browser.close();
  console.log('done');
}

render().catch(console.error);
