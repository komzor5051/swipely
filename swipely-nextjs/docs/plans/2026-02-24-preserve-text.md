# "Свой текст" — режим без переписывания

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Дать пользователю возможность вставить готовый текст и получить карусель без переписывания — ИИ только структурирует на слайды и выделяет заголовки.

**Architecture:** Флаг `preserveText: boolean` передаётся из UI в API. В `route.ts` при `preserveText === true` используется отдельный промпт `buildPreservePrompt`, который запрещает менять слова. Формат ответа и весь остальной пайплайн не меняются.

**Tech Stack:** Next.js 16, TypeScript, Gemini API (`gemini-2.5-flash-lite`), React state

---

### Task 1: API — добавить `buildPreservePrompt` и ветвление

**Files:**
- Modify: `swipely-nextjs/app/api/generate/route.ts:191` (после `buildSystemPrompt`)
- Modify: `swipely-nextjs/app/api/generate/route.ts:373-396` (тип body + деструктуризация + вызов промпта)

**Step 1: Добавить функцию `buildPreservePrompt` после `buildSystemPrompt` (строка ~276)**

Вставить после закрывающей скобки `buildSystemPrompt`:

```typescript
function buildPreservePrompt(slideCount: number): string {
  return `# Carousel Formatter — Preserve Mode

Ты — форматировщик текста для каруселей. Твоя задача: структурировать готовый текст пользователя на слайды, НЕ ИЗМЕНЯЯ формулировки.

АБСОЛЮТНЫЕ ЗАПРЕТЫ:
❌ Нельзя переписывать, перефразировать или улучшать текст
❌ Нельзя добавлять слова, которых нет в оригинале
❌ Нельзя удалять смысловые части текста
❌ Нельзя менять порядок слов в предложениях

ТВОЯ ЗАДАЧА:
1. Раздели текст на РОВНО ${slideCount} логических блоков
2. Для каждого блока выдели заголовок — 3-6 слов, взятых или составленных из самого текста блока
3. Остаток блока — это content, слово в слово как у пользователя
4. Для заголовка обязательно оберни 1-2 ключевых слова тегом <hl>слово</hl>
5. Для post_caption — напиши 1-3 предложения, суммирующих главную мысль (можно своими словами)

СТРУКТУРА СЛАЙДОВ:
• Первый слайд (hook) — самое сильное начало текста
• Последний слайд (cta) — логическое завершение
• Остальные — последовательные смысловые блоки

КРИТИЧЕСКИ ВАЖНО — ЧИСТЫЙ ТЕКСТ:
❌ Никакого markdown в title и content
❌ Никаких эмодзи в title и content
✅ Только обычный текст

OUTPUT: Верни ТОЛЬКО валидный JSON строго по схеме ниже. Без пояснений.

{
  "slides": [
    {
      "type": "hook",
      "title": "Заголовок с <hl>ключевым</hl> словом",
      "content": "Текст слайда — слово в слово из оригинала"
    }
  ],
  "post_caption": "Краткое резюме главной мысли"
}`;
}
```

**Step 2: Обновить тип `body` (строка ~373)**

Найти:
```typescript
  let body: {
    text: string;
    template: string;
    slideCount: number;
    format?: string;
    tone?: string;
    platform?: string;
    goal?: string;
  };
```

Заменить на:
```typescript
  let body: {
    text: string;
    template: string;
    slideCount: number;
    format?: string;
    tone?: string;
    platform?: string;
    goal?: string;
    preserveText?: boolean;
  };
```

**Step 3: Обновить деструктуризацию (строка ~389)**

Найти:
```typescript
  const { text, template, slideCount, format, tone, platform, goal } = body;
```

Заменить на:
```typescript
  const { text, template, slideCount, format, tone, platform, goal, preserveText } = body;
```

**Step 4: Ветвление промпта (строка ~412-413)**

Найти:
```typescript
  const tovGuidelines = profile?.tov_guidelines as string | undefined;
  const systemPrompt = buildSystemPrompt(template, slideCount, tone, tovGuidelines, platform, goal);
```

Заменить на:
```typescript
  const tovGuidelines = profile?.tov_guidelines as string | undefined;
  const systemPrompt = preserveText
    ? buildPreservePrompt(slideCount)
    : buildSystemPrompt(template, slideCount, tone, tovGuidelines, platform, goal);
```

**Step 5: Обновить userPrompt для preserve режима (строка ~415)**

Найти:
```typescript
  const userPrompt = `Создай вирусную визуальную карусель на основе текста ниже.

Условия:
• адаптируй под формат изображений
• усили боль, выгоду или контраст
• сократи сложные формулировки
• думай как человек, который скроллит ленту

Исходный текст:
"${text}"`;
```

Заменить на:
```typescript
  const userPrompt = preserveText
    ? `Структурируй текст ниже на РОВНО ${slideCount} слайдов. Не меняй ни одного слова в content.\n\nТекст пользователя:\n"${text}"`
    : `Создай вирусную визуальную карусель на основе текста ниже.\n\nУсловия:\n• адаптируй под формат изображений\n• усили боль, выгоду или контраст\n• сократи сложные формулировки\n• думай как человек, который скроллит ленту\n\nИсходный текст:\n"${text}"`;
```

**Step 6: Проверить что файл сохраняется без ошибок TypeScript**

```bash
cd "/Users/lvmn/Desktop/Бизнес/ai projects /swipely /swipely-nextjs" && npx tsc --noEmit 2>&1 | head -30
```
Ожидаем: нет ошибок (или только pre-existing ошибки не связанные с нашими изменениями)

**Step 7: Commit**

```bash
cd "/Users/lvmn/Desktop/Бизнес/ai projects /swipely /swipely-nextjs" && git add app/api/generate/route.ts && git commit -m "feat(api): add preserveText mode — structure without rewriting"
```

---

### Task 2: UI — переключатель режима на шаге `input`

**Files:**
- Modify: `swipely-nextjs/app/(dashboard)/generate/page.tsx:112-178` (state) и `~628-646` (textarea block)

**Step 1: Добавить state `preserveText` (после строки ~118)**

Найти:
```typescript
  const [result, setResult] = useState<CarouselResult | null>(null);
```

Добавить после:
```typescript
  const [preserveText, setPreserveText] = useState(false);
```

**Step 2: Сбросить `preserveText` в `handleReset` (строка ~337)**

Найти:
```typescript
  const handleReset = () => {
    setStep("input");
    setText("");
    setResult(null);
    setError("");
    setCurrentSlide(0);
    setReferencePhoto(null);
    setPhotoPreview(null);
    setPlatform("");
    setGoal("");
    setVideoUrl("");
    setInputMode("text");
```

Добавить `setPreserveText(false);` в конец списка сбросов.

**Step 3: Передать флаг в fetch (строка ~291-302)**

Найти:
```typescript
        body: JSON.stringify({
          text,
          template: selectedTemplate,
          slideCount,
          format,
          tone,
          platform,
          goal,
        }),
```

Заменить на:
```typescript
        body: JSON.stringify({
          text,
          template: selectedTemplate,
          slideCount,
          format,
          tone,
          platform,
          goal,
          preserveText,
        }),
```

**Step 4: Добавить переключатель в textarea block (строка ~628)**

Найти блок:
```typescript
            {inputMode === "text" && (
              <div className="space-y-3">
                <textarea
```

Заменить на (вставить переключатель перед textarea):
```typescript
            {inputMode === "text" && (
              <div className="space-y-3">
                {/* Preserve text toggle — только для стандартного режима */}
                {mode === "standard" && (
                  <div className="flex rounded-xl border border-[#E8E8E4] bg-[#F8F8F6] p-1 gap-1">
                    <button
                      onClick={() => setPreserveText(false)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        !preserveText
                          ? "bg-white shadow-sm text-[#0D0D14] font-semibold"
                          : "text-[#9CA3AF] hover:text-[#374151]"
                      }`}
                    >
                      ✨ ИИ перепишет
                    </button>
                    <button
                      onClick={() => setPreserveText(true)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        preserveText
                          ? "bg-white shadow-sm text-[#0D0D14] font-semibold"
                          : "text-[#9CA3AF] hover:text-[#374151]"
                      }`}
                    >
                      ✏️ Мой текст
                    </button>
                  </div>
                )}
                <textarea
```

**Step 5: Обновить placeholder textarea для preserve режима (строка ~633)**

Найти:
```typescript
                  placeholder={
                    mode === "photo"
                      ? "Опиши тему карусели — AI сгенерирует изображения и короткий текст..."
                      : "Например: 5 способов привлечь клиентов через контент-маркетинг\n\nИли вставь готовый текст, статью, заметку — AI адаптирует под формат карусели..."
                  }
```

Заменить на:
```typescript
                  placeholder={
                    mode === "photo"
                      ? "Опиши тему карусели — AI сгенерирует изображения и короткий текст..."
                      : preserveText
                        ? "Вставь готовый текст — формулировки останутся твоими, ИИ только разобьёт на слайды и выделит заголовки..."
                        : "Например: 5 способов привлечь клиентов через контент-маркетинг\n\nИли вставь готовый текст, статью, заметку — AI адаптирует под формат карусели..."
                  }
```

**Step 6: TypeScript check**

```bash
cd "/Users/lvmn/Desktop/Бизнес/ai projects /swipely /swipely-nextjs" && npx tsc --noEmit 2>&1 | head -30
```

**Step 7: Запустить dev сервер и проверить вручную**

```bash
cd "/Users/lvmn/Desktop/Бизнес/ai projects /swipely /swipely-nextjs" && npm run dev
```

Открыть `http://localhost:3000/generate`, проверить:
- [ ] Переключатель "✨ ИИ перепишет" / "✏️ Мой текст" отображается под табами "Текст/Видео"
- [ ] Переключатель не отображается в режиме "AI Фото"
- [ ] Placeholder меняется при переключении
- [ ] Вставить текст → пройти все шаги → генерация отрабатывает
- [ ] В режиме "Мой текст" слайды содержат оригинальный текст без переписывания

**Step 8: Commit**

```bash
cd "/Users/lvmn/Desktop/Бизнес/ai projects /swipely /swipely-nextjs" && git add app/\(dashboard\)/generate/page.tsx && git commit -m "feat(ui): add preserve text mode toggle on input step"
```
