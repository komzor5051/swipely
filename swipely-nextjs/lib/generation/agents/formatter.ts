// Formatter agent — third and final stage of the 3-agent generation pipeline.
// Validates and normalizes copywriter output into strict SlideData[] JSON.
// Acts as a safety net: ensures the renderer never receives malformed data.

import type { SlideData, SlideLayout, SlideElement } from "@/components/slides/types";
import { callGemini, SLIDE_RESPONSE_SCHEMA } from "../gemini";
import { buildFormatterPrompt } from "../prompts/formatter";
import { v1DesignPresets as designPresets } from "../presets";
import type { CopywriterOutput, PipelineOutput } from "../types";

export interface FormatterInput {
  copywriterOutput?: CopywriterOutput;
  rawText?: string;
  templateId: string;
  slideCount: number;
  preserveText?: boolean;
}

export type FormatterOutput = PipelineOutput;

const VALID_TYPES = new Set([
  "hook", "tension", "value", "accent", "insight", "proof", "contrast", "steps", "cta",
]);

const VALID_LAYOUTS = new Set<SlideLayout>([
  "text-left", "text-right", "split", "big-number", "quote", "default", "hero", "cta", "centered",
]);

const VALID_ELEMENT_TYPES = new Set([
  "none", "list", "stat", "bar_chart", "pie_chart", "line_chart", "horizontal_bar",
  "code_block", "quote_block", "stat_cards",
]);

export async function runFormatter(input: FormatterInput): Promise<FormatterOutput> {
  const preset = designPresets[input.templateId];
  const maxWords = preset?.max_words_per_slide ?? 30;
  const templateName = preset?.name ?? input.templateId;
  const templateTone = preset?.tone ?? "professional";

  const prompt = buildFormatterPrompt({
    copywriterOutput: input.copywriterOutput,
    rawText: input.rawText,
    templateName,
    templateTone,
    maxWords,
    slideCount: input.slideCount,
    preserveText: input.preserveText,
  });

  const response = await callGemini(
    prompt,
    {
      model: "gemini-2.5-flash-lite",
      temperature: 0.3,
      thinkingBudget: 0,
      responseSchema: SLIDE_RESPONSE_SCHEMA as Record<string, unknown>,
    },
    "formatter",
  );

  const raw = JSON.parse(response.text) as {
    slides: Record<string, unknown>[];
    post_caption: string;
  };

  // Post-process and validate each slide
  const slides = normalizeSlides(raw.slides, input.slideCount, maxWords);

  // Validate layout variety (D11)
  enforceLayoutVariety(slides);

  return {
    slides,
    postCaption: cleanText(raw.post_caption ?? ""),
  };
}

// --- Post-processing & validation ---

function normalizeSlides(
  rawSlides: Record<string, unknown>[],
  expectedCount: number,
  maxWords: number,
): SlideData[] {
  let slides = rawSlides.map((raw) => normalizeSlide(raw, maxWords));

  // Ensure exact slide count
  if (slides.length > expectedCount) {
    // Keep first (hook) and last (cta), trim from middle
    const hook = slides[0];
    const cta = slides[slides.length - 1];
    const middle = slides.slice(1, -1).slice(0, expectedCount - 2);
    slides = [hook, ...middle, cta];
  } else {
    while (slides.length < expectedCount) {
      // Duplicate the last value-type slide before CTA
      const insertIdx = Math.max(slides.length - 1, 1);
      slides.splice(insertIdx, 0, {
        type: "value",
        title: slides[Math.min(insertIdx, slides.length - 1)]?.title ?? "",
        content: "",
        layout: "default",
        element: { type: "none" },
      });
    }
  }

  return slides;
}

function normalizeSlide(raw: Record<string, unknown>, maxWords: number): SlideData {
  const type = VALID_TYPES.has(raw.type as string) ? (raw.type as string) : "value";
  const title = cleanTitle(String(raw.title ?? ""));
  const content = truncateWords(cleanText(String(raw.content ?? "")), maxWords);
  const layout = VALID_LAYOUTS.has(raw.layout as SlideLayout)
    ? (raw.layout as SlideLayout)
    : "default";
  const element = normalizeElement(raw.element as Record<string, unknown> | undefined);

  return { type, title, content, layout, element };
}

function normalizeElement(raw: Record<string, unknown> | undefined): SlideElement {
  if (!raw || !VALID_ELEMENT_TYPES.has(raw.type as string)) {
    return { type: "none" };
  }

  const elType = raw.type as string;

  switch (elType) {
    case "none":
      return { type: "none" };

    case "stat":
      if (!raw.value || !raw.label) return { type: "none" };
      return { type: "stat", value: String(raw.value), label: String(raw.label) };

    case "list":
    case "bar_chart":
    case "pie_chart":
    case "line_chart":
    case "horizontal_bar": {
      const items = normalizeChartItems(raw.items);
      if (items.length < 2) return { type: "none" };
      return { type: elType, items } as SlideElement;
    }

    case "code_block": {
      const title = String(raw.title ?? "");
      const lines = Array.isArray(raw.lines) ? raw.lines.map(String) : [];
      if (lines.length === 0) return { type: "none" };
      return { type: "code_block", title, lines };
    }

    case "quote_block": {
      const quote = String(raw.quote ?? "");
      if (!quote) return { type: "none" };
      return { type: "quote_block", quote };
    }

    case "stat_cards": {
      const cards = Array.isArray(raw.cards)
        ? raw.cards
            .filter((c: unknown) => c && typeof c === "object")
            .map((c: Record<string, unknown>) => ({
              value: String(c.value ?? ""),
              label: String(c.label ?? ""),
            }))
            .filter((c) => c.value && c.label)
        : [];
      if (cards.length < 2) return { type: "none" };
      return { type: "stat_cards", cards };
    }

    default:
      return { type: "none" };
  }
}

function normalizeChartItems(raw: unknown): Array<{ label: string; value: number }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item: unknown) => item && typeof item === "object")
    .map((item: Record<string, unknown>) => ({
      label: String(item.label ?? ""),
      value: Number(item.value ?? 0),
    }))
    .filter((item) => item.label);
}

/**
 * Enforce layout variety (D11).
 * For carousels of 5+ slides, ensure at least 3 different layout types.
 * Mutates the array in place.
 */
function enforceLayoutVariety(slides: SlideData[]): void {
  if (slides.length < 5) return;

  const uniqueLayouts = new Set(slides.map((s) => s.layout));
  if (uniqueLayouts.size >= 3) return;

  // Pick alternative layouts not yet used
  const allLayouts: SlideLayout[] = [
    "default", "split", "text-left", "text-right", "big-number", "centered",
  ];
  const unused = allLayouts.filter((l) => !uniqueLayouts.has(l));

  // Reassign layouts on middle slides (skip first and last)
  for (let i = 1; i < slides.length - 1 && uniqueLayouts.size < 3; i++) {
    const currentLayout = slides[i].layout ?? "default";
    // Only change if this layout appears more than once
    const count = slides.filter((s) => s.layout === currentLayout).length;
    if (count > 1 && unused.length > 0) {
      slides[i].layout = unused.shift()!;
      uniqueLayouts.add(slides[i].layout!);
    }
  }
}

// --- Text cleaning utilities ---

/**
 * Remove markdown, emoji, and stray formatting from text.
 */
function cleanText(text: string): string {
  return text
    // Remove markdown bold/italic
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
    // Remove markdown headers
    .replace(/^#{1,6}\s+/gm, "")
    // Remove markdown list markers
    .replace(/^[-*]\s+/gm, "")
    // Remove emoji (Unicode ranges)
    .replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{FE0F}]/gu,
      "",
    )
    .trim();
}

/**
 * Clean title: remove markdown, emoji, wrapping quotes. Preserve <hl> tags.
 */
function cleanTitle(title: string): string {
  let cleaned = cleanText(title);
  // Remove wrapping quotes
  cleaned = cleaned.replace(/^["']+|["']+$/g, "");
  // Ensure at most one <hl> tag pair
  const hlMatches = cleaned.match(/<hl>.*?<\/hl>/g);
  if (hlMatches && hlMatches.length > 1) {
    // Keep only the first <hl> tag
    let first = true;
    cleaned = cleaned.replace(/<hl>(.*?)<\/hl>/g, (match) => {
      if (first) {
        first = false;
        return match;
      }
      return match.replace(/<\/?hl>/g, "");
    });
  }
  return cleaned;
}

/**
 * Truncate text to maxWords, preserving sentence boundaries when possible.
 */
function truncateWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;

  const truncated = words.slice(0, maxWords);
  let result = truncated.join(" ");

  // Try to end at a sentence boundary
  const lastPeriod = result.lastIndexOf(".");
  const lastExcl = result.lastIndexOf("!");
  const lastQ = result.lastIndexOf("?");
  const lastBoundary = Math.max(lastPeriod, lastExcl, lastQ);

  if (lastBoundary > result.length * 0.5) {
    result = result.slice(0, lastBoundary + 1);
  }

  return result;
}
