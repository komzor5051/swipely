// Strategist agent — first stage of the 3-agent generation pipeline.
// Receives topic + constraints, outputs a carousel strategy (hook, slide plan, angles).

import { callGemini } from "../gemini";
import { buildStrategistPrompt } from "../prompts/strategist";
import { designPresets } from "../presets";
import type { FrameworkId, StrategyOutput } from "../types";

export interface StrategistInput {
  topic: string;
  templateId: string;
  slideCount: number;
  tone?: string;
  framework?: FrameworkId;
}

const STRATEGY_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    hookType: { type: "STRING" },
    hookFormula: { type: "STRING" },
    slideplan: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          type: {
            type: "STRING",
            enum: ["hook", "tension", "value", "accent", "insight", "proof", "contrast", "steps", "cta"],
          },
          angle: { type: "STRING" },
          element: { type: "STRING", nullable: true },
        },
        required: ["type", "angle"],
      },
    },
    keyAngles: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    ctaType: { type: "STRING" },
  },
  required: ["hookType", "hookFormula", "slideplan", "keyAngles", "ctaType"],
} as const;

export async function runStrategist(input: StrategistInput): Promise<StrategyOutput> {
  const preset = designPresets[input.templateId];
  const templateTone = preset?.tone;

  const prompt = buildStrategistPrompt({
    topic: input.topic,
    slideCount: input.slideCount,
    tone: input.tone,
    framework: input.framework,
    templateTone,
  });

  const response = await callGemini(
    prompt,
    {
      model: "gemini-2.5-flash-lite",
      temperature: 0.7,
      thinkingBudget: 0,
      responseSchema: STRATEGY_RESPONSE_SCHEMA as Record<string, unknown>,
    },
    "strategist",
  );

  const strategy: StrategyOutput = JSON.parse(response.text);

  // Validate slide count matches request
  if (strategy.slideplan.length !== input.slideCount) {
    console.warn(
      `Strategist returned ${strategy.slideplan.length} slides, expected ${input.slideCount}. Adjusting.`,
    );
    // Trim or pad — trim excess, pad with value slides if short
    if (strategy.slideplan.length > input.slideCount) {
      // Keep first (hook) and last (cta), trim middle
      const hook = strategy.slideplan[0];
      const cta = strategy.slideplan[strategy.slideplan.length - 1];
      const middle = strategy.slideplan.slice(1, -1).slice(0, input.slideCount - 2);
      strategy.slideplan = [hook, ...middle, cta];
    } else {
      while (strategy.slideplan.length < input.slideCount) {
        // Insert value slide before the last (cta)
        const insertIdx = strategy.slideplan.length - 1;
        strategy.slideplan.splice(insertIdx, 0, {
          type: "value",
          angle: "Дополнительный аргумент по теме",
        });
      }
    }
  }

  return strategy;
}
