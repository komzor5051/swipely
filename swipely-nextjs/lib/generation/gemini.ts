// Shared Gemini API caller for the generation pipeline.
// Used by all three agents (strategist, copywriter, formatter) and both endpoints.

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const GEMINI_BASE = process.env.GEMINI_PROXY_URL || "https://generativelanguage.googleapis.com";

export interface GeminiConfig {
  model?: string;
  maxOutputTokens?: number;
  temperature?: number;
  responseSchema?: Record<string, unknown>;
  thinkingBudget?: number;
  timeoutMs?: number;
  safetySettings?: Array<{ category: string; threshold: string }>;
}

export interface GeminiResponse {
  text: string;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

export class GeminiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly stage?: string,
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

const DEFAULT_CONFIG: Required<Pick<GeminiConfig, "model" | "maxOutputTokens" | "temperature" | "thinkingBudget" | "timeoutMs">> = {
  model: "gemini-2.5-flash-lite",
  maxOutputTokens: 8192,
  temperature: 0.7,
  thinkingBudget: 0,
  timeoutMs: 20_000,
};

export async function callGemini(
  prompt: string,
  config: GeminiConfig = {},
  stage?: string,
): Promise<GeminiResponse> {
  if (!GEMINI_API_KEY) {
    throw new GeminiError("AI service not configured (missing GOOGLE_GEMINI_API_KEY)", 500, stage);
  }

  const model = config.model ?? DEFAULT_CONFIG.model;
  const url = `${GEMINI_BASE}/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const generationConfig: Record<string, unknown> = {
    temperature: config.temperature ?? DEFAULT_CONFIG.temperature,
    maxOutputTokens: config.maxOutputTokens ?? DEFAULT_CONFIG.maxOutputTokens,
    responseMimeType: "application/json",
    thinkingConfig: { thinkingBudget: config.thinkingBudget ?? DEFAULT_CONFIG.thinkingBudget },
  };

  if (config.responseSchema) {
    generationConfig.responseSchema = config.responseSchema;
  }

  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig,
  };

  if (config.safetySettings) {
    body.safetySettings = config.safetySettings;
  }

  const requestBody = JSON.stringify(body);
  const timeoutMs = config.timeoutMs ?? DEFAULT_CONFIG.timeoutMs;

  let response = await fetchWithTimeout(url, requestBody, timeoutMs);

  // Retry once on 503/429 (transient errors)
  if (response.status === 503 || response.status === 429) {
    const retryDelay = response.status === 429 ? 3000 : 2000;
    await new Promise((r) => setTimeout(r, retryDelay));
    response = await fetchWithTimeout(url, requestBody, timeoutMs);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    console.error(`Gemini API error [${stage ?? "unknown"}]:`, response.status, errorData);
    throw new GeminiError("AI generation failed", 502, stage);
  }

  const data = await response.json();
  const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  if (!rawContent) {
    console.error(`Empty AI response [${stage ?? "unknown"}]. FinishReason:`, data.candidates?.[0]?.finishReason);
    throw new GeminiError("Empty AI response", 502, stage);
  }

  const text = extractJson(rawContent);

  return {
    text,
    usageMetadata: data.usageMetadata,
  };
}

async function fetchWithTimeout(url: string, body: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function extractJson(raw: string): string {
  let cleaned = raw.trim();

  // Strip markdown code fences
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*\n?/, "").replace(/\n?```\s*$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  // Extract JSON object
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new GeminiError("Could not extract JSON from AI response", 502);
  }

  // Validate it parses
  try {
    JSON.parse(jsonMatch[0]);
  } catch {
    throw new GeminiError("AI response is not valid JSON", 502);
  }

  return jsonMatch[0];
}

// The responseSchema for the standard slide output format.
// Used by the formatter agent and the current monolithic generation.
export const SLIDE_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    slides: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          type: { type: "STRING", enum: ["hook", "tension", "value", "accent", "insight", "proof", "contrast", "steps", "cta"] },
          title: { type: "STRING" },
          content: { type: "STRING" },
          layout: { type: "STRING", enum: ["text-left", "text-right", "split", "big-number", "quote", "default", "hero", "cta", "centered"] },
          element: {
            type: "OBJECT",
            properties: {
              type: { type: "STRING", enum: ["none", "list", "stat", "bar_chart", "pie_chart", "line_chart", "horizontal_bar", "code_block", "quote_block", "stat_cards"] },
              items: {
                type: "ARRAY",
                nullable: true,
                items: {
                  type: "OBJECT",
                  properties: {
                    label: { type: "STRING" },
                    value: { type: "NUMBER" },
                  },
                  required: ["label", "value"],
                },
              },
              value: { type: "STRING", nullable: true },
              label: { type: "STRING", nullable: true },
              title: { type: "STRING", nullable: true },
              lines: { type: "ARRAY", nullable: true, items: { type: "STRING" } },
              quote: { type: "STRING", nullable: true },
              cards: {
                type: "ARRAY",
                nullable: true,
                items: {
                  type: "OBJECT",
                  properties: {
                    value: { type: "STRING" },
                    label: { type: "STRING" },
                  },
                  required: ["value", "label"],
                },
              },
            },
            required: ["type"],
          },
        },
        required: ["type", "title", "content", "layout", "element"],
      },
    },
    post_caption: { type: "STRING" },
  },
  required: ["slides", "post_caption"],
} as const;
