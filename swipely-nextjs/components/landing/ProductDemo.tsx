"use client";
import {
  LayoutDashboard,
  Sparkles,
  Clock,
  Layers,
  Gift,
  Settings,
  CreditCard,
  MessageCircle,
  LogOut,
} from "lucide-react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Дашборд", active: true },
  { icon: Sparkles, label: "Создать", active: false },
  { icon: Clock, label: "История", active: false },
  { icon: Layers, label: "Тарифы", active: false },
  { icon: Gift, label: "Пригласи друга", active: false },
  { icon: Settings, label: "Настройки", active: false },
];

const TEMPLATES = [
  { id: "swipely", nameRu: "Swipely" },
  { id: "grid_multi", nameRu: "Мультигрид" },
  { id: "purple_accent", nameRu: "Фиолетовый акцент" },
  { id: "receipt", nameRu: "Чек" },
  { id: "quote_doodle", nameRu: "Цитата-дудл" },
  { id: "chapter", nameRu: "Глава" },
  { id: "frame", nameRu: "Рамка" },
];

export function ProductDemo() {
  return (
    <section className="bg-[#1E1E1E] w-full overflow-visible">
      <ContainerScroll
        titleComponent={
          <div className="mb-4">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#D4F542] border border-[#D4F542]/30 bg-[#D4F542]/10 px-3 py-1 rounded-full mb-5">
              Результат за 20 секунд
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
              12 дизайн-стилей.{" "}
              <span className="text-[#D4F542]">Один клик — и карусель готова.</span>
            </h2>
            <p className="text-white/50 mt-3 text-base md:text-lg">
              ИИ пишет текст, подбирает структуру и форматирует под платформу
            </p>
          </div>
        }
      >
        {/* ─── Full app shell 1:1 ─── */}
        <div className="h-full w-full flex overflow-hidden rounded-2xl">

          {/* ─── Sidebar ─── */}
          <aside className="w-[52px] md:w-[200px] shrink-0 bg-[#1E1E1E] flex flex-col h-full overflow-hidden p-2 md:p-4">

            {/* Logo */}
            <div className="flex items-center gap-2 mb-4 md:mb-6 px-1">
              <div className="w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl bg-white flex items-center justify-center shrink-0 shadow-md">
                <svg viewBox="0 0 32 32" fill="none" width={16} height={16}>
                  <path d="M10 12h12M10 16h12M10 20h8" stroke="#D4F542" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <span className="hidden md:block text-white font-bold text-base">Swipely</span>
            </div>

            {/* Balance card */}
            <div className="hidden md:block rounded-xl bg-[#D4F542] p-3 mb-4">
              <p className="text-[9px] text-[#0D0D14]/60 font-medium mb-0.5">Генерации</p>
              <p className="text-lg font-bold text-[#0D0D14] font-mono leading-none">
                2 <span className="text-xs font-normal text-[#0D0D14]/50">/ 3</span>
              </p>
              <p className="text-[9px] text-[#0D0D14]/50 mt-1">Бесплатный тариф</p>
              <div className="mt-2 w-full bg-[#1E1E1E] text-white text-[9px] font-semibold py-1.5 rounded-full flex items-center justify-center gap-1">
                <CreditCard className="w-2.5 h-2.5" />
                Перейти на PRO
              </div>
            </div>

            {/* Nav items */}
            <nav className="flex-1 flex flex-col gap-0.5">
              {NAV_ITEMS.map(({ icon: Icon, label, active }) => (
                <div
                  key={label}
                  className={`relative flex items-center gap-2.5 px-2 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? "bg-[#D4F542]/15 text-[#D4F542]"
                      : "text-white/40"
                  }`}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#D4F542] rounded-full" />
                  )}
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden md:block">{label}</span>
                </div>
              ))}
            </nav>

            {/* Footer */}
            <div className="pt-2 border-t border-white/10 flex flex-col gap-0.5">
              <div className="hidden md:block px-2 py-1">
                <p className="text-[9px] text-white/40">Вход как:</p>
                <p className="text-[9px] text-white/60 truncate">user@gmail.com</p>
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 text-white/40 cursor-pointer text-[10px]">
                <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:block">Тех. поддержка</span>
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 text-white/40 cursor-pointer text-[10px]">
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:block">Выйти</span>
              </div>
            </div>
          </aside>

          {/* ─── Main content ─── */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

            {/* Top bar */}
            <header
              className="shrink-0 flex items-center justify-end px-3 md:px-5 py-2 border-b border-black/5"
              style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)" }}
            >
              <div className="flex items-center gap-1.5 bg-[#D4F542] text-[#0D0D14] text-[9px] md:text-[11px] font-bold px-2.5 md:px-3 py-1.5 rounded-full cursor-pointer">
                <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3" />
                <span className="hidden md:inline">Создать карусель</span>
              </div>
            </header>

            {/* Page body */}
            <main
              className="flex-1 overflow-hidden p-3 md:p-5 flex flex-col gap-3"
              style={{
                background: "#F5F5EE",
                backgroundImage:
                  "linear-gradient(rgba(0,0,0,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.045) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            >
              {/* Page title */}
              <div>
                <h1 className="text-base md:text-xl font-bold text-[#0D0D14]">Привет!</h1>
                <p className="text-[9px] md:text-xs text-[#0D0D14]/50">Обзор твоего аккаунта Swipely</p>
              </div>

              {/* Template picker card */}
              <div className="flex-1 bg-white/75 backdrop-blur-sm rounded-xl md:rounded-2xl border border-black/5 overflow-hidden flex flex-col p-2 md:p-4">
                {/* Card header */}
                <div className="flex items-center justify-between mb-1 md:mb-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#0D0D14]" />
                    <span className="text-[10px] md:text-sm font-bold text-[#0D0D14]">Создать карусель</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-5 h-5 rounded-full border border-black/10 flex items-center justify-center cursor-pointer">
                      <span className="text-[8px] text-[#0D0D14]/40">‹</span>
                    </div>
                    <div className="w-5 h-5 rounded-full border border-black/10 flex items-center justify-center cursor-pointer">
                      <span className="text-[8px] text-[#0D0D14]/40">›</span>
                    </div>
                  </div>
                </div>
                <p className="text-[8px] md:text-[11px] text-[#0D0D14]/40 mb-2 md:mb-3 shrink-0">
                  Выбери стиль — и получи карусель за 20 секунд
                </p>

                {/* Templates horizontal row */}
                <div
                  className="flex items-start gap-2 overflow-x-auto pb-1"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {TEMPLATES.map((t) => (
                    <div
                      key={t.id}
                      className="shrink-0 w-[52px] md:w-[76px] rounded-lg overflow-hidden border border-black/8 bg-white flex flex-col"
                    >
                      <div className="w-full overflow-hidden" style={{ aspectRatio: "1/1" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/previews/${t.id}.png`}
                          alt={t.nameRu}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="px-1 md:px-1.5 py-1 shrink-0 border-t border-black/5">
                        <p className="text-[6px] md:text-[9px] font-semibold text-[#0D0D14] truncate">{t.nameRu}</p>
                        <p className="text-[5px] md:text-[8px] text-[#0D0D14]/40">Выбрать →</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom CTA */}
                <div className="mt-2 shrink-0">
                  <div className="w-full flex items-center justify-center gap-1.5 py-1.5 md:py-2 rounded-lg md:rounded-xl border border-black/8 bg-black/[0.03] text-[#0D0D14]/25 text-[9px] md:text-[11px] font-semibold cursor-not-allowed">
                    <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3" />
                    Создать карусель
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </ContainerScroll>
    </section>
  );
}
