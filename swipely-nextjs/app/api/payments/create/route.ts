import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const YOOKASSA_API = "https://api.yookassa.ru/v3";

// Products config
const PRODUCTS: Record<
  string,
  { amount: number; description: string; type: string }
> = {
  pro_monthly: {
    amount: 990,
    description: "Swipely PRO — месячная подписка",
    type: "subscription",
  },
  pro_yearly: {
    amount: 9900,
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
};

export async function POST(request: Request) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { productId } = await request.json();
    const product = PRODUCTS[productId];

    if (!product) {
      return NextResponse.json(
        { error: "Неизвестный продукт" },
        { status: 400 }
      );
    }

    const shopId = process.env.YOOKASSA_SHOP_ID;
    const secretKey = process.env.YOOKASSA_SECRET_KEY;

    if (!shopId || !secretKey) {
      return NextResponse.json(
        { error: "Платежная система не настроена" },
        { status: 500 }
      );
    }

    // Create YooKassa payment
    const idempotenceKey = crypto.randomUUID();
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://swipelyai.vercel.app").trim();
    const returnUrl = `${appUrl}/dashboard?payment=success`;

    const res = await fetch(`${YOOKASSA_API}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString("base64")}`,
        "Idempotence-Key": idempotenceKey,
      },
      body: JSON.stringify({
        amount: {
          value: product.amount.toFixed(2),
          currency: "RUB",
        },
        confirmation: {
          type: "redirect",
          return_url: returnUrl,
        },
        capture: true,
        description: product.description,
        metadata: {
          user_id: user.id,
          user_email: user.email,
          product_id: productId,
          product_type: product.type,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ description: res.statusText }));
      console.error("YooKassa error:", JSON.stringify(err));
      return NextResponse.json(
        { error: `YooKassa: ${err.description || err.message || res.statusText}` },
        { status: 500 }
      );
    }

    const payment = await res.json();

    // Save payment record (non-blocking — don't fail if table schema differs)
    supabase.from("payments").insert({
      user_id: user.id,
      payment_id: payment.id,
      amount: product.amount,
      currency: "RUB",
      status: "pending",
      provider: "yookassa",
      product_type: productId,
    }).then(({ error: dbErr }) => {
      if (dbErr) console.error("DB save error:", dbErr.message);
    });

    return NextResponse.json({
      confirmationUrl: payment.confirmation.confirmation_url,
      paymentId: payment.id,
    });
  } catch (error) {
    console.error("Payment create error:", error);
    return NextResponse.json(
      { error: `Ошибка: ${error instanceof Error ? error.message : "неизвестная"}` },
      { status: 500 }
    );
  }
}
