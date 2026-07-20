import { useSubscriptionStore } from '@/store/subscription.store';
import { initRevenueCat, purchasePackage, restorePurchases } from '@/services/revenuecat';

/**
 * Convenience hook: returns current premium status + package info.
 * Wraps the subscription store for use in components.
 */
export function useSubscription() {
  const isPremium = useSubscriptionStore((state) => state.isPremium());
  const isLoading = useSubscriptionStore((state) => state.isLoading);
  const packages = useSubscriptionStore((state) => state.packages);

  return {
    isPremium,
    isLoading,
    packages,
    purchase: purchasePackage,
    restore: restorePurchases,
    checkEntitlements: initRevenueCat,
    /** Returns true if a given feature requires premium */
    requiresPremium: (featureKey: 'guided_prayers' | 'widget_themes' | 'journal_export' | 'cloud_sync') => {
      return !isPremium;
    },
  };
}
