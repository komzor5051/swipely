// Copywriter agent — writes slide copy based on the strategist's plan.
// Second agent in the 3-agent pipeline: strategist -> copywriter -> formatter.

import type { StrategyOutput, CopywriterOutput } from "../types";
import { designPresets } from "../presets";
import { contentTones } from "../presets";
import { callGemini } from "../gemini";
import { buildCopywriterPrompt } from "../prompts/copywriter";

export interface CopywriterInput {
  strategy: StrategyOutput;
  text: string;
  templateId: string;
  tone?: string;
  tovGuidelines?: string;
  brief?: string;
}

export async function runCopywriter(input: CopywriterInput): Promise<CopywriterOutput> {
  const { strategy, text, templateId, tone, tovGuidelines, brief } = input;

  const preset = designPresets[templateId];
  if (!preset) {
    throw new Error(`Unknown template: ${templateId}`);
  }

  const contentTone = tone ? contentTones[tone] : undefined;

  const prompt = buildCopywriterPrompt({
    strategy,
    text,
    presetName: preset.name,
    presetTone: preset.tone,
    maxWords: preset.max_words_per_slide,
    contentTone,
    tovGuidelines,
    brief,
  });

  const response = await callGemini(
    prompt,
    {
      temperature: 0.7,
      thinkingBudget: 0,
    },
    "copywriter",
  );

  const parsed = JSON.parse(response.text) as CopywriterOutput;

  return parsed;
}
