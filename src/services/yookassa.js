// ============================================
// YOOKASSA PAYMENT SERVICE
// ============================================
// Интеграция с ЮКасса для приёма платежей
// Docs: https://yookassa.ru/developers/api

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const YOOKASSA_API_URL = 'https://api.yookassa.ru/v3';

// Конфигурация из .env
const SHOP_ID = process.env.YOOKASSA_SHOP_ID;
const SECRET_KEY = process.env.YOOKASSA_SECRET_KEY;

// Basic Auth header
const getAuthHeader = () => {
  const credentials = Buffer.from(`${SHOP_ID}:${SECRET_KEY}`).toString('base64');
  return `Basic ${credentials}`;
};

// Axios instance для ЮКассы
const yooApi = axios.create({
  baseURL: YOOKASSA_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Добавляем auth header к каждому запросу
yooApi.interceptors.request.use((config) => {
  config.headers.Authorization = getAuthHeader();
  return config;
});

/**
 * Создание платежа
 * @param {Object} params
 * @param {number} params.amount - Сумма в рублях
 * @param {string} params.description - Описание платежа
 * @param {Object} params.metadata - Метаданные (user_id, product_type, etc.)
 * @param {string} params.returnUrl - URL возврата после оплаты
 * @returns {Promise<Object>} Данные платежа с confirmation_url
 */
async function createPayment({ amount, description, metadata, returnUrl }) {
  try {
    const idempotenceKey = uuidv4();

    const response = await yooApi.post('/payments', {
      amount: {
        value: amount.toFixed(2),
        currency: 'RUB'
      },
      confirmation: {
        type: 'redirect',
        return_url: returnUrl
      },
      capture: true, // Автоматическое подтверждение платежа
      description,
      metadata
    }, {
      headers: {
        'Idempotence-Key': idempotenceKey
      }
    });

    console.log(`💳 Создан платёж ${response.data.id} на ${amount}₽`);

    return {
      success: true,
      paymentId: response.data.id,
      confirmationUrl: response.data.confirmation.confirmation_url,
      status: response.data.status
    };

  } catch (error) {
    console.error('❌ Ошибка создания платежа:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.description || error.message
    };
  }
}

/**
 * Проверка статуса платежа
 * @param {string} paymentId - ID платежа
 * @returns {Promise<Object>} Статус платежа
 */
async function getPaymentStatus(paymentId) {
  try {
    const response = await yooApi.get(`/payments/${paymentId}`);

    return {
      success: true,
      paymentId: response.data.id,
      status: response.data.status, // pending, waiting_for_capture, succeeded, canceled
      paid: response.data.paid,
      amount: parseFloat(response.data.amount.value),
      metadata: response.data.metadata
    };

  } catch (error) {
    console.error('❌ Ошибка получения статуса:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.description || error.message
    };
  }
}

/**
 * Ожидание завершения платежа (polling)
 * @param {string} paymentId - ID платежа
 * @param {number} maxAttempts - Максимум попыток (по умолчанию 60 = 5 минут)
 * @param {number} interval - Интервал проверки в мс (по умолчанию 5000 = 5 сек)
 * @returns {Promise<Object>} Финальный статус платежа
 */
async function waitForPayment(paymentId, maxAttempts = 60, interval = 5000) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await getPaymentStatus(paymentId);

    if (!result.success) {
      return result;
    }

    // Платёж завершён
    if (result.status === 'succeeded') {
      console.log(`✅ Платёж ${paymentId} успешно оплачен`);
      return { ...result, completed: true };
    }

    // Платёж отменён
    if (result.status === 'canceled') {
      console.log(`❌ Платёж ${paymentId} отменён`);
      return { ...result, completed: true, canceled: true };
    }

    // Ждём следующую проверку
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  // Таймаут
  return {
    success: false,
    error: 'timeout',
    paymentId
  };
}

/**
 * Проверка конфигурации
 */
function isConfigured() {
  return !!(SHOP_ID && SECRET_KEY);
}

/**
 * Генерация return URL для Telegram бота
 * @param {string} botUsername - Username бота
 * @param {string} paymentId - ID платежа для проверки
 */
function getTelegramReturnUrl(botUsername, paymentId) {
  // Deep link в бота с параметром платежа
  return `https://t.me/${botUsername}?start=payment_${paymentId}`;
}

module.exports = {
  createPayment,
  getPaymentStatus,
  waitForPayment,
  isConfigured,
  getTelegramReturnUrl
};
