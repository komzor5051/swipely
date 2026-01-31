# Настройка монетизации InstaGenius Studio

## Реализовано

### ✅ Система авторизации
- Email/password регистрация и вход
- Автоматическое создание профиля
- Context для управления пользователем

### ✅ Система лимитов
- Free tier: 5 генераций в месяц
- Pro tier: безлимит
- Автоматический трекинг использования
- UI индикатор оставшихся генераций

### ✅ UI компоненты
- `AuthModal` - модальное окно авторизации
- `UsageBadge` - индикатор лимитов в header
- `UpgradeModal` - модальное окно для апгрейда
- `LimitReachedModal` - уведомление об исчерпании лимита

### ✅ Структура проекта
```
src/
├── App.tsx (модифицирован)
├── index.tsx (модифицирован)
├── contexts/
│   └── AuthContext.tsx
├── services/
│   ├── supabase.ts
│   ├── usageService.ts
│   └── geminiService.ts
├── hooks/
│   └── useUsageLimit.ts
├── components/
│   ├── Auth/
│   │   └── AuthModal.tsx
│   └── Subscription/
│       ├── UsageBadge.tsx
│       ├── UpgradeModal.tsx
│       └── LimitReachedModal.tsx
└── utils/
    └── constants.ts
```

---

## Шаги для запуска

### 1. Создать проект Supabase

1. Зайти на https://supabase.com
2. Создать новый проект
3. Скопировать **Project URL** и **anon public key**

### 2. Настроить базу данных

1. В Supabase Dashboard открыть **SQL Editor**
2. Скопировать содержимое файла `supabase-schema.sql`
3. Выполнить SQL скрипт
4. Проверить, что таблицы созданы в разделе **Table Editor**

### 3. Обновить .env.local

Заменить placeholder значения на реальные:

```bash
GEMINI_API_KEY=your_real_gemini_api_key

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Установить зависимости (уже установлено)

```bash
npm install
```

### 5. Запустить проект

```bash
npm run dev
```

Приложение откроется на `http://localhost:3000`

---

## Тестирование функционала

### Проверка авторизации

1. Открыть приложение
2. Нажать **"Войти"** в header
3. Перейти на таб **"Регистрация"**
4. Зарегистрироваться с email/password
5. После успешной регистрации появится badge с лимитами

### Проверка лимитов

1. Авторизоваться
2. Создать 5 каруселей подряд
3. На 6-й попытке должно появиться модальное окно "Лимит исчерпан"
4. Нажать **"Upgrade"** - откроется модальное окно с планами

### Проверка в Supabase

1. Открыть **Table Editor** в Supabase
2. Таблица `profiles` - должен появиться новый пользователь
3. Таблица `usage_tracking` - должны быть записи о генерациях
4. RLS policies работают (пользователи видят только свои данные)

---

## Следующие шаги (не реализовано)

### Интеграция ЮKassa

1. Зарегистрироваться в ЮKassa
2. Получить Shop ID и Secret Key
3. Создать Supabase Edge Function для webhook
4. Реализовать `paymentService.ts`
5. Добавить переменные в .env.local

### Сохранение проектов в облаке

1. Создать `useProjects` hook
2. Заменить localStorage на Supabase queries
3. Добавить синхронизацию между устройствами

### Deploy на продакшн

1. Vercel/Netlify для frontend
2. Настроить environment variables
3. Настроить custom domain

---

## Структура БД

### `profiles`
- `id` - UUID (foreign key → auth.users)
- `email` - TEXT
- `subscription_tier` - 'free' | 'pro'
- `subscription_status` - 'active' | 'cancelled' | 'expired'
- `subscription_started_at` - TIMESTAMP
- `subscription_ends_at` - TIMESTAMP

### `usage_tracking`
- `id` - UUID
- `user_id` - UUID (foreign key → auth.users)
- `generation_type` - 'carousel' | 'image'
- `created_at` - TIMESTAMP
- `metadata` - JSONB

### `projects`
- `id` - UUID
- `user_id` - UUID (foreign key → auth.users)
- `project_type` - 'carousel' | 'image'
- `title` - TEXT
- `data` - JSONB (Slide[] or {image, prompt})

### `payments`
- `id` - UUID
- `user_id` - UUID (foreign key → auth.users)
- `yookassa_payment_id` - TEXT
- `amount` - DECIMAL
- `status` - 'pending' | 'succeeded' | 'cancelled'
- `subscription_months` - INTEGER

---

## Pricing

### Free Tier
- 5 генераций в месяц
- Доступ к обоим режимам
- Экспорт в PNG
- Базовая поддержка

### PRO Tier
- **1 месяц**: 490₽
- **3 месяца**: 1290₽ (~430₽/мес, скидка 12%)
- **1 год**: 4490₽ (~374₽/мес, скидка 24%)

**Преимущества PRO:**
- Безлимитные генерации
- Экспорт в высоком качестве
- Приоритетная поддержка
- Доступ к новым функциям

---

## Troubleshooting

### Ошибка "Missing Supabase environment variables"
- Проверьте, что в `.env.local` заполнены `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`
- Перезапустите dev server после изменения .env

### Не работает авторизация
- Проверьте, что SQL схема выполнена в Supabase
- Проверьте RLS policies в Table Editor
- Откройте консоль браузера для ошибок

### Лимиты не обновляются
- Проверьте, что таблица `usage_tracking` создана
- Проверьте функцию `check_generation_limit` в Supabase Functions
- Обновите страницу для перезагрузки лимитов

---

## Контакты

Если возникли вопросы - проверьте план реализации в файле:
`/Users/lvmn/.claude/plans/ethereal-nibbling-castle.md`
