/* eslint-disable react-hooks/purity, @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { UsersTable } from "../components/UsersTable";

export const dynamic = "force-dynamic";

const EXCLUDED_EMAILS = ["komzor909@gmail.com", "komzor5051@gmail.com"];

export default async function AdminUsersPage() {
  const admin = createAdminClient();

  const [{ data: profiles }, { data: genUserIds }] = await Promise.all([
    admin.from("profiles").select("*").order("created_at", { ascending: false }),
    admin.from("generations").select("user_id"),
  ]);

  const realProfiles = (profiles || []).filter((p) => !EXCLUDED_EMAILS.includes(p.email || ""));

  const genCountMap: Record<string, number> = {};
  for (const g of genUserIds || []) {
    if (g.user_id) genCountMap[g.user_id] = (genCountMap[g.user_id] || 0) + 1;
  }

  const userRows = realProfiles.map((p) => ({
    id: p.id,
    email: p.email,
    telegram_username: (p as any).telegram_username ?? null,
    subscription_tier: p.subscription_tier,
    subscription_end: p.subscription_end,
    photo_slides_balance: p.photo_slides_balance,
    referral_count: p.referral_count,
    standard_used: p.standard_used,
    last_generate_at: p.last_generate_at,
    created_at: p.created_at,
    gen_count: genCountMap[p.id] || 0,
  }));

  const totalUsers = realProfiles.length;
  const proUsers = realProfiles.filter((p) => p.subscription_tier === "pro").length;
  const telegramUsers = realProfiles.filter((p) => (p as any).telegram_id != null).length;
  const activeToday = realProfiles.filter((p) => {
    if (!p.last_generate_at) return false;
    return new Date(p.last_generate_at) > new Date(Date.now() - 86400000);
  }).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0D0D14]">Пользователи</h1>
        <p className="text-sm text-[#9CA3AF] mt-1">{totalUsers} зарегистрировано всего</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#D4F542] rounded-2xl p-5">
          <p className="text-xs font-medium mb-2 uppercase tracking-wide text-[#0D0D14]/50">Всего</p>
          <p className="text-3xl font-bold font-mono">{totalUsers}</p>
        </div>
        <div className="bg-[#1E1E1E] text-white rounded-2xl p-5">
          <p className="text-xs font-medium mb-2 uppercase tracking-wide text-white/40">PRO</p>
          <p className="text-3xl font-bold font-mono">{proUsers}</p>
          <p className="text-xs mt-2 text-white/40">
            {totalUsers > 0 ? ((proUsers / totalUsers) * 100).toFixed(1) : 0}% конверсия
          </p>
        </div>
        <div className="bg-white border border-[#E8E8E4] rounded-2xl p-5">
          <p className="text-xs font-medium mb-2 uppercase tracking-wide text-[#9CA3AF]">Telegram</p>
          <p className="text-3xl font-bold font-mono text-[#0D0D14]">{telegramUsers}</p>
          <p className="text-xs mt-2 text-[#9CA3AF]">подключили аккаунт</p>
        </div>
        <div className="bg-white border border-[#E8E8E4] rounded-2xl p-5">
          <p className="text-xs font-medium mb-2 uppercase tracking-wide text-[#9CA3AF]">Активны сегодня</p>
          <p className="text-3xl font-bold font-mono text-[#0D0D14]">{activeToday}</p>
          <p className="text-xs mt-2 text-[#9CA3AF]">генераций за 24ч</p>
        </div>
      </div>

      <UsersTable users={userRows} />
    </div>
  );
}
