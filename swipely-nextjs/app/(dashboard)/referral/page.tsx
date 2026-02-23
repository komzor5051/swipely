"use client";

import { useEffect, useState } from "react";
import { Gift, Copy, Check, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";

interface ReferralStats {
  code: string | null;
  count: number;
  totalBonusEarned: number;
}

export default function ReferralPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referral")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const referralUrl = stats?.code
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/signup?ref=${stats.code}`
    : "";

  const handleCopy = async () => {
    if (!referralUrl) return;
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-xl space-y-6">
      <FadeIn>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-[var(--swipely-lime)]/20 flex items-center justify-center">
            <Gift className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Пригласи друга</h1>
            <p className="text-sm text-muted-foreground">
              Получай Photo-слайды за каждого приглашённого
            </p>
          </div>
        </div>
      </FadeIn>

      {/* How it works */}
      <FadeIn delay={0.1}>
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Как это работает
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted/50 p-4 text-center">
              <div className="text-3xl font-bold font-[family-name:var(--font-mono)] text-[var(--swipely-blue)]">
                +3
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                слайда твоему другу при регистрации
              </p>
            </div>
            <div className="rounded-xl bg-muted/50 p-4 text-center">
              <div className="text-3xl font-bold font-[family-name:var(--font-mono)] text-green-600">
                +5
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                слайдов тебе за каждого приглашённого
              </p>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Referral link */}
      <FadeIn delay={0.2}>
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Твоя реферальная ссылка
          </h2>
          {loading ? (
            <div className="h-10 bg-muted rounded-xl animate-pulse" />
          ) : stats?.code ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-xl bg-muted/60 px-4 py-2.5 text-sm font-[family-name:var(--font-mono)] truncate text-muted-foreground">
                {referralUrl}
              </div>
              <Button
                size="sm"
                onClick={handleCopy}
                className="rounded-xl shrink-0 bg-[var(--swipely-blue)] hover:bg-[var(--swipely-blue-dark)] active:scale-[0.98] transition-all"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="ml-1.5">{copied ? "Скопировано" : "Копировать"}</span>
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Реферальный код не найден. Попробуй обновить страницу.
            </p>
          )}
        </div>
      </FadeIn>

      {/* Stats */}
      <FadeIn delay={0.3}>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Приглашено</span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="h-3.5 w-3.5 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold font-[family-name:var(--font-mono)]">
              {loading ? "—" : stats?.count ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">человек</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Заработано</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              </div>
            </div>
            <div className="text-3xl font-bold font-[family-name:var(--font-mono)]">
              {loading ? "—" : stats?.totalBonusEarned ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Photo-слайдов</p>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
