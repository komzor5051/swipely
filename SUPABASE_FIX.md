# Исправление логирования в Supabase

## Проблема
Сообщения пользователя не записываются в базу данных из-за ошибки:
```
permission denied for table usage_tracking (код 42501)
```

**Причина:** RLS (Row Level Security) политики блокируют доступ к таблице usage_tracking.

## Что было исправлено в коде

### 1. Включён auth check (src/App.tsx:165-175)
```typescript
// Было (закомментировано):
// if (!user) {
//   setShowAuthModal(true);
//   return;
// }

// Стало:
if (!user) {
  setShowAuthModal(true);
  return;
}
```

### 2. Добавлено детальное логирование (src/App.tsx:423-432)
Теперь в metadata записывается:
- **topic** - тема карусели от пользователя
- **style** - выбранный стиль
- **language** - язык (russian/english)
- **slideCount** - количество слайдов
- **includeOriginal** - включать ли оригинальный текст
- **visualStorytelling** - включен ли визуальный сторителлинг
- **characterType** - тип персонажа
- **generatedSlides** - сколько слайдов сгенерировано

### 3. Улучшено логирование в usageService.ts
Добавлены console.log с эмодзи для отслеживания:
- 📊 Что записывается в базу
- ✅ Успешная запись
- ❌ Ошибки

## Как исправить в Supabase

### Вариант 1: Быстрое исправление (только RLS политики)
1. Откройте Supabase Dashboard: https://supabase.com/dashboard/project/ijmevkzcpsipyuufjemg/sql
2. Создайте новый SQL запрос
3. Скопируйте содержимое файла **`fix-rls-policies.sql`**
4. Вставьте и нажмите **Run**

### Вариант 2: Полная установка (все таблицы + политики)
Если таблицы вообще не созданы или нужна полная переустановка:
1. Откройте Supabase Dashboard: https://supabase.com/dashboard/project/ijmevkzcpsipyuufjemg/sql
2. Создайте новый SQL запрос
3. Скопируйте содержимое файла **`complete-setup.sql`**
4. Вставьте и нажмите **Run**

## Проверка работы

### 1. Запустите тест подключения
```bash
node test-supabase.js
```

**Ожидаемый результат:**
```
🔍 Проверка подключения к Supabase...
✅ Таблица usage_tracking доступна
✅✅✅ УСПЕШНО ЗАПИСАНО!
```

### 2. Проверьте в приложении
```bash
npm run dev
```

1. Зарегистрируйтесь или войдите
2. Создайте карусель
3. Проверьте консоль браузера:
```
📊 Запись в usage_tracking: {...}
✅ Успешно записано в usage_tracking: [...]
```

### 3. Проверьте в Supabase Dashboard
1. Откройте Table Editor: https://supabase.com/dashboard/project/ijmevkzcpsipyuufjemg/editor
2. Выберите таблицу **usage_tracking**
3. Должны появиться записи с metadata:
```json
{
  "topic": "5 способов улучшить продажи",
  "style": "auto",
  "language": "russian",
  "slideCount": 5,
  "includeOriginal": false,
  "visualStorytelling": false,
  "generatedSlides": 5
}
```

## Структура данных

### Таблица usage_tracking
| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Первичный ключ |
| user_id | UUID | ID пользователя (foreign key → profiles) |
| generation_type | TEXT | 'carousel' или 'image' |
| metadata | JSONB | Дополнительная информация о генерации |
| created_at | TIMESTAMP | Время создания |

### Пример записи metadata
```json
{
  "topic": "Как начать бизнес",
  "style": "modern",
  "language": "russian",
  "slideCount": 7,
  "includeOriginal": true,
  "visualStorytelling": true,
  "characterType": "3d",
  "generatedSlides": 7
}
```

## RLS Политики

После исправления будут созданы 3 политики:

1. **users_insert_own_usage** - пользователи могут записывать свои данные
2. **users_view_own_usage** - пользователи видят только свои записи
3. **service_role_all_access** - админы имеют полный доступ

## Troubleshooting

### Ошибка: "permission denied"
- Убедитесь, что выполнили SQL скрипт в Supabase
- Проверьте, что RLS включен: `ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;`
- Проверьте политики в Table Editor → usage_tracking → RLS policies

### Ошибка: "relation usage_tracking does not exist"
- Таблица не создана
- Выполните **complete-setup.sql**

### Записи не появляются
- Проверьте, что пользователь авторизован (user !== null)
- Проверьте консоль браузера на ошибки
- Запустите `node test-supabase.js` для диагностики

### Foreign key constraint violation
- Убедитесь, что в таблице profiles есть запись для пользователя
- Проверьте, что триггер `handle_new_user()` работает

## Полезные SQL запросы

### Посмотреть все генерации пользователя
```sql
SELECT
  u.*,
  p.email
FROM usage_tracking u
JOIN profiles p ON p.id = u.user_id
ORDER BY u.created_at DESC
LIMIT 50;
```

### Статистика по пользователям
```sql
SELECT
  p.email,
  p.subscription_tier,
  COUNT(u.id) as total_generations,
  COUNT(CASE WHEN u.created_at >= DATE_TRUNC('month', NOW()) THEN 1 END) as this_month
FROM profiles p
LEFT JOIN usage_tracking u ON u.user_id = p.id
GROUP BY p.id, p.email, p.subscription_tier
ORDER BY total_generations DESC;
```

### Посмотреть популярные темы
```sql
SELECT
  u.metadata->>'topic' as topic,
  COUNT(*) as count
FROM usage_tracking u
WHERE u.metadata->>'topic' IS NOT NULL
GROUP BY u.metadata->>'topic'
ORDER BY count DESC
LIMIT 20;
```

## Контакты

Проект: Swipely.ai - AI-powered Instagram carousel generator
База данных: https://supabase.com/dashboard/project/ijmevkzcpsipyuufjemg
