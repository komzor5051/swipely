import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractContentFromUrl, analyzeToneOfVoice } from "@/lib/services/tov-analyzer";

export async function POST(request: NextRequest) {
  // ─── Auth check ───
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { url: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { url } = body;

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
  }

  try {
    // 1. Extract text content from URL
    const text = await extractContentFromUrl(url);

    if (text.length < 100) {
      return NextResponse.json(
        { error: "Недостаточно текста на странице для анализа. Попробуй другую ссылку." },
        { status: 422 }
      );
    }

    // 2. Analyze ToV via Gemini
    const tovResult = await analyzeToneOfVoice(text, url);

    // 3. Save to profile
    let admin;
    try {
      admin = createAdminClient();
    } catch {
      return NextResponse.json({ error: "DB config error" }, { status: 500 });
    }

    const { error: updateErr } = await admin
      .from("profiles")
      .update({
        tov_profile: tovResult.profile,
        tov_guidelines: tovResult.guidelines,
        onboarding_completed: true,
      })
      .eq("id", user.id);

    if (updateErr) {
      console.error("ToV save error:", updateErr);
    }

    return NextResponse.json({
      profile: tovResult.profile,
      guidelines: tovResult.guidelines,
      saved: !updateErr,
    });
  } catch (error) {
    console.error("ToV analysis error:", error);
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
