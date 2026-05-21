# Цель: фоновая сборка карусели из ссылки (async)

Дата: 2026-05-21
Статус: дизайн согласован, готов к плану реализации
Связано: 2026-05-21-url-to-carousel-design.md (эта фича дорабатывает баг той)

## Проблема

`carousel_from_url` синхронно выполняет внутри одного стримингового
запроса `/api/chat` три долгие операции: транскрипцию YouTube (до ~130с
по бюджету `/api/transcribe`), сжатие через LLM (~15-20с) и генерацию
карусели (~20-40с). Суммарно 2-3 минуты.

Запрос `/api/chat` объявлен `maxDuration = 60`; соседний `/api/transcribe`,
делающий ту же транскрипцию, стоит на `maxDuration = 300`. Деплой — VPS
(`output: "standalone"`), где `maxDuration` не enforce'ится, поэтому
реальный обрыв даёт idle-таймаут обратного прокси (nginx
`proxy_read_timeout` ~60с / Cloudflare ~100с): во время выполнения tool
поток в браузер не шлёт ни байта.

Соединение рвётся раньше, чем `streamText` дойдёт до `onFinish` —
ассистентский ход не сохраняется вообще. Пользователь видит в треде
только своё сообщение. Пусто, без ошибки.

## Цель

Карусель из YouTube-ссылки или статьи собирается надёжно, не упираясь
ни в один прокси-таймаут, и результат гарантированно появляется в треде.

### Критерий готовности

- Ссылка на YouTube + «сделай карусель» → плейсхолдер «собираю» сразу,
  затем карточка карусели в том же треде через пару минут.
- Ссылка на статью → то же.
- Битая ссылка, видео без субтитров, paywall, инъекция в материале,
  исчерпан лимит → честное сообщение в треде, а не пустой тред.
- Перезапуск процесса (PM2) посреди работы не теряет задачу.
- Чат не блокируется: пока задача идёт, пользователь шлёт другие сообщения.

## Решения (зафиксированы при брейншторме)

| Решение | Выбор | Обоснование |
|---|---|---|
| Механизм фона | Inngest-задача | Durable, переживает рестарты PM2 (а они на VPS бывают — 502 в памяти проекта), ретраи, наблюдаемость. Уже развёрнут self-hosted. Detached promise отвергнут: рестарт = та же потеря работы, только тихо. |
| Охват | YouTube и статьи | Длинная статья (extract + condense + generate) тоже выходит за 60с. Один путь в коде, нет пограничных случаев. |
| Аутентификация задачи | Внутренний auth на `/api/generate` | Задача зовёт существующий роут по loopback с `Authorization: Bearer CRON_SECRET` + `internalUserId`. Переиспользует весь роут (claim слота, лимиты, voice, сохранение). Паттерн уже есть — `/api/email/trigger`. Вынос генерации в общий сервис-модуль отвергнут: крупный рефакторинг критичного роута. |
| Доставка результата клиенту | Поллинг треда | Переиспользует существующий ресюм-поллинг `ChatHub`. Realtime-подписка отвергнута как лишняя инфраструктура. |
| Защита от прокси-таймаута | Декомпозиция на Inngest-шаги | Каждый `step.run` — отдельный короткий HTTP-вызов. Транскрипция и так оборвётся на 55с (`AbortSignal`), condense и generate <50с — ни один шаг не упирается в 60с. |

## Архитектура

```
Юзер шлёт "карусель из <url>" в чат
   │
   ▼
streamText → модель зовёт carousel_from_url (lib/chat/tools.ts)
   │  tier-gate: free → ok:false locked
   │  classifyUrl: unsupported → ok:false сразу, без задачи
   │  youtube | article → inngest.send("chat/carousel-from-url.run")
   ▼
ok:true, плейсхолдер: "Принял ссылку, собираю — пара минут"
   │  data.pending = true
   ▼
onFinish сохраняет ход ассистента с плейсхолдером
   │
   ▼ (фоном, Inngest)
chat-carousel function (lib/inngest/functions/chat-carousel.ts)
   step "extract"  → extractFromUrl(url)        — !ok → сообщение-ошибка, стоп
   step "condense" → condenseSourceText(text)
   injection-check → инъекция → сообщение-ошибка, стоп
   step "generate" → POST /api/generate (внутренний auth)
   step "persist"  → appendMessage(assistant, tool-result carousel_card)
   │
   ▼
ChatHub поллит /api/chat/threads/[id]/messages → подхватывает карточку
```

Извлечение и сжатие (`lib/content/url-source.ts`, `youtube-transcript.ts`)
не меняются — переезжают из tool в Inngest-функцию без правок логики.

## Компоненты

### 1. `lib/inngest/client.ts` (новое событие)

В `InngestEvents` добавить:

```
"chat/carousel-from-url.run": {
  data: { userId: string; threadId: string; url: string;
          slideCount: number; templateId: string }
}
```

### 2. `lib/inngest/functions/chat-carousel.ts` (новый файл)

`inngest.createFunction({ id: "chat-carousel-from-url", retries: 2,
concurrency: { limit: 3, key: "event.data.userId" } }, ...)` на событие
`chat/carousel-from-url.run`. Шаги:

- `step.run("extract")` → `extractFromUrl(url)`. При `!ok` — `appendMessage`
  ассистентского сообщения с честным текстом по `reason`, выход.
- `step.run("condense")` → `condenseSourceText(extracted.text)`.
- Injection-check (`containsInjection`, чистая функция, не шаг) — при срабатывании
  `appendMessage` сообщения-ошибки, выход.
- `step.run("generate")` → `internalFetch` POST `/api/generate` с внутренним
  auth. При `!ok` — `appendMessage` сообщения-ошибки по тексту ответа, выход.
- `step.run("persist")` → `appendMessage` ассистентского сообщения с
  `tool-result` part: `output: { ok:true, summary, data: { generation_id,
  slides, post_caption, templateId, format }, ui_hint: "carousel_card" }`.

Результат и ошибка сохраняются одинаково — `tool-result` part; `chatMessagesToUIMessages`
и `MessageRenderer` уже рендерят оба (`carousel_card` либо `ok:false` → красная плашка).

### 3. `app/api/inngest/route.ts`

Импортировать `chatCarousel`, добавить в `serve({ functions: [...] })`.

### 4. `lib/chat/tools.ts` — `carousel_from_url` переписать

- `ToolContext` +`threadId: string`.
- `inputSchema` без изменений.
- tier-gate `free` → `ok:false` locked (без изменений).
- `classifyUrl(url)`: `unsupported` → `ok:false` сразу (быстрый честный
  отказ, задача не нужна).
- Иначе `inngest.send({ name: "chat/carousel-from-url.run", data: {...} })`.
  При исключении `inngest.send` (Inngest-сервер недоступен) → `ok:false` с
  честным текстом, без ложного «собираю».
- Успех → `ok:true`, `ui_hint: "plain"`, `data: { pending: true }`,
  `summary`: «Принял ссылку — собираю карусель, это пара минут. Карточка
  появится в этом чате.»
- Логику `extractFromUrl` / `condenseSourceText` / injection-check убрать —
  она уезжает в Inngest-функцию.

### 5. `app/api/chat/route.ts`

Передать `threadId` в `buildTools({ ..., threadId })`.

### 6. `app/api/generate/route.ts` — внутренний auth

В начале handler'а, до cookie-проверки: если заголовок
`Authorization: Bearer ${CRON_SECRET}` совпадает и в теле есть
`internalUserId` — взять этого пользователя вместо `supabase.auth.getUser()`.
Иначе — текущий cookie-путь без изменений. Остальная логика роута
(claim слота, лимиты, сохранение) работает как есть.

### 7. `components/dashboard/conv/ChatHub.tsx` — поллинг

- Helper `hasPendingJob(messages)`: `true`, если последнее сообщение —
  ассистентское с `tool-result` part, у которого `output.data.pending === true`.
- Текущий ресюм-поллинг при перезагрузке срабатывает только когда последнее
  сообщение — `user`. Расширить условие: также когда `hasPendingJob`.
- Для live-случая (юзер на странице, стрим завершился плейсхолдером): после
  перехода `status` в `ready` — если `hasPendingJob`, запустить тот же
  поллинг `/api/chat/threads/[id]/messages`.
- Бюджет поллинга: интервал ~4с, до ~5 минут (с запасом на ретраи Inngest).
  Появилось более новое сообщение → `setMessages`, стоп.
- Таймаут поллинга → локальное (не персистится) мягкое сообщение
  «что-то затянулось, попробуй ещё раз»; плейсхолдер остаётся.

## Обработка ошибок

| Случай | Где | Поведение |
|---|---|---|
| URL не статья и не YouTube | tool, `classifyUrl` | `ok:false` сразу в чате, задача не создаётся |
| `inngest.send` упал | tool | `ok:false`, честный текст, без «собираю» |
| Видео без субтитров / paywall / провайдер | задача, `extract` | `appendMessage` сообщения-ошибки по `reason` |
| Инъекция в материале | задача, injection-check | `appendMessage` сообщения-ошибки |
| `/api/generate` !ok (лимит, cooldown, сбой Gemini) | задача, `generate` | `appendMessage` сообщения-ошибки по тексту ответа |
| Шаг упал по транзиентной причине | Inngest | автоматический ретрай (`retries: 2`) |
| Задача не finished за 5 мин | клиент | мягкое локальное сообщение, плейсхолдер остаётся |

## Тесты (TDD — тесты вперёд)

- `chat-carousel` Inngest-функция: моки `extractFromUrl` / `condenseSourceText` /
  `internalFetch` / `appendMessage` — порядок шагов; ветка `extract !ok` →
  сообщение-ошибка; ветка инъекции → сообщение-ошибка; `generate !ok` →
  сообщение-ошибка; успех → сообщение с `carousel_card`.
- `carousel_from_url.execute`: free → tier_locked; `unsupported` URL →
  `ok:false`; валидный URL → `inngest.send` вызван с верным payload +
  плейсхолдер `data.pending`; `inngest.send` бросил → `ok:false`.
- `/api/generate`: внутренний auth — верный `CRON_SECRET` + `internalUserId`
  пропускает cookie-проверку; неверный/отсутствует → 401 как сейчас.
- `hasPendingJob(messages)` — pending-плейсхолдер → `true`; обычное
  ассистентское / последнее сообщение `user` → `false`.
- Переписать `lib/chat/__tests__/carousel-from-url.test.ts` — он про старый
  синхронный путь.

Миграций БД нет — переиспользуются `chat_messages` / `chat_threads`.

## Вне скоупа (YAGNI)

- Realtime-доставка результата — достаточно поллинга.
- Прогресс-проценты транскрипции в UI — хватает плейсхолдера «собираю».
- Вынос генерации карусели в общий сервис-модуль — внутреннего auth достаточно.
- Кнопка «отменить задачу» — не критично для MVP.

## Переменные окружения

Новых не требуется:

- `CRON_SECRET` — уже есть, теперь также внутренний auth `/api/generate`.
- `INNGEST_BASE_URL` / `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` — уже
  настроены для существующих агентских функций.

## Известный риск

nginx перед `/api/inngest` со своим `proxy_read_timeout`. Митигируется
декомпозицией на короткие шаги (<55с каждый); существующие агентские
функции через этот же путь уже работают, риск низкий.
