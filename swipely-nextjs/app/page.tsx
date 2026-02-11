import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { templates } from "@/lib/templates/registry";
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
  Send,
} from "lucide-react";

/* ─── Hero ─── */
function Hero() {
  return (
    <section className="min-h-screen flex items-center pt-32 pb-16 px-6 relative">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center w-full">
        {/* Left content */}
        <div>
          <span className="section-tag mb-6 inline-block">
            AI-генератор каруселей
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
            От текста к{" "}
            <span className="text-gradient">готовой карусели</span>{" "}
            за 30 секунд
          </h1>

          <p className="text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
            Отправь текст или голосовое — AI создаст дизайнерские слайды для
            Instagram. 16 шаблонов, автоматические подписи, экспорт в PNG.
          </p>

          <div className="flex flex-wrap gap-4 mb-10">
            <Link href="/signup">
              <Button
                size="lg"
                className="rounded-full px-8 text-base bg-[var(--swipely-blue)] hover:bg-[var(--swipely-blue-dark)] shadow-[0_4px_24px_rgba(10,132,255,0.4)] hover:shadow-[0_8px_32px_rgba(10,132,255,0.5)] hover:-translate-y-0.5 transition-all"
              >
                Начать бесплатно
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 text-base"
              >
                Как это работает
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex gap-10 pt-6 border-t border-border">
            {[
              { value: "16", label: "шаблонов" },
              { value: "30с", label: "генерация" },
              { value: "0₽", label: "старт" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-[var(--swipely-blue)] font-[family-name:var(--font-mono)]">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right visual — 3D carousel stack */}
        <div className="relative hidden md:flex items-center justify-center">
          <div className="relative w-full h-[500px] flex items-center justify-center group">
            {/* Card 1 (left) */}
            <div className="absolute w-[260px] h-[325px] rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 -rotate-12 -translate-x-14 group-hover:-rotate-[18deg] group-hover:-translate-x-24 group-hover:translate-y-5 z-[1]">
              <div className="w-full h-full bg-gradient-to-br from-[#0A84FF] to-[#0066CC] flex flex-col justify-center p-6 text-white">
                <div className="text-xs font-mono opacity-60 mb-3">01 / 05</div>
                <div className="text-xl font-extrabold leading-tight mb-3">
                  <span className="bg-[#D4F542] text-[#0066CC] px-2 py-0.5 inline-block">5 способов</span><br />
                  привлечь клиентов
                </div>
                <div className="text-sm opacity-70">
                  Проверенные стратегии для роста
                </div>
              </div>
            </div>

            {/* Card 2 (center) */}
            <div className="absolute w-[260px] h-[325px] rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 -translate-y-5 group-hover:-translate-y-10 group-hover:scale-105 z-[2]">
              <div className="w-full h-full bg-[#1A1A2E] flex flex-col justify-center p-6 text-white relative">
                <div className="absolute top-4 right-4 flex flex-col gap-1.5">
                  <div className="w-12 h-1.5 bg-[#D4F542] rounded-full -rotate-[25deg]" />
                  <div className="w-9 h-1.5 bg-[#D4F542] rounded-full -rotate-[25deg] opacity-70" />
                  <div className="w-6 h-1.5 bg-[#D4F542] rounded-full -rotate-[25deg] opacity-40" />
                </div>
                <div className="text-xs font-mono text-white/50 mb-3">02 / 05</div>
                <div className="text-xl font-extrabold leading-tight mb-3">
                  Создай <span className="bg-[#F9A8D4] text-[#1A1A2E] px-2 py-0.5">контент</span>,<br />
                  который цепляет
                </div>
                <div className="text-sm text-white/60">
                  AI сделает тексты за вас
                </div>
              </div>
            </div>

            {/* Card 3 (right) */}
            <div className="absolute w-[260px] h-[325px] rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 rotate-12 translate-x-14 group-hover:rotate-[18deg] group-hover:translate-x-24 group-hover:translate-y-5 z-[1]">
              <div className="w-full h-full bg-gradient-to-br from-[#F0F4F8] to-white flex flex-col justify-center p-6 relative">
                <div className="text-xs font-mono text-gray-400 mb-3">03 / 05</div>
                <div className="text-xl font-extrabold leading-tight text-[#1A1A2E] mb-3">
                  Экономьте<br />
                  <span className="text-gradient">до 5 часов</span> в неделю
                </div>
                <div className="text-sm text-gray-500">
                  Автоматизация вместо рутины
                </div>
              </div>
            </div>
          </div>
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
        "Готовые PNG-слайды с подписью для поста. Скачай и выложи в Instagram.",
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
              className="relative bg-card rounded-3xl p-8 border border-border hover:border-[var(--swipely-blue)]/30 hover:shadow-lg transition-all group"
            >
              <div className="absolute -top-4 -left-2 w-8 h-8 rounded-full bg-[var(--swipely-blue)] text-white text-sm font-bold flex items-center justify-center font-[family-name:var(--font-mono)]">
                {i + 1}
              </div>
              <div className="w-14 h-14 rounded-2xl bg-[var(--swipely-blue)]/10 flex items-center justify-center text-[var(--swipely-blue)] mb-5 group-hover:bg-[var(--swipely-blue)] group-hover:text-white transition-colors">
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

/* ─── Demo Section ─── */
function Demo() {
  return (
    <section className="py-24 px-6 bg-[var(--swipely-charcoal)]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="section-tag mb-4 inline-block !bg-white/10 !border-white/20 !text-white">
            Демо
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mt-4">
            Попробуй прямо сейчас
          </h2>
          <p className="text-lg text-white/60 mt-4 max-w-xl mx-auto">
            Вот так выглядит работа с ботом
          </p>
        </div>

        <div className="max-w-md mx-auto">
          {/* Chat messages */}
          <div className="space-y-4">
            {/* User message */}
            <div className="flex justify-end">
              <div className="bg-[var(--swipely-blue)] text-white rounded-2xl rounded-br-md px-5 py-3 max-w-[80%] text-sm">
                Напиши карусель про 5 способов привлечь клиентов через контент
              </div>
            </div>

            {/* Bot response */}
            <div className="flex justify-start">
              <div className="bg-white/10 text-white rounded-2xl rounded-bl-md px-5 py-3 max-w-[80%] text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-[var(--swipely-lime)]" />
                  <span className="font-semibold text-[var(--swipely-lime)]">
                    Карусель готова!
                  </span>
                </div>
                5 слайдов в стиле «Swipely»
                <br />
                <span className="text-white/50">+ подпись для поста</span>
              </div>
            </div>

            {/* Result preview */}
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 max-w-[90%]">
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className="aspect-[4/5] rounded-lg bg-gradient-to-br from-[var(--swipely-blue)] to-[var(--swipely-blue-dark)] flex items-center justify-center"
                    >
                      <span className="text-white/60 text-xs font-mono">
                        {n}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <div className="flex-1 bg-[var(--swipely-blue)] text-white text-xs rounded-full py-2 text-center font-medium">
                    Скачать ZIP
                  </div>
                  <div className="flex-1 bg-white/10 text-white text-xs rounded-full py-2 text-center font-medium">
                    Редактировать
                  </div>
                </div>
              </div>
            </div>
          </div>
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
              className="text-center p-8 rounded-3xl border border-border hover:border-[var(--swipely-blue)]/20 hover:shadow-md transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-[var(--swipely-blue)]/10 flex items-center justify-center text-[var(--swipely-blue)] mx-auto mb-4">
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
function PricingPreview() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <SectionHeader
          tag="Тарифы"
          title="Простое ценообразование"
          description="Начни бесплатно, переходи на PRO когда будешь готов"
        />

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free */}
          <div className="rounded-3xl border border-border p-8 bg-card">
            <h3 className="text-xl font-bold mb-1">Бесплатный</h3>
            <p className="text-sm text-muted-foreground mb-6">Для старта</p>
            <div className="text-4xl font-extrabold mb-6">
              0<span className="text-lg text-muted-foreground font-normal">₽</span>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                "3 карусели в месяц",
                "16 шаблонов",
                "Подпись к посту",
                "PNG экспорт",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-[var(--swipely-blue)]" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/signup">
              <Button variant="outline" className="w-full rounded-full">
                Начать бесплатно
              </Button>
            </Link>
          </div>

          {/* PRO */}
          <div className="rounded-3xl border-2 border-[var(--swipely-blue)] p-8 bg-card relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[var(--swipely-blue)] text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl">
              PRO
            </div>
            <h3 className="text-xl font-bold mb-1">PRO</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Для профессионалов
            </p>
            <div className="text-4xl font-extrabold mb-1">
              990
              <span className="text-lg text-muted-foreground font-normal">
                ₽/мес
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-6">
              или 9 900₽/год (2 мес бесплатно)
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "Безлимит Standard",
                "Photo Mode (20% скидка)",
                "Приоритетная очередь",
                "Без водяного знака",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-[var(--swipely-blue)]" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/signup">
              <Button className="w-full rounded-full bg-[var(--swipely-blue)] hover:bg-[var(--swipely-blue-dark)]">
                Попробовать PRO
              </Button>
            </Link>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link
            href="/pricing"
            className="text-sm text-[var(--swipely-blue)] hover:underline font-medium"
          >
            Все тарифы и пакеты слайдов →
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
      q: "Как начать пользоваться?",
      a: "Зарегистрируйся, отправь текст на странице генерации — получи готовую карусель за 30 секунд. 3 бесплатных генерации каждый месяц.",
    },
    {
      q: "Какие форматы поддерживаются?",
      a: "Квадратный (1080×1080) и вертикальный (1080×1350). Экспорт в PNG с качеством 2x.",
    },
    {
      q: "Что такое Photo Mode?",
      a: "Режим с AI-генерацией фото-слайдов. Каждый слайд — уникальное изображение с текстом. Оплата за карусель или пакетами слайдов.",
    },
    {
      q: "Можно ли редактировать карусель?",
      a: "Да! После генерации можно открыть карусель в редакторе, изменить текст, переставить элементы и скачать результат.",
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
              <summary className="flex items-center justify-between p-6 cursor-pointer font-semibold text-base hover:text-[var(--swipely-blue)] transition-colors">
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
              className="rounded-full px-10 text-base bg-[var(--swipely-blue)] hover:bg-[var(--swipely-blue-dark)] shadow-[0_4px_24px_rgba(10,132,255,0.4)]"
            >
              Начать бесплатно
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="https://t.me/swipelybot" target="_blank">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-10 text-base"
            >
              <Send className="mr-2 h-4 w-4" />
              Telegram-бот
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
        <HowItWorks />
        <Demo />
        <Benefits />
        <TemplatesGallery />
        <PricingPreview />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
