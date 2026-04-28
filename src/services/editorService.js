/**
 * Editor Service - интеграция с веб-редактором каруселей
 * Создает временные сессии для редактирования через edit.swipely.ai
 */

const { createClient } = require('@supabase/supabase-js');

const EDITOR_API_URL = process.env.EDITOR_API_URL || 'https://swipely-six.vercel.app';
const EDITOR_BOT_SECRET = process.env.EDITOR_BOT_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

// Supabase клиент для загрузки в Storage
const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

/**
 * Загружает массив base64 изображений в Supabase Storage (параллельно)
 * @param {number} userId - Telegram user ID
 * @param {Array<string>} images - Массив base64 изображений
 * @returns {Promise<Array<string>>} - Массив публичных URL
 */
async function uploadImagesToStorage(userId, images) {
  if (!supabase || !images || images.length === 0) {
    return null;
  }

  const timestamp = Date.now();

  console.log(`📤 Загружаю ${images.length} изображений в Supabase Storage (параллельно)...`);

  // Загружаем все изображения параллельно
  const uploadPromises = images.map(async (base64Data, i) => {
    if (!base64Data) {
      return null;
    }

    try {
      // Конвертируем base64 в Buffer
      const buffer = Buffer.from(base64Data, 'base64');
      const fileName = `${userId}/${timestamp}_slide_${i + 1}.webp`;

      // Загружаем в Storage как WebP (если исходник PNG, Supabase сохранит как есть)
      const { error } = await supabase.storage
        .from('carousel-images')
        .upload(fileName, buffer, {
          contentType: 'image/webp',
          upsert: true,
          cacheControl: '31536000', // Кешировать на год
        });

      if (error) {
        console.error(`❌ Ошибка загрузки изображения ${i + 1}:`, error.message);
        return null;
      }

      // Получаем публичный URL
      const { data: urlData } = supabase.storage
        .from('carousel-images')
        .getPublicUrl(fileName);

      console.log(`✅ Изображение ${i + 1} загружено`);
      return urlData.publicUrl;
    } catch (err) {
      console.error(`❌ Ошибка при загрузке изображения ${i + 1}:`, err.message);
      return null;
    }
  });

  const imageUrls = await Promise.all(uploadPromises);

  const successCount = imageUrls.filter(url => url !== null).length;
  console.log(`📤 Загружено ${successCount}/${images.length} изображений в Storage`);

  return imageUrls;
}

/**
 * Создает сессию редактирования и возвращает URL для редактора
 * @param {number} userId - Telegram user ID
 * @param {Object} carouselData - Данные карусели { slides: [...] }
 * @param {string} stylePreset - Название шаблона (minimal_pop, notebook, etc.)
 * @param {string} format - Формат (square | portrait)
 * @param {string} username - Username пользователя для отображения
 * @param {Array<string>} images - Массив base64 изображений (для Photo Mode)
 * @returns {Promise<{token: string, editUrl: string, expiresAt: string}|null>}
 */
async function createEditSession(userId, carouselData, stylePreset, format, username, images = null) {
  if (!EDITOR_BOT_SECRET) {
    console.log('⚠️ EDITOR_BOT_SECRET not configured, skipping edit session');
    return null;
  }

  try {
    console.log('📝 Creating edit session for user:', userId);
    console.log('🔗 Editor API URL:', EDITOR_API_URL);

    // Для Photo Mode: загружаем изображения в Storage и передаём URL вместо base64
    let imageUrls = null;
    if (images && images.length > 0) {
      console.log(`📸 Photo Mode: ${images.length} изображений`);
      imageUrls = await uploadImagesToStorage(userId, images);

      if (!imageUrls || imageUrls.every(url => url === null)) {
        console.error('❌ Не удалось загрузить изображения в Storage');
        // Продолжаем без изображений - редактор может работать без них
      }
    }

    const response = await fetch(`${EDITOR_API_URL}/api/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EDITOR_BOT_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        carouselData,
        stylePreset,
        format,
        username,
        imageUrls, // Передаём URL вместо base64
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Editor API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log('✅ Edit session created:', data.editUrl);

    return {
      token: data.token,
      editUrl: data.editUrl,
      expiresAt: data.expiresAt,
    };
  } catch (error) {
    console.error('❌ Failed to create edit session:', error.message);
    return null;
  }
}

/**
 * Проверяет доступность API редактора
 * @returns {Promise<boolean>}
 */
async function isEditorAvailable() {
  if (!EDITOR_BOT_SECRET) {
    return false;
  }

  try {
    const response = await fetch(`${EDITOR_API_URL}/api/health`, {
      method: 'GET',
      timeout: 5000,
    });
    return response.ok;
  } catch {
    return false;
  }
}

module.exports = {
  createEditSession,
  isEditorAvailable,
  uploadImagesToStorage,
};
