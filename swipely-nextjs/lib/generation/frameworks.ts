import type { Framework, FrameworkId, HookTemplate } from "./types";

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
// Hook library — 18 fill-in-the-blank templates
// ---------------------------------------------------------------------------

export const HOOK_LIBRARY: HookTemplate[] = [
  {
    pattern: "{N} ошибок, из-за которых вы теряете {outcome}",
    frameworks: ["mistakes"],
  },
  {
    pattern: "Как мы увеличили {metric} в {N} раз за {period}",
    frameworks: ["case-study"],
  },
  {
    pattern: "Перестаньте делать {action} — вот почему",
    frameworks: ["mistakes", "myths-vs-reality"],
  },
  {
    pattern: "Никто не говорит вам об этом, но {insight}",
    frameworks: ["myths-vs-reality", "case-study"],
  },
  {
    pattern: "{N} шагов к {result}, которые работают в {year}",
    frameworks: ["step-by-step", "checklist"],
  },
  {
    pattern: "До: {pain}. После: {result}. Что изменилось?",
    frameworks: ["before-after", "case-study"],
  },
  {
    pattern: "Вы до сих пор {old_way}? В {year} это уже не работает",
    frameworks: ["myths-vs-reality", "mistakes"],
  },
  {
    pattern: "Чек-лист для {role}: {N} пунктов, которые вы пропускаете",
    frameworks: ["checklist"],
  },
  {
    pattern: "Почему {common_approach} не работает (и что делать вместо)",
    frameworks: ["mistakes", "myths-vs-reality"],
  },
  {
    pattern: "{Famous_brand} делает {action}. А вы?",
    frameworks: ["case-study", "before-after"],
  },
  {
    pattern: "Формула {result}: {step1} + {step2} + {step3}",
    frameworks: ["step-by-step"],
  },
  {
    pattern: "Было {old_metric} — стало {new_metric}. Весь процесс по шагам",
    frameworks: ["before-after", "step-by-step"],
  },
  {
    pattern: "Миф: {belief}. Реальность: {truth}",
    frameworks: ["myths-vs-reality"],
  },
  {
    pattern: "{N} признаков того, что {problem}",
    frameworks: ["checklist", "mistakes"],
  },
  {
    pattern: "Мой путь от {start} до {end}: что я бы сделал иначе",
    frameworks: ["case-study", "before-after"],
  },
  {
    pattern: "Вот что произойдёт, если вы {action}",
    frameworks: ["before-after", "step-by-step"],
  },
  {
    pattern: "Сохрани, чтобы не потерять: {N} правил {topic}",
    frameworks: ["checklist", "step-by-step"],
  },
  {
    pattern: "Разбираю {topic} на пальцах — просто и без воды",
    frameworks: ["step-by-step", "myths-vs-reality"],
  },
];
