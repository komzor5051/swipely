# Promo Posts Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Создать 5 HTML-шаблонов промо-постов 1080×1080 для Threads/Instagram, рендеримых в PNG через Puppeteer.

**Architecture:** Каждый пост — отдельный самодостаточный HTML файл в `brand-templates/`. Все 5 импортируют один `promo-shared.css` (iPhone mockup, layout, typography). Рендер: `cd brand-templates && node render-all.js`. Puppeteer берётся из `../swipely-bot/node_modules/puppeteer`.

**Tech Stack:** HTML/CSS, Google Fonts (Outfit 800 + Space Mono), Puppeteer (уже установлен в swipely-bot)

---

### Task 1: Shared CSS — iPhone mockup + layout

**Files:**
- Create: `brand-templates/promo-shared.css`

**Step 1: Создать файл со всеми shared стилями**

```css
/* promo-shared.css — shared styles for all 5 promo posts */

@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  width: 1080px;
  height: 1080px;
  background: #0D0D14;
  font-family: 'Outfit', sans-serif;
  position: relative;
  overflow: hidden;
}

/* Subtle grid texture */
.grid-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
  background-size: 54px 54px;
  z-index: 0;
}

/* Headline */
.headline {
  position: absolute;
  top: 88px;
  left: 80px;
  right: 80px;
  font-size: 100px;
  font-weight: 900;
  color: #FFFFFF;
  line-height: 0.98;
  letter-spacing: -4px;
  z-index: 20;
  white-space: pre-line;
}

/* Footer URL */
.footer {
  position: absolute;
  bottom: 56px;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'Space Mono', monospace;
  font-size: 20px;
  color: #4B5563;
  z-index: 20;
  letter-spacing: 1px;
  white-space: nowrap;
}

/* ── iPhone mockup ── */

.phone-wrapper {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%) rotate(-8deg);
  z-index: 10;
  width: 320px;
  height: 640px;
}

/* Lime glow rectangle behind phone */
.phone-lime-bg {
  position: absolute;
  width: 280px;
  height: 560px;
  background: #D4F542;
  border-radius: 20px;
  top: 20px;
  left: 18px;
  z-index: 1;
  box-shadow: 0 40px 100px rgba(212, 245, 66, 0.35);
}

/* iPhone body */
.phone {
  position: absolute;
  inset: 0;
  background: #141414;
  border-radius: 52px;
  border: 2.5px solid #2A2A2A;
  overflow: hidden;
  z-index: 2;
  box-shadow:
    0 60px 120px rgba(0,0,0,0.7),
    inset 0 1px 0 rgba(255,255,255,0.06);
}

/* Dynamic Island */
.dynamic-island {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  width: 126px;
  height: 36px;
  background: #000;
  border-radius: 20px;
  z-index: 30;
}

/* Phone screen */
.phone-screen {
  position: absolute;
  inset: 0;
  background: #0D0D14;
  padding-top: 68px;
  overflow: hidden;
}

/* Status bar */
.status-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 54px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 28px 8px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255,255,255,0.7);
  z-index: 5;
  font-family: 'Outfit', sans-serif;
}

/* ── Shared phone UI components ── */

.p-label {
  font-size: 11px;
  font-weight: 700;
  color: rgba(255,255,255,0.35);
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 8px;
  padding: 0 20px;
}

.p-title {
  font-size: 17px;
  font-weight: 700;
  color: #FFFFFF;
  padding: 0 20px;
  margin-bottom: 14px;
  line-height: 1.2;
}

.p-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #D4F542;
  color: #0D0D14;
  font-weight: 700;
  font-size: 14px;
  border-radius: 100px;
  padding: 10px 20px;
  margin: 0 20px;
}

.p-btn-ghost {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.6);
  font-weight: 600;
  font-size: 13px;
  border-radius: 100px;
  padding: 8px 16px;
  margin: 0 20px;
}
```

**Step 2: Убедиться что файл создан**

```bash
ls "/Users/lvmn/Desktop/Бизнес/ai projects /swipely /brand-templates/promo-shared.css"
```
Ожидаем: путь без ошибки

**Step 3: Commit**

```bash
cd "/Users/lvmn/Desktop/Бизнес/ai projects /swipely" && git add brand-templates/promo-shared.css && git commit -m "feat(promo): add shared CSS for iPhone mockup + layout"
```

---

### Task 2: promo-1-hook.html — "От текста к карусели за 30 секунд"

**Files:**
- Create: `brand-templates/promo-1-hook.html`

**Step 1: Создать файл**

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="promo-shared.css">
  <style>
    body { width: 1080px; height: 1080px; }
  </style>
</head>
<body>
  <div class="grid-bg"></div>

  <!-- Headline -->
  <div class="headline">От текста<br>к карусели<br><span style="color:#D4F542">за 30 секунд.</span></div>

  <!-- Phone mockup -->
  <div class="phone-wrapper">
    <div class="phone-lime-bg"></div>
    <div class="phone">
      <div class="dynamic-island"></div>
      <div class="phone-screen">
        <div class="status-bar">
          <span>9:41</span>
          <span style="display:flex;gap:4px;align-items:center">
            <span>▪▪▪▪</span><span>WiFi</span><span>100%</span>
          </span>
        </div>

        <!-- App UI: generate step / input -->
        <div style="padding: 0 20px">
          <div style="font-size:20px;font-weight:800;color:#fff;margin-bottom:6px">Создать карусель</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:16px">Введи текст или тему</div>

          <!-- Textarea -->
          <div style="background:rgba(255,255,255,0.05);border:1.5px solid rgba(255,255,255,0.1);border-radius:16px;padding:14px;margin-bottom:14px">
            <div style="font-size:12px;color:rgba(255,255,255,0.7);line-height:1.5">5 способов привлечь клиентов через контент-маркетинг без бюджета</div>
            <div style="margin-top:8px;width:2px;height:14px;background:#D4F542;border-radius:1px"></div>
          </div>

          <!-- Mode chips -->
          <div style="display:flex;gap:8px;margin-bottom:20px">
            <div style="background:#D4F542;color:#0D0D14;font-size:11px;font-weight:700;padding:5px 12px;border-radius:100px">5 слайдов</div>
            <div style="border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.5);font-size:11px;padding:5px 12px;border-radius:100px">Instagram</div>
            <div style="border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.5);font-size:11px;padding:5px 12px;border-radius:100px">Обучающий</div>
          </div>

          <!-- CTA button -->
          <div class="p-btn">Создать карусель ✦</div>
        </div>
      </div>
    </div>
  </div>

  <div class="footer">swipely.ai</div>
</body>
</html>
```

**Step 2: Проверить рендер одного файла**

```bash
cd "/Users/lvmn/Desktop/Бизнес/ai projects /swipely /brand-templates" && node -e "
const puppeteer = require('../swipely-bot/node_modules/puppeteer');
const path = require('path');
const { pathToFileURL } = require('url');
(async () => {
  const b = await puppeteer.launch({ headless: 'new' });
  const p = await b.newPage();
  await p.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });
  await p.goto(pathToFileURL(path.join(__dirname, 'promo-1-hook.html')).href, { waitUntil: 'networkidle0' });
  await p.evaluateHandle('document.fonts.ready');
  await new Promise(r => setTimeout(r, 800));
  await p.screenshot({ path: path.join(__dirname, 'output/promo-1-hook.png'), type: 'png', clip: { x:0,y:0,width:1080,height:1080 } });
  await b.close();
  console.log('Done: output/promo-1-hook.png');
})().catch(console.error);
"
```
Ожидаем: `Done: output/promo-1-hook.png`

Открыть `brand-templates/output/promo-1-hook.png` и визуально проверить: тёмный фон, белый headline, телефон с lime подложкой, UI внутри.

**Step 3: Commit**

```bash
cd "/Users/lvmn/Desktop/Бизнес/ai projects /swipely" && git add brand-templates/promo-1-hook.html brand-templates/output/promo-1-hook.png && git commit -m "feat(promo): post 1 — hook (от текста к карусели)"
```

---

### Task 3: promo-2-preserve.html — "Твои слова. Без изменений."

**Files:**
- Create: `brand-templates/promo-2-preserve.html`

**Step 1: Создать файл**

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="promo-shared.css">
  <style>
    body { width: 1080px; height: 1080px; }
  </style>
</head>
<body>
  <div class="grid-bg"></div>

  <div class="headline">Твои слова.<br>Без<br><span style="color:#D4F542">изменений.</span></div>

  <div class="phone-wrapper">
    <div class="phone-lime-bg"></div>
    <div class="phone">
      <div class="dynamic-island"></div>
      <div class="phone-screen">
        <div class="status-bar">
          <span>9:41</span>
          <span>100%</span>
        </div>

        <div style="padding: 0 20px">
          <div style="font-size:18px;font-weight:800;color:#fff;margin-bottom:14px">Создать карусель</div>

          <!-- Preserve text toggle -->
          <div style="display:flex;background:rgba(255,255,255,0.06);border-radius:12px;padding:4px;gap:4px;margin-bottom:14px">
            <div style="flex:1;text-align:center;padding:8px 4px;border-radius:8px;font-size:12px;color:rgba(255,255,255,0.35);font-weight:600">✨ ИИ перепишет</div>
            <div style="flex:1;text-align:center;padding:8px 4px;border-radius:8px;background:#fff;font-size:12px;color:#0D0D14;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,0.2)">✏️ Мой текст</div>
          </div>

          <!-- Textarea with user's original text -->
          <div style="background:rgba(255,255,255,0.05);border:1.5px solid rgba(212,245,66,0.3);border-radius:16px;padding:14px;margin-bottom:10px">
            <div style="font-size:11px;color:rgba(212,245,66,0.7);margin-bottom:6px;font-weight:600">Твой текст сохранится</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.8);line-height:1.55">Маркетинг — это не про рекламу. Это про доверие. Люди покупают у тех, кому верят.</div>
          </div>

          <div style="font-size:10px;color:rgba(255,255,255,0.25);padding:0 2px;margin-bottom:16px">ИИ разобьёт на слайды и выделит заголовки, не меняя ни слова</div>

          <div class="p-btn">Далее →</div>
        </div>
      </div>
    </div>
  </div>

  <div class="footer">swipely.ai</div>
</body>
</html>
```

**Step 2: Render и проверить**

```bash
cd "/Users/lvmn/Desktop/Бизнес/ai projects /swipely /brand-templates" && node -e "
const puppeteer = require('../swipely-bot/node_modules/puppeteer');
const path = require('path');
const { pathToFileURL } = require('url');
(async () => {
  const b = await puppeteer.launch({ headless: 'new' });
  const p = await b.newPage();
  await p.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });
  await p.goto(pathToFileURL(path.join(__dirname, 'promo-2-preserve.html')).href, { waitUntil: 'networkidle0' });
  await p.evaluateHandle('document.fonts.ready');
  await new Promise(r => setTimeout(r, 800));
  await p.screenshot({ path: path.join(__dirname, 'output/promo-2-preserve.png'), type: 'png', clip: {x:0,y:0,width:1080,height:1080} });
  await b.close();
  console.log('Done');
})().catch(console.error);
"
```

**Step 3: Commit**

```bash
cd "/Users/lvmn/Desktop/Бизнес/ai projects /swipely" && git add brand-templates/promo-2-preserve.html brand-templates/output/promo-2-preserve.png && git commit -m "feat(promo): post 2 — preserve text (твои слова)"
```

---

### Task 4: promo-3-templates.html — "12 стилей. Один клик."

**Files:**
- Create: `brand-templates/promo-3-templates.html`

**Step 1: Создать файл**

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="promo-shared.css">
  <style>
    body { width: 1080px; height: 1080px; }
  </style>
</head>
<body>
  <div class="grid-bg"></div>

  <div class="headline">12 стилей.<br><span style="color:#D4F542">Один</span><br>клик.</div>

  <div class="phone-wrapper">
    <div class="phone-lime-bg"></div>
    <div class="phone">
      <div class="dynamic-island"></div>
      <div class="phone-screen">
        <div class="status-bar">
          <span>9:41</span>
          <span>100%</span>
        </div>

        <div style="padding: 0 16px">
          <div style="font-size:16px;font-weight:800;color:#fff;margin-bottom:4px">Выбери шаблон</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.35);margin-bottom:14px">12 дизайн-стилей</div>

          <!-- Template grid 2×3 -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">

            <div style="background:#1A1A2E;border-radius:12px;padding:12px 10px;border:2px solid #D4F542">
              <div style="font-size:9px;color:rgba(255,255,255,0.4);margin-bottom:4px">CHAPTER</div>
              <div style="font-size:11px;font-weight:700;color:#fff;line-height:1.2">Editorial<br>Literary</div>
            </div>

            <div style="background:#0F0F0F;border-radius:12px;padding:12px 10px;border:1.5px solid rgba(255,255,255,0.08)">
              <div style="font-size:9px;color:rgba(255,255,255,0.4);margin-bottom:4px">STREET</div>
              <div style="font-size:11px;font-weight:700;color:#fff;line-height:1.2">Raw<br>Bold</div>
            </div>

            <div style="background:#0A0A14;border-radius:12px;padding:12px 10px;border:1.5px solid rgba(255,255,255,0.08)">
              <div style="font-size:9px;color:rgba(255,255,255,0.4);margin-bottom:4px">FRAME</div>
              <div style="font-size:11px;font-weight:700;color:#fff;line-height:1.2">Premium<br>Poetic</div>
            </div>

            <div style="background:#fff;border-radius:12px;padding:12px 10px;border:1.5px solid rgba(0,0,0,0.06)">
              <div style="font-size:9px;color:rgba(0,0,0,0.4);margin-bottom:4px">DISPATCH</div>
              <div style="font-size:11px;font-weight:700;color:#0D0D14;line-height:1.2">Newsletter<br>Direct</div>
            </div>

            <div style="background:#0A84FF;border-radius:12px;padding:12px 10px">
              <div style="font-size:9px;color:rgba(255,255,255,0.6);margin-bottom:4px">SWIPELY</div>
              <div style="font-size:11px;font-weight:700;color:#D4F542;line-height:1.2">Modern<br>Startup</div>
            </div>

            <div style="background:#111;border-radius:12px;padding:12px 10px;border:1.5px solid rgba(255,255,255,0.06)">
              <div style="font-size:9px;color:rgba(255,255,255,0.4);margin-bottom:4px">RECEIPT</div>
              <div style="font-size:11px;font-weight:700;color:#fff;line-height:1.2">Bold<br>Statement</div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="footer">swipely.ai</div>
</body>
</html>
```

**Step 2: Render**

```bash
cd "/Users/lvmn/Desktop/Бизнес/ai projects /swipely /brand-templates" && node -e "
const puppeteer = require('../swipely-bot/node_modules/puppeteer');
const path = require('path');
const { pathToFileURL } = require('url');
(async () => {
  const b = await puppeteer.launch({ headless: 'new' });
  const p = await b.newPage();
  await p.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });
  await p.goto(pathToFileURL(path.join(__dirname, 'promo-3-templates.html')).href, { waitUntil: 'networkidle0' });
  await p.evaluateHandle('document.fonts.ready');
  await new Promise(r => setTimeout(r, 800));
  await p.screenshot({ path: path.join(__dirname, 'output/promo-3-templates.png'), type: 'png', clip: {x:0,y:0,width:1080,height:1080} });
  await b.close();
  console.log('Done');
})().catch(console.error);
"
```

**Step 3: Commit**

```bash
cd "/Users/lvmn/Desktop/Бизнес/ai projects /swipely" && git add brand-templates/promo-3-templates.html brand-templates/output/promo-3-templates.png && git commit -m "feat(promo): post 3 — templates grid"
```

---

### Task 5: promo-4-platforms.html — "Instagram. LinkedIn. Telegram."

**Files:**
- Create: `brand-templates/promo-4-platforms.html`

**Step 1: Создать файл**

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="promo-shared.css">
  <style>
    body { width: 1080px; height: 1080px; }
  </style>
</head>
<body>
  <div class="grid-bg"></div>

  <div class="headline">Instagram.<br>LinkedIn.<br><span style="color:#D4F542">Telegram.</span></div>

  <div class="phone-wrapper">
    <div class="phone-lime-bg"></div>
    <div class="phone">
      <div class="dynamic-island"></div>
      <div class="phone-screen">
        <div class="status-bar">
          <span>9:41</span>
          <span>100%</span>
        </div>

        <div style="padding: 0 16px">
          <div style="font-size:16px;font-weight:800;color:#fff;margin-bottom:4px">Платформа и цель</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.35);margin-bottom:14px">Куда публикуем</div>

          <!-- Platform grid -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:14px">

            <div style="padding:10px 12px;border-radius:12px;border:2px solid #E1306C;background:rgba(225,48,108,0.1)">
              <div style="font-size:12px;font-weight:700;color:#fff">Instagram</div>
            </div>

            <div style="padding:10px 12px;border-radius:12px;border:1.5px solid rgba(255,255,255,0.1)">
              <div style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.5)">LinkedIn</div>
            </div>

            <div style="padding:10px 12px;border-radius:12px;border:1.5px solid rgba(255,255,255,0.1)">
              <div style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.5)">Threads</div>
            </div>

            <div style="padding:10px 12px;border-radius:12px;border:1.5px solid rgba(255,255,255,0.1)">
              <div style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.5)">Telegram</div>
            </div>

            <div style="padding:10px 12px;border-radius:12px;border:1.5px solid rgba(255,255,255,0.1)">
              <div style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.5)">TikTok</div>
            </div>

            <div style="padding:10px 12px;border-radius:12px;border:1.5px solid rgba(255,255,255,0.1)">
              <div style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.5)">VK</div>
            </div>

          </div>

          <div class="p-btn-ghost" style="margin-bottom:0;font-size:11px">Далее: цель →</div>
        </div>
      </div>
    </div>
  </div>

  <div class="footer">swipely.ai</div>
</body>
</html>
```

**Step 2: Render**

```bash
cd "/Users/lvmn/Desktop/Бизнес/ai projects /swipely /brand-templates" && node -e "
const puppeteer = require('../swipely-bot/node_modules/puppeteer');
const path = require('path');
const { pathToFileURL } = require('url');
(async () => {
  const b = await puppeteer.launch({ headless: 'new' });
  const p = await b.newPage();
  await p.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });
  await p.goto(pathToFileURL(path.join(__dirname, 'promo-4-platforms.html')).href, { waitUntil: 'networkidle0' });
  await p.evaluateHandle('document.fonts.ready');
  await new Promise(r => setTimeout(r, 800));
  await p.screenshot({ path: path.join(__dirname, 'output/promo-4-platforms.png'), type: 'png', clip: {x:0,y:0,width:1080,height:1080} });
  await b.close();
  console.log('Done');
})().catch(console.error);
"
```

**Step 3: Commit**

```bash
cd "/Users/lvmn/Desktop/Бизнес/ai projects /swipely" && git add brand-templates/promo-4-platforms.html brand-templates/output/promo-4-platforms.png && git commit -m "feat(promo): post 4 — platforms"
```

---

### Task 6: promo-5-free.html — "Бесплатно. Без карты."

**Files:**
- Create: `brand-templates/promo-5-free.html`

**Step 1: Создать файл**

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="promo-shared.css">
  <style>
    body { width: 1080px; height: 1080px; }
  </style>
</head>
<body>
  <div class="grid-bg"></div>

  <div class="headline">Бесплатно.<br>Без<br><span style="color:#D4F542">карты.</span></div>

  <div class="phone-wrapper">
    <div class="phone-lime-bg"></div>
    <div class="phone">
      <div class="dynamic-island"></div>
      <div class="phone-screen">
        <div class="status-bar">
          <span>9:41</span>
          <span>100%</span>
        </div>

        <div style="padding: 0 18px">
          <!-- User greeting -->
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
            <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#D4F542,#0A84FF);flex-shrink:0"></div>
            <div>
              <div style="font-size:13px;font-weight:700;color:#fff">Добро пожаловать 👋</div>
              <div style="font-size:10px;color:rgba(255,255,255,0.4)">Free plan</div>
            </div>
          </div>

          <!-- Usage counter -->
          <div style="background:rgba(255,255,255,0.05);border:1.5px solid rgba(255,255,255,0.08);border-radius:16px;padding:14px;margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
              <div style="font-size:12px;font-weight:600;color:#fff">Генерации в месяц</div>
              <div style="font-size:12px;font-weight:800;color:#D4F542">1 / 3</div>
            </div>
            <!-- Progress bar -->
            <div style="background:rgba(255,255,255,0.08);border-radius:100px;height:6px;overflow:hidden">
              <div style="width:33%;height:100%;background:#D4F542;border-radius:100px"></div>
            </div>
            <div style="font-size:10px;color:rgba(255,255,255,0.3);margin-top:6px">Обновляется 1-го числа</div>
          </div>

          <!-- PRO teaser -->
          <div style="background:rgba(212,245,66,0.08);border:1.5px solid rgba(212,245,66,0.2);border-radius:14px;padding:12px 14px;margin-bottom:14px">
            <div style="font-size:11px;font-weight:700;color:#D4F542;margin-bottom:2px">PRO — безлимит</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.5)">990 ₽/мес · 9 и 12 слайдов · AI Фото</div>
          </div>

          <div class="p-btn" style="font-size:13px">+ Создать карусель</div>
        </div>
      </div>
    </div>
  </div>

  <div class="footer">swipely.ai</div>
</body>
</html>
```

**Step 2: Render**

```bash
cd "/Users/lvmn/Desktop/Бизнес/ai projects /swipely /brand-templates" && node -e "
const puppeteer = require('../swipely-bot/node_modules/puppeteer');
const path = require('path');
const { pathToFileURL } = require('url');
(async () => {
  const b = await puppeteer.launch({ headless: 'new' });
  const p = await b.newPage();
  await p.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });
  await p.goto(pathToFileURL(path.join(__dirname, 'promo-5-free.html')).href, { waitUntil: 'networkidle0' });
  await p.evaluateHandle('document.fonts.ready');
  await new Promise(r => setTimeout(r, 800));
  await p.screenshot({ path: path.join(__dirname, 'output/promo-5-free.png'), type: 'png', clip: {x:0,y:0,width:1080,height:1080} });
  await b.close();
  console.log('Done');
})().catch(console.error);
"
```

**Step 3: Commit**

```bash
cd "/Users/lvmn/Desktop/Бизнес/ai projects /swipely" && git add brand-templates/promo-5-free.html brand-templates/output/promo-5-free.png && git commit -m "feat(promo): post 5 — free tier (бесплатно без карты)"
```

---

### Task 7: Render все 5 через render-all.js и финальная проверка

**Step 1: Запустить render-all.js**

```bash
cd "/Users/lvmn/Desktop/Бизнес/ai projects /swipely /brand-templates" && node render-all.js 2>&1 | grep -E "(promo|✅|✨|Error)"
```

Ожидаем строки вида:
```
✅ promo-1-hook.html → output/promo-1-hook.png (1080x1080)
✅ promo-2-preserve.html → output/promo-2-preserve.png (1080x1080)
✅ promo-3-templates.html → output/promo-3-templates.png (1080x1080)
✅ promo-4-platforms.html → output/promo-4-platforms.png (1080x1080)
✅ promo-5-free.html → output/promo-5-free.png (1080x1080)
```

**Step 2: Проверить что все 5 PNG существуют**

```bash
ls -la "/Users/lvmn/Desktop/Бизнес/ai projects /swipely /brand-templates/output/" | grep promo
```

Ожидаем 5 файлов promo-*.png, каждый > 100KB

**Step 3: Финальный commit (если PNG обновились)**

```bash
cd "/Users/lvmn/Desktop/Бизнес/ai projects /swipely" && git add brand-templates/output/ && git commit -m "feat(promo): render all 5 promo posts to PNG"
```
