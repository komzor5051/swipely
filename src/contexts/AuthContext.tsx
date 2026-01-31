import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, Profile } from '../services/supabase';
import { User } from '@supabase/supabase-js';

// ==============================================
// AUTH CONTEXT TYPE
// ==============================================

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// ==============================================
// CREATE CONTEXT
// ==============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ==============================================
// AUTH PROVIDER COMPONENT
// ==============================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile from database
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
      return null;
    }
  };

  // Refresh profile data
  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  // Check for active session on mount
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        const profileData = await fetchProfile(session.user.id);
        setProfile(profileData);
      }

      setIsLoading(false);
    });

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        const profileData = await fetchProfile(session.user.id);
        setProfile(profileData);
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    console.log('🔐 Attempting sign in...', { email });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    console.log('📡 Sign in response:', { data, error });

    if (error) {
      console.error('❌ Sign in error:', error);
      throw error;
    }

    console.log('✅ Sign in successful!', data.user?.id);
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    console.log('🔐 Attempting sign up...', { email });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          email: email
        }
      }
    });

    console.log('📡 Sign up response:', { data, error });

    if (error) {
      console.error('❌ Sign up error:', error);
      throw error;
    }

    // Profile will be auto-created by database trigger
    // But we can manually create it here as a fallback
    if (data.user && !data.user.identities?.length) {
      throw new Error('Пользователь с таким email уже существует');
    }

    console.log('✅ Sign up successful!', data.user?.id);
  };

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ==============================================
// USE AUTH HOOK
// ==============================================

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
