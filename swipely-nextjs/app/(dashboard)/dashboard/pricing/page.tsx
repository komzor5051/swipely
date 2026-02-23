"use client";

import { useState, useEffect } from "react";
import { Check, Minus, Camera, Zap, ChevronDown, CreditCard } from "lucide-react";
import { CustomSlidePicker } from "@/components/pricing/CustomSlidePicker";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/queries";
import { ProButton } from "@/app/pricing/ProButton";
import { cn } from "@/lib/utils";

// ─── Data ───

const FREE_FEATURES = [
  { text: "3 карусели в месяц", ok: true },
  { text: "18 шаблонов дизайна", ok: true },
  { text: "Подпись к посту", ok: true },
  { text: "PNG экспорт", ok: true },
  { text: "Photo Mode", ok: false },
  { text: "Без водяного знака", ok: false },
  { text: "Приоритетная очередь", ok: false },
];

const PRO_FEATURES = [
  { text: "Безлимит карусели в месяц", highlight: false },
  { text: "Photo Mode — AI-фото слайды", highlight: true },
  { text: "18 шаблонов дизайна", highlight: false },
  { text: "Подпись к посту", highlight: false },
  { text: "PNG экспорт", highlight: false },
  { text: "Без водяного знака", highlight: false },
  { text: "Приоритетная очередь", highlight: false },
];

const PHOTO_PACKS = [
  { slides: 15, price: 490, per: "~33₽/слайд", productId: "pack_15" },
  { slides: 50, price: 1490, per: "~30₽/слайд", productId: "pack_50", popular: true },
  { slides: 150, price: 3990, per: "~27₽/слайд", productId: "pack_150", best: true },
];

const FAQS = [
  {
    q: "Что такое Photo Mode?",
    a: "Photo Mode генерирует уникальные AI-изображения для каждого слайда. Каждый слайд — это сгенерированная картинка со встроенным текстом. Требует кредиты слайдов.",
  },
  {
    q: "Что произойдёт после истечения PRO?",
    a: "Тариф автоматически понизится до бесплатного. Генерации сохранятся в истории. Автоматического продления нет.",
  },
];

// ─── Billing Toggle ───

function BillingToggle({
  billing,
  onChange,
}: {
  billing: "monthly" | "yearly";
  onChange: (b: "monthly" | "yearly") => void;
}) {
  return (
    <div className="inline-flex items-center bg-muted rounded-full p-1 gap-0.5">
      {(["monthly", "yearly"] as const).map((b) => (
        <button
          key={b}
          onClick={() => onChange(b)}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
            billing === b
              ? "bg-white shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {b === "monthly" ? (
            "По месяцам"
          ) : (
            <span className="flex items-center gap-1.5">
              За год
              <span className="text-[10px] font-bold bg-[var(--lime)] text-[var(--on-lime)] px-1.5 py-0.5 rounded-full leading-none">
                −17%
              </span>
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Page ───

export default function DashboardPricingPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

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
  const photoBalance = profile?.photo_slides_balance ?? 0;
  const proPrice = billing === "yearly" ? 825 : 990;
  const proProductId = billing === "yearly" ? "pro_yearly" : "pro_monthly";

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
            tier === "pro"
              ? "bg-[var(--lime)]/10 border-[var(--lime)]/25 text-[#1a2e00]"
              : "bg-muted border-border text-muted-foreground"
          )}>
            <span className={cn(
              "w-1.5 h-1.5 rounded-full",
              tier === "pro" ? "bg-[var(--lime)]" : "bg-muted-foreground/50"
            )} />
            {tier === "pro" ? "PRO тариф" : "Бесплатный тариф"}
          </div>
        )}
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center pt-1">
        <BillingToggle billing={billing} onChange={setBilling} />
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* FREE */}
        <div className="relative rounded-2xl border border-border bg-card p-7 flex flex-col">
          {tier === "free" && !loading && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Ваш тариф
            </div>
          )}

          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 mb-3">
              Бесплатный
            </p>
            <div className="flex items-end gap-2 mb-1">
              <span
                className="text-[52px] font-black tracking-tight leading-none text-foreground"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                0
              </span>
              <span className="text-xl text-muted-foreground mb-2">₽</span>
            </div>
            <p className="text-sm text-muted-foreground">Навсегда бесплатно</p>
          </div>

          <ul className="flex-1 space-y-2.5 mb-7">
            {FREE_FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-2.5 text-sm">
                <span className={cn(
                  "w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0",
                  f.ok ? "bg-foreground/8" : "bg-muted"
                )}>
                  {f.ok
                    ? <Check className="h-2.5 w-2.5 text-foreground/60" />
                    : <Minus className="h-2.5 w-2.5 text-muted-foreground/30" />
                  }
                </span>
                <span className={f.ok ? "text-foreground/80" : "text-muted-foreground/35 line-through"}>
                  {f.text}
                </span>
              </li>
            ))}
          </ul>

          <Button
            variant="outline"
            className="w-full rounded-xl"
            disabled={tier === "free" || loading}
          >
            {tier === "free" ? "Текущий тариф" : "Бесплатный тариф"}
          </Button>
        </div>

        {/* PRO */}
        <div className="rounded-2xl bg-[#0D0D14] p-7 flex flex-col relative overflow-hidden shadow-xl">
          {/* Glow */}
          <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-[#D4F542]/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full bg-[#0A84FF]/8 blur-2xl pointer-events-none" />
          {/* Grid texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-60"
            style={{
              backgroundImage:
                "linear-gradient(rgba(212,245,66,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(212,245,66,0.04) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          <div className="absolute top-4 right-4 bg-[#D4F542] text-[#0D0D14] text-[11px] font-black px-2.5 py-1 rounded-full z-10">
            Популярный
          </div>

          {tier === "pro" && !loading && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 text-[11px] font-semibold text-white/50 bg-white/8 px-2.5 py-1 rounded-full z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4F542] inline-block" />
              Активен
            </div>
          )}

          <div className="relative z-10 mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">PRO</p>
            <div className="flex items-end gap-2 mb-1">
              <span
                className="text-[52px] font-black tracking-tight leading-none text-white transition-all duration-300"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {proPrice.toLocaleString("ru-RU")}
              </span>
              <span className="text-xl text-white/35 mb-2">₽/мес</span>
            </div>
            <p className="text-sm text-white/30">
              {billing === "yearly"
                ? `9 900₽/год · сэкономишь ${(990 * 12 - 9900).toLocaleString("ru-RU")}₽`
                : "или 825₽/мес при оплате за год"}
            </p>
          </div>

          <ul className="relative z-10 flex-1 space-y-2.5 mb-7">
            {PRO_FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-2.5 text-sm">
                <span className={cn(
                  "w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0",
                  f.highlight ? "bg-[#D4F542]" : "bg-white/10"
                )}>
                  <Check className={cn(
                    "h-2.5 w-2.5",
                    f.highlight ? "text-[#0D0D14]" : "text-white/80"
                  )} />
                </span>
                <span className={f.highlight ? "text-[#D4F542] font-semibold" : "text-white/70"}>
                  {f.text}
                </span>
              </li>
            ))}
          </ul>

          <div className="relative z-10">
            {tier === "pro" ? (
              <Button
                className="w-full rounded-xl bg-white/8 text-white hover:bg-white/12 border border-white/10"
                disabled
              >
                Активный тариф
              </Button>
            ) : (
              <ProButton
                productId={proProductId}
                label={
                  billing === "yearly"
                    ? "Купить PRO · 9 900₽/год →"
                    : "Купить PRO · 990₽/мес →"
                }
                className="w-full rounded-xl bg-[#D4F542] hover:bg-[#c8e83a] text-[#0D0D14] font-bold border-0 text-sm"
              />
            )}
          </div>
        </div>
      </div>

      {/* Photo Mode Credits */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[var(--swipely-blue)]/10 border border-[var(--swipely-blue)]/15 flex items-center justify-center">
              <Camera className="h-4 w-4 text-[var(--swipely-blue)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Photo Mode — кредиты</h3>
              <p className="text-xs text-muted-foreground">AI-изображения для слайдов · 1 кредит = 1 слайд</p>
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

        <div className="grid grid-cols-3 gap-3">
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
      {!loading && tier === "free" && (
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
            className="shrink-0 rounded-xl bg-amber-500 hover:bg-amber-600 text-white border-0 font-semibold text-xs px-4 h-8"
          />
        </div>
      )}

      {/* Pro expiry warning */}
      {!loading && tier === "pro" && profile?.subscription_end && (() => {
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
              className="shrink-0 rounded-xl bg-orange-500 hover:bg-orange-600 text-white border-0 font-semibold text-xs px-4 h-8"
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
