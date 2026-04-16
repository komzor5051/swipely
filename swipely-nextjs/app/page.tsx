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
    <section className="min-h-screen flex items-center pt-24 sm:pt-32 pb-16 px-6 relative overflow-hidden">
      {/* Ambient background video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ opacity: 0.6 }}
      >
        <source src="/hero-ambient.webm" type="video/webm" />
        <source src="/hero-ambient.mp4" type="video/mp4" />
      </video>
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center w-full relative z-10">
        {/* Left content */}
        <div>
          <span className="section-tag mb-6 inline-block">
            AI-генератор каруселей для соцсетей
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
            От текста к{" "}
            <span className="text-gradient">готовой карусели</span>{" "}
            за 30 секунд
          </h1>

          <p className="text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
            Отправь текст или голосовое — AI создаст дизайнерские слайды для
            ВКонтакте, Instagram и Telegram. 18 шаблонов, автоматические подписи, экспорт в PNG.
          </p>

          <div className="flex flex-wrap gap-4 mb-10">
            <Link href="/signup">
              <Button
                size="lg"
                className="rounded-full px-8 text-base bg-[#D4F542] text-[#0D0D14] hover:bg-[#c8e83a] shadow-[0_4px_24px_rgba(212,245,66,0.3)] hover:shadow-[0_8px_32px_rgba(212,245,66,0.4)] hover:-translate-y-0.5 transition-all"
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
          <div className="flex flex-wrap gap-6 sm:gap-10 pt-6 border-t border-border">
            {[
              { value: "16", label: "шаблонов" },
              { value: "30с", label: "генерация" },
              { value: "0₽", label: "старт" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-[#D4F542] font-[family-name:var(--font-mono)]">
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
              <div className="absolute -top-4 -left-2 w-8 h-8 rounded-full bg-[#D4F542] text-[#0D0D14] text-sm font-bold flex items-center justify-center font-[family-name:var(--font-mono)]">
                {i + 1}
              </div>
              <div className="w-14 h-14 rounded-2xl bg-[#D4F542]/15 flex items-center justify-center text-[#0D0D14] mb-5 group-hover:bg-[#D4F542] group-hover:text-[#0D0D14] transition-colors">
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
              className="text-center p-8 rounded-3xl border border-border hover:border-[#D4F542]/20 hover:shadow-md transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#D4F542]/15 flex items-center justify-center text-[#0D0D14] mx-auto mb-4">
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

        <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {/* Free */}
          <div className="rounded-2xl border border-border p-6 sm:p-8 bg-card flex flex-col">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Бесплатный</h3>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-5xl font-black tracking-tight leading-none" style={{ fontFamily: "var(--font-mono)" }}>0</span>
              <span className="text-xl text-muted-foreground mb-1">₽</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">Навсегда бесплатно</p>
            <ul className="flex-1 space-y-3 mb-8">
              {[
                "3 карусели в месяц",
                "18 шаблонов дизайна",
                "Подпись к посту",
                "PNG экспорт",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-[#0D0D14]" />
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
          <div className="rounded-2xl border-2 border-[#D4F542] p-6 sm:p-8 bg-card relative overflow-hidden flex flex-col">
            <div className="absolute top-4 right-4 bg-[#D4F542] text-[#0D0D14] text-xs font-black px-3 py-1 rounded-full">
              −50%
            </div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">PRO</h3>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-5xl font-black tracking-tight leading-none" style={{ fontFamily: "var(--font-mono)" }}>495</span>
              <span className="text-xl text-muted-foreground mb-1">₽/мес</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              было <span className="line-through">990₽</span> · или 4 950₽/год
            </p>
            <ul className="flex-1 space-y-3 mb-8">
              {[
                "Безлимит карусели в месяц",
                "AI карусель с вашим фото",
                "18 шаблонов дизайна",
                "Без водяного знака",
                "Приоритетная очередь",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-[#0D0D14]" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/signup">
              <Button className="w-full rounded-full bg-[#D4F542] text-[#0D0D14] hover:bg-[#c8e83a] font-bold">
                Попробовать PRO →
              </Button>
            </Link>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link
            href="/pricing"
            className="text-sm text-[#0D0D14] hover:underline font-medium"
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
      q: "Для каких соцсетей подходит Swipely?",
      a: "Для любых: ВКонтакте, Instagram, Telegram-каналы, LinkedIn и других. Доступны квадратный формат (1080×1080) и вертикальный (1080×1350) — оба подходят для всех перечисленных платформ.",
    },
    {
      q: "Как начать пользоваться?",
      a: "Зарегистрируйся, отправь текст на странице генерации — получи готовую карусель за 30 секунд. 3 бесплатных генерации каждый месяц, без привязки карты.",
    },
    {
      q: "Что такое AI карусель с вашим фото?",
      a: "Карусель, где на каждом слайде — ваше фото или персонаж, стилизованное под выбранный жанр (реалистичный или мультяшный). Каждый слайд — уникальное AI-изображение с текстом. Доступно на PRO.",
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
        <Platforms />
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
