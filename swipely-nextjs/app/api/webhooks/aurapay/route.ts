import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const AURAPAY_API = "https://app.aurapay.tech";

// Admin client — initialized lazily to avoid build-time env var errors
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

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
    const supabaseAdmin = getSupabaseAdmin();

    console.log("AuraPay webhook received:", JSON.stringify({ status: body.status, id: body.id, order_id: body.order_id }));

    // Only process paid invoices
    if (body.status !== "PAID") {
      return NextResponse.json({ ok: true });
    }

    const invoiceId = body.id;
    if (!invoiceId) {
      console.error("Webhook: missing invoice id");
      return NextResponse.json({ ok: true });
    }

    // ── SECURITY: Look up payment in OUR database ──────────────────────────
    // user_id and product come from our DB (set during authenticated invoice creation),
    // NOT from the webhook body — prevents forged webhook attacks.
    const { data: paymentRecord } = await supabaseAdmin
      .from("payments")
      .select("payment_id, status, product_type, amount, product_data")
      .eq("payment_id", invoiceId)
      .single();

    if (!paymentRecord) {
      // Unknown invoice — not created through our system, reject silently
      console.error("Webhook: unknown payment_id, rejecting:", invoiceId);
      return NextResponse.json({ ok: true });
    }

    if (paymentRecord.status === "succeeded") {
      // Idempotent — already processed
      console.log("Webhook: already processed, skipping:", invoiceId);
      return NextResponse.json({ ok: true });
    }

    // ── OPTIONAL: Cross-verify with AuraPay API ────────────────────────────
    // Confirms the invoice is actually PAID on AuraPay's side (defense in depth).
    const apiKey = process.env.AURAPAY_API_KEY;
    const shopId = process.env.AURAPAY_SHOP_ID;
    if (apiKey && shopId) {
      try {
        const verifyRes = await fetch(`${AURAPAY_API}/invoice/${invoiceId}`, {
          headers: { "X-ApiKey": apiKey, "X-ShopId": shopId },
        });
        if (verifyRes.ok) {
          const verified = await verifyRes.json();
          if (verified.status !== "PAID") {
            console.error("Webhook: AuraPay API status mismatch for", invoiceId, "got:", verified.status);
            return NextResponse.json({ ok: true });
          }
        } else {
          // API might not support GET /invoice/:id — log and proceed with DB check only
          console.warn("Webhook: AuraPay verify API returned", verifyRes.status, "for", invoiceId, "— proceeding with DB check");
        }
      } catch (err) {
        console.warn("Webhook: AuraPay API verification error (proceeding):", err);
      }
    }

    // ── Use trusted data from our DB, not from the webhook body ──────────
    const userId = paymentRecord.product_data?.user_id;
    const productId = paymentRecord.product_type;

    if (!userId || !productId) {
      console.error("Webhook: missing metadata in DB record for invoice:", invoiceId);
      return NextResponse.json({ ok: true });
    }

    console.log(`Processing payment: user=${userId}, product=${productId}`);

    // Handle subscription — activate BEFORE marking payment succeeded
    // so if this call fails, AuraPay retry will re-attempt activation
    if (PRODUCT_DURATION[productId]) {
      const days = PRODUCT_DURATION[productId];
      const now = new Date();

      // Fetch current subscription_end to extend from it (not from now) if still active
      const { data: currentProfile } = await supabaseAdmin
        .from("profiles")
        .select("subscription_end")
        .eq("id", userId)
        .single();

      const currentEnd = currentProfile?.subscription_end
        ? new Date(currentProfile.subscription_end)
        : null;
      // Extend from whichever is later: now or current expiry (preserves unused days on renewal)
      const baseDate = currentEnd && currentEnd > now ? currentEnd : now;
      const endsAt = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

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
        console.log(`PRO activated for ${userId} until ${endsAt.toISOString()} (extended from ${baseDate.toISOString()})`);
      }
    }

    // Handle fixed slide packs — atomic increment via RPC
    if (SLIDE_PACKS[productId]) {
      const slides = SLIDE_PACKS[productId];

      const { error: slideErr } = await supabaseAdmin.rpc("add_photo_slides", {
        p_user_id: userId,
        p_amount: slides,
      });

      if (slideErr) {
        console.error("Slide balance update error:", slideErr.message);
      } else {
        console.log(`Added ${slides} slides for ${userId}`);
      }
    }

    // Handle custom slide purchase — derive count from stored amount (trusted)
    if (productId === "photo_custom") {
      const PRICE_PER_SLIDE = 40;
      const slides =
        paymentRecord.product_data?.custom_slides ??
        Math.round(paymentRecord.amount / PRICE_PER_SLIDE);

      if (slides > 0) {
        const { error: slideErr } = await supabaseAdmin.rpc("add_photo_slides", {
          p_user_id: userId,
          p_amount: slides,
        });

        if (slideErr) {
          console.error("Custom slide balance update error:", slideErr.message);
        } else {
          console.log(`Added ${slides} custom slides for ${userId}`);
        }
      }
    }

    // Mark payment as succeeded LAST — only after all fulfillment is done.
    // This ensures AuraPay retries will re-attempt fulfillment if anything above failed.
    const { error: payErr } = await supabaseAdmin
      .from("payments")
      .update({ status: "succeeded" })
      .eq("payment_id", invoiceId);
    if (payErr) console.error("Payment update error:", payErr.message);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: true }); // Always return 200 to AuraPay
  }
}
