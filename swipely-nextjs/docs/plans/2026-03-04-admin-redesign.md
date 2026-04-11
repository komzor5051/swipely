# Admin Panel Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade the admin panel to show full business metrics (KPIs, funnel, revenue chart), fix the payments user_id bug, and add search/filter to the users table.

**Architecture:** All data fetching stays server-side in `admin/page.tsx` via parallel Supabase queries. New client components handle interactivity (search, chart). No new dependencies — chart uses inline SVG.

**Tech Stack:** Next.js App Router, Supabase admin client, React Server Components + Client Components, Tailwind CSS, inline SVG for chart.

---

### Task 1: Fix payments user_id bug

**Files:**
- Modify: `app/api/payments/create/route.ts` (line 149 — the `insert` call)

**Problem:** `user_id` is only saved inside `product_data` JSON, not as a top-level column. The admin queries `payments.user_id` which is always null → email shows "—".

**Step 1: Add `user_id` to the payments insert**

Find the insert block (~line 149) and add `user_id: user.id`:

```ts
const { error: dbErr } = await supabase.from("payments").insert({
  payment_id: invoice.id,
  amount: finalAmount,
  currency: "RUB",
  status: "pending",
  payment_method: "aurapay",
  product_type: productId,
  user_id: user.id,          // ← ADD THIS LINE
  product_data: {
    user_id: user.id,
    user_email: user.email,
    ...(finalSlides !== undefined && { custom_slides: finalSlides }),
  },
});
```

**Step 2: Verify manually**
Open Supabase dashboard → Table Editor → payments. Existing rows may still have null user_id (historical). New payments will have user_id populated.

**Step 3: Commit**
```bash
git add app/api/payments/create/route.ts
git commit -m "fix(payments): save user_id as top-level column in payments insert"
```

---

### Task 2: Update admin page data fetching

**Files:**
- Modify: `app/admin/page.tsx`

**Step 1: Replace the file with expanded queries**

The new page needs these additional data points:
- `activatedUsers` — count distinct user_ids from `generations`
- `usersAtLimit` — count profiles where `standard_used >= 3`
- `mrrData` — sum of succeeded payments from this calendar month
- `revenueByDay` — payments grouped by day for last 30 days (for chart)

Replace `app/admin/page.tsx` with:

```tsx
import { createAdminClient } from "@/lib/supabase/admin";
import { StatsRow } from "./components/StatsRow";
import { UsersTable } from "./components/UsersTable";
import { PaymentsTable } from "./components/PaymentsTable";
import { FunnelSection } from "./components/FunnelSection";
import { RevenueChart } from "./components/RevenueChart";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = createAdminClient();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const dayAgo = new Date(Date.now() - 86400000).toISOString();

  const [
    { data: profiles },
    { data: payments },
    { count: totalGenerations },
    { count: generationsToday },
    { count: newUsersWeek },
    { data: revenueAllTime },
    { data: mrrData },
    { data: genUserIds },
    { count: usersAtLimit },
    { data: revenueByDay },
  ] = await Promise.all([
    admin.from("profiles").select("*").order("created_at", { ascending: false }),
    admin
      .from("payments")
      .select("id, created_at, amount, currency, status, product_type, payment_method, user_id")
      .order("created_at", { ascending: false })
      .limit(100),
    admin.from("generations").select("*", { count: "exact", head: true }),
    admin
      .from("generations")
      .select("*", { count: "exact", head: true })
      .gte("created_at", dayAgo),
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgo),
    admin
      .from("payments")
      .select("amount")
      .eq("status", "succeeded"),
    admin
      .from("payments")
      .select("amount")
      .eq("status", "succeeded")
      .gte("created_at", monthStart),
    // All user_ids that have at least 1 generation (for activation count)
    admin.from("generations").select("user_id"),
    // Users who hit the free limit
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("standard_used", 3),
    // Revenue grouped by day for chart — fetch raw and group in JS
    admin
      .from("payments")
      .select("created_at, amount")
      .eq("status", "succeeded")
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: true }),
  ]);

  // ── Compute stats ──
  const totalRevenue = (revenueAllTime || []).reduce((s, p) => s + (p.amount || 0), 0);
  const mrr = (mrrData || []).reduce((s, p) => s + (p.amount || 0), 0);
  const totalUsers = profiles?.length ?? 0;
  const proUsers = profiles?.filter((p) => p.subscription_tier === "pro").length ?? 0;
  const conversionRate = totalUsers > 0 ? ((proUsers / totalUsers) * 100).toFixed(1) : "0";

  // ── Activated users (made ≥1 generation) ──
  const activatedUserIds = new Set((genUserIds || []).map((g) => g.user_id).filter(Boolean));
  const activatedUsers = activatedUserIds.size;

  // ── Revenue chart: group by day ──
  const dayMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    dayMap[key] = 0;
  }
  for (const p of revenueByDay || []) {
    const key = (p.created_at as string).slice(0, 10);
    if (key in dayMap) dayMap[key] += p.amount || 0;
  }
  const chartData = Object.entries(dayMap).map(([date, amount]) => ({ date, amount }));

  // ── User rows ──
  const genCountMap: Record<string, number> = {};
  for (const g of genUserIds || []) {
    if (g.user_id) genCountMap[g.user_id] = (genCountMap[g.user_id] || 0) + 1;
  }
  const userRows = (profiles || []).map((p) => ({
    id: p.id,
    email: p.email,
    subscription_tier: p.subscription_tier,
    subscription_end: p.subscription_end,
    photo_slides_balance: p.photo_slides_balance,
    referral_count: p.referral_count,
    standard_used: p.standard_used,
    last_generate_at: p.last_generate_at,
    created_at: p.created_at,
    gen_count: genCountMap[p.id] || 0,
  }));

  // ── Payment rows ──
  const emailMap: Record<string, string> = {};
  for (const p of profiles || []) {
    if (p.id && p.email) emailMap[p.id] = p.email;
  }
  const paymentRows = (payments || []).map((p) => ({
    ...p,
    user_email: p.user_id ? (emailMap[p.user_id] || null) : null,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0D0D14] mb-1">Обзор</h1>
        <p className="text-sm text-[#9CA3AF]">
          {new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      <StatsRow
        totalRevenue={totalRevenue}
        mrr={mrr}
        conversionRate={conversionRate}
        totalUsers={totalUsers}
        proUsers={proUsers}
        generationsToday={generationsToday ?? 0}
        totalGenerations={totalGenerations ?? 0}
        newUsersWeek={newUsersWeek ?? 0}
      />

      <FunnelSection
        totalUsers={totalUsers}
        activatedUsers={activatedUsers}
        usersAtLimit={usersAtLimit ?? 0}
        proUsers={proUsers}
      />

      <RevenueChart data={chartData} />

      <UsersTable users={userRows} />
      <PaymentsTable payments={paymentRows} />
    </div>
  );
}
```

**Step 2: Commit**
```bash
git add app/admin/page.tsx
git commit -m "feat(admin): expand data fetching — funnel, MRR, revenue chart data"
```

---

### Task 3: Update StatsRow — add MRR and Conversion %

**Files:**
- Modify: `app/admin/components/StatsRow.tsx`

Replace entirely with:

```tsx
function StatCard({
  label,
  value,
  sub,
  accent,
  highlight,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 ${
        accent
          ? "bg-[#D4F542]"
          : highlight
          ? "bg-[#0D0D14] text-white"
          : "bg-white border border-[#E8E8E4]"
      }`}
    >
      <p className={`text-xs font-medium mb-2 uppercase tracking-wide ${
        accent ? "text-[#0D0D14]/50" : highlight ? "text-white/40" : "text-[#9CA3AF]"
      }`}>
        {label}
      </p>
      <p className={`text-3xl font-bold font-mono leading-none ${
        accent || highlight ? "" : "text-[#0D0D14]"
      }`}>
        {value}
      </p>
      {sub && (
        <p className={`text-xs mt-2 ${
          accent ? "text-[#0D0D14]/50" : highlight ? "text-white/40" : "text-[#9CA3AF]"
        }`}>
          {sub}
        </p>
      )}
    </div>
  );
}

export function StatsRow({
  totalRevenue,
  mrr,
  conversionRate,
  totalUsers,
  proUsers,
  generationsToday,
  totalGenerations,
  newUsersWeek,
}: {
  totalRevenue: number;
  mrr: number;
  conversionRate: string;
  totalUsers: number;
  proUsers: number;
  generationsToday: number;
  totalGenerations: number;
  newUsersWeek: number;
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Выручка всего"
        value={`${totalRevenue.toLocaleString("ru-RU")} ₽`}
        sub="все succeeded платежи"
        accent
      />
      <StatCard
        label="MRR (этот месяц)"
        value={`${mrr.toLocaleString("ru-RU")} ₽`}
        sub="succeeded платежи с 1-го"
        highlight
      />
      <StatCard
        label="Конверсия"
        value={`${conversionRate}%`}
        sub={`${proUsers} PRO из ${totalUsers}`}
      />
      <StatCard
        label="Новых за 7 дней"
        value={newUsersWeek}
        sub="регистраций"
      />
      <StatCard
        label="Пользователи"
        value={totalUsers}
        sub={`${proUsers} на PRO`}
      />
      <StatCard
        label="PRO подписчиков"
        value={proUsers}
        sub="активных сейчас"
      />
      <StatCard
        label="Генерации сегодня"
        value={generationsToday}
        sub={`всего: ${totalGenerations.toLocaleString("ru-RU")}`}
      />
      <StatCard
        label="Ср. ген/юзер"
        value={totalUsers > 0 ? (totalGenerations / totalUsers).toFixed(1) : "0"}
        sub="за всё время"
      />
    </div>
  );
}
```

**Step 3: Commit**
```bash
git add app/admin/components/StatsRow.tsx
git commit -m "feat(admin): expand StatsRow — add MRR, conversion rate, avg gens/user"
```

---

### Task 4: Create FunnelSection component

**Files:**
- Create: `app/admin/components/FunnelSection.tsx`

```tsx
export function FunnelSection({
  totalUsers,
  activatedUsers,
  usersAtLimit,
  proUsers,
}: {
  totalUsers: number;
  activatedUsers: number;
  usersAtLimit: number;
  proUsers: number;
}) {
  const steps = [
    {
      label: "Зарегистрировались",
      value: totalUsers,
      pct: 100,
      color: "#E8E8E4",
      textColor: "#0D0D14",
    },
    {
      label: "Создали ≥1 карусель",
      value: activatedUsers,
      pct: totalUsers > 0 ? Math.round((activatedUsers / totalUsers) * 100) : 0,
      color: "#D4F542",
      textColor: "#0D0D14",
    },
    {
      label: "Дошли до лимита (3 ген.)",
      value: usersAtLimit,
      pct: totalUsers > 0 ? Math.round((usersAtLimit / totalUsers) * 100) : 0,
      color: "#FBBF24",
      textColor: "#0D0D14",
    },
    {
      label: "Купили PRO",
      value: proUsers,
      pct: totalUsers > 0 ? Math.round((proUsers / totalUsers) * 100) : 0,
      color: "#0D0D14",
      textColor: "#D4F542",
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#E8E8E4] p-6">
      <h2 className="font-semibold text-[#0D0D14] mb-1">Воронка конверсии</h2>
      <p className="text-xs text-[#9CA3AF] mb-6">От регистрации до оплаты</p>

      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#9CA3AF] w-4">{i + 1}</span>
                <span className="text-sm font-medium text-[#0D0D14]">{step.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold font-mono text-[#0D0D14]">
                  {step.value.toLocaleString("ru-RU")}
                </span>
                <span className="text-xs font-mono text-[#9CA3AF] w-10 text-right">
                  {step.pct}%
                </span>
              </div>
            </div>
            <div className="h-2 bg-[#F5F5F0] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${step.pct}%`, background: step.color }}
              />
            </div>
            {i < steps.length - 1 && (
              <div className="flex justify-end mt-1">
                <span className="text-xs text-[#9CA3AF]">
                  потеря:{" "}
                  <span className="font-mono text-[#EF4444]">
                    −{steps[i].value - steps[i + 1].value}
                  </span>
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Key insight */}
      <div className="mt-6 p-4 bg-[#FFF8E7] border border-[#FBBF24]/30 rounded-xl">
        <p className="text-xs font-semibold text-[#92400E] mb-1">Главная проблема</p>
        <p className="text-sm text-[#92400E]">
          {activatedUsers < totalUsers * 0.5
            ? `${totalUsers - activatedUsers} юзеров зарегались, но не создали ни одной карусели. Улучши онбординг.`
            : usersAtLimit < activatedUsers * 0.3
            ? `Большинство не доходят до лимита — не хватает вовлечённости. Добавь email-напоминания.`
            : `${usersAtLimit - proUsers} юзеров упёрлись в лимит, но не заплатили. Улучши paywall.`}
        </p>
      </div>
    </div>
  );
}
```

**Step 4: Commit**
```bash
git add app/admin/components/FunnelSection.tsx
git commit -m "feat(admin): add FunnelSection component with conversion funnel + insight"
```

---

### Task 5: Create RevenueChart component

**Files:**
- Create: `app/admin/components/RevenueChart.tsx`

```tsx
"use client";

type DayData = { date: string; amount: number };

export function RevenueChart({ data }: { data: DayData[] }) {
  const max = Math.max(...data.map((d) => d.amount), 1);
  const total = data.reduce((s, d) => s + d.amount, 0);
  const nonZero = data.filter((d) => d.amount > 0).length;

  // Show only every 5th label to avoid crowding
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E8E8E4] p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="font-semibold text-[#0D0D14] mb-1">Выручка за 30 дней</h2>
          <p className="text-xs text-[#9CA3AF]">Только succeeded платежи</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold font-mono text-[#0D0D14]">
            {total.toLocaleString("ru-RU")} ₽
          </p>
          <p className="text-xs text-[#9CA3AF]">{nonZero} дней с платежами</p>
        </div>
      </div>

      <div className="flex items-end gap-1 h-32">
        {data.map((d, i) => {
          const heightPct = max > 0 ? (d.amount / max) * 100 : 0;
          const showLabel = i % 5 === 0;
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="w-full flex items-end" style={{ height: "112px" }}>
                <div
                  className="w-full rounded-t transition-all duration-300 group-hover:opacity-80"
                  style={{
                    height: `${Math.max(heightPct, d.amount > 0 ? 4 : 1)}%`,
                    background: d.amount > 0 ? "#D4F542" : "#F0F0EA",
                  }}
                  title={`${formatDate(d.date)}: ${d.amount.toLocaleString("ru-RU")} ₽`}
                />
              </div>
              {showLabel && (
                <span className="text-[9px] text-[#9CA3AF] font-mono whitespace-nowrap">
                  {formatDate(d.date)}
                </span>
              )}

              {/* Tooltip on hover */}
              {d.amount > 0 && (
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-[#0D0D14] text-white text-[10px] font-mono px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity">
                  {d.amount.toLocaleString("ru-RU")} ₽
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 5: Commit**
```bash
git add app/admin/components/RevenueChart.tsx
git commit -m "feat(admin): add RevenueChart — 30-day bar chart with hover tooltips"
```

---

### Task 6: Update UsersTable — search + filter + last activity

**Files:**
- Modify: `app/admin/components/UsersTable.tsx`

Replace entirely. Key changes:
- Add `last_generate_at` and `standard_used` columns
- Client-side search by email (useState on input)
- Client-side filter by tier (free/pro/all)
- Keep existing inline edit functionality

```tsx
"use client";

import { useState, useTransition, useMemo } from "react";
import { updateUserTier, updateUserBalance } from "../actions";

type UserRow = {
  id: string;
  email: string | null;
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
      <td className="py-3 px-4 text-sm text-[#0D0D14] font-medium max-w-[220px] truncate">
        {user.email || "—"}
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
              : "bg-[#0D0D14] text-white hover:bg-[#1A1A2E] disabled:opacity-50"
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
      const matchSearch = search === "" || (u.email || "").toLowerCase().includes(search.toLowerCase());
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
                    ? "bg-[#0D0D14] text-white"
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
```

**Step 6: Commit**
```bash
git add app/admin/components/UsersTable.tsx
git commit -m "feat(admin): add search + tier filter + last activity to UsersTable"
```

---

### Task 7: Fix PaymentsTable — human-readable product names

**Files:**
- Modify: `app/admin/components/PaymentsTable.tsx`

Add a `PRODUCT_NAMES` map and use it for display. Also add time to the date:

```tsx
const PRODUCT_NAMES: Record<string, string> = {
  pro_monthly: "PRO месяц",
  pro_yearly: "PRO год",
  pack_15: "15 слайдов",
  pack_50: "50 слайдов",
  pack_150: "150 слайдов",
  photo_custom: "Photo (кастом)",
  test_1rub: "Тест 1₽",
};
```

Replace the product_type cell:
```tsx
<td className="py-3 px-4 text-sm text-[#0D0D14]">
  {PRODUCT_NAMES[p.product_type || ""] || p.product_type || "—"}
</td>
```

Replace the date cell:
```tsx
<td className="py-3 px-4 text-sm text-[#9CA3AF] font-mono whitespace-nowrap">
  {p.created_at
    ? new Date(p.created_at).toLocaleString("ru-RU", {
        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
      })
    : "—"}
</td>
```

**Step 7: Commit**
```bash
git add app/admin/components/PaymentsTable.tsx
git commit -m "feat(admin): human-readable product names + datetime in PaymentsTable"
```

---

### Task 8: Final push

```bash
git push origin main
```

Wait for GitHub Actions to deploy (~2 min). Open `https://swipely.ru/admin` to verify.

---

## Verification checklist

- [ ] KPI row shows 8 cards including MRR and Conversion %
- [ ] Funnel shows 4 steps with accurate counts and loss numbers
- [ ] Revenue chart renders 30 bars, tooltip on hover
- [ ] Users table: search by email filters live, free/pro/all buttons work
- [ ] Users table: "Активность" column shows days since last generation (red if >7d)
- [ ] Payments: product names are human-readable (not "pro_monthly")
- [ ] Payments: user email shows correctly for new payments (existing historical rows may still show "—")
