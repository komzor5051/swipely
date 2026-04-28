import { supabase } from './supabase';

export interface AdminUser {
  id: string;
  email: string;
  subscription_tier: 'free' | 'pro';
  subscription_status: 'active' | 'cancelled' | 'expired';
  created_at: string;
}

export interface UserUsage {
  userId: string;
  monthlyCount: number;
}

// Получить всех пользователей
export const getAllUsers = async (): Promise<AdminUser[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, subscription_tier, subscription_status, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    throw error;
  }

  return data as AdminUser[];
};

// Получить статистику использования за месяц
export const getUserMonthlyUsage = async (userId: string): Promise<number> => {
  const { data, error } = await supabase
    .rpc('get_monthly_usage_count', { p_user_id: userId });

  if (error) {
    console.error('Error fetching usage:', error);
    return 0;
  }

  return data || 0;
};

// Повысить до PRO
export const upgradeUserToPro = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_tier: 'pro',
      subscription_status: 'active',
      subscription_started_at: new Date().toISOString(),
      subscription_ends_at: null // Безлимитная подписка
    })
    .eq('id', userId);

  if (error) {
    console.error('Error upgrading user:', error);
    throw error;
  }
};

// Понизить до FREE
export const downgradeUserToFree = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_tier: 'free',
      subscription_status: 'active',
      subscription_started_at: null,
      subscription_ends_at: null
    })
    .eq('id', userId);

  if (error) {
    console.error('Error downgrading user:', error);
    throw error;
  }
};
