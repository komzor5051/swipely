# Промпты Swipely Bot

Документ содержит все промпты, используемые в сервисе для генерации контента и изображений.

---

## 1. Генерация контента карусели (Gemini)

**Файл:** `src/services/gemini.js`
**Модель:** `gemini-2.5-flash-lite` (fallback: OpenRouter `google/gemini-2.0-flash-001`)

### System Prompt

```
Ты — топовый SMM-стратег. Создаёшь ВИРУСНЫЕ карусели для Instagram.

ДИЗАЙН: {designConfig.name}
ТОН: {designConfig.tone}

ЗАДАЧА: Создай РОВНО {slideCount} слайдов. Каждый: 25-{max_words_per_slide} слов.

КРИТИЧЕСКИ ВАЖНО — ЧИСТЫЙ ТЕКСТ:
• НИКАКОГО markdown: без **, *, _, #, ~~, `
• НИКАКИХ символов разметки в тексте
• Пиши живым разговорным языком
• Короткие предложения, легко читаются на слайде
• Списки в content: просто "1. Текст 2. Текст" без спецсимволов

ЗАГОЛОВКИ (3-6 слов, без символов):
• Цифры: "5 ошибок", "3 способа"
• Шок: "99% делают неправильно"
• Боль: "Устал продавать?"

ТИПЫ СЛАЙДОВ:
1. HOOK: Зацепить внимание
2. STATEMENT: Факты и боль
3. LIST: Нумерованный список "1. Название: Описание"
4. CTA: Призыв к действию

OUTPUT ONLY JSON:
{
  "slides": [
    {"type": "hook", "title": "5 ошибок новичков", "content": "Почему 90% стартапов закрываются в первый год. Разберём главные причины провала.", "emphasize": ["ошибки"]}
  ]
}
```

### User Prompt

```
Создай карусель на основе этого текста:

"{userText}"
```

### Конфигурация стилей (max_words_per_slide)

| Стиль | Название | Макс. слов | Тон |
|-------|----------|------------|-----|
| `minimal_pop` | Minimal Pop | 40 | energetic, modern, minimalist |
| `notebook` | Notebook Sketch | 45 | personal, educational, handwritten-feel |
| `darkest` | Darkest Hour | 50 | professional, elegant, cyberpunk |
| `aurora` | Aurora | 45 | ethereal, modern, dreamy |
| `terminal` | Terminal | 40 | technical, retro-computer, hacker |
| `editorial` | Editorial | 45 | high-fashion, magazine, bold |
| `zen` | Zen | 35 | minimalist, japanese, calm |
| `memphis` | Memphis | 40 | 80s retro, playful, vibrant |
| `luxe` | Luxe | 40 | premium, luxury, elegant |
| `photo_mode` | AI Photo | 25 | impactful, concise, visual-first |

---

## 2. Генерация AI-изображений (Gemini Image)

**Файл:** `src/services/imageGenerator.js`
**Модель:** `gemini-3-pro-image-preview` (fallback: `gemini-2.0-flash-exp-image-generation`)

### Стили изображений

#### Cartoon (Мультяшный)
```
3D Pixar/Disney animation style illustration.
Vibrant saturated colors, soft lighting, expressive cartoon features.
The person transformed into an animated character while keeping recognizable face.
Professional studio lighting, clean background with soft bokeh.
```

#### Realistic (Реалистичный)
```
High-end professional photography, cinematic lighting.
Magazine cover quality, natural skin tones, shallow depth of field.
Professional studio setup, soft diffused lighting.
Commercial advertising aesthetic.
```

### Основной промпт генерации (с reference photo)

```
Create an image for Instagram ({aspectDescription} aspect ratio).

VISUAL STYLE:
{styleConfig.prompt}

COMPOSITION:
- Transform the person from the reference photo into this style
- Keep their face recognizable and expressive
- Professional dynamic pose suggesting confidence
- Clean, uncluttered background with soft blur
- Leave clear space at TOP (20%) and BOTTOM (25%) of image for text overlay
- Center the subject in the middle portion of the frame
- High quality, sharp focus on the face

CRITICAL REQUIREMENTS:
⛔ ABSOLUTELY NO TEXT, LETTERS, NUMBERS, WORDS, CAPTIONS, TITLES, OR TYPOGRAPHY
⛔ NO watermarks, logos, signatures, or any written elements
⛔ The image must be 100% visual - pure illustration/photo only
✅ Focus entirely on the visual aesthetic and the person
```

**Переменные:**
- `{aspectDescription}` — `4:5 portrait` или `1:1 square`
- `{styleConfig.prompt}` — промпт стиля (cartoon/realistic)

### Fallback промпт (старая модель)

```
Create an image ({aspectDescription} ratio).
Style: {styleConfig.prompt}
Transform the person from reference photo into this style.
Keep face recognizable. Professional pose. Clean background.
Leave space at top and bottom for text overlay.
⛔ ABSOLUTELY NO TEXT OR LETTERS IN THE IMAGE
```

### Промпт без reference photo (абстрактный визуал)

```
Create an image for Instagram ({aspectDescription} aspect ratio).

VISUAL STYLE:
{styleConfig.prompt}

THEME: Create an abstract/conceptual visual representation related to: "{themeDescription}"
- Use symbolic imagery, colors, and shapes
- Professional quality, visually striking
- Clean composition with soft background
- Leave clear space at TOP and BOTTOM for text overlay

CRITICAL:
⛔ ABSOLUTELY NO TEXT, LETTERS, NUMBERS, WORDS, OR TYPOGRAPHY
⛔ The image must be 100% visual only
✅ Focus on mood, colors, abstract representation
```

---

## 3. Параметры генерации

### Текст (Gemini)
| Параметр | Значение |
|----------|----------|
| temperature | 0.7 |
| maxOutputTokens | 2500 |

### Изображения (Gemini Image)
| Параметр | Portrait | Square |
|----------|----------|--------|
| aspectRatio | 4:5 | 1:1 |
| imageSize | 2K | 2K |
| responseModalities | TEXT, IMAGE | TEXT, IMAGE |

---

## 4. Важные ограничения

### Контент
- Строго JSON формат на выходе
- Никакого markdown в текстах
- Заголовки: 3-6 слов
- Контент: 25-50 слов (зависит от стиля)

### Изображения
- Запрет текста/букв/цифр на изображениях
- Сохранение узнаваемости лица с reference photo
- Пространство сверху (20%) и снизу (25%) для текста
- Чистый фон с размытием

---

*Последнее обновление: 2026-01-29*
