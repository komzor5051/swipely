# Swipely Editor

Веб-редактор каруселей для Swipely Bot. Позволяет редактировать текст сгенерированных каруселей и экспортировать в PNG.

## Архитектура

```
Бот генерирует карусель
    ↓
Создает сессию через API (токен на 24ч)
    ↓
Отправляет кнопку "Редактировать" → edit.swipely.ai/{token}
    ↓
Пользователь редактирует текст в браузере
    ↓
Экспортирует PNG через html2canvas
```

## Технологии

- React 18 + TypeScript + Vite
- Tailwind CSS
- html2canvas для экспорта PNG
- Supabase для хранения сессий
- Vercel Edge Functions для API

## Локальная разработка

```bash
# Установка зависимостей
npm install

# Запуск dev-сервера (http://localhost:3001)
npm run dev

# Сборка
npm run build
```

## Environment Variables

Скопируйте `.env.example` в `.env.local` и заполните:

```env
# Frontend (Vite)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# API (Vercel)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
EDITOR_URL=https://edit.swipely.ai
EDITOR_BOT_SECRET=your-secret-key
```

## API Endpoints

### POST /api/sessions
Создает новую сессию редактирования. Только для бота.

**Headers:** `Authorization: Bearer {BOT_SECRET}`

**Body:**
```json
{
  "userId": 123456789,
  "carouselData": { "slides": [...] },
  "stylePreset": "minimal_pop",
  "format": "portrait",
  "username": "@user"
}
```

**Response:**
```json
{
  "token": "abc123xyz456",
  "editUrl": "https://edit.swipely.ai/abc123xyz456",
  "expiresAt": "2026-02-01T12:00:00Z"
}
```

### GET /api/sessions/{token}
Получает данные сессии.

### PUT /api/sessions/{token}
Обновляет carouselData сессии.

## Деплой на Vercel

1. Создайте проект на Vercel
2. Подключите репозиторий
3. Настройте домен `edit.swipely.ai`
4. Добавьте Environment Variables в Vercel Dashboard

## Supabase

Выполните миграцию для создания таблицы сессий:

```sql
-- swipely-bot/supabase/migrations/create_carousel_edit_sessions.sql
```
