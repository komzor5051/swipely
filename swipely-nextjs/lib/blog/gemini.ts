import { GoogleGenAI } from "@google/genai";

function getAI() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GEMINI_API_KEY not set");
  return new GoogleGenAI({ apiKey });
}

export async function generatePro(prompt: string): Promise<string> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { temperature: 0.8, maxOutputTokens: 16384 },
  });
  return response.text ?? "";
}

export async function generateFlash(prompt: string): Promise<string> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { temperature: 0.4, maxOutputTokens: 8192 },
  });
  return response.text ?? "";
}
