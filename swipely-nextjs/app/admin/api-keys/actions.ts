"use server";

import { randomBytes, createHash } from "crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createApiKey, setApiKeyActive, resetApiKeyUsage } from "@/lib/supabase/queries";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !user || user.email !== adminEmail) {
    throw new Error("Unauthorized");
  }
}

/**
 * Generate a new API key. Returns the plain key (shown once) and its ID.
 * Only the SHA-256 hash is stored in the DB.
 */
export async function generateApiKey(
  name: string,
  tenantId: string,
  monthlyLimit: number
): Promise<{ plainKey: string; id: string }> {
  await verifyAdmin();

  const raw = randomBytes(16).toString("hex"); // 32 hex chars
  const plainKey = `swp_live_${raw}`;
  const keyHash = createHash("sha256").update(plainKey).digest("hex");

  const admin = createAdminClient();
  const created = await createApiKey(admin, {
    key_hash: keyHash,
    name: name.trim(),
    tenant_id: tenantId.trim().toLowerCase().replace(/\s+/g, "_"),
    monthly_limit: monthlyLimit,
  });

  if (!created) throw new Error("Failed to create API key");

  revalidatePath("/admin/api-keys");
  return { plainKey, id: created.id };
}

/**
 * Toggle active/inactive for an API key.
 */
export async function toggleApiKey(id: string, active: boolean): Promise<void> {
  await verifyAdmin();
  const admin = createAdminClient();
  const ok = await setApiKeyActive(admin, id, active);
  if (!ok) throw new Error("Failed to update API key");
  revalidatePath("/admin/api-keys");
}

/**
 * Reset usage counter to 0 for an API key.
 */
export async function resetApiKey(id: string): Promise<void> {
  await verifyAdmin();
  const admin = createAdminClient();
  const ok = await resetApiKeyUsage(admin, id);
  if (!ok) throw new Error("Failed to reset API key usage");
  revalidatePath("/admin/api-keys");
}
