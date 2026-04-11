/* eslint-disable react-hooks/purity */
import { createAdminClient } from "@/lib/supabase/admin";
import { FunnelSection } from "../components/FunnelSection";
import { GenerationsLineChart } from "../components/charts/GenerationsLineChart";
import { TemplateBarChart } from "../components/charts/TemplateBarChart";

export const dynamic = "force-dynamic";

const EXCLUDED_EMAILS = ["komzor909@gmail.com", "komzor5051@gmail.com"];

export default async function AdminAnalyticsPage() {
  const admin = createAdminClient();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const [
    { data: profiles },
    { data: generations30d },
    { data: allGenUserIds },
    { count: usersAtLimit },
    { count: totalGenerations },
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("id, email, subscription_tier, created_at, telegram_id")
      .order("created_at", { ascending: true }),
    admin
      .from("generations")
      .select("created_at, user_id, template")
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: true }),
    admin.from("generations").select("user_id"),
    admin.from("profiles").select("*", { count: "exact", head: true }).gte("standard_used", 3),
    admin.from("generations").select("*", { count: "exact", head: true }),
  ]);

  // Exclude owners
  const excludedIds = new Set(
    (profiles || []).filter((p) => EXCLUDED_EMAILS.includes(p.email || "")).map((p) => p.id)
  );
  const realProfiles = (profiles || []).filter((p) => !EXCLUDED_EMAILS.includes(p.email || ""));

  // ── 30-day timeline: generations + new users per day ──
  const dayMap: Record<string, { generations: number; users: number }> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    dayMap[d.toISOString().slice(0, 10)] = { generations: 0, users: 0 };
  }

  for (const g of generations30d || []) {
    if (g.user_id && excludedIds.has(g.user_id)) continue;
    const key = (g.created_at as string).slice(0, 10);
    if (key in dayMap) dayMap[key].generations += 1;
  }

  for (const p of realProfiles) {
    if (!p.created_at) continue;
    const key = (p.created_at as string).slice(0, 10);
    if (key in dayMap) dayMap[key].users += 1;
  }

  const timelineData = Object.entries(dayMap).map(([date, v]) => ({ date, ...v }));

  // ── Template usage top-10 ──
  const templateMap: Record<string, number> = {};
  for (const g of generations30d || []) {
    if (g.user_id && excludedIds.has(g.user_id)) continue;
    const key = g.template || "unknown";
    templateMap[key] = (templateMap[key] || 0) + 1;
  }
  const topTemplates = Object.entries(templateMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([name, count]) => ({ name, count }));

  // ── Funnel ──
  const totalUsers = realProfiles.length;
  const proUsers = realProfiles.filter((p) => p.subscription_tier === "pro").length;
  const activatedUserIds = new Set(
    (allGenUserIds || []).map((g) => g.user_id).filter((id) => id && !excludedIds.has(id))
  );

  // ── Summary stats ──
  const genLast30 = (generations30d || []).filter(
    (g) => !g.user_id || !excludedIds.has(g.user_id)
  ).length;
  const avgPerDay = (genLast30 / 30).toFixed(1);
  const activeUsersLast30 = new Set(
    (generations30d || [])
      .filter((g) => !g.user_id || !excludedIds.has(g.user_id))
      .map((g) => g.user_id)
  ).size;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0D0D14]">Аналитика</h1>
        <p className="text-sm text-[#9CA3AF] mt-1">Детальные метрики за последние 30 дней</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#D4F542] rounded-2xl p-5">
          <p className="text-xs font-medium mb-2 uppercase tracking-wide text-[#0D0D14]/50">Генераций за 30д</p>
          <p className="text-3xl font-bold font-mono">{genLast30.toLocaleString("ru-RU")}</p>
          <p className="text-xs mt-2 text-[#0D0D14]/50">всего: {(totalGenerations ?? 0).toLocaleString("ru-RU")}</p>
        </div>
        <div className="bg-[#1E1E1E] text-white rounded-2xl p-5">
          <p className="text-xs font-medium mb-2 uppercase tracking-wide text-white/40">Ср. в день</p>
          <p className="text-3xl font-bold font-mono">{avgPerDay}</p>
          <p className="text-xs mt-2 text-white/40">генераций</p>
        </div>
        <div className="bg-white border border-[#E8E8E4] rounded-2xl p-5">
          <p className="text-xs font-medium mb-2 uppercase tracking-wide text-[#9CA3AF]">Активных юзеров</p>
          <p className="text-3xl font-bold font-mono text-[#0D0D14]">{activeUsersLast30}</p>
          <p className="text-xs mt-2 text-[#9CA3AF]">за 30 дней</p>
        </div>
        <div className="bg-white border border-[#E8E8E4] rounded-2xl p-5">
          <p className="text-xs font-medium mb-2 uppercase tracking-wide text-[#9CA3AF]">Ген/активный юзер</p>
          <p className="text-3xl font-bold font-mono text-[#0D0D14]">
            {activeUsersLast30 > 0 ? (genLast30 / activeUsersLast30).toFixed(1) : "0"}
          </p>
          <p className="text-xs mt-2 text-[#9CA3AF]">за 30 дней</p>
        </div>
      </div>

      {/* Timeline chart */}
      <div className="bg-white border border-[#E8E8E4] rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-[#0D0D14] mb-1">Активность по дням</h2>
        <p className="text-xs text-[#9CA3AF] mb-5">Генерации и новые пользователи за 30 дней</p>
        <GenerationsLineChart data={timelineData} />
      </div>

      {/* Templates + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E8E8E4] rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-[#0D0D14] mb-1">Топ шаблонов</h2>
          <p className="text-xs text-[#9CA3AF] mb-5">По количеству генераций за 30д</p>
          {topTemplates.length > 0 ? (
            <TemplateBarChart data={topTemplates} />
          ) : (
            <div className="h-[220px] flex items-center justify-center text-[#9CA3AF] text-sm">
              Нет данных
            </div>
          )}
        </div>
        <div className="bg-white border border-[#E8E8E4] rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-[#0D0D14] mb-1">Воронка конверсий</h2>
          <p className="text-xs text-[#9CA3AF] mb-5">Путь от регистрации до оплаты</p>
          <FunnelSection
            totalUsers={totalUsers}
            activatedUsers={activatedUserIds.size}
            usersAtLimit={usersAtLimit ?? 0}
            proUsers={proUsers}
            compact
          />
        </div>
      </div>
    </div>
  );
}
