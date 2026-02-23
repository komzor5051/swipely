"use client";

import { useState } from "react";
import { Minus, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const PRICE_PER_SLIDE = 40;
const PRESETS = [5, 10, 20, 50];
const MIN = 1;
const MAX = 500;

interface CustomSlidePickerProps {
  /** "dark" — for use on dark backgrounds (public pricing page) */
  variant?: "light" | "dark";
}

export function CustomSlidePicker({ variant = "light" }: CustomSlidePickerProps) {
  const [qty, setQty] = useState(10);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isDark = variant === "dark";
  const total = qty * PRICE_PER_SLIDE;

  const clamp = (v: number) => Math.max(MIN, Math.min(MAX, v));

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value.replace(/\D/g, ""), 10);
    if (!isNaN(v)) setQty(clamp(v));
  };

  const handleBuy = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: "photo_custom", customSlides: qty }),
      });
      const data = await res.json();

      if (res.status === 401) {
        router.push("/login?redirect=/dashboard/pricing");
        return;
      }
      if (!res.ok) {
        alert(data.error || "Ошибка при создании платежа");
        return;
      }
      window.location.href = data.confirmationUrl;
    } catch {
      alert("Ошибка сети. Попробуйте позже.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn(
      "rounded-2xl border p-5 space-y-4",
      isDark
        ? "border-white/10 bg-white/4 backdrop-blur-sm"
        : "border-border bg-card"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className={cn("text-sm font-semibold", isDark ? "text-white" : "text-foreground")}>
            Купить любое количество
          </p>
          <p className={cn("text-xs mt-0.5", isDark ? "text-white/35" : "text-muted-foreground")}>
            {PRICE_PER_SLIDE}₽ за слайд · без минимума
          </p>
        </div>
        <div className={cn(
          "text-xs font-semibold px-2.5 py-1 rounded-full",
          isDark
            ? "bg-white/8 text-white/50"
            : "bg-muted text-muted-foreground"
        )}>
          1–{MAX} слайдов
        </div>
      </div>

      {/* Presets */}
      <div className="flex items-center gap-2 flex-wrap">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setQty(p)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold transition-all",
              qty === p
                ? isDark
                  ? "bg-[#D4F542] text-[#0D0D14]"
                  : "bg-foreground text-background"
                : isDark
                  ? "bg-white/8 text-white/50 hover:bg-white/12 hover:text-white/80"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Stepper + Total */}
      <div className="flex items-center gap-3">
        {/* Stepper */}
        <div className={cn(
          "flex items-center rounded-xl border overflow-hidden",
          isDark ? "border-white/10 bg-white/6" : "border-border bg-background"
        )}>
          <button
            onClick={() => setQty(clamp(qty - 1))}
            disabled={qty <= MIN}
            className={cn(
              "w-9 h-9 flex items-center justify-center transition-colors disabled:opacity-30",
              isDark
                ? "hover:bg-white/8 text-white/60"
                : "hover:bg-muted text-muted-foreground"
            )}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>

          <input
            type="text"
            inputMode="numeric"
            value={qty}
            onChange={handleInput}
            className={cn(
              "w-14 text-center text-sm font-bold bg-transparent outline-none border-x",
              isDark
                ? "border-white/10 text-white"
                : "border-border text-foreground"
            )}
          />

          <button
            onClick={() => setQty(clamp(qty + 1))}
            disabled={qty >= MAX}
            className={cn(
              "w-9 h-9 flex items-center justify-center transition-colors disabled:opacity-30",
              isDark
                ? "hover:bg-white/8 text-white/60"
                : "hover:bg-muted text-muted-foreground"
            )}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Total */}
        <div className="flex-1">
          <div className={cn("text-xs", isDark ? "text-white/30" : "text-muted-foreground")}>
            Итого
          </div>
          <div className={cn(
            "text-xl font-black leading-none",
            isDark ? "text-white" : "text-foreground"
          )} style={{ fontFamily: "var(--font-mono)" }}>
            {total.toLocaleString("ru-RU")}₽
          </div>
        </div>

        {/* Buy button */}
        <Button
          onClick={handleBuy}
          disabled={loading}
          size="sm"
          className={cn(
            "rounded-xl font-semibold px-5 h-9 border-0 shrink-0",
            isDark
              ? "bg-[#D4F542] hover:bg-[#c8e83a] text-[#0D0D14]"
              : "bg-foreground hover:bg-foreground/90 text-background"
          )}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            `Купить ${qty} сл.`
          )}
        </Button>
      </div>
    </div>
  );
}
