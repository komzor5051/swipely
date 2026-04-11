import { designPresets } from "@/lib/generation/presets";

export interface Template {
  id: string;
  name: string;
  nameRu: string;
  description: string;
  preview: string;
  tags: string[];
  maxWordsPerSlide: number;
  tone: string;
  startOnly?: boolean; // requires "start" tier or above
  proOnly?: boolean;   // requires "pro" or "creator" tier
  tenantId?: string;   // tenant-scoped custom template (API v1)
}

// Helper: get max_words_per_slide from designPresets (single source of truth)
function presetWords(id: string, fallback: number): number {
  return designPresets[id]?.max_words_per_slide ?? fallback;
}

export const PRO_ONLY_TEMPLATE_IDS = ["chapter", "dispatch", "frame", "street", "grid_multi", "terminal", "nikkei", "swiss", "kinfolk", "blueprint", "polaroid", "magazine", "wabi", "onetwo_dark", "onetwo_white", "terracot"] as const;

export const templates: Template[] = [
  {
    id: "swipely",
    name: "Swipely",
    nameRu: "Swipely",
    description: "Фирменный стиль Swipely с синим градиентом и лайм-акцентами",
    preview: "/previews/swipely.png",
    tags: ["фирменный", "градиенты"],
    maxWordsPerSlide: presetWords("swipely", 35),
    tone: "professional",
  },
  {
    id: "grid_multi",
    name: "Grid Multi",
    nameRu: "Мультигрид",
    description: "Модульная сетка с яркими цветными блоками",
    preview: "/previews/grid_multi.png",
    tags: ["яркий", "модульный"],
    maxWordsPerSlide: 30,
    tone: "friendly",
    proOnly: true,
  },
  {
    id: "purple_accent",
    name: "Purple Accent",
    nameRu: "Фиолетовый акцент",
    description: "Стиль с фиолетовыми акцентами на светлом фоне",
    preview: "/previews/purple_accent.png",
    tags: ["светлый", "элегантный"],
    maxWordsPerSlide: presetWords("purple_accent", 35),
    tone: "professional",
  },
  {
    id: "receipt",
    name: "Receipt",
    nameRu: "Чек",
    description: "Стиль кассового чека с моноширинным текстом",
    preview: "/previews/receipt.png",
    tags: ["креативный", "моно"],
    maxWordsPerSlide: 25,
    tone: "friendly",
    startOnly: true,
  },
  {
    id: "quote_doodle",
    name: "Quote Doodle",
    nameRu: "Цитата-дудл",
    description: "Рисованный стиль с дудлами и цитатами",
    preview: "/previews/quote_doodle.png",
    tags: ["рисованный", "креативный"],
    maxWordsPerSlide: presetWords("quote_doodle", 30),
    tone: "friendly",
    startOnly: true,
  },
  {
    id: "speech_bubble",
    name: "Speech Bubble",
    nameRu: "Облачко",
    description: "Стиль с пузырями сообщений как в мессенджере",
    preview: "/previews/speech_bubble.png",
    tags: ["общение", "яркий"],
    maxWordsPerSlide: presetWords("speech_bubble", 20),
    tone: "friendly",
    startOnly: true,
  },
  {
    id: "star_highlight",
    name: "Star Highlight",
    nameRu: "Звёздный",
    description: "Стиль с выделением ключевых слов и звёздами",
    preview: "/previews/star_highlight.png",
    tags: ["яркий", "акценты"],
    maxWordsPerSlide: 25,
    tone: "energetic",
    startOnly: true,
  },
  {
    id: "street",
    name: "Street",
    nameRu: "Стритвир",
    description: "Жёсткий чёрно-белый стиль — огромный заголовок, clean разделитель",
    preview: "/previews/street.png",
    tags: ["светлый", "bold", "минималистичный"],
    maxWordsPerSlide: presetWords("street", 25),
    tone: "provocative",
    proOnly: true,
  },
  {
    id: "chapter",
    name: "Chapter",
    nameRu: "Глава",
    description: "Тёплый кремовый фон, серифный шрифт, номер-водяной знак и золотой акцент",
    preview: "/previews/chapter.png",
    tags: ["светлый", "серифный", "минималистичный"],
    maxWordsPerSlide: 35,
    tone: "professional",
    proOnly: true,
  },
  {
    id: "dispatch",
    name: "Dispatch",
    nameRu: "Диспатч",
    description: "Тёмный newsletter-стиль с фиолетовой шапкой и точками прогресса",
    preview: "/previews/dispatch.png",
    tags: ["тёмный", "newsletter", "структурированный"],
    maxWordsPerSlide: 30,
    tone: "professional",
    proOnly: true,
  },
  {
    id: "newspaper",
    name: "Newspaper",
    nameRu: "Газета",
    description: "Классический газетный стиль — Playfair Display, красные выделения, чёрно-белая строгость",
    preview: "/previews/newspaper.png",
    tags: ["светлый", "серифный", "эдиториал"],
    maxWordsPerSlide: 30,
    tone: "professional",
    proOnly: true,
  },
  {
    id: "frame",
    name: "Frame",
    nameRu: "Рамка",
    description: "Тёмный стиль с внутренней рамкой, угловыми декорами и золотыми акцентами",
    preview: "/previews/frame.png",
    tags: ["тёмный", "премиальный", "элегантный"],
    maxWordsPerSlide: 30,
    tone: "professional",
    proOnly: true,
  },
  {
    id: "terminal",
    name: "Terminal",
    nameRu: "Терминал",
    description: "Хакерский стиль с моноширинным шрифтом на тёмном фоне",
    preview: "/previews/terminal.png",
    tags: ["тёмный", "моно", "tech"],
    maxWordsPerSlide: 30,
    tone: "professional",
    proOnly: true,
  },
  {
    id: "nikkei",
    name: "Nikkei",
    nameRu: "Никкей",
    description: "Японская эстетика — минимализм, вертикальный текст, контрасты",
    preview: "/previews/nikkei.png",
    tags: ["тёмный", "минималистичный", "эдиториал"],
    maxWordsPerSlide: 25,
    tone: "professional",
    proOnly: true,
  },
  {
    id: "swiss",
    name: "Swiss",
    nameRu: "Швейцарский",
    description: "Швейцарский типографский стиль — строгая сетка, гротеск, красные акценты",
    preview: "/previews/swiss.png",
    tags: ["светлый", "минималистичный", "типографика"],
    maxWordsPerSlide: 30,
    tone: "professional",
    proOnly: true,
  },
  {
    id: "kinfolk",
    name: "Kinfolk",
    nameRu: "Кинфолк",
    description: "Тёплый минимализм в стиле журнала Kinfolk — серифы, воздух, спокойствие",
    preview: "/previews/kinfolk.png",
    tags: ["светлый", "серифный", "минималистичный"],
    maxWordsPerSlide: 30,
    tone: "professional",
    proOnly: true,
  },
  {
    id: "blueprint",
    name: "Blueprint",
    nameRu: "Чертёж",
    description: "Инженерный стиль — синий фон, белые линии, технические элементы",
    preview: "/previews/blueprint.png",
    tags: ["тёмный", "tech", "креативный"],
    maxWordsPerSlide: 30,
    tone: "professional",
    proOnly: true,
  },
  {
    id: "polaroid",
    name: "Polaroid",
    nameRu: "Полароид",
    description: "Стиль полароидных фотографий с рукописными подписями",
    preview: "/previews/polaroid.png",
    tags: ["светлый", "креативный", "ретро"],
    maxWordsPerSlide: 25,
    tone: "friendly",
    proOnly: true,
  },
  {
    id: "magazine",
    name: "Magazine",
    nameRu: "Журнал",
    description: "Глянцевый журнальный стиль — крупная типографика, колонки, акценты",
    preview: "/previews/magazine.png",
    tags: ["светлый", "эдиториал", "глянцевый"],
    maxWordsPerSlide: 30,
    tone: "professional",
    proOnly: true,
  },
  {
    id: "wabi",
    name: "Wabi",
    nameRu: "Ваби",
    description: "Японская эстетика ваби-саби — землистые тона, текстуры, несовершенство",
    preview: "/previews/wabi.png",
    tags: ["тёмный", "минималистичный", "текстурный"],
    maxWordsPerSlide: 25,
    tone: "professional",
    proOnly: true,
  },
  {
    id: "onetwo_dark",
    name: "OneTwoPrime Dark",
    nameRu: "1-2 Prime Тёмный",
    description: "Строгий корпоративный стиль на тёмном фоне",
    preview: "/previews/onetwo_dark.png",
    tags: ["тёмный", "корпоративный", "строгий"],
    maxWordsPerSlide: 30,
    tone: "professional",
    proOnly: true,
  },
  {
    id: "onetwo_white",
    name: "OneTwoPrime White",
    nameRu: "1-2 Prime Светлый",
    description: "Строгий корпоративный стиль на светлом фоне",
    preview: "/previews/onetwo_white.png",
    tags: ["светлый", "корпоративный", "строгий"],
    maxWordsPerSlide: 30,
    tone: "professional",
    proOnly: true,
  },
  {
    id: "terracot",
    name: "Terracot",
    nameRu: "Терракот",
    description: "Тёплый editorial — кремовый фон, терракотовые акценты, чередование светлых и тёмных слайдов",
    preview: "/previews/terracot.png",
    tags: ["editorial", "тёплый", "serif"],
    maxWordsPerSlide: presetWords("terracot", 45),
    tone: "editorial",
    proOnly: true,
  },
];

export function getTemplate(id: string): Template | undefined {
  return templates.find((t) => t.id === id);
}

export function getTemplatesByTag(tag: string): Template[] {
  return templates.filter((t) => t.tags.includes(tag));
}
