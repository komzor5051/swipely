# Design: "Свой текст" — режим сохранения авторского текста

**Date**: 2026-02-24
**Status**: Approved

## Problem

Пользователи хотят сохранить свои формулировки без переработки ИИ. Нужен режим, где ИИ только структурирует текст на слайды, не меняя слова.

## Solution

Флаг `preserveText: boolean` в запросе генерации. При `true` — другой промпт, тот же пайплайн и JSON-формат.

## UI Changes (`swipely-nextjs/app/(dashboard)/generate/page.tsx`)

- На шаге `input` добавить переключатель режима (2 кнопки):
  - `✨ Сгенерировать с ИИ` (текущий режим)
  - `✏️ Свой текст` (новый режим, `preserveText = true`)
- Подсказка под textarea в режиме "Свой текст": *"Вставь готовый текст — ИИ сохранит формулировки и разобьёт на слайды"*
- Добавить `preserveText: boolean` в state (default: `false`)
- Передавать флаг в `handleGenerate` → тело fetch запроса

## API Changes (`swipely-nextjs/app/api/generate/route.ts`)

- Добавить `preserveText?: boolean` в тип `body`
- Добавить функцию `buildPreservePrompt(slideCount: number): string` — отдельный системный промпт:
  - Запрещает менять слова пользователя
  - Требует разбить РОВНО на N слайдов
  - Требует выделить заголовок 3-6 слов из текста с тегом `<hl>`
  - Возвращает тот же JSON формат `{slides, post_caption}`
- Если `preserveText === true` → использовать `buildPreservePrompt` вместо `buildSystemPrompt`
- ToV (`tovGuidelines`) — не применять в preserve режиме
- Списывание генераций — без изменений

## What Does NOT Change

- Шаги воронки: platform_goal / template / settings — те же
- Формат JSON ответа: `{slides[], post_caption}`
- Логика авторизации, лимитов, сохранения в БД
- `cleanMarkdown` постобработка

## Files to Modify

1. `swipely-nextjs/app/(dashboard)/generate/page.tsx` — UI переключатель + передача флага
2. `swipely-nextjs/app/api/generate/route.ts` — `buildPreservePrompt` + ветвление по флагу
