type PaymentRow = {
  id: string;
  created_at: string | null;
  amount: number | null;
  currency: string | null;
  status: string | null;
  product_type: string | null;
  payment_method: string | null;
  user_email: string | null;
};

const PRODUCT_NAMES: Record<string, string> = {
  pro_monthly: "PRO месяц",
  pro_yearly: "PRO год",
  pack_15: "15 слайдов",
  pack_50: "50 слайдов",
  pack_150: "150 слайдов",
  photo_custom: "Photo (кастом)",
  test_1rub: "Тест 1₽",
};

const STATUS_STYLES: Record<string, string> = {
  succeeded: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-600",
};

export function PaymentsTable({ payments }: { payments: PaymentRow[] }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E8E4] overflow-hidden">
      <div className="px-6 py-4 border-b border-[#E8E8E4]">
        <h2 className="font-semibold text-[#0D0D14]">
          Платежи (последние {payments.length})
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#F9F9F7] text-xs text-[#9CA3AF] uppercase tracking-wide">
              <th className="py-3 px-4 text-left font-medium">Дата</th>
              <th className="py-3 px-4 text-left font-medium">Email</th>
              <th className="py-3 px-4 text-left font-medium">Продукт</th>
              <th className="py-3 px-4 text-left font-medium">Сумма</th>
              <th className="py-3 px-4 text-left font-medium">Статус</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr
                key={p.id}
                className="border-b border-[#E8E8E4] hover:bg-[#F9F9F7] transition-colors"
              >
                <td className="py-3 px-4 text-sm text-[#9CA3AF] font-mono whitespace-nowrap">
                  {p.created_at
                    ? new Date(p.created_at).toLocaleString("ru-RU", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                      })
                    : "—"}
                </td>
                <td className="py-3 px-4 text-sm text-[#0D0D14] max-w-[200px] truncate">
                  {p.user_email || "—"}
                </td>
                <td className="py-3 px-4 text-sm text-[#0D0D14]">
                  {PRODUCT_NAMES[p.product_type || ""] || p.product_type || "—"}
                </td>
                <td className="py-3 px-4 text-sm font-bold font-mono text-[#0D0D14]">
                  {p.amount ? `${p.amount.toLocaleString("ru-RU")} ₽` : "—"}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      STATUS_STYLES[p.status || ""] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {p.status || "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
