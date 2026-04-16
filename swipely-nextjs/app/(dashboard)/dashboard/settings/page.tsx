"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Profile } from "@/lib/supabase/queries";
import { CreditCard, User, MessageSquare, Loader2, Globe, Sparkles, Maximize2 } from "lucide-react";
import Link from "next/link";
import { FadeIn, StaggerList, StaggerItem } from "@/components/ui/motion";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [username, setUsername] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [tovGuidelines, setTovGuidelines] = useState("");
  const [tovProfile, setTovProfile] = useState<Record<string, string> | null>(null);
  const [tovUrl, setTovUrl] = useState("");
  const [tovAnalyzing, setTovAnalyzing] = useState(false);
  const [tovError, setTovError] = useState("");
  const [tovOpen, setTovOpen] = useState(false);

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
        setTelegramUsername(p.telegram_username || "");
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
    const updates: Record<string, unknown> = {
      first_name: firstName,
      username,
      telegram_username: telegramUsername || null,
      tov_guidelines: tovGuidelines,
    };
    if (tovProfile) {
      updates.tov_profile = tovProfile;
    }

    const { error } = await supabase
      .from("profiles")
      .update(updates)
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
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="h-8 bg-muted rounded w-1/4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-64 bg-muted rounded-2xl animate-pulse" />
          <div className="h-64 bg-muted rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      {/* Header */}
      <FadeIn className="mb-5">
        <h1 className="text-3xl font-bold mb-0.5 text-[#0D0D14]">Настройки</h1>
        <p className="text-muted-foreground">Управление аккаунтом и профилем</p>
      </FadeIn>

      {/* Two-column grid: Profile + TOV */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1 min-h-0">
        {/* Profile */}
        <FadeIn delay={0.1}>
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4 h-full flex flex-col">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#D4F542]/20 flex items-center justify-center">
                <User className="h-[18px] w-[18px] text-[#0D0D14]" />
              </div>
              <div>
                <h2 className="font-semibold">Профиль</h2>
                <p className="text-xs text-muted-foreground">
                  Данные для карусели и водяного знака
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">Имя</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Как к тебе обращаться"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="username">@username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="@your_instagram"
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile?.email || ""}
                    disabled
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telegramUsername">Telegram</Label>
                  <Input
                    id="telegramUsername"
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value.replace(/^@/, ""))}
                    placeholder="@username"
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Subscription — inline */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/50 border border-border mt-auto">
              <div className="flex items-center gap-2.5">
                <CreditCard className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm font-semibold">
                    {tier === "pro" ? "PRO" : "Бесплатный"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tier === "pro"
                      ? `до ${
                          profile?.subscription_end
                            ? new Date(profile.subscription_end).toLocaleDateString("ru-RU")
                            : "—"
                        }`
                      : "3 карусели/мес"}
                  </p>
                </div>
              </div>
              <Link href="/pricing">
                <Button variant="outline" size="sm" className="rounded-full active:scale-[0.98] transition-all">
                  {tier === "pro" ? "Управление" : "PRO"}
                </Button>
              </Link>
            </div>
          </div>
        </FadeIn>

        {/* TOV */}
        <FadeIn delay={0.15}>
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4 h-full flex flex-col">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--swipely-lime)]/20 flex items-center justify-center">
                <MessageSquare className="h-[18px] w-[18px] text-[var(--swipely-charcoal)]" />
              </div>
              <div>
                <h2 className="font-semibold">Tone of Voice</h2>
                <p className="text-xs text-muted-foreground">
                  AI адаптирует тексты под твой стиль
                </p>
              </div>
            </div>

            {/* URL Analysis */}
            <div className="space-y-2">
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
                  className="rounded-xl h-9 w-9 p-0 bg-[#D4F542] text-[#0D0D14] hover:bg-[#c8e83a] active:scale-[0.98] transition-all font-semibold"
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
            </div>

            {/* Profile metrics */}
            {tovProfile && (
              <StaggerList className="grid grid-cols-3 gap-2">
                {[
                  { label: "Тон", key: "tone" },
                  { label: "Предложения", key: "sentence_length" },
                  { label: "Язык", key: "language_level" },
                  { label: "Словарь", key: "vocabulary_style" },
                  { label: "Формат", key: "formatting_style" },
                  { label: "Эмодзи", key: "emoji_usage" },
                ].map((item) => (
                  <StaggerItem key={item.key}>
                    <div className="py-2 px-2 rounded-xl bg-muted/50 text-center">
                      <p className="text-[10px] text-muted-foreground">{item.label}</p>
                      <p className="text-xs font-medium truncate">{tovProfile[item.key] || "—"}</p>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerList>
            )}

            {/* Guidelines preview + expand button */}
            <button
              onClick={() => setTovOpen(true)}
              className="flex-1 flex flex-col rounded-xl border border-[#E8E8E4] bg-muted/30 p-3.5 text-left hover:border-[#D4F542]/40 hover:bg-muted/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-muted-foreground">Описание стиля</span>
                <Maximize2 className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-[#0D0D14] transition-colors" />
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                {tovGuidelines || "Нажми, чтобы описать свой стиль общения..."}
              </p>
            </button>
          </div>
        </FadeIn>
      </div>

      {/* Save — always visible at bottom */}
      <FadeIn delay={0.2} className="pt-5 flex justify-center">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="rounded-full px-10 bg-[#D4F542] text-[#0D0D14] hover:bg-[#c8e83a] active:scale-[0.98] transition-all font-semibold"
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

      {/* TOV Guidelines Dialog */}
      <Dialog open={tovOpen} onOpenChange={setTovOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Описание стиля</DialogTitle>
            <DialogDescription>
              Опиши свой стиль общения — AI будет адаптировать тексты карусели под него
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={tovGuidelines}
            onChange={(e) => setTovGuidelines(e.target.value)}
            placeholder="Например: формальный/неформальный, серьёзный/лёгкий, экспертный/дружеский. Используй ли ты эмодзи? Длинные или короткие предложения? Профессиональный жаргон или простой язык?"
            className="w-full h-64 rounded-xl border border-[#E8E8E4] bg-background p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#D4F542]/60 focus:border-[#D4F542] transition-all"
            autoFocus
          />
          <div className="flex justify-end">
            <Button
              onClick={() => setTovOpen(false)}
              className="rounded-full px-6 bg-[#D4F542] text-[#0D0D14] hover:bg-[#c8e83a] active:scale-[0.98] transition-all font-semibold"
            >
              Готово
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
