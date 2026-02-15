"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { FadeIn, StaggerList, StaggerItem } from "@/components/ui/motion";

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recentGenerations, setRecentGenerations] = useState<Generation[]>([]);
  const [totalGenerations, setTotalGenerations] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    };

    load();
  }, []);

  const tier = profile?.subscription_tier || "free";
  const used = profile?.standard_used || 0;
  const limit = tier === "pro" ? "∞" : "3";
  const remaining = tier === "pro" ? "∞" : Math.max(0, 3 - used);

  return (
    <div className="space-y-8">
      {/* Header */}
      <FadeIn>
        <h1 className="text-2xl font-bold mb-1">
          Привет{profile?.first_name ? `, ${profile.first_name}` : ""}!
        </h1>
        <p className="text-muted-foreground">Обзор твоего аккаунта Swipely</p>
      </FadeIn>

      {/* Stats Grid */}
      <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" delay={0.1}>
        <StaggerItem>
          <div className="rounded-2xl border border-border bg-card p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Генерации</span>
              <div className="w-8 h-8 rounded-lg bg-[var(--swipely-blue)]/10 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-[var(--swipely-blue)]" />
              </div>
            </div>
            <div className="text-3xl font-bold font-[family-name:var(--font-mono)]">
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
          <div className="rounded-2xl border border-border bg-card p-5 hover:shadow-sm transition-shadow">
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
          <div className="rounded-2xl border border-border bg-card p-5 hover:shadow-sm transition-shadow">
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
                href="/pricing"
                className="text-xs text-[var(--swipely-blue)] hover:underline mt-1 inline-block"
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
          <div className="rounded-2xl border border-border bg-card p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Photo-слайды</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-amber-600" />
              </div>
            </div>
            <div className="text-3xl font-bold font-[family-name:var(--font-mono)]">
              {loading ? "—" : profile?.photo_slides_balance || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">в балансе</p>
          </div>
        </StaggerItem>
      </StaggerList>

      {/* Quick Actions */}
      <FadeIn delay={0.3}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/generate">
            <div className="rounded-2xl border border-[var(--swipely-blue)]/20 bg-[var(--swipely-blue)]/5 p-6 hover:bg-[var(--swipely-blue)]/10 hover:shadow-sm transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--swipely-blue)] text-white flex items-center justify-center shadow-sm">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Создать карусель</h3>
                  <p className="text-sm text-muted-foreground">
                    Текст → AI → готовые слайды
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-[var(--swipely-blue)] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link href="/pricing">
            <div className="rounded-2xl border border-border p-6 hover:border-[var(--swipely-blue)]/20 hover:shadow-sm transition-all cursor-pointer group">
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
        </div>
      </FadeIn>

      {/* Recent Generations */}
      <FadeIn delay={0.4}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Последние карусели</h2>
          {recentGenerations.length > 0 && (
            <Link
              href="/history"
              className="text-sm text-[var(--swipely-blue)] hover:underline"
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
                className="rounded-full bg-[var(--swipely-blue)] hover:bg-[var(--swipely-blue-dark)] active:scale-[0.98] transition-all"
              >
                Создать первую
              </Button>
            </Link>
          </div>
        ) : (
          <StaggerList className="space-y-3">
            {recentGenerations.map((gen) => (
              <StaggerItem key={gen.id}>
                <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 hover:border-[var(--swipely-blue)]/20 hover:shadow-sm transition-all">
                  <div className="w-10 h-10 rounded-lg bg-[var(--swipely-blue)]/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold font-[family-name:var(--font-mono)] text-[var(--swipely-blue)]">
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
