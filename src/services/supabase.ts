import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Supabase config:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  keyLength: supabaseAnonKey?.length
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check .env.local file.');
}

// Create Supabase client with options for self-hosted instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' // Добавляем PKCE flow для безопасности
  },
  global: {
    headers: {
      'X-Client-Info': 'swipely-app'
    }
  }
});

// ==============================================
// DATABASE TYPES
// ==============================================

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  subscription_tier: 'free' | 'pro';
  subscription_status: 'active' | 'cancelled' | 'expired';
  subscription_started_at: string | null;
  subscription_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsageTracking {
  id: string;
  user_id: string;
  generation_type: 'carousel' | 'image';
  created_at: string;
  metadata?: Record<string, any>;
}

export interface Project {
  id: string;
  user_id: string;
  project_type: 'carousel' | 'image';
  title: string;
  data: any; // Slide[] for carousel, { image, prompt } for image
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  yookassa_payment_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'cancelled';
  subscription_months: number;
  created_at: string;
  updated_at: string;
}

// ==============================================
// HELPER TYPES
// ==============================================

export type SubscriptionTier = 'free' | 'pro';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';
export type GenerationType = 'carousel' | 'image';
export type PaymentStatus = 'pending' | 'succeeded' | 'cancelled';
