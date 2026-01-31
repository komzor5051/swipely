/**
 * Usage tracking routes
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { checkGenerationLimit } = require('../services/supabase');

/**
 * GET /api/usage/check
 * Check current user's generation limit
 *
 * Headers: Authorization: tma <initData>
 * Returns: { success: true, usage: { canGenerate, remaining, limit, used, isPro } }
 */
router.get('/check', requireAuth, async (req, res) => {
  try {
    const profile = req.profile;

    const usage = await checkGenerationLimit(profile.id);

    res.json({
      success: true,
      usage: {
        canGenerate: usage.canGenerate,
        remaining: usage.remaining,
        limit: usage.limit,
        used: usage.used,
        isPro: usage.isPro,
        tier: profile.subscription_tier
      }
    });

  } catch (error) {
    console.error('❌ Usage check error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to check usage'
    });
  }
});

/**
 * GET /api/usage/stats
 * Get detailed usage statistics
 *
 * Headers: Authorization: tma <initData>
 * Returns: { success: true, stats: { thisMonth, total, lastGeneration } }
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const profile = req.profile;
    const { supabase } = require('../services/supabase');

    // Get this month's count
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: thisMonth } = await supabase
      .from('usage_tracking')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .gte('created_at', startOfMonth.toISOString());

    // Get total count
    const { count: total } = await supabase
      .from('usage_tracking')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id);

    // Get last generation
    const { data: lastGen } = await supabase
      .from('usage_tracking')
      .select('created_at, generation_type, metadata')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    res.json({
      success: true,
      stats: {
        thisMonth: thisMonth || 0,
        total: total || 0,
        lastGeneration: lastGen ? {
          date: lastGen.created_at,
          type: lastGen.generation_type,
          topic: lastGen.metadata?.topic
        } : null
      }
    });

  } catch (error) {
    console.error('❌ Stats error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get stats'
    });
  }
});

module.exports = router;
