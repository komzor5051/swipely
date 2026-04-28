// ============================================
// PRICING CONFIG (ТАРИФЫ И ЭКОНОМИКА)
// ============================================
// Swipely Bot - Модель: Подписки + Pay-per-use
// Целевая маржинальность: ≥66%

module.exports = {
  // ==================== СЕБЕСТОИМОСТЬ ====================
  costs: {
    // Gemini 3 Pro Image = $0.15/слайд ≈ 13.5₽
    photoSlide: 13.5, // рублей за 1 AI-слайд

    // Gemini 2.5 Flash Lite = практически бесплатно
    standardCarousel: 0.5, // рублей за карусель (условно)

    // Курс USD/RUB для расчётов
    usdRate: 90
  },

  // ==================== ПОДПИСКИ ====================
  subscriptions: {
    free: {
      id: 'free',
      name: 'Free',
      nameRu: 'Бесплатный',
      price: 0,
      features: {
        standardLimit: 3,        // каруселей в месяц
        photoModeAccess: false,  // Photo Mode недоступен
        photoDiscount: 0,        // скидка на Photo Mode
        priority: false,         // приоритетная очередь
        noWatermark: false       // без водяного знака
      },
      description: '3 карусели в месяц (Standard)'
    },

    pro: {
      id: 'pro',
      name: 'PRO',
      nameRu: 'PRO',
      price: 990,
      priceYearly: 9900, // 2 месяца бесплатно
      features: {
        standardLimit: -1,       // безлимит (-1 = unlimited)
        photoModeAccess: true,   // Photo Mode доступен
        photoDiscount: 20,       // 20% скидка на Photo Mode
        priority: true,          // приоритетная очередь
        noWatermark: true        // без водяного знака
      },
      description: '∞ Standard + 20% скидка на AI-фото'
    }
  },

  // ==================== PAY-PER-USE (Photo Mode) ====================
  photoModePricing: {
    // Базовые цены (для FREE пользователей)
    base: {
      3: { price: 149, cost: 40.5, margin: 0.73 },
      5: { price: 249, cost: 67.5, margin: 0.73 },
      7: { price: 349, cost: 94.5, margin: 0.73 }
    },

    // Цены для PRO подписчиков (20% скидка)
    pro: {
      3: { price: 119, cost: 40.5, margin: 0.66 },
      5: { price: 199, cost: 67.5, margin: 0.66 },
      7: { price: 279, cost: 94.5, margin: 0.66 }
    }
  },

  // ==================== ПОШТУЧНАЯ ПОКУПКА СЛАЙДОВ ====================
  // Цена выше пакетов (33₽ минимум), но позволяет докупить недостающие
  perSlidePricing: {
    free: 49,   // 49₽/слайд для FREE (маржа 72%)
    pro: 39     // 39₽/слайд для PRO (маржа 65%, скидка 20%)
  },

  // ==================== ПАКЕТЫ СЛАЙДОВ (опционально) ====================
  // Предоплаченные пакеты Photo Mode слайдов
  slidePacks: {
    small: {
      id: 'pack_small',
      name: '15 слайдов',
      slides: 15,
      price: 490,           // ~33₽/слайд
      savings: '10%',
      cost: 202.5,          // 15 × 13.5₽
      margin: 0.59
    },
    medium: {
      id: 'pack_medium',
      name: '50 слайдов',
      slides: 50,
      price: 1490,          // ~30₽/слайд
      savings: '20%',
      cost: 675,            // 50 × 13.5₽
      margin: 0.55
    },
    large: {
      id: 'pack_large',
      name: '150 слайдов',
      slides: 150,
      price: 3990,          // ~27₽/слайд
      savings: '30%',
      cost: 2025,           // 150 × 13.5₽
      margin: 0.49
    }
  },

  // ==================== ХЕЛПЕРЫ ====================

  /**
   * Получить цену Photo Mode для пользователя
   * @param {number} slideCount - количество слайдов (3, 5, 7)
   * @param {string} subscriptionTier - тариф пользователя ('free' | 'pro')
   * @returns {number} цена в рублях
   */
  getPhotoModePrice(slideCount, subscriptionTier = 'free') {
    const pricing = subscriptionTier === 'pro'
      ? this.photoModePricing.pro
      : this.photoModePricing.base;

    return pricing[slideCount]?.price || pricing[5].price;
  },

  /**
   * Получить скидку для PRO пользователя
   * @param {number} basePrice - базовая цена
   * @returns {number} цена со скидкой
   */
  applyProDiscount(basePrice) {
    const discount = this.subscriptions.pro.features.photoDiscount;
    return Math.round(basePrice * (1 - discount / 100));
  },

  /**
   * Проверить лимит Standard генераций
   * @param {number} usedCount - использовано генераций
   * @param {string} subscriptionTier - тариф пользователя
   * @returns {boolean} можно ли генерировать
   */
  canGenerateStandard(usedCount, subscriptionTier = 'free') {
    const limit = this.subscriptions[subscriptionTier]?.features.standardLimit;
    if (limit === -1) return true; // unlimited
    return usedCount < limit;
  },

  /**
   * Получить оставшийся лимит
   * @param {number} usedCount - использовано генераций
   * @param {string} subscriptionTier - тариф пользователя
   * @returns {number|string} оставшееся количество или '∞'
   */
  getRemainingLimit(usedCount, subscriptionTier = 'free') {
    const limit = this.subscriptions[subscriptionTier]?.features.standardLimit;
    if (limit === -1) return '∞';
    return Math.max(0, limit - usedCount);
  },

  /**
   * Форматировать цену для отображения
   * @param {number} price - цена в рублях
   * @returns {string} форматированная строка
   */
  formatPrice(price) {
    return `${price.toLocaleString('ru-RU')}₽`;
  },

  // ==================== TELEGRAM STARS ====================
  // Курс: 1 Star ≈ 1.66₽ (при покупке пользователем)
  // Наценка +15% для компенсации комиссий Apple/Google (30%)
  // Конверсия: RUB × 1.15 / 1.66 ≈ RUB × 0.693
  starsMultiplier: 0.693,

  starsPricing: {
    photoMode: {
      3: 103,   // 149₽ → 103⭐
      5: 173,   // 249₽ → 173⭐
      7: 242    // 349₽ → 242⭐
    },
    slidePacks: {
      small: 340,   // 490₽ → 340⭐
      medium: 1033, // 1490₽ → 1033⭐
      large: 2765   // 3990₽ → 2765⭐
    },
    pro: {
      month: 686,   // 990₽ → 686⭐
      year: 6861    // 9900₽ → 6861⭐
    }
  },

  /**
   * Получить цену в Stars для Photo Mode
   * @param {number} slideCount - количество слайдов (3, 5, 7)
   * @returns {number} цена в Stars
   */
  getPhotoModeStarsPrice(slideCount) {
    return this.starsPricing.photoMode[slideCount] || this.starsPricing.photoMode[5];
  },

  /**
   * Конвертировать рубли в Stars с наценкой
   * @param {number} rubPrice - цена в рублях
   * @returns {number} цена в Stars (округлённая вверх)
   */
  getStarsPrice(rubPrice) {
    return Math.ceil(rubPrice * this.starsMultiplier);
  },

  /**
   * Получить цену за 1 слайд (поштучная покупка)
   * @param {string} subscriptionTier - тариф пользователя ('free' | 'pro')
   * @returns {number} цена за 1 слайд в рублях
   */
  getPerSlidePrice(subscriptionTier = 'free') {
    return subscriptionTier === 'pro'
      ? this.perSlidePricing.pro
      : this.perSlidePricing.free;
  },

  /**
   * Рассчитать стоимость докупки недостающих слайдов
   * @param {number} needed - сколько слайдов нужно
   * @param {number} balance - текущий баланс
   * @param {string} subscriptionTier - тариф пользователя
   * @returns {object} { slidesToBuy, totalPrice, pricePerSlide }
   */
  calculateTopUp(needed, balance, subscriptionTier = 'free') {
    const slidesToBuy = Math.max(0, needed - balance);
    const pricePerSlide = this.getPerSlidePrice(subscriptionTier);
    const totalPrice = slidesToBuy * pricePerSlide;

    return {
      slidesToBuy,
      totalPrice,
      pricePerSlide
    };
  }
};
