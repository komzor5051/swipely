/* eslint-disable react-hooks/purity */
import { createAdminClient } from "@/lib/supabase/admin";
import { PaymentsTable } from "../components/PaymentsTable";
import { RevenueAreaChart } from "../components/charts/RevenueAreaChart";
import { ProductPieChart } from "../components/charts/ProductPieChart";

export const dynamic = "force-dynamic";

const EXCLUDED_EMAILS = ["komzor909@gmail.com", "komzor5051@gmail.com"];

const PRODUCT_LABELS: Record<string, string> = {
  pro_monthly: "PRO месяц",
  pro_yearly: "PRO год",
  pack_15: "Пак 15",
  pack_50: "Пак 50",
  pack_150: "Пак 150",
  photo_custom: "Фото",
  test_1rub: "Тест 1₽",
};

const PRODUCT_COLORS: Record<string, string> = {
  pro_monthly: "#D4F542",
  pro_yearly: "#0A84FF",
  pack_15: "#F9A8D4",
  pack_50: "#FB923C",
  pack_150: "#A78BFA",
  photo_custom: "#34D399",
  test_1rub: "#9CA3AF",
};

export default async function AdminPaymentsPage() {
  const admin = createAdminClient();

  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();

  const [{ data: profiles }, { data: allPayments }, { data: recentPayments }] = await Promise.all([
    admin.from("profiles").select("id, email"),
    admin
      .from("payments")
      .select("id, created_at, amount, status, product_type, user_id")
      .eq("status", "succeeded"),
    admin
      .from("payments")
      .select("id, created_at, amount, currency, status, product_type, payment_method, user_id")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  // Exclude owner accounts
  const excludedIds = new Set(
    (profiles || []).filter((p) => EXCLUDED_EMAILS.includes(p.email || "")).map((p) => p.id)
  );
  const emailMap: Record<string, string> = {};
  for (const p of profiles || []) {
    if (p.id && p.email && !excludedIds.has(p.id)) emailMap[p.id] = p.email;
  }

  const realPayments = (allPayments || []).filter(
    (p) => !p.user_id || !excludedIds.has(p.user_id)
  );

  // ── Stats ──
  const totalRevenue = realPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const totalCount = realPayments.length;
  const avgCheck = totalCount > 0 ? Math.round(totalRevenue / totalCount) : 0;

  // ── Revenue by week (last 12 weeks) ──
  const weekMap: Record<string, number> = {};
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(Date.now() - i * 7 * 86400000);
    weekStart.setHours(0, 0, 0, 0);
    // Round to Monday
    const day = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1));
    weekMap[weekStart.toISOString().slice(0, 10)] = 0;
  }
  for (const p of realPayments) {
    const d = new Date(p.created_at as string);
    const day = d.getDay();
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    if (key in weekMap) weekMap[key] += p.amount || 0;
  }
  const weeklyData = Object.entries(weekMap).map(([date, amount]) => ({ date, amount }));

  // ── Revenue by product type ──
  const productMap: Record<string, number> = {};
  for (const p of realPayments) {
    const key = p.product_type || "other";
    productMap[key] = (productMap[key] || 0) + (p.amount || 0);
  }
  const productData = Object.entries(productMap)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => ({
      name: PRODUCT_LABELS[key] || key,
      value,
      color: PRODUCT_COLORS[key] || "#9CA3AF",
    }));

  // ── Payment rows ──
  const paymentRows = (recentPayments || [])
    .filter((p) => !p.user_id || !excludedIds.has(p.user_id))
    .map((p) => ({
      ...p,
      user_email: p.user_id ? (emailMap[p.user_id] || null) : null,
    }));

  // ── This month revenue ──
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthRevenue = realPayments
    .filter((p) => new Date(p.created_at as string) >= monthStart)
    .reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0D0D14]">Платежи</h1>
        <p className="text-sm text-[#9CA3AF] mt-1">{totalCount} успешных платежей всего</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#D4F542] rounded-2xl p-5">
          <p className="text-xs font-medium mb-2 uppercase tracking-wide text-[#0D0D14]/50">Выручка всего</p>
          <p className="text-3xl font-bold font-mono">{totalRevenue.toLocaleString("ru-RU")} ₽</p>
        </div>
        <div className="bg-[#1E1E1E] text-white rounded-2xl p-5">
          <p className="text-xs font-medium mb-2 uppercase tracking-wide text-white/40">За этот месяц</p>
          <p className="text-3xl font-bold font-mono">{monthRevenue.toLocaleString("ru-RU")} ₽</p>
        </div>
        <div className="bg-white border border-[#E8E8E4] rounded-2xl p-5">
          <p className="text-xs font-medium mb-2 uppercase tracking-wide text-[#9CA3AF]">Платежей</p>
          <p className="text-3xl font-bold font-mono text-[#0D0D14]">{totalCount}</p>
          <p className="text-xs mt-2 text-[#9CA3AF]">успешных</p>
        </div>
        <div className="bg-white border border-[#E8E8E4] rounded-2xl p-5">
          <p className="text-xs font-medium mb-2 uppercase tracking-wide text-[#9CA3AF]">Средний чек</p>
          <p className="text-3xl font-bold font-mono text-[#0D0D14]">{avgCheck.toLocaleString("ru-RU")} ₽</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-[#E8E8E4] rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-[#0D0D14] mb-1">Выручка по неделям</h2>
          <p className="text-xs text-[#9CA3AF] mb-5">Последние 12 недель</p>
          <RevenueAreaChart data={weeklyData} />
        </div>
        <div className="bg-white border border-[#E8E8E4] rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-[#0D0D14] mb-1">По продуктам</h2>
          <p className="text-xs text-[#9CA3AF] mb-4">Структура выручки</p>
          <ProductPieChart data={productData} />
        </div>
      </div>

      <PaymentsTable payments={paymentRows} />
    </div>
  );
}
