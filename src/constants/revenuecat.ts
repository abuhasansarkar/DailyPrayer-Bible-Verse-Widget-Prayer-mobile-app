// ─────────────────────────────────────────────────────────────────────────────
// RevenueCat identifiers
//
// Single source of truth for every string the RevenueCat dashboard and this
// app have to agree on. If you rename something in the dashboard, change it
// here and nowhere else.
//
// Dashboard → Product catalog must match this exactly:
//
//   Entitlement   dailyprayer_pro
//   Offering      default            (marked "Current" in the dashboard)
//     └─ Package  monthly            → product dailyprayer_monthly
//     └─ Package  yearly             → product dailyprayer_yearly
//
// Both packages must be attached to the `dailyprayer_pro` entitlement, or a
// completed purchase will not unlock anything.
// ─────────────────────────────────────────────────────────────────────────────

/** The one entitlement that gates every paid feature in the app. */
export const PRO_ENTITLEMENT = 'dailyprayer_pro';

/** Offering to fall back to when no offering is marked "Current". */
export const DEFAULT_OFFERING = 'default';

/**
 * Package identifiers as configured in the dashboard.
 *
 * RevenueCat's own conventional identifiers are `$rc_monthly` / `$rc_annual`.
 * This project uses the custom identifiers `monthly` / `yearly`, so package
 * lookup accepts either — see `findPackage()` in services/revenuecat.ts.
 */
export const PACKAGE_IDS = {
  monthly: ['monthly', '$rc_monthly'],
  yearly: ['yearly', 'annual', '$rc_annual'],
} as const;

export type BillingPeriod = keyof typeof PACKAGE_IDS;

/**
 * A Test Store key ("test_…") talks to RevenueCat's simulated store: purchases
 * are fake, subscriptions renew every few minutes and cancel after 5 renewals.
 *
 * RevenueCat's rule, enforced in code by `resolveApiKey()`:
 * never submit a build to the App Store or Play Store configured with one.
 * https://www.revenuecat.com/docs/test-and-launch/sandbox/test-store
 */
export const TEST_STORE_KEY_PREFIX = 'test_';

// ─────────────────────────────────────────────────────────────────────────────
// Pure logic
//
// Kept here, free of any `react-native-purchases` runtime import, so it can be
// unit-tested without native modules. services/revenuecat.ts supplies the
// real inputs.
// ─────────────────────────────────────────────────────────────────────────────

export type ApiKeySource = 'platform' | 'test-store' | 'none';

function isPlaceholder(key: string): boolean {
  return !key || key.startsWith('YOUR_') || key.includes('your_');
}

export function isTestStoreKey(key: string): boolean {
  return key.startsWith(TEST_STORE_KEY_PREFIX);
}

/**
 * Decide which API key to configure the SDK with.
 *
 * A real platform key always wins. A Test Store key is accepted only when
 * `isDev` is true: RevenueCat's rule is that a binary submitted to either
 * store must never be configured with one, so a release build gets `none`
 * (purchases disabled) rather than a fake-purchase path that would hand out
 * entitlements for free.
 *
 * `platformKey` is also checked for a `test_` prefix because pasting a test
 * key into the iOS/Android slot is an easy mistake to make.
 */
export function selectApiKey(input: {
  platformKey: string;
  testKey: string;
  isDev: boolean;
}): { apiKey: string; source: ApiKeySource } {
  const platformKey = input.platformKey.trim();
  const testKey = input.testKey.trim();

  if (platformKey && !isPlaceholder(platformKey) && !isTestStoreKey(platformKey)) {
    return { apiKey: platformKey, source: 'platform' };
  }

  const usableTestKey = [testKey, platformKey].find(
    (key) => key && !isPlaceholder(key) && isTestStoreKey(key)
  );

  if (usableTestKey && input.isDev) {
    return { apiKey: usableTestKey, source: 'test-store' };
  }

  return { apiKey: '', source: 'none' };
}

/** The shape of a RevenueCat entitlement, narrowed to what tier mapping needs. */
export interface EntitlementLike {
  readonly isActive: boolean;
  readonly periodType: string;
  readonly expirationDate: string | null;
}

export interface TierMapping {
  tier: 'free' | 'premium' | 'lifetime';
  qualifier?: 'trial' | 'lifetime';
  expiresAt?: string;
}

/**
 * Map the `dailyprayer_pro` entitlement onto the app's tier.
 *
 * A lifetime (non-consumable) purchase has no expiry date; a subscription
 * always has one. That distinction — not the product identifier — is what
 * separates 'lifetime' from 'premium', so a lifetime buyer is never reported
 * as having nothing to restore.
 */
export function tierFromEntitlement(pro: EntitlementLike | undefined | null): TierMapping {
  if (!pro || !pro.isActive) return { tier: 'free' };
  if (pro.expirationDate === null) return { tier: 'lifetime', qualifier: 'lifetime' };
  return {
    tier: 'premium',
    qualifier: pro.periodType === 'TRIAL' ? 'trial' : undefined,
    expiresAt: pro.expirationDate,
  };
}

/**
 * Resolve a package identifier to a billing period, or null if it is neither.
 *
 * Used as the fallback when an offering's own `annual`/`monthly` accessors
 * are empty — which happens when packages are created with custom
 * identifiers rather than RevenueCat's `$rc_` conventions.
 */
export function findPackagePeriod(identifier: string): BillingPeriod | null {
  if ((PACKAGE_IDS.yearly as readonly string[]).includes(identifier)) return 'yearly';
  if ((PACKAGE_IDS.monthly as readonly string[]).includes(identifier)) return 'monthly';
  return null;
}
