/**
 * Editor Service - интеграция с веб-редактором каруселей
 * Создает временные сессии для редактирования через edit.swipely.ai
 */

const EDITOR_API_URL = process.env.EDITOR_API_URL || 'https://swipely-six.vercel.app';
const EDITOR_BOT_SECRET = process.env.EDITOR_BOT_SECRET;

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
    if (images) {
      console.log(`📸 Including ${images.length} images for Photo Mode`);
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
        images,
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
};
