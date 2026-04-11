"use client";

import { useState } from "react";

interface SlideInput {
  title: string;
  content: string;
}

const EMPTY_SLIDE: SlideInput = { title: "", content: "" };

export function BroadcastEditor({
  telegramCount,
}: {
  telegramCount: number;
}) {
  const [slides, setSlides] = useState<SlideInput[]>([
    { title: "", content: "" },
    { title: "", content: "" },
    { title: "", content: "" },
  ]);
  const [format, setFormat] = useState<"square" | "portrait">("square");
  const [caption, setCaption] = useState("");

  // Preview state
  const [previews, setPreviews] = useState<string[]>([]);
  const [rendering, setRendering] = useState(false);
  const [renderError, setRenderError] = useState("");

  // Send state
  const [broadcastId, setBroadcastId] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    sent: number;
    failed: number;
    total: number;
  } | null>(null);
  const [sendError, setSendError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const updateSlide = (idx: number, field: keyof SlideInput, value: string) => {
    setSlides((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
    // Reset previews when content changes
    setPreviews([]);
    setBroadcastId("");
  };

  const addSlide = () => {
    if (slides.length >= 10) return;
    setSlides((prev) => [...prev, { ...EMPTY_SLIDE }]);
    setPreviews([]);
  };

  const removeSlide = (idx: number) => {
    if (slides.length <= 1) return;
    setSlides((prev) => prev.filter((_, i) => i !== idx));
    setPreviews([]);
  };

  const filledSlides = slides.filter((s) => s.title.trim() || s.content.trim());

  // ── Render preview ──
  const handlePreview = async () => {
    if (!filledSlides.length) return;
    setRendering(true);
    setRenderError("");
    setPreviews([]);
    setBroadcastId("");

    try {
      const res = await fetch("/api/admin/broadcast/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides: filledSlides, format }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка рендера");
      setPreviews(data.image_urls);
      setBroadcastId(data.broadcastId);
    } catch (e) {
      setRenderError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setRendering(false);
    }
  };

  // ── Send broadcast ──
  const handleSend = async () => {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }

    setSending(true);
    setSendError("");
    setSendResult(null);
    setConfirmed(false);

    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_urls: previews,
          caption: caption.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка отправки");
      setSendResult(data);
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Slide editor ── */}
      <div className="bg-white rounded-2xl border border-[#E8E8E4] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-[#0D0D14]">Слайды</h2>
          <div className="flex items-center gap-3">
            <label className="text-sm text-[#6B7280]">Формат:</label>
            <select
              value={format}
              onChange={(e) => {
                setFormat(e.target.value as "square" | "portrait");
                setPreviews([]);
              }}
              className="text-sm border border-[#E8E8E4] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#D4F542]"
            >
              <option value="square">1080 x 1080</option>
              <option value="portrait">1080 x 1350</option>
            </select>
          </div>
        </div>

        {slides.map((slide, idx) => (
          <div
            key={idx}
            className="border border-[#E8E8E4] rounded-xl p-4 space-y-3 relative"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                Слайд {idx + 1}
              </span>
              {slides.length > 1 && (
                <button
                  onClick={() => removeSlide(idx)}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors"
                >
                  Удалить
                </button>
              )}
            </div>
            <input
              type="text"
              placeholder="Заголовок"
              value={slide.title}
              onChange={(e) => updateSlide(idx, "title", e.target.value)}
              className="w-full rounded-lg border border-[#E8E8E4] px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4F542] focus:border-[#D4F542]"
            />
            <textarea
              placeholder="Текст (каждая строка = буллет)"
              value={slide.content}
              onChange={(e) => updateSlide(idx, "content", e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-[#E8E8E4] px-3.5 py-2.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[#D4F542] focus:border-[#D4F542]"
            />
          </div>
        ))}

        {slides.length < 10 && (
          <button
            onClick={addSlide}
            className="w-full py-2.5 border-2 border-dashed border-[#E8E8E4] rounded-xl text-sm text-[#9CA3AF] hover:border-[#D4F542] hover:text-[#0D0D14] transition-colors"
          >
            + Добавить слайд
          </button>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handlePreview}
            disabled={rendering || !filledSlides.length}
            className="px-5 py-2.5 bg-[#1E1E1E] text-white rounded-xl text-sm font-semibold hover:bg-[#2e2e2e] transition-all disabled:opacity-50"
          >
            {rendering ? "Рендерим..." : "Предпросмотр"}
          </button>
          <span className="text-xs text-[#9CA3AF]">
            {filledSlides.length} из {slides.length} слайдов заполнены
          </span>
        </div>

        {renderError && (
          <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">
            {renderError}
          </p>
        )}
      </div>

      {/* ── Preview ── */}
      {previews.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E8E8E4] p-6 space-y-5">
          <h2 className="font-semibold text-[#0D0D14]">Превью</h2>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {previews.map((url, idx) => (
              <div key={idx} className="relative">
                <img
                  src={url}
                  alt={`Слайд ${idx + 1}`}
                  className="w-full rounded-xl border border-[#E8E8E4] shadow-sm"
                />
                <span className="absolute top-2 left-2 bg-black/60 text-white text-xs font-semibold px-2 py-0.5 rounded-md">
                  {idx + 1}
                </span>
              </div>
            ))}
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#0D0D14]">
              Подпись к альбому{" "}
              <span className="text-[#9CA3AF] font-normal">(необязательно)</span>
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
              placeholder="Текст под первым фото, поддерживается HTML: <b>, <a href>, <code>"
              className="w-full rounded-lg border border-[#E8E8E4] px-3.5 py-2.5 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-[#D4F542] focus:border-[#D4F542]"
            />
          </div>

          {/* Send */}
          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={handleSend}
              disabled={sending}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
                confirmed
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-[#D4F542] text-[#0D0D14] hover:brightness-95"
              }`}
            >
              {sending
                ? "Отправляем..."
                : confirmed
                  ? `Подтвердить отправку ${telegramCount} пользователям`
                  : "Отправить рассылку"}
            </button>
            {confirmed && (
              <button
                onClick={() => setConfirmed(false)}
                className="text-sm text-[#9CA3AF] hover:text-[#0D0D14] transition-colors"
              >
                Отмена
              </button>
            )}
          </div>

          {sendResult && (
            <div className="text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              Отправлено {sendResult.sent} из {sendResult.total}
              {sendResult.failed > 0 && ` · Ошибок: ${sendResult.failed}`}
            </div>
          )}
          {sendError && (
            <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">
              {sendError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
