# Цель: карусель из статьи или YouTube-видео

Дата: 2026-05-21
Статус: дизайн согласован, готов к плану реализации

## Цель

Пользователь кидает в чат ссылку на статью или YouTube-видео и просьбу
сделать карусель — агент сам извлекает контент материала и генерирует
карусель по нему. Сейчас агент отвечает «мне нужен текст или тезисы, а не
ссылка на видео» — потому что у него нет инструмента, превращающего URL в
исходный материал.

### Зачем

Снимает трение на входе: автор переупаковывает чужой или свой длинный
контент в карусель за один шаг, без ручного копирования тезисов. Это
типовой сценарий контент-маркетолога и точка активации — больше успешных
первых генераций.

### Критерий готовности

- В чате: ссылка на статью + «сделай карусель» → готовая карусель в карточке.
- В чате: ссылка на YouTube + «сделай карусель» → готовая карусель в карточке.
- Битая/неподдерживаемая ссылка, видео без субтитров, paywall-статья →
  понятное сообщение, а не общий сбой.
- Доступно только на платных тарифах; free видит предложение оформить подписку.

## Решения (зафиксированы при брейншторме)

| Решение | Выбор | Обоснование |
|---|---|---|
| Поверхность | Только чат, новый tool | Минимальный охват; сценарий из скриншота — чат. |
| Извлечение статей | EXA `/contents` | Ключ EXA уже есть, один провайдер для любого URL статьи. |
| Извлечение YouTube | Apify-актор транскриптов | Надёжные субтитры; инфра Apify (`runActor`) уже есть. |
| Доступ | Только платные тарифы | EXA и Apify платны за вызов; согласовано с `web_search`. |
| Длинный контент | Сжатие через LLM | Не теряем концовку материала; обрезка first-N теряет смысл. |

## Архитектура

Один новый чат-tool `carousel_from_url`. Не двухшаговый extract→generate:
меньше round-trip'ов, агент не таскает длинный текст между вызовами.
Извлечение и сжатие — отдельные модули, переиспользуют инфру EXA и Apify.

```
ссылка в чате
   │
   ▼
carousel_from_url (lib/chat/tools.ts)
   │  tier-gate: free → locked
   ▼
extractFromUrl (lib/content/url-source.ts)
   │  classifyUrl → youtube | article | unsupported
   ├── article → fetchUrlContent      (lib/search/exa.ts)
   └── youtube → fetchYouTubeTranscript (lib/services/apify.ts)
   │
   ▼
condenseSourceText (lib/content/url-source.ts)   ← только если текст > 12k
   │  callGemini: сжать в структурный конспект
   ▼
POST /api/generate { text: <заголовок>, sourceText: <конспект>, ... }
   │  sourceText оборачивается в effectiveText (паттерн Notion)
   ▼
carousel_card в чате
```

## Компоненты

### 1. `lib/content/url-source.ts` (новый)

Извлечение и подготовка исходного материала. Ни одна функция не бросает
исключений — ошибки возвращаются структурой.

- `classifyUrl(url): "youtube" | "article" | "unsupported"` (+ `videoId`
  для YouTube). YouTube — по hostname `youtube.com` / `youtu.be` и наличию id.
- `extractFromUrl(url): Promise<ExtractResult>` — роутит на нужный
  извлекатель, возвращает `{ ok: true, title, text, kind }` либо
  `{ ok: false, reason }` с машинным кодом причины
  (`unsupported_url` | `no_transcript` | `empty_content` | `provider_error`).
- `condenseSourceText(raw): Promise<string>` — сжатие через `callGemini`
  (`lib/generation/gemini.ts`). Вызывается только при `raw.length > 12000`.
  Промпт: сжать материал в структурный конспект ≤ 8000 символов, сохранив
  ключевые факты, цифры, цитаты и логику изложения; не добавлять отсебятины.
  При сбое модели — фолбэк на обрезку первых 12000 символов (чтобы фича не
  падала целиком из-за компрессии).

### 2. `lib/search/exa.ts` (новый экспорт)

- `fetchUrlContent(url): Promise<{ title: string; text: string } | null>` —
  POST `https://api.exa.ai/contents`, тело `{ urls: [url], text: true,
  livecrawl: "preferred" }`. Зеркалит стиль `webSearch`: общий timeout,
  retry на 429/5xx, never-throw (на сбое → `null`).

### 3. `lib/services/apify.ts` (новый экспорт)

- `fetchYouTubeTranscript(url): Promise<{ title: string; text: string } | null>` —
  через существующий `runActor`. ID актора из env `APIFY_YT_TRANSCRIPT_ACTOR`.
  Рекомендованный дефолт-актор фиксируется в плане реализации. Склеивает
  сегменты субтитров в сплошной текст. Пустой результат → `null`
  (видео без субтитров).

### 4. `app/api/generate/route.ts` (новое поле)

Опциональное поле `sourceText` в теле запроса.

- При наличии: лимит длины 12000 символов (свой ответ-ошибка), прогон через
  `containsInjection`.
- Оборачивается в `effectiveText` тем же приёмом, что Notion-источник
  (route.ts:261): `effectiveText = "Источник контента:\n" + sourceText +
  "\n\nНа основе этого источника сгенерируй карусель про: " + text`.
- Поле `text` при этом несёт короткий заголовок материала (лимит 3000 на
  `text` сохраняется без изменений).

### 5. `lib/chat/tools.ts` (новый tool)

`carousel_from_url`:

- `inputSchema`: `{ url: string().url(), slideCount?: 3..15, templateId?: string }`.
- tier-gate: `free` → `ok:false` с locked-сообщением (паттерн `web_search`).
- `extractFromUrl(url)` → при `ok:false` вернуть `ok:false` с дружелюбным
  текстом по `reason` → иначе `condenseSourceText` при необходимости →
  `internalFetch("/api/generate", { text: title, sourceText, template,
  slideCount, format: "portrait" })` → `ui_hint: "carousel_card"`.
- summary указывает источник: «Собрал карусель из статьи "…"» /
  «…из видео "…"».

### 6. `lib/chat/system-prompt.ts`

- Добавить `carousel_from_url` в список инструментов.
- Правило: «прислал ссылку на статью или YouTube и просит карусель →
  `carousel_from_url`».
- Добавить пример в раздел ПРИМЕРЫ.

## Обработка ошибок

Все случаи → `ok:false` с дружелюбным текстом, без общего сбоя:

| Случай | Сообщение |
|---|---|
| URL не статья и не YouTube | Поддерживаю статьи и YouTube-видео. Скинь текст тезисами. |
| Видео без субтитров (`no_transcript`) | У этого видео нет субтитров — пришли тезисы текстом. |
| Статья пустая / paywall (`empty_content`, текст < 200 симв.) | Не вышло вытащить текст со страницы — возможно, paywall. Скинь текст напрямую. |
| EXA / Apify недоступны (`provider_error`) | Не получилось открыть ссылку. Попробуй ещё раз или пришли текст. |
| Free-тариф | Генерация из ссылки — на платных тарифах. Оформи подписку. |

## Тесты

Unit-тесты по паттерну существующих `__tests__`:

- `classifyUrl` — варианты `youtube.com/watch`, `youtu.be/`, статья, мусор.
- `fetchUrlContent` — mock fetch: успех, пустой ответ, сетевая ошибка.
- `fetchYouTubeTranscript` — mock `runActor`: успех, пустой dataset.
- `condenseSourceText` — mock `callGemini`: сжатие применяется при > 12k,
  фолбэк-обрезка при сбое модели.
- `carousel_from_url.execute` — mock извлечения и `internalFetch`:
  tier-gate, успех, каждый кейс ошибки из таблицы выше.

## Вне скоупа (YAGNI)

- Поверхность `/generate` (форма) — только чат.
- Прямой fetch субтитров YouTube без Apify.
- Дневная квота сверх tier-gate — отсечения по платному тарифу достаточно.
- Поддержка плейлистов, постов соцсетей, PDF — только статья и YouTube-видео.

## Переменные окружения (новые)

- `APIFY_YT_TRANSCRIPT_ACTOR` — ID Apify-актора транскрипции YouTube.
- `APIFY_API_KEY` — уже используется `lib/services/apify.ts`.
- `EXA_API_KEY` — уже используется `lib/search/exa.ts`.
