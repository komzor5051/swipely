import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { checkUsageLimit, UsageLimitResult } from '../services/usageService';

export const useUsageLimit = () => {
  const { user } = useAuth();
  const [usageLimit, setUsageLimit] = useState<UsageLimitResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch usage limit data
  const fetchUsageLimit = useCallback(async () => {
    if (!user) {
      setUsageLimit(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const limit = await checkUsageLimit(user.id);
      setUsageLimit(limit);
    } catch (err) {
      console.error('Failed to check usage limit:', err);
      setError('Не удалось проверить лимиты');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Refresh limit (call after generation)
  const refreshLimit = useCallback(async () => {
    await fetchUsageLimit();
  }, [fetchUsageLimit]);

  // Fetch on mount and when user changes
  useEffect(() => {
    fetchUsageLimit();
  }, [fetchUsageLimit]);

  return {
    usageLimit,
    isLoading,
    error,
    refreshLimit
  };
};
