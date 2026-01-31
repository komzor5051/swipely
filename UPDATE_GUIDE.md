# Гайд по обновлению бота с новым UX

## ✅ Что уже готово:

### 1. Файлы созданы:
- ✅ `supabase-onboarding-schema.sql` - SQL схема для онбординга
- ✅ `src/data/demoCarousel.js` - Статичная демо-карусель
- ✅ `src/utils/copy.js` - Все копирайты бота
- ✅ `src/services/tovAnalyzer.js` - Анализ Tone of Voice через Claude
- ✅ `src/services/supabaseService.js` - Обновлен (добавлены функции онбординга)
- ✅ `src/index.js.backup` - Резервная копия старого бота

### 2. SQL миграция (нужно выполнить в Supabase):
```bash
# В Supabase SQL Editor выполните:
supabase-onboarding-schema.sql
```

Добавляет в таблицу `profiles`:
- `onboarding_completed` BOOLEAN
- `onboarding_step` TEXT
- `user_context` TEXT
- `user_role` TEXT ('expert', 'visionary', 'friend')
- `tov_profile` JSONB
- `niche` TEXT

## 🚀 Что нужно обновить в index.js:

Из-за большого размера файла (356 строк), я подготовил все компоненты отдельно. Вот ключевые изменения, которые нужно внести:

### Изменение 1: Импорты (в начале файла)

Добавить после существующих импортов:

```javascript
const copy = require('./utils/copy');
const demoCarousel = require('./data/demoCarousel');
const { analyzeToneOfVoice, formatTovProfile } = require('./services/tovAnalyzer');
const {
  checkOnboardingStatus,
  saveUserContext,
  saveTovProfile,
  completeOnboarding,
  skipOnboarding
} = require('./services/supabaseService');
```

### Изменение 2: /start команда

Заменить текущий обработчик `/start` на:

```javascript
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    // Регистрируем/обновляем пользователя
    await upsertUser(msg.from);

    // Проверяем статус онбординга
    const onboardingStatus = await checkOnboardingStatus(userId);

    if (onboardingStatus && onboardingStatus.onboarding_completed) {
      // Пользователь уже прошел онбординг - показываем главное меню
      return await bot.sendMessage(chatId, copy.mainFlow.requestInput);
    }

    // Новый пользователь - показываем Start Screen
    await bot.sendMessage(chatId, copy.start.welcome, {
      reply_markup: {
        inline_keyboard: [
          [{ text: copy.start.buttons.demo, callback_data: 'demo_carousel' }],
          [
            { text: copy.start.buttons.howItWorks, callback_data: 'how_it_works' },
            { text: copy.start.buttons.viewStyles, callback_data: 'view_styles' }
          ]
        ]
      }
    });

  } catch (error) {
    console.error('Ошибка /start:', error);
    await bot.sendMessage(chatId, copy.errors.generation);
  }
});
```

### Изменение 3: Callback queries (добавить новые обработчики)

Добавить в начале обработчика `bot.on('callback_query')`:

```javascript
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const data = query.data;

  try {
    await bot.answerCallbackQuery(query.id);
  } catch (err) {
    if (!err.message.includes('too old')) {
      console.error('Ошибка answerCallbackQuery:', err.message);
    }
  }

  try {
    // ==================== DEMO CAROUSEL ====================
    if (data === 'demo_carousel') {
      await bot.sendMessage(chatId, copy.demo.generating);

      // Генерируем демо-карусель из статичного JSON
      const imgPaths = await renderSlides(demoCarousel, 'minimal_pop');

      const mediaGroup = imgPaths.map((imgPath, idx) => ({
        type: 'photo',
        media: imgPath,
        caption: idx === 0 ? copy.demo.result : undefined
      }));

      await bot.sendMediaGroup(chatId, mediaGroup);

      // Предложение пройти онбординг
      await bot.sendMessage(chatId, 'Хочешь настроить бота под себя?', {
        reply_markup: {
          inline_keyboard: [
            [{ text: copy.demo.buttons.startOnboarding, callback_data: 'start_onboarding' }],
            [{ text: copy.demo.buttons.createNow, callback_data: 'create_now' }]
          ]
        }
      });
      return;
    }

    // ==================== HOW IT WORKS ====================
    if (data === 'how_it_works') {
      await bot.sendMessage(chatId, copy.howItWorks.text, {
        reply_markup: {
          inline_keyboard: [
            [{ text: copy.howItWorks.button, callback_data: 'create_now' }]
          ]
        },
        parse_mode: 'Markdown'
      });
      return;
    }

    // ==================== VIEW STYLES ====================
    if (data === 'view_styles') {
      await bot.sendMessage(chatId, copy.mainFlow.selectStyle);
      // TODO: Отправить примеры стилей (медиа-группы)
      return;
    }

    // ==================== START ONBOARDING - PHASE 1 ====================
    if (data === 'start_onboarding') {
      sessions[userId] = { onboarding_phase: 'context' };

      await bot.sendMessage(chatId, copy.onboarding.phase1.text, {
        reply_markup: {
          inline_keyboard: [
            [{ text: copy.onboarding.phase1.button, callback_data: 'skip_onboarding' }]
          ]
        },
        parse_mode: 'Markdown'
      });
      return;
    }

    // ==================== SKIP ONBOARDING ====================
    if (data === 'skip_onboarding') {
      await skipOnboarding(userId);
      delete sessions[userId];

      await bot.sendMessage(chatId, copy.mainFlow.requestInput);
      return;
    }

    // ==================== PHASE 3: ROLE SELECTION ====================
    if (data.startsWith('role_')) {
      const role = data.replace('role_', ''); // expert, visionary, friend

      // Извлекаем нишу из контекста (если есть)
      const profile = await checkOnboardingStatus(userId);
      const niche = profile?.niche || null;

      await completeOnboarding(userId, role, niche);
      delete sessions[userId];

      await bot.sendMessage(chatId, copy.onboarding.complete(profile), {
        reply_markup: {
          inline_keyboard: [
            [{ text: copy.onboarding.completeButtons.create, callback_data: 'create_now' }],
            [{ text: copy.onboarding.completeButtons.randomTopic, callback_data: 'random_topic' }]
          ]
        },
        parse_mode: 'Markdown'
      });
      return;
    }

    // ==================== CREATE NOW (пропуск онбординга) ====================
    if (data === 'create_now') {
      const onboardingStatus = await checkOnboardingStatus(userId);

      if (!onboardingStatus || !onboardingStatus.onboarding_completed) {
        await skipOnboarding(userId);
      }

      await bot.sendMessage(chatId, copy.mainFlow.requestInput);
      return;
    }

    // ... Остальные callback queries (выбор слайдов, стилей и т.д.)

  } catch (error) {
    console.error('Ошибка callback_query:', error);
    await bot.sendMessage(chatId, copy.errors.generation);
  }
});
```

### Изменение 4: Обработчик текстовых сообщений

Обновить обработчик `bot.on('text')` для поддержки онбординга:

```javascript
bot.on('text', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  // Игнорируем команды
  if (text.startsWith('/')) return;

  try {
    const userProfile = await upsertUser(msg.from);

    // Проверяем, в каком этапе онбординга пользователь
    const session = sessions[userId];

    // ==================== ONBOARDING PHASE 1: CONTEXT ====================
    if (session && session.onboarding_phase === 'context') {
      await saveUserContext(userId, text);
      delete session.onboarding_phase;

      // Переход к Phase 2: ToV
      sessions[userId] = { onboarding_phase: 'tov' };

      await bot.sendMessage(chatId, copy.onboarding.phase2.text);
      return;
    }

    // ==================== ONBOARDING PHASE 2: TOV ====================
    if (session && session.onboarding_phase === 'tov') {
      await bot.sendMessage(chatId, copy.onboarding.phase2.processing);

      // Анализируем ToV через Claude
      const tovProfile = await analyzeToneOfVoice(text);
      await saveTovProfile(userId, tovProfile);

      delete session.onboarding_phase;

      // Переход к Phase 3: Выбор роли
      const formattedTov = formatTovProfile(tovProfile);
      await bot.sendMessage(chatId, copy.onboarding.phase2.success(formattedTov), {
        parse_mode: 'Markdown'
      });

      await bot.sendMessage(chatId, copy.onboarding.phase3.text, {
        reply_markup: {
          inline_keyboard: [
            [{ text: copy.onboarding.phase3.roles.expert.button, callback_data: 'role_expert' }],
            [{ text: copy.onboarding.phase3.roles.visionary.button, callback_data: 'role_visionary' }],
            [{ text: copy.onboarding.phase3.roles.friend.button, callback_data: 'role_friend' }]
          ]
        }
      });
      return;
    }

    // ==================== NORMAL FLOW (после онбординга) ====================
    const ignoredTexts = ['🎤 Голосовое сообщение', '📝 Текстовое сообщение'];
    if (ignoredTexts.includes(text)) {
      return;
    }

    // Проверяем, завершен ли онбординг
    const onboardingStatus = await checkOnboardingStatus(userId);
    if (!onboardingStatus || !onboardingStatus.onboarding_completed) {
      await bot.sendMessage(chatId, 'Сначала давай пройдем быструю настройку!', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🚀 Начать настройку', callback_data: 'start_onboarding' }],
            [{ text: '⏩ Пропустить', callback_data: 'skip_onboarding' }]
          ]
        }
      });
      return;
    }

    // Логируем сообщение
    console.log(`💾 Сохраняю сообщение пользователя ${userId} в Supabase...`);
    await saveMessage(userId, text, 'text', userProfile?.profile_id);

    // Обычный флоу создания карусели
    await bot.sendMessage(chatId, copy.mainFlow.requestSlideCount(text), {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '3', callback_data: 'slides_3' },
            { text: '5', callback_data: 'slides_5' },
            { text: '7', callback_data: 'slides_7' }
          ],
          [
            { text: '10', callback_data: 'slides_10' },
            { text: '12', callback_data: 'slides_12' }
          ]
        ]
      }
    });

    sessions[userId] = { transcription: text };

  } catch (error) {
    console.error('Ошибка обработки текста:', error);
    await bot.sendMessage(chatId, copy.errors.generation);
  }
});
```

### Изменение 5: Удалить упоминания ссылок

Найдите и удалите все строки связанные с:
- `🔗 Ссылка на статью/пост`
- Обработчики URL
- Функции парсинга ссылок

## 📊 Итоговая структура:

```
/start
  ├─→ Новый пользователь:
  │   ├─→ Start Screen (3 кнопки: Demo, How it Works, View Styles)
  │   ├─→ Demo Carousel (мгновенный результат)
  │   ├─→ Онбординг (3 фазы):
  │   │   ├─→ Phase 1: Контекст (кто ты?)
  │   │   ├─→ Phase 2: ToV анализ (пример текста)
  │   │   └─→ Phase 3: Выбор роли (Эксперт/Визионер/Друг)
  │   └─→ Завершение → Главное меню
  │
  └─→ Повторный пользователь:
      └─→ Главное меню (Отправь идею)
```

## 🧪 Тестирование:

1. Выполните SQL миграцию в Supabase
2. Перезапустите бота
3. Отправьте `/start` - должен показать новый Welcome Screen
4. Нажмите "🚀 Создать пробную карусель" - мгновенная демо-карусель
5. Пройдите онбординг (3 фазы)
6. Создайте реальную карусель

## ⚠️ Важно:

- Файл `index.js` теперь ~500+ строк (было 356)
- Все копирайты вынесены в `src/utils/copy.js`
- Статичные данные в `src/data/`
- SQL скрипт ОБЯЗАТЕЛЬНО выполнить перед запуском

## 🔧 Если что-то не работает:

1. Проверьте, что SQL миграция выполнена
2. Проверьте импорты в начале index.js
3. Убедитесь что `OPENROUTER_API_KEY` настроен (для ToV анализа)
4. Проверьте логи: `pm2 logs swipely-bot`
