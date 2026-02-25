export interface Template {
  id: string;
  name: string;
  nameRu: string;
  description: string;
  preview: string;
  tags: string[];
  maxWordsPerSlide: number;
  tone: string;
}

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
    id: "frame",
    name: "Frame",
    nameRu: "Рамка",
    description: "Тёмный стиль с внутренней рамкой, угловыми декорами и золотыми акцентами",
    preview: "/previews/frame.png",
    tags: ["тёмный", "премиальный", "элегантный"],
    maxWordsPerSlide: 30,
    tone: "professional",
  },
];

export function getTemplate(id: string): Template | undefined {
  return templates.find((t) => t.id === id);
}

export function getTemplatesByTag(tag: string): Template[] {
  return templates.filter((t) => t.tags.includes(tag));
}
