/**
 * API Service for Telegram Mini App
 * All requests go through our backend (swipely-api)
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ==============================================
// TYPES
// ==============================================

interface GenerateSettings {
  language?: 'ru' | 'en';
  slideCount?: number;
  style?: string;
  includeOriginalText?: boolean;
}

interface CarouselResponse {
  success: boolean;
  data?: {
    globalDesign: {
      backgroundColor: string;
      accentColor: string;
      pattern: string;
    };
    slides: Array<{
      title: string;
      content: string;
      type: string;
      emphasize?: string[];
    }>;
  };
  usage?: {
    used: number;
    limit: number;
    remaining: number;
    isPro: boolean;
  };
  error?: string;
}

interface UsageResponse {
  success: boolean;
  usage?: {
    canGenerate: boolean;
    remaining: number;
    limit: number;
    used: number;
    isPro: boolean;
    tier: string;
  };
  error?: string;
}

interface UsageStatsResponse {
  success: boolean;
  stats?: {
    thisMonth: number;
    total: number;
    lastGeneration: {
      date: string;
      type: string;
      topic: string;
    } | null;
  };
  error?: string;
}

// ==============================================
// API CLIENT
// ==============================================

class ApiClient {
  private initData: string = '';

  /**
   * Set the Telegram initData for authorization
   */
  setInitData(initData: string) {
    this.initData = initData;
  }

  /**
   * Get authorization header
   */
  private getAuthHeader(): Record<string, string> {
    if (!this.initData) {
      // Dev mode fallback
      if (import.meta.env.DEV) {
        return {};
      }
      throw new Error('Not authenticated');
    }

    return {
      'Authorization': `tma ${this.initData}`,
    };
  }

  /**
   * Make API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  }

  // ==============================================
  // CAROUSEL ENDPOINTS
  // ==============================================

  /**
   * Generate carousel content
   */
  async generateCarousel(
    topic: string,
    settings: GenerateSettings = {}
  ): Promise<CarouselResponse> {
    console.log('🚀 API: Generating carousel...');
    console.log('   Topic:', topic.substring(0, 50));
    console.log('   Settings:', settings);

    const response = await this.request<CarouselResponse>('/api/carousel/generate', {
      method: 'POST',
      body: JSON.stringify({ topic, settings }),
    });

    console.log('✅ API: Carousel generated');
    return response;
  }

  // ==============================================
  // USAGE ENDPOINTS
  // ==============================================

  /**
   * Check usage limit
   */
  async checkUsage(): Promise<UsageResponse> {
    return this.request<UsageResponse>('/api/usage/check');
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(): Promise<UsageStatsResponse> {
    return this.request<UsageStatsResponse>('/api/usage/stats');
  }

  // ==============================================
  // HEALTH CHECK
  // ==============================================

  /**
   * Check if API is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      return data.status === 'ok';
    } catch {
      return false;
    }
  }
}

// ==============================================
// SINGLETON EXPORT
// ==============================================

export const api = new ApiClient();

// ==============================================
// HOOK FOR EASY INIT DATA SETUP
// ==============================================

/**
 * Initialize API client with Telegram initData
 * Call this from TelegramContext on load
 */
export function initializeApi(initData: string) {
  api.setInitData(initData);
}
