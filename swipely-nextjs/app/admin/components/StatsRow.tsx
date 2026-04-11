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
          ? "bg-[#1E1E1E] text-white"
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
        label="MRR (активные подписки)"
        value={`${mrr.toLocaleString("ru-RU")} ₽`}
        sub="990₽/мес × PRO подписчики"
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
