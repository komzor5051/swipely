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

export default function HistoryPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTemplate, setFilterTemplate] = useState<string>("");
  const [showFilter, setShowFilter] = useState(false);

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
            <h1 className="text-2xl font-bold mb-1">История</h1>
            <p className="text-muted-foreground">
              Все твои сгенерированные карусели
            </p>
          </div>
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full active:scale-[0.98] transition-all"
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
              className="rounded-2xl border border-border bg-card p-5"
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
                <Button className="rounded-full bg-[var(--swipely-blue)] hover:bg-[var(--swipely-blue-dark)] active:scale-[0.98] transition-all">
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
                  className="rounded-2xl border border-border bg-card p-5 hover:border-[var(--swipely-blue)]/20 hover:shadow-sm transition-all group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[var(--swipely-blue)]/10 flex items-center justify-center">
                        <span className="text-xs font-bold font-[family-name:var(--font-mono)] text-[var(--swipely-blue)]">
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
                      onClick={() => handleDelete(gen.id)}
                      className="opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive active:scale-90"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Preview text */}
                  <p className="text-sm line-clamp-3 mb-3">
                    {gen.input_text}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
                    <span>{formatDate(gen.created_at)}</span>
                    {gen.format && (
                      <span className="bg-muted px-2 py-0.5 rounded-full">
                        {gen.format}
                      </span>
                    )}
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </AnimatePresence>
        </StaggerList>
      )}
    </div>
  );
}
