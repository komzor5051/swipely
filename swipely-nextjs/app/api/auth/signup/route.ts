import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { processReferral } from "@/lib/supabase/queries";

// Admin client with service_role key — initialized lazily inside handlers
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─── Layer 2: IP Rate Limiter ───
// 3 accounts per IP per 24h (persistent via Supabase RPC — survives cold starts)

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

async function checkIpAllowed(ip: string): Promise<boolean> {
  if (ip === "unknown") return true; // can't determine IP, allow
  const { data, error } = await getSupabaseAdmin().rpc("check_ip_signup", { p_ip: ip });
  if (error) {
    console.error("IP check error:", error);
    return true; // fail open — don't block legitimate users on DB error
  }
  return data === true;
}

// ─── Layer 1: Disposable Email Check ───
// eslint-disable-next-line @typescript-eslint/no-require-imports
const disposableDomains: string[] = require("disposable-email-domains");
const disposableSet = new Set(disposableDomains);

function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return disposableSet.has(domain);
}

export async function POST(request: Request) {
  try {
    // ─── Layer 2: IP check (first gate) ───
    const ip = getClientIp(request);
    const ipAllowed = await checkIpAllowed(ip);
    if (!ipAllowed) {
      return NextResponse.json(
        { error: "Слишком много регистраций с этого IP. Попробуй завтра." },
        { status: 429 }
      );
    }

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

    // ─── Layer 1: Disposable email check ───
    if (isDisposableEmail(email)) {
      return NextResponse.json(
        { error: "Используй реальный email. Временные адреса не принимаются." },
        { status: 409 }
      );
    }

    // ─── Layer 3: Create user WITHOUT auto-confirm ───
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // requires email verification before generation
    });

    if (error) {
      if (error.message.includes("already been registered")) {
        return NextResponse.json(
          { error: "Пользователь с таким email уже существует" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // ─── Layer 3: Trigger confirmation email via Supabase SMTP ───
    // Admin API doesn't send emails — trigger it manually via REST endpoint
    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/resend`, {
      method: "POST",
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type: "signup", email }),
    }).catch((e) => console.error("Resend confirmation email failed:", e));

    // Apply referral bonus if code provided (non-critical — don't fail signup)
    if (referralCode && data.user) {
      await processReferral(admin, data.user.id, referralCode).catch(
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
