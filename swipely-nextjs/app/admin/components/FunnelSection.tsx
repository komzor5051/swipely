export function FunnelSection({
  totalUsers,
  activatedUsers,
  usersAtLimit,
  proUsers,
  compact = false,
}: {
  totalUsers: number;
  activatedUsers: number;
  usersAtLimit: number;
  proUsers: number;
  compact?: boolean;
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
      label: "Дошли до лимита (1 ген.)",
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
    <div className={compact ? "" : "bg-white rounded-2xl border border-[#E8E8E4] p-6"}>
      {!compact && <h2 className="font-semibold text-[#0D0D14] mb-1">Воронка конверсии</h2>}
      {!compact && <p className="text-xs text-[#9CA3AF] mb-6">От регистрации до оплаты</p>}

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
      {!compact && (
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
      )}
    </div>
  );
}
