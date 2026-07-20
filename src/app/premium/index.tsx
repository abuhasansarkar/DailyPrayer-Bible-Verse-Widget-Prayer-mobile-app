import { useState } from 'react';
import { View, Text, ScrollView, Pressable, useColorScheme, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useAppStore } from '@/store/app.store';
import { useSubscriptionStore } from '@/store/subscription.store';
import { purchasePackage, restorePurchases } from '@/services/revenuecat';

const FREE_FEATURES = [
  'Daily Bible verse',
  'Daily guided prayer',
  '2 basic widget themes',
  '2 active reminders',
  'Prayer journal',
  'Basic Bible search',
  'Faith streak tracking',
];

const PREMIUM_FEATURES = [
  { icon: '🎨', text: 'All 20 widget themes' },
  { icon: '📸', text: 'Custom photo widget backgrounds' },
  { icon: '🔔', text: 'Unlimited prayer reminders' },
  { icon: '🔖', text: 'Unlimited favorites & collections' },
  { icon: '📖', text: 'Complete prayer & devotional library' },
  { icon: '✨', text: 'Advanced share templates' },
  { icon: '📡', text: 'Offline access & cloud sync' },
  { icon: '🚫', text: 'No ads, no watermarks' },
  { icon: '📊', text: 'Advanced streak insights' },
];

export default function PremiumScreen() {
  const { t } = useTranslation();
  const systemScheme = useColorScheme();
  const { colorScheme } = useAppStore();
  const { packages, isLoading, tier } = useSubscriptionStore();
  const isDark = (colorScheme === 'system' ? systemScheme : colorScheme) === 'dark';

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

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <Animated.View entering={FadeIn.duration(500)} style={{ alignItems: 'center', marginTop: 16, marginBottom: 28 }}>
          <View style={{ width: 88, height: 88, borderRadius: 28, backgroundColor: '#F2B84B', alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#F2B84B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 }}>
            <Text style={{ fontSize: 44 }}>⭐</Text>
          </View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 26, color: textPrimary, textAlign: 'center', letterSpacing: -0.5, marginBottom: 8 }}>
            {t('premium.title')}
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: textSecondary, textAlign: 'center' }}>
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
      </ScrollView>

      {/* CTA */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16,
        backgroundColor: bg, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(245,237,216,0.07)' : 'rgba(41,43,40,0.07)',
        gap: 8,
      }}>
        <Pressable
          onPress={handlePurchase}
          disabled={purchasing || isLoading}
          style={{
            height: 56, borderRadius: 20,
            backgroundColor: purchasing ? '#F2B84B80' : '#F2B84B',
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#F2B84B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
          }}
        >
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: '#292B28' }}>
            {purchasing ? 'Processing...' : selectedPkg?.introductoryOffer ? t('premium.trial', { days: 7 }) : t('premium.subscribe')}
          </Text>
        </Pressable>

        <Pressable onPress={handleRestore} style={{ alignItems: 'center', paddingVertical: 8 }}>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: textSecondary }}>{t('premium.restore')}</Text>
        </Pressable>

        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: textSecondary, textAlign: 'center' }}>
          {t('premium.termsNote')}
        </Text>
      </View>
    </SafeAreaView>
  );
}
