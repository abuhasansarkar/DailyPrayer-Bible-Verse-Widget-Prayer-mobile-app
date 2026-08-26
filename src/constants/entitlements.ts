import { useSubscriptionStore } from '@/store/subscription.store';
import { PRO_ENTITLEMENT } from '@/constants/revenuecat';

export { PRO_ENTITLEMENT };

// ─────────────────────────────────────────────────────────────────────────────
// Entitlements
//
// Single source of truth for what the free tier allows. Every limit here is
// actually enforced somewhere in the app, and the paywall copy in
// src/app/premium/index.tsx is generated from FREE_FEATURES/PREMIUM_FEATURES
// below — so the two cannot drift apart.
//
// "Paid" means exactly one thing: the RevenueCat `dailyprayer_pro`
// entitlement is active. services/revenuecat.ts maps that entitlement onto
// the subscription store's tier, and everything below reads the store.
// ─────────────────────────────────────────────────────────────────────────────

export const FREE_LIMITS = {
  /** Saved favourites (verses + prayers combined). */
  favorites: 20,
  /** User-created collections. */
  collections: 2,
  /** Share-image themes available without premium (first N of THEMES). */
  shareThemes: 2,
} as const;

export type FreeLimitKey = keyof typeof FREE_LIMITS;

/** Reasons a gate can fire, used to pick paywall copy. */
export const GATE_MESSAGES: Record<FreeLimitKey | 'premiumPrayer' | 'widgetTheme', string> = {
  favorites: `Free accounts can save ${FREE_LIMITS.favorites} items. Upgrade for unlimited favourites.`,
  collections: `Free accounts can create ${FREE_LIMITS.collections} collections. Upgrade for unlimited.`,
  shareThemes: 'This share design is part of Premium.',
  premiumPrayer: 'This guided prayer is part of the Premium library.',
  widgetTheme: 'This widget theme is part of Premium.',
};

/**
 * Paywall copy, kept next to the limits it describes.
 *
 * Every line here must correspond to a gate that is actually enforced. Claims
 * for unbuilt features (custom photo widget backgrounds, ad removal, advanced
 * streak insights, cloud sync) were removed rather than left unenforced —
 * charging for them would be a store-review and refund problem.
 */
export const FREE_FEATURES: string[] = [
  'Daily Bible verse & guided prayer',
  'Full Bible in 3 public-domain translations',
  'Prayer journal & gratitude log',
  'Faith streak tracking',
  `${FREE_LIMITS.favorites} saved favourites`,
  `${FREE_LIMITS.collections} collections`,
  '5 widget themes',
  'Offline access to everything you have opened',
];

export const PREMIUM_FEATURES: { icon: string; text: string }[] = [
  { icon: '📖', text: 'Complete guided prayer library' },
  { icon: '🎨', text: 'All 20 widget themes' },
  { icon: '✨', text: 'All share-card designs' },
  { icon: '🔖', text: 'Unlimited favourites & collections' },
  { icon: '💛', text: 'Supports ongoing development' },
];

/**
 * Read premium status outside React (services, store actions, event handlers).
 * Inside components prefer `useIsPremium()` so the UI re-renders on change.
 *
 * Reads the mirrored store rather than calling the SDK, so it is synchronous
 * and safe inside a render-adjacent code path. The mirror is kept current by
 * RevenueCat's customer-info listener.
 */
export function isPremiumNow(): boolean {
  return useSubscriptionStore.getState().tier !== 'free';
}

/** Reactive premium flag for components. */
export function useIsPremium(): boolean {
  return useSubscriptionStore((s) => s.tier !== 'free');
}

/**
 * Whether a free user may add one more of `key`, given how many they have.
 * Premium is always allowed.
 */
export function canAddMore(key: FreeLimitKey, currentCount: number): boolean {
  if (isPremiumNow()) return true;
  return currentCount < FREE_LIMITS[key];
}
