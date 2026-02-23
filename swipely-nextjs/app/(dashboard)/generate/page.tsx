"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { templates } from "@/lib/templates/registry";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  RotateCcw,
  Copy,
  Pencil,
  Upload,
  X,
  Camera,
  ImageIcon,
  Link,
  Loader2,
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
import { usePhotoGeneration } from "@/hooks/usePhotoGeneration";

type Step = "input" | "platform_goal" | "template" | "settings" | "generating" | "result";
type Mode = "standard" | "photo";
type ImageStyle = "cartoon" | "realistic";
type InputMode = "text" | "video";

interface Slide {
  type: string;
  title: string;
  content: string;
  imageUrl?: string;
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
const IMAGE_STYLES: { id: ImageStyle; label: string; description: string }[] = [
  {
    id: "cartoon",
    label: "Мультяшный",
    description: "3D в стиле Pixar/Disney — яркие цвета, мягкий свет",
  },
  {
    id: "realistic",
    label: "Реалистичный",
    description: "Профессиональная фотография — студийное качество",
  },
];

const STEPS = ["input", "platform_goal", "template", "settings"] as const;

const STEP_LABELS: Record<string, string> = {
  input: "Контент",
  platform_goal: "Платформа",
  template: "Шаблон",
  settings: "Настройки",
};

const PLATFORMS = [
  { id: "instagram", label: "Instagram", color: "#E1306C" },
  { id: "linkedin", label: "LinkedIn", color: "#0077B5" },
  { id: "threads", label: "Threads", color: "#374151" },
  { id: "tiktok", label: "TikTok", color: "#FF0050" },
  { id: "telegram", label: "Telegram", color: "#2AABEE" },
  { id: "vk", label: "VK", color: "#2787F5" },
  { id: "pinterest", label: "Pinterest", color: "#E60023" },
  { id: "facebook", label: "Facebook", color: "#1877F2" },
] as const;

const GOALS = [
  { id: "viral", label: "Виральность", description: "Максимум охвата и репостов", color: "#FF6B35" },
  { id: "personal_brand", label: "Личный бренд", description: "Экспертность и узнаваемость", color: "#8B5CF6" },
  { id: "sales", label: "Продажи", description: "Боль → решение → оффер", color: "#10B981" },
  { id: "networking", label: "Нетворкинг", description: "Связи и коллаборации", color: "#3B82F6" },
  { id: "lead_gen", label: "Лидогенерация", description: "Захват подписчиков и заявок", color: "#F59E0B" },
  { id: "education", label: "Образование", description: "Структурированные знания", color: "#0A84FF" },
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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
  const [slideScale, setSlideScale] = useState(0.45);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 480) setSlideScale(format === "square" ? 0.26 : 0.22);
      else if (w < 640) setSlideScale(format === "square" ? 0.30 : 0.26);
      else if (w < 768) setSlideScale(format === "square" ? 0.38 : 0.32);
      else setSlideScale(format === "square" ? 0.45 : 0.40);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [format]);

  // Photo mode state
  const [mode, setMode] = useState<Mode>("standard");
  const [referencePhoto, setReferencePhoto] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [imageStyle, setImageStyle] = useState<ImageStyle>("cartoon");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const photoGen = usePhotoGeneration();
  const [isDragging, setIsDragging] = useState(false);

  // Video transcription state
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [videoUrl, setVideoUrl] = useState("");
  const [transcribing, setTranscribing] = useState(false);

  const [platform, setPlatform] = useState("");
  const [goal, setGoal] = useState("");

  const activeTemplate = mode === "photo" ? "photo_mode" : selectedTemplate;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Файл слишком большой. Максимум 10 МБ.");
      return;
    }

    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      toast.error("Поддерживаются только JPEG, PNG и WebP");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPhotoPreview(dataUrl);
      setReferencePhoto(dataUrl.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setReferencePhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Файл слишком большой. Максимум 10 МБ.");
      return;
    }

    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      toast.error("Поддерживаются только JPEG, PNG и WebP");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPhotoPreview(dataUrl);
      setReferencePhoto(dataUrl.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  const handleTranscribe = async () => {
    if (!videoUrl.trim()) return;
    setTranscribing(true);
    try {
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: videoUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Не удалось извлечь транскрипцию");
        return;
      }
      setText(data.transcript);
      setVideoUrl("");
      setStep("platform_goal");
    } catch {
      toast.error("Ошибка соединения. Попробуй ещё раз.");
    } finally {
      setTranscribing(false);
    }
  };

  const handleGenerate = async () => {
    setStep("generating");
    setError("");

    if (mode === "photo") {
      // Photo mode uses SSE hook
      photoGen.generate({
        text,
        slideCount,
        format,
        style: imageStyle,
        referencePhoto: referencePhoto!,
      });
      return; // SSE hook manages state, useEffect below handles transitions
    }

    // Standard mode — existing fetch logic
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
          platform,
          goal,
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

  // Watch photo generation SSE state
  useEffect(() => {
    if (photoGen.phase === "done" && photoGen.result) {
      setResult(photoGen.result);
      setCurrentSlide(0);
      setStep("result");
      toast.success("Карусель создана!");
    } else if (photoGen.phase === "error" && photoGen.error) {
      setError(photoGen.error);
      toast.error(photoGen.error);
      setStep("settings");
    }
  }, [photoGen.phase, photoGen.result, photoGen.error]);

  const handleReset = () => {
    setStep("input");
    setText("");
    setResult(null);
    setError("");
    setCurrentSlide(0);
    setReferencePhoto(null);
    setPhotoPreview(null);
    setPlatform("");
    setGoal("");
    setVideoUrl("");
    setInputMode("text");
    if (fileInputRef.current) fileInputRef.current.value = "";
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

  const goToNextStep = () => {
    if (step === "input") {
      setStep("platform_goal");
    } else if (step === "platform_goal") {
      setStep("template");
    } else if (step === "template") {
      setStep("settings");
    }
  };

  const goToPrevStep = () => {
    if (step === "platform_goal") {
      setStep("input");
    } else if (step === "template") {
      setStep("platform_goal");
    } else if (step === "settings") {
      setStep("template");
    }
  };

  /* ─── Full-screen editor overlay ─── */
  if (editing && result) {
    return (
      <CarouselEditor
        slides={result.slides}
        template={activeTemplate}
        format={format as "square" | "portrait"}
        postCaption={result.post_caption}
        onUpdateSlide={updateSlide}
        onUpdateCaption={updateCaption}
        onClose={() => setEditing(false)}
      />
    );
  }

  const resultStyleLabel =
    mode === "photo"
      ? `AI Фото — ${IMAGE_STYLES.find((s) => s.id === imageStyle)?.label}`
      : templates.find((t) => t.id === selectedTemplate)?.nameRu;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step indicator */}
      {step !== "generating" && (
        <FadeIn className="flex items-center gap-1 mb-10">
          {STEPS.map((s, i) => {
            const isResult = step === "result";
            const stepIdx = STEPS.indexOf(step as typeof STEPS[number]);
            const isPast = stepIdx > i || isResult;
            const isCurrent = step === s;
            return (
              <div key={s} className="flex items-center gap-1">
                <div className="flex flex-col items-center gap-1.5" {...(isCurrent ? { "aria-current": "step" } : {})}>
                  <div
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      isCurrent
                        ? "bg-[#D4F542] scale-125 shadow-sm shadow-[#D4F542]/40"
                        : isPast
                          ? "bg-[#0D0D14]"
                          : "bg-[#E8E8E4]"
                    }`}
                  />
                  <span
                    className={`text-xs font-medium transition-colors duration-300 hidden sm:block ${
                      isCurrent
                        ? "text-[#0D0D14]"
                        : isPast
                          ? "text-[#6B7280]"
                          : "text-[#9CA3AF]"
                    }`}
                  >
                    {STEP_LABELS[s]}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-10 h-0.5 mb-4 transition-colors duration-500 ${
                      isPast ? "bg-[#D4F542]/50" : "bg-[#E8E8E4]"
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
              <h1 className="text-3xl font-bold mb-2 text-[#0D0D14]">Создать карусель</h1>
              <p className="text-muted-foreground">
                Введи текст, идею или тему — AI создаст готовую карусель
              </p>
            </div>

            {/* Mode toggle */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode("standard")}
                className={`flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                  mode === "standard"
                    ? "border-[#D4F542] bg-[#D4F542]/5 shadow-sm"
                    : "border-[#E8E8E4] bg-white hover:border-[#D4F542]/40 hover:shadow-sm"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${mode === "standard" ? "bg-[#D4F542]/20" : "bg-[#F0F0ED]"}`}>
                  <ImageIcon className={`h-4 w-4 ${mode === "standard" ? "text-[#0D0D14]" : "text-[#6B7280]"}`} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${mode === "standard" ? "text-[#0D0D14]" : "text-[#374151]"}`}>Стандарт</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">Текст в слайды</p>
                </div>
              </button>

              <button
                onClick={() => setMode("photo")}
                className={`flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                  mode === "photo"
                    ? "border-[#D4F542] bg-[#D4F542]/5 shadow-sm"
                    : "border-[#E8E8E4] bg-white hover:border-[#D4F542]/40 hover:shadow-sm"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${mode === "photo" ? "bg-[#D4F542]/20" : "bg-[#F0F0ED]"}`}>
                  <Camera className={`h-4 w-4 ${mode === "photo" ? "text-[#0D0D14]" : "text-[#6B7280]"}`} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${mode === "photo" ? "text-[#0D0D14]" : "text-[#374151]"}`}>AI Фото</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">Фото на каждом слайде</p>
                </div>
              </button>
            </div>

            {/* Photo upload area (photo mode only) */}
            {mode === "photo" && (
              <FadeIn className="space-y-3">
                <label className="text-sm font-medium block">
                  Загрузи своё фото
                </label>
                {photoPreview ? (
                  <div className="relative inline-block">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-40 h-40 object-cover rounded-2xl border border-border"
                    />
                    <button
                      onClick={removePhoto}
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`w-full h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
                      isDragging
                        ? "border-[#D4F542] bg-[#D4F542]/10 scale-[1.02]"
                        : "border-[#E8E8E4] hover:border-[#D4F542]/50 bg-[#F8F8F6] hover:bg-[#F5F5F2]"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-[#D4F542]/15 flex items-center justify-center">
                      <Upload className="h-5 w-5 text-[#0D0D14]" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">
                        {isDragging ? "Отпусти для загрузки" : "Нажми или перетащи фото"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        JPEG, PNG, WebP — до 10 МБ
                      </p>
                    </div>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </FadeIn>
            )}

            {/* Input mode tabs */}
            <div className="flex rounded-xl border border-border bg-muted/50 p-1 gap-1">
              <button
                onClick={() => setInputMode("text")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  inputMode === "text"
                    ? "bg-white shadow-sm text-[#0D0D14] font-semibold"
                    : "text-[#9CA3AF] hover:text-[#374151]"
                }`}
              >
                ✍️ Текст
              </button>
              <button
                onClick={() => setInputMode("video")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  inputMode === "video"
                    ? "bg-white shadow-sm text-[#0D0D14] font-semibold"
                    : "text-[#9CA3AF] hover:text-[#374151]"
                }`}
              >
                🔗 Видео
              </button>
            </div>

            {/* Video URL input */}
            {inputMode === "video" && (
              <FadeIn className="space-y-3">
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="youtube.com/watch?v=... или instagram.com/reel/..."
                  className="w-full rounded-2xl border border-[#E8E8E4] bg-white px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4F542]/60 focus:border-[#D4F542] placeholder:text-[#9CA3AF] transition-all"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !transcribing) handleTranscribe();
                  }}
                />
                <Button
                  onClick={handleTranscribe}
                  disabled={!videoUrl.trim() || transcribing}
                  className="w-full rounded-full bg-[#D4F542] text-[#0D0D14] hover:bg-[#c8e83a] transition-all font-semibold"
                >
                  {transcribing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Извлекаем транскрипцию... ~30с
                    </>
                  ) : (
                    <>
                      <Link className="mr-2 h-4 w-4" />
                      Извлечь транскрипцию
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Работает с публичными YouTube-видео
                </p>
              </FadeIn>
            )}

            {inputMode === "text" && (
              <div className="space-y-3">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={
                    mode === "photo"
                      ? "Опиши тему карусели — AI сгенерирует изображения и короткий текст..."
                      : "Например: 5 способов привлечь клиентов через контент-маркетинг\n\nИли вставь готовый текст, статью, заметку — AI адаптирует под формат карусели..."
                  }
                  className="w-full h-48 rounded-2xl border border-[#E8E8E4] bg-white p-5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#D4F542]/60 focus:border-[#D4F542] placeholder:text-[#9CA3AF] transition-all"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {text.length} символов
                  </p>
                </div>
              </div>
            )}

            <Button
              onClick={goToNextStep}
              disabled={
                text.trim().length < 10 ||
                (mode === "photo" && !referencePhoto)
              }
              className="rounded-full px-8 bg-[#D4F542] text-[#0D0D14] hover:bg-[#c8e83a] active:scale-[0.98] transition-all shadow-sm font-semibold"
            >
              Далее: платформа
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </PageTransition>
        )}

        {/* ─── Step: Platform & Goal ─── */}
        {step === "platform_goal" && (
          <PageTransition id="platform_goal" className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">Платформа и цель</h1>
                <p className="text-muted-foreground">
                  Куда публикуем и чего хотим достичь
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPrevStep}
                className="hover:bg-muted"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Назад
              </Button>
            </div>

            {/* Platform */}
            <FadeIn delay={0.1}>
              <label className="text-sm font-medium mb-3 block">
                Платформа
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={`py-3 px-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 active:scale-[0.97] ${
                      platform === p.id
                        ? "text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-border/80"
                    }`}
                    style={
                      platform === p.id
                        ? {
                            borderColor: p.color,
                            backgroundColor: p.color + "15",
                            boxShadow: `0 0 0 1px ${p.color}30, 0 4px 16px ${p.color}20`,
                          }
                        : {}
                    }
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </FadeIn>

            {/* Goal */}
            <FadeIn delay={0.18}>
              <label className="text-sm font-medium mb-3 block">Цель</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 active:scale-[0.98] ${
                      goal === g.id
                        ? "text-foreground"
                        : "border-border hover:border-border/60 hover:shadow-sm"
                    }`}
                    style={
                      goal === g.id
                        ? {
                            borderColor: g.color,
                            borderLeftWidth: "4px",
                            backgroundColor: g.color + "0D",
                          }
                        : {}
                    }
                  >
                    <div className="font-semibold text-sm">{g.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {g.description}
                    </div>
                  </button>
                ))}
              </div>
            </FadeIn>

            <Button
              onClick={goToNextStep}
              disabled={!platform || !goal}
              className="rounded-full px-8 bg-[#D4F542] text-[#0D0D14] hover:bg-[#c8e83a] active:scale-[0.98] transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
            >
              Далее: выбор стиля
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </PageTransition>
        )}

        {/* ─── Step: Template / Style ─── */}
        {step === "template" && (
          <PageTransition id="template" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">
                  {mode === "photo" ? "Выбери стиль фото" : "Выбери стиль"}
                </h1>
                <p className="text-muted-foreground">
                  {mode === "photo"
                    ? "AI трансформирует твоё фото в выбранном стиле"
                    : "16 дизайн-шаблонов на любой вкус"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPrevStep}
                className="hover:bg-muted"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Назад
              </Button>
            </div>

            {mode === "photo" ? (
              /* Photo mode: style selection */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {IMAGE_STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setImageStyle(s.id)}
                    className={`relative p-6 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
                      imageStyle === s.id
                        ? "border-[#D4F542] bg-[#D4F542]/10 shadow-lg shadow-[#D4F542]/20"
                        : "border-[#E8E8E4] hover:border-[#D4F542]/30 hover:shadow-md"
                    }`}
                  >
                    {imageStyle === s.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#D4F542] text-[#0D0D14] flex items-center justify-center"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </motion.div>
                    )}
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                        s.id === "cartoon"
                          ? "bg-purple-500/10"
                          : "bg-amber-500/10"
                      }`}
                    >
                      {s.id === "cartoon" ? (
                        <Sparkles
                          className={`h-7 w-7 ${
                            s.id === "cartoon"
                              ? "text-purple-500"
                              : "text-amber-500"
                          }`}
                        />
                      ) : (
                        <Camera className="h-7 w-7 text-amber-500" />
                      )}
                    </div>
                    <h3 className="text-lg font-bold mb-1">{s.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      {s.description}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              /* Standard mode: template grid */
              <StaggerList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {templates.map((t) => (
                  <StaggerItem key={t.id}>
                    <button
                      onClick={() => setSelectedTemplate(t.id)}
                      className={`relative rounded-2xl overflow-hidden border-2 transition-all text-left w-full hover:shadow-md ${
                        selectedTemplate === t.id
                          ? "border-[#D4F542] shadow-lg shadow-[#D4F542]/20"
                          : "border-[#E8E8E4] hover:border-[#D4F542]/30"
                      }`}
                    >
                      {selectedTemplate === t.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-[#D4F542] text-[#0D0D14] flex items-center justify-center"
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
            )}

            <Button
              onClick={() => setStep("settings")}
              className="rounded-full px-8 bg-[#D4F542] text-[#0D0D14] hover:bg-[#c8e83a] active:scale-[0.98] transition-all shadow-sm font-semibold"
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
                onClick={goToPrevStep}
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
                        ? "border-[#D4F542] bg-[#D4F542]/10 text-[#0D0D14] shadow-sm"
                        : "border-[#E8E8E4] hover:border-[#D4F542]/30 hover:shadow-sm"
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
                        ? "border-[#D4F542] bg-[#D4F542]/10 shadow-sm"
                        : "border-[#E8E8E4] hover:border-[#D4F542]/30 hover:shadow-sm"
                    }`}
                  >
                    <div className="font-semibold text-sm">{f.label}</div>
                    <div className="text-xs text-muted-foreground">{f.size}</div>
                  </button>
                ))}
              </div>
            </FadeIn>

            {/* Tone (standard mode only) */}
            {mode === "standard" && (
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
                          ? "border-[#D4F542] bg-[#D4F542]/10 shadow-sm"
                          : "border-[#E8E8E4] hover:border-[#D4F542]/30 hover:shadow-sm"
                      }`}
                    >
                      <span className="text-lg mr-2">{t.emoji}</span>
                      <span className="font-semibold text-sm">{t.label}</span>
                    </button>
                  ))}
                </div>
              </FadeIn>
            )}

            {/* Summary */}
            <FadeIn delay={mode === "photo" ? 0.2 : 0.25}>
              <div className="rounded-2xl border border-border bg-muted/50 p-5">
                <h3 className="text-sm font-semibold mb-3">Итого:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Платформа:</span>
                  <span className="font-medium capitalize">
                    {PLATFORMS.find((p) => p.id === platform)?.label || "—"}
                  </span>
                  <span className="text-muted-foreground">Цель:</span>
                  <span className="font-medium">
                    {GOALS.find((g) => g.id === goal)?.label || "—"}
                  </span>
                  <span className="text-muted-foreground">Режим:</span>
                  <span className="font-medium">
                    {mode === "photo" ? "AI Фото" : "Стандарт"}
                  </span>
                  <span className="text-muted-foreground">Стиль:</span>
                  <span className="font-medium">
                    {mode === "photo"
                      ? IMAGE_STYLES.find((s) => s.id === imageStyle)?.label
                      : templates.find((t) => t.id === selectedTemplate)?.nameRu}
                  </span>
                  <span className="text-muted-foreground">Слайдов:</span>
                  <span className="font-medium font-[family-name:var(--font-mono)]">
                    {slideCount}
                  </span>
                  <span className="text-muted-foreground">Формат:</span>
                  <span className="font-medium">
                    {FORMATS.find((f) => f.id === format)?.label}
                  </span>
                  {mode === "standard" && (
                    <>
                      <span className="text-muted-foreground">Тон:</span>
                      <span className="font-medium">
                        {TONES.find((t) => t.id === tone)?.label}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </FadeIn>

            <Button
              onClick={handleGenerate}
              size="lg"
              className="rounded-full px-10 bg-[#D4F542] text-[#0D0D14] hover:bg-[#c8e83a] active:scale-[0.98] transition-all shadow-[0_4px_24px_rgba(212,245,66,0.35)] font-semibold"
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
                className="w-20 h-20 rounded-full bg-[#D4F542]/15 flex items-center justify-center mb-6"
              >
                {mode === "photo" ? (
                  <Camera className="h-8 w-8 text-[#0D0D14]" />
                ) : (
                  <Sparkles className="h-8 w-8 text-[#0D0D14]" />
                )}
              </motion.div>
              <h2 className="text-xl font-bold mb-2">
                {mode === "photo"
                  ? photoGen.phase === "content"
                    ? "Генерируем контент..."
                    : `Генерируем фото ${photoGen.progress}/${photoGen.totalSlides}`
                  : "Генерируем карусель..."}
              </h2>
              <p className="text-muted-foreground mb-6">
                {mode === "photo"
                  ? photoGen.phase === "content"
                    ? "AI создаёт текст для слайдов"
                    : "AI создаёт изображения — это может занять до минуты"
                  : "AI создаёт контент и подбирает оформление"}
              </p>

              {/* Progress bar for photo mode */}
              {mode === "photo" && photoGen.phase === "images" && photoGen.totalSlides > 0 && (
                <div className="w-64 mb-6">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-[#D4F542]"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(photoGen.progress / photoGen.totalSlides) * 100}%`,
                      }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 font-[family-name:var(--font-mono)]">
                    {photoGen.progress} / {photoGen.totalSlides} слайдов
                  </p>
                </div>
              )}

              {/* Animated dots (standard mode or content phase) */}
              {(mode === "standard" || photoGen.phase === "content") && (
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
                      className="w-2 h-2 rounded-full bg-[#D4F542]"
                    />
                  ))}
                </div>
              )}
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
                  {result.slides.length} слайдов — {resultStyleLabel}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="rounded-full bg-[#D4F542] text-[#0D0D14] hover:bg-[#c8e83a] active:scale-[0.98] transition-all gap-1.5 font-semibold"
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
                    template={activeTemplate}
                    scale={slideScale}
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
                          ? "w-6 h-2.5 bg-[#D4F542]"
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
                          ? "border-[#D4F542] shadow-lg shadow-[#D4F542]/20 scale-105"
                          : "border-border hover:border-[#D4F542]/30 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <SlideRenderer
                        template={activeTemplate}
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
              template={activeTemplate}
              format={format as "square" | "portrait"}
            />
          </PageTransition>
        )}
      </AnimatePresence>
    </div>
  );
}
