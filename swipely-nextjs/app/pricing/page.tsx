"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { Check, Zap, ArrowRight, ChevronDown, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProButton } from "./ProButton";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import NumberFlow from "@number-flow/react";

// ─── Data ───

const FAQS = [
  {
    q: "Чем отличаются тарифы?",
    a: "Блогер — 25 каруселей/мес и базовые шаблоны. Про — 100 каруселей и все премиальные шаблоны без ограничений.",
  },
  {
    q: "Можно ли отменить подписку?",
    a: "Да. Подписка действует до конца оплаченного периода. Автоматического продления нет.",
  },
];

const PLANS = [
  {
    id: "free",
    name: "Бесплатный",
    tier: "free",
    monthly: 0,
    yearly: 0,
    limit: "3 карусели / мес",
    productMonthly: null as string | null,
    productYearly: null as string | null,
    features: ["3 карусели в месяц", "Базовые шаблоны", "Подпись к посту", "PNG экспорт"],
  },
  {
    id: "blogger",
    name: "Блогер",
    tier: "start",
    monthly: 890,
    yearly: 712,
    limit: "25 каруселей / мес",
    productMonthly: "blogger_monthly",
    productYearly: "blogger_yearly",
    features: ["25 каруселей в месяц", "Все базовые шаблоны", "Подпись к посту", "PNG экспорт"],
  },
  {
    id: "creator",
    name: "Про",
    tier: "creator",
    monthly: 1990,
    yearly: 1592,
    limit: "100 каруселей / мес",
    productMonthly: "creator_monthly",
    productYearly: "creator_yearly",
    popular: true,
    features: ["100 каруселей в месяц", "Все шаблоны включая премиальные", "Без водяного знака", "Подпись к посту", "PNG экспорт"],
  },
];

// ─── Billing Toggle ───

function BillingToggle({ billing, onChange }: { billing: "monthly" | "yearly"; onChange: (b: "monthly" | "yearly") => void }) {
  const switchRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    const next = billing === "monthly" ? "yearly" : "monthly";
    onChange(next);
    if (next === "yearly" && switchRef.current) {
      const rect = switchRef.current.getBoundingClientRect();
      confetti({
        particleCount: 40,
        spread: 55,
        origin: {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        },
        colors: ["#D4F542", "#0D0D14", "#a3e635"],
        ticks: 150,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 25,
        shapes: ["circle"],
      });
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className={cn("text-sm font-medium", billing === "monthly" ? "text-white" : "text-white/40")}>
        По месяцам
      </span>
      <button
        ref={switchRef}
        onClick={handleToggle}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none",
          billing === "yearly" ? "bg-[#D4F542]" : "bg-white/20"
        )}
      >
        <span className={cn(
          "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200",
          billing === "yearly" ? "translate-x-5" : "translate-x-0"
        )} />
      </button>
      <span className={cn("text-sm font-medium flex items-center gap-1.5", billing === "yearly" ? "text-white" : "text-white/40")}>
        За год
        <span className="text-[10px] font-bold bg-[#D4F542] text-[#0D0D14] px-1.5 py-0.5 rounded-full">−20%</span>
      </span>
    </div>
  );
}

// ─── Plans ───

function Plans({ billing }: { billing: "monthly" | "yearly" }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-5xl mx-auto">
      {PLANS.map((plan) => {
        const price = billing === "yearly" ? plan.yearly : plan.monthly;
        const productId = billing === "yearly" ? plan.productYearly : plan.productMonthly;

        return (
          <div
            key={plan.id}
            className={cn(
              "relative rounded-2xl p-5 flex flex-col",
              plan.popular
                ? "border-2 border-[#D4F542]/50 bg-[#D4F542]/5 backdrop-blur-sm"
                : "border border-white/10 bg-white/4 backdrop-blur-sm"
            )}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#D4F542] text-[#0D0D14] text-[10px] font-black px-3 py-1 rounded-full whitespace-nowrap">
                Популярный
              </div>
            )}

            <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-3">{plan.name}</p>

            <div className="mb-1">
              {price === 0 ? (
                <span className="text-4xl font-black text-white tracking-tight">0₽</span>
              ) : (
                <span className="text-4xl font-black text-white tracking-tight">
                  <NumberFlow
                    value={price}
                    format={{ style: "decimal", minimumFractionDigits: 0, maximumFractionDigits: 0 }}
                    transformTiming={{ duration: 400, easing: "ease-out" }}
                    willChange
                  />₽
                </span>
              )}
            </div>
            <p className="text-[11px] text-white/30 mb-0.5">
              {price === 0 ? "навсегда" : billing === "monthly" ? "в месяц" : "в месяц · при оплате за год"}
            </p>

            <p className="text-[11px] font-semibold text-white/50 mb-4 mt-1">{plan.limit}</p>

            <ul className="flex-1 space-y-2 mb-5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-white/50 mt-0.5 shrink-0" />
                  <span className="text-[11px] text-white/60 leading-tight">{f}</span>
                </li>
              ))}
            </ul>

            {productId ? (
              <ProButton
                productId={productId}
                label={price === 0 ? "Начать бесплатно" : `Перейти · ${price.toLocaleString("ru-RU")}₽`}
                className={cn(
                  "w-full rounded-xl text-xs font-semibold border-0 h-9",
                  plan.popular
                    ? "bg-[#D4F542] hover:bg-[#c8e83a] text-[#0D0D14]"
                    : "bg-white/10 hover:bg-white/18 text-white"
                )}
              />
            ) : (
              <Link href="/signup" className="block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full rounded-xl text-xs font-semibold bg-white/8 hover:bg-white/14 text-white/70 h-9 border-0"
                >
                  Начать бесплатно
                </Button>
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── FAQ ───

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="max-w-2xl mx-auto space-y-2">
      {FAQS.map((faq, i) => (
        <div key={i} className="rounded-xl border border-white/8 bg-white/4 overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-white/75 hover:text-white transition-colors"
          >
            {faq.q}
            <ChevronDown className={cn("h-4 w-4 text-white/30 transition-transform duration-200 shrink-0 ml-4", open === i && "rotate-180")} />
          </button>
          {open === i && (
            <div className="px-5 pb-4 text-sm text-white/40 leading-relaxed">{faq.a}</div>
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
    <div className="min-h-screen bg-[#1E1E1E] text-white">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full bg-[#D4F542]/4 blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-[#0A84FF]/5 blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 w-[500px] h-[300px] rounded-full bg-[#D4F542]/3 blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-4 sm:px-8 py-5 border-b border-white/6">
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
      <main className="relative z-10 px-4 sm:px-6 pt-16 pb-20 space-y-10">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#D4F542]/10 border border-[#D4F542]/20 text-[#D4F542] text-xs font-semibold px-3 py-1.5 rounded-full">
            <Zap className="h-3 w-3" />
            Тарифы Swipely
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight">
            Начни за 0₽.{" "}
            <span className="text-[#D4F542]">Расти без лимитов.</span>
          </h1>
          <p className="text-lg text-white/40 max-w-md mx-auto">
            AI-карусели для любых соцсетей — от Instagram до LinkedIn
          </p>

          <div className="pt-2 flex justify-center">
            <BillingToggle billing={billing} onChange={setBilling} />
          </div>
        </div>

        {/* Plans */}
        <Plans billing={billing} />

        {/* Agentstvo */}
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-white/8 bg-white/4 p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-white/50" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Агентство</p>
              <p className="text-xs text-white/35 mt-0.5">Безлимит для команды, белый лейбл, API доступ, SLA</p>
            </div>
            <a
              href="https://t.me/lvmn_ai"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-xl px-4 py-2 text-xs font-semibold bg-white text-[#0D0D14] hover:bg-white/90 transition-colors"
            >
              Написать
            </a>
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
