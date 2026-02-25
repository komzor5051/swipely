"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { Generation } from "@/lib/supabase/queries";
import { templates } from "@/lib/templates/registry";
import {
  Clock,
  Sparkles,
  Trash2,
  Filter,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  Copy,
} from "lucide-react";
import Link from "next/link";
import {
  FadeIn,
  StaggerList,
  StaggerItem,
  AnimatePresence,
  motion,
} from "@/components/ui/motion";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import SlideRenderer from "@/components/slides/SlideRenderer";
import ExportPanel from "@/components/generate/ExportPanel";
import type { SlideData } from "@/components/slides/types";

export default function HistoryPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTemplate, setFilterTemplate] = useState<string>("");
  const [showFilter, setShowFilter] = useState(false);
  const [selected, setSelected] = useState<Generation | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    loadGenerations();
  }, [filterTemplate]);

  const loadGenerations = async () => {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    let query = supabase
      .from("generations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (filterTemplate) {
      query = query.eq("template", filterTemplate);
    }

    const { data } = await query;
    if (data) setGenerations(data as Generation[]);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase
      .from("generations")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    setGenerations((prev) => prev.filter((g) => g.id !== id));
    toast.success("Карусель удалена");
  };

  const getTemplateName = (id: string) => {
    if (id === "photo_mode") return "AI Фото";
    return templates.find((t) => t.id === id)?.nameRu || id;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "только что";
    if (diffMin < 60) return `${diffMin} мин назад`;
    if (diffHours < 24) return `${diffHours}ч назад`;
    if (diffDays < 7) return `${diffDays}д назад`;
    return date.toLocaleDateString("ru-RU");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1 text-[#0D0D14]">История</h1>
            <p className="text-muted-foreground">
              Все твои сгенерированные карусели
            </p>
          </div>
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className={`rounded-full active:scale-[0.98] transition-all ${filterTemplate ? "border-[#D4F542] text-[#0D0D14] bg-[#D4F542]/10 hover:bg-[#D4F542]/15" : ""}`}
              onClick={() => setShowFilter(!showFilter)}
            >
              <Filter className="mr-1 h-3.5 w-3.5" />
              {filterTemplate
                ? getTemplateName(filterTemplate)
                : "Фильтр"}
              <ChevronDown className={`ml-1 h-3.5 w-3.5 transition-transform duration-200 ${showFilter ? "rotate-180" : ""}`} />
            </Button>

            <AnimatePresence>
              {showFilter && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-card shadow-lg z-10 p-2 max-h-80 overflow-y-auto"
                >
                  <button
                    onClick={() => {
                      setFilterTemplate("");
                      setShowFilter(false);
                    }}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-muted transition-colors ${
                      !filterTemplate ? "bg-muted font-medium" : ""
                    }`}
                  >
                    Все шаблоны
                  </button>
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setFilterTemplate(t.id);
                        setShowFilter(false);
                      }}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-muted transition-colors ${
                        filterTemplate === t.id ? "bg-muted font-medium" : ""
                      }`}
                    >
                      {t.nameRu}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </FadeIn>

      {/* Content */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-[#E8E8E4] bg-white p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-3.5 bg-muted rounded w-2/3 animate-pulse" />
                  <div className="h-2.5 bg-muted rounded w-1/3 animate-pulse" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="h-3.5 bg-muted rounded w-full animate-pulse" />
                <div className="h-3.5 bg-muted rounded w-4/5 animate-pulse" />
                <div className="h-3.5 bg-muted rounded w-1/2 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : generations.length === 0 ? (
        <FadeIn>
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <Clock className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {filterTemplate ? "Ничего не найдено" : "Пока пусто"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {filterTemplate
                ? "Попробуй другой фильтр"
                : "Создай первую карусель и она появится здесь"}
            </p>
            {!filterTemplate && (
              <Link href="/generate">
                <Button className="rounded-full bg-[#D4F542] text-[#0D0D14] hover:bg-[#c8e83a] active:scale-[0.98] transition-all font-semibold">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Создать карусель
                </Button>
              </Link>
            )}
          </div>
        </FadeIn>
      ) : (
        <StaggerList className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {generations.map((gen) => (
              <StaggerItem
                key={gen.id}
                layout
              >
                <motion.div
                  layout
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => {
                    setSelected(gen);
                    setCurrentSlide(0);
                  }}
                  className="rounded-2xl border border-[#E8E8E4] bg-white overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer"
                >
                  {/* Slide preview thumbnail */}
                  {(() => {
                    const parsed = gen.output_json as { slides?: SlideData[] };
                    const firstSlide = parsed?.slides?.[0];
                    const fmt = (gen.format || "portrait") as "square" | "portrait";
                    if (!firstSlide) return null;
                    return (
                      <div className="flex justify-center bg-muted/30 py-4 border-b border-border">
                        <SlideRenderer
                          template={gen.template}
                          scale={0.18}
                          slide={firstSlide}
                          slideNumber={1}
                          totalSlides={gen.slide_count}
                          format={fmt}
                        />
                      </div>
                    );
                  })()}

                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#D4F542]/15 flex items-center justify-center">
                          <span className="text-xs font-bold font-[family-name:var(--font-mono)] text-[#0D0D14]">
                            {gen.slide_count}
                          </span>
                        </div>
                        <div>
                          <div className="text-xs font-medium">
                            {getTemplateName(gen.template)}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {gen.slide_count} слайдов
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(gen.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive active:scale-90"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Preview text */}
                    <p className="text-sm line-clamp-2 mb-2 text-muted-foreground">
                      {gen.input_text}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                      <span>{formatDate(gen.created_at)}</span>
                      {gen.format && (
                        <span className="bg-muted px-2 py-0.5 rounded-full">
                          {gen.format}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </AnimatePresence>
        </StaggerList>
      )}

      {/* ─── Carousel Preview Modal ─── */}
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        {selected && (() => {
          const parsed = selected.output_json as {
            slides?: SlideData[];
            post_caption?: string;
          };
          const slides = parsed?.slides ?? [];
          const postCaption = parsed?.post_caption ?? "";
          const fmt = (selected.format || "portrait") as "square" | "portrait";

          if (slides.length === 0) return null;

          return (
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {getTemplateName(selected.template)} &middot; {slides.length} слайдов
                </DialogTitle>
                <DialogDescription>{selected.input_text}</DialogDescription>
              </DialogHeader>

              {/* Slide preview */}
              <div className="flex flex-col items-center gap-4">
                <div className="flex justify-center">
                  <SlideRenderer
                    template={selected.template}
                    scale={fmt === "square" ? 0.45 : 0.4}
                    slide={slides[currentSlide]}
                    slideNumber={currentSlide + 1}
                    totalSlides={slides.length}
                    format={fmt}
                  />
                </div>

                {/* Nav arrows + dots */}
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentSlide === 0}
                    onClick={() => setCurrentSlide((prev) => prev - 1)}
                    className="active:scale-95 transition-all"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`rounded-full transition-all duration-300 ${
                        i === currentSlide
                          ? "w-6 h-2.5 bg-[#0D0D14]"
                          : "w-2.5 h-2.5 bg-muted-foreground/20 hover:bg-muted-foreground/40"
                      }`}
                    />
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentSlide === slides.length - 1}
                    onClick={() => setCurrentSlide((prev) => prev + 1)}
                    className="active:scale-95 transition-all"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Thumbnail strip */}
                <div className="flex gap-2 overflow-x-auto pb-1 justify-center">
                  {slides.map((slide, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`flex-shrink-0 rounded-lg border-2 overflow-hidden transition-all ${
                        i === currentSlide
                          ? "border-[#D4F542] shadow-lg shadow-[#D4F542]/20 scale-105"
                          : "border-[#E8E8E4] hover:border-[#D4F542]/40 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <SlideRenderer
                        template={selected.template}
                        scale={0.08}
                        slide={slide}
                        slideNumber={i + 1}
                        totalSlides={slides.length}
                        format={fmt}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Post caption */}
              {postCaption && (
                <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Подпись к посту
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 active:scale-95 transition-all"
                      onClick={() => {
                        navigator.clipboard.writeText(postCaption);
                        toast.success("Подпись скопирована");
                      }}
                    >
                      <Copy className="mr-1 h-3.5 w-3.5" />
                      Скопировать
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-6">
                    {postCaption}
                  </p>
                </div>
              )}

              {/* Export */}
              <div className="flex justify-center pt-2">
                <ExportPanel
                  slides={slides}
                  template={selected.template}
                  format={fmt}
                />
              </div>
            </DialogContent>
          );
        })()}
      </Dialog>
    </div>
  );
}
