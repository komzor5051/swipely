import { supabase } from './supabase';

// ==============================================
// CONSTANTS
// ==============================================

export const FREE_TIER_LIMIT = 5; // 5 generations per month for free users

// ==============================================
// TYPES
// ==============================================

export interface UsageLimitResult {
  canGenerate: boolean;
  remainingGenerations: number;
  isPro: boolean;
  usedThisMonth: number;
  limit: number;
}

// ==============================================
// CHECK USAGE LIMIT
// ==============================================

export const checkUsageLimit = async (userId: string): Promise<UsageLimitResult> => {
  try {
    // Get user profile to check subscription tier
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error('Failed to fetch user profile');
    }

    const isPro = profile.subscription_tier === 'pro';

    // Pro users have unlimited access
    if (isPro) {
      return {
        canGenerate: true,
        remainingGenerations: -1, // -1 means unlimited
        isPro: true,
        usedThisMonth: 0,
        limit: -1
      };
    }

    // For free users, count usage this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error: countError } = await supabase
      .from('usage_tracking')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    if (countError) {
      throw new Error('Failed to check usage count');
    }

    const usedThisMonth = count || 0;
    const remainingGenerations = Math.max(0, FREE_TIER_LIMIT - usedThisMonth);
    const canGenerate = usedThisMonth < FREE_TIER_LIMIT;

    return {
      canGenerate,
      remainingGenerations,
      isPro: false,
      usedThisMonth,
      limit: FREE_TIER_LIMIT
    };
  } catch (error) {
    console.error('Error checking usage limit:', error);
    throw error;
  }
};

// ==============================================
// TRACK GENERATION
// ==============================================

export const trackGeneration = async (
  userId: string,
  generationType: 'carousel' | 'image',
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    console.log('📊 Запись в usage_tracking:', {
      user_id: userId,
      generation_type: generationType,
      metadata: metadata || {}
    });

    const { error, data } = await supabase
      .from('usage_tracking')
      .insert({
        user_id: userId,
        generation_type: generationType,
        metadata: metadata || {}
      })
      .select();

    if (error) {
      console.error('❌ Ошибка записи в usage_tracking:', error);
      throw error;
    }

    console.log('✅ Успешно записано в usage_tracking:', data);
  } catch (error) {
    console.error('❌ Критическая ошибка trackGeneration:', error);
    throw error;
  }
};

// ==============================================
// GET MONTHLY USAGE STATS
// ==============================================

export const getMonthlyUsageStats = async (userId: string) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('usage_tracking')
      .select('generation_type, created_at')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const carouselCount = data?.filter(item => item.generation_type === 'carousel').length || 0;
    const imageCount = data?.filter(item => item.generation_type === 'image').length || 0;

    return {
      total: data?.length || 0,
      carousel: carouselCount,
      image: imageCount,
      history: data || []
    };
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    throw error;
  }
};
