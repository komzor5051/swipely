# Photo Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add AI Photo Mode to swipely-nextjs — users upload a reference photo, AI generates styled images per slide, text overlays via React/CSS, export via html2canvas.

**Architecture:** SSE streaming from Next.js API route → Gemini `@google/genai` SDK (already installed) for both content and image generation → client receives base64 images progressively → PhotoSlide component (already exists) renders photo as background with text overlay → html2canvas export (already works).

**Tech Stack:** Next.js 16 API Routes, `@google/genai` SDK, Server-Sent Events, React components, html2canvas

---

### Task 1: Create `lib/services/image-generator.ts` — Gemini Image Generation wrapper

**Files:**
- Create: `lib/services/image-generator.ts`

**Step 1: Write the image generator service**

```typescript
// lib/services/image-generator.ts
import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY!;
const IMAGE_MODEL = "gemini-3-pro-image-preview";
const FALLBACK_MODEL = "gemini-2.0-flash-exp-image-generation";
const TEXT_MODEL = "gemini-2.5-flash-lite";

const STYLE_PROMPTS = {
  cartoon: `3D Pixar/Disney animation style illustration.
Vibrant saturated colors, soft lighting, expressive cartoon features.
The person transformed into an animated character while keeping recognizable face.
Professional studio lighting, clean background with soft bokeh.`,
  realistic: `High-end professional photography, cinematic lighting.
Magazine cover quality, natural skin tones, shallow depth of field.
Professional studio setup, soft diffused lighting.
Commercial advertising aesthetic.`,
} as const;

const ASPECT_RATIOS = {
  portrait: "4:5",
  square: "1:1",
} as const;

type ImageStyle = "cartoon" | "realistic";
type Format = "portrait" | "square";

interface SceneDescription {
  slideNumber: number;
  prompt: string;
  pose: string;
  emotion: string;
  setting: string;
}

let genAI: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genAI) {
    genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }
  return genAI;
}

/**
 * Generate scene descriptions for each slide using Gemini text model.
 */
export async function generateSceneDescriptions(
  topic: string,
  slideCount: number,
  slideTitles: string[]
): Promise<SceneDescription[]> {
  const ai = getGenAI();

  const prompt = `Topic: "${topic}"
Slides: ${slideCount}

${slideTitles.map((title, i) => `${i + 1}. ${title}`).join("\n")}

Create a scene description for each slide. Each scene should have a unique pose, emotion, and setting that matches the slide content.

Return ONLY a valid JSON array:
[
  {
    "slideNumber": 1,
    "prompt": "brief image description",
    "pose": "presenting with open hands",
    "emotion": "confident",
    "setting": "modern studio with floating 3D elements"
  }
]

Requirements: diverse poses and settings across slides, Instagram-ready compositions, consistent character appearance.`;

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
  });

  const text = response.text || "";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Failed to parse scene descriptions");
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Build the image generation prompt.
 */
function buildImagePrompt(
  scene: SceneDescription,
  style: ImageStyle,
  format: Format
): string {
  const stylePrompt = STYLE_PROMPTS[style];
  const aspectDesc = format === "square" ? "1:1 square" : "4:5 portrait";

  return `# Purpose
Create a high-quality image for a visual carousel slide, transforming the reference person into a specified visual style.

## VISUAL STYLE
${stylePrompt}

## IMAGE FORMAT
Aspect ratio: ${aspectDesc}

## SCENE
Slide ${scene.slideNumber}: ${scene.pose}, ${scene.emotion}
Setting: ${scene.setting}
Context: ${scene.prompt}

## COMPOSITION REQUIREMENTS
- Transform the person from the reference photo into the given style
- Face must remain clearly recognizable and expressive
- Use a confident, natural pose
- Background: clean, uncluttered, soft blur
- Reserve clear space for text overlay:
  - Top: 20% of frame
  - Bottom: 25% of frame
- Subject centered in the middle of the frame
- Sharp focus on face, high image quality

## CRITICAL REQUIREMENTS (ABSOLUTE)
- NO text of any kind
- NO letters, numbers, symbols, or typography
- NO captions, logos, watermarks, or UI elements
- NO text-like shapes or symbols

If ANY text or letters appear, the result is INVALID. The image must be purely visual.`;
}

/**
 * Generate a single slide image with reference photo.
 * Returns base64-encoded image data (no data: prefix).
 */
export async function generateSlideImage(
  referencePhotoBase64: string,
  scene: SceneDescription,
  style: ImageStyle,
  format: Format
): Promise<string | null> {
  const ai = getGenAI();
  const prompt = buildImagePrompt(scene, style, format);
  const aspectRatio = ASPECT_RATIOS[format];

  // Try primary model first
  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: [
        { text: prompt },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: referencePhotoBase64,
          },
        },
      ],
      config: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio,
          imageSize: "2K",
        },
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          return part.inlineData.data;
        }
      }
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`Image gen error (primary): ${msg}`);

    // Fallback model
    if (msg.includes("not found") || msg.includes("not supported")) {
      try {
        const response = await ai.models.generateContent({
          model: FALLBACK_MODEL,
          contents: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: referencePhotoBase64,
              },
            },
          ],
          config: {
            responseModalities: ["TEXT", "IMAGE"],
            imageConfig: { aspectRatio },
          },
        });

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData?.data) {
              return part.inlineData.data;
            }
          }
        }
      } catch (fallbackErr) {
        console.error("Fallback model also failed:", fallbackErr);
      }
    }
  }

  return null;
}
```

**Step 2: Verify the file compiles**

Run: `cd "/Users/lvmn/Desktop/Бизнес/ai projects /swipely /swipely-nextjs" && npx tsc --noEmit lib/services/image-generator.ts 2>&1 | head -20`

**Step 3: Commit**

```bash
git add lib/services/image-generator.ts
git commit -m "feat: add Gemini image generator service for Photo Mode"
```

---

### Task 2: Create `hooks/usePhotoGeneration.ts` — SSE client hook

**Files:**
- Create: `hooks/usePhotoGeneration.ts`

**Step 1: Write the SSE hook**

```typescript
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
  progress: number; // 0..totalSlides
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
  referencePhoto: string; // base64 (no data: prefix)
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
    // Abort any in-flight request
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
            // Skip malformed JSON lines
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
```

**Step 2: Commit**

```bash
git add hooks/usePhotoGeneration.ts
git commit -m "feat: add usePhotoGeneration SSE hook"
```

---

### Task 3: Create `app/api/generate/photo/route.ts` — SSE API endpoint

**Files:**
- Create: `app/api/generate/photo/route.ts`

**Step 1: Write the SSE endpoint**

This is the core backend. It:
1. Authenticates via Supabase
2. Generates carousel content (text) via Gemini
3. Generates scene descriptions
4. Streams image generation progress via SSE
5. Returns the full result

```typescript
// app/api/generate/photo/route.ts
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateSceneDescriptions,
  generateSlideImage,
} from "@/lib/services/image-generator";

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

// Re-use the content generation system prompt from the main route
// but adapted for photo_mode (shorter text, visual-first)
const PHOTO_SYSTEM_PROMPT = `# Viral Visual Carousel Content (Photo Mode)

You create SHORT, IMPACTFUL text for carousel slides where the main visual is an AI-generated photo.

CONTEXT:
- This is PHOTO MODE — the image is the hero, text is minimal overlay
- Maximum 25 words per slide content
- Titles must be 3-5 words, punchy, uppercase-friendly

RULES:
- Each slide: one clear idea
- Content: short, impactful phrases (NOT full sentences)
- No markdown, no emoji, no special characters
- Mark 1-2 keywords in title with <hl>word</hl> tags

HOOK ENGINE (first slide):
Choose ONE: CONTRARIAN, SHOCK DATA, PAIN MIRROR, PROMISE, FEAR, CURIOUS GAP

STRUCTURE:
1. hook — stop the scroll
2. tension — amplify the problem
3. value — concrete benefit
4. value — example or proof
5. insight — unexpected conclusion
6. cta — one simple action

POST CAPTION (post_caption):
- 150-300 words, complements the carousel
- Engaging opening, main insight, call to action
- Paragraphs for readability
- End with a question or simple CTA
- No hashtags

OUTPUT: Return ONLY valid JSON:
{
  "slides": [
    { "type": "hook", "title": "Title with <hl>keyword</hl>", "content": "Short impactful text" }
  ],
  "post_caption": "Post text"
}`;

function cleanMarkdown(text: string): string {
  if (!text) return text;
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export const maxDuration = 120; // Allow up to 2 minutes for image generation

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: "AI service not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return new Response(JSON.stringify({ error: "DB config error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Profile + usage check
  const { data: profile } = await admin
    .from("profiles")
    .select("id, subscription_tier, photo_slides_balance, standard_used")
    .eq("id", user.id)
    .single();

  // Photo mode requires balance (paid feature)
  // For now, allow generation if user exists (MVP — billing comes later)
  // TODO: Uncomment when billing is ready:
  // const balance = profile?.photo_slides_balance || 0;
  // if (balance < body.slideCount) {
  //   return error 402 "Insufficient photo slide balance"
  // }

  let body: {
    text: string;
    slideCount: number;
    format: string;
    style: string;
    referencePhoto: string;
  };

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { text, slideCount, format, style, referencePhoto } = body;

  if (!text || !slideCount || !style || !referencePhoto) {
    return new Response(
      JSON.stringify({
        error: "Missing required fields: text, slideCount, style, referencePhoto",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (slideCount < 3 || slideCount > 7) {
    return new Response(
      JSON.stringify({ error: "slideCount must be between 3 and 7" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // SSE stream
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      }

      try {
        // Step 1: Generate carousel content (text)
        send({ type: "content", message: "Generating content..." });

        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY! });

        const contentResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash-lite",
          contents: `${PHOTO_SYSTEM_PROMPT}\n\nCreate a ${slideCount}-slide carousel about:\n"${text}"`,
        });

        const rawContent = contentResponse.text || "";
        let cleanedContent = rawContent.trim();
        if (cleanedContent.startsWith("```json")) {
          cleanedContent = cleanedContent
            .replace(/^```json\s*\n?/, "")
            .replace(/\n?```\s*$/, "");
        } else if (cleanedContent.startsWith("```")) {
          cleanedContent = cleanedContent
            .replace(/^```\s*\n?/, "")
            .replace(/\n?```\s*$/, "");
        }

        const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          send({ type: "error", message: "Failed to parse AI content" });
          controller.close();
          return;
        }

        const carouselData = JSON.parse(jsonMatch[0]);

        // Clean markdown from slides
        if (carouselData.slides) {
          carouselData.slides = carouselData.slides.map(
            (slide: { title: string; content: string; type: string }) => ({
              ...slide,
              title: cleanMarkdown(slide.title),
              content: cleanMarkdown(slide.content),
            })
          );
        }

        // Step 2: Generate scene descriptions
        const slideTitles = carouselData.slides.map(
          (s: { title: string }) => s.title
        );

        let scenes;
        try {
          scenes = await generateSceneDescriptions(
            text,
            slideCount,
            slideTitles
          );
        } catch {
          // Fallback: create basic scenes
          scenes = carouselData.slides.map(
            (s: { title: string }, i: number) => ({
              slideNumber: i + 1,
              prompt: s.title,
              pose: "confident, professional stance",
              emotion: "confident",
              setting: "modern studio with soft lighting",
            })
          );
        }

        // Step 3: Generate images one by one with progress
        const imageStyle = (style === "realistic" ? "realistic" : "cartoon") as
          | "cartoon"
          | "realistic";
        const imageFormat = (
          format === "square" ? "square" : "portrait"
        ) as "portrait" | "square";

        const slides = [];

        for (let i = 0; i < carouselData.slides.length; i++) {
          send({
            type: "progress",
            current: i + 1,
            total: carouselData.slides.length,
          });

          const scene = scenes[i] || {
            slideNumber: i + 1,
            prompt: carouselData.slides[i].title,
            pose: "confident pose",
            emotion: "confident",
            setting: "modern studio",
          };

          let imageBase64: string | null = null;
          try {
            imageBase64 = await generateSlideImage(
              referencePhoto,
              scene,
              imageStyle,
              imageFormat
            );
          } catch (err) {
            console.error(`Image gen failed for slide ${i + 1}:`, err);
          }

          slides.push({
            ...carouselData.slides[i],
            imageUrl: imageBase64
              ? `data:image/png;base64,${imageBase64}`
              : undefined,
          });

          // Rate limit delay between slides
          if (i < carouselData.slides.length - 1) {
            await new Promise((r) => setTimeout(r, 2000));
          }
        }

        // Step 4: Send final result
        const result = {
          slides,
          post_caption: carouselData.post_caption || "",
        };

        send({ type: "result", data: result });

        // Save to DB
        try {
          await admin.from("generations").insert({
            user_id: user.id,
            template: "photo_mode",
            slide_count: slideCount,
            format: format || "portrait",
            tone: null,
            input_text: text,
            output_json: result,
          });
          await admin.rpc("increment_standard_used", {
            user_id_param: user.id,
          });
        } catch (dbErr) {
          console.error("DB save error:", dbErr);
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        console.error("Photo generation error:", error);
        send({
          type: "error",
          message:
            error instanceof Error ? error.message : "Generation failed",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

**Step 2: Create the directory and verify compilation**

Run: `mkdir -p "/Users/lvmn/Desktop/Бизнес/ai projects /swipely /swipely-nextjs/app/api/generate/photo"`

**Step 3: Commit**

```bash
git add app/api/generate/photo/route.ts
git commit -m "feat: add /api/generate/photo SSE endpoint"
```

---

### Task 4: Update `app/(dashboard)/generate/page.tsx` — Wire up SSE + progress bar

**Files:**
- Modify: `app/(dashboard)/generate/page.tsx`

**Step 1: Replace the `handleGenerate` function and generating step UI**

Key changes:
1. Import and use `usePhotoGeneration` hook for photo mode
2. Replace the simple generating animation with a real progress bar for photo mode
3. When SSE result arrives, set it to the result state

The existing standard mode flow stays unchanged — only photo mode uses SSE.

Changes needed in the component:
- Add import: `import { usePhotoGeneration } from "@/hooks/usePhotoGeneration";`
- Add hook call in component body
- Modify `handleGenerate` to branch: standard = existing fetch, photo = hook.generate()
- Modify `step === "generating"` to show progress bar when photo mode
- Handle hook state changes to transition to result step

**Step 2: Commit**

```bash
git add "app/(dashboard)/generate/page.tsx"
git commit -m "feat: wire up photo mode SSE with progress bar"
```

---

### Task 5: Update `components/generate/ExportPanel.tsx` — Support photo slides

**Files:**
- Modify: `components/generate/ExportPanel.tsx`

**Step 1: Ensure photo slides export correctly**

The current ExportPanel renders `SlideRenderer` which already maps `photo_mode` → `PhotoSlide`. The `PhotoSlide` component already uses `slide.imageUrl` as a background. So export should work out of the box — but we need to verify that `html2canvas` can capture `background-image` with base64 data URLs.

If needed, add `allowTaint: true` to html2canvas options. This should be a minimal change.

**Step 2: Commit (if changes needed)**

```bash
git add "components/generate/ExportPanel.tsx"
git commit -m "fix: ensure photo slide export works with base64 backgrounds"
```

---

### Task 6: Add drag-and-drop support to photo upload

**Files:**
- Modify: `app/(dashboard)/generate/page.tsx`

**Step 1: Add onDragOver/onDrop handlers to the upload area**

The current upload area only supports click-to-upload. Add drag-and-drop by handling `onDragOver`, `onDragEnter`, `onDragLeave`, and `onDrop` events on the upload button area.

Add a `dragging` state to show visual feedback when dragging over.

**Step 2: Commit**

```bash
git add "app/(dashboard)/generate/page.tsx"
git commit -m "feat: add drag-and-drop to photo upload"
```

---

### Task 7: Verify full flow end-to-end

**Step 1: Run dev server**

Run: `cd "/Users/lvmn/Desktop/Бизнес/ai projects /swipely /swipely-nextjs" && npm run dev`

**Step 2: Manual test checklist**
- [ ] Switch to "AI Фото" mode on step 1
- [ ] Upload a photo (click + drag-and-drop)
- [ ] Remove photo and re-upload
- [ ] Select cartoon/realistic style
- [ ] Configure slide count and format
- [ ] Click "Создать карусель" — see progress bar
- [ ] Result shows slides with AI photo backgrounds + text overlays
- [ ] Navigate between slides
- [ ] Edit text inline
- [ ] Export to PNG works correctly

**Step 3: Run lint**

Run: `cd "/Users/lvmn/Desktop/Бизнес/ai projects /swipely /swipely-nextjs" && npm run lint`

**Step 4: Run build**

Run: `cd "/Users/lvmn/Desktop/Бизнес/ai projects /swipely /swipely-nextjs" && npm run build`

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: photo mode — full generation flow with SSE progress"
```
