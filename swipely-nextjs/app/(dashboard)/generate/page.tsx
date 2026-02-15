"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { templates } from "@/lib/templates/registry";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  RotateCcw,
  Copy,
  Pencil,
} from "lucide-react";
import SlideRenderer from "@/components/slides/SlideRenderer";
import ExportPanel from "@/components/generate/ExportPanel";
import CarouselEditor from "@/components/generate/CarouselEditor";
import {
  FadeIn,
  StaggerList,
  StaggerItem,
  PageTransition,
  AnimatePresence,
  motion,
} from "@/components/ui/motion";
import { toast } from "sonner";

type Step = "input" | "template" | "settings" | "generating" | "result";

interface Slide {
  type: string;
  title: string;
  content: string;
}

interface CarouselResult {
  slides: Slide[];
  post_caption: string;
}

const SLIDE_COUNTS = [3, 5, 7];
const FORMATS = [
  { id: "square", label: "Квадрат", size: "1080×1080" },
  { id: "portrait", label: "Вертикаль", size: "1080×1350" },
];
const TONES = [
  { id: "educational", label: "Обучающий", emoji: "📚" },
  { id: "entertaining", label: "Развлекательный", emoji: "🎭" },
  { id: "provocative", label: "Провокационный", emoji: "🔥" },
  { id: "motivational", label: "Мотивационный", emoji: "💪" },
];

const STEPS = ["input", "template", "settings"] as const;

export default function GeneratePage() {
  const [step, setStep] = useState<Step>("input");
  const [text, setText] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("swipely");
  const [slideCount, setSlideCount] = useState(5);
  const [format, setFormat] = useState("portrait");
  const [tone, setTone] = useState("educational");
  const [result, setResult] = useState<CarouselResult | null>(null);
  const [error, setError] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [editing, setEditing] = useState(false);

  const handleGenerate = async () => {
    setStep("generating");
    setError("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          template: selectedTemplate,
          slideCount,
          format,
          tone,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Ошибка сервера" }));
        throw new Error(data.error || "Ошибка генерации");
      }

      const data: CarouselResult = await res.json();
      setResult(data);
      setCurrentSlide(0);
      setStep("result");
      toast.success("Карусель создана!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Произошла ошибка";
      setError(message);
      toast.error(message);
      setStep("settings");
    }
  };

  const handleReset = () => {
    setStep("input");
    setText("");
    setResult(null);
    setError("");
    setCurrentSlide(0);
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const copyCaption = () => {
    if (result?.post_caption) {
      navigator.clipboard.writeText(result.post_caption);
      toast.success("Подпись скопирована");
    }
  };

  const updateSlide = (index: number, field: "title" | "content", value: string) => {
    if (!result) return;
    setResult({
      ...result,
      slides: result.slides.map((s, i) =>
        i === index ? { ...s, [field]: value } : s
      ),
    });
  };

  const updateCaption = (value: string) => {
    if (!result) return;
    setResult({ ...result, post_caption: value });
  };

  /* ─── Full-screen editor overlay ─── */
  if (editing && result) {
    return (
      <CarouselEditor
        slides={result.slides}
        template={selectedTemplate}
        format={format as "square" | "portrait"}
        postCaption={result.post_caption}
        onUpdateSlide={updateSlide}
        onUpdateCaption={updateCaption}
        onClose={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step indicator */}
      {step !== "generating" && (
        <FadeIn className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => {
            const isResult = step === "result";
            const stepIdx = STEPS.indexOf(step as typeof STEPS[number]);
            const isPast = stepIdx > i || isResult;
            const isCurrent = step === s;
            return (
              <div key={s} className="flex items-center gap-2">
                <div className="relative">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-[family-name:var(--font-mono)] transition-all duration-300 ${
                      isCurrent || isResult
                        ? "bg-[var(--swipely-blue)] text-white shadow-md shadow-[var(--swipely-blue)]/30"
                        : isPast
                          ? "bg-[var(--swipely-blue)]/20 text-[var(--swipely-blue)]"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isPast ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                </div>
                {i < 2 && (
                  <div
                    className={`w-12 h-0.5 transition-colors duration-500 ${
                      isPast
                        ? "bg-[var(--swipely-blue)]/30"
                        : "bg-muted"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </FadeIn>
      )}

      <AnimatePresence mode="wait">
        {/* ─── Step: Input ─── */}
        {step === "input" && (
          <PageTransition id="input" className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">Создать карусель</h1>
              <p className="text-muted-foreground">
                Введи текст, идею или тему — AI создаст готовую карусель
              </p>
            </div>

            <div className="space-y-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Например: 5 способов привлечь клиентов через контент-маркетинг&#10;&#10;Или вставь готовый текст, статью, заметку — AI адаптирует под формат карусели..."
                className="w-full h-48 rounded-2xl border border-border bg-card p-5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--swipely-blue)]/50 focus:border-[var(--swipely-blue)] placeholder:text-muted-foreground/60 transition-all"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {text.length} символов
                </p>
              </div>
            </div>

            <Button
              onClick={() => setStep("template")}
              disabled={text.trim().length < 10}
              className="rounded-full px-8 bg-[var(--swipely-blue)] hover:bg-[var(--swipely-blue-dark)] active:scale-[0.98] transition-all shadow-sm"
            >
              Далее: выбор стиля
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </PageTransition>
        )}

        {/* ─── Step: Template ─── */}
        {step === "template" && (
          <PageTransition id="template" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">Выбери стиль</h1>
                <p className="text-muted-foreground">
                  16 дизайн-шаблонов на любой вкус
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("input")}
                className="hover:bg-muted"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Назад
              </Button>
            </div>

            <StaggerList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {templates.map((t) => (
                <StaggerItem key={t.id}>
                  <button
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`relative rounded-2xl overflow-hidden border-2 transition-all text-left w-full hover:shadow-md ${
                      selectedTemplate === t.id
                        ? "border-[var(--swipely-blue)] shadow-lg shadow-[var(--swipely-blue)]/20"
                        : "border-border hover:border-[var(--swipely-blue)]/30"
                    }`}
                  >
                    {selectedTemplate === t.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-[var(--swipely-blue)] text-white flex items-center justify-center"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </motion.div>
                    )}
                    <div className="aspect-[4/5] relative bg-muted">
                      <Image
                        src={t.preview}
                        alt={t.nameRu}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                    </div>
                    <div className="p-2.5">
                      <div className="text-sm font-semibold">{t.nameRu}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {t.tags.join(" · ")}
                      </div>
                    </div>
                  </button>
                </StaggerItem>
              ))}
            </StaggerList>

            <Button
              onClick={() => setStep("settings")}
              className="rounded-full px-8 bg-[var(--swipely-blue)] hover:bg-[var(--swipely-blue-dark)] active:scale-[0.98] transition-all shadow-sm"
            >
              Далее: настройки
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </PageTransition>
        )}

        {/* ─── Step: Settings ─── */}
        {step === "settings" && (
          <PageTransition id="settings" className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">Настройки</h1>
                <p className="text-muted-foreground">
                  Финальные штрихи перед генерацией
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("template")}
                className="hover:bg-muted"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Назад
              </Button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20"
              >
                {error}
              </motion.div>
            )}

            {/* Slide count */}
            <FadeIn delay={0.1}>
              <label className="text-sm font-medium mb-3 block">
                Количество слайдов
              </label>
              <div className="flex gap-3">
                {SLIDE_COUNTS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setSlideCount(n)}
                    className={`w-16 h-16 rounded-2xl border-2 font-bold text-lg font-[family-name:var(--font-mono)] transition-all active:scale-95 ${
                      slideCount === n
                        ? "border-[var(--swipely-blue)] bg-[var(--swipely-blue)]/10 text-[var(--swipely-blue)] shadow-sm"
                        : "border-border hover:border-[var(--swipely-blue)]/30 hover:shadow-sm"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </FadeIn>

            {/* Format */}
            <FadeIn delay={0.15}>
              <label className="text-sm font-medium mb-3 block">Формат</label>
              <div className="flex gap-3">
                {FORMATS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    className={`flex-1 p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
                      format === f.id
                        ? "border-[var(--swipely-blue)] bg-[var(--swipely-blue)]/10 shadow-sm"
                        : "border-border hover:border-[var(--swipely-blue)]/30 hover:shadow-sm"
                    }`}
                  >
                    <div className="font-semibold text-sm">{f.label}</div>
                    <div className="text-xs text-muted-foreground">{f.size}</div>
                  </button>
                ))}
              </div>
            </FadeIn>

            {/* Tone */}
            <FadeIn delay={0.2}>
              <label className="text-sm font-medium mb-3 block">
                Тон контента
              </label>
              <div className="grid grid-cols-2 gap-3">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
                      tone === t.id
                        ? "border-[var(--swipely-blue)] bg-[var(--swipely-blue)]/10 shadow-sm"
                        : "border-border hover:border-[var(--swipely-blue)]/30 hover:shadow-sm"
                    }`}
                  >
                    <span className="text-lg mr-2">{t.emoji}</span>
                    <span className="font-semibold text-sm">{t.label}</span>
                  </button>
                ))}
              </div>
            </FadeIn>

            {/* Summary */}
            <FadeIn delay={0.25}>
              <div className="rounded-2xl border border-border bg-muted/50 p-5">
                <h3 className="text-sm font-semibold mb-3">Итого:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Стиль:</span>
                  <span className="font-medium">
                    {templates.find((t) => t.id === selectedTemplate)?.nameRu}
                  </span>
                  <span className="text-muted-foreground">Слайдов:</span>
                  <span className="font-medium font-[family-name:var(--font-mono)]">
                    {slideCount}
                  </span>
                  <span className="text-muted-foreground">Формат:</span>
                  <span className="font-medium">
                    {FORMATS.find((f) => f.id === format)?.label}
                  </span>
                  <span className="text-muted-foreground">Тон:</span>
                  <span className="font-medium">
                    {TONES.find((t) => t.id === tone)?.label}
                  </span>
                </div>
              </div>
            </FadeIn>

            <Button
              onClick={handleGenerate}
              size="lg"
              className="rounded-full px-10 bg-[var(--swipely-blue)] hover:bg-[var(--swipely-blue-dark)] active:scale-[0.98] transition-all shadow-[0_4px_24px_rgba(10,132,255,0.4)]"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Создать карусель
            </Button>
          </PageTransition>
        )}

        {/* ─── Step: Generating ─── */}
        {step === "generating" && (
          <PageTransition id="generating">
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-20 h-20 rounded-full bg-[var(--swipely-blue)]/10 flex items-center justify-center mb-6"
              >
                <Sparkles className="h-8 w-8 text-[var(--swipely-blue)]" />
              </motion.div>
              <h2 className="text-xl font-bold mb-2">Генерируем карусель...</h2>
              <p className="text-muted-foreground mb-6">
                AI создаёт контент и подбирает оформление
              </p>
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                    className="w-2 h-2 rounded-full bg-[var(--swipely-blue)]"
                  />
                ))}
              </div>
            </div>
          </PageTransition>
        )}

        {/* ─── Step: Result ─── */}
        {step === "result" && result && (
          <PageTransition id="result" className="space-y-6">
            {/* Header */}
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold mb-1">Карусель готова!</h1>
                <p className="text-muted-foreground">
                  {result.slides.length} слайдов в стиле «
                  {templates.find((t) => t.id === selectedTemplate)?.nameRu}»
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="rounded-full bg-[var(--swipely-blue)] hover:bg-[var(--swipely-blue-dark)] active:scale-[0.98] transition-all gap-1.5"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Редактор
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full active:scale-[0.98] transition-all"
                  onClick={handleRegenerate}
                >
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  Перегенерировать
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full active:scale-[0.98] transition-all"
                  onClick={handleReset}
                >
                  Новая карусель
                </Button>
              </div>
            </div>

            {/* Slide preview + inline edit */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
              {/* Left: slide preview */}
              <FadeIn delay={0.1} className="space-y-4">
                <div className="flex justify-center">
                  <SlideRenderer
                    template={selectedTemplate}
                    scale={format === "square" ? 0.45 : 0.4}
                    slide={result.slides[currentSlide]}
                    slideNumber={currentSlide + 1}
                    totalSlides={result.slides.length}
                    format={format as "square" | "portrait"}
                  />
                </div>

                {/* Slide nav dots */}
                <div className="flex items-center justify-center gap-2 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentSlide === 0}
                    onClick={() => setCurrentSlide((prev) => prev - 1)}
                    className="active:scale-95 transition-all"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  {result.slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`rounded-full transition-all duration-300 ${
                        i === currentSlide
                          ? "w-6 h-2.5 bg-[var(--swipely-blue)]"
                          : "w-2.5 h-2.5 bg-muted-foreground/20 hover:bg-muted-foreground/40"
                      }`}
                    />
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentSlide === result.slides.length - 1}
                    onClick={() => setCurrentSlide((prev) => prev + 1)}
                    className="active:scale-95 transition-all"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Thumbnail strip */}
                <div className="flex gap-3 overflow-x-auto pb-2 justify-center">
                  {result.slides.map((slide, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`flex-shrink-0 rounded-lg border-2 overflow-hidden transition-all ${
                        i === currentSlide
                          ? "border-[var(--swipely-blue)] shadow-lg shadow-[var(--swipely-blue)]/20 scale-105"
                          : "border-border hover:border-[var(--swipely-blue)]/30 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <SlideRenderer
                        template={selectedTemplate}
                        scale={0.1}
                        slide={slide}
                        slideNumber={i + 1}
                        totalSlides={result.slides.length}
                        format={format as "square" | "portrait"}
                      />
                    </button>
                  ))}
                </div>
              </FadeIn>

              {/* Right: inline text editor */}
              <FadeIn delay={0.2} className="space-y-4">
                <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      Слайд {currentSlide + 1} из {result.slides.length}
                    </h3>
                    <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                      {result.slides[currentSlide].type}
                    </span>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Заголовок
                    </label>
                    <input
                      type="text"
                      value={result.slides[currentSlide].title}
                      onChange={(e) =>
                        updateSlide(currentSlide, "title", e.target.value)
                      }
                      className="w-full rounded-xl border border-border bg-background p-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--swipely-blue)]/50 focus:border-[var(--swipely-blue)] transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Текст
                    </label>
                    <textarea
                      value={result.slides[currentSlide].content}
                      onChange={(e) =>
                        updateSlide(currentSlide, "content", e.target.value)
                      }
                      rows={4}
                      className="w-full rounded-xl border border-border bg-background p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--swipely-blue)]/50 focus:border-[var(--swipely-blue)] transition-all"
                    />
                  </div>
                </div>

                {/* Post caption */}
                {result.post_caption !== undefined && (
                  <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Подпись к посту</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyCaption}
                        className="text-xs h-7 active:scale-95 transition-all"
                      >
                        <Copy className="mr-1 h-3.5 w-3.5" />
                        Скопировать
                      </Button>
                    </div>
                    <textarea
                      value={result.post_caption}
                      onChange={(e) => updateCaption(e.target.value)}
                      rows={6}
                      className="w-full rounded-xl border border-border bg-background p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--swipely-blue)]/50 focus:border-[var(--swipely-blue)] transition-all"
                    />
                  </div>
                )}
              </FadeIn>
            </div>

            {/* Export */}
            <ExportPanel
              slides={result.slides}
              template={selectedTemplate}
              format={format as "square" | "portrait"}
            />
          </PageTransition>
        )}
      </AnimatePresence>
    </div>
  );
}
