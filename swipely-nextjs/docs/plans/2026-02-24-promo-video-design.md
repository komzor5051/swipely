# Design: PhonePromo — 60s Reels/Stories видео для Swipely

**Date**: 2026-02-24
**Status**: Approved

## Overview

Вертикальное промо-видео 9:16 (1080×1920) для Instagram Reels / Stories. 60 секунд.
Рендер через Remotion в `swipely-promo/`. Стиль Apple Marketing — тёмный фон, iPhone mockup, lime акцент.

## Format

| Параметр | Значение |
|----------|----------|
| Размер | 1080×1920 (9:16) |
| Длина | 60s = 1800 frames @ 30fps |
| Файл | `swipely-promo/src/PhonePromo.tsx` |
| Composition | `PhonePromo` в `Root.tsx` |

## Design Tokens

- **Фон**: `#0D0D14` (INK)
- **Акцент**: `#D4F542` (LIME)
- **Текст headline**: белый, Outfit 800
- **Subtitle / URL**: `#6B7280`, Space Mono
- **Телефон**: border-radius 52px, `#141414`, Dynamic Island

## Структура (4 сцены)

### Scene 1 — Текстовый крюк (0–4s, frames 0–120)

- Фон: чистый `#0D0D14`
- Headline по центру экрана: **"От текста\nк карусели\nза 30 секунд."** — каждая строка вылетает снизу вверх (stagger +8fr)
- Outfit Extra Bold, 88px, белый, letter-spacing -4px
- Под заголовком через 1s: `swipely.ai` — fade in, Space Mono, #6B7280

### Scene 2 — Телефон влетает (4–8s, frames 120–240)

- iPhone mockup spring-анимацией (`spring({ frame, fps:30, config: { damping:18, stiffness:120 } })`) — translateY от +800px до 0
- Lime прямоугольник позади (offset top:20px left:18px) появляется с задержкой 8fr, scale 0.8→1.0
- Фон экрана телефона: `#0D0D14`
- Размер mockup: ~340×680px в нижних 65% экрана
- Заголовок над телефоном поднимается вверх (translateY +120px → +40px) освобождая место

### Scene 3 — Демо внутри телефона (8–60s, frames 240–1800)

4 сегмента, UI меняется через crossfade (interpolate opacity). Над телефоном headline меняется.

**Сегмент A (8–21s, fr 240–630): Шаг ввода**
- Headline сверху: "Вставь текст или тему"
- Внутри телефона: шаг input — textarea с примером текста, кнопки режима, лайм-кнопка "Далее"

**Сегмент B (21–34s, fr 630–1020): Шаг шаблонов**
- Headline сверху: "Выбери стиль"
- Внутри телефона: 2×3 сетка шаблонов, один подсвечивается lime обводкой (пробегает по карточкам)

**Сегмент C (34–47s, fr 1020–1410): Генерация**
- Headline сверху: "Генерирую карусель..."
- Внутри телефона: прогресс-бар lime цвета заполняется, текст "ИИ работает"

**Сегмент D (47–60s, fr 1410–1800): Результат**
- Headline сверху: "Готово за 30 секунд"
- Внутри телефона: слайды карусели листаются (translateX свайп-анимация), 3 слайда
- Последний кадр (fr 1750–1800): fade в финальный экран с `swipely.ai` и CTA "Попробуй бесплатно"

## Компоненты

```
PhonePromo.tsx
├── <TextIntro> — Scene 1, stagger headline
├── <PhoneMockup> — обёртка телефона с Dynamic Island
│   ├── <DemoInput> — экран ввода текста
│   ├── <DemoTemplates> — грид шаблонов
│   ├── <DemoGenerating> — прогресс-бар
│   └── <DemoResult> — слайды карусели
├── <SceneHeadline> — заголовок над телефоном с crossfade
└── <OutroOverlay> — финальная заглушка swipely.ai
```

## Анимации

| Элемент | Тип | Параметры |
|---------|-----|-----------|
| Headline строки | translateY + opacity | stagger 8fr, damping 20 |
| Телефон влет | translateY spring | damping 18, stiffness 120 |
| Lime rect | scale + opacity | задержка 8fr от телефона |
| Смена сегментов | opacity crossfade | 15fr overlap |
| Свайп слайдов | translateX | linear, 30fr per slide |
| Подсветка шаблона | outline opacity | 45fr pulse cycle |

## File Structure

```
swipely-promo/src/
  PhonePromo.tsx        # новый файл
  Root.tsx              # добавить composition PhonePromo
```

## Render Command

```bash
cd swipely-promo && npx remotion render PhonePromo output/phone-promo.mp4
```
