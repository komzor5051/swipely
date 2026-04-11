"use client";

import { useState } from "react";

const DEFAULT_MESSAGE = `🚀 <b>Swipely теперь на сайте!</b>

Создавай карусели прямо в браузере — без бота, удобнее и быстрее.

🎁 Специально для тебя — <b>скидка 50%</b> на PRO подписку:
👉 <a href="https://swipely.ru/pricing">swipely.ru/pricing</a>

Промокод при оплате: <code>WELCOME50</code>`;

export function BroadcastSection({ telegramCount }: { telegramCount: number }) {
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const handleSend = async () => {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    setSending(true);
    setError("");
    setResult(null);
    setConfirmed(false);

    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E8E8E4] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-[#0D0D14]">Рассылка в Telegram</h2>
          <p className="text-sm text-[#6B7280] mt-0.5">
            {telegramCount} пользователей с Telegram ID
          </p>
        </div>
        {result && (
          <div className="text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-1.5">
            ✓ Отправлено {result.sent} / {result.total} · Ошибок {result.failed}
          </div>
        )}
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={8}
        className="w-full rounded-xl border border-[#E8E8E4] p-3.5 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-[#D4F542] focus:border-[#D4F542]"
        disabled={sending}
      />

      <p className="text-xs text-[#9CA3AF]">
        Поддерживается HTML: <code>&lt;b&gt;</code>, <code>&lt;i&gt;</code>, <code>&lt;a href=&quot;...&quot;&gt;</code>, <code>&lt;code&gt;</code>
      </p>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>
      )}

      <button
        onClick={handleSend}
        disabled={sending || !message.trim()}
        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
          confirmed
            ? "bg-red-500 text-white hover:bg-red-600"
            : "bg-[#1E1E1E] text-white hover:bg-[#2e2e2e]"
        }`}
      >
        {sending
          ? "Отправляем..."
          : confirmed
          ? `⚠ Подтвердить отправку ${telegramCount} сообщений`
          : "Отправить рассылку"}
      </button>
      {confirmed && (
        <p className="text-xs text-[#9CA3AF]">
          Нажми ещё раз для подтверждения. Отменить нельзя.
        </p>
      )}
    </div>
  );
}
