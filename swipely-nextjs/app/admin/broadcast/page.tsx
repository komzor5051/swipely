import { createAdminClient } from "@/lib/supabase/admin";
import { BroadcastEditor } from "./BroadcastEditor";

export const dynamic = "force-dynamic";

export default async function BroadcastPage() {
  const admin = createAdminClient();
  const { count } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .not("telegram_id", "is", null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0D0D14]">Рассылка</h1>
        <p className="text-sm text-[#9CA3AF] mt-1">
          Создай карусель, проверь превью и отправь {count ?? 0} пользователям
        </p>
      </div>
      <BroadcastEditor telegramCount={count ?? 0} />
    </div>
  );
}
