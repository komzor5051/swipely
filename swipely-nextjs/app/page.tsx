import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { LiveStats } from "@/components/landing/LiveStats";
import { HeroSection } from "@/components/landing/HeroSection";
import { templates } from "@/lib/templates/registry";

export const revalidate = 300; // 5-minute ISR
import {
  MessageSquare,
  Sparkles,
  Download,
  Zap,
  Palette,
  Clock,
  Check,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

/* ─── Hero ─── */
function Hero() {
  return (
    <section className="min-h-screen flex items-center pt-24 sm:pt-32 pb-16 px-6 relative overflow-hidden">
      <div className="gradient-bg" />
      <div className="max-w-7xl mx-auto w-full relative z-10">
        {/* Top heading block */}
        <div className="text-center mb-10">
          <span className="section-tag mb-6 inline-block">
            AI-генератор каруселей для соцсетей
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
            От текста к{" "}
            <span className="text-gradient">готовой карусели</span>{" "}
            за 30 секунд
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Отправь текст или голосовое — AI создаст дизайнерские слайды для
            ВКонтакте, Instagram и Telegram. 18 шаблонов, автоматические подписи, экспорт в PNG.
          </p>
        </div>

        {/* Live generator */}
        <HeroSection />

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-6 sm:gap-14 pt-10 mt-8 border-t border-border">
          {[
            { value: "16", label: "шаблонов" },
            { value: "30с", label: "генерация" },
            { value: "0₽", label: "старт" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold text-[#D4F542] tabular-nums">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Platforms ─── */
function Platforms() {
  const platforms = [
    { name: "ВКонтакте", formats: "1080×1080 · 1080×1350" },
    { name: "Instagram", formats: "1080×1080 · 1080×1350" },
    { name: "Telegram", formats: "1080×1080 · 1080×1350" },
    { name: "LinkedIn", formats: "1080×1080" },
    { name: "Pinterest", formats: "1080×1350" },
    { name: "Facebook", formats: "1080×1080 · 1080×1350" },
  ];

  return (
    <section className="py-10 px-6 border-y border-border">
      <div className="max-w-5xl mx-auto">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
          Карусели для любых соцсетей
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {platforms.map((p) => (
            <div
              key={p.name}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card text-sm"
            >
              <span className="font-semibold">{p.name}</span>
              <span className="text-muted-foreground text-xs">{p.formats}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works ─── */
function HowItWorks() {
  const steps = [
    {
      icon: <MessageSquare className="h-7 w-7" />,
      title: "Отправь текст",
      description:
        "Вставь статью, заметку или любой текст. Можно даже голосовое сообщение.",
    },
    {
      icon: <Sparkles className="h-7 w-7" />,
      title: "AI создаёт карусель",
      description:
        "Gemini AI разбивает текст на слайды, подбирает заголовки и визуальное оформление.",
    },
    {
      icon: <Download className="h-7 w-7" />,
      title: "Скачай и публикуй",
      description:
        "Готовые PNG-слайды с подписью для поста. Выложи в ВКонтакте, Instagram, Telegram или любую другую соцсеть.",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <SectionHeader
          tag="Как это работает"
          title="3 простых шага"
          description="От идеи до готовой карусели за полминуты"
        />

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="relative bg-card rounded-3xl p-8 border border-border hover:border-[#D4F542]/30 hover:shadow-lg transition-all group"
            >
              <div className="absolute -top-4 -left-2 w-8 h-8 rounded-full bg-[#D4F542] text-[#0D0D14] text-sm font-bold flex items-center justify-center tabular-nums">
                {i + 1}
              </div>
              <div className="w-14 h-14 rounded-2xl bg-[#D4F542]/15 flex items-center justify-center text-[#D4F542] mb-5 group-hover:bg-[#D4F542] group-hover:text-[#0D0D14] transition-colors">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Benefits ─── */
function Benefits() {
  const benefits = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "30 секунд",
      description: "Среднее время генерации одной карусели",
    },
    {
      icon: <Palette className="h-6 w-6" />,
      title: "16 шаблонов",
      description: "От минималистичных до ярких и креативных",
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Экономия 5ч/нед",
      description: "Вместо дизайнера и копирайтера — один AI",
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Текст + голос",
      description: "Отправь текст или голосовое сообщение",
    },
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <SectionHeader
          tag="Преимущества"
          title="Почему Swipely"
          description="Всё что нужно для контента в одном инструменте"
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="text-center p-8 rounded-3xl border border-border hover:border-[#D4F542]/20 hover:shadow-md transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#D4F542]/15 flex items-center justify-center text-[#D4F542] mx-auto mb-4">
                {b.icon}
              </div>
              <h3 className="text-lg font-bold mb-2">{b.title}</h3>
              <p className="text-sm text-muted-foreground">{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Templates Gallery ─── */
function TemplatesGallery() {
  return (
    <section id="templates" className="py-24 px-6 bg-muted/50">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          tag="Шаблоны"
          title="16 дизайн-стилей"
          description="Выбери стиль, который подходит твоему бренду"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {templates.map((t) => (
            <div
              key={t.id}
              className="group relative rounded-2xl overflow-hidden border border-border bg-card hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div className="aspect-[4/5] relative bg-muted">
                <Image
                  src={t.preview}
                  alt={t.nameRu}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />
              </div>
              <div className="p-3">
                <h4 className="font-semibold text-sm">{t.nameRu}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t.tags.join(" · ")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing Preview ─── */
const PREVIEW_PLANS = [
  {
    id: "free",
    name: "Бесплатный",
    price: 0,
    sub: "Навсегда бесплатно",
    features: ["3 карусели в месяц", "Базовые шаблоны", "Подпись к посту", "PNG экспорт"],
    popular: false,
  },
  {
    id: "blogger",
    name: "Блогер",
    price: 890,
    sub: "в месяц",
    features: ["25 каруселей в месяц", "Все базовые шаблоны", "Подпись к посту", "PNG экспорт"],
    popular: false,
  },
  {
    id: "creator",
    name: "Про",
    price: 1990,
    sub: "в месяц",
    features: ["100 каруселей в месяц", "Все шаблоны", "Без водяного знака", "PNG экспорт"],
    popular: true,
  },
  {
    id: "agency",
    name: "Агентство",
    price: null,
    sub: "по запросу",
    features: ["Безлимит для команды", "Белый лейбл", "API доступ", "SLA поддержка"],
    popular: false,
  },
];

function PricingPreview() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <SectionHeader
          tag="Тарифы"
          title="Простое ценообразование"
          description="Начни бесплатно, переходи на нужный тариф когда будешь готов"
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {PREVIEW_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl p-5 flex flex-col relative ${
                plan.popular
                  ? "border-2 border-[#D4F542] bg-[#D4F542]/5"
                  : "border border-border bg-card"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#D4F542] text-[#0D0D14] text-[10px] font-black px-3 py-1 rounded-full whitespace-nowrap">
                  Популярный
                </div>
              )}
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">{plan.name}</p>
              <div className="mb-1">
                {plan.price === null ? (
                  <span className="text-3xl font-black tracking-tight">—</span>
                ) : plan.price === 0 ? (
                  <span className="text-3xl font-black tracking-tight">0₽</span>
                ) : (
                  <span className="text-3xl font-black tracking-tight">{plan.price}₽</span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mb-4">{plan.sub}</p>
              <ul className="flex-1 space-y-2 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-foreground/80">
                    <Check className="h-3.5 w-3.5 text-[#D4F542] mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {plan.id === "agency" ? (
                <a href="https://t.me/lvmn_ai" target="_blank" rel="noopener noreferrer" className="block">
                  <Button size="sm" className="w-full rounded-full text-xs bg-transparent border border-border hover:bg-white/5 text-foreground">
                    Написать →
                  </Button>
                </a>
              ) : (
                <Link href={plan.price === 0 ? "/signup" : "/pricing"}>
                  <Button
                    size="sm"
                    className={`w-full rounded-full text-xs ${
                      plan.popular
                        ? "bg-[#D4F542] text-[#0D0D14] hover:bg-[#c8e83a] font-bold"
                        : "bg-transparent border border-border hover:bg-white/5 text-foreground"
                    }`}
                  >
                    {plan.price === 0 ? "Начать бесплатно" : "Выбрать →"}
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Сравнить все тарифы подробно →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
function FAQ() {
  const faqs = [
    {
      q: "Для каких соцсетей подходит Swipely?",
      a: "Для любых: ВКонтакте, Instagram, Telegram-каналы, LinkedIn и других. Доступны квадратный формат (1080×1080) и вертикальный (1080×1350) — оба подходят для всех перечисленных платформ.",
    },
    {
      q: "Как начать пользоваться?",
      a: "Зарегистрируйся, отправь текст на странице генерации — получи готовую карусель за 30 секунд. 3 бесплатных генерации каждый месяц, без привязки карты.",
    },
    {
      q: "Можно ли редактировать карусель?",
      a: "Да. После генерации открывается редактор: меняй текст, шрифт, цвет, позицию элементов — и скачивай результат в PNG.",
    },
  ];

  return (
    <section className="py-24 px-6 bg-muted/50">
      <div className="max-w-3xl mx-auto">
        <SectionHeader tag="FAQ" title="Частые вопросы" />

        <div className="space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-2xl border border-border bg-card overflow-hidden"
            >
              <summary className="flex items-center justify-between p-6 cursor-pointer font-semibold text-base hover:text-[#D4F542] transition-colors">
                {faq.q}
                <ChevronDown className="h-5 w-5 text-muted-foreground group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-6 pb-6 text-muted-foreground text-sm leading-relaxed">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ─── */
function CTA() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">
          Готов создать первую <span className="text-gradient">карусель</span>?
        </h2>
        <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
          Бесплатный старт. 3 карусели каждый месяц. Без привязки карты.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/signup">
            <Button
              size="lg"
              className="rounded-full px-10 text-base bg-[#D4F542] text-[#0D0D14] hover:bg-[#c8e83a] shadow-[0_4px_24px_rgba(212,245,66,0.3)]"
            >
              Начать бесплатно
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>

        </div>
      </div>
    </section>
  );
}

/* ─── Page ─── */
export default function Home() {
  return (
    <>
      <div className="gradient-bg" />
      <Navbar />
      <main>
        <Hero />
        <Platforms />
        <HowItWorks />
        <Benefits />
        <TemplatesGallery />
        <Suspense fallback={<div className="py-20" />}>
          <LiveStats />
        </Suspense>
        <PricingPreview />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
