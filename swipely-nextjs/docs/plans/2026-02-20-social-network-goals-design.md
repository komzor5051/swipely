# Social Network + Goals Selection — Design Doc

**Date:** 2026-02-20
**Status:** Approved
**Scope:** swipely-nextjs only

---

## Overview

Add platform (Instagram, LinkedIn, Threads, TikTok, Telegram, VK, Pinterest, Facebook) and goal (Виральность, Личный бренд, Продажи, Нетворкинг, Лидогенерация, Образование) selection to the carousel generation wizard.

These are additive dimensions on top of the existing tone selector — not a replacement.

---

## UI Flow

Wizard expands from 3 to 4 steps:

```
input → platform_goal → template → settings
```

### Step 2: Platform & Goal

**Platform selector** — compact text chips, 4-per-row grid (2-per-row on mobile):
- Instagram, LinkedIn, Threads, TikTok, Telegram, VK, Pinterest, Facebook
- Selected state: brand-color border + glow (each platform has its own color)
- No icons, no emoji — typography only

**Goal selector** — cards in 2-column grid (1-column on mobile):
- Виральность / Максимум охвата и репостов
- Личный бренд / Экспертность и узнаваемость
- Продажи / Боль → решение → оффер
- Нетворкинг / Связи и коллаборации
- Лидогенерация / Захват подписчиков и заявок
- Образование / Структурированные знания
- Selected state: colored `border-l-4` + tinted background (each goal has its own color)

"Далее" button is disabled until both platform and goal are selected.

### Platform Brand Colors
```
Instagram:  #E1306C
LinkedIn:   #0077B5
Threads:    #101010 (dark) / #E0E0E0 (light mode border)
TikTok:     #FF0050
Telegram:   #2AABEE
VK:         #2787F5
Pinterest:  #E60023
Facebook:   #1877F2
```

### Goal Accent Colors
```
Виральность:    #FF6B35 (orange)
Личный бренд:   #8B5CF6 (purple)
Продажи:        #10B981 (green)
Нетворкинг:     #3B82F6 (blue)
Лидогенерация:  #F59E0B (amber)
Образование:    #0A84FF (swipely-blue)
```

---

## Prompt Architecture

Platform and goal sections are injected into `buildSystemPrompt()` after the existing TOV and content-tone sections:

```
[Design] + [TOV] + [Content Tone] + [PLATFORM] + [GOAL] + [Structure/Output]
```

### Platform Prompt Blocks

Each block defines: engagement mechanic, text length constraints, CTA style, post_caption length.

**Instagram**
```
ПЛАТФОРМА: Instagram
• Целевая механика: сохранения и поделиться
• Первый слайд — абсолютный стоп-скролл (конкурент — Reels)
• Текст на слайде: минимальный, читается за 3 секунды
• CTA: сохрани / поделись
• post_caption: 100–150 слов, без хэштегов
```

**LinkedIn**
```
ПЛАТФОРМА: LinkedIn
• Целевая механика: комментарии и репосты профессиональной аудитории
• Тон: профессиональный, сторителлинг, экспертность
• Первый слайд: конкретный data point или личная история
• CTA: напиши в комментах / поделись с командой
• post_caption: 200–400 слов, без хэштегов, личная история + профессиональный вывод
```

**Threads**
```
ПЛАТФОРМА: Threads
• Целевая механика: дискуссия, ответы в треде
• Тон: опинионейтед, разговорный, провокационный
• CTA: как думаешь? / поспорим?
• post_caption: 80–120 слов, заканчивается открытым вопросом
```

**TikTok**
```
ПЛАТФОРМА: TikTok
• Целевая механика: досмотры, комментарии, подписки
• Текст на слайде: 10–15 слов максимум, ультра-динамично
• CTA: подпишись / сохрани
• post_caption: 50–80 слов
```

**Telegram**
```
ПЛАТФОРМА: Telegram
• Целевая механика: переслать, сохранить в Избранное
• Тон: информативный, экспертный, канальный
• CTA: перешли тем, кому нужно / подпишись на канал
• post_caption: 200–300 слов, структурированный
```

**VK**
```
ПЛАТФОРМА: VK
• Целевая механика: лайки и репосты в сообщества
• Тон: доступный, близкий, сообщество
• CTA: поделись с друзьями / подпишись
• post_caption: 200–300 слов, без хэштегов
```

**Pinterest**
```
ПЛАТФОРМА: Pinterest
• Целевая механика: сохранения на доску
• Тон: вдохновение, how-to, практичность
• Структура слайдов: инструктивная (шаги, советы)
• CTA: сохрани на доску
• post_caption: 50–100 слов, ключевые слова важны
```

**Facebook**
```
ПЛАТФОРМА: Facebook
• Целевая механика: шеры в группах и комментарии
• Тон: сообщество, сторителлинг, доступный
• CTA: поделись с теми, кому нужно / оставь комментарий
• post_caption: 150–250 слов, вопрос в конце для вовлечения
```

---

### Goal Prompt Blocks

Each block defines: narrative logic, slide structure focus, CTA direction.

**Виральность**
```
ЦЕЛЬ: Виральность
• Создавай контент, который хочется переслать прямо сейчас
• Неожиданные инсайты — "я об этом не думал" момент
• Спорные, но обоснованные тезисы = дискуссия = охват
• Финальный слайд: провокационный вопрос или смелое утверждение
• post_caption: заканчивай вопросом, провоцирующим ответить
```

**Личный бренд**
```
ЦЕЛЬ: Личный бренд
• Каждый слайд усиливает экспертную позицию автора
• Личный опыт, ошибки, конкретные кейсы — не общие советы
• Уникальная точка зрения важнее общеизвестных фактов
• CTA: подпишись, чтобы получать больше таких инсайтов
• post_caption: личная история + профессиональный вывод
```

**Продажи**
```
ЦЕЛЬ: Продажи
• Структура нарратива: Боль → Усиление боли → Решение → Оффер
• Каждый слайд приближает к покупке
• Конкретные результаты и цифры вместо абстракций
• CTA: конкретное действие (записаться, написать, перейти)
• post_caption: оффер + снятие возражений + призыв к действию
```

**Нетворкинг**
```
ЦЕЛЬ: Нетворкинг
• Контент, ценный для профессиональной аудитории
• Открытые вопросы для дискуссии в каждом слайде
• Экспертность через кейсы, а не декларации
• CTA: кто делал похожее? напишем в комментах
• post_caption: твоё мнение + призыв к профессиональному обсуждению
```

**Лидогенерация**
```
ЦЕЛЬ: Лидогенерация
• Каждый слайд добавляет желание получить больше
• Лид-магнит: предложи что-то ценное в обмен на контакт
• Создавай ощущение, что лучшее — впереди (недосказанность)
• CTA: конкретный следующий шаг (написать в Директ, кликнуть по ссылке)
• post_caption: чёткий оффер + что получит человек + как получить
```

**Образование**
```
ЦЕЛЬ: Образование
• Каждый слайд = одна конкретная идея с примером
• Данные, факты, статистика усиливают доверие
• Структура: от простого к сложному
• CTA: сохрани, чтобы не забыть / поделись с тем, кому это нужно
• post_caption: краткое резюме ключевых выводов + вопрос для закрепления
```

---

## Technical Changes

### 3 files modified

**`app/(dashboard)/generate/page.tsx`**
- Add `"platform_goal"` to `Step` type
- Add `PLATFORMS` array (8 items with id, label, brandColor)
- Add `GOALS` array (6 items with id, label, description, accentColor)
- Add `platform` and `goal` state (both default empty string)
- Update `STEPS` to `["input", "platform_goal", "template", "settings"]`
- Add `platform_goal` step JSX block
- Pass `platform` and `goal` in the generate fetch body

**`app/api/generate/route.ts`**
- Add `platform` and `goal` to request body type
- Add `buildPlatformSection(platform: string): string` function
- Add `buildGoalSection(goal: string): string` function
- Inject both into `buildSystemPrompt()`
- Save `platform` and `goal` to `generations` table insert

**`supabase-migration.sql`**
- `ALTER TABLE generations ADD COLUMN platform TEXT;`
- `ALTER TABLE generations ADD COLUMN goal TEXT;`

---

## Combinations

`8 platforms × 6 goals = 48 unique prompt configurations` — all work with any existing template and tone.
