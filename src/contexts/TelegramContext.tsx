import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// ==============================================
// TELEGRAM WEBAPP TYPES
// ==============================================

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    auth_date?: number;
    hash?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  ready: () => void;
  expand: () => void;
  close: () => void;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
  };
  BackButton: {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  showPopup: (params: { title?: string; message: string; buttons?: Array<{ id?: string; type?: string; text: string }> }, callback?: (buttonId: string) => void) => void;
  openLink: (url: string) => void;
  openTelegramLink: (url: string) => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

// ==============================================
// PROFILE TYPE (from backend)
// ==============================================

interface Profile {
  id: string;
  telegramId: number;
  fullName: string | null;
  subscriptionTier: 'free' | 'pro';
  subscriptionStatus: 'active' | 'cancelled' | 'expired';
  createdAt: string;
}

// ==============================================
// CONTEXT TYPE
// ==============================================

interface TelegramContextType {
  // Telegram WebApp
  webApp: TelegramWebApp | null;
  user: TelegramUser | null;
  initData: string;

  // Profile from backend
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  refreshProfile: () => Promise<void>;

  // Telegram UI helpers
  haptic: (type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning') => void;
  showAlert: (message: string) => void;
  showConfirm: (message: string) => Promise<boolean>;
}

// ==============================================
// API CONFIG
// ==============================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ==============================================
// CREATE CONTEXT
// ==============================================

const TelegramContext = createContext<TelegramContextType | undefined>(undefined);

// ==============================================
// TELEGRAM PROVIDER
// ==============================================

export const TelegramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState<string>('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Authenticate with backend
  const authenticate = useCallback(async (tgInitData: string) => {
    try {
      console.log('🔐 Authenticating with backend...');

      const response = await fetch(`${API_BASE_URL}/api/auth/telegram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initData: tgInitData }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      console.log('✅ Authenticated:', data.profile.telegramId);
      setProfile(data.profile);
      setError(null);

      return data.profile;
    } catch (err) {
      console.error('❌ Auth error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
      return null;
    }
  }, []);

  // Refresh profile from backend
  const refreshProfile = useCallback(async () => {
    if (!initData) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `tma ${initData}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setProfile(data.profile);
      }
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  }, [initData]);

  // Initialize Telegram WebApp
  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (tg) {
      console.log('📱 Telegram WebApp detected');
      console.log('   Platform:', tg.platform);
      console.log('   Version:', tg.version);

      // Store WebApp instance
      setWebApp(tg);
      setInitData(tg.initData);

      // Get user from initDataUnsafe (for UI, not for auth)
      if (tg.initDataUnsafe.user) {
        setUser(tg.initDataUnsafe.user);
      }

      // Tell Telegram we're ready
      tg.ready();

      // Expand to full height
      tg.expand();

      // Set theme colors
      tg.setHeaderColor('#FAF8F6');
      tg.setBackgroundColor('#FAF8F6');

      // Authenticate with backend
      if (tg.initData) {
        authenticate(tg.initData).finally(() => {
          setIsLoading(false);
        });
      } else {
        console.warn('⚠️ No initData available');
        setIsLoading(false);
      }
    } else {
      console.log('🌐 Running in browser (not Telegram)');

      // Development mode - create mock user
      if (import.meta.env.DEV) {
        console.log('🔧 Dev mode: creating mock user');
        setUser({
          id: 123456789,
          first_name: 'Dev',
          last_name: 'User',
          username: 'devuser',
          language_code: 'ru'
        });
        setProfile({
          id: 'dev-profile-id',
          telegramId: 123456789,
          fullName: 'Dev User',
          subscriptionTier: 'free',
          subscriptionStatus: 'active',
          createdAt: new Date().toISOString()
        });
      }

      setIsLoading(false);
    }
  }, [authenticate]);

  // Haptic feedback helper
  const haptic = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning') => {
    if (!webApp?.HapticFeedback) return;

    if (type === 'success' || type === 'error' || type === 'warning') {
      webApp.HapticFeedback.notificationOccurred(type);
    } else {
      webApp.HapticFeedback.impactOccurred(type);
    }
  }, [webApp]);

  // Alert helper
  const showAlert = useCallback((message: string) => {
    if (webApp) {
      webApp.showAlert(message);
    } else {
      alert(message);
    }
  }, [webApp]);

  // Confirm helper
  const showConfirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (webApp) {
        webApp.showConfirm(message, resolve);
      } else {
        resolve(confirm(message));
      }
    });
  }, [webApp]);

  return (
    <TelegramContext.Provider
      value={{
        webApp,
        user,
        initData,
        profile,
        isLoading,
        isAuthenticated: !!profile,
        error,
        refreshProfile,
        haptic,
        showAlert,
        showConfirm,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
};

// ==============================================
// USE TELEGRAM HOOK
// ==============================================

export const useTelegram = () => {
  const context = useContext(TelegramContext);

  if (!context) {
    throw new Error('useTelegram must be used within TelegramProvider');
  }

  return context;
};
