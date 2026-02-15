"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Profile } from "@/lib/supabase/queries";
import { CreditCard, User, MessageSquare, Loader2, Globe, Sparkles } from "lucide-react";
import Link from "next/link";
import { FadeIn, StaggerList, StaggerItem } from "@/components/ui/motion";
import { toast } from "sonner";

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [username, setUsername] = useState("");
  const [tovGuidelines, setTovGuidelines] = useState("");
  const [tovProfile, setTovProfile] = useState<Record<string, string> | null>(null);
  const [tovUrl, setTovUrl] = useState("");
  const [tovAnalyzing, setTovAnalyzing] = useState(false);
  const [tovError, setTovError] = useState("");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        const p = data as Profile;
        setProfile(p);
        setFirstName(p.first_name || "");
        setUsername(p.username || "");
        setTovGuidelines(p.tov_guidelines || "");
        if (p.tov_profile && typeof p.tov_profile === 'object') {
          setTovProfile(p.tov_profile as unknown as Record<string, string>);
        }
      }
      setLoading(false);
    };

    load();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName,
        username,
        tov_guidelines: tovGuidelines,
      })
      .eq("id", profile.id);

    setSaving(false);
    if (!error) {
      toast.success("Настройки сохранены");
    } else {
      toast.error("Ошибка сохранения");
    }
  };

  const handleTovAnalyze = async () => {
    if (!tovUrl.trim()) return;
    setTovAnalyzing(true);
    setTovError("");

    try {
      const res = await fetch("/api/tov/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: tovUrl.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setTovProfile(data.profile);
      setTovGuidelines(data.guidelines);
      setTovUrl("");
      toast.success("Стиль проанализирован");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setTovError(message);
      toast.error(message);
    } finally {
      setTovAnalyzing(false);
    }
  };

  const tier = profile?.subscription_tier || "free";

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
        <div className="h-64 bg-muted rounded-2xl animate-pulse" />
        <div className="h-48 bg-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <FadeIn>
        <h1 className="text-2xl font-bold mb-1">Настройки</h1>
        <p className="text-muted-foreground">Управление аккаунтом и профилем</p>
      </FadeIn>

      {/* Profile */}
      <FadeIn delay={0.1}>
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[var(--swipely-blue)]/10 flex items-center justify-center">
              <User className="h-5 w-5 text-[var(--swipely-blue)]" />
            </div>
            <div>
              <h2 className="font-semibold">Профиль</h2>
              <p className="text-xs text-muted-foreground">
                Данные для карусели и водяного знака
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Имя</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Как к тебе обращаться"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">
                @username{" "}
                <span className="text-muted-foreground font-normal">
                  (для водяного знака)
                </span>
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@your_instagram"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile?.email || ""}
                disabled
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                Email нельзя изменить
              </p>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* TOV */}
      <FadeIn delay={0.2}>
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[var(--swipely-lime)]/20 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-[var(--swipely-charcoal)]" />
            </div>
            <div>
              <h2 className="font-semibold">Tone of Voice</h2>
              <p className="text-xs text-muted-foreground">
                AI адаптирует тексты под твой стиль
              </p>
            </div>
          </div>

          {/* URL Analysis */}
          <div className="space-y-3">
            <Label>Анализ по ссылке</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={tovUrl}
                  onChange={(e) => setTovUrl(e.target.value)}
                  placeholder="https://t.me/channel или URL сайта"
                  className="pl-9 rounded-xl"
                  disabled={tovAnalyzing}
                  onKeyDown={(e) => e.key === "Enter" && handleTovAnalyze()}
                />
              </div>
              <Button
                onClick={handleTovAnalyze}
                disabled={!tovUrl.trim() || tovAnalyzing}
                size="sm"
                className="rounded-xl bg-[var(--swipely-blue)] hover:bg-[var(--swipely-blue-dark)] active:scale-[0.98] transition-all"
              >
                {tovAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </Button>
            </div>
            {tovError && (
              <p className="text-xs text-destructive">{tovError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Вставь ссылку — AI проанализирует стиль и обновит профиль
            </p>
          </div>

          {/* Profile metrics — responsive grid */}
          {tovProfile && (
            <StaggerList className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { label: "Тон", key: "tone" },
                { label: "Предложения", key: "sentence_length" },
                { label: "Язык", key: "language_level" },
                { label: "Словарь", key: "vocabulary_style" },
                { label: "Формат", key: "formatting_style" },
                { label: "Эмодзи", key: "emoji_usage" },
              ].map((item) => (
                <StaggerItem key={item.key}>
                  <div className="p-3 rounded-xl bg-muted/50 text-center hover:bg-muted/80 transition-colors">
                    <p className="text-[10px] text-muted-foreground mb-0.5">{item.label}</p>
                    <p className="text-xs font-medium">{tovProfile[item.key] || "—"}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerList>
          )}

          {/* Guidelines textarea */}
          <div className="space-y-2">
            <Label htmlFor="tov">Описание стиля</Label>
            <textarea
              id="tov"
              value={tovGuidelines}
              onChange={(e) => setTovGuidelines(e.target.value)}
              placeholder="Опиши свой стиль общения: формальный/неформальный, серьёзный/лёгкий, экспертный/дружеский. AI будет адаптировать тексты под твой стиль."
              className="w-full h-28 rounded-xl border border-border bg-card p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--swipely-blue)]/50 focus:border-[var(--swipely-blue)] transition-all"
            />
            <p className="text-xs text-muted-foreground">
              {tovProfile ? "Автоматически заполнено из анализа. Можно отредактировать." : "AI будет учитывать этот стиль при генерации текстов"}
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Subscription */}
      <FadeIn delay={0.3}>
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="font-semibold">Подписка</h2>
              <p className="text-xs text-muted-foreground">
                Текущий тариф и управление
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
            <div>
              <p className="font-semibold">
                {tier === "pro" ? "PRO" : "Бесплатный"}
              </p>
              <p className="text-sm text-muted-foreground">
                {tier === "pro"
                  ? `990₽/мес · до ${
                      profile?.subscription_end
                        ? new Date(profile.subscription_end).toLocaleDateString(
                            "ru-RU"
                          )
                        : "—"
                    }`
                  : "3 карусели в месяц"}
              </p>
            </div>
            <Link href="/pricing">
              <Button variant="outline" size="sm" className="rounded-full active:scale-[0.98] transition-all">
                {tier === "pro" ? "Управление" : "Перейти на PRO"}
              </Button>
            </Link>
          </div>
        </div>
      </FadeIn>

      {/* Save */}
      <FadeIn delay={0.35}>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="rounded-full px-8 bg-[var(--swipely-blue)] hover:bg-[var(--swipely-blue-dark)] active:scale-[0.98] transition-all"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Сохраняем...
            </>
          ) : (
            "Сохранить изменения"
          )}
        </Button>
      </FadeIn>
    </div>
  );
}
