// hooks/usePhotoGeneration.ts
import { useState, useCallback, useRef } from "react";

interface Slide {
  type: string;
  title: string;
  content: string;
  imageUrl?: string;
}

interface PhotoGenerationResult {
  slides: Slide[];
  post_caption: string;
}

interface PhotoGenerationState {
  isGenerating: boolean;
  progress: number;
  totalSlides: number;
  phase: "content" | "images" | "done" | "idle" | "error";
  result: PhotoGenerationResult | null;
  error: string | null;
}

interface PhotoGenerationParams {
  text: string;
  slideCount: number;
  format: string;
  style: string;
  referencePhoto: string;
}

export function usePhotoGeneration() {
  const [state, setState] = useState<PhotoGenerationState>({
    isGenerating: false,
    progress: 0,
    totalSlides: 0,
    phase: "idle",
    result: null,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (params: PhotoGenerationParams) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({
      isGenerating: true,
      progress: 0,
      totalSlides: params.slideCount,
      phase: "content",
      result: null,
      error: null,
    });

    try {
      const res = await fetch("/api/generate/photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Server error" }));
        throw new Error(data.error || "Generation failed");
      }

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalResult: PhotoGenerationResult | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const event = JSON.parse(data);

            if (event.type === "content") {
              setState((prev) => ({ ...prev, phase: "images" }));
            } else if (event.type === "progress") {
              setState((prev) => ({
                ...prev,
                progress: event.current,
                totalSlides: event.total,
              }));
            } else if (event.type === "result") {
              finalResult = event.data;
              setState((prev) => ({
                ...prev,
                phase: "done",
                isGenerating: false,
                result: finalResult,
              }));
            } else if (event.type === "error") {
              throw new Error(event.message);
            }
          } catch (e) {
            if (e instanceof Error && e.message !== "Generation failed") {
              // parsing error, skip
            } else {
              throw e;
            }
          }
        }
      }

      if (!finalResult) {
        throw new Error("No result received from server");
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      const message = err instanceof Error ? err.message : "Unknown error";
      setState((prev) => ({
        ...prev,
        isGenerating: false,
        phase: "error",
        error: message,
      }));
    }
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setState((prev) => ({
      ...prev,
      isGenerating: false,
      phase: "idle",
    }));
  }, []);

  return { ...state, generate, abort };
}
