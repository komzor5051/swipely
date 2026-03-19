import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY!;
const IMAGE_MODEL = "gemini-3-pro-image-preview";
const FALLBACK_MODEL = "gemini-2.0-flash-exp-image-generation";

const STYLE_PROMPTS = {
  cartoon: `3D Pixar/Disney animation style.
Rich saturated colors, volumetric soft lighting, expressive cartoon features.
The person transformed into an animated character — keep the face recognizable.
Detailed environment with depth, atmospheric lighting, cinematic composition.`,
  realistic: `High-end cinematic photography, dramatic lighting.
Magazine editorial quality, natural skin tones, shallow depth of field.
Rich atmospheric environment with depth and mood.
Award-winning commercial photography aesthetic.`,
} as const;

const ASPECT_RATIOS = {
  portrait: "4:5",
  square: "1:1",
} as const;

type ImageStyle = "cartoon" | "realistic";
type Format = "portrait" | "square";

export interface SlideData {
  title: string;
  content: string;
  type: string;
  slideNumber: number;
  layout?: string; // AI-assigned visual composition (kept in sync with components/slides/types.ts)
}

let genAI: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genAI) {
    genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }
  return genAI;
}

function buildImagePrompt(
  slide: SlideData,
  style: ImageStyle,
  format: Format
): string {
  const stylePrompt = STYLE_PROMPTS[style];
  const formatDesc =
    format === "square"
      ? "1:1 square (1080x1080)"
      : "4:5 vertical portrait (1080x1350)";

  // Strip <hl> tags from title for the prompt
  const cleanTitle = slide.title.replace(/<\/?hl>/g, "");

  return `# Create a high-quality illustration for a carousel slide

## VISUAL STYLE
${stylePrompt}

## IMAGE FORMAT
Generate a FULL ${formatDesc} image.
The subject and scene MUST fill the ENTIRE frame from edge to edge.
NO empty areas. NO blank zones. NO solid-color borders. NO letterboxing.
The image must use every pixel of the ${format === "square" ? "square" : "vertical"} canvas.

## WHAT THIS SLIDE IS ABOUT
Title: "${cleanTitle}"
Message: "${slide.content}"
Slide type: ${slide.type} (slide ${slide.slideNumber})

Based on the meaning above, create an expressive scene that VISUALLY tells this story.
Choose a unique environment, pose, and mood that matches the slide's message.
Be creative — every slide should feel like a different moment in a visual narrative.

## COMPOSITION
- The subject (person from reference photo) is the hero — fill 50-70% of the frame
- Rich, detailed background environment that matches the slide's meaning
- Natural depth with foreground and background elements
- Upper area: use slightly darker/moodier tones (text will be overlaid here by a separate system)
- Lower area: use slightly darker/moodier tones (text will be overlaid here by a separate system)
- This is a COMPOSITIONAL GUIDE for tonal variation, NOT a request for empty/blank space
- Face must be sharp and expressive, recognizable from the reference photo

## ABSOLUTELY NO TEXT — ZERO TOLERANCE
The image must contain ZERO text, letters, words, numbers, symbols, labels, captions, watermarks, logos, UI elements, or anything that remotely resembles writing.
- No text on clothing, signs, screens, books, papers, or surfaces
- No floating text, overlay text, or decorative typography
- No numbers, dates, or numerical symbols
- If the scene includes a screen/monitor/phone, it must show abstract visuals ONLY (no readable text)
- Text will be added by a COMPLETELY SEPARATE system after image generation
- Your ONLY job: create a PURELY VISUAL image

If ANY text appears in the image, the entire result is INVALID and will be discarded.`;
}

export async function generateSlideImage(
  referencePhotoBase64: string,
  slide: SlideData,
  style: ImageStyle,
  format: Format
): Promise<string | null> {
  const ai = getGenAI();
  const prompt = buildImagePrompt(slide, style, format);
  const aspectRatio = ASPECT_RATIOS[format];

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      config: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio,
          imageSize: "2K",
        },
      } as any,
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          config: {
            responseModalities: ["TEXT", "IMAGE"],
            imageConfig: { aspectRatio },
          } as any,
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
