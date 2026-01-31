/**
 * Supabase client and database operations
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use service_role key for backend

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not configured');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Get or create user profile by Telegram ID
 * @param {object} telegramUser - User data from initData
 * @returns {Promise<object>} Profile data
 */
async function getOrCreateProfile(telegramUser) {
  const { id, firstName, lastName, username, photoUrl } = telegramUser;

  // Try to find existing profile
  const { data: existing, error: findError } = await supabase
    .from('profiles')
    .select('*')
    .eq('telegram_id', id)
    .single();

  if (existing) {
    console.log(`✅ Found existing profile for telegram_id: ${id}`);

    // Update last seen and username if changed
    await supabase
      .from('profiles')
      .update({
        telegram_username: username,
        updated_at: new Date().toISOString()
      })
      .eq('telegram_id', id);

    return existing;
  }

  // Create new profile
  console.log(`📝 Creating new profile for telegram_id: ${id}`);

  const { data: newProfile, error: createError } = await supabase
    .from('profiles')
    .insert({
      telegram_id: id,
      telegram_username: username,
      full_name: [firstName, lastName].filter(Boolean).join(' ') || null,
      subscription_tier: 'free',
      subscription_status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (createError) {
    console.error('❌ Failed to create profile:', createError.message);
    throw new Error('Failed to create user profile');
  }

  return newProfile;
}

/**
 * Get profile by Telegram ID
 */
async function getProfileByTelegramId(telegramId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('❌ Error fetching profile:', error.message);
    return null;
  }

  return data;
}

/**
 * Check generation limit for user
 * @param {string} profileId - Profile UUID
 * @returns {Promise<{ canGenerate: boolean, remaining: number, limit: number, used: number }>}
 */
async function checkGenerationLimit(profileId) {
  // Get profile tier
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', profileId)
    .single();

  if (profileError || !profile) {
    return { canGenerate: false, remaining: 0, limit: 0, used: 0 };
  }

  const isPro = profile.subscription_tier === 'pro';
  const limit = isPro ? 50 : 5;

  if (isPro) {
    return { canGenerate: true, remaining: -1, limit: -1, used: 0, isPro: true };
  }

  // Count generations this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count, error: countError } = await supabase
    .from('usage_tracking')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profileId)
    .gte('created_at', startOfMonth.toISOString());

  const used = count || 0;
  const remaining = Math.max(0, limit - used);

  return {
    canGenerate: remaining > 0,
    remaining,
    limit,
    used,
    isPro: false
  };
}

/**
 * Track a generation
 * @param {string} profileId - Profile UUID
 * @param {string} type - Generation type (carousel, image)
 * @param {object} metadata - Additional data
 */
async function trackGeneration(profileId, type, metadata = {}) {
  const { error } = await supabase
    .from('usage_tracking')
    .insert({
      user_id: profileId,
      generation_type: type,
      metadata,
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error('❌ Failed to track generation:', error.message);
  }
}

module.exports = {
  supabase,
  getOrCreateProfile,
  getProfileByTelegramId,
  checkGenerationLimit,
  trackGeneration
};
