# Swipely Bot - Экономика и Тарифы

## Модель монетизации: Подписки + Pay-per-use

### Себестоимость генерации

| Режим | Модель AI | Стоимость/слайд |
|-------|-----------|-----------------|
| Standard (HTML) | Gemini 2.5 Flash Lite | ~0₽ (бесплатно) |
| Photo Mode (AI) | Gemini 3 Pro Image | ~13.5₽ ($0.15) |

---

## Подписки

### FREE (Бесплатный)
- **Цена**: 0₽
- **Standard каруселей**: 3/месяц
- **Photo Mode**: недоступен
- **Водяной знак**: да

### PRO
- **Цена**: 990₽/мес или 9 900₽/год
- **Standard каруселей**: безлимит
- **Photo Mode**: доступен со скидкой 20%
- **Водяной знак**: нет
- **Приоритет**: да

---

## Pay-per-use (Photo Mode)

### Разовая оплата

| Слайдов | Цена (FREE) | Цена (PRO) | Себестоимость | Маржа |
|---------|-------------|------------|---------------|-------|
| 3 | 149₽ | 119₽ | 40₽ | 73%/66% |
| 5 | 249₽ | 199₽ | 67₽ | 73%/66% |
| 7 | 349₽ | 279₽ | 94₽ | 73%/66% |

### Пакеты слайдов (выгоднее)

| Пакет | Слайдов | Цена | Цена/слайд | Экономия | Маржа |
|-------|---------|------|------------|----------|-------|
| Small | 15 | 490₽ | 33₽ | 10% | 59% |
| Medium | 50 | 1 490₽ | 30₽ | 20% | 55% |
| Large | 150 | 3 990₽ | 27₽ | 30% | 49% |

---

## Финансовые показатели

### Целевая маржинальность
- Pay-per-use: **66-73%**
- Пакеты: **49-59%**
- PRO подписка: **~95%** (Standard почти бесплатный)

### Средний чек (прогноз)
- Разовая покупка Photo: 199₽
- Пакет слайдов: 1 490₽
- PRO подписка: 990₽/мес × 6 мес = 5 940₽ LTV

---

## Интеграция платежей

### TODO: YooKassa (ЮКасса)
```javascript
// Планируемая интеграция
const { YooCheckout } = require('@a2seven/yoo-checkout');

const checkout = new YooCheckout({
  shopId: process.env.YOOKASSA_SHOP_ID,
  secretKey: process.env.YOOKASSA_SECRET_KEY
});

// Создание платежа
const payment = await checkout.createPayment({
  amount: { value: '490.00', currency: 'RUB' },
  confirmation: { type: 'redirect', return_url: 'https://t.me/SwipelyBot' },
  description: 'Пакет 15 слайдов',
  metadata: { user_id: telegramId, product: 'pack_small' }
});
```

### Webhook для подтверждения оплаты
```javascript
// POST /webhook/yookassa
app.post('/webhook/yookassa', (req, res) => {
  const { event, object } = req.body;

  if (event === 'payment.succeeded') {
    const { metadata } = object;
    const { user_id, product } = metadata;

    // Начисляем товар
    if (product.startsWith('pack_')) {
      db.addPhotoSlides(user_id, pack.slides);
    } else if (product.startsWith('pro_')) {
      db.activateProSubscription(user_id, months);
    }

    // Уведомляем пользователя
    bot.sendMessage(user_id, '✅ Оплата прошла!');
  }

  res.status(200).send('OK');
});
```

---

## Команды бота

| Команда | Описание |
|---------|----------|
| `/start` | Начало работы |
| `/account` | Статус аккаунта и баланс |
| `/buy` | Страница покупок |
| `/username` | Настройка юзернейма |

---

## Файлы конфигурации

- `src/config/pricing.js` - Тарифы и цены
- `src/services/database.js` - Функции работы с балансом
- `src/utils/copy.js` - Тексты UI (раздел `pricing`)

---

## Схема работы

```
Пользователь отправляет текст
         ↓
Выбор количества слайдов (3/5/7/10/12)
         ↓
Выбор формата (квадрат/портрет)
         ↓
Выбор режима:
├─ Standard → Проверка лимита (3/мес FREE, ∞ PRO)
│             └─ OK → Выбор стиля → Генерация → Списание
│             └─ Лимит → Предложение PRO
│
└─ Photo Mode → Проверка баланса слайдов
                └─ OK → Выбор стиля → Фото → Генерация → Списание
                └─ Нет баланса → Оплата → Генерация
```
