/**
 * Server-side slide renderer.
 * Maintains a singleton Puppeteer browser instance,
 * screenshots each slide's HTML, uploads to Supabase Storage,
 * and returns public URLs.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { generateSlideHTML, type SlideRenderInput } from "./templates";

// ─── Browser singleton ───────────────────────────────────────────────────────

import { execFileSync } from "child_process";

/** Find system-installed Chromium on Linux */
function findSystemChromium(): string | null {
  for (const bin of ["chromium-browser", "chromium", "google-chrome"]) {
    try {
      return execFileSync("which", [bin], { encoding: "utf8" }).trim();
    } catch {
      // not found, try next
    }
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let browserInstance: any = null;

async function getBrowser() {
  if (browserInstance) {
    try {
      // Check if still connected
      await browserInstance.version();
      return browserInstance;
    } catch {
      browserInstance = null;
    }
  }

  const puppeteer = await import("puppeteer");

  // Use system Chromium on Linux (server), bundled Chrome locally
  const executablePath =
    process.platform === "linux"
      ? (await findSystemChromium()) ?? undefined
      : undefined;

  browserInstance = await puppeteer.default.launch({
    headless: true,
    executablePath,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  return browserInstance;
}

// ─── Screenshot one slide ────────────────────────────────────────────────────

const SIZES = {
  square: { w: 1080, h: 1080 },
  portrait: { w: 1080, h: 1350 },
  story: { w: 1080, h: 1920 },
} as const;

async function screenshotSlide(html: string, format: "square" | "portrait" | "story"): Promise<Buffer> {
  const browser = await getBrowser();
  const { w, h } = SIZES[format];

  const page = await browser.newPage();
  try {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "networkidle2", timeout: 15000 });

    const screenshot = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: w, height: h } });
    return Buffer.from(screenshot);
  } finally {
    await page.close();
  }
}

// ─── Supabase Storage upload ─────────────────────────────────────────────────

const BUCKET = "carousel-renders";

async function uploadSlide(
  admin: SupabaseClient,
  generationId: string,
  slideIndex: number,
  buffer: Buffer
): Promise<string | null> {
  const storagePath = `${generationId}/slide-${slideIndex + 1}.png`;

  const { error } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (error) {
    console.error(`Upload error slide ${slideIndex + 1}:`, error.message);
    return null;
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

// ─── Main export ─────────────────────────────────────────────────────────────

interface Slide {
  type: string;
  title: string;
  content: string;
}

export interface RenderResult {
  image_urls: string[];
  renderError?: string;
}

/**
 * Render all slides to PNG and upload to Supabase Storage.
 * Returns public URLs for each slide.
 */
export async function renderAndUploadSlides(
  admin: SupabaseClient,
  generationId: string,
  slides: Slide[],
  template: string,
  format: "square" | "portrait" | "story"
): Promise<RenderResult> {
  const totalSlides = slides.length;
  const urls: string[] = [];

  try {
    for (let i = 0; i < totalSlides; i++) {
      const input: SlideRenderInput = {
        slide: slides[i],
        slideNumber: i + 1,
        totalSlides,
        template,
        format,
      };

      const html = generateSlideHTML(input);
      const buffer = await screenshotSlide(html, format);
      const url = await uploadSlide(admin, generationId, i, buffer);

      if (url) {
        urls.push(url);
      } else {
        // Partial failure — stop rendering
        return { image_urls: urls, renderError: `Upload failed for slide ${i + 1}` };
      }
    }

    return { image_urls: urls };
  } catch (err) {
    console.error("renderAndUploadSlides error:", err);
    return { image_urls: urls, renderError: String(err) };
  }
}
