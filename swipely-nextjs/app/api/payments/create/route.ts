import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const AURAPAY_API = "https://app.aurapay.tech";

// Products config
const PRODUCTS: Record<
  string,
  { amount: number; description: string; type: string }
> = {
  test_1rub: {
    amount: 1,
    description: "Тестовый платёж 1₽",
    type: "test",
  },
  pro_monthly: {
    amount: 495, // Promo -50% (было 990)
    description: "Swipely PRO — месячная подписка",
    type: "subscription",
  },
  pro_yearly: {
    amount: 4950, // Promo -50% (было 9900)
    description: "Swipely PRO — годовая подписка",
    type: "subscription",
  },
  pack_15: {
    amount: 490,
    description: "Пакет 15 слайдов",
    type: "slide_pack",
  },
  pack_50: {
    amount: 1490,
    description: "Пакет 50 слайдов",
    type: "slide_pack",
  },
  pack_150: {
    amount: 3990,
    description: "Пакет 150 слайдов",
    type: "slide_pack",
  },
  photo_custom: {
    amount: 0, // calculated dynamically: slides * 40
    description: "Photo Mode кредиты",
    type: "photo_custom",
  },
};

export async function POST(request: Request) {
  const t0 = Date.now();
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const tAuth = Date.now() - t0;

    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, customSlides } = body as { productId: string; customSlides?: number };
    const product = PRODUCTS[productId];

    if (!product) {
      return NextResponse.json(
        { error: "Неизвестный продукт" },
        { status: 400 }
      );
    }

    // Validate custom slide purchase
    const PRICE_PER_SLIDE = 40;
    let finalAmount = product.amount;
    let finalSlides: number | undefined;

    if (productId === "photo_custom") {
      if (!customSlides || customSlides < 1 || customSlides > 1000 || !Number.isInteger(customSlides)) {
        return NextResponse.json(
          { error: "Укажи количество слайдов от 1 до 1000" },
          { status: 400 }
        );
      }
      finalAmount = customSlides * PRICE_PER_SLIDE;
      finalSlides = customSlides;
    }

    const apiKey = process.env.AURAPAY_API_KEY;
    const shopId = process.env.AURAPAY_SHOP_ID;

    if (!apiKey || !shopId) {
      return NextResponse.json(
        { error: "Платежная система не настроена" },
        { status: 500 }
      );
    }

    // Create AuraPay invoice
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://swipelyai.vercel.app").trim();
    const orderId = `${productId}_${user.id}_${Date.now()}`;
    const callbackUrl = `${appUrl}/api/webhooks/aurapay`;

    const tBeforeAura = Date.now();
    const res = await fetch(`${AURAPAY_API}/invoice/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ApiKey": apiKey,
        "X-ShopId": shopId,
      },
      body: JSON.stringify({
        amount: finalAmount,
        order_id: orderId,
        success_url: `${appUrl}/dashboard?payment=success`,
        fail_url: `${appUrl}/dashboard/pricing?payment=failed`,
        callback_url: callbackUrl,
        custom_fields: JSON.stringify({
          user_id: user.id,
          user_email: user.email,
          product_id: productId,
          product_type: product.type,
          ...(finalSlides !== undefined && { custom_slides: finalSlides }),
        }),
        comment: finalSlides
          ? `${product.description} — ${finalSlides} слайдов`
          : product.description,
        lifetime: 60,
      }),
    });

    const tAura = Date.now() - tBeforeAura;

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      console.error("AuraPay error:", JSON.stringify(err));
      return NextResponse.json(
        { error: `AuraPay: ${err.error || res.statusText}` },
        { status: 500 }
      );
    }

    const invoice = await res.json();

    console.log(`Payment timing: auth=${tAuth}ms, aurapay=${tAura}ms, total=${Date.now() - t0}ms`);

    // Save payment record BEFORE returning to client — webhook may fire immediately after payment
    // and requires this record to exist (it's the trusted source for user_id + product).
    // Use admin client to bypass RLS — user_id is already verified above.
    const adminClient = createAdminClient();
    const { error: dbErr } = await adminClient.from("payments").insert({
      payment_id: invoice.id,
      amount: finalAmount,
      currency: "RUB",
      status: "pending",
      payment_method: "aurapay",
      product_type: productId,
      user_id: user.id,
      product_data: {
        user_id: user.id,
        user_email: user.email,
        ...(finalSlides !== undefined && { custom_slides: finalSlides }),
      },
    });
    if (dbErr) {
      console.error("DB save error:", dbErr.message);
      return NextResponse.json({ error: "Ошибка сохранения платежа" }, { status: 500 });
    }

    return NextResponse.json({
      confirmationUrl: invoice.payment_data.url,
      paymentId: invoice.id,
    });
  } catch (error) {
    console.error("Payment create error:", error);
    return NextResponse.json(
      { error: `Ошибка: ${error instanceof Error ? error.message : "неизвестная"}` },
      { status: 500 }
    );
  }
}
