"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProButtonProps {
  productId: string;
  label?: string;
  className?: string;
  size?: "sm" | "default" | "lg";
}

export function ProButton({ productId, label = "Перейти на PRO", className, size = "lg" }: ProButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePurchase = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      const data = await res.json();

      if (res.status === 401) {
        // Not logged in — redirect to login, then back to pricing
        router.push("/login?redirect=/pricing");
        return;
      }

      if (!res.ok) {
        alert(data.error || "Ошибка при создании платежа");
        return;
      }

      // Redirect to AuraPay payment page
      window.location.href = data.confirmationUrl;
    } catch {
      alert("Ошибка сети. Попробуйте позже.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePurchase}
      disabled={loading}
      className={cn(
        "w-full rounded-full bg-[var(--swipely-blue)] hover:bg-[var(--swipely-blue-dark)]",
        className
      )}
      size={size}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Создание платежа...
        </>
      ) : (
        label
      )}
    </Button>
  );
}
