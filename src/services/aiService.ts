import { CarouselGenerationResponse, FormatSettings } from "../types";

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export const generateCarouselContent = async (
  topic: string,
  style: string = 'auto',
  settings?: FormatSettings
): Promise<CarouselGenerationResponse | null> => {
  console.log('🚀 Starting generation for topic:', topic);
  console.log('⚙️ Format settings:', settings);

  if (!OPENROUTER_API_KEY) {
    console.error("❌ OpenRouter API Key missing");
    alert("Ошибка: API ключ OpenRouter не найден");
    return null;
  }

  console.log('✅ API Key present');

  // Default settings if not provided
  const finalSettings: FormatSettings = settings || {
    language: 'ru',
    slideCount: 10,
    includeOriginalText: false,
    visualStorytellingEnabled: false,
  };

  const lang = finalSettings.language === 'ru' ? 'Russian' : 'English';
  const pattern = style === 'auto' ? 'auto' : style;
  const includeOriginal = finalSettings.includeOriginalText ? `First slide: "${topic}"` : '';

  try {
    console.log('📡 Sending request to OpenRouter...');
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.href,
        'X-Title': 'Swipely.ai'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-haiku',
        messages: [
          {
            role: 'system',
            content: `CRITICAL: Output ONLY raw JSON. No explanations, no markdown, no text before or after. Start with { and end with }.

You are an expert Instagram carousel creator (10+ years). Generate viral carousel JSON.

STRUCTURE:
Slide 1: HOOK (pattern interrupt, curiosity gap, bold claim, pain/benefit)
  Examples: "5 ошибок, которые...", "Почему 90% не знают...", "Простой способ..."
Slides 2-N-1: VALUE (actionable tips, insights, steps, examples)
Slide N: CTA (save, share, follow, next step)

COPYWRITING:
- Title: ≤7 words. Specific, numbers/questions, create curiosity
- Content: ≤28 words. Clear benefit, conversational, easy to scan
- Voice: ADAPT to user's input tone (don't impose fixed style)

DESIGN:
- Colors: Match emotion (calm blues, energetic oranges, trust greens, creative purples)
- Pattern: Match vibe (solid/gradient minimal, dots/stripes/grid dynamic, sketch creative)

VIRAL PRINCIPLES:
Use hooks (numbers, "how to", "why", contradictions), curiosity gaps, balance creativity + practicality. Avoid clichés.

RULES:
1. Output starts with { and ends with }
2. NO text before or after JSON
3. Strict limits: title ≤7 words, content ≤28 words
4. Valid HEX: #RRGGBB
5. Structure: Hook → Value → CTA

{"globalDesign":{"backgroundColor":"#hex","accentColor":"#hex","pattern":"solid|gradient-tr|gradient-bl|dots|stripes|grid|sketch"},"slides":[{"title":"text","content":"text"}]}`
          },
          {
            role: 'user',
            content: `Topic: ${topic}
Lang: ${lang}
Count: ${finalSettings.slideCount}
Pattern: ${pattern}${includeOriginal ? `\nInclude: "${topic}"` : ''}`
          }
        ]
      })
    });

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenRouter API error:', errorText);
      alert(`Ошибка API: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    console.log('📦 Response data:', data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ Invalid response format from OpenRouter');
      alert('Ошибка: Неверный формат ответа от API');
      return null;
    }

    // Очистить ответ от markdown блоков если есть
    let content = data.choices[0].message.content;
    console.log('📝 Raw content:', content);

    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    console.log('🧹 Cleaned content:', content);

    const result = JSON.parse(content) as CarouselGenerationResponse;
    console.log('✅ Parsed result:', result);

    return result;
  } catch (error) {
    console.error("❌ Error generating carousel:", error);
    alert(`Ошибка генерации: ${error}`);
    return null;
  }
};
