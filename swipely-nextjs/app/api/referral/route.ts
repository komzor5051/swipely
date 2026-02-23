import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getReferralStats, processReferral } from "@/lib/supabase/queries";

function generateCode(): string {
  // Unambiguous chars (no 0/O, 1/I/L)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

// GET /api/referral — returns referral stats; auto-generates code if missing
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Ensure user has a referral code (lazy generation for pre-migration users)
  const { data: profile } = await admin
    .from("profiles")
    .select("referral_code")
    .eq("id", user.id)
    .single();

  if (!profile?.referral_code) {
    let code: string;
    let attempts = 0;
    // Retry on collision (extremely unlikely with 8 chars, but safe)
    do {
      code = generateCode();
      const { error } = await admin
        .from("profiles")
        .update({ referral_code: code })
        .eq("id", user.id);
      if (!error) break;
      attempts++;
    } while (attempts < 5);
  }

  const stats = await getReferralStats(admin, user.id);
  return NextResponse.json(stats);
}

// POST /api/referral — apply a referral code for the current user
// Body: { referralCode: string }
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { referralCode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { referralCode } = body;
  if (!referralCode) {
    return NextResponse.json(
      { error: "referralCode is required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Check if user already used a referral code (referral_bonus_applied)
  const { data: profile } = await admin
    .from("profiles")
    .select("referral_bonus_applied")
    .eq("id", user.id)
    .single();

  if (profile?.referral_bonus_applied) {
    return NextResponse.json(
      { error: "Ты уже использовал реферальный код" },
      { status: 409 }
    );
  }

  const success = await processReferral(admin, user.id, referralCode);

  if (!success) {
    return NextResponse.json(
      { error: "Реферальный код не найден или недействителен" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, message: "Тебе начислено +3 Photo-слайда!" });
}
