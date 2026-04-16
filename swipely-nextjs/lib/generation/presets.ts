import type { DesignPreset } from "./types";

// Single source of truth for design presets (D8).
// Both /api/generate and /api/v1/generate import from here.

export const designPresets: Record<string, DesignPreset> = {
  swipely: { name: "Swipely", max_words_per_slide: 35, tone: "modern, tech-savvy, energetic, startup vibe, bold statements" },
  grid_multi: { name: "Grid Multi", max_words_per_slide: 30, tone: "data-driven, statistics, educational, engaging hooks" },
  purple_accent: { name: "Purple Accent", max_words_per_slide: 35, tone: "bold, modern branding, professional, impactful statements" },
  receipt: { name: "Receipt", max_words_per_slide: 25, tone: "bold statements, brand messaging, manifesto-style, concise" },
  quote_doodle: { name: "Quote Doodle", max_words_per_slide: 30, tone: "thoughtful, question-based, conversational, insightful" },
  speech_bubble: { name: "Speech Bubble", max_words_per_slide: 20, tone: "quotable, memorable, wisdom-based, attribution-style" },
  star_highlight: { name: "Star Highlight", max_words_per_slide: 25, tone: "elegant, sophisticated, designer-focused, serif typography" },
  photo_mode: { name: "AI Photo", max_words_per_slide: 25, tone: "impactful, concise, visual-first" },
  street: { name: "Street", max_words_per_slide: 25, tone: "bold, raw, street culture, all-caps energy, high contrast statements. КРИТИЧЕСКИ ВАЖНО: заголовки — максимум 3-4 коротких слова, как названия дропов (JUST DO IT, STAY RAW, НОВЫЕ ПРАВИЛА). Никаких длинных предложений в заголовке." },
  chapter: { name: "Chapter", max_words_per_slide: 35, tone: "editorial, literary, thoughtful. Заголовки как названия глав книги — ёмкие, значимые, без лишних слов. Первый слайд — сильный тезис, который останавливает." },
  dispatch: { name: "Dispatch", max_words_per_slide: 30, tone: "newsletter, analytical, direct. Заголовки как темы выпусков — конкретные и интригующие. Контент структурирован, информативен, без воды." },
  frame: { name: "Frame", max_words_per_slide: 30, tone: "premium, refined, poetic. Заголовки лаконичные и образные, как подписи к арт-объектам. Первый слайд — центральная идея, которая завораживает." },
  terminal: { name: "Terminal", max_words_per_slide: 30, tone: "hacker, tech, monospace, CLI-style. Заголовки как команды терминала — короткие, технические." },
  nikkei: { name: "Nikkei", max_words_per_slide: 25, tone: "Japanese minimalism, editorial, contrast. Заголовки лаконичные, как заголовки в Nikkei Asia." },
  swiss: { name: "Swiss", max_words_per_slide: 30, tone: "Swiss typography, grid-based, Helvetica-style, structured. Заголовки строгие, информативные." },
  kinfolk: { name: "Kinfolk", max_words_per_slide: 30, tone: "warm minimalism, serif, calm, thoughtful. Заголовки тихие и глубокие, как статьи Kinfolk." },
  blueprint: { name: "Blueprint", max_words_per_slide: 30, tone: "engineering, technical, schematic. Заголовки как названия чертежей — точные и функциональные." },
  polaroid: { name: "Polaroid", max_words_per_slide: 25, tone: "nostalgic, handwritten, personal. Заголовки как подписи к полароидным снимкам — тёплые и личные." },
  magazine: { name: "Magazine", max_words_per_slide: 30, tone: "glossy editorial, bold typography, magazine cover style. Заголовки крупные и цепляющие." },
  wabi: { name: "Wabi", max_words_per_slide: 25, tone: "wabi-sabi, earthy, textured, imperfect beauty. Заголовки созерцательные и философские." },
  newspaper: { name: "Newspaper", max_words_per_slide: 30, tone: "classic editorial, authoritative, structured. Заголовки как газетные — информативные, точные, без кликбейта. Content — факты и аргументы, чёткие абзацы. Стиль The Times: серьёзный, уважительный к читателю." },
  onetwo_dark: { name: "OneTwoPrime Dark", max_words_per_slide: 30, tone: "corporate, strict, professional, dark theme. Заголовки деловые и прямые." },
  onetwo_white: { name: "OneTwoPrime White", max_words_per_slide: 30, tone: "corporate, clean, professional, light theme. Заголовки деловые и прямые." },
  terracot: { name: "Terracot", max_words_per_slide: 45, tone: "editorial, warm, premium cheatsheet style. Section labels are short category words (CHEATSHEET, THE SOLUTION, THE PIPELINE, HOW IT WORKS, AUTOMATE EVERYTHING, THANK YOU). Headlines are bold declarative statements, 4-8 words max. Content is substantive — 2-3 short paragraphs with useful information, not just one-liners. Fill the slide with value. For slides with type 'tension' or 'contrast', write content as terminal commands or step-by-step pipeline (will render as code block + numbered steps). Use stat/list/code_block/quote_block/stat_cards elements for data slides. First slide: strong hook title with 2-3 tag pill keywords in content (one per line). Last slide: short punchy CTA title." },
};

// V1-specific presets not in the main set (tenant-scoped templates)
export const v1ExtraPresets: Record<string, DesignPreset> = {
  client_custom_v1: { name: "Client Custom", max_words_per_slide: 30, tone: "professional, direct, results-oriented" },
};

// Merged presets for V1 endpoint
export const v1DesignPresets: Record<string, DesignPreset> = {
  ...designPresets,
  ...v1ExtraPresets,
};

export const contentTones: Record<string, string> = {
  educational: `СТИЛЬ ПОДАЧИ: Обучающий, экспертный
• Давай конкретную пользу и практические советы
• Используй факты, статистику, примеры
• Структурируй информацию (шаги, списки, чек-листы)
• Позиционируй как эксперта, который делится знаниями`,
  entertaining: `СТИЛЬ ПОДАЧИ: Развлекательный, лёгкий
• Используй юмор, иронию, самоиронию
• Пиши как будто рассказываешь другу за кофе
• Добавляй неожиданные повороты и сравнения`,
  provocative: `СТИЛЬ ПОДАЧИ: Провокационный, вызывающий
• Ломай стереотипы и общепринятые мнения
• Используй контрастные, спорные заявления
• Задавай неудобные вопросы`,
  motivational: `СТИЛЬ ПОДАЧИ: Мотивационный, вдохновляющий
• Используй истории успеха и трансформации
• Говори о преодолении трудностей
• Вдохновляй на действие`,
};
