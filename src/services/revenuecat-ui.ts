import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

import { PRO_ENTITLEMENT } from '@/constants/revenuecat';
import { isRevenueCatConfigured, refreshCustomerInfo } from './revenuecat';

// ─────────────────────────────────────────────────────────────────────────────
// RevenueCat Paywalls & Customer Center
//
// Both are native views rendered by the SDK and designed in the RevenueCat
// dashboard — copy, pricing and layout change without an app release.
//
// Neither works in Expo Go: the SDK swaps in a "Preview API Mode" placeholder
// there. `isNativeUiAvailable()` detects that so the app can render its own
// paywall instead of showing the SDK's grey placeholder to a real user.
// ─────────────────────────────────────────────────────────────────────────────

const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * True when the native Paywall / Customer Center views can actually render.
 * Requires a development or production build — not Expo Go, not web.
 */
export function isNativeUiAvailable(): boolean {
  return !isExpoGo && Platform.OS !== 'web' && isRevenueCatConfigured();
}

export type PaywallOutcome = 'purchased' | 'restored' | 'cancelled' | 'not-presented' | 'error';

function mapResult(result: PAYWALL_RESULT): PaywallOutcome {
  switch (result) {
    case PAYWALL_RESULT.PURCHASED:
      return 'purchased';
    case PAYWALL_RESULT.RESTORED:
      return 'restored';
    case PAYWALL_RESULT.CANCELLED:
      return 'cancelled';
    case PAYWALL_RESULT.NOT_PRESENTED:
      return 'not-presented';
    case PAYWALL_RESULT.ERROR:
    default:
      return 'error';
  }
}

/**
 * Present the dashboard-configured paywall modally.
 *
 * Returns 'not-presented' when the native view is unavailable, so the caller
 * can route to the in-app fallback paywall rather than showing nothing.
 */
export async function presentPaywall(): Promise<PaywallOutcome> {
  if (!isNativeUiAvailable()) return 'not-presented';

  try {
    const outcome = mapResult(await RevenueCatUI.presentPaywall());
    if (outcome === 'purchased' || outcome === 'restored') {
      await refreshCustomerInfo();
    }
    return outcome;
  } catch (e) {
    console.warn('[RevenueCatUI] presentPaywall failed:', e);
    return 'error';
  }
}

/**
 * Present the paywall only if `dailyprayer_pro` is not already active.
 *
 * This is the one-call gate for a premium action: the SDK checks the
 * entitlement itself, so there is no window where local state is stale.
 */
export async function presentPaywallIfNeeded(): Promise<PaywallOutcome> {
  if (!isNativeUiAvailable()) return 'not-presented';

  try {
    const outcome = mapResult(
      await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: PRO_ENTITLEMENT,
      })
    );
    if (outcome === 'purchased' || outcome === 'restored') {
      await refreshCustomerInfo();
    }
    return outcome;
  } catch (e) {
    console.warn('[RevenueCatUI] presentPaywallIfNeeded failed:', e);
    return 'error';
  }
}

/**
 * Present the Customer Center — the SDK's built-in screen for managing an
 * existing subscription: cancel, change plan, request a refund (iOS),
 * restore, and the "I can't find my purchase" flows.
 *
 * Apple expects a paying user to be able to reach subscription management
 * from inside the app; this satisfies that without hand-building the screens.
 */
export async function presentCustomerCenter(): Promise<boolean> {
  if (!isNativeUiAvailable()) return false;

  try {
    await RevenueCatUI.presentCustomerCenter({
      callbacks: {
        onRestoreCompleted: () => {
          void refreshCustomerInfo();
        },
        onRestoreFailed: ({ error }) => {
          console.warn('[CustomerCenter] Restore failed:', error.message);
        },
        onShowingManageSubscriptions: () => {
          // The user was handed off to the store's own management screen; the
          // change lands via the customer-info listener when they return.
        },
        onRefundRequestCompleted: ({ productIdentifier, refundRequestStatus }) => {
          console.log('[CustomerCenter] Refund request:', productIdentifier, refundRequestStatus);
          void refreshCustomerInfo();
        },
        onFeedbackSurveyCompleted: ({ feedbackSurveyOptionId }) => {
          console.log('[CustomerCenter] Cancellation reason:', feedbackSurveyOptionId);
        },
        onManagementOptionSelected: (event) => {
          console.log('[CustomerCenter] Management option:', event.option);
        },
      },
    });
    // Entitlements may have changed while the sheet was open.
    await refreshCustomerInfo();
    return true;
  } catch (e) {
    console.warn('[RevenueCatUI] presentCustomerCenter failed:', e);
    return false;
  }
}
