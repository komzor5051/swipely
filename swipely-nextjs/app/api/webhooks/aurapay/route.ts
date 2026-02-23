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

    console.log("AuraPay webhook received:", JSON.stringify({ status: body.status, id: body.id, order_id: body.order_id }));

    // Only process paid invoices
    if (body.status !== "PAID") {
      return NextResponse.json({ ok: true });
    }

    // Parse custom_fields (JSON string with user_id, product_id, etc.)
    let meta: { user_id?: string; product_id?: string; custom_slides?: number } = {};
    try {
      meta = body.custom_fields ? JSON.parse(body.custom_fields) : {};
    } catch {
      console.error("Webhook: failed to parse custom_fields", body.custom_fields);
    }

    const userId = meta.user_id;
    const productId = meta.product_id;

    if (!userId || !productId) {
      console.error("Webhook: missing metadata", body.id);
      return NextResponse.json({ ok: true });
    }

    console.log(`Processing payment: user=${userId}, product=${productId}`);

    // Update payment record (non-critical — table may not exist yet)
    const { error: payErr } = await supabaseAdmin
      .from("payments")
      .update({ status: "succeeded" })
      .eq("payment_id", body.id);
    if (payErr) console.error("Payment update error:", payErr.message);

    // Handle subscription
    if (PRODUCT_DURATION[productId]) {
      const days = PRODUCT_DURATION[productId];
      const now = new Date();
      const endsAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      const { error: subErr } = await supabaseAdmin
        .from("profiles")
        .update({
          subscription_tier: "pro",
          subscription_end: endsAt.toISOString(),
        })
        .eq("id", userId);

      if (subErr) {
        console.error("Subscription update error:", subErr.message);
      } else {
        console.log(`PRO activated for ${userId} until ${endsAt.toISOString()}`);
      }
    }

    // Handle fixed slide packs
    if (SLIDE_PACKS[productId]) {
      const slides = SLIDE_PACKS[productId];

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("photo_slides_balance")
        .eq("id", userId)
        .single();

      const currentBalance = profile?.photo_slides_balance || 0;

      const { error: slideErr } = await supabaseAdmin
        .from("profiles")
        .update({ photo_slides_balance: currentBalance + slides })
        .eq("id", userId);

      if (slideErr) {
        console.error("Slide balance update error:", slideErr.message);
      } else {
        console.log(`Added ${slides} slides for ${userId}`);
      }
    }

    // Handle custom slide purchase (photo_custom)
    if (productId === "photo_custom" && meta.custom_slides && meta.custom_slides > 0) {
      const slides = Number(meta.custom_slides);

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("photo_slides_balance")
        .eq("id", userId)
        .single();

      const currentBalance = profile?.photo_slides_balance || 0;

      const { error: slideErr } = await supabaseAdmin
        .from("profiles")
        .update({ photo_slides_balance: currentBalance + slides })
        .eq("id", userId);

      if (slideErr) {
        console.error("Custom slide balance update error:", slideErr.message);
      } else {
        console.log(`Added ${slides} custom slides for ${userId}`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: true }); // Always return 200 to AuraPay
  }
}
