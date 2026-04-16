"use client";

import { useState, useEffect } from "react";
import { Camera, Zap, ChevronDown, CreditCard } from "lucide-react";
import { CustomSlidePicker } from "@/components/pricing/CustomSlidePicker";
import { Button } from "@/components/ui/button";
import { Pricing } from "@/components/ui/pricing";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/queries";
import { ProButton } from "@/app/pricing/ProButton";
import { cn } from "@/lib/utils";

// ─── Data ───

const PHOTO_PACKS = [
  { slides: 15, price: 490, per: "~33₽/слайд", productId: "pack_15" },
  { slides: 50, price: 1490, per: "~30₽/слайд", productId: "pack_50", popular: true },
  { slides: 150, price: 3990, per: "~27₽/слайд", productId: "pack_150", best: true },
];

const FAQS = [
  {
    q: "Что такое AI карусель с вашим фото?",
    a: "Генерируем уникальные AI-изображения с вашим фото или персонажем для каждого слайда. Каждый слайд — картинка с вашим героем и текстом. Требует кредиты слайдов.",
  },
  {
    q: "Что произойдёт после истечения PRO?",
    a: "Тариф автоматически понизится до бесплатного. Генерации сохранятся в истории. Автоматического продления нет.",
  },
];

// ─── Page ───

export default function DashboardPricingPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMonthly, setIsMonthly] = useState(true);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [proLoading, setProLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) setProfile(data as Profile);
      setLoading(false);
    };
    load();
  }, []);

  const tier = profile?.subscription_tier ?? "free";
  const isPro = tier === "pro";
  const photoBalance = profile?.photo_slides_balance ?? 0;

  const handleProPurchase = async () => {
    const productId = isMonthly ? "pro_monthly" : "pro_yearly";
    setProLoading(true);
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Ошибка при создании платежа"); return; }
      window.location.href = data.confirmationUrl;
    } catch {
      alert("Ошибка сети. Попробуйте позже.");
    } finally {
      setProLoading(false);
    }
  };

  const plans = [
    {
      name: "Бесплатный",
      price: 0,
      yearlyPrice: 0,
      period: "навсегда",
      features: [
        "3 карусели в месяц",
        "18 шаблонов дизайна",
        "Подпись к посту",
        "PNG экспорт",
      ],
      description: "Без кредитной карты",
      buttonText: isPro ? "Бесплатный тариф" : "Текущий тариф",
      isPopular: false,
      disabled: !isPro || loading,
    },
    {
      name: "PRO",
      price: 495,
      yearlyPrice: 412,
      period: "в месяц",
      features: [
        "Безлимит карусели в месяц",
        "AI карусель с вашим фото",
        "18 шаблонов дизайна",
        "Подпись к посту",
        "PNG экспорт",
        "Без водяного знака",
        "Приоритетная очередь",
      ],
      description: isMonthly ? "было 990₽ · −50%" : "4 950₽/год · было 9 900₽",
      buttonText: isPro
        ? "Активный тариф"
        : proLoading
        ? "Создание платежа..."
        : isMonthly
        ? "Купить PRO · 495₽/мес →"
        : "Купить PRO · 4 950₽/год →",
      isPopular: true,
      onClick: isPro ? undefined : handleProPurchase,
      disabled: isPro || loading || proLoading,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Тарифы</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Управляй подпиской и кредитами
          </p>
        </div>
        {!loading && (
          <div className={cn(
            "flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border",
            isPro
              ? "bg-[var(--lime)]/10 border-[var(--lime)]/25 text-[#1a2e00]"
              : "bg-muted border-border text-muted-foreground"
          )}>
            <span className={cn(
              "w-1.5 h-1.5 rounded-full",
              isPro ? "bg-[var(--lime)]" : "bg-muted-foreground/50"
            )} />
            {isPro ? "PRO тариф" : "Бесплатный тариф"}
          </div>
        )}
      </div>

      {/* Pricing cards with animated toggle */}
      <Pricing
        plans={plans}
        isMonthly={isMonthly}
        onToggle={(monthly) => setIsMonthly(monthly)}
      />

      {/* Photo Mode Credits */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[var(--swipely-blue)]/10 border border-[var(--swipely-blue)]/15 flex items-center justify-center">
              <Camera className="h-4 w-4 text-[var(--swipely-blue)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">AI карусель с вашим фото — кредиты</h3>
              <p className="text-xs text-muted-foreground">Ваш персонаж на каждом слайде · 1 кредит = 1 слайд</p>
            </div>
          </div>
          {!loading && (
            <div className="flex items-center gap-2 bg-[var(--swipely-blue)]/8 border border-[var(--swipely-blue)]/15 px-3 py-1.5 rounded-full">
              <CreditCard className="h-3 w-3 text-[var(--swipely-blue)]" />
              <span
                className="text-sm font-bold text-[var(--swipely-blue)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {photoBalance}
              </span>
              <span className="text-xs text-muted-foreground">слайдов</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PHOTO_PACKS.map((pack) => (
            <div
              key={pack.productId}
              className={cn(
                "rounded-xl p-4 relative text-center flex flex-col items-center",
                pack.popular
                  ? "border-2 border-[var(--swipely-blue)]/40 bg-[var(--swipely-blue)]/5"
                  : pack.best
                  ? "border border-[var(--lime)]/30 bg-[var(--lime)]/5"
                  : "border border-border bg-muted/30"
              )}
            >
              {pack.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[var(--swipely-blue)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                  Выгодно
                </div>
              )}
              {pack.best && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[var(--lime)] text-[var(--on-lime)] text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                  Максимум
                </div>
              )}

              <div
                className={cn(
                  "text-2xl font-black mb-0.5",
                  pack.best
                    ? "text-[#2a5200]"
                    : pack.popular
                    ? "text-[var(--swipely-blue)]"
                    : "text-foreground"
                )}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {pack.slides}
              </div>
              <div className="text-xs text-muted-foreground mb-3">слайдов</div>
              <div className="text-base font-black mb-0.5">
                {pack.price.toLocaleString("ru-RU")}₽
              </div>
              <div className="text-xs text-muted-foreground mb-4">{pack.per}</div>

              <ProButton
                productId={pack.productId}
                label="Купить"
                size="sm"
                className={cn(
                  "w-full rounded-lg text-xs h-8 px-3 font-semibold border-0",
                  pack.popular
                    ? "bg-[var(--swipely-blue)] hover:bg-[var(--swipely-blue-dark)] text-white"
                    : pack.best
                    ? "bg-[var(--lime)] hover:bg-[var(--lime-hover)] text-[var(--on-lime)]"
                    : "bg-foreground/8 hover:bg-foreground/12 text-foreground"
                )}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Custom Slide Picker */}
      <CustomSlidePicker variant="light" />

      {/* Usage Stats */}
      {!loading && !isPro && (
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50/50 p-4 flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <Zap className="h-4 w-4 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900">
              Осталось генераций: {Math.max(0, 3 - (profile?.standard_used ?? 0))} / 3
            </p>
            <p className="text-xs text-amber-700/70 mt-0.5">
              Переходи на PRO — больше ни в чём не ограничен
            </p>
          </div>
          <ProButton
            productId="pro_monthly"
            label="Купить PRO"
            size="sm"
            className="shrink-0 w-auto rounded-xl bg-amber-500 hover:bg-amber-600 text-white border-0 font-semibold text-xs px-4 h-8"
          />
        </div>
      )}

      {/* Pro expiry warning */}
      {!loading && isPro && profile?.subscription_end && (() => {
        const days = Math.ceil((new Date(profile.subscription_end).getTime() - Date.now()) / 86400000);
        return days <= 7 ? (
          <div className="rounded-2xl border border-orange-200/60 bg-orange-50/50 p-4 flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange-900">PRO заканчивается через {days} дн.</p>
              <p className="text-xs text-orange-700/70 mt-0.5">Продли подписку, чтобы не потерять доступ</p>
            </div>
            <ProButton
              productId="pro_monthly"
              label="Продлить"
              size="sm"
              className="shrink-0 w-auto rounded-xl bg-orange-500 hover:bg-orange-600 text-white border-0 font-semibold text-xs px-4 h-8"
            />
          </div>
        ) : null;
      })()}

      {/* FAQ */}
      <div className="space-y-2">
        {FAQS.map((faq, i) => (
          <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
            <button
              onClick={() => setFaqOpen(faqOpen === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-left text-sm font-medium hover:text-[var(--swipely-blue)] transition-colors"
            >
              {faq.q}
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0 ml-4",
                  faqOpen === i && "rotate-180"
                )}
              />
            </button>
            {faqOpen === i && (
              <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
