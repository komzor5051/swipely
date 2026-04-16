# Swipely — Milestone 2: Rich Carousels + Content Planning

## What This Is

Swipely — AI-генератор Instagram-каруселей (web SaaS, swipely-nextjs). Пользователь вводит тему, AI создаёт карусель.
Milestone 2 добавляет: разнообразие лейаутов слайдов, rich-элементы (графики, инфографика, нумерованные списки), загрузку своих фото через веб и контент-план на месяц.

Все изменения — только в `swipely-nextjs`. Бот (swipely-bot) остаётся как есть.

## Core Value

Каждый слайд должен выглядеть по-разному — разные композиции, rich-элементы и фото вместо бесконечного потока одинаковых текстовых блоков.

## Requirements

### Validated

- ✓ Генерация карусели по теме — AI → JSON → React-слайды — existing
- ✓ 13 шаблонов (templates), экспорт PNG — existing
- ✓ Supabase auth, rate limiting, тарифы — existing
- ✓ Photo mode (Gemini image generation per slide) — existing

### Active

- [ ] Разные лейауты слайдов: text-left, text-right, photo+text, big-number, quote-center
- [ ] Rich slide elements: нумерованные списки (красивые), инфографика с прогресс-барами и иконками
- [ ] Реальные чарты (bar, pie) как тип контента слайда
- [ ] Загрузка своих фото через веб-редактор
- [ ] Тип слайда "фото-как-фон" с текстом поверх
- [ ] Тип слайда "фото + текст рядом" (split layout)
- [ ] Контент-план: отдельная страница /content-plan в nextjs
- [ ] AI генерирует 30-дневный план по нише: темы, типы постов, даты
- [ ] Пользователь редактирует план и запускает генерацию отдельных каруселей

### Out of Scope

- Бот (swipely-bot) — не трогаем в этом milestone
- Анимированные слайды — слишком сложно для v1
- Публикация напрямую в Instagram — отдельный milestone
- Drag-and-drop редактор лейаутов — пользователь не выбирает лейаут вручную, AI выбирает

## Context

**Стек nextjs:** Next.js 16, React 19, Tailwind v4, Supabase SSR, Gemini API, Zustand.

**Архитектура генерации:** `POST /api/generate` → Gemini → JSON со слайдами → React компоненты в `components/slides/templates/` → html2canvas PNG export.

**Текущие слайды:** Каждый слайд — `{ type, title, content, layout? }`. Все шаблоны рендерят `title` + `content` примерно в одинаковой компоновке (title сверху, текст снизу). Нет вариативности в пределах одного шаблона.

**Photo mode** уже есть: Gemini генерирует изображение для каждого слайда. Загрузка своих фото — новая фича, отдельный флоу через Supabase Storage.

**Контент-план:** Полностью новая страница. Supabase таблица `content_plans` с темами и датами. Запуск генерации — переиспользует существующий `/api/generate`.

## Constraints

- **Tech stack**: Next.js 16 + React 19 + Tailwind v4 — нельзя менять
- **Render method**: html-to-image (`toPng()`) — чарты должны рендериться как React SVG/HTML, не через canvas-библиотеки. `backdrop-filter` сломан в html-to-image — не использовать.
- **AI**: Gemini только (не OpenRouter, не OpenAI) — уже настроен
- **No bot**: swipely-bot не затрагивается

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Лейауты через поле `layout` в JSON | Gemini уже возвращает JSON слайдов — добавляем поле `layout: "text-left" \| "text-right" \| "split" \| "big-number" \| "quote"` | — Pending |
| Rich elements через поле `elements` | `elements: [{type: "list", items: [...]}, {type: "stat", value: "47%", label: "..."}]` — расширяем схему | — Pending |
| Чарты — SVG inline, не Chart.js | html2canvas не дружит с Canvas-based библиотеками. Рендерим простые SVG-бары вручную | — Pending |
| Загрузка фото → Supabase Storage | Уже используется для аватаров/генераций. Bucket `user-photos`, путь `{userId}/{uuid}` | — Pending |
| Контент-план — новая таблица Supabase | `content_plans(id, user_id, month, items jsonb, created_at)` | — Pending |

---
*Last updated: 2026-03-19 after initialization*
