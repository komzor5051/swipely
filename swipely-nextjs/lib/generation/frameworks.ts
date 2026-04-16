import type { Framework, FrameworkId } from "./types";

// ---------------------------------------------------------------------------
// Framework definitions
// ---------------------------------------------------------------------------

export const FRAMEWORKS: Record<FrameworkId, Framework> = {
  mistakes: {
    id: "mistakes",
    label: "Mistakes",
    labelRu: "3 ошибки",
    slideProgression: ["hook", "mistake", "mistake", "mistake", "solution", "cta"],
    hookFormulas: [
      "{N} ошибок, из-за которых...",
      "Вы делаете это каждый день — и это убивает {result}",
    ],
    ctaType: "save",
    optimalSlideRange: { min: 5, max: 9 },
  },

  "case-study": {
    id: "case-study",
    label: "Case Study",
    labelRu: "Кейс-разбор",
    slideProgression: ["hook", "context", "process", "process", "results", "cta"],
    hookFormulas: [
      "Как мы увеличили {metric} в {N} раз за {period}",
      "Кейс: {result} за {period}",
    ],
    ctaType: "follow",
    optimalSlideRange: { min: 7, max: 12 },
  },

  "step-by-step": {
    id: "step-by-step",
    label: "Step by Step",
    labelRu: "Пошаговый гайд",
    slideProgression: ["hook", "step", "step", "step", "step", "summary", "cta"],
    hookFormulas: [
      "Пошаговый гайд: {goal} за {period}",
      "{N} шагов к {result}",
    ],
    ctaType: "save",
    optimalSlideRange: { min: 7, max: 12 },
  },

  "before-after": {
    id: "before-after",
    label: "Before / After",
    labelRu: "До/После",
    slideProgression: ["hook", "before", "before", "transformation", "after", "after", "cta"],
    hookFormulas: [
      "До: {pain}. После: {result}",
      "{metric} было {old} — стало {new}",
    ],
    ctaType: "action",
    optimalSlideRange: { min: 5, max: 9 },
  },

  "myths-vs-reality": {
    id: "myths-vs-reality",
    label: "Myths vs Reality",
    labelRu: "Мифы vs Реальность",
    slideProgression: ["hook", "myth", "reality", "myth", "reality", "conclusion", "cta"],
    hookFormulas: [
      "{N} мифов о {topic}, в которые вы верите",
      "Это неправда: {common belief}",
    ],
    ctaType: "share",
    optimalSlideRange: { min: 7, max: 12 },
  },

  checklist: {
    id: "checklist",
    label: "Checklist",
    labelRu: "Чек-лист",
    slideProgression: ["hook", "item", "item", "item", "item", "summary", "cta"],
    hookFormulas: [
      "Чек-лист: {N} пунктов для {goal}",
      "Проверь себя: {topic}",
    ],
    ctaType: "save",
    optimalSlideRange: { min: 5, max: 9 },
  },
};

// ---------------------------------------------------------------------------
// Note: Hook library is embedded directly in prompts/strategist.ts prompt.
// HOOK_LIBRARY was removed as dead code — the strategist prompt contains its own
// 18 concrete hook templates that are tuned for the prompt context.
