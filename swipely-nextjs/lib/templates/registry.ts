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
    preview: "/previews/app_list.png",
    tags: ["фирменный", "градиенты"],
    maxWordsPerSlide: 30,
    tone: "professional",
  },
  {
    id: "aurora",
    name: "Aurora",
    nameRu: "Аврора",
    description: "Тёмный стиль с градиентами и мягким свечением",
    preview: "/previews/aurora.png",
    tags: ["тёмный", "градиенты"],
    maxWordsPerSlide: 25,
    tone: "professional",
  },
  {
    id: "notebook",
    name: "Notebook",
    nameRu: "Блокнот",
    description: "Минималистичный стиль на клетчатой бумаге",
    preview: "/previews/notebook.png",
    tags: ["минималистичный", "светлый"],
    maxWordsPerSlide: 30,
    tone: "friendly",
  },
  {
    id: "terminal",
    name: "Terminal",
    nameRu: "Терминал",
    description: "Хакерский стиль с зелёным текстом на чёрном фоне",
    preview: "/previews/terminal.png",
    tags: ["тёмный", "tech"],
    maxWordsPerSlide: 25,
    tone: "technical",
  },
  {
    id: "editorial",
    name: "Editorial",
    nameRu: "Журнальный",
    description: "Классический журнальный стиль с serif-шрифтами",
    preview: "/previews/editorial.png",
    tags: ["светлый", "классический"],
    maxWordsPerSlide: 30,
    tone: "professional",
  },
  {
    id: "backspace",
    name: "Backspace",
    nameRu: "Бэкспейс",
    description: "Тёмный технологичный стиль с моноширинным шрифтом",
    preview: "/previews/backspace.png",
    tags: ["тёмный", "tech"],
    maxWordsPerSlide: 25,
    tone: "technical",
  },
  {
    id: "lime_checklist",
    name: "Lime Checklist",
    nameRu: "Лайм-чеклист",
    description: "Яркий стиль с чеклистом и лаймовыми акцентами",
    preview: "/previews/lime_checklist.png",
    tags: ["яркий", "структурированный"],
    maxWordsPerSlide: 25,
    tone: "friendly",
  },
  {
    id: "luxe",
    name: "Luxe",
    nameRu: "Люкс",
    description: "Премиальный тёмный стиль с золотыми акцентами",
    preview: "/previews/luxe.png",
    tags: ["тёмный", "премиальный"],
    maxWordsPerSlide: 25,
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
    id: "app_list",
    name: "App List",
    nameRu: "Список приложений",
    description: "Стиль списка приложений с иконками и описаниями",
    preview: "/previews/app_list.png",
    tags: ["структурированный", "tech"],
    maxWordsPerSlide: 30,
    tone: "technical",
  },
  {
    id: "paper_image",
    name: "Paper Image",
    nameRu: "Бумага с фото",
    description: "Стиль рваной бумаги с областью для изображений",
    preview: "/previews/paper_image.png",
    tags: ["креативный", "фото"],
    maxWordsPerSlide: 25,
    tone: "friendly",
  },
];

export function getTemplate(id: string): Template | undefined {
  return templates.find((t) => t.id === id);
}

export function getTemplatesByTag(tag: string): Template[] {
  return templates.filter((t) => t.tags.includes(tag));
}
