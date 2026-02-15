"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ProButtonProps {
  productId: string;
  label?: string;
}

export function ProButton({ productId, label = "Перейти на PRO" }: ProButtonProps) {
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
        // Not logged in — redirect to signup first
        router.push("/signup");
        return;
      }

      if (!res.ok) {
        alert(data.error || "Ошибка при создании платежа");
        return;
      }

      // Redirect to YooKassa payment page
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
      className="w-full rounded-full bg-[var(--swipely-blue)] hover:bg-[var(--swipely-blue-dark)]"
      size="lg"
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
