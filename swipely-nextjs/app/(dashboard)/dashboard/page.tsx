"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Generation } from "@/lib/supabase/queries";
import {
  Sparkles,
  Clock,
  TrendingUp,
  ArrowRight,
  BarChart3,
  CreditCard,
  Gift,
  AlertTriangle,
  CheckCircle2,
  X,
} from "lucide-react";
import { FadeIn, StaggerList, StaggerItem } from "@/components/ui/motion";
import TemplatePicker from "@/components/dashboard/TemplatePicker";

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recentGenerations, setRecentGenerations] = useState<Generation[]>([]);
  const [totalGenerations, setTotalGenerations] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadProfile = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    return data as Profile | null;
  };

  useEffect(() => {
    const isPaymentSuccess =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("payment") === "success";

    if (isPaymentSuccess) {
      setPaymentSuccess(true);
      // Remove query param from URL without reload
      window.history.replaceState({}, "", window.location.pathname);
    }

    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) setProfile(profileData as Profile);

      // Load recent generations
      const { data: genData } = await supabase
        .from("generations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (genData) setRecentGenerations(genData as Generation[]);

      // Count total
      const { count } = await supabase
        .from("generations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      setTotalGenerations(count ?? 0);
      setLoading(false);

      // If payment just happened — poll until tier becomes 'pro' (webhook may be slightly delayed)
      if (isPaymentSuccess) {
        let attempts = 0;
        pollRef.current = setInterval(async () => {
          attempts++;
          const fresh = await loadProfile();
          if (fresh) setProfile(fresh);
          if (fresh?.subscription_tier === "pro" || fresh?.photo_slides_balance !== profileData?.photo_slides_balance || attempts >= 10) {
            clearInterval(pollRef.current!);
          }
        }, 1500);
      }
    };

    load();

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const tier = profile?.subscription_tier || "free";
  const used = profile?.standard_used || 0;
  const limit = tier === "pro" ? "∞" : "3";
  const remaining = tier === "pro" ? "∞" : Math.max(0, 3 - used);

  const daysUntilExpiry = (() => {
    if (tier !== "pro" || !profile?.subscription_end) return null;
    const diff = new Date(profile.subscription_end).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  })();
  const showExpiryWarning = daysUntilExpiry !== null && daysUntilExpiry <= 7;

  return (
    <div className="space-y-8">
      {/* Payment success banner */}
      {paymentSuccess && (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-800">Оплата прошла успешно!</p>
            <p className="text-xs text-green-600 mt-0.5">
              Тариф обновляется — обычно это занимает несколько секунд.
            </p>
          </div>
          <button
            onClick={() => setPaymentSuccess(false)}
            className="text-green-400 hover:text-green-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <FadeIn>
        <h1 className="text-3xl font-bold mb-1 text-[#0D0D14]">
          Привет{profile?.first_name ? `, ${profile.first_name}` : ""}!
        </h1>
        <p className="text-[#6B7280]">Обзор твоего аккаунта Swipely</p>
      </FadeIn>

      {/* Primary CTA */}
      <FadeIn delay={0.05}>
        <Link href="/generate" className="block">
          <div className="rounded-2xl bg-[#D4F542] p-5 hover:bg-[#c8e83a] active:scale-[0.98] transition-all cursor-pointer group shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#0D0D14] text-[#D4F542] flex items-center justify-center shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[#0D0D14] text-lg">Создать карусель</h3>
                <p className="text-sm text-[#0D0D14]/60">
                  Текст → AI → готовые слайды за 30 секунд
                </p>
              </div>
              <ArrowRight className="h-6 w-6 text-[#0D0D14] group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      </FadeIn>

      {/* Template picker */}
      <FadeIn delay={0.08}>
        <TemplatePicker isPro={tier === "pro"} />
      </FadeIn>

      {/* Stats Grid */}
      <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" delay={0.1}>
        <StaggerItem>
          <div className="rounded-2xl border border-[#E8E8E4] bg-white p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Генерации</span>
              <div className="w-8 h-8 rounded-lg bg-[#D4F542]/20 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-[#0D0D14]" />
              </div>
            </div>
            <div className="text-3xl font-bold font-[family-name:var(--font-mono)] text-[#0D0D14]">
              {loading ? "—" : remaining}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                / {limit}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">осталось в месяце</p>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="rounded-2xl border border-[#E8E8E4] bg-white p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Всего создано</span>
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold font-[family-name:var(--font-mono)]">
              {loading ? "—" : totalGenerations}
            </div>
            <p className="text-xs text-muted-foreground mt-1">каруселей</p>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="rounded-2xl border border-[#E8E8E4] bg-white p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Тариф</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <div className="text-xl font-bold">
              {loading ? "—" : tier === "pro" ? "PRO" : "Бесплатный"}
            </div>
            {tier !== "pro" && (
              <Link
                href="/dashboard/pricing"
                className="text-xs text-[#0D0D14] hover:text-[#374151] underline underline-offset-2 mt-1 inline-block font-medium"
              >
                Перейти на PRO →
              </Link>
            )}
            {tier === "pro" && profile?.subscription_end && (
              <p className="text-xs text-muted-foreground mt-1">
                до{" "}
                {new Date(profile.subscription_end).toLocaleDateString("ru-RU")}
              </p>
            )}
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="rounded-2xl border border-[#E8E8E4] bg-white p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Photo-слайды</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-amber-600" />
              </div>
            </div>
            <div className="text-3xl font-bold font-[family-name:var(--font-mono)]">
              {loading ? "—" : profile?.photo_slides_balance || 0}
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">в балансе</p>
              <Link
                href="/dashboard/pricing"
                className="text-xs font-semibold text-amber-600 hover:text-amber-800 transition-colors"
              >
                Купить →
              </Link>
            </div>
          </div>
        </StaggerItem>
      </StaggerList>

      {/* PRO expiry warning */}
      {!loading && showExpiryWarning && (
        <FadeIn delay={0.25}>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800">
                {daysUntilExpiry! <= 0
                  ? "Подписка PRO истекла"
                  : `Подписка PRO истекает через ${daysUntilExpiry} ${daysUntilExpiry === 1 ? "день" : daysUntilExpiry! <= 4 ? "дня" : "дней"}`}
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                Продли, чтобы не потерять безлимитные генерации
              </p>
            </div>
            <Link href="/dashboard/pricing">
              <button className="text-xs font-semibold text-amber-700 hover:text-amber-900 whitespace-nowrap transition-colors">
                Продлить →
              </button>
            </Link>
          </div>
        </FadeIn>
      )}

      {/* Quick Actions */}
      <FadeIn delay={0.3}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/dashboard/pricing">
            <div className="rounded-2xl border border-[#E8E8E4] p-6 hover:border-[#D4F542]/30 hover:shadow-sm transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Управление тарифом</h3>
                  <p className="text-sm text-muted-foreground">
                    {tier === "pro" ? "Просмотр подписки" : "Перейти на PRO"}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link href="/referral">
            <div className="rounded-2xl border border-green-200/60 bg-green-50/50 p-6 hover:bg-green-50 hover:shadow-sm transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Gift className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Пригласи друга</h3>
                  <p className="text-sm text-muted-foreground">
                    +5 Photo-слайдов за каждого
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-green-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </FadeIn>

      {/* Recent Generations */}
      <FadeIn delay={0.4}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Последние карусели</h2>
          {recentGenerations.length > 0 && (
            <Link
              href="/history"
              className="text-sm text-[#0D0D14] hover:text-[#374151] underline underline-offset-2 font-medium"
            >
              Все →
            </Link>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
                    <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : recentGenerations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
              У тебя пока нет каруселей
            </p>
            <Link href="/generate">
              <Button
                size="sm"
                className="rounded-full bg-[#D4F542] text-[#0D0D14] hover:bg-[#c8e83a] active:scale-[0.98] transition-all font-semibold"
              >
                Создать первую
              </Button>
            </Link>
          </div>
        ) : (
          <StaggerList className="space-y-3">
            {recentGenerations.map((gen) => (
              <StaggerItem key={gen.id}>
                <div className="rounded-xl border border-[#E8E8E4] bg-white p-4 flex items-center gap-4 hover:border-[#D4F542]/30 hover:shadow-sm transition-all">
                  <div className="w-10 h-10 rounded-lg bg-[#D4F542]/15 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold font-[family-name:var(--font-mono)] text-[#0D0D14]">
                      {gen.slide_count}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {gen.input_text.slice(0, 60)}
                      {gen.input_text.length > 60 ? "..." : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {gen.template} ·{" "}
                      {new Date(gen.created_at).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </FadeIn>
    </div>
  );
}
