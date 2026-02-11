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
  Download,
  RotateCcw,
  Copy,
  ChevronDown,
} from "lucide-react";

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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
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
    }
  };

  // Render highlight tags in titles
  const renderTitle = (title: string) => {
    const parts = title.split(/(<hl>.*?<\/hl>)/g);
    return parts.map((part, i) => {
      const match = part.match(/<hl>(.*?)<\/hl>/);
      if (match) {
        return (
          <span
            key={i}
            className="bg-[var(--swipely-lime)] text-[var(--swipely-charcoal)] px-1.5"
          >
            {match[1]}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step indicator */}
      {step !== "generating" && (
        <div className="flex items-center gap-2 mb-8">
          {(["input", "template", "settings"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-[family-name:var(--font-mono)] transition-colors ${
                  step === s || (step === "result" && true)
                    ? "bg-[var(--swipely-blue)] text-white"
                    : ["input", "template", "settings"].indexOf(step) > i ||
                        step === "result"
                      ? "bg-[var(--swipely-blue)]/20 text-[var(--swipely-blue)]"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {["input", "template", "settings"].indexOf(step) > i ||
                step === "result" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 2 && (
                <div
                  className={`w-12 h-0.5 ${
                    ["input", "template", "settings"].indexOf(step) > i ||
                    step === "result"
                      ? "bg-[var(--swipely-blue)]/30"
                      : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── Step: Input ─── */}
      {step === "input" && (
        <div className="space-y-6">
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
              className="w-full h-48 rounded-2xl border border-border bg-card p-5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--swipely-blue)] focus:border-transparent placeholder:text-muted-foreground/60"
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
            className="rounded-full px-8 bg-[var(--swipely-blue)] hover:bg-[var(--swipely-blue-dark)]"
          >
            Далее: выбор стиля
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ─── Step: Template ─── */}
      {step === "template" && (
        <div className="space-y-6">
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
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Назад
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                className={`relative rounded-2xl overflow-hidden border-2 transition-all text-left ${
                  selectedTemplate === t.id
                    ? "border-[var(--swipely-blue)] shadow-lg shadow-[var(--swipely-blue)]/20"
                    : "border-border hover:border-[var(--swipely-blue)]/30"
                }`}
              >
                {selectedTemplate === t.id && (
                  <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-[var(--swipely-blue)] text-white flex items-center justify-center">
                    <Check className="h-3.5 w-3.5" />
                  </div>
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
            ))}
          </div>

          <Button
            onClick={() => setStep("settings")}
            className="rounded-full px-8 bg-[var(--swipely-blue)] hover:bg-[var(--swipely-blue-dark)]"
          >
            Далее: настройки
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ─── Step: Settings ─── */}
      {step === "settings" && (
        <div className="space-y-8">
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
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Назад
            </Button>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Slide count */}
          <div>
            <label className="text-sm font-medium mb-3 block">
              Количество слайдов
            </label>
            <div className="flex gap-3">
              {SLIDE_COUNTS.map((n) => (
                <button
                  key={n}
                  onClick={() => setSlideCount(n)}
                  className={`w-16 h-16 rounded-2xl border-2 font-bold text-lg font-[family-name:var(--font-mono)] transition-all ${
                    slideCount === n
                      ? "border-[var(--swipely-blue)] bg-[var(--swipely-blue)]/10 text-[var(--swipely-blue)]"
                      : "border-border hover:border-[var(--swipely-blue)]/30"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="text-sm font-medium mb-3 block">Формат</label>
            <div className="flex gap-3">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`flex-1 p-4 rounded-2xl border-2 text-left transition-all ${
                    format === f.id
                      ? "border-[var(--swipely-blue)] bg-[var(--swipely-blue)]/10"
                      : "border-border hover:border-[var(--swipely-blue)]/30"
                  }`}
                >
                  <div className="font-semibold text-sm">{f.label}</div>
                  <div className="text-xs text-muted-foreground">{f.size}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div>
            <label className="text-sm font-medium mb-3 block">
              Тон контента
            </label>
            <div className="grid grid-cols-2 gap-3">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    tone === t.id
                      ? "border-[var(--swipely-blue)] bg-[var(--swipely-blue)]/10"
                      : "border-border hover:border-[var(--swipely-blue)]/30"
                  }`}
                >
                  <span className="text-lg mr-2">{t.emoji}</span>
                  <span className="font-semibold text-sm">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
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

          <Button
            onClick={handleGenerate}
            size="lg"
            className="rounded-full px-10 bg-[var(--swipely-blue)] hover:bg-[var(--swipely-blue-dark)] shadow-[0_4px_24px_rgba(10,132,255,0.4)]"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Создать карусель
          </Button>
        </div>
      )}

      {/* ─── Step: Generating ─── */}
      {step === "generating" && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-[var(--swipely-blue)]/10 flex items-center justify-center mb-6 animate-pulse-glow">
            <Sparkles className="h-8 w-8 text-[var(--swipely-blue)]" />
          </div>
          <h2 className="text-xl font-bold mb-2">Генерируем карусель...</h2>
          <p className="text-muted-foreground mb-4">
            AI создаёт контент и подбирает оформление
          </p>
          <Loader2 className="h-6 w-6 animate-spin text-[var(--swipely-blue)]" />
        </div>
      )}

      {/* ─── Step: Result ─── */}
      {step === "result" && result && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Карусель готова!</h1>
              <p className="text-muted-foreground">
                {result.slides.length} слайдов в стиле «
                {templates.find((t) => t.id === selectedTemplate)?.nameRu}»
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={handleRegenerate}
              >
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                Перегенерировать
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={handleReset}
              >
                Новая карусель
              </Button>
            </div>
          </div>

          {/* Slide navigator */}
          <div className="space-y-4">
            {/* Current slide */}
            <div className="rounded-3xl border border-border bg-card overflow-hidden">
              <div className="p-8 min-h-[300px] flex flex-col justify-center">
                <div className="text-xs font-mono text-muted-foreground mb-4">
                  {String(currentSlide + 1).padStart(2, "0")} /{" "}
                  {String(result.slides.length).padStart(2, "0")} —{" "}
                  {result.slides[currentSlide].type}
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold leading-tight mb-4">
                  {renderTitle(result.slides[currentSlide].title)}
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {result.slides[currentSlide].content}
                </p>
              </div>

              {/* Slide nav dots */}
              <div className="flex items-center justify-center gap-2 py-4 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentSlide === 0}
                  onClick={() => setCurrentSlide((prev) => prev - 1)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                {result.slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      i === currentSlide
                        ? "bg-[var(--swipely-blue)]"
                        : "bg-muted-foreground/20"
                    }`}
                  />
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentSlide === result.slides.length - 1}
                  onClick={() => setCurrentSlide((prev) => prev + 1)}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* All slides mini */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {result.slides.map((slide, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`flex-shrink-0 w-40 p-3 rounded-xl border-2 text-left transition-all ${
                    i === currentSlide
                      ? "border-[var(--swipely-blue)] bg-[var(--swipely-blue)]/5"
                      : "border-border hover:border-[var(--swipely-blue)]/30"
                  }`}
                >
                  <div className="text-[10px] font-mono text-muted-foreground mb-1">
                    {String(i + 1).padStart(2, "0")} — {slide.type}
                  </div>
                  <div className="text-xs font-semibold line-clamp-2">
                    {slide.title.replace(/<\/?hl>/g, "")}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Post caption */}
          {result.post_caption && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Подпись к посту</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyCaption}
                  className="text-xs"
                >
                  <Copy className="mr-1 h-3.5 w-3.5" />
                  Скопировать
                </Button>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {result.post_caption}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              className="rounded-full bg-[var(--swipely-blue)] hover:bg-[var(--swipely-blue-dark)]"
              disabled
            >
              <Download className="mr-2 h-4 w-4" />
              Скачать PNG (скоро)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
