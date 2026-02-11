import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { SectionHeader } from "@/components/shared/SectionHeader";
import {
  Check,
  X,
  ChevronDown,
  Sparkles,
  Image as ImageIcon,
  Package,
} from "lucide-react";

/* ─── Main Plans ─── */
function MainPlans() {
  return (
    <section className="pt-32 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        <SectionHeader
          tag="Тарифы"
          title="Простое ценообразование"
          description="Начни бесплатно — переходи на PRO когда будешь готов"
        />

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free */}
          <div className="rounded-3xl border border-border p-8 bg-card">
            <h3 className="text-2xl font-bold mb-1">Бесплатный</h3>
            <p className="text-sm text-muted-foreground mb-8">Для старта</p>
            <div className="text-5xl font-extrabold mb-8">
              0<span className="text-xl text-muted-foreground font-normal">₽</span>
            </div>

            <ul className="space-y-4 mb-10">
              {[
                { text: "3 карусели в месяц", ok: true },
                { text: "16 шаблонов", ok: true },
                { text: "Подпись к посту", ok: true },
                { text: "PNG экспорт", ok: true },
                { text: "Photo Mode", ok: false },
                { text: "Приоритетная очередь", ok: false },
                { text: "Без водяного знака", ok: false },
              ].map((f) => (
                <li key={f.text} className="flex items-center gap-3 text-sm">
                  {f.ok ? (
                    <Check className="h-4 w-4 text-[var(--swipely-blue)] shrink-0" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  )}
                  <span className={f.ok ? "" : "text-muted-foreground/60"}>
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>

            <Link href="/signup">
              <Button variant="outline" className="w-full rounded-full" size="lg">
                Начать бесплатно
              </Button>
            </Link>
          </div>

          {/* PRO */}
          <div className="rounded-3xl border-2 border-[var(--swipely-blue)] p-8 bg-card relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[var(--swipely-blue)] text-white text-xs font-bold px-5 py-2 rounded-bl-2xl">
              Популярный
            </div>

            <h3 className="text-2xl font-bold mb-1">PRO</h3>
            <p className="text-sm text-muted-foreground mb-8">
              Для профессионалов
            </p>

            {/* Price toggle */}
            <div className="mb-2">
              <div className="text-5xl font-extrabold">
                990
                <span className="text-xl text-muted-foreground font-normal">
                  ₽/мес
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                или <span className="font-semibold text-foreground">9 900₽/год</span>{" "}
                <span className="text-[var(--swipely-blue)] font-medium">
                  (−17%, 2 мес бесплатно)
                </span>
              </p>
            </div>

            <div className="h-px bg-border my-8" />

            <ul className="space-y-4 mb-10">
              {[
                "Безлимит Standard генераций",
                "Photo Mode (20% скидка)",
                "16 шаблонов",
                "Подпись к посту",
                "PNG экспорт",
                "Приоритетная очередь",
                "Без водяного знака",
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 text-[var(--swipely-blue)] shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <Link href="/signup">
              <Button
                className="w-full rounded-full bg-[var(--swipely-blue)] hover:bg-[var(--swipely-blue-dark)]"
                size="lg"
              >
                Попробовать PRO
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Photo Mode Pricing ─── */
function PhotoModePricing() {
  const tiers = [
    { slides: 3, free: 149, pro: 119 },
    { slides: 5, free: 249, pro: 199 },
    { slides: 7, free: 349, pro: 279 },
  ];

  return (
    <section className="py-16 px-6 bg-muted/50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 section-tag mb-4">
            <ImageIcon className="h-4 w-4" />
            Photo Mode
          </div>
          <h2 className="text-3xl font-bold mt-4">AI-фото карусели</h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            Каждый слайд — уникальное AI-изображение. Оплата за карусель.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
          {tiers.map((t) => (
            <div
              key={t.slides}
              className="rounded-2xl border border-border bg-card p-6 text-center"
            >
              <div className="text-3xl font-extrabold text-[var(--swipely-blue)] font-[family-name:var(--font-mono)]">
                {t.slides}
              </div>
              <div className="text-sm text-muted-foreground mb-4">слайдов</div>
              <div className="text-2xl font-bold mb-1">{t.free}₽</div>
              <div className="text-xs text-muted-foreground">
                PRO: <span className="text-[var(--swipely-blue)]">{t.pro}₽</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Slide Packs ─── */
function SlidePacks() {
  const packs = [
    { name: "15 слайдов", slides: 15, price: 490, perSlide: "~33₽", savings: "10%" },
    { name: "50 слайдов", slides: 50, price: 1490, perSlide: "~30₽", savings: "20%", popular: true },
    { name: "150 слайдов", slides: 150, price: 3990, perSlide: "~27₽", savings: "30%" },
  ];

  return (
    <section className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 section-tag mb-4">
            <Package className="h-4 w-4" />
            Пакеты слайдов
          </div>
          <h2 className="text-3xl font-bold mt-4">
            Предоплаченные пакеты Photo Mode
          </h2>
          <p className="text-muted-foreground mt-3">
            Чем больше пакет — тем дешевле каждый слайд
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {packs.map((p) => (
            <div
              key={p.slides}
              className={`rounded-2xl p-6 text-center relative ${
                p.popular
                  ? "border-2 border-[var(--swipely-blue)] bg-card"
                  : "border border-border bg-card"
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--swipely-blue)] text-white text-xs font-bold px-3 py-1 rounded-full">
                  Выгодный
                </div>
              )}
              <div className="text-lg font-bold mb-1">{p.name}</div>
              <div className="text-3xl font-extrabold mb-1">
                {p.price.toLocaleString("ru-RU")}₽
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                {p.perSlide}/слайд
              </div>
              <div className="inline-block bg-[var(--swipely-lime)] text-[var(--swipely-charcoal)] text-xs font-bold px-3 py-1 rounded-full">
                −{p.savings}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Поштучная докупка: <span className="font-semibold">49₽/слайд</span>{" "}
          (Free) или <span className="font-semibold">39₽/слайд</span> (PRO)
        </p>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
function PricingFAQ() {
  const faqs = [
    {
      q: "Что входит в бесплатный тариф?",
      a: "3 карусели Standard Mode каждый месяц. Все 16 шаблонов доступны. Подпись к посту генерируется автоматически.",
    },
    {
      q: "Чем PRO отличается от бесплатного?",
      a: "Безлимитные генерации Standard Mode, доступ к Photo Mode со скидкой 20%, приоритетная очередь, без водяного знака на слайдах.",
    },
    {
      q: "Как работает Photo Mode?",
      a: "AI генерирует уникальные фото-слайды вместо текстовых шаблонов. Каждый слайд — AI-изображение. Стили: cartoon (Pixar/Disney), realistic (фотореализм).",
    },
    {
      q: "Можно ли оплатить Telegram Stars?",
      a: "Да, все платежи доступны через Telegram Stars. Курс: примерно 0.693 Stars за 1₽.",
    },
    {
      q: "Есть ли годовая подписка?",
      a: "Да! PRO на год стоит 9 900₽ — это 825₽/мес, экономия 17% (2 месяца бесплатно).",
    },
  ];

  return (
    <section className="py-16 px-6 bg-muted/50">
      <div className="max-w-3xl mx-auto">
        <SectionHeader tag="FAQ" title="Вопросы о тарифах" />

        <div className="space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-2xl border border-border bg-card overflow-hidden"
            >
              <summary className="flex items-center justify-between p-6 cursor-pointer font-semibold text-sm hover:text-[var(--swipely-blue)] transition-colors">
                {faq.q}
                <ChevronDown className="h-5 w-5 text-muted-foreground group-open:rotate-180 transition-transform shrink-0 ml-4" />
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

export default function PricingPage() {
  return (
    <>
      <div className="gradient-bg" />
      <Navbar />
      <main>
        <MainPlans />
        <PhotoModePricing />
        <SlidePacks />
        <PricingFAQ />
      </main>
      <Footer />
    </>
  );
}
