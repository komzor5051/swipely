# Spec: OneTwoPrime Tenant Templates

**Date:** 2026-03-11
**Status:** Approved

## Problem

OneTwoPrime (B2B клиент) не имеет собственных брендированных шаблонов карусели. Им нужны уникальные стили, доступные только через их API-ключ.

## Goal

Создать 2 новых React-шаблона для Swipely, изолированных под tenant `onetwo_prime`. Шаблоны не отображаются в публичном picker'е и недоступны другим API-ключам.

## Visual Design (approved)

### Template 1: `onetwo_dark`

**Palette:** фон `#080808`, акцент `#C9A864`, текст `#FFFFFF` / `rgba(245,237,216,0.65)`

**Layout:**
- Gold top bar (4px, 100% ширина)
- Номер слайда `02 / 06` золотым цветом вверху слева
- Заголовок: Playfair Display 800, белый, `<hl>` = золотой цвет
- Разделитель: 32px золотая линия 2px
- Тело: Inter 400, кремовый 65% opacity
- Footer: правый край — золотые progress-dots (active = 14px pill, rest = 5px круг)
- Cover слайд: eyebrow текст + крупный заголовок + subtitle, номер в top-right
- CTA слайд: label + крупный заголовок + кнопка `background:#C9A864 color:#080808` + url строка

### Template 2: `onetwo_white`

**Palette:** фон `#FFFFFF`, акцент `#C9A864`, текст `#111111` / `rgba(17,17,17,0.55)`

**Layout:**
- Top row: номер слайда (gold) — тонкая золотая линия — `/06` (светло-золотой)
- Заголовок: Playfair Display 800, чёрный, `<hl>` = подчёркивание 3px gold снизу (псевдоэлемент `::after`)
- Тело: Inter 400, 55% opacity чёрный
- Bottom row: progress-dots (active = 14px gold pill)
- Cover: eyebrow + gold bar 36px + заголовок + subtitle
- CTA: gold accent bar 3px top + label + заголовок + кнопка `background:#111 color:#FFF` + url строка

## Architecture

### Tenant isolation

Оба шаблона регистрируются в `tenantTemplates[]` в `lib/templates/registry.ts` с `tenantId: "onetwo_prime"`.

Существующая логика в `/api/v1/generate/route.ts` уже проверяет:
```ts
if (templateMeta?.tenantId && templateMeta.tenantId !== slot.tenantId) {
  return 403
}
```

API-ключ OneTwoPrime в таблице `api_keys` должен иметь `tenant_id = "onetwo_prime"`.

### Files to create/modify

| Action | File |
|--------|------|
| Create | `components/slides/templates/OneTwoPrimeDarkSlide.tsx` |
| Create | `components/slides/templates/OneTwoPrimeWhiteSlide.tsx` |
| Modify | `components/slides/SlideRenderer.tsx` — добавить в `TEMPLATE_MAP` |
| Modify | `lib/templates/registry.ts` — добавить в `tenantTemplates[]` |
| Modify | `components/slides/types.ts` — расширить format union до `"square" \| "portrait" \| "story"` |
| Modify | `components/slides/utils.tsx` — добавить `story` в `getSlideDimensions` |
| Modify | `app/api/v1/generate/route.ts` — принять `format: "story"` + добавить в `designPresets` |
| Add | `public/previews/onetwo_dark.png` — placeholder preview |
| Add | `public/previews/onetwo_white.png` — placeholder preview |

### Format support

Оба шаблона поддерживают три формата:

| format | Размер | Назначение |
|--------|--------|------------|
| `square` | 1080×1080 | Instagram Feed 1:1 |
| `portrait` | 1080×1350 | Instagram Feed 4:5 |
| `story` | 1080×1920 | Instagram Stories / Reels 9:16 |

Для поддержки `story` формата:
- `components/slides/types.ts` — расширить union: `"square" | "portrait" | "story"`
- `components/slides/utils.tsx` — добавить ветку в `getSlideDimensions`: `story → { width: 1080, height: 1920 }`

В `story` формате шаблоны адаптируют внутренние отступы: верхний отступ увеличивается до 80px (вместо 48px), нижний — до 80px, чтобы контент не прижимался к краям длинного слайда.

### SlideProps interface

Оба компонента реализуют стандартный `SlideProps`:
```ts
interface SlideProps {
  slide: SlideData       // { title, content, type }
  slideNumber: number
  totalSlides: number
  format: "square" | "portrait" | "story"
  highlightColor?: string  // игнорируется — цвет фиксирован брендом
}
```

Используют существующие утилиты: `renderTitle`, `renderContent`, `getSlideDimensions`, `scaleContentFontSize`, `getLayoutVariant`, `getContentAlignment`.

`renderTitle` парсит `<hl>word</hl>` тэги — для `onetwo_dark` применяет `color: #C9A864`, для `onetwo_white` применяет `borderBottom: "3px solid #C9A864"` как inline style прямо на `<span>` (псевдоэлементы `::after` недоступны через inline styles в React).

### Design presets (API)

В `designPresets` в `/api/v1/generate/route.ts`:
```ts
onetwo_dark:  { name: "OneTwoPrime Dark",  max_words_per_slide: 30, tone: "premium, real estate, personal brand, aspirational" }
onetwo_white: { name: "OneTwoPrime White", max_words_per_slide: 30, tone: "clean, real estate, educational, professional" }
```

## Fonts

Оба шаблона используют Google Fonts:
- `Playfair Display` (400, 700, 800) — заголовки
- `Inter` (400, 500, 600, 700) — тело

Перед реализацией: проверить `<link>` в `app/layout.tsx` — убедиться что Playfair Display загружается с `wght@400;700;800`. Если нет 800 — добавить, иначе заголовки будут рендериться с 700 (отличается от approved дизайна).

## Preview images

Создать вручную: скриншот слайда в браузере → сохранить как `public/previews/onetwo_dark.png` и `onetwo_white.png`, 600×600px. Используются только в admin panel и template picker (тенантам не видны).

## Preview images

Создать скриншоты через Playwright или html-to-image как placeholder. Размер: 600×600px. Путь: `public/previews/onetwo_dark.png`, `public/previews/onetwo_white.png`.

## Tenant setup (DB)

После деплоя: в Supabase таблице `api_keys` найти запись OneTwoPrime и установить `tenant_id = "onetwo_prime"`. Это ручная операция, вне кода.

## Non-goals

- Публичный доступ к шаблонам
- Кастомизация цветов через API
- Preview в публичном template picker
