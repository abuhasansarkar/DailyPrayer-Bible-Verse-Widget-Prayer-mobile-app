import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

import { useSubscriptionStore } from '@/store/subscription.store';
import { purchasePackage, restorePurchases } from '@/services/revenuecat';
import { Mascot } from '@/components/mascot/Mascot';
import { Button } from '@/components/ui/Button';
import { useResolvedTheme } from '@/hooks/use-theme';

// Copy lives in @/constants/entitlements alongside the limits it describes,
// so the paywall cannot advertise a feature that is not actually gated.
import { FREE_FEATURES, PREMIUM_FEATURES } from '@/constants/entitlements';

export default function PremiumScreen() {
  const { t } = useTranslation();
  const { isDark } = useResolvedTheme();
  const { packages, isLoading, tier } = useSubscriptionStore();
  const isSubscribed = tier !== 'free';

  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'annual'>('annual');
  const [purchasing, setPurchasing] = useState(false);

  const bg = isDark ? '#1E1C18' : '#FFF9EE';
  const cardBg = isDark ? '#332F26' : '#FFFFFF';
  const textPrimary = isDark ? '#F5EDD8' : '#292B28';
  const textSecondary = isDark ? '#B8AD97' : '#77766F';

  const monthlyPkg = packages.find(p => p.period === 'monthly');
  const annualPkg = packages.find(p => p.period === 'annual');
  const selectedPkg = selectedPeriod === 'annual' ? annualPkg : monthlyPkg;

  async function handlePurchase() {
    if (!selectedPkg) {
      Alert.alert('Not available', 'Subscription packages are not loaded yet. Please try again.');
      return;
    }
    setPurchasing(true);
    try {
      const success = await purchasePackage(selectedPkg);
      if (success) {
        router.back();
      }
    } catch (e: any) {
      Alert.alert('Purchase failed', e.message ?? 'Something went wrong. Please try again.');
    } finally {
      setPurchasing(false);
    }
  }

  async function handleRestore() {
    const restored = await restorePurchases();
    if (restored) {
      Alert.alert('Restored!', 'Your premium access has been restored.');
      router.back();
    } else {
      Alert.alert('Nothing to restore', 'No previous purchases found for this account.');
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      {/* Close button */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, alignItems: 'flex-end' }}>
        <Pressable onPress={router.back} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isDark ? '#2A2720' : '#F1E6D3', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18, color: textSecondary }}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <Animated.View entering={FadeIn.duration(500)} style={{ alignItems: 'center', marginTop: 8, marginBottom: 24 }}>
          <Mascot pose="premium" size={130} />
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 26, color: textPrimary, textAlign: 'center', letterSpacing: -0.5, marginTop: 12, marginBottom: 6 }}>
            {t('premium.title')}
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: textSecondary, textAlign: 'center' }}>
            {t('premium.subtitle')}
          </Text>
        </Animated.View>

        {/* Plan toggle */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', backgroundColor: isDark ? '#2A2720' : '#F1E6D3', borderRadius: 16, padding: 4, gap: 4 }}>
            {(['monthly', 'annual'] as const).map((period) => (
              <Pressable
                key={period}
                onPress={() => setSelectedPeriod(period)}
                style={{
                  flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
                  backgroundColor: selectedPeriod === period ? '#F2B84B' : 'transparent',
                }}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: selectedPeriod === period ? '#292B28' : textSecondary }}>
                  {period === 'monthly' ? t('premium.monthly') : t('premium.annual')}
                </Text>
                {period === 'annual' && (
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, color: selectedPeriod === period ? '#292B28' : '#96AA88' }}>
                    Save 40%
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Price card */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={{ backgroundColor: cardBg, borderRadius: 20, padding: 20, marginBottom: 24, shadowColor: '#292B28', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
          {selectedPkg?.introductoryOffer && (
            <View style={{ backgroundColor: '#F2B84B', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start', marginBottom: 12 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#292B28' }}>
                {selectedPkg.introductoryOffer.duration} free trial
              </Text>
            </View>
          )}
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 36, color: textPrimary, letterSpacing: -1, marginBottom: 4 }}>
            {selectedPkg?.price ?? (selectedPeriod === 'annual' ? '$29.99/yr' : '$4.99/mo')}
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: textSecondary }}>
            {selectedPeriod === 'annual' ? 'Billed annually' : 'Billed monthly'}
          </Text>
        </Animated.View>

        {/* Premium features */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={{ gap: 12, marginBottom: 24 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: textPrimary, marginBottom: 4 }}>
            Everything in DailyPrayer Premium:
          </Text>
          {PREMIUM_FEATURES.map((feat, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 20, width: 28 }}>{feat.icon}</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: textPrimary, flex: 1 }}>{feat.text}</Text>
            </View>
          ))}
        </Animated.View>

        {/* What the free tier already includes — shown so the upgrade is an
            honest comparison rather than an implied paywall on everything. */}
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

      {/* CTA */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16,
        backgroundColor: bg, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(245,237,216,0.07)' : 'rgba(41,43,40,0.07)',
        gap: 8,
      }}>
        {/* An already-subscribed user previously still saw a Subscribe CTA
            and could be charged again. Show their status instead. */}
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
              title={purchasing ? 'Processing...' : selectedPkg?.introductoryOffer ? t('premium.trial', { days: 7 }) : t('premium.subscribe')}
              onPress={handlePurchase}
              loading={purchasing || isLoading}
              size="lg"
              variant="primary"
            />

            <Pressable onPress={handleRestore} style={{ alignItems: 'center', paddingVertical: 8 }}>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: textSecondary }}>{t('premium.restore')}</Text>
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

