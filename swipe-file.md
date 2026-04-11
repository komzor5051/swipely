# Swipely -- Swipe File (Reverse Engineering)

Коллекция разборов конкурентов, паттернов и инсайтов.

---

## RE CARD: Postnitro.ai

**Type:** product + business
**Date:** 2026-03-26

### Top mechanics

1. **URL-to-carousel** -- zero-effort input, решает проблему "не знаю о чем писать". Вставил ссылку на статью -- получил карусель.
2. **Creation + Scheduling bundle** -- встроенный планировщик контента + автопубликация в LinkedIn, Instagram, TikTok, Threads. Создает retention и switching cost. На paywall (Creator $12/мес+).
3. **SEO content machine** -- пишут "best X tools" статьи, ставят себя на первое место, перехватывают intent-трафик по запросам "best carousel maker", "AI carousel generator".

### Weaknesses (где можно обойти)

1. Агрессивный free tier (~2 реальных использования до upgrade wall) -- плохой word-of-mouth, жалобы на Product Hunt
2. Нет community (Discord/Telegram) -- нет viral loop, нет обратной связи от пользователей
3. Commodity AI (GPT-4 + Claude API) -- нет технического moat, любой может повторить
4. Нет Telegram-бота -- Swipely's structural advantage на RU-рынке

### Pricing structure

| Tier | Price | Key limits |
|------|-------|-----------|
| Free | $0 | 5 downloads/мес (~2 реальных создания) |
| Creator | $12/мес | Unlimited downloads, scheduling, auto-publish |
| Pro | $24/мес | Advanced AI, team features |
| Business | Custom | Agency features |
| Annual discount | ~20% | ~$120 экономии/год |

Value metric: downloads (количество скачиваний).
Upgrade trigger: быстрое упирание в лимит + непрозрачность кредитов.

### Principles to steal

1. **Объединить creation + distribution** -- scheduling и автопубликация создают retention. Без этого продукт одноразовый.
2. **Принимать URL как input** -- снижает барьер входа до нуля. Не надо формулировать тему.
3. **SEO-блог** -- "лучшие инструменты для каруселей" статьи как основной organic growth канал.

### Swipely advantages (что у нас есть, чего нет у них)

- Telegram-бот (нативный для RU-рынка, нулевой барьер входа)
- Собственный визуальный редактор (swipely-editor)
- Web-app SaaS (swipely-nextjs)
- Monorepo архитектура (bot + editor + API + nextjs)

### Experiment

**URL-to-carousel для Swipely бота** -- вставляешь ссылку на статью/пост, бот генерирует карусель.
- Hypothesis: снизит барьер входа, +30-50% конверсия в первое использование
- Metric: кол-во первых генераций от новых юзеров до/после
- Timeline: 2-3 дня реализации, оценка через 2 недели
- Scope: парсинг URL (Firecrawl/Puppeteer) -> извлечение ключевых тезисов -> генерация карусели

### Cross-field transfers

| Source | Mechanic | Application for Swipely | Risk |
|--------|----------|------------------------|------|
| **Loom** | Watermark branding на бесплатных видео | "Made with Swipely" на free-tier каруселях -- каждая карусель = реклама | Раздражение, но работает у Loom и Canva |
| **Midjourney** | Community showcase через Discord | Публичная галерея лучших каруселей с метриками (лайки, репосты) -- SEO + social proof | Нужна критическая масса пользователей |
| **Gamma.app** | Real-time collaborative editing | Collaborative carousel editing для агентств/команд | Overengineering для текущей стадии |

### Competitive moat assessment

Postnitro moat: **WEAK**. Нет network effects, нет data lock-in (карусели скачиваются как картинки), нет собственной AI модели. Основной moat -- SEO-позиции (temporal, 6-12 мес чтобы догнать) + scheduling bundle (switching cost от запланированного контента).

---

*Следующий разбор: [добавить]*
