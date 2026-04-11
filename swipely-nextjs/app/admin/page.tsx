/* eslint-disable react-hooks/purity, @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { StatsRow } from "./components/StatsRow";
import { FunnelSection } from "./components/FunnelSection";
import { RevenueChart } from "./components/RevenueChart";
import { BroadcastSection } from "./components/BroadcastSection";

export const dynamic = "force-dynamic";

const EXCLUDED_EMAILS = ["komzor909@gmail.com", "komzor5051@gmail.com"];

export default async function AdminPage() {
  const admin = createAdminClient();

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
    { data: genUserIds },
    { count: usersAtLimit },
    { data: revenueByDay },
  ] = await Promise.all([
    admin.from("profiles").select("*").order("created_at", { ascending: false }),
    admin
      .from("payments")
      .select("id, created_at, amount, status, product_type, user_id")
      .order("created_at", { ascending: false })
      .limit(200),
    admin.from("generations").select("*", { count: "exact", head: true }),
    admin.from("generations").select("*", { count: "exact", head: true }).gte("created_at", dayAgo),
    admin.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
    admin.from("payments").select("amount, user_id").eq("status", "succeeded"),
    admin.from("generations").select("user_id"),
    admin.from("profiles").select("*", { count: "exact", head: true }).gte("standard_used", 3),
    admin
      .from("payments")
      .select("created_at, amount, user_id")
      .eq("status", "succeeded")
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: true }),
  ]);

  // ── Exclude owner test accounts ──
  const realProfiles = (profiles || []).filter((p) => !EXCLUDED_EMAILS.includes(p.email || ""));
  const excludedIds = new Set(
    (profiles || []).filter((p) => EXCLUDED_EMAILS.includes(p.email || "")).map((p) => p.id)
  );

  // ── Stats ──
  const totalRevenue = (revenueAllTime || [])
    .filter((p) => !p.user_id || !excludedIds.has(p.user_id))
    .reduce((s, p) => s + (p.amount || 0), 0);

  const MONTHLY_PRICE = 990;
  const ANNUAL_MONTHLY = Math.round(9900 / 12);
  const lastPaymentByUser: Record<string, string> = {};
  for (const p of payments || []) {
    if (p.status === "succeeded" && p.user_id && p.product_type && !lastPaymentByUser[p.user_id]) {
      lastPaymentByUser[p.user_id] = p.product_type;
    }
  }
  const mrr = realProfiles
    .filter((p) => p.subscription_tier === "pro")
    .reduce((sum, p) => {
      const pt = lastPaymentByUser[p.id];
      return sum + (pt === "pro_yearly" ? ANNUAL_MONTHLY : MONTHLY_PRICE);
    }, 0);

  const totalUsers = realProfiles.length;
  const proUsers = realProfiles.filter((p) => p.subscription_tier === "pro").length;
  const telegramCount = realProfiles.filter((p) => (p as any).telegram_id != null).length;
  const conversionRate = totalUsers > 0 ? ((proUsers / totalUsers) * 100).toFixed(1) : "0";

  // ── Funnel ──
  const activatedUserIds = new Set(
    (genUserIds || []).map((g) => g.user_id).filter((id) => id && !excludedIds.has(id))
  );

  // ── Revenue chart (30 days) ──
  const dayMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    dayMap[d.toISOString().slice(0, 10)] = 0;
  }
  for (const p of revenueByDay || []) {
    if (p.user_id && excludedIds.has(p.user_id)) continue;
    const key = (p.created_at as string).slice(0, 10);
    if (key in dayMap) dayMap[key] += p.amount || 0;
  }
  const chartData = Object.entries(dayMap).map(([date, amount]) => ({ date, amount }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0D0D14]">Обзор</h1>
        <p className="text-sm text-[#9CA3AF] mt-1">Ключевые метрики и воронка конверсий</p>
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
        activatedUsers={activatedUserIds.size}
        usersAtLimit={usersAtLimit ?? 0}
        proUsers={proUsers}
      />

      <RevenueChart data={chartData} />

      <BroadcastSection telegramCount={telegramCount} />
    </div>
  );
}
