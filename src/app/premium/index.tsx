import { useCallback } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import RevenueCatUI from 'react-native-purchases-ui';

import { isNativeUiAvailable } from '@/services/revenuecat-ui';
import { refreshCustomerInfo } from '@/services/revenuecat';
import { FallbackPaywall } from '@/components/premium/FallbackPaywall';
import { useResolvedTheme } from '@/hooks/use-theme';

// ─────────────────────────────────────────────────────────────────────────────
// /premium
//
// Renders the paywall designed in the RevenueCat dashboard, so copy, layout,
// pricing and A/B tests ship without an app update.
//
// Falls back to the in-app paywall when the native view cannot render — Expo
// Go, web, or a build where the SDK never configured (no usable API key).
// ─────────────────────────────────────────────────────────────────────────────

export default function PremiumScreen() {
  const { isDark } = useResolvedTheme();

  const dismiss = useCallback(() => {
    void refreshCustomerInfo();
    router.back();
  }, []);

  if (!isNativeUiAvailable()) {
    return <FallbackPaywall />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#1E1C18' : '#FFF9EE' }}>
      <RevenueCatUI.Paywall
        style={{ flex: 1 }}
        options={{ displayCloseButton: true }}
        onPurchaseCompleted={() => {
          // The customer-info listener also fires; refreshing here closes the
          // window where the screen dismisses before state has caught up.
          void refreshCustomerInfo();
          router.back();
        }}
        onPurchaseError={({ error }) => {
          console.warn('[Paywall] Purchase error:', error.code, error.message);
        }}
        onRestoreCompleted={() => {
          void refreshCustomerInfo();
        }}
        onRestoreError={({ error }) => {
          console.warn('[Paywall] Restore error:', error.code, error.message);
        }}
        onDismiss={dismiss}
      />
    </View>
  );
}
