import { useSubscriptionStore } from '@/store/subscription.store';
import { initRevenueCat, purchasePackage, restorePurchases } from '@/services/revenuecat';

/**
 * Features that are actually gated somewhere in the app.
 *
 * The previous list included `journal_export` and `cloud_sync`, which are free
 * for everyone — asking about them returned "premium required" and would have
 * locked working functionality if this hook were wired into a screen.
 */
export type GatedFeature = 'guided_prayers' | 'widget_themes' | 'share_themes';

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
    /**
     * True when `feature` is gated and the user has not paid.
     * Anything not in GatedFeature is free, so this returns false for it.
     */
    requiresPremium: (feature: GatedFeature) => {
      const gated: GatedFeature[] = ['guided_prayers', 'widget_themes', 'share_themes'];
      return gated.includes(feature) && !isPremium;
    },
  };
}
