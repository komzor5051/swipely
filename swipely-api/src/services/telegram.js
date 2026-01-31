/**
 * Telegram WebApp initData verification
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */

const crypto = require('crypto');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Verify Telegram WebApp initData
 * @param {string} initData - Raw initData string from Telegram.WebApp.initData
 * @returns {{ valid: boolean, user: object | null, error?: string }}
 */
function verifyInitData(initData) {
  if (!initData) {
    return { valid: false, user: null, error: 'No initData provided' };
  }

  if (!BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN not configured');
    return { valid: false, user: null, error: 'Server configuration error' };
  }

  try {
    // Parse initData as URLSearchParams
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');

    if (!hash) {
      return { valid: false, user: null, error: 'No hash in initData' };
    }

    // Remove hash from params for verification
    params.delete('hash');

    // Sort params alphabetically and create data-check-string
    const dataCheckArr = [];
    params.sort();
    params.forEach((value, key) => {
      dataCheckArr.push(`${key}=${value}`);
    });
    const dataCheckString = dataCheckArr.join('\n');

    // Create secret key: HMAC_SHA256(bot_token, "WebAppData")
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest();

    // Calculate hash: HMAC_SHA256(data_check_string, secret_key)
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Compare hashes
    if (calculatedHash !== hash) {
      return { valid: false, user: null, error: 'Invalid hash' };
    }

    // Check auth_date (optional: reject if too old, e.g., > 1 hour)
    const authDate = parseInt(params.get('auth_date'), 10);
    const now = Math.floor(Date.now() / 1000);
    const MAX_AGE_SECONDS = 86400; // 24 hours

    if (now - authDate > MAX_AGE_SECONDS) {
      return { valid: false, user: null, error: 'initData expired' };
    }

    // Parse user data
    const userJson = params.get('user');
    if (!userJson) {
      return { valid: false, user: null, error: 'No user data' };
    }

    const user = JSON.parse(userJson);

    return {
      valid: true,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name || null,
        username: user.username || null,
        languageCode: user.language_code || 'ru',
        isPremium: user.is_premium || false,
        photoUrl: user.photo_url || null
      },
      authDate: new Date(authDate * 1000)
    };

  } catch (error) {
    console.error('❌ initData verification error:', error.message);
    return { valid: false, user: null, error: 'Verification failed' };
  }
}

/**
 * Parse user from initData without full verification (for development)
 * WARNING: Only use in development mode!
 */
function parseInitDataUnsafe(initData) {
  try {
    const params = new URLSearchParams(initData);
    const userJson = params.get('user');
    if (!userJson) return null;
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

module.exports = {
  verifyInitData,
  parseInitDataUnsafe
};
