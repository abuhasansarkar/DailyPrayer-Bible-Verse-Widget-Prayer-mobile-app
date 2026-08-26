import { useCallback } from 'react';
import { View, Text, Pressable, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import RevenueCatUI from 'react-native-purchases-ui';

import { isNativeUiAvailable } from '@/services/revenuecat-ui';
import { refreshCustomerInfo, restorePurchases } from '@/services/revenuecat';
import { useSubscriptionStore } from '@/store/subscription.store';
import { useResolvedTheme } from '@/hooks/use-theme';
import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';

// ─────────────────────────────────────────────────────────────────────────────
// /settings/subscription — RevenueCat Customer Center
//
// The SDK's own subscription-management screen: change plan, cancel, request
// a refund (iOS), restore, and the "I can't find my purchase" flows. All of
// it is configured in the RevenueCat dashboard.
//
// Embedded rather than presented modally so it sits inside the settings stack
// and keeps the app's own back button.
//
// The fallback below is what a free user, an Expo Go session, or a build
// without a usable API key sees — it never leaves the screen empty.
// ─────────────────────────────────────────────────────────────────────────────

export default function SubscriptionScreen() {
  const { isDark } = useResolvedTheme();
  const tier = useSubscriptionStore((s) => s.tier);
  const expiresAt = useSubscriptionStore((s) => s.expiresAt);
  const customer = useSubscriptionStore((s) => s.customer);

  const bg = isDark ? '#1E1C18' : '#FFF9EE';
  const surfaceBg = isDark ? '#2A2720' : '#F1E6D3';
  const textPrimary = isDark ? '#F5EDD8' : '#292B28';
  const textSecondary = isDark ? '#B8AD97' : '#77766F';

  const onDismiss = useCallback(() => {
    void refreshCustomerInfo();
    router.back();
  }, []);

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16 }}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={{ width: 40, height: 40, borderRadius: 15, backgroundColor: surfaceBg, alignItems: 'center', justifyContent: 'center' }}
      >
        <AppIcon name="arrowLeft" size={20} color={textPrimary} />
      </Pressable>
      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: textPrimary }}>Subscription</Text>
    </View>
  );

  if (isNativeUiAvailable()) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        {header}
        <RevenueCatUI.CustomerCenterView
          style={{ flex: 1 }}
          // The stack header above already provides a back affordance.
          shouldShowCloseButton={false}
          onDismiss={onDismiss}
          onRestoreCompleted={() => {
            void refreshCustomerInfo();
          }}
          onRestoreFailed={({ error }) => {
            Alert.alert('Restore failed', error.message);
          }}
          onRefundRequestCompleted={() => {
            void refreshCustomerInfo();
          }}
          onManagementOptionSelected={(event) => {
            if (event.option === 'custom_url' && event.url) {
              Linking.openURL(event.url).catch(() => {});
            }
          }}
        />
      </SafeAreaView>
    );
  }

  // ── Fallback ───────────────────────────────────────────────────────────────

  async function handleRestore() {
    const result = await restorePurchases();
    if (result.status === 'error') Alert.alert('Restore failed', result.message);
    else if (result.isPro) Alert.alert('Restored', 'Your premium access has been restored.');
    else Alert.alert('Nothing to restore', 'No previous purchases were found for this account.');
  }

  const statusLine =
    tier === 'lifetime'
      ? 'Lifetime access'
      : tier === 'premium'
        ? expiresAt
          ? `Renews ${new Date(expiresAt).toLocaleDateString()}`
          : 'Active'
        : 'Free plan';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      {header}
      <View style={{ paddingHorizontal: 20, gap: 14 }}>
        <View style={{ backgroundColor: surfaceBg, borderRadius: 18, padding: 18, gap: 4 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: textPrimary }}>{statusLine}</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: textSecondary }}>
            {customer?.productIdentifier ?? 'No active purchase on this device.'}
          </Text>
        </View>

        {tier === 'free' ? (
          <Button title="See Premium" onPress={() => router.push('/premium')} size="lg" variant="primary" />
        ) : customer?.managementURL ? (
          <Button
            title="Manage subscription"
            onPress={() => Linking.openURL(customer.managementURL!).catch(() => {})}
            size="lg"
            variant="primary"
          />
        ) : null}

        <Pressable onPress={handleRestore} accessibilityRole="button" style={{ alignItems: 'center', paddingVertical: 12 }}>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: textSecondary }}>Restore purchases</Text>
        </Pressable>

        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: textSecondary, textAlign: 'center' }}>
          Full subscription management needs a development or production build.
        </Text>
      </View>
    </SafeAreaView>
  );
}
