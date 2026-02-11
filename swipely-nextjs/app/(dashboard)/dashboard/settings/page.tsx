"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Profile } from "@/lib/supabase/queries";
import { Check, CreditCard, User, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [username, setUsername] = useState("");
  const [tovGuidelines, setTovGuidelines] = useState("");

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
      }
      setLoading(false);
    };

    load();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setSaved(false);

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
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const tier = profile?.subscription_tier || "free";

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
        <div className="h-64 bg-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">Настройки</h1>
        <p className="text-muted-foreground">Управление аккаунтом и профилем</p>
      </div>

      {/* Profile */}
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

      {/* TOV */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[var(--swipely-lime)]/20 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-[var(--swipely-charcoal)]" />
          </div>
          <div>
            <h2 className="font-semibold">Tone of Voice</h2>
            <p className="text-xs text-muted-foreground">
              Настройки стиля для бренд-consistency
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tov">Описание стиля</Label>
          <textarea
            id="tov"
            value={tovGuidelines}
            onChange={(e) => setTovGuidelines(e.target.value)}
            placeholder="Опиши свой стиль общения: формальный/неформальный, серьёзный/лёгкий, экспертный/дружеский. AI будет адаптировать тексты под твой стиль."
            className="w-full h-28 rounded-xl border border-border bg-card p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--swipely-blue)] focus:border-transparent"
          />
          <p className="text-xs text-muted-foreground">
            AI будет учитывать этот стиль при генерации текстов
          </p>
        </div>
      </div>

      {/* Subscription */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
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
            <Button variant="outline" size="sm" className="rounded-full">
              {tier === "pro" ? "Управление" : "Перейти на PRO"}
            </Button>
          </Link>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="rounded-full px-8 bg-[var(--swipely-blue)] hover:bg-[var(--swipely-blue-dark)]"
        >
          {saving ? "Сохраняем..." : "Сохранить изменения"}
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <Check className="h-4 w-4" />
            Сохранено
          </span>
        )}
      </div>
    </div>
  );
}
