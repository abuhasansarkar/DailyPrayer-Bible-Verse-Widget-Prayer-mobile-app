import { create } from 'zustand';

// ─────────────────────────────────────────────────────────────────────────────
// Subscription Store — mirrors RevenueCat entitlements
//
// Written only by services/revenuecat.ts (from the customer-info listener).
// Everything else in the app reads from here, so no screen has to import the
// Purchases SDK or await a network call to know whether the user is Pro.
// ─────────────────────────────────────────────────────────────────────────────

export type SubscriptionTier = 'free' | 'premium' | 'lifetime';

/** Billing period of a package, named to match the dashboard packages. */
export type BillingPeriod = 'monthly' | 'yearly' | 'lifetime' | 'other';

/** Extra qualifier on the current tier. */
export type TierQualifier = 'trial' | 'lifetime';

/** Which key the SDK was configured with — drives the dev-only test banner. */
export type ApiKeySource = 'platform' | 'test-store' | 'none';

export interface SubscriptionPackage {
  identifier: string;
  productIdentifier: string;
  /** Localised, store-formatted price. Never build this string yourself. */
  price: string;
  period: BillingPeriod;
  title: string;
  description: string;
  introductoryOffer?: {
    price: string;
    periodUnit: string;
    periodNumberOfUnits: number;
  };
}

export interface CustomerSnapshot {
  originalAppUserId: string;
  /** Deep link to the store's subscription management screen, if any. */
  managementURL: string | null;
  activeEntitlements: string[];
  willRenew: boolean;
  productIdentifier: string | null;
  store: string | null;
}

export interface SubscriptionState {
  tier: SubscriptionTier;
  qualifier?: TierQualifier;
  expiresAt?: string;
  isLoading: boolean;
  packages: SubscriptionPackage[];
  error?: string;
  customer?: CustomerSnapshot;
  keySource: ApiKeySource;
  /** Kept as a plain field so non-reactive readers can use getState().isPro. */
  isPro: boolean;

  setTier: (tier: SubscriptionTier, qualifier?: TierQualifier, expiresAt?: string) => void;
  setPackages: (packages: SubscriptionPackage[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error?: string) => void;
  setCustomerInfo: (customer: CustomerSnapshot) => void;
  setKeySource: (source: ApiKeySource) => void;
  isPremium: () => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  tier: 'free',
  isLoading: false,
  isPro: false,
  packages: [],
  keySource: 'none',

  setTier: (tier, qualifier, expiresAt) =>
    set({ tier, qualifier, expiresAt, isPro: tier !== 'free' }),
  setPackages: (packages) => set({ packages }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setCustomerInfo: (customer) => set({ customer }),
  setKeySource: (keySource) => set({ keySource }),
  isPremium: () => get().tier !== 'free',
}));
