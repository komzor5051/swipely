# Drag-and-Drop Editor — План реализации

## Цель
Создать визуальный редактор карусели, где любой элемент можно перемещать и удалять.

---

## Фаза 1: Базовый Canvas

### 1.1 Установка зависимостей
- [x] `@dnd-kit/core` — drag-and-drop
- [x] `@dnd-kit/utilities` — хелперы
- [x] `zustand` — state management

### 1.2 Компонент SlideCanvas
- [x] Создать `components/editor/SlideCanvas.tsx`
- [x] Рабочая область 1080×1350 (масштаб для экрана)
- [x] Сетка-подложка для визуального ориентира
- [x] Обработка drop событий

### 1.3 Компонент DraggableElement
- [x] Создать `components/editor/DraggableElement.tsx`
- [x] Обёртка с useDraggable от @dnd-kit
- [x] Визуальная индикация при перетаскивании
- [x] Выделение по клику

### 1.4 Базовые элементы
- [x] `TextElement` — заголовок/контент
- [x] `AvatarElement` — круглый аватар с градиентом
- [x] `DecorationElement` — линии, фигуры
- [x] `IconElement` — иконки (стрелки, share, etc.)

---

## Фаза 2: State и UI управления

### 2.1 Zustand Store
- [x] Создать `lib/store/editorStore.ts`
- [x] State: `elements[]`, `selectedId`, `zoom`
- [x] Actions: `moveElement`, `deleteElement`, `selectElement`, `toggleVisibility`

### 2.2 Панель слоёв (Layers Panel)
- [x] Создать `components/editor/LayersPanel.tsx`
- [x] Список всех элементов
- [x] Иконка глаза — скрыть/показать
- [x] Иконка корзины — удалить
- [ ] Drag для изменения z-index (опционально)

### 2.3 Toolbar
- [x] Создать `components/editor/Toolbar.tsx`
- [x] Кнопка Delete (или клавиша Delete/Backspace)
- [x] Zoom in/out
- [ ] Undo/Redo (опционально, позже)

### 2.4 Страница редактора
- [x] Создать `app/(dashboard)/editor/page.tsx`
- [x] Layout: Canvas слева, Layers Panel справа
- [ ] Загрузка шаблона по ID из URL

---

## Фаза 3: Шаблоны

### 3.1 JSON-структура шаблона
- [x] Создать `lib/templates/types.ts` — TypeScript типы
- [x] Конвертировать 1 HTML-шаблон (grid_multi) в JSON
- [x] Элементы с начальными позициями

### 3.2 Рендер шаблона
- [ ] Загрузка JSON → создание элементов на canvas
- [ ] Применение стилей из JSON
- [ ] Подстановка контента (title, content)

---

## Фаза 4: Интеграция с ботом

### 4.1 API Endpoints
- [ ] `POST /api/editor/save` — сохранить позиции элементов
- [ ] `GET /api/editor/[sessionId]` — получить сессию редактирования
- [ ] `POST /api/editor/render` — отправить на рендер

### 4.2 Обновить Puppeteer рендерер
- [ ] Принимать JSON с позициями элементов
- [ ] Генерировать HTML динамически
- [ ] Рендерить в PNG

---

## Структура файлов (итог)

```
swipely-nextjs/
├── app/
│   └── (dashboard)/
│       └── editor/
│           └── page.tsx          # Страница редактора
├── components/
│   └── editor/
│       ├── SlideCanvas.tsx       # Рабочая область
│       ├── DraggableElement.tsx  # Обёртка drag-and-drop
│       ├── LayersPanel.tsx       # Панель слоёв
│       ├── Toolbar.tsx           # Панель инструментов
│       └── elements/
│           ├── TextElement.tsx
│           ├── AvatarElement.tsx
│           ├── DecorationElement.tsx
│           └── IconElement.tsx
├── lib/
│   ├── store/
│   │   └── editorStore.ts        # Zustand store
│   └── templates/
│       ├── types.ts              # TypeScript типы
│       └── grid_multi.json       # Пример шаблона
```

---

## Прогресс

| Фаза | Статус | Дата |
|------|--------|------|
| Фаза 1: Базовый Canvas | ✅ Готово | 01.02.2026 |
| Фаза 2: State и UI | ✅ Готово | 01.02.2026 |
| Фаза 3: Шаблоны | ⏳ В работе | — |
| Фаза 4: Интеграция | ⬜ Не начато | — |

---

## Заметки

- Масштаб canvas: 1080×1350 → ~540×675 на экране (50%)
- Библиотека @dnd-kit выбрана за модульность и React 18+ поддержку
- Zustand — легковесный state manager без boilerplate
