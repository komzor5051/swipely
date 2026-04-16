// Pipeline orchestrator — runs the 3-agent generation pipeline.
// strategist -> copywriter -> formatter (standard mode)
// formatter only (preserve-text mode, D5)

import { runStrategist } from "./agents/strategist";
import { runCopywriter } from "./agents/copywriter";
import { runFormatter } from "./agents/formatter";
import { GeminiError } from "./gemini";
import type { PipelineInput, PipelineOutput, PipelineError } from "./types";

export class PipelineFailedError extends Error {
  constructor(
    message: string,
    public readonly pipelineError: PipelineError,
  ) {
    super(message);
    this.name = "PipelineFailedError";
  }
}

export async function generateCarousel(input: PipelineInput): Promise<PipelineOutput> {
  const { text, templateId, slideCount, tone, framework, tovGuidelines, brief, preserveText } = input;

  // Preserve-text mode: formatter only (D5)
  if (preserveText) {
    try {
      return await runFormatter({
        rawText: text,
        templateId,
        slideCount,
        preserveText: true,
      });
    } catch (error) {
      throw wrapError(error, "formatter");
    }
  }

  // Standard mode: strategist -> copywriter -> formatter

  // Stage 1: Strategist
  let strategy;
  try {
    strategy = await runStrategist({
      topic: text,
      templateId,
      slideCount,
      tone,
      framework,
    });
  } catch (error) {
    throw wrapError(error, "strategist");
  }

  // Stage 2: Copywriter
  let copywriterOutput;
  try {
    copywriterOutput = await runCopywriter({
      strategy,
      text,
      templateId,
      tone,
      tovGuidelines,
      brief,
    });
  } catch (error) {
    throw wrapError(error, "copywriter");
  }

  // Stage 3: Formatter
  try {
    return await runFormatter({
      copywriterOutput,
      templateId,
      slideCount,
    });
  } catch (error) {
    throw wrapError(error, "formatter");
  }
}

function wrapError(error: unknown, stage: PipelineError["stage"]): PipelineFailedError {
  if (error instanceof PipelineFailedError) {
    return error;
  }

  const message = error instanceof GeminiError
    ? error.message
    : error instanceof Error
      ? error.message
      : "Unknown error";

  return new PipelineFailedError(
    `Pipeline failed at ${stage}: ${message}`,
    { stage, message, cause: error },
  );
}
