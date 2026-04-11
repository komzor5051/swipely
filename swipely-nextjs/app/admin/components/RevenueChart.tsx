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
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-[#1E1E1E] text-white text-[10px] font-mono px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity">
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
