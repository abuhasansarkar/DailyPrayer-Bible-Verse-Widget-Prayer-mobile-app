import { useCallback } from 'react';
import { router } from 'expo-router';

import { useSubscriptionStore } from '@/store/subscription.store';
import {
  loadOfferings,
  purchasePeriod,
  refreshCustomerInfo,
  restorePurchases,
} from '@/services/revenuecat';
import { presentPaywall, presentPaywallIfNeeded } from '@/services/revenuecat-ui';
import type { BillingPeriod } from '@/constants/revenuecat';

/**
 * Features that are actually gated somewhere in the app.
 *
 * All of them are unlocked by the single `dailyprayer_pro` entitlement —
 * RevenueCat entitlements are the gate, this union just names the call sites.
 */
export type GatedFeature = 'guided_prayers' | 'widget_themes' | 'share_themes';

const GATED_FEATURES: GatedFeature[] = ['guided_prayers', 'widget_themes', 'share_themes'];

/**
 * Subscription state and actions for components.
 *
 * Reads the store (kept in sync by RevenueCat's customer-info listener), so
 * `isPro` is correct immediately on mount with no loading flash.
 */
export function useSubscription() {
  const tier = useSubscriptionStore((s) => s.tier);
  const isPro = useSubscriptionStore((s) => s.isPro);
  const isLoading = useSubscriptionStore((s) => s.isLoading);
  const packages = useSubscriptionStore((s) => s.packages);
  const error = useSubscriptionStore((s) => s.error);
  const customer = useSubscriptionStore((s) => s.customer);
  const expiresAt = useSubscriptionStore((s) => s.expiresAt);
  const qualifier = useSubscriptionStore((s) => s.qualifier);

  /**
   * Gate a premium action.
   *
   * Presents the native paywall when it can render and falls back to the
   * in-app `/premium` screen otherwise (Expo Go, web, or no configured
   * paywall). Resolves true when the user may proceed.
   */
  const requirePro = useCallback(async (): Promise<boolean> => {
    if (useSubscriptionStore.getState().isPro) return true;

    const outcome = await presentPaywallIfNeeded();
    if (outcome === 'purchased' || outcome === 'restored') return true;
    if (outcome === 'not-presented' || outcome === 'error') {
      router.push('/premium');
    }
    return useSubscriptionStore.getState().isPro;
  }, []);

  return {
    tier,
    isPro,
    /** @deprecated use `isPro` — kept so existing call sites keep compiling. */
    isPremium: isPro,
    isTrial: qualifier === 'trial',
    isLifetime: tier === 'lifetime',
    expiresAt,
    isLoading,
    packages,
    error,
    customer,

    purchase: purchasePeriod,
    restore: restorePurchases,
    reloadOfferings: loadOfferings,
    refresh: refreshCustomerInfo,
    openPaywall: presentPaywall,
    requirePro,

    /** True when `feature` is gated and the user has not paid. */
    requiresPremium: (feature: GatedFeature) => GATED_FEATURES.includes(feature) && !isPro,
  };
}

export type { BillingPeriod };
