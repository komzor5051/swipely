"use client";

import { useState } from "react";

const PRESETS = {
  telegram_broadcast: {
    source: "telegram",
    medium: "broadcast",
    campaign: "",
    content: "",
  },
  telegram_bot: {
    source: "telegram",
    medium: "bot",
    campaign: "",
    content: "",
  },
  instagram_bio: {
    source: "instagram",
    medium: "bio",
    campaign: "",
    content: "",
  },
  instagram_stories: {
    source: "instagram",
    medium: "stories",
    campaign: "",
    content: "",
  },
  email: {
    source: "email",
    medium: "newsletter",
    campaign: "",
    content: "",
  },
} as const;

type PresetKey = keyof typeof PRESETS;

const PRESET_LABELS: Record<PresetKey, string> = {
  telegram_broadcast: "Telegram рассылка",
  telegram_bot: "Telegram бот",
  instagram_bio: "Instagram био",
  instagram_stories: "Instagram Stories",
  email: "Email рассылка",
};

export default function UtmPage() {
  const [url, setUrl] = useState("https://swipely.ru");
  const [source, setSource] = useState("telegram");
  const [medium, setMedium] = useState("broadcast");
  const [campaign, setCampaign] = useState("");
  const [content, setContent] = useState("");
  const [term, setTerm] = useState("");
  const [copied, setCopied] = useState(false);

  // History
  const [history, setHistory] = useState<
    { url: string; label: string; date: string }[]
  >([]);

  const applyPreset = (key: PresetKey) => {
    const p = PRESETS[key];
    setSource(p.source);
    setMedium(p.medium);
    setCampaign(p.campaign);
    setContent(p.content);
  };

  const generatedUrl = (() => {
    try {
      const u = new URL(url);
      if (source) u.searchParams.set("utm_source", source);
      if (medium) u.searchParams.set("utm_medium", medium);
      if (campaign) u.searchParams.set("utm_campaign", campaign);
      if (content) u.searchParams.set("utm_content", content);
      if (term) u.searchParams.set("utm_term", term);
      return u.toString();
    } catch {
      return "";
    }
  })();

  const handleCopy = async () => {
    if (!generatedUrl) return;
    await navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // Add to history
    const label = [source, medium, campaign].filter(Boolean).join(" / ");
    setHistory((prev) => [
      { url: generatedUrl, label, date: new Date().toLocaleTimeString("ru-RU") },
      ...prev.slice(0, 19),
    ]);
  };

  const inputCls =
    "w-full rounded-lg border border-[#E8E8E4] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4F542] focus:border-[#D4F542]";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0D0D14]">UTM-генератор</h1>
        <p className="text-sm text-[#9CA3AF] mt-1">
          Создавай ссылки с UTM-метками для отслеживания в Яндекс Метрике
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Form ── */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E8E8E4] p-6 space-y-5">
          {/* Presets */}
          <div>
            <label className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2 block">
              Быстрые пресеты
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PRESETS) as PresetKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    source === PRESETS[key].source &&
                    medium === PRESETS[key].medium
                      ? "bg-[#1E1E1E] text-white border-[#1E1E1E]"
                      : "border-[#E8E8E4] text-[#6B7280] hover:border-[#D4F542]"
                  }`}
                >
                  {PRESET_LABELS[key]}
                </button>
              ))}
            </div>
          </div>

          {/* URL */}
          <div>
            <label className="text-sm font-medium text-[#0D0D14] mb-1.5 block">
              URL страницы
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://swipely.ru"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[#0D0D14] mb-1.5 block">
                utm_source <span className="text-red-400">*</span>
              </label>
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="telegram, instagram, email"
                className={inputCls}
              />
              <p className="text-xs text-[#9CA3AF] mt-1">Откуда пришёл трафик</p>
            </div>
            <div>
              <label className="text-sm font-medium text-[#0D0D14] mb-1.5 block">
                utm_medium <span className="text-red-400">*</span>
              </label>
              <input
                value={medium}
                onChange={(e) => setMedium(e.target.value)}
                placeholder="broadcast, bot, bio, cpc"
                className={inputCls}
              />
              <p className="text-xs text-[#9CA3AF] mt-1">Тип канала</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-[#0D0D14] mb-1.5 block">
                utm_campaign
              </label>
              <input
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                placeholder="payments_fix, new_tariffs"
                className={inputCls}
              />
              <p className="text-xs text-[#9CA3AF] mt-1">Название кампании</p>
            </div>
            <div>
              <label className="text-sm font-medium text-[#0D0D14] mb-1.5 block">
                utm_content
              </label>
              <input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="cta_button, header_link"
                className={inputCls}
              />
              <p className="text-xs text-[#9CA3AF] mt-1">Вариант объявления</p>
            </div>
            <div>
              <label className="text-sm font-medium text-[#0D0D14] mb-1.5 block">
                utm_term
              </label>
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="ключевое слово"
                className={inputCls}
              />
              <p className="text-xs text-[#9CA3AF] mt-1">Ключевое слово (для рекламы)</p>
            </div>
          </div>

          {/* Result */}
          {generatedUrl && (
            <div className="space-y-3 pt-2">
              <label className="text-sm font-medium text-[#0D0D14] block">
                Готовая ссылка
              </label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={generatedUrl}
                  className="flex-1 rounded-lg border border-[#E8E8E4] bg-[#F8F7F4] px-3.5 py-2.5 text-sm font-mono text-[#0D0D14] select-all"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  onClick={handleCopy}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                    copied
                      ? "bg-green-500 text-white"
                      : "bg-[#D4F542] text-[#0D0D14] hover:brightness-95"
                  }`}
                >
                  {copied ? "Скопировано" : "Копировать"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── History ── */}
        <div className="bg-white rounded-2xl border border-[#E8E8E4] p-6">
          <h2 className="font-semibold text-[#0D0D14] mb-4">
            История{" "}
            <span className="text-[#9CA3AF] font-normal text-sm">
              (сессия)
            </span>
          </h2>
          {history.length === 0 ? (
            <p className="text-sm text-[#9CA3AF]">
              Скопированные ссылки появятся здесь
            </p>
          ) : (
            <div className="space-y-3">
              {history.map((item, idx) => (
                <div
                  key={idx}
                  className="border border-[#E8E8E4] rounded-lg p-3 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#6B7280]">
                      {item.label}
                    </span>
                    <span className="text-xs text-[#9CA3AF]">{item.date}</span>
                  </div>
                  <p
                    className="text-xs font-mono text-[#0D0D14] break-all cursor-pointer hover:text-[#D4F542] transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(item.url);
                    }}
                    title="Нажми чтобы скопировать"
                  >
                    {item.url}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
