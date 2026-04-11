"use client";

import { useState, useTransition } from "react";
import type { ApiKey } from "@/lib/supabase/queries";
import { generateApiKey, toggleApiKey, resetApiKey } from "./actions";

interface ApiKeysClientProps {
  apiKeys: ApiKey[];
}

export default function ApiKeysClient({ apiKeys }: ApiKeysClientProps) {
  const [keys, setKeys] = useState<ApiKey[]>(apiKeys);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Create form state
  const [name, setName] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [limit, setLimit] = useState(500);
  const [formError, setFormError] = useState("");

  function handleCreate() {
    if (!name.trim() || !tenantId.trim()) {
      setFormError("Заполните имя и tenant_id");
      return;
    }
    setFormError("");

    startTransition(async () => {
      try {
        const { plainKey, id } = await generateApiKey(name, tenantId, limit);
        // Show modal BEFORE any reload — key must be visible
        setNewKey(plainKey);
        // Optimistically add new key to table
        setKeys((prev) => [
          {
            id,
            key_hash: "",
            name: name.trim(),
            tenant_id: tenantId.trim().toLowerCase().replace(/\s+/g, "_"),
            monthly_limit: limit,
            used_this_month: 0,
            last_reset_month: null,
            active: true,
            created_at: new Date().toISOString(),
            last_used_at: null,
          },
          ...prev,
        ]);
        setName("");
        setTenantId("");
        setLimit(500);
      } catch (e) {
        setFormError(String(e));
      }
    });
  }

  function handleToggle(id: string, currentActive: boolean) {
    startTransition(async () => {
      await toggleApiKey(id, !currentActive);
      setKeys((prev) =>
        prev.map((k) => (k.id === id ? { ...k, active: !currentActive } : k))
      );
    });
  }

  function handleReset(id: string) {
    startTransition(async () => {
      await resetApiKey(id);
      setKeys((prev) =>
        prev.map((k) => (k.id === id ? { ...k, used_this_month: 0 } : k))
      );
    });
  }

  function copyKey() {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-8">
      {/* Modal popup with new key */}
      {newKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setNewKey(null)}
          />
          {/* Modal */}
          <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8">
            {/* Warning icon */}
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <h3 className="text-lg font-bold text-[#0D0D14] mb-1">Сохрани API ключ</h3>
            <p className="text-sm text-[#6B7280] mb-6">
              Он показывается <span className="font-semibold text-[#0D0D14]">только один раз</span> и нигде не сохраняется. После закрытия восстановить невозможно.
            </p>

            {/* Key display */}
            <div className="bg-[#F9F9F7] rounded-xl p-4 mb-4 border border-[#E8E8E4]">
              <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-2">API ключ</p>
              <code className="text-sm font-mono text-[#0D0D14] break-all leading-relaxed">
                {newKey}
              </code>
            </div>

            {/* Copy button */}
            <button
              onClick={copyKey}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all mb-3 ${
                copied
                  ? "bg-green-100 text-green-700"
                  : "bg-[#1E1E1E] text-white hover:bg-[#2e2e2e]"
              }`}
            >
              {copied ? "✓ Скопировано!" : "Копировать ключ"}
            </button>

            {/* Close */}
            <button
              onClick={() => setNewKey(null)}
              className="w-full py-2.5 rounded-xl text-sm text-[#6B7280] hover:text-[#0D0D14] hover:bg-[#F0F0EC] transition-colors"
            >
              Закрыть (я сохранил ключ)
            </button>
          </div>
        </div>
      )}

      {/* Create form */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8E8E4]">
        <h2 className="font-semibold text-[#0D0D14] mb-5">Создать новый API ключ</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Имя клиента</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="MyBot Production"
              className="w-full px-3 py-2.5 rounded-lg border border-[#E8E8E4] text-sm focus:outline-none focus:border-[#1E1E1E] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
              Tenant ID (slug)
            </label>
            <input
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder="client_name"
              className="w-full px-3 py-2.5 rounded-lg border border-[#E8E8E4] text-sm font-mono focus:outline-none focus:border-[#1E1E1E] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
              Лимит/месяц
            </label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              min={1}
              max={10000}
              className="w-full px-3 py-2.5 rounded-lg border border-[#E8E8E4] text-sm focus:outline-none focus:border-[#1E1E1E] transition-colors"
            />
          </div>
        </div>
        {formError && <p className="text-red-500 text-sm mt-3">{formError}</p>}
        <button
          onClick={handleCreate}
          disabled={isPending}
          className="mt-4 px-6 py-2.5 rounded-xl bg-[#1E1E1E] text-white font-semibold text-sm hover:bg-[#2e2e2e] disabled:opacity-50 transition-colors"
        >
          {isPending ? "Создаю..." : "Создать ключ"}
        </button>
      </div>

      {/* Keys table */}
      <div className="bg-white rounded-2xl border border-[#E8E8E4] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E8E8E4]">
          <h2 className="font-semibold text-[#0D0D14]">API ключи ({keys.length})</h2>
        </div>

        {keys.length === 0 ? (
          <div className="px-6 py-12 text-center text-[#9CA3AF] text-sm">
            Нет API ключей. Создай первый выше.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F9F9F7]">
                <tr>
                  {["Имя", "Tenant ID", "Использование", "Статус", "Последнее использование", "Действия"].map(
                    (h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0EC]">
                {keys.map((key) => (
                  <tr key={key.id} className={key.active ? "" : "opacity-50"}>
                    <td className="px-5 py-4 font-medium text-[#0D0D14]">{key.name}</td>
                    <td className="px-5 py-4 font-mono text-[#6B7280] text-xs">{key.tenant_id}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[#0D0D14] font-medium">{key.used_this_month}</span>
                        <span className="text-[#9CA3AF]">/ {key.monthly_limit}</span>
                        <div className="flex-1 h-1.5 bg-[#F0F0EC] rounded-full min-w-[60px]">
                          <div
                            className="h-full bg-[#D4F542] rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, (key.used_this_month / key.monthly_limit) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          key.active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {key.active ? "Активен" : "Отозван"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#6B7280]">
                      {key.last_used_at
                        ? new Date(key.last_used_at).toLocaleString("ru-RU", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggle(key.id, key.active)}
                          disabled={isPending}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                            key.active
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "bg-green-50 text-green-700 hover:bg-green-100"
                          }`}
                        >
                          {key.active ? "Отозвать" : "Активировать"}
                        </button>
                        <button
                          onClick={() => handleReset(key.id)}
                          disabled={isPending}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#F0F0EC] text-[#6B7280] hover:bg-[#E8E8E4] transition-colors disabled:opacity-50"
                        >
                          Сбросить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
