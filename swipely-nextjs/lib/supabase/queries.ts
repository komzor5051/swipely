import { SupabaseClient } from "@supabase/supabase-js";

// ─── Types ───

export interface Profile {
  id: string;
  telegram_id?: number;
  email?: string;
  username?: string;
  first_name?: string;
  subscription_tier: "free" | "pro";
  subscription_end?: string;
  standard_used: number;
  photo_slides_balance: number;
  referral_code?: string;
  last_month_reset?: string;
  referral_bonus_applied?: boolean;
  referral_count?: number;
  tov_guidelines?: string;
  tov_profile?: {
    sentence_length: string;
    emoji_usage: string;
    tone: string;
    language_level: string;
    vocabulary_style: string;
    formatting_style: string;
    source_url: string;
    analyzed_at: string;
  };
  onboarding_completed?: boolean;
  created_at: string;
}

export interface Generation {
  id: string;
  user_id: string;
  template: string;
  slide_count: number;
  format: string;
  tone?: string;
  input_text: string;
  output_json: Record<string, unknown>;
  created_at: string;
}

// ─── Profile Queries ───

export async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) return null;
  return data as Profile;
}

export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  updates: Partial<Pick<Profile, "username" | "first_name" | "tov_guidelines" | "tov_profile" | "onboarding_completed">>
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) return null;
  return data as Profile;
}

// ─── Generation Queries ───

export async function getGenerations(
  supabase: SupabaseClient,
  userId: string,
  limit = 20,
  offset = 0
): Promise<Generation[]> {
  const { data, error } = await supabase
    .from("generations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return [];
  return data as Generation[];
}

export async function saveGeneration(
  supabase: SupabaseClient,
  generation: Omit<Generation, "id" | "created_at">
): Promise<Generation | null> {
  const { data, error } = await supabase
    .from("generations")
    .insert(generation)
    .select()
    .single();

  if (error) return null;
  return data as Generation;
}

export async function deleteGeneration(
  supabase: SupabaseClient,
  generationId: string,
  userId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("generations")
    .delete()
    .eq("id", generationId)
    .eq("user_id", userId);

  return !error;
}

// ─── Usage Queries ───

export async function getUsage(
  supabase: SupabaseClient,
  userId: string
): Promise<{ used: number; limit: number; tier: string }> {
  const profile = await getProfile(supabase, userId);
  if (!profile) return { used: 0, limit: 3, tier: "free" };

  const limit = profile.subscription_tier === "pro" ? -1 : 3;
  return {
    used: profile.standard_used,
    limit,
    tier: profile.subscription_tier,
  };
}

export async function checkLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const usage = await getUsage(supabase, userId);
  if (usage.limit === -1) return true; // unlimited
  return usage.used < usage.limit;
}

export async function incrementUsage(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  await supabase.rpc("increment_standard_used", { user_id_param: userId });
}

// ─── Stats ───

export async function getGenerationCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("generations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) return 0;
  return count ?? 0;
}

// ─── Monthly Reset ───

/**
 * Calls reset_monthly_if_needed RPC — resets standard_used to 0
 * if the current calendar month differs from last_month_reset.
 * Safe to call on every generate request (no-op within same month).
 */
export async function resetMonthlyIfNeeded(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  await supabase.rpc("reset_monthly_if_needed", { user_id_param: userId });
}

// ─── Subscription Expiry ───

/**
 * Checks if a PRO subscription has expired.
 * If expired: downgrades profile to 'free' in DB and returns 'free'.
 * If active or not PRO: returns current tier unchanged.
 */
export async function checkSubscriptionExpiry(
  supabase: SupabaseClient,
  userId: string,
  profile: Pick<Profile, "subscription_tier" | "subscription_end">
): Promise<"free" | "pro"> {
  if (profile.subscription_tier !== "pro") return profile.subscription_tier;
  if (!profile.subscription_end) return "pro";

  const expiry = new Date(profile.subscription_end);
  if (expiry > new Date()) return "pro";

  // Expired — downgrade in DB
  await supabase
    .from("profiles")
    .update({ subscription_tier: "free" })
    .eq("id", userId);

  return "free";
}

// ─── Referral Queries ───

export interface ReferralStats {
  code: string | null;
  count: number;
  totalBonusEarned: number; // 5 slides per referral
}

export async function getReferralStats(
  supabase: SupabaseClient,
  userId: string
): Promise<ReferralStats> {
  const { data } = await supabase
    .from("profiles")
    .select("referral_code, referral_count")
    .eq("id", userId)
    .single();

  const count = data?.referral_count ?? 0;
  return {
    code: data?.referral_code ?? null,
    count,
    totalBonusEarned: count * 5,
  };
}

/**
 * Finds referrer by referral_code and calls grant_referral_bonus RPC.
 * Returns true on success, false if referral code is invalid or self-referral.
 */
export async function processReferral(
  supabase: SupabaseClient,
  newUserId: string,
  referralCode: string
): Promise<boolean> {
  const { data: referrer } = await supabase
    .from("profiles")
    .select("id")
    .eq("referral_code", referralCode)
    .single();

  if (!referrer || referrer.id === newUserId) return false;

  const { error } = await supabase.rpc("grant_referral_bonus", {
    new_user_id: newUserId,
    referrer_id: referrer.id,
  });

  return !error;
}
