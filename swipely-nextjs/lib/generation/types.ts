import type { SlideData } from "@/components/slides/types";

// --- Framework Types ---

export type FrameworkId =
  | "mistakes"
  | "case-study"
  | "step-by-step"
  | "before-after"
  | "myths-vs-reality"
  | "checklist";

export interface HookTemplate {
  pattern: string;
  frameworks: FrameworkId[];
}

export interface Framework {
  id: FrameworkId;
  label: string;
  labelRu: string;
  slideProgression: string[];
  hookFormulas: string[];
  ctaType: string;
  optimalSlideRange: { min: number; max: number };
}

// --- Design Preset Types ---

export interface DesignPreset {
  name: string;
  max_words_per_slide: number;
  tone: string;
}

// --- Pipeline Types ---

export interface StrategyOutput {
  hookType: string;
  hookFormula: string;
  slideplan: Array<{
    type: string;
    angle: string;
    element?: string;
  }>;
  keyAngles: string[];
  ctaType: string;
}

export interface CopywriterOutput {
  slides: Array<{
    type: string;
    title: string;
    content: string;
  }>;
  postCaption: string;
}

export interface PipelineInput {
  text: string;
  templateId: string;
  slideCount: number;
  tone?: string;
  framework?: FrameworkId;
  tovGuidelines?: string;
  brief?: string;
  preserveText?: boolean;
}

export interface PipelineOutput {
  slides: SlideData[];
  postCaption: string;
}

export interface PipelineError {
  stage: "strategist" | "copywriter" | "formatter";
  message: string;
  cause?: unknown;
}
