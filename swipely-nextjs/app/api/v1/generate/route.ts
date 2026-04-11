import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { claimApiKeySlot } from "@/lib/supabase/queries";
import { getTemplate } from "@/lib/templates/registry";
import { renderAndUploadSlides } from "@/lib/render/renderer";
import { containsInjection } from "@/lib/ai-utils";
import { generateCarousel, PipelineFailedError } from "@/lib/generation/pipeline";
import type { FrameworkId } from "@/lib/generation/types";
import { FRAMEWORKS } from "@/lib/generation/frameworks";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://swipely.ru";

// ─── POST /api/v1/generate ───

export async function POST(request: NextRequest) {
  // ─── API Key auth: Authorization: Bearer swp_live_... ───
  const authHeader = request.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header. Use: Bearer swp_live_..." },
      { status: 401 }
    );
  }

  const rawKey = authHeader.slice(7).trim();
  if (!rawKey.startsWith("swp_live_")) {
    return NextResponse.json({ error: "Invalid API key format" }, { status: 401 });
  }

  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return NextResponse.json({ error: "DB config error", detail: String(e) }, { status: 500 });
  }

  // ─── Claim quota slot (auth + quota check + increment atomically) ───
  const slot = await claimApiKeySlot(admin, keyHash);

  if (!slot.allowed) {
    if (slot.reason === "NOT_FOUND") {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }
    if (slot.reason === "INACTIVE") {
      return NextResponse.json({ error: "API key has been revoked" }, { status: 401 });
    }
    if (slot.reason === "QUOTA_EXCEEDED") {
      return NextResponse.json(
        { error: "Monthly quota exceeded. Contact support to increase your limit." },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: "Request denied" }, { status: 403 });
  }

  // ─── Parse body ───
  let body: {
    text: string;
    template: string;
    slideCount: number;
    format?: string;
    tone?: string;
    framework?: FrameworkId;
    brief?: string;
    render?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { text, template, slideCount, format, tone, framework, brief, render } = body;

  if (!text || !template || !slideCount) {
    return NextResponse.json(
      { error: "Missing required fields: text, template, slideCount" },
      { status: 400 }
    );
  }

  if (text.length > 3000) {
    return NextResponse.json({ error: "text must be 3000 characters or fewer" }, { status: 400 });
  }

  if (slideCount < 3 || slideCount > 12) {
    return NextResponse.json({ error: "slideCount must be between 3 and 12" }, { status: 400 });
  }

  if (brief && brief.length > 500) {
    return NextResponse.json({ error: "brief must be 500 characters or fewer" }, { status: 400 });
  }

  if (containsInjection(text) || (brief && containsInjection(brief))) {
    return NextResponse.json({ error: "Input contains disallowed content" }, { status: 400 });
  }

  const VALID_TONES = ["educational", "entertaining", "provocative", "motivational"];
  if (tone && !VALID_TONES.includes(tone)) {
    return NextResponse.json({ error: "Invalid tone" }, { status: 400 });
  }

  if (framework && !FRAMEWORKS[framework]) {
    return NextResponse.json({ error: "Invalid framework" }, { status: 400 });
  }

  // ─── Template isolation: tenant-scoped templates must match API key's tenant ───
  const templateMeta = getTemplate(template);
  if (templateMeta?.tenantId && templateMeta.tenantId !== slot.tenantId) {
    return NextResponse.json(
      { error: `Template '${template}' is not available for your API key` },
      { status: 403 }
    );
  }

  // ─── Generate via multi-agent pipeline ───
  try {
    const result = await generateCarousel({
      text,
      templateId: template,
      slideCount,
      tone,
      framework,
      brief,
    });

    const carouselData = { slides: result.slides, post_caption: result.postCaption };

    // ─── Save generation ───
    const { data: savedGen, error: saveErr } = await admin
      .from("generations")
      .insert({
        template,
        slide_count: slideCount,
        format: format || "square",
        tone,
        input_text: text,
        output_json: carouselData,
        api_key_id: slot.apiKeyId,
      })
      .select("id")
      .single();

    if (saveErr) {
      console.error("Save generation error:", saveErr);
    }

    const generationId = savedGen?.id ?? null;
    const resolvedFormat = (
      format === "square" ? "square" : format === "story" ? "story" : "portrait"
    ) as "square" | "portrait" | "story";

    // ─── Optional server-side PNG rendering ───
    let image_urls: string[] = [];
    let render_error: string | undefined;

    if (render && generationId && carouselData.slides?.length) {
      const renderResult = await renderAndUploadSlides(
        admin,
        generationId,
        carouselData.slides,
        template,
        resolvedFormat
      );
      image_urls = renderResult.image_urls;
      render_error = renderResult.renderError;

      if (render_error) {
        console.error("Render error:", render_error);
      }
    }

    return NextResponse.json({
      generation_id: generationId,
      slides: carouselData.slides,
      post_caption: carouselData.post_caption,
      view_url: generationId ? `${APP_URL}/viewer/${generationId}` : null,
      edit_url: generationId ? `${APP_URL}/editor/${generationId}` : null,
      ...(render ? { image_urls, ...(render_error ? { render_error } : {}) } : {}),
    });
  } catch (error) {
    if (error instanceof PipelineFailedError) {
      console.error("B2B pipeline error:", error.pipelineError);
      return NextResponse.json(
        { error: "Generation failed. Please try again." },
        { status: 502 },
      );
    }
    console.error("B2B generation error:", error);
    return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 500 });
  }
}
