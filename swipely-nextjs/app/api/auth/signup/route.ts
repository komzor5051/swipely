import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { processReferral } from "@/lib/supabase/queries";

// Admin client with service_role key — can auto-confirm users
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { email, password, referralCode } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email и пароль обязательны" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Пароль должен быть минимум 6 символов" },
        { status: 400 }
      );
    }

    // Create user with admin API — email auto-confirmed
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      // User already exists
      if (error.message.includes("already been registered")) {
        return NextResponse.json(
          { error: "Пользователь с таким email уже существует" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Apply referral bonus if code provided (non-critical — don't fail signup)
    if (referralCode && data.user) {
      await processReferral(supabaseAdmin, data.user.id, referralCode).catch(
        (e) => console.error("Referral processing failed:", e)
      );
    }

    return NextResponse.json({ user: data.user });
  } catch {
    return NextResponse.json(
      { error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}
