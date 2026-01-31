/**
 * Authentication middleware for Telegram Mini App
 */

const { verifyInitData } = require('../services/telegram');
const { getOrCreateProfile } = require('../services/supabase');

/**
 * Middleware to verify Telegram initData and attach user to request
 * Expects: Authorization header with "tma <initData>"
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    // Support both "tma <initData>" and "Bearer <initData>" formats
    const [scheme, initData] = authHeader.split(' ');

    if (!initData || (scheme !== 'tma' && scheme !== 'Bearer')) {
      return res.status(401).json({ error: 'Invalid authorization format' });
    }

    // Verify initData
    const verification = verifyInitData(initData);

    if (!verification.valid) {
      console.log(`❌ Auth failed: ${verification.error}`);
      return res.status(401).json({ error: verification.error });
    }

    // Get or create profile
    const profile = await getOrCreateProfile(verification.user);

    // Attach to request
    req.telegramUser = verification.user;
    req.profile = profile;
    req.authDate = verification.authDate;

    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Optional auth - doesn't fail if no auth, just sets req.profile to null
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      req.telegramUser = null;
      req.profile = null;
      return next();
    }

    const [scheme, initData] = authHeader.split(' ');

    if (!initData || (scheme !== 'tma' && scheme !== 'Bearer')) {
      req.telegramUser = null;
      req.profile = null;
      return next();
    }

    const verification = verifyInitData(initData);

    if (verification.valid) {
      const profile = await getOrCreateProfile(verification.user);
      req.telegramUser = verification.user;
      req.profile = profile;
      req.authDate = verification.authDate;
    } else {
      req.telegramUser = null;
      req.profile = null;
    }

    next();
  } catch (error) {
    req.telegramUser = null;
    req.profile = null;
    next();
  }
}

module.exports = {
  requireAuth,
  optionalAuth
};
