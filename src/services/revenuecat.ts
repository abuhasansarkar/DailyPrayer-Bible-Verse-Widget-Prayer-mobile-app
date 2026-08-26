import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesError,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';

import { ENV } from '@/constants/env';
import {
  DEFAULT_OFFERING,
  PACKAGE_IDS,
  PRO_ENTITLEMENT,
  findPackagePeriod,
  isTestStoreKey,
  selectApiKey,
  tierFromEntitlement,
  type ApiKeySource,
  type BillingPeriod,
} from '@/constants/revenuecat';
import { useSubscriptionStore } from '@/store/subscription.store';

// ─────────────────────────────────────────────────────────────────────────────
// RevenueCat service (react-native-purchases v10)
//
// Everything that talks to the Purchases SDK lives here. UI never imports
// `react-native-purchases` directly — it reads the subscription store, which
// this module keeps in sync from the customer-info listener.
//
// Requires a development build. The SDK falls back to "Preview API Mode" in
// Expo Go (mock responses, no real purchases), which is why nothing here
// throws when native modules are absent.
// ─────────────────────────────────────────────────────────────────────────────

export type { ApiKeySource };

let configured = false;
let customerInfoListener: ((info: CustomerInfo) => void) | null = null;

// ── API key resolution ───────────────────────────────────────────────────────

/**
 * Resolve the key to configure with from the environment.
 *
 * The decision itself lives in `selectApiKey()` (pure, unit-tested); this
 * only supplies the platform-specific inputs and logs the release-build
 * misconfiguration case.
 */
export function resolveApiKey(): { apiKey: string; source: ApiKeySource } {
  const platformKey =
    Platform.select({
      ios: ENV.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS,
      android: ENV.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID,
      default: '',
    }) ?? '';

  const result = selectApiKey({
    platformKey,
    testKey: ENV.EXPO_PUBLIC_REVENUECAT_API_KEY_TEST,
    isDev: __DEV__,
  });

  if (result.source === 'none' && !__DEV__ && isTestStoreKey(platformKey.trim())) {
    console.error(
      '[RevenueCat] A Test Store key was found in a release build and has been ignored. ' +
        'Set EXPO_PUBLIC_REVENUECAT_API_KEY_IOS / _ANDROID to real appl_/goog_ keys before submitting.'
    );
  }

  return result;
}

// ── Entitlement mapping ──────────────────────────────────────────────────────

/**
 * The single place where a CustomerInfo becomes app state.
 *
 * Registered as the customer-info listener, so it also runs on renewals,
 * expiries, refunds and restores performed outside our own call sites
 * (the Paywall UI and Customer Center both trigger it).
 */
function applyCustomerInfo(info: CustomerInfo): void {
  const store = useSubscriptionStore.getState();
  const pro = info.entitlements.active[PRO_ENTITLEMENT];

  const { tier, qualifier, expiresAt } = tierFromEntitlement(pro);
  store.setTier(tier, qualifier, expiresAt);

  store.setCustomerInfo({
    originalAppUserId: info.originalAppUserId,
    managementURL: info.managementURL,
    activeEntitlements: Object.keys(info.entitlements.active),
    willRenew: pro?.willRenew ?? false,
    productIdentifier: pro?.productIdentifier ?? null,
    store: pro?.store ?? null,
  });
}

/** True when the customer currently has the `dailyprayer_pro` entitlement. */
export function hasProEntitlement(info: CustomerInfo): boolean {
  return info.entitlements.active[PRO_ENTITLEMENT] != null;
}

// ── Configuration ────────────────────────────────────────────────────────────

/**
 * Configure the SDK. Safe to call more than once — the second call is a no-op.
 * Call this once at app start, before any screen reads subscription state.
 */
export async function initRevenueCat(): Promise<void> {
  if (configured) return;

  const store = useSubscriptionStore.getState();
  const { apiKey, source } = resolveApiKey();

  if (source === 'none') {
    store.setError('Subscriptions are temporarily unavailable.');
    store.setLoading(false);
    store.setKeySource('none');
    return;
  }

  store.setKeySource(source);
  store.setLoading(true);

  try {
    await Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);

    Purchases.configure({
      apiKey,
      // Start anonymous. `identifyUser()` aliases this device to the Supabase
      // user id after sign-in, so entitlements follow the account.
      appUserID: null,
      // Let the store surface its own billing-problem messages.
      shouldShowInAppMessagesAutomatically: true,
      // Informational: entitlements are still granted if verification fails,
      // but the result is reported so tampering is visible.
      entitlementVerificationMode: Purchases.ENTITLEMENT_VERIFICATION_MODE.INFORMATIONAL,
      diagnosticsEnabled: __DEV__,
    });

    configured = true;

    customerInfoListener = applyCustomerInfo;
    Purchases.addCustomerInfoUpdateListener(customerInfoListener);

    applyCustomerInfo(await Purchases.getCustomerInfo());
    await loadOfferings();

    if (source === 'test-store') {
      console.log(
        '[RevenueCat] Configured with a Test Store key. Purchases are simulated: ' +
          'subscriptions renew every few minutes and cancel after 5 renewals.'
      );
    }
  } catch (e) {
    console.warn('[RevenueCat] Configuration failed:', e);
    store.setError('Could not reach the store. Please try again later.');
    store.setLoading(false);
  }
}

/** Tear down the listener. Only needed in tests and fast-refresh teardown. */
export function teardownRevenueCat(): void {
  if (customerInfoListener) {
    Purchases.removeCustomerInfoUpdateListener(customerInfoListener);
    customerInfoListener = null;
  }
}

export function isRevenueCatConfigured(): boolean {
  return configured;
}

// ── Offerings & packages ─────────────────────────────────────────────────────

/**
 * Fetch the current offering and mirror its packages into the store.
 *
 * Offerings are dashboard-driven: changing prices or swapping products does
 * not require an app update.
 */
export async function loadOfferings(): Promise<PurchasesOffering | null> {
  const store = useSubscriptionStore.getState();
  if (!configured) return null;

  store.setLoading(true);
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current ?? offerings.all[DEFAULT_OFFERING] ?? null;

    if (!current || current.availablePackages.length === 0) {
      console.warn(
        `[RevenueCat] No packages in the current offering. Check that the "${DEFAULT_OFFERING}" ` +
          'offering exists, is marked Current, and its products are approved in the store.'
      );
      store.setPackages([]);
      store.setError('No subscription options are available right now.');
      store.setLoading(false);
      return null;
    }

    store.setPackages(
      current.availablePackages.map((pkg) => ({
        identifier: pkg.identifier,
        productIdentifier: pkg.product.identifier,
        price: pkg.product.priceString,
        period: periodOf(current, pkg),
        title: pkg.product.title,
        description: pkg.product.description,
        introductoryOffer: pkg.product.introPrice
          ? {
              price: pkg.product.introPrice.priceString,
              periodUnit: pkg.product.introPrice.periodUnit,
              periodNumberOfUnits: pkg.product.introPrice.periodNumberOfUnits,
            }
          : undefined,
      }))
    );
    store.setError(undefined);
    store.setLoading(false);
    return current;
  } catch (e) {
    console.warn('[RevenueCat] Could not load offerings:', e);
    store.setPackages([]);
    store.setError('Could not load subscription options.');
    store.setLoading(false);
    return null;
  }
}

function periodOf(offering: PurchasesOffering, pkg: PurchasesPackage): BillingPeriod | 'lifetime' | 'other' {
  if (offering.annual?.identifier === pkg.identifier) return 'yearly';
  if (offering.monthly?.identifier === pkg.identifier) return 'monthly';
  if (offering.lifetime?.identifier === pkg.identifier) return 'lifetime';
  return findPackagePeriod(pkg.identifier) ?? 'other';
}

/**
 * Find the package for a billing period.
 *
 * Prefers the offering's own `annual`/`monthly` accessors — those follow the
 * dashboard's package type regardless of what the identifier is called — and
 * falls back to matching the identifiers in PACKAGE_IDS.
 */
export function findPackage(
  offering: PurchasesOffering,
  period: BillingPeriod
): PurchasesPackage | null {
  const byType = period === 'yearly' ? offering.annual : offering.monthly;
  if (byType) return byType;

  const candidates: readonly string[] = PACKAGE_IDS[period];
  return offering.availablePackages.find((pkg) => candidates.includes(pkg.identifier)) ?? null;
}

// ── Purchase & restore ───────────────────────────────────────────────────────

export type PurchaseOutcome =
  | { status: 'purchased'; isPro: boolean }
  | { status: 'cancelled' }
  | { status: 'pending' }
  | { status: 'error'; message: string; code?: PURCHASES_ERROR_CODE };

function isPurchasesError(e: unknown): e is PurchasesError {
  return typeof e === 'object' && e !== null && 'code' in e;
}

/** Human-readable copy for the error codes a user can actually hit. */
function messageForError(error: PurchasesError): string {
  switch (error.code) {
    case PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR:
      return 'Purchases are not allowed on this device. Check Screen Time or parental controls.';
    case PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR:
      return 'Your purchase is pending approval. Access unlocks once it is confirmed.';
    case PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR:
      return 'You already own this. Try “Restore purchases”.';
    case PURCHASES_ERROR_CODE.RECEIPT_ALREADY_IN_USE_ERROR:
      return 'This purchase belongs to another account. Sign in with that account to use it.';
    case PURCHASES_ERROR_CODE.NETWORK_ERROR:
    case PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR:
      return 'No connection to the store. Check your internet and try again.';
    case PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR:
      return 'The store is having trouble right now. Please try again in a moment.';
    case PURCHASES_ERROR_CODE.INELIGIBLE_ERROR:
      return 'This offer is not available for your account.';
    default:
      return error.message || 'Something went wrong. Please try again.';
  }
}

/**
 * Buy a package.
 *
 * Cancellation is a normal outcome, not an error — it is reported separately
 * so callers do not show a failure alert when the user simply backed out.
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<PurchaseOutcome> {
  if (!configured) {
    return { status: 'error', message: 'Subscriptions are unavailable right now.' };
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    // The listener also fires, but applying here removes the window where the
    // caller navigates away before the UI has updated.
    applyCustomerInfo(customerInfo);
    return { status: 'purchased', isPro: hasProEntitlement(customerInfo) };
  } catch (e) {
    if (isPurchasesError(e)) {
      if (e.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        return { status: 'cancelled' };
      }
      if (e.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
        return { status: 'pending' };
      }
      console.warn('[RevenueCat] Purchase failed:', e.code, e.message);
      return { status: 'error', message: messageForError(e), code: e.code };
    }
    console.warn('[RevenueCat] Purchase failed:', e);
    return { status: 'error', message: 'Something went wrong. Please try again.' };
  }
}

/** Convenience wrapper: buy the monthly or yearly package of the current offering. */
export async function purchasePeriod(period: BillingPeriod): Promise<PurchaseOutcome> {
  const offering = await loadOfferings();
  if (!offering) {
    return { status: 'error', message: 'Subscription options are not available right now.' };
  }

  const pkg = findPackage(offering, period);
  if (!pkg) {
    return { status: 'error', message: `The ${period} plan is not available right now.` };
  }

  return purchasePackage(pkg);
}

export type RestoreOutcome =
  | { status: 'restored'; isPro: boolean }
  | { status: 'error'; message: string };

/**
 * Restore previous purchases.
 *
 * `isPro` reflects the `dailyprayer_pro` entitlement specifically, so a
 * lifetime purchase restores correctly — checking a subscription-only
 * entitlement would report "nothing to restore" to a paying customer.
 */
export async function restorePurchases(): Promise<RestoreOutcome> {
  if (!configured) {
    return { status: 'error', message: 'Subscriptions are unavailable right now.' };
  }

  try {
    const info = await Purchases.restorePurchases();
    applyCustomerInfo(info);
    return { status: 'restored', isPro: hasProEntitlement(info) };
  } catch (e) {
    const message = isPurchasesError(e)
      ? messageForError(e)
      : 'Could not restore purchases. Please try again.';
    console.warn('[RevenueCat] Restore failed:', e);
    return { status: 'error', message };
  }
}

// ── Identity ─────────────────────────────────────────────────────────────────

/**
 * Alias this device to a stable app user id (the Supabase user id).
 *
 * Call after sign-in so a subscription bought on one device is recognised on
 * the next. Without it every install is a separate anonymous customer.
 */
export async function identifyUser(appUserId: string): Promise<void> {
  if (!configured || !appUserId) return;
  try {
    const { customerInfo } = await Purchases.logIn(appUserId);
    applyCustomerInfo(customerInfo);
  } catch (e) {
    console.warn('[RevenueCat] logIn failed:', e);
  }
}

/** Return to an anonymous customer. Call on sign-out. */
export async function forgetUser(): Promise<void> {
  if (!configured) return;
  try {
    applyCustomerInfo(await Purchases.logOut());
  } catch (e) {
    console.warn('[RevenueCat] logOut failed:', e);
  }
}

/** Force-refresh entitlements, e.g. when the app returns to the foreground. */
export async function refreshCustomerInfo(): Promise<void> {
  if (!configured) return;
  try {
    applyCustomerInfo(await Purchases.getCustomerInfo());
  } catch (e) {
    console.warn('[RevenueCat] getCustomerInfo failed:', e);
  }
}
