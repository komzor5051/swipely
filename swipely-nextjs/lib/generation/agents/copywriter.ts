// Copywriter agent — writes slide copy based on the strategist's plan.
// Second agent in the 3-agent pipeline: strategist -> copywriter -> formatter.

import type { StrategyOutput, CopywriterOutput } from "../types";
import { v1DesignPresets as designPresets, contentTones } from "../presets";
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
      responseSchema: COPYWRITER_RESPONSE_SCHEMA as Record<string, unknown>,
    },
    "copywriter",
  );

  const parsed = JSON.parse(response.text);

  // Normalize field name: Gemini may return post_caption or postCaption
  const postCaption = parsed.postCaption ?? parsed.post_caption ?? "";

  return {
    slides: Array.isArray(parsed.slides) ? parsed.slides : [],
    postCaption,
  };
}

const COPYWRITER_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    slides: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          type: { type: "STRING" },
          title: { type: "STRING" },
          content: { type: "STRING" },
        },
        required: ["type", "title", "content"],
      },
    },
    postCaption: { type: "STRING" },
  },
  required: ["slides", "postCaption"],
} as const;
