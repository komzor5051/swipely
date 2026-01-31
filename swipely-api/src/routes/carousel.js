/**
 * Carousel generation routes
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { generateCarouselContent } = require('../services/openrouter');
const { checkGenerationLimit, trackGeneration } = require('../services/supabase');

/**
 * POST /api/carousel/generate
 * Generate carousel content using AI
 *
 * Headers: Authorization: tma <initData>
 * Body: { topic: string, settings: { language, slideCount, style, includeOriginalText } }
 * Returns: { success: true, data: { globalDesign, slides } }
 */
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const { topic, settings = {} } = req.body;
    const profile = req.profile;

    if (!topic || topic.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Topic is required (min 3 characters)'
      });
    }

    // Check generation limit
    const limitCheck = await checkGenerationLimit(profile.id);

    if (!limitCheck.canGenerate) {
      return res.status(403).json({
        success: false,
        error: 'Generation limit reached',
        usage: {
          used: limitCheck.used,
          limit: limitCheck.limit,
          remaining: 0,
          isPro: limitCheck.isPro
        }
      });
    }

    console.log(`🎨 Generating carousel for user ${profile.telegram_id}`);
    console.log(`   Topic: ${topic.substring(0, 50)}...`);
    console.log(`   Settings:`, settings);

    // Generate content
    const carouselData = await generateCarouselContent(topic, {
      language: settings.language || 'ru',
      slideCount: settings.slideCount || 5,
      style: settings.style || 'auto',
      includeOriginalText: settings.includeOriginalText || false
    });

    // Track generation
    await trackGeneration(profile.id, 'carousel', {
      topic: topic.substring(0, 200),
      language: settings.language,
      slideCount: settings.slideCount,
      style: settings.style
    });

    // Get updated usage
    const updatedLimit = await checkGenerationLimit(profile.id);

    res.json({
      success: true,
      data: carouselData,
      usage: {
        used: updatedLimit.used,
        limit: updatedLimit.limit,
        remaining: updatedLimit.remaining,
        isPro: updatedLimit.isPro
      }
    });

  } catch (error) {
    console.error('❌ Generation error:', error.message);

    // Return appropriate error
    if (error.message.includes('API error')) {
      return res.status(502).json({
        success: false,
        error: 'AI service temporarily unavailable'
      });
    }

    if (error.message.includes('Invalid AI response')) {
      return res.status(500).json({
        success: false,
        error: 'AI returned invalid response, please try again'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Generation failed'
    });
  }
});

module.exports = router;
