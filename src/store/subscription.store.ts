import { create } from 'zustand';

// ─────────────────────────────────────────────────────────────────────────────
// Subscription Store — RevenueCat entitlements
// ─────────────────────────────────────────────────────────────────────────────

export type SubscriptionTier = 'free' | 'premium' | 'lifetime';
export type SubscriptionPeriod = 'monthly' | 'annual' | 'lifetime';

export interface SubscriptionPackage {
  identifier: string;
  productIdentifier: string;
  price: string;
  period: SubscriptionPeriod;
  introductoryOffer?: {
    price: string;
    duration: string;
  };
}

export interface SubscriptionState {
  tier: SubscriptionTier;
  period?: SubscriptionPeriod;
  expiresAt?: string;
  isLoading: boolean;
  packages: SubscriptionPackage[];
  error?: string;
  isPro: boolean;
  setTier: (tier: SubscriptionTier, period?: SubscriptionPeriod, expiresAt?: string) => void;
  setPackages: (packages: SubscriptionPackage[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error?: string) => void;
  isPremium: () => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  tier: 'free',
  isLoading: false,
  isPro: false,
  packages: [],

  setTier: (tier, period, expiresAt) => set({ tier, period, expiresAt, isPro: tier !== 'free' }),
  setPackages: (packages) => set({ packages }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  isPremium: () => get().tier !== 'free',
}));
