import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

import { useSubscriptionStore } from '@/store/subscription.store';
import { loadOfferings, purchasePeriod, restorePurchases } from '@/services/revenuecat';
import { Mascot } from '@/components/mascot/Mascot';
import { Button } from '@/components/ui/Button';
import { useResolvedTheme } from '@/hooks/use-theme';
import { FREE_FEATURES, PREMIUM_FEATURES } from '@/constants/entitlements';
import type { BillingPeriod } from '@/constants/revenuecat';

// ─────────────────────────────────────────────────────────────────────────────
// In-app paywall
//
// Used when RevenueCat's native Paywall cannot render — Expo Go, web, or no
// paywall configured for the current offering. Prices still come from the
// live offering, never from hardcoded copy: showing a price the store will
// not charge is a refund and App Review problem.
// ─────────────────────────────────────────────────────────────────────────────

export function FallbackPaywall() {
  const { t } = useTranslation();
  const { isDark } = useResolvedTheme();
  const packages = useSubscriptionStore((s) => s.packages);
  const isLoading = useSubscriptionStore((s) => s.isLoading);
  const tier = useSubscriptionStore((s) => s.tier);
  const storeError = useSubscriptionStore((s) => s.error);
  const keySource = useSubscriptionStore((s) => s.keySource);
  const isSubscribed = tier !== 'free';

  const [selectedPeriod, setSelectedPeriod] = useState<BillingPeriod>('yearly');
  const [busy, setBusy] = useState<'purchase' | 'restore' | null>(null);

  const bg = isDark ? '#1E1C18' : '#FFF9EE';
  const cardBg = isDark ? '#332F26' : '#FFFFFF';
  const textPrimary = isDark ? '#F5EDD8' : '#292B28';
  const textSecondary = isDark ? '#B8AD97' : '#77766F';

  useEffect(() => {
    if (packages.length === 0) {
      loadOfferings().catch(() => {});
    }
  }, [packages.length]);

  const monthlyPkg = packages.find((p) => p.period === 'monthly');
  const yearlyPkg = packages.find((p) => p.period === 'yearly');
  const selectedPkg = selectedPeriod === 'yearly' ? yearlyPkg : monthlyPkg;

  async function handlePurchase() {
    setBusy('purchase');
    try {
      const result = await purchasePeriod(selectedPeriod);
      switch (result.status) {
        case 'purchased':
          if (result.isPro) router.back();
          else Alert.alert('Almost there', 'The purchase went through but has not unlocked yet. Try “Restore purchases”.');
          break;
        case 'pending':
          Alert.alert('Purchase pending', 'Your purchase needs approval. Access unlocks once it is confirmed.');
          break;
        case 'cancelled':
          break; // User backed out — say nothing.
        case 'error':
          Alert.alert('Purchase failed', result.message);
          break;
      }
    } finally {
      setBusy(null);
    }
  }

  async function handleRestore() {
    setBusy('restore');
    try {
      const result = await restorePurchases();
      if (result.status === 'error') {
        Alert.alert('Restore failed', result.message);
      } else if (result.isPro) {
        Alert.alert('Restored', 'Your premium access has been restored.');
        router.back();
      } else {
        Alert.alert('Nothing to restore', 'No previous purchases were found for this account.');
      }
    } finally {
      setBusy(null);
    }
  }

  const periodLabel: Record<'monthly' | 'yearly', string> = {
    monthly: t('premium.monthly'),
    yearly: t('premium.annual'),
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, alignItems: 'flex-end' }}>
        <Pressable
          onPress={router.back}
          accessibilityRole="button"
          accessibilityLabel={t('common.close', 'Close')}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isDark ? '#2A2720' : '#F1E6D3', alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 18, color: textSecondary }}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(500)} style={{ alignItems: 'center', marginTop: 8, marginBottom: 24 }}>
          <Mascot pose="premium" size={130} />
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 26, color: textPrimary, textAlign: 'center', letterSpacing: -0.5, marginTop: 12, marginBottom: 6 }}>
            {t('premium.title')}
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: textSecondary, textAlign: 'center' }}>
            {t('premium.subtitle')}
          </Text>
        </Animated.View>

        {keySource === 'test-store' && (
          <View style={{ backgroundColor: '#FEF3D1', borderColor: '#F2B84B', borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 16 }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#292B28' }}>
              🧪 Test Store mode
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: '#77766F', marginTop: 2 }}>
              Purchases are simulated and no money moves. Development builds only.
            </Text>
          </View>
        )}

        {/* Plan toggle */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', backgroundColor: isDark ? '#2A2720' : '#F1E6D3', borderRadius: 16, padding: 4, gap: 4 }}>
            {(['monthly', 'yearly'] as const).map((period) => (
              <Pressable
                key={period}
                onPress={() => setSelectedPeriod(period)}
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedPeriod === period }}
                accessibilityLabel={periodLabel[period]}
                style={{
                  flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
                  backgroundColor: selectedPeriod === period ? '#F2B84B' : 'transparent',
                }}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: selectedPeriod === period ? '#292B28' : textSecondary }}>
                  {periodLabel[period]}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Price card — always from the live offering. */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={{ backgroundColor: cardBg, borderRadius: 20, padding: 20, marginBottom: 24, shadowColor: '#292B28', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
          {selectedPkg?.introductoryOffer && (
            <View style={{ backgroundColor: '#F2B84B', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start', marginBottom: 12 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#292B28' }}>
                {selectedPkg.introductoryOffer.periodNumberOfUnits}{' '}
                {selectedPkg.introductoryOffer.periodUnit.toLowerCase()} free trial
              </Text>
            </View>
          )}

          {selectedPkg ? (
            <>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 36, color: textPrimary, letterSpacing: -1, marginBottom: 4 }}>
                {selectedPkg.price}
              </Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: textSecondary }}>
                {selectedPeriod === 'yearly' ? 'Billed yearly' : 'Billed monthly'}
              </Text>
            </>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
              {isLoading ? <ActivityIndicator color="#F2B84B" /> : null}
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: textSecondary, flex: 1 }}>
                {isLoading
                  ? 'Loading plans…'
                  : storeError ?? 'Plans are unavailable right now. Please try again later.'}
              </Text>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={{ gap: 12, marginBottom: 24 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: textPrimary, marginBottom: 4 }}>
            Everything in DailyPrayer Premium:
          </Text>
          {PREMIUM_FEATURES.map((feat) => (
            <View key={feat.text} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 20, width: 28 }}>{feat.icon}</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: textPrimary, flex: 1 }}>{feat.text}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(360)} style={{ gap: 10, marginBottom: 24 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: textPrimary, marginBottom: 4 }}>
            Always free:
          </Text>
          {FREE_FEATURES.map((feat) => (
            <View key={feat} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 15, width: 28, color: '#96AA88' }}>✓</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: textSecondary, flex: 1 }}>{feat}</Text>
            </View>
          ))}
        </Animated.View>
      </ScrollView>

      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16,
        backgroundColor: bg, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(245,237,216,0.07)' : 'rgba(41,43,40,0.07)',
        gap: 8,
      }}>
        {isSubscribed ? (
          <>
            <View style={{ alignItems: 'center', paddingVertical: 12, gap: 4 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: textPrimary }}>
                {tier === 'lifetime' ? 'You have lifetime access 💛' : 'You’re subscribed 💛'}
              </Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: textSecondary }}>
                Thank you for supporting DailyPrayer.
              </Text>
            </View>
            <Button title="Done" onPress={() => router.back()} size="lg" variant="primary" />
          </>
        ) : (
          <>
            <Button
              title={
                busy === 'purchase'
                  ? 'Processing…'
                  : selectedPkg?.introductoryOffer
                    ? t('premium.trial', { days: selectedPkg.introductoryOffer.periodNumberOfUnits })
                    : t('premium.subscribe')
              }
              onPress={handlePurchase}
              disabled={!selectedPkg || busy !== null}
              loading={busy === 'purchase'}
              size="lg"
              variant="primary"
            />

            <Pressable
              onPress={handleRestore}
              disabled={busy !== null}
              accessibilityRole="button"
              style={{ alignItems: 'center', paddingVertical: 8 }}
            >
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: textSecondary }}>
                {busy === 'restore' ? 'Restoring…' : t('premium.restore')}
              </Text>
            </Pressable>

            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: textSecondary, textAlign: 'center' }}>
              {t('premium.termsNote')}
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
