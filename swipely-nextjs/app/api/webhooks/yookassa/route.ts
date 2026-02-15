import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Admin client — webhooks don't have user session
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Product → subscription duration mapping
const PRODUCT_DURATION: Record<string, number> = {
  pro_monthly: 30,
  pro_yearly: 365,
};

// Slide pack products
const SLIDE_PACKS: Record<string, number> = {
  pack_15: 15,
  pack_50: 50,
  pack_150: 150,
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { event, object: payment } = body;

    // Only process successful payments
    if (event !== "payment.succeeded") {
      return NextResponse.json({ ok: true });
    }

    const userId = payment.metadata?.user_id;
    const productId = payment.metadata?.product_id;

    if (!userId || !productId) {
      console.error("Webhook: missing metadata", payment.id);
      return NextResponse.json({ ok: true });
    }

    // Update payment record
    await supabaseAdmin
      .from("payments")
      .update({ status: "succeeded" })
      .eq("payment_id", payment.id);

    // Handle subscription
    if (PRODUCT_DURATION[productId]) {
      const days = PRODUCT_DURATION[productId];
      const now = new Date();
      const endsAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      await supabaseAdmin
        .from("profiles")
        .update({
          subscription_tier: "pro",
          subscription_status: "active",
          subscription_started_at: now.toISOString(),
          subscription_ends_at: endsAt.toISOString(),
        })
        .eq("id", userId);

      console.log(`PRO activated for ${userId} until ${endsAt.toISOString()}`);
    }

    // Handle slide packs
    if (SLIDE_PACKS[productId]) {
      const slides = SLIDE_PACKS[productId];

      // Add slides to user's balance via RPC or direct update
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("slide_balance")
        .eq("id", userId)
        .single();

      const currentBalance = profile?.slide_balance || 0;

      await supabaseAdmin
        .from("profiles")
        .update({ slide_balance: currentBalance + slides })
        .eq("id", userId);

      console.log(`Added ${slides} slides for ${userId}`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: true }); // Always return 200 to YooKassa
  }
}
