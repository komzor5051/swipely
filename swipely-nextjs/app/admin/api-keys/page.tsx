import { createAdminClient } from "@/lib/supabase/admin";
import { listApiKeys } from "@/lib/supabase/queries";
import ApiKeysClient from "./ApiKeysClient";

export const dynamic = "force-dynamic";

export default async function ApiKeysPage() {
  const admin = createAdminClient();
  const apiKeys = await listApiKeys(admin);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0D0D14]">API ключи</h1>
        <p className="text-[#6B7280] text-sm mt-1">
          Управление B2B клиентскими ключами. Ключ показывается только при создании.
        </p>
      </div>

      <ApiKeysClient apiKeys={apiKeys} />
    </div>
  );
}
