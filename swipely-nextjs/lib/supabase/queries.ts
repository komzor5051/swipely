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
