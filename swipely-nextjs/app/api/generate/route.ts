import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resetMonthlyIfNeeded, checkSubscriptionExpiry } from "@/lib/supabase/queries";
import { PRO_ONLY_TEMPLATE_IDS } from "@/lib/templates/registry";
import { containsInjection } from "@/lib/ai-utils";
import { generateCarousel, PipelineFailedError } from "@/lib/generation/pipeline";
import type { FrameworkId } from "@/lib/generation/types";
import { FRAMEWORKS } from "@/lib/generation/frameworks";

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

// ─── POST Handler ───

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "AI service not configured" },
      { status: 500 }
    );
  }

  // ─── Auth check ───
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // ─── Layer 3: Email verification check ───
  if (!user.email_confirmed_at) {
    return NextResponse.json(
      { error: "EMAIL_NOT_VERIFIED" },
      { status: 403 }
    );
  }

  // Admin client for DB operations (bypasses RLS)
  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return NextResponse.json(
      { error: "DB config error", detail: String(e) },
      { status: 500 }
    );
  }

  // ─── Ensure profile exists ───
  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("id, subscription_tier, subscription_end, standard_used, tov_guidelines")
    .eq("id", user.id)
    .single();

  if (!profile && !profileErr?.message?.includes("multiple")) {
    const { error: createErr } = await admin.from("profiles").insert({
      id: user.id,
      email: user.email,
      subscription_tier: "free",
      standard_used: 0,
      onboarding_completed: false,
    });
    if (createErr) {
      console.error("Create profile error:", createErr);
    }
  }

  // ─── Monthly reset (lazy: resets counter on first request of new month) ───
  await resetMonthlyIfNeeded(admin, user.id);

  // ─── Subscription expiry check ───
  const effectiveTier = profile
    ? await checkSubscriptionExpiry(admin, user.id, profile)
    : "free";

  const tier = effectiveTier;

  let body: {
    text: string;
    template: string;
    slideCount: number;
    format?: string;
    tone?: string;
    brief?: string;
    preserveText?: boolean;
    framework?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { text, template, slideCount, format, tone, brief, preserveText } = body;
  const framework = body.framework as FrameworkId | undefined;

  if (brief && brief.length > 500) {
    return NextResponse.json(
      { error: "brief must be 500 characters or fewer" },
      { status: 400 }
    );
  }

  // ─── Input size limits ───
  if (text && text.length > 3000) {
    return NextResponse.json(
      { error: "Текст слишком длинный. Максимум 3000 символов." },
      { status: 400 }
    );
  }

  // ─── Prompt injection filter ───
  if ((text && containsInjection(text)) || (brief && containsInjection(brief))) {
    return NextResponse.json(
      { error: "Текст содержит недопустимые инструкции." },
      { status: 400 }
    );
  }

  const VALID_TONES = ["educational", "entertaining", "provocative", "motivational"];
  if (tone && !VALID_TONES.includes(tone)) {
    return NextResponse.json({ error: "Invalid tone" }, { status: 400 });
  }

  if (framework && !FRAMEWORKS[framework]) {
    return NextResponse.json(
      { error: "Invalid framework" },
      { status: 400 }
    );
  }

  if (!text || !template || !slideCount) {
    return NextResponse.json(
      { error: "Missing required fields: text, template, slideCount" },
      { status: 400 }
    );
  }

  if (slideCount < 3 || slideCount > 12) {
    return NextResponse.json(
      { error: "slideCount must be between 3 and 12" },
      { status: 400 }
    );
  }

  const isCreatorOrAbove = tier === "pro" || tier === "creator";

  if (slideCount > 7 && !isCreatorOrAbove) {
    return NextResponse.json(
      { error: "9 и 12 слайдов доступны на тарифе Про и выше." },
      { status: 403 }
    );
  }

  if (!isCreatorOrAbove && (PRO_ONLY_TEMPLATE_IDS as readonly string[]).includes(template)) {
    return NextResponse.json(
      { error: "Этот шаблон доступен на тарифе Про и выше." },
      { status: 403 }
    );
  }

  // ─── Atomic slot claim (cooldown + limit check + increment in one DB transaction) ───
  const { data: slotData, error: slotError } = await admin.rpc("claim_generation_slot", {
    p_user_id: user.id,
  });

  if (slotError) {
    console.error("claim_generation_slot error:", slotError);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }

  const slot = Array.isArray(slotData) ? slotData[0] : slotData;

  if (!slot?.allowed) {
    if (slot?.reason === "BANNED") {
      return NextResponse.json(
        { error: "Аккаунт заблокирован за нарушение правил использования." },
        { status: 403 }
      );
    }
    if (slot?.reason === "COOLDOWN") {
      return NextResponse.json(
        { error: "COOLDOWN", waitSeconds: slot.wait_seconds ?? 15 },
        { status: 429 }
      );
    }
    if (slot?.reason === "DAILY_LIMIT") {
      return NextResponse.json(
        { error: "Достигнут дневной лимит генераций. Попробуй завтра." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "Лимит генераций исчерпан. Перейди на тариф выше для увеличения лимита." },
      { status: 429 }
    );
  }

  try {
    const result = await generateCarousel({
      text,
      templateId: template,
      slideCount,
      tone,
      framework,
      tovGuidelines: profile?.tov_guidelines as string | undefined,
      brief,
      preserveText,
    });

    const carouselData = { slides: result.slides, post_caption: result.postCaption };

    // ─── Save generation (admin client, bypasses RLS) ───
    const { error: saveErr } = await admin
      .from("generations")
      .insert({
        user_id: user.id,
        template,
        slide_count: slideCount,
        format: format || "portrait",
        tone,
        input_text: text,
        output_json: carouselData,
      })
      .select("id")
      .single();

    if (saveErr) {
      console.error("Save generation error:", saveErr);
    }

    return NextResponse.json(carouselData);
  } catch (error) {
    if (error instanceof PipelineFailedError) {
      console.error("Pipeline error:", error.message, error.pipelineError);
      return NextResponse.json(
        { error: "Generation failed. Please try again." },
        { status: 502 }
      );
    }
    const isTimeout = error instanceof Error && error.name === "AbortError";
    console.error("Generation error:", isTimeout ? "TIMEOUT" : error);
    return NextResponse.json(
      { error: isTimeout ? "Таймаут. Попробуй ещё раз." : "Generation failed. Please try again." },
      { status: 500 }
    );
  }
}
