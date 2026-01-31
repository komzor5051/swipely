/**
 * Authentication routes
 */

const express = require('express');
const router = express.Router();
const { verifyInitData } = require('../services/telegram');
const { getOrCreateProfile } = require('../services/supabase');

/**
 * POST /api/auth/telegram
 * Verify Telegram initData and return user profile
 *
 * Body: { initData: string }
 * Returns: { success: true, user: {...}, profile: {...} }
 */
router.post('/telegram', async (req, res) => {
  try {
    const { initData } = req.body;

    if (!initData) {
      return res.status(400).json({
        success: false,
        error: 'initData is required'
      });
    }

    // Verify initData signature
    const verification = verifyInitData(initData);

    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        error: verification.error
      });
    }

    console.log(`✅ Telegram auth verified for user: ${verification.user.id}`);

    // Get or create profile in database
    const profile = await getOrCreateProfile(verification.user);

    res.json({
      success: true,
      user: verification.user,
      profile: {
        id: profile.id,
        telegramId: profile.telegram_id,
        fullName: profile.full_name,
        subscriptionTier: profile.subscription_tier,
        subscriptionStatus: profile.subscription_status,
        createdAt: profile.created_at
      },
      authDate: verification.authDate
    });

  } catch (error) {
    console.error('❌ Auth error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile (requires auth header)
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Authorization required'
      });
    }

    const [scheme, initData] = authHeader.split(' ');

    if (!initData) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authorization'
      });
    }

    const verification = verifyInitData(initData);

    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        error: verification.error
      });
    }

    const profile = await getOrCreateProfile(verification.user);

    res.json({
      success: true,
      user: verification.user,
      profile: {
        id: profile.id,
        telegramId: profile.telegram_id,
        fullName: profile.full_name,
        subscriptionTier: profile.subscription_tier,
        subscriptionStatus: profile.subscription_status,
        createdAt: profile.created_at
      }
    });

  } catch (error) {
    console.error('❌ Get profile error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile'
    });
  }
});

module.exports = router;
