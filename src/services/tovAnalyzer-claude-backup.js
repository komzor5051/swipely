const axios = require('axios');

// ============================================
// TOV (TONE OF VOICE) ANALYZER
// ============================================
// Анализирует стиль текста пользователя через Claude (OpenRouter)

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = 'anthropic/claude-3.5-haiku';

/**
 * Анализирует Tone of Voice из примера текста пользователя
 * @param {string} exampleText - Пример текста пользователя
 * @returns {Promise<object>} - ToV профиль: {sentence_length, emoji_usage_rate, tone, language_level}
 */
async function analyzeToneOfVoice(exampleText) {
  if (!OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY не настроен');
    return getDefaultTovProfile();
  }

  try {
    console.log('🔍 Анализирую Tone of Voice через Claude...');

    const systemPrompt = `Ты — эксперт по анализу стиля текста. Твоя задача — проанализировать пример текста и выдать точный профиль Tone of Voice.

Проанализируй следующие параметры:
1. **sentence_length** - длина предложений: "short" (1-10 слов), "medium" (11-20 слов), "long" (20+ слов)
2. **emoji_usage_rate** - частота использования эмодзи в процентах (например: "5%", "20%", "0%")
3. **tone** - общий тон: "professional", "professional_friendly", "casual", "enthusiastic", "inspiring"
4. **language_level** - уровень языка: "simple" (простой), "intermediate" (средний), "advanced" (сложный)

Верни ТОЛЬКО JSON в формате:
{
  "sentence_length": "short/medium/long",
  "emoji_usage_rate": "X%",
  "tone": "...",
  "language_level": "simple/intermediate/advanced"
}`;

    const userPrompt = `Проанализируй стиль этого текста:\n\n${exampleText}`;

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://swipely.ai',
          'X-Title': 'Swipely ToV Analyzer'
        }
      }
    );

    const rawContent = response.data.choices[0].message.content;
    console.log('📦 Сырой ответ от Claude:', rawContent);

    // Очистка от markdown обертки
    let cleanedContent = rawContent.trim();

    // Удаляем ```json и ``` если есть
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    const tovProfile = JSON.parse(cleanedContent);
    console.log('✅ ToV профиль получен через Claude:', tovProfile);

    return tovProfile;

  } catch (error) {
    console.error('❌ Ошибка анализа ToV через Claude:', error.message);
    return getDefaultTovProfile();
  }
}

/**
 * Возвращает дефолтный ToV профиль
 */
function getDefaultTovProfile() {
  return {
    sentence_length: 'medium',
    emoji_usage_rate: '10%',
    tone: 'professional_friendly',
    language_level: 'intermediate'
  };
}

/**
 * Форматирует ToV профиль для отображения пользователю
 */
function formatTovProfile(tovProfile) {
  const lengthNames = {
    short: 'Короткие (1-10 слов)',
    medium: 'Средние (11-20 слов)',
    long: 'Длинные (20+ слов)'
  };

  const toneNames = {
    professional: 'Профессиональный',
    professional_friendly: 'Профессионально-дружелюбный',
    casual: 'Неформальный',
    enthusiastic: 'Восторженный',
    inspiring: 'Вдохновляющий'
  };

  const levelNames = {
    simple: 'Простой',
    intermediate: 'Средний',
    advanced: 'Сложный'
  };

  return {
    sentence_length: lengthNames[tovProfile.sentence_length] || tovProfile.sentence_length,
    emoji_usage_rate: tovProfile.emoji_usage_rate,
    tone: toneNames[tovProfile.tone] || tovProfile.tone,
    language_level: levelNames[tovProfile.language_level] || tovProfile.language_level
  };
}

module.exports = {
  analyzeToneOfVoice,
  getDefaultTovProfile,
  formatTovProfile
};
