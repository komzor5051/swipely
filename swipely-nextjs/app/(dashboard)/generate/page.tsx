"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { templates, PRO_ONLY_TEMPLATE_IDS } from "@/lib/templates/registry";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Copy,
  Pencil,
  Upload,
  X,
  Camera,
  ImageIcon,
  Link,
  Loader2,
  Lock,
  Layers,
  Check,
} from "lucide-react";
import SlideRenderer from "@/components/slides/SlideRenderer";
import ExportPanel from "@/components/generate/ExportPanel";
import CarouselEditor from "@/components/generate/CarouselEditor";
import TemplateSwitcher from "@/components/generate/TemplateSwitcher";
import {
  FadeIn,
  PageTransition,
  AnimatePresence,
  motion,
} from "@/components/ui/motion";
import { toast } from "sonner";
import { usePhotoGeneration } from "@/hooks/usePhotoGeneration";
import { useSearchParams } from "next/navigation";
import { getTemplate } from "@/lib/templates/registry";
import { createClient } from "@/lib/supabase/client";

type Step = "form" | "template" | "generating" | "result";
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

const SLIDE_COUNTS = [3, 5, 7, 9, 12];
const PRO_SLIDE_COUNTS = [9, 12];
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

const FRAMEWORK_OPTIONS = [
  { id: "mistakes", label: "3 ошибки" },
  { id: "case-study", label: "Кейс-разбор" },
  { id: "step-by-step", label: "Пошаговый гайд" },
  { id: "before-after", label: "До/После" },
  { id: "myths-vs-reality", label: "Мифы vs Реальность" },
  { id: "checklist", label: "Чек-лист" },
] as const;
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


const PHOTO_MODE_BETA_EMAILS = ["komzor909@gmail.com", "komzor5051@gmail.com"];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const VALID_IMAGE_TYPES = /^image\/(jpeg|png|webp)$/;

// Sample slide for template previews — no real content needed
const DUMMY_SLIDE = {
  type: "hook",
  title: "Заголовок <hl>карусели</hl>",
  content: "Здесь будет твой текст — интересный и вовлекающий для читателей в соцсетях",
};

function GeneratePage() {
  const [step, setStep] = useState<Step>("form");
  const [text, setText] = useState("");
  const [brief, setBrief] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("swipely");
  const [slideCount, setSlideCount] = useState(5);
  const [format, setFormat] = useState("portrait");
  const [tone, setTone] = useState("educational");
  const [framework, setFramework] = useState<string | null>(null);
  const [result, setResult] = useState<CarouselResult | null>(null);
  const [preserveText, setPreserveText] = useState(false);
  const [_error, setError] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [editing, setEditing] = useState(false);
  const [showTemplateSwitcher, setShowTemplateSwitcher] = useState(false);
  const [slideScale, setSlideScale] = useState(0.45);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const cap = format === "square" ? 0.45 : 0.40;
      if (w < 1024) {
        // Mobile/tablet — single-column result, no sidebar effect
        const available = w - 48; // p-6 * 2
        setSlideScale(Math.min(cap, Math.max(0.18, available / 1080)));
      } else {
        // Desktop (lg+) — sidebar 256 + p-8 64 + max-w-4xl 896 + right-col 320 + gap 24
        const mainW = Math.min(w - 256 - 64, 896);
        const slideColW = mainW - 320 - 24;
        setSlideScale(Math.min(cap, Math.max(0.22, slideColW / 1080)));
      }
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
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const userPhotoInputRef = useRef<HTMLInputElement>(null);
  const uploadedPhotosRef = useRef<string[]>([]);

  useEffect(() => {
    uploadedPhotosRef.current = uploadedPhotos;
  }, [uploadedPhotos]);

  useEffect(() => {
    return () => {
      uploadedPhotosRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const wasFirstGenerationRef = useRef(false);

  const [isPro, setIsPro] = useState(false);
  const [standardUsed, setStandardUsed] = useState<number | null>(null);
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false);
  const [emailUnverified, setEmailUnverified] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      if (user.email) setUserEmail(user.email);
      supabase
        .from("profiles")
        .select("subscription_tier, standard_used")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          setIsPro(data?.subscription_tier === "pro");
          setStandardUsed(data?.standard_used ?? null);
        });
    });
  }, []);

  const searchParams = useSearchParams();
  const [templateFromUrl, setTemplateFromUrl] = useState(false);

  useEffect(() => {
    const tplParam = searchParams.get("template");
    if (tplParam && getTemplate(tplParam)) {
      setSelectedTemplate(tplParam);
      setTemplateFromUrl(true);
    }
  }, [searchParams]);

  const handleResendVerification = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: "signup", email: userEmail });
    if (error) {
      toast.error("Не удалось отправить письмо. Попробуй позже.");
    } else {
      setResendSent(true);
      toast.success("Письмо отправлено! Проверь почту.");
    }
  };

  const photoGen = usePhotoGeneration();
  const [isDragging, setIsDragging] = useState(false);

  // Video transcription state
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [videoUrl, setVideoUrl] = useState("");
  const [transcribing, setTranscribing] = useState(false);


  const hasUserPhotos = uploadedPhotos.length > 0;
  const skipTemplate = mode !== "standard" || templateFromUrl || hasUserPhotos;
  const activeTemplate = (mode === "photo" || hasUserPhotos) ? "photo_mode" : selectedTemplate;

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

  const handleUserPhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processUserPhotoFiles(files);
    if (userPhotoInputRef.current) userPhotoInputRef.current.value = "";
  };

  const processUserPhotoFiles = (files: File[]) => {
    const valid = files.filter((f) => {
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name}: слишком большой файл (макс. 10 МБ)`);
        return false;
      }
      if (!f.type.match(VALID_IMAGE_TYPES)) {
        toast.error(`${f.name}: поддерживаются только JPEG, PNG, WebP`);
        return false;
      }
      return true;
    });

    if (!valid.length) return;

    const newUrls = valid.map((f) => URL.createObjectURL(f));

    setUploadedPhotos((prev) => {
      const next = [...prev, ...newUrls];
      if (next.length > 12) {
        next.slice(12).forEach((url) => URL.revokeObjectURL(url));
        return next.slice(0, 12);
      }
      return next;
    });

    if (uploadedPhotosRef.current.length + newUrls.length > 12) {
      toast.error("Максимум 12 фото");
    }
  };

  const handleUserPhotoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processUserPhotoFiles(files);
  };

  const handleRemoveUserPhoto = (index: number) => {
    setUploadedPhotos((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
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
    } catch {
      toast.error("Ошибка соединения. Попробуй ещё раз.");
    } finally {
      setTranscribing(false);
    }
  };

  const showBannerIfFirstEver = () => {
    if (sessionStorage.getItem("swipely_first_gen_banner_shown")) return;
    setShowUpgradeBanner(true);
    sessionStorage.setItem("swipely_first_gen_banner_shown", "1");
  };

  const handleGenerate = async () => {
    setStep("generating");
    setError("");
    setShowUpgradeBanner(false);
    const wasFirstGeneration = !isPro && standardUsed === 0;

    if (mode === "photo") {
      // Photo mode uses SSE hook
      wasFirstGenerationRef.current = wasFirstGeneration;
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
          brief,
          template: selectedTemplate,
          slideCount,
          format,
          tone,
          preserveText,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Ошибка сервера" }));
        if (res.status === 403 && data.error === "EMAIL_NOT_VERIFIED") {
          setEmailUnverified(true);
          toast.error("Подтверди email перед генерацией", {
            description: "Проверь почту — мы отправили письмо со ссылкой",
          });
          setStep("form");
          return;
        }
        if (res.status === 429 && data.error === "COOLDOWN") {
          const secs = data.waitSeconds ?? 15;
          toast.error(`Подожди ${secs} сек. перед следующей генерацией`, {
            description: "Защита от перегрузки",
            duration: secs * 1000,
          });
          setStep(mode === "standard" && !hasUserPhotos ? "template" : "form");
          return;
        }
        throw new Error(data.error || "Ошибка генерации");
      }

      const data: CarouselResult = await res.json();
      const slidesWithPhotos = hasUserPhotos
        ? data.slides.map((s, i) => ({ ...s, imageUrl: uploadedPhotos[i] ?? undefined }))
        : data.slides;
      setResult({ ...data, slides: slidesWithPhotos });
      setCurrentSlide(0);
      setStep("result");
      if (wasFirstGeneration) showBannerIfFirstEver();
      setStandardUsed((prev) => (prev !== null ? Math.min(3, prev + 1) : null));
      toast.success("Карусель создана!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Произошла ошибка";
      setError(message);
      toast.error(message);
      setStep(mode === "standard" && !hasUserPhotos ? "template" : "form");
    }
  };

  // Watch photo generation SSE state
  useEffect(() => {
    if (photoGen.phase === "done" && photoGen.result) {
      setResult(photoGen.result);
      setCurrentSlide(0);
      setStep("result");
      if (wasFirstGenerationRef.current) showBannerIfFirstEver();
      wasFirstGenerationRef.current = false; // reset for next generation
      // Note: photo mode uses photo_slides_balance, not standard_used — no increment here
      toast.success("Карусель создана!");
    } else if (photoGen.phase === "error" && photoGen.error) {
      setError(photoGen.error);
      toast.error(photoGen.error);
      setStep("form");
    }
  }, [photoGen.phase, photoGen.result, photoGen.error]);

  const handleReset = () => {
    setStep("form");
    setText("");
    setBrief("");
    setResult(null);
    setError("");
    setCurrentSlide(0);
    setReferencePhoto(null);
    setPhotoPreview(null);
    setVideoUrl("");
    setInputMode("text");
    setPreserveText(false);
    setShowTemplateSwitcher(false);
    setShowUpgradeBanner(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    // Revoke objectURLs to free memory
    uploadedPhotos.forEach((url) => URL.revokeObjectURL(url));
    setUploadedPhotos([]);
    if (userPhotoInputRef.current) userPhotoInputRef.current.value = "";
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
        template={activeTemplate}
        format={format as "square" | "portrait"}
        postCaption={result.post_caption}
        onUpdateSlide={updateSlide}
        onUpdateCaption={updateCaption}
        onClose={() => setEditing(false)}
        onChangeTemplate={(id) => {
          setSelectedTemplate(id);
          if (mode === "photo") setMode("standard");
        }}
        isPro={isPro}
      />
    );
  }

  const resultStyleLabel =
    hasUserPhotos
      ? "Свои фото"
      : mode === "photo"
        ? `AI Фото — ${IMAGE_STYLES.find((s) => s.id === imageStyle)?.label}`
        : templates.find((t) => t.id === selectedTemplate)?.nameRu;

  const remainingFree = standardUsed !== null ? Math.max(0, 3 - standardUsed) : null;
  const balanceHint =
    !isPro && remainingFree !== null
      ? remainingFree === 3
        ? "(3 бесплатно)"
        : remainingFree > 0
          ? `(осталось ${remainingFree} из 3)`
          : null
      : null;

  return (
    <div className="max-w-4xl mx-auto overflow-x-clip">
      <AnimatePresence mode="wait">
        {/* ─── Step: Form ─── */}
        {step === "form" && (
          <PageTransition id="form" className="space-y-6">
            {/* Title / subtitle */}
            <div>
              <h1 className="text-3xl font-bold mb-2 text-[#0D0D14]">Создать карусель</h1>
              <p className="text-muted-foreground">
                Введи текст, идею или тему — AI создаст готовую карусель
              </p>
            </div>

            {/* Welcome banner for new users */}
            {!isPro && standardUsed === 0 && standardUsed !== null && (
              <div className="rounded-2xl bg-[#0D0D14] text-white p-5">
                <p className="text-sm font-semibold text-[#D4F542] mb-3 uppercase tracking-wider">👋 Как это работает</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-2xl font-bold text-[#D4F542]">1</span>
                    <p className="text-sm text-white/80">Вставь тему, идею или текст</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-2xl font-bold text-[#D4F542]">2</span>
                    <p className="text-sm text-white/80">Выбери шаблон и нажми «Создать»</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-2xl font-bold text-[#D4F542]">3</span>
                    <p className="text-sm text-white/80">Скачай слайды и публикуй</p>
                  </div>
                </div>
              </div>
            )}

            {/* Email verification banner */}
            {emailUnverified && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-900">Подтверди email перед генерацией</p>
                  <p className="text-sm text-amber-700 mt-0.5">
                    Мы отправили письмо на <span className="font-medium">{userEmail}</span>. Кликни по ссылке в письме — и сможешь генерировать.
                  </p>
                  {!resendSent ? (
                    <button
                      onClick={handleResendVerification}
                      className="mt-2 text-sm font-medium text-amber-800 underline underline-offset-2 hover:text-amber-900 transition-colors"
                    >
                      Отправить письмо повторно
                    </button>
                  ) : (
                    <p className="mt-2 text-sm text-amber-700 font-medium">Письмо отправлено — проверь папку «Спам»</p>
                  )}
                </div>
              </div>
            )}

            {/* Outer two-column grid */}
            <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-6 lg:items-start space-y-5 lg:space-y-0">

              {/* LEFT COLUMN */}
              <div className="space-y-5">

                {/* A. Mode toggle */}
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
                    onClick={() => {
                      if (!PHOTO_MODE_BETA_EMAILS.includes(userEmail)) return;
                      setMode("photo");
                      setPreserveText(false);
                      if (slideCount > 7) setSlideCount(7);
                    }}
                    className={`relative flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                      PHOTO_MODE_BETA_EMAILS.includes(userEmail)
                        ? mode === "photo"
                          ? "border-[#D4F542] bg-[#D4F542]/5 shadow-sm"
                          : "border-[#E8E8E4] bg-white hover:border-[#D4F542]/40 hover:shadow-sm"
                        : "border-[#E8E8E4] bg-[#F9F9F8] opacity-75 cursor-not-allowed"
                    }`}
                  >
                    {/* "Скоро" badge — visible only to non-beta users */}
                    {!PHOTO_MODE_BETA_EMAILS.includes(userEmail) && (
                      <span className="absolute top-2 right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#0D0D14] text-[#D4F542] leading-none">
                        Скоро
                      </span>
                    )}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${mode === "photo" ? "bg-[#D4F542]/20" : "bg-[#F0F0ED]"}`}>
                      <Camera className={`h-4 w-4 ${mode === "photo" ? "text-[#0D0D14]" : "text-[#6B7280]"}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${mode === "photo" ? "text-[#0D0D14]" : "text-[#374151]"}`}>AI Фото</p>
                      <p className="text-xs text-[#9CA3AF] mt-0.5">Фото на каждом слайде</p>
                    </div>
                  </button>
                </div>

                {/* B. Input mode toggle (video/text) */}
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
                    onClick={() => { setInputMode("video"); setPreserveText(false); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      inputMode === "video"
                        ? "bg-white shadow-sm text-[#0D0D14] font-semibold"
                        : "text-[#9CA3AF] hover:text-[#374151]"
                    }`}
                  >
                    🔗 Видео
                  </button>
                </div>

                {/* C. Main text input area */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#0D0D14]">
                    {mode === "photo" ? "Тема карусели" : "Текст или идея"}
                  </label>

                  {/* Video input */}
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

                  {/* Text input */}
                  {inputMode === "text" && (
                    <div className="space-y-3">
                      <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={
                          mode === "photo"
                            ? "Опиши тему карусели — AI сгенерирует изображения и короткий текст..."
                            : preserveText
                              ? "Вставь готовый текст — формулировки останутся твоими, ИИ только разобьёт на слайды и выделит заголовки..."
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
                </div>

                {/* D. Brief field — standard mode only, when not preserving text */}
                {mode === "standard" && !preserveText && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#0D0D14]">
                      Бриф <span className="text-[#9CA3AF] font-normal">(опционально)</span>
                    </label>
                    <textarea
                      value={brief}
                      onChange={(e) => setBrief(e.target.value)}
                      placeholder="Для кого, ключевые акценты, пожелания по тону..."
                      rows={2}
                      className="w-full rounded-2xl border border-[#E8E8E4] bg-white px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#D4F542] focus:border-transparent transition-all placeholder:text-[#9CA3AF]"
                    />
                  </div>
                )}

                {/* E. Preserve text toggle — standard mode only */}
                {mode === "standard" && (
                  <div className="flex rounded-xl border border-[#E8E8E4] bg-[#F8F8F6] p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => setPreserveText(false)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        !preserveText
                          ? "bg-white shadow-sm text-[#0D0D14] font-semibold"
                          : "text-[#9CA3AF] hover:text-[#374151]"
                      }`}
                    >
                      ✨ ИИ перепишет
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreserveText(true)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        preserveText
                          ? "bg-white shadow-sm text-[#0D0D14] font-semibold"
                          : "text-[#9CA3AF] hover:text-[#374151]"
                      }`}
                    >
                      ✏️ Мой текст
                    </button>
                  </div>
                )}

                {/* H. User photo upload — Standard mode, PRO only */}
                {mode === "standard" && isPro && (
                  <FadeIn className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#0D0D14]">Свои фото</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#D4F542] text-[#0D0D14]">PRO</span>
                      <span className="text-xs text-[#9CA3AF]">опционально</span>
                    </div>

                    {uploadedPhotos.length > 0 ? (
                      <div className="space-y-3">
                        {/* Thumbnails */}
                        <div className="flex flex-wrap gap-2">
                          {uploadedPhotos.map((url, i) => (
                            <div key={url} className="relative">
                              <img
                                src={url}
                                alt={`Фото ${i + 1}`}
                                className="w-16 h-16 object-cover rounded-xl border border-[#E8E8E4]"
                              />
                              <button
                                type="button"
                                aria-label={`Удалить фото ${i + 1}`}
                                onClick={() => handleRemoveUserPhoto(i)}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#0D0D14] text-white flex items-center justify-center shadow hover:bg-red-500 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                              <span className="absolute bottom-0.5 left-0 right-0 text-center text-[8px] font-bold text-white/80">{i + 1}</span>
                            </div>
                          ))}
                          {/* Add more button */}
                          {uploadedPhotos.length < 12 && (
                            <button
                              type="button"
                              aria-label="Добавить ещё фото"
                              onClick={() => userPhotoInputRef.current?.click()}
                              className="w-16 h-16 rounded-xl border-2 border-dashed border-[#E8E8E4] flex items-center justify-center hover:border-[#D4F542]/50 transition-colors text-[#9CA3AF] hover:text-[#0D0D14]"
                            >
                              <Upload className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        {/* Distribution hint */}
                        {uploadedPhotos.length < slideCount && (
                          <p className="text-xs text-[#9CA3AF]">
                            {uploadedPhotos.length} из {slideCount} слайдов получат фото — остальные на тёмном фоне
                          </p>
                        )}
                        {uploadedPhotos.length >= slideCount && (
                          <p className="text-xs text-[#6B7280]">
                            ✓ {uploadedPhotos.length} фото → {slideCount} слайдов, шаблон не нужен
                          </p>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => userPhotoInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleUserPhotoDrop}
                        className={`w-full h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                          isDragging
                            ? "border-[#D4F542] bg-[#D4F542]/10 scale-[1.02]"
                            : "border-[#E8E8E4] hover:border-[#D4F542]/50 bg-[#F8F8F6] hover:bg-[#F5F5F2]"
                        }`}
                      >
                        <Upload className="h-5 w-5 text-[#9CA3AF]" />
                        <div className="text-center">
                          <p className="text-sm font-medium text-[#374151]">
                            {isDragging ? "Отпусти фото" : "Загрузи свои фото"}
                          </p>
                          <p className="text-xs text-[#9CA3AF]">до 12 файлов · JPG, PNG, WebP · макс. 10 МБ</p>
                        </div>
                      </button>
                    )}

                    <input
                      ref={userPhotoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handleUserPhotosChange}
                      className="hidden"
                    />
                  </FadeIn>
                )}

                {/* F. Image style selector — photo mode only */}
                {mode === "photo" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#0D0D14]">Стиль изображений</label>
                    <div className="flex rounded-xl border border-[#E8E8E4] bg-[#F8F8F6] p-1 gap-1">
                      {IMAGE_STYLES.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setImageStyle(s.id)}
                          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            imageStyle === s.id
                              ? "bg-white shadow-sm text-[#0D0D14] font-semibold"
                              : "text-[#9CA3AF] hover:text-[#374151]"
                          }`}
                        >
                          <span>{s.label}</span>
                          <span className="text-[10px] font-normal text-[#9CA3AF] hidden sm:block">{s.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* G. Photo upload area — photo mode only */}
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

              </div>
              {/* END LEFT COLUMN */}

              {/* RIGHT COLUMN */}
              <div className="space-y-4">

                {/* Slide count */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0D0D14]">Слайдов</label>
                  <div className="flex gap-2 flex-wrap">
                    {SLIDE_COUNTS.filter((count) => mode === "photo" ? count <= 7 : true).map((count) => {
                      const isLocked = !isPro && PRO_SLIDE_COUNTS.includes(count);
                      return (
                        <button
                          key={count}
                          onClick={() => {
                            if (isLocked) {
                              toast("Нужен PRO", { description: `${count} слайдов доступны на PRO тарифе` });
                              return;
                            }
                            setSlideCount(count);
                          }}
                          className={`flex items-center gap-1 px-4 h-10 rounded-xl border-2 text-sm font-medium transition-all ${
                            slideCount === count
                              ? "border-[#D4F542] bg-[#D4F542]/10 text-[#0D0D14]"
                              : "border-[#E8E8E4] bg-white text-[#374151] hover:border-[#D4F542]/40"
                          }`}
                        >
                          {count}
                          {isLocked && <Lock className="h-3 w-3 text-[#9CA3AF]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tone (standard mode only) */}
                {mode === "standard" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#0D0D14]">Тон</label>
                    <div className="grid grid-cols-2 gap-2">
                      {TONES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTone(t.id)}
                          className={`flex items-center gap-2 px-3 h-11 rounded-xl border-2 text-sm font-medium transition-all text-left ${
                            tone === t.id
                              ? "border-[#D4F542] bg-[#D4F542]/10 text-[#0D0D14]"
                              : "border-[#E8E8E4] bg-white text-[#374151] hover:border-[#D4F542]/40"
                          }`}
                        >
                          <span>{t.emoji}</span>
                          <span>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Format */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0D0D14]">Формат</label>
                  <div className="grid grid-cols-2 gap-2">
                    {FORMATS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFormat(f.id)}
                        className={`flex flex-col items-center justify-center gap-0.5 h-14 rounded-xl border-2 transition-all ${
                          format === f.id
                            ? "border-[#D4F542] bg-[#D4F542]/10"
                            : "border-[#E8E8E4] bg-white hover:border-[#D4F542]/40"
                        }`}
                      >
                        <span className="text-xs font-semibold text-[#0D0D14]">{f.label}</span>
                        <span className="text-[10px] text-[#9CA3AF]">{f.size}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Desktop CTA — hidden on mobile (mobile has sticky bottom bar) */}
                <div className="hidden lg:block pt-2">
                  <Button
                    onClick={() => skipTemplate ? handleGenerate() : setStep("template")}
                    disabled={!text.trim() || (mode === "photo" && !referencePhoto)}
                    className="w-full h-12 text-base font-semibold bg-[#0D0D14] hover:bg-[#1a1a2e] text-white rounded-2xl gap-2"
                  >
                    {!skipTemplate ? (
                      <>
                        <ArrowRight className="h-4 w-4" />
                        Выбрать шаблон{balanceHint ? ` ${balanceHint}` : ""}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Создать карусель{balanceHint ? ` ${balanceHint}` : ""}
                      </>
                    )}
                  </Button>
                </div>

              </div>

            </div>
            {/* END outer grid */}

            {/* Mobile sticky CTA — hidden on desktop */}
            <div className="sticky bottom-0 lg:hidden bg-white/95 backdrop-blur-sm border-t border-[#E8E8E4] -mx-6 px-6 py-4 mt-4">
              <Button
                onClick={() => skipTemplate ? handleGenerate() : setStep("template")}
                disabled={!text.trim() || (mode === "photo" && !referencePhoto)}
                className="w-full h-12 text-base font-semibold bg-[#0D0D14] hover:bg-[#1a1a2e] text-white rounded-2xl gap-2"
              >
                {!skipTemplate ? (
                  <>
                    <ArrowRight className="h-4 w-4" />
                    Выбрать шаблон{balanceHint ? ` ${balanceHint}` : ""}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Создать карусель{balanceHint ? ` ${balanceHint}` : ""}
                  </>
                )}
              </Button>
            </div>

          </PageTransition>
        )}

        {/* ─── Step: Template ─── */}
        {step === "template" && (
          <PageTransition id="template" className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep("form")}
                className="w-9 h-9 rounded-xl flex items-center justify-center border border-border hover:bg-muted transition-colors shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-[#0D0D14]">Выбери шаблон</h1>
                <p className="text-sm text-muted-foreground">Стиль для твоей карусели</p>
              </div>
            </div>

            {/* Template grid with real slide previews */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {templates
                .filter((t) => t.id !== "photo_mode")
                .map((t) => {
                  const isSelected = selectedTemplate === t.id;
                  const locked = !isPro && (PRO_ONLY_TEMPLATE_IDS as readonly string[]).includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        if (locked) {
                          toast("Нужен PRO для этого шаблона", {
                            description: "Перейди на PRO, чтобы разблокировать",
                          });
                          return;
                        }
                        setSelectedTemplate(t.id);
                      }}
                      className={`relative rounded-2xl overflow-hidden border-2 transition-all active:scale-[0.97] text-left flex flex-col ${
                        isSelected && !locked
                          ? "border-[#D4F542] shadow-[0_0_0_3px_rgba(212,245,66,0.25)]"
                          : locked
                            ? "border-border opacity-60"
                            : "border-border hover:border-[#D4F542]/50"
                      }`}
                    >
                      {/* Preview area — fills card width, centers the scaled slide */}
                      <div className="flex justify-center items-center bg-[#F0F0EE] w-full py-2">
                        <SlideRenderer
                          template={t.id}
                          scale={0.165}
                          slide={DUMMY_SLIDE}
                          slideNumber={1}
                          totalSlides={5}
                          format={format as "square" | "portrait"}
                        />
                      </div>
                      <div
                        className={`px-2 py-1.5 text-[11px] font-semibold text-center truncate w-full ${
                          isSelected && !locked
                            ? "bg-[#D4F542] text-[#0D0D14]"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {t.nameRu}
                      </div>
                      {isSelected && !locked && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#D4F542] flex items-center justify-center">
                          <Check className="h-3 w-3 text-[#0D0D14]" />
                        </div>
                      )}
                      {locked && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-black/40 flex items-center justify-center">
                          <Lock className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>

            {/* Sticky CTA */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-[#E8E8E4] -mx-6 px-6 py-4 mt-4">
              <Button
                onClick={handleGenerate}
                className="w-full h-12 text-base font-semibold bg-[#0D0D14] hover:bg-[#1a1a2e] text-white rounded-2xl gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Создать карусель
              </Button>
            </div>
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
                  <p className="text-xs text-muted-foreground mt-2 tabular-nums">
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
                  className="rounded-full active:scale-[0.98] transition-all gap-1.5"
                  onClick={() => setShowTemplateSwitcher(true)}
                >
                  <Layers className="h-3.5 w-3.5" />
                  Сменить шаблон
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
              {showUpgradeBanner && (
                <div className="rounded-2xl border border-[#D4F542]/40 bg-[#D4F542]/8 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-[#0D0D14]">
                      🎉 Первая карусель готова!
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {remainingFree !== null && remainingFree > 0
                        ? `У тебя осталось ${remainingFree} бесплатных генераций.`
                        : "Бесплатные генерации закончились."}
                      {" "}С PRO — безлимит за 990₽/мес.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="rounded-xl bg-[#0D0D14] hover:bg-[#1a1a2e] text-white font-semibold shrink-0 whitespace-nowrap"
                    asChild
                  >
                    <a href="/dashboard/pricing">Попробовать PRO →</a>
                  </Button>
                </div>
              )}
            </div>

            {/* Slide preview + inline edit */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 min-w-0">
              {/* Left: slide preview */}
              <FadeIn delay={0.1} className="space-y-4 min-w-0">
                <div className="flex justify-center">
                  <SlideRenderer
                    template={activeTemplate}
                    scale={slideScale}
                    slide={result.slides[currentSlide]}
                    slideNumber={currentSlide + 1}
                    totalSlides={result.slides.length}
                    format={format as "square" | "portrait"}
                    showWatermark={!isPro}
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
                <div className="flex gap-3 overflow-x-auto pb-2">
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
                        showWatermark={!isPro}
                      />
                    </button>
                  ))}
                </div>
              </FadeIn>

              {/* Right: inline text editor */}
              <FadeIn delay={0.2} className="space-y-4 min-w-0">
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
              showWatermark={!isPro}
            />
          </PageTransition>
        )}
      </AnimatePresence>

      {/* TemplateSwitcher — available from both form and result steps */}
      {showTemplateSwitcher && (
        <TemplateSwitcher
          currentTemplate={activeTemplate}
          slides={result?.slides ?? []}
          format={format as "square" | "portrait"}
          onSelect={(id) => { setSelectedTemplate(id); if (mode === "photo") setMode("standard"); }}
          onClose={() => setShowTemplateSwitcher(false)}
          isPro={isPro}
        />
      )}
    </div>
  );
}

export default function GeneratePageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-[#D4F542]" /></div>}>
      <GeneratePage />
    </Suspense>
  );
}
