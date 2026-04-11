"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !user || user.email !== adminEmail) {
    throw new Error("Unauthorized");
  }
}

export async function updateUserTier(
  userId: string,
  tier: "free" | "pro"
): Promise<void> {
  await verifyAdmin();
  if (tier !== "free" && tier !== "pro") throw new Error("Invalid tier");
  const admin = createAdminClient();

  const subscriptionEnd =
    tier === "pro"
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;

  const { error } = await admin
    .from("profiles")
    .update({ subscription_tier: tier, subscription_end: subscriptionEnd })
    .eq("id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function updateUserBalance(
  userId: string,
  balance: number
): Promise<void> {
  await verifyAdmin();
  if (!Number.isFinite(balance)) throw new Error("Invalid balance");
  const admin = createAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({ photo_slides_balance: Math.max(0, Math.floor(balance)) })
    .eq("id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}
