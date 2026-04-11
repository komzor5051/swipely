"use client";
/* eslint-disable react-hooks/purity */

import { useState, useTransition, useMemo } from "react";
import { updateUserTier, updateUserBalance } from "../actions";

type UserRow = {
  id: string;
  email: string | null;
  telegram_username: string | null;
  subscription_tier: string | null;
  subscription_end: string | null;
  photo_slides_balance: number | null;
  referral_count: number | null;
  standard_used: number | null;
  last_generate_at: string | null;
  created_at: string | null;
  gen_count: number;
};

function UserEditRow({ user }: { user: UserRow }) {
  const [tier, setTier] = useState(user.subscription_tier || "free");
  const [balance, setBalance] = useState(user.photo_slides_balance ?? 0);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateUserTier(user.id, tier as "free" | "pro");
        await updateUserBalance(user.id, balance);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch {
        setError(true);
        setTimeout(() => setError(false), 3000);
      }
    });
  };

  const lastActive = user.last_generate_at
    ? new Date(user.last_generate_at)
    : null;
  const daysSinceActive = lastActive
    ? Math.floor((Date.now() - lastActive.getTime()) / 86400000)
    : null;

  return (
    <tr className="border-b border-[#E8E8E4] hover:bg-[#F9F9F7] transition-colors">
      <td className="py-3 px-4 max-w-[220px]">
        <p className="text-sm text-[#0D0D14] font-medium truncate">{user.email || "—"}</p>
        {user.telegram_username && (
          <p className="text-xs text-[#6B7280] truncate">@{user.telegram_username}</p>
        )}
      </td>
      <td className="py-3 px-4">
        <select
          value={tier}
          onChange={(e) => setTier(e.target.value)}
          className="text-xs border border-[#E8E8E4] rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-[#D4F542]"
        >
          <option value="free">free</option>
          <option value="pro">pro</option>
        </select>
      </td>
      <td className="py-3 px-4 text-sm font-mono text-[#6B7280]">
        {user.gen_count}
        {user.standard_used != null && (
          <span className="text-xs text-[#9CA3AF] ml-1">({user.standard_used}/мес)</span>
        )}
      </td>
      <td className="py-3 px-4">
        <input
          type="number"
          value={balance}
          onChange={(e) => setBalance(Number(e.target.value))}
          min={0}
          className="text-sm border border-[#E8E8E4] rounded-lg px-2 py-1 w-16 font-mono focus:outline-none focus:ring-2 focus:ring-[#D4F542]"
        />
      </td>
      <td className="py-3 px-4 text-sm text-[#6B7280] font-mono">
        {user.referral_count ?? 0}
      </td>
      <td className="py-3 px-4 text-sm">
        {daysSinceActive === null ? (
          <span className="text-[#9CA3AF]">никогда</span>
        ) : daysSinceActive === 0 ? (
          <span className="text-green-600 font-medium">сегодня</span>
        ) : daysSinceActive <= 7 ? (
          <span className="text-[#6B7280]">{daysSinceActive}д назад</span>
        ) : (
          <span className="text-[#EF4444]">{daysSinceActive}д назад</span>
        )}
      </td>
      <td className="py-3 px-4 text-sm text-[#9CA3AF]">
        {user.created_at
          ? new Date(user.created_at).toLocaleDateString("ru-RU")
          : "—"}
      </td>
      <td className="py-3 px-4">
        <button
          onClick={handleSave}
          disabled={isPending}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
            saved
              ? "bg-green-100 text-green-700"
              : error
              ? "bg-red-100 text-red-700"
              : "bg-[#1E1E1E] text-white hover:bg-[#2e2e2e] disabled:opacity-50"
          }`}
        >
          {saved ? "Сохранено" : error ? "Ошибка" : isPending ? "..." : "Сохранить"}
        </button>
      </td>
    </tr>
  );
}

export function UsersTable({ users }: { users: UserRow[] }) {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<"all" | "free" | "pro">("all");

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase();
      const matchSearch = search === "" ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.telegram_username || "").toLowerCase().includes(q);
      const matchTier = tierFilter === "all" || u.subscription_tier === tierFilter;
      return matchSearch && matchTier;
    });
  }, [users, search, tierFilter]);

  return (
    <div className="bg-white rounded-2xl border border-[#E8E8E4] overflow-hidden">
      <div className="px-6 py-4 border-b border-[#E8E8E4] flex items-center justify-between gap-4 flex-wrap">
        <h2 className="font-semibold text-[#0D0D14]">
          Пользователи ({filtered.length} / {users.length})
        </h2>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Поиск по email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm border border-[#E8E8E4] rounded-xl px-3 py-2 w-56 focus:outline-none focus:ring-2 focus:ring-[#D4F542]"
          />
          <div className="flex gap-1">
            {(["all", "free", "pro"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setTierFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  tierFilter === f
                    ? "bg-[#1E1E1E] text-white"
                    : "bg-[#F5F5F0] text-[#6B7280] hover:bg-[#E8E8E4]"
                }`}
              >
                {f === "all" ? "Все" : f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#F9F9F7] text-xs text-[#9CA3AF] uppercase tracking-wide">
              <th className="py-3 px-4 text-left font-medium">Email</th>
              <th className="py-3 px-4 text-left font-medium">Тариф</th>
              <th className="py-3 px-4 text-left font-medium">Генерации</th>
              <th className="py-3 px-4 text-left font-medium">Photo баланс</th>
              <th className="py-3 px-4 text-left font-medium">Рефералы</th>
              <th className="py-3 px-4 text-left font-medium">Активность</th>
              <th className="py-3 px-4 text-left font-medium">Дата</th>
              <th className="py-3 px-4 text-left font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-sm text-[#9CA3AF]">
                  Нет пользователей
                </td>
              </tr>
            ) : (
              filtered.map((u) => <UserEditRow key={u.id} user={u} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
