/**
 * Usage limit hook for Telegram Mini App
 * Uses backend API instead of direct Supabase calls
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useTelegram } from '../contexts/TelegramContext';

export interface UsageLimitResult {
  canGenerate: boolean;
  remainingGenerations: number;
  isPro: boolean;
  usedThisMonth: number;
  limit: number;
}

export function useUsageLimitTelegram() {
  const { isAuthenticated, initData } = useTelegram();
  const [usageLimit, setUsageLimit] = useState<UsageLimitResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLimit = useCallback(async () => {
    if (!isAuthenticated || !initData) {
      setUsageLimit(null);
      setIsLoading(false);
      return;
    }

    try {
      // Make sure API has initData
      api.setInitData(initData);

      const response = await api.checkUsage();

      if (response.success && response.usage) {
        setUsageLimit({
          canGenerate: response.usage.canGenerate,
          remainingGenerations: response.usage.remaining,
          isPro: response.usage.isPro,
          usedThisMonth: response.usage.used,
          limit: response.usage.limit,
        });
      }
    } catch (error) {
      console.error('Failed to fetch usage limit:', error);
      // Set default free tier on error
      setUsageLimit({
        canGenerate: true,
        remainingGenerations: 5,
        isPro: false,
        usedThisMonth: 0,
        limit: 5,
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, initData]);

  // Fetch on mount and when auth changes
  useEffect(() => {
    fetchLimit();
  }, [fetchLimit]);

  // Refresh function
  const refreshLimit = useCallback(async () => {
    setIsLoading(true);
    await fetchLimit();
  }, [fetchLimit]);

  return {
    usageLimit,
    isLoading,
    refreshLimit,
  };
}
