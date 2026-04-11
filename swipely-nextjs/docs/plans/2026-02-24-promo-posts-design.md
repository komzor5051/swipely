# Design: Промо-серия 5 постов для Threads/Instagram

**Date**: 2026-02-24
**Status**: Approved

## Overview

Серия из 5 маркетинговых постов в стиле Apple Marketing для Threads/Instagram.
Рендер: HTML → 1080×1080 PNG через Puppeteer в `brand-templates/`.

## Visual System

- **Фон:** `#0D0D14` (Ink — тёмный)
- **Headline:** белый, Outfit Bold, ~96-110px, 2-3 строки, верхняя часть
- **Акцент:** `#D4F542` (Lime) — подложка за телефоном
- **URL подпись:** `swipely.ai`, серый `#6B7280`, Space Mono, низ по центру
- **Телефон:** CSS iPhone 15 Pro mockup, наклон -8°, lime rectangle за ним с box-shadow

## iPhone Mockup (CSS)

- Внешний корпус: `#1A1A1A`, border-radius 52px, border 2px `#333`
- Dynamic Island: чёрная пилюля сверху по центру
- Экран: `#0D0D14` с UI контентом
- Размер mockup: ~320×640px внутри 1080×1080 canvas
- Наклон: `rotate(-8deg)`
- Lime подложка: `#D4F542` прямоугольник ~280×500px, rotate(-8deg), blur shadow

## 5 Постов

### Post 1: Main Hook
**Headline:** "От текста\nк карусели\nза 30 секунд."
**UI внутри телефона:** Шаг input — textarea с примером текста ("5 способов..."), кнопка "Далее: платформа" в lime цвете внизу

### Post 2: Preserve Text
**Headline:** "Твои слова.\nБез изменений."
**UI внутри телефона:** Переключатель "✨ ИИ перепишет / ✏️ Мой текст" с активным "Мой текст", textarea с авторским текстом

### Post 3: Templates
**Headline:** "12 стилей.\nОдин клик."
**UI внутри телефона:** Сетка 2×3 превью шаблонов (Chapter, Street, Frame, Dispatch, Swipely, Receipt) — цветные карточки

### Post 4: Platforms
**Headline:** "Instagram.\nLinkedIn.\nTelegram."
**UI внутри телефона:** Шаг platform_goal — 6 цветных кнопок платформ (Instagram #E1306C, LinkedIn #0077B5, Telegram #2AABEE и др.)

### Post 5: Free Tier
**Headline:** "Бесплатно.\nБез карты."
**UI внутри телефона:** Dashboard — аватар пользователя, "3 генерации в месяц", lime прогресс-бар "1 из 3 использовано", кнопка "Создать карусель"

## File Structure

```
brand-templates/
  promo-1-hook.html
  promo-2-preserve.html
  promo-3-templates.html
  promo-4-platforms.html
  promo-5-free.html
  output/
    promo-1-hook.png
    promo-2-preserve.png
    promo-3-templates.png
    promo-4-platforms.png
    promo-5-free.png
```

## Render Command

```bash
cd brand-templates && node render.js promo-1-hook.html output/promo-1-hook.png 1080 1080
```
или через `node render-all.js` если добавить промо-файлы в список.
