export interface Template {
  id: string;
  name: string;
  nameRu: string;
  description: string;
  preview: string;
  tags: string[];
  maxWordsPerSlide: number;
  tone: string;
  proOnly?: boolean;
  /** Requires Start tier or higher (paid) */
  startOnly?: boolean;
  /** If set, template is only accessible to API keys with matching tenant_id */
  tenantId?: string;
}

export const PRO_ONLY_TEMPLATE_IDS: readonly string[] = [];

export const templates: Template[] = [
  {
    id: "swipely",
    name: "Swipely",
    nameRu: "Swipely",
    description: "Фирменный стиль Swipely с синим градиентом и лайм-акцентами",
    preview: "/previews/swipely.png",
    tags: ["фирменный", "градиенты"],
    maxWordsPerSlide: 30,
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
  },
  {
    id: "purple_accent",
    name: "Purple Accent",
    nameRu: "Фиолетовый акцент",
    description: "Стиль с фиолетовыми акцентами на светлом фоне",
    preview: "/previews/purple_accent.png",
    tags: ["светлый", "элегантный"],
    maxWordsPerSlide: 30,
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
  },
  {
    id: "quote_doodle",
    name: "Quote Doodle",
    nameRu: "Цитата-дудл",
    description: "Рисованный стиль с дудлами и цитатами",
    preview: "/previews/quote_doodle.png",
    tags: ["рисованный", "креативный"],
    maxWordsPerSlide: 20,
    tone: "friendly",
  },
  {
    id: "speech_bubble",
    name: "Speech Bubble",
    nameRu: "Облачко",
    description: "Стиль с пузырями сообщений как в мессенджере",
    preview: "/previews/speech_bubble.png",
    tags: ["общение", "яркий"],
    maxWordsPerSlide: 25,
    tone: "friendly",
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
  },
  {
    id: "street",
    name: "Street",
    nameRu: "Стритвир",
    description: "Жёсткий чёрно-белый стиль — огромный заголовок, clean разделитель",
    preview: "/previews/street.png",
    tags: ["светлый", "bold", "минималистичный"],
    maxWordsPerSlide: 30,
    tone: "provocative",
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
  },
  {
    id: "terminal",
    name: "Terminal",
    nameRu: "Терминал",
    description: "Тёмный CLI-стиль с зелёным акцентом и моноширинным шрифтом",
    preview: "/previews/terminal.png",
    tags: ["тёмный", "моно", "tech"],
    maxWordsPerSlide: 25,
    tone: "provocative",
  },
  {
    id: "polaroid",
    name: "Polaroid",
    nameRu: "Поляроид",
    description: "Тёплый аналоговый стиль — белая карточка, скотч и Playfair Display",
    preview: "/previews/polaroid.png",
    tags: ["светлый", "серифный", "личный"],
    maxWordsPerSlide: 30,
    tone: "friendly",
  },
  {
    id: "blueprint",
    name: "Blueprint",
    nameRu: "Чертёж",
    description: "Тёмно-синий технический стиль с оранжевым акцентом и сеткой",
    preview: "/previews/blueprint.png",
    tags: ["тёмный", "tech", "структурированный"],
    maxWordsPerSlide: 30,
    tone: "professional",
    startOnly: true,
  },
  {
    id: "magazine",
    name: "Magazine",
    nameRu: "Журнал",
    description: "Редакционный двухколоночный стиль — Bebas Neue, Playfair Display, красный акцент",
    preview: "/previews/magazine.png",
    tags: ["светлый", "серифный", "эдиториал"],
    maxWordsPerSlide: 35,
    tone: "professional",
    startOnly: true,
  },
  {
    id: "kinfolk",
    name: "Kinfolk",
    nameRu: "Кинфолк",
    description: "Эдиториальный стиль — кремовый фон, засечки и золотой делитель",
    preview: "/previews/kinfolk.png",
    tags: ["светлый", "серифный", "личный"],
    maxWordsPerSlide: 30,
    tone: "professional",
    startOnly: true,
  },
  {
    id: "swiss",
    name: "Swiss",
    nameRu: "Швейцарский",
    description: "Строгая типографская сетка в стиле швейцарской школы",
    preview: "/previews/swiss.png",
    tags: ["светлый", "bold", "структурированный"],
    maxWordsPerSlide: 25,
    tone: "professional",
    startOnly: true,
  },
  {
    id: "wabi",
    name: "Wabi",
    nameRu: "Ваби-саби",
    description: "Японский минимализм — тёплый льняной фон и асимметрия",
    preview: "/previews/wabi.png",
    tags: ["светлый", "серифный", "личный"],
    maxWordsPerSlide: 25,
    tone: "friendly",
    startOnly: true,
  },
  {
    id: "nikkei",
    name: "Nikkei",
    nameRu: "Никкэй",
    description: "Деловой стиль с крупными цифрами и тонкими линиями",
    preview: "/previews/nikkei.png",
    tags: ["светлый", "структурированный", "данные"],
    maxWordsPerSlide: 30,
    tone: "professional",
    startOnly: true,
  },
];

// ─── Tenant-specific templates (B2B API only) ───
// Each entry has tenantId set — not shown in the public template picker.
// Register new client templates here and in SlideRenderer's TEMPLATE_MAP.
export const tenantTemplates: Template[] = [
  {
    id: "client_custom_v1",
    name: "Client Custom v1",
    nameRu: "Клиентский шаблон",
    description: "Брендированный шаблон для B2B клиента",
    preview: "/previews/client_custom_v1.png",
    tags: ["b2b", "кастомный"],
    maxWordsPerSlide: 30,
    tone: "professional",
    tenantId: "demo_client",
  },
  {
    id: "onetwo_dark",
    name: "OneTwoPrime Dark",
    nameRu: "ОТП Тёмный",
    description: "Премиальный тёмный шаблон с золотыми акцентами для OneTwoPrime",
    preview: "/previews/onetwo_dark.png",
    tags: ["b2b", "тёмный", "премиальный"],
    maxWordsPerSlide: 30,
    tone: "premium, real estate, personal brand, aspirational",
    tenantId: "onetwo_prime",
  },
  {
    id: "onetwo_white",
    name: "OneTwoPrime White",
    nameRu: "ОТП Белый",
    description: "Чистый светлый шаблон с золотыми акцентами для OneTwoPrime",
    preview: "/previews/onetwo_white.png",
    tags: ["b2b", "светлый", "премиальный"],
    maxWordsPerSlide: 30,
    tone: "clean, real estate, educational, professional",
    tenantId: "onetwo_prime",
  },
];

export function getTemplate(id: string): Template | undefined {
  return [...templates, ...tenantTemplates].find((t) => t.id === id);
}

/** Returns only public templates (no tenantId set) for the web UI */
export function getPublicTemplates(): Template[] {
  return templates.filter((t) => !t.tenantId);
}

export function getTemplatesByTag(tag: string): Template[] {
  return templates.filter((t) => t.tags.includes(tag));
}
