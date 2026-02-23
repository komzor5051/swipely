"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Minus, Camera, Zap, ArrowRight, ChevronDown } from "lucide-react";
import { CustomSlidePicker } from "@/components/pricing/CustomSlidePicker";
import { Button } from "@/components/ui/button";
import { ProButton } from "./ProButton";
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
    a: "Photo Mode генерирует уникальные AI-изображения для каждого слайда вместо текстовых шаблонов. Каждый слайд — это сгенерированная картинка со встроенным текстом.",
  },
  {
    q: "Зачем покупать Photo Mode кредиты?",
    a: "PRO-подписка открывает доступ к Photo Mode. Кредиты слайдов — дополнительный запас для больших объёмов. 1 кредит = 1 AI-изображение в карусели.",
  },
  {
    q: "Можно ли отменить подписку?",
    a: "Да. Подписка действует до конца оплаченного периода (30 или 365 дней). Автоматического продления нет.",
  },
];

// ─── Billing Toggle ───

function BillingToggle({ billing, onChange }: { billing: "monthly" | "yearly"; onChange: (b: "monthly" | "yearly") => void }) {
  return (
    <div className="inline-flex items-center bg-white/8 border border-white/10 rounded-full p-1 gap-0.5">
      {(["monthly", "yearly"] as const).map((b) => (
        <button
          key={b}
          onClick={() => onChange(b)}
          className={cn(
            "relative px-5 py-2 rounded-full text-sm font-medium transition-all duration-200",
            billing === b
              ? "bg-white text-[#0D0D14] shadow-sm"
              : "text-white/50 hover:text-white/80"
          )}
        >
          {b === "monthly" ? "По месяцам" : (
            <span className="flex items-center gap-2">
              За год
              <span className="text-[10px] font-bold bg-[#D4F542] text-[#0D0D14] px-1.5 py-0.5 rounded-full leading-none">
                −17%
              </span>
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Main Plans ───

function Plans({ billing }: { billing: "monthly" | "yearly" }) {
  const proPrice = billing === "yearly" ? 825 : 990;
  const proProductId = billing === "yearly" ? "pro_yearly" : "pro_monthly";
  const proLabel = billing === "yearly" ? "Купить PRO · 9 900₽/год" : "Купить PRO · 990₽/мес";

  return (
    <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
      {/* FREE */}
      <div className="rounded-2xl border border-white/8 bg-white/4 p-7 flex flex-col backdrop-blur-sm">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">Бесплатный</p>
          <div className="flex items-end gap-2 mb-1">
            <span className="text-[56px] font-black tracking-tight leading-none text-white" style={{ fontFamily: "var(--font-mono)" }}>
              0
            </span>
            <span className="text-xl text-white/30 mb-2">₽</span>
          </div>
          <p className="text-sm text-white/35">Навсегда бесплатно</p>
        </div>

        <ul className="flex-1 space-y-3 mb-8">
          {FREE_FEATURES.map((f) => (
            <li key={f.text} className="flex items-center gap-3 text-sm">
              <span className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                f.ok ? "bg-white/12" : "bg-white/4"
              )}>
                {f.ok
                  ? <Check className="h-3 w-3 text-white/70" />
                  : <Minus className="h-3 w-3 text-white/20" />
                }
              </span>
              <span className={f.ok ? "text-white/70" : "text-white/20 line-through decoration-white/15"}>
                {f.text}
              </span>
            </li>
          ))}
        </ul>

        <Link href="/signup">
          <Button
            variant="outline"
            size="lg"
            className="w-full rounded-xl border-white/15 bg-transparent text-white/60 hover:bg-white/8 hover:text-white hover:border-white/25 transition-all"
          >
            Начать бесплатно
          </Button>
        </Link>
      </div>

      {/* PRO */}
      <div className="rounded-2xl border-2 border-[#D4F542]/40 bg-[#0D0D14] p-7 flex flex-col relative overflow-hidden shadow-2xl shadow-[#D4F542]/5">
        {/* Glow effects */}
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[#D4F542]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-[#0A84FF]/8 blur-2xl pointer-events-none" />
        {/* Grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(212,245,66,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(212,245,66,0.04) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="absolute top-5 right-5 bg-[#D4F542] text-[#0D0D14] text-xs font-black px-3 py-1 rounded-full z-10">
          Популярный
        </div>

        <div className="relative z-10 mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">PRO</p>
          <div className="flex items-end gap-2 mb-1">
            <span
              className="text-[56px] font-black tracking-tight leading-none text-white transition-all duration-300"
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

        <ul className="relative z-10 flex-1 space-y-3 mb-8">
          {PRO_FEATURES.map((f) => (
            <li key={f.text} className="flex items-center gap-3 text-sm">
              <span className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                f.highlight ? "bg-[#D4F542]" : "bg-white/12"
              )}>
                <Check className={cn("h-3 w-3", f.highlight ? "text-[#0D0D14]" : "text-white/80")} />
              </span>
              <span className={f.highlight ? "text-[#D4F542] font-semibold" : "text-white/75"}>
                {f.text}
              </span>
            </li>
          ))}
        </ul>

        <div className="relative z-10">
          <ProButton
            productId={proProductId}
            label={proLabel}
            className="w-full rounded-xl bg-[#D4F542] hover:bg-[#c8e83a] text-[#0D0D14] font-bold border-0 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Photo Mode Credits ───

function PhotoCredits() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-[#0A84FF]/15 border border-[#0A84FF]/20 flex items-center justify-center">
            <Camera className="h-4 w-4 text-[#0A84FF]" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Photo Mode — кредиты слайдов</h3>
            <p className="text-xs text-white/35">AI-изображения для каруселей · 1 кредит = 1 слайд</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {PHOTO_PACKS.map((pack) => (
            <div
              key={pack.productId}
              className={cn(
                "rounded-xl p-4 text-center relative flex flex-col items-center",
                pack.popular
                  ? "border-2 border-[#0A84FF]/50 bg-[#0A84FF]/8"
                  : pack.best
                  ? "border border-[#D4F542]/25 bg-[#D4F542]/4"
                  : "border border-white/8 bg-white/4"
              )}
            >
              {pack.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#0A84FF] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                  Выгодно
                </div>
              )}
              {pack.best && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#D4F542] text-[#0D0D14] text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                  Максимум
                </div>
              )}

              <div
                className="text-2xl font-black mb-0.5"
                style={{ fontFamily: "var(--font-mono)", color: pack.best ? "#D4F542" : pack.popular ? "#60A5FA" : "rgba(255,255,255,0.7)" }}
              >
                {pack.slides}
              </div>
              <div className="text-xs text-white/30 mb-3">слайдов</div>
              <div className="text-lg font-black text-white mb-0.5">{pack.price.toLocaleString("ru-RU")}₽</div>
              <div className="text-xs text-white/30 mb-4">{pack.per}</div>

              <ProButton
                productId={pack.productId}
                label="Купить"
                size="sm"
                className={cn(
                  "w-full rounded-lg text-xs h-8 px-3 font-semibold border-0",
                  pack.popular
                    ? "bg-[#0A84FF] hover:bg-[#0066CC] text-white"
                    : pack.best
                    ? "bg-[#D4F542] hover:bg-[#c8e83a] text-[#0D0D14]"
                    : "bg-white/10 hover:bg-white/15 text-white"
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── FAQ ───

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="max-w-2xl mx-auto space-y-2">
      {FAQS.map((faq, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/8 bg-white/4 overflow-hidden"
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-white/75 hover:text-white transition-colors"
          >
            {faq.q}
            <ChevronDown
              className={cn(
                "h-4 w-4 text-white/30 transition-transform duration-200 shrink-0 ml-4",
                open === i && "rotate-180"
              )}
            />
          </button>
          {open === i && (
            <div className="px-5 pb-4 text-sm text-white/40 leading-relaxed">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Page ───

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="min-h-screen bg-[#0D0D14] text-white">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full bg-[#D4F542]/4 blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-[#0A84FF]/5 blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 w-[500px] h-[300px] rounded-full bg-[#D4F542]/3 blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-5 border-b border-white/6">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#D4F542] flex items-center justify-center">
            <svg viewBox="0 0 32 32" fill="none" width={20} height={20}>
              <path d="M10 12h12M10 16h12M10 20h8" stroke="#0D0D14" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-lg font-bold">Swipely</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-white/50 hover:text-white hover:bg-white/8 rounded-full">
              Войти
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="rounded-full bg-[#D4F542] text-[#0D0D14] hover:bg-[#c8e83a] font-semibold px-5">
              Начать бесплатно
            </Button>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="relative z-10 px-6 pt-16 pb-20 space-y-10">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#D4F542]/10 border border-[#D4F542]/20 text-[#D4F542] text-xs font-semibold px-3 py-1.5 rounded-full">
            <Zap className="h-3 w-3" />
            Тарифы Swipely
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight">
            Начни за 0₽.{" "}
            <span className="text-[#D4F542]">Расти без лимитов.</span>
          </h1>
          <p className="text-lg text-white/40 max-w-md mx-auto">
            AI-карусели для любых соцсетей — от Instagram до LinkedIn
          </p>

          <div className="pt-2">
            <BillingToggle billing={billing} onChange={setBilling} />
          </div>
        </div>

        {/* Plans */}
        <Plans billing={billing} />

        {/* Photo Mode Credits */}
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-xs text-white/25 uppercase tracking-widest font-semibold">Дополнительно</p>
          </div>
          <PhotoCredits />
          <div className="max-w-3xl mx-auto">
            <CustomSlidePicker variant="dark" />
          </div>
        </div>

        {/* FAQ */}
        <div className="space-y-5">
          <div className="text-center">
            <p className="text-xs text-white/25 uppercase tracking-widest font-semibold">Вопросы</p>
          </div>
          <FAQ />
        </div>

        {/* Bottom CTA */}
        <div className="text-center pt-4">
          <p className="text-sm text-white/30">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-[#D4F542] hover:underline font-medium">
              Войти <ArrowRight className="inline h-3 w-3" />
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
