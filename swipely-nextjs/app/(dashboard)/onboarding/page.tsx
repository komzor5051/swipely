"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Loader2,
  Globe,
  MessageSquare,
  ArrowRight,
  Check,
} from "lucide-react";

interface TovProfileData {
  sentence_length: string;
  emoji_usage: string;
  tone: string;
  language_level: string;
  vocabulary_style: string;
  formatting_style: string;
  source_url: string;
  analyzed_at: string;
}

interface AnalysisResult {
  profile: TovProfileData;
  guidelines: string;
  saved: boolean;
}

const TONE_LABELS: Record<string, string> = {
  professional: "Профессиональный",
  professional_friendly: "Профессионально-дружелюбный",
  casual: "Неформальный",
  enthusiastic: "Восторженный",
  provocative: "Провокационный",
};

const LENGTH_LABELS: Record<string, string> = {
  short: "Короткие",
  medium: "Средние",
  long: "Длинные",
};

const LEVEL_LABELS: Record<string, string> = {
  simple: "Простой",
  intermediate: "Средний",
  advanced: "Продвинутый",
};

const VOCAB_LABELS: Record<string, string> = {
  academic: "Академический",
  conversational: "Разговорный",
  slang: "Сленговый",
  modern_tech: "Современный/Tech",
};

const FORMAT_LABELS: Record<string, string> = {
  freeform: "Свободный",
  structured: "Структурированный",
  listicle: "Списки",
};

const EMOJI_LABELS: Record<string, string> = {
  none: "Не использует",
  minimal: "Минимально",
  moderate: "Умеренно",
  heavy: "Активно",
};

export default function OnboardingPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setAnalyzing(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/tov/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSkip = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user.id);
    }
    router.push("/dashboard");
  };

  const handleContinue = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user.id);
    }
    router.push("/generate");
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-[var(--swipely-blue)]/10 flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="h-8 w-8 text-[var(--swipely-blue)]" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Настрой свой стиль</h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Вставь ссылку на свой сайт, блог или Telegram-канал — AI проанализирует
          твой стиль и будет создавать карусели в твоём Tone of Voice
        </p>
      </div>

      {/* URL Input */}
      {!result && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://t.me/your_channel или URL сайта"
                className="pl-10 rounded-xl h-12"
                disabled={analyzing}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              />
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={!url.trim() || analyzing}
              className="rounded-xl h-12 px-6 bg-[var(--swipely-blue)] hover:bg-[var(--swipely-blue-dark)]"
            >
              {analyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Анализировать
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {analyzing && (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[var(--swipely-blue)]/10 flex items-center justify-center mx-auto animate-pulse">
                <Sparkles className="h-7 w-7 text-[var(--swipely-blue)]" />
              </div>
              <div>
                <p className="font-semibold">Анализируем контент...</p>
                <p className="text-sm text-muted-foreground">
                  Извлекаем текст и определяем стиль. Обычно 5-10 секунд.
                </p>
              </div>
            </div>
          )}

          <div className="text-center pt-4">
            <button
              onClick={handleSkip}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Пропустить и настроить позже
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-6">
          {/* Success header */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-700">Стиль определён!</p>
              <p className="text-sm text-green-600/80">
                Твой Tone of Voice сохранён и будет применяться ко всем генерациям
              </p>
            </div>
          </div>

          {/* ToV Profile Card */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
            <h3 className="font-semibold text-lg">Твой Tone of Voice</h3>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Тон", value: TONE_LABELS[result.profile.tone] || result.profile.tone },
                { label: "Предложения", value: LENGTH_LABELS[result.profile.sentence_length] || result.profile.sentence_length },
                { label: "Уровень языка", value: LEVEL_LABELS[result.profile.language_level] || result.profile.language_level },
                { label: "Словарь", value: VOCAB_LABELS[result.profile.vocabulary_style] || result.profile.vocabulary_style },
                { label: "Форматирование", value: FORMAT_LABELS[result.profile.formatting_style] || result.profile.formatting_style },
                { label: "Эмодзи", value: EMOJI_LABELS[result.profile.emoji_usage] || result.profile.emoji_usage },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-xl bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                  <p className="font-medium text-sm">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Text guidelines */}
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Описание стиля</p>
              <p className="text-sm leading-relaxed">{result.guidelines}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleContinue}
              className="flex-1 rounded-xl h-12 bg-[var(--swipely-blue)] hover:bg-[var(--swipely-blue-dark)]"
            >
              Создать первую карусель
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => { setResult(null); setUrl(""); }}
              className="rounded-xl h-12"
            >
              Другая ссылка
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
