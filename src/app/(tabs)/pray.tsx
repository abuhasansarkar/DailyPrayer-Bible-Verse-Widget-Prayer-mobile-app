import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppStore } from '@/store/app.store';
import { usePrayers } from '@/hooks/use-prayers';
import { PrayerCard } from '@/components/prayer/PrayerCard';
import { EmptyState } from '@/components/ui/EmptyState';

const CATEGORY_META: Record<string, { icon: string; color: string; label: string }> = {
  morning:           { icon: '🌅', color: '#F2B84B', label: 'Morning' },
  evening:           { icon: '🌙', color: '#B8A8CC', label: 'Evening' },
  gratitude:         { icon: '✨', color: '#96AA88', label: 'Gratitude' },
  peace:             { icon: '🕊️', color: '#96AA88', label: 'Peace' },
  anxiety:           { icon: '🤍', color: '#7BB8D4', label: 'Anxiety' },
  strength:          { icon: '💪', color: '#D98262', label: 'Strength' },
  healing:           { icon: '🌿', color: '#96AA88', label: 'Healing' },
  family:            { icon: '🏡', color: '#D98262', label: 'Family' },
  forgiveness:       { icon: '💙', color: '#7BB8D4', label: 'Forgiveness' },
  guidance:          { icon: '🌅', color: '#F2B84B', label: 'Guidance' },
  'difficult-times': { icon: '🫂', color: '#B8A8CC', label: 'Hard Times' },
};

export default function PrayScreen() {
  const { t } = useTranslation();
  const systemScheme = useColorScheme();
  const { colorScheme } = useAppStore();
  const isDark = (colorScheme === 'system' ? systemScheme : colorScheme) === 'dark';
  const [activeTab, setActiveTab] = useState<'guided' | 'personal'>('guided');

  const { guided, personal, loading, categories } = usePrayers();

  const bg = isDark ? '#1E1C18' : '#FFF9EE';
  const cardBg = isDark ? '#332F26' : '#FFFFFF';
  const surfaceBg = isDark ? '#2A2720' : '#F1E6D3';
  const textPrimary = isDark ? '#F5EDD8' : '#292B28';
  const textSecondary = isDark ? '#B8AD97' : '#77766F';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 28, color: textPrimary, letterSpacing: -0.5 }}>
              {t('prayer.title')}
            </Text>
            <Pressable
              onPress={() => router.push('/journal/new')}
              style={{ height: 38, paddingHorizontal: 16, borderRadius: 19, backgroundColor: '#D98262', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#FFFFFF' }}>
                + {t('prayer.newPrayer')}
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Segment tabs */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', backgroundColor: surfaceBg, borderRadius: 14, padding: 4, gap: 4 }}>
            {(['guided', 'personal'] as const).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center',
                  backgroundColor: activeTab === tab ? (isDark ? '#3A3028' : '#FFFFFF') : 'transparent',
                  shadowColor: activeTab === tab ? '#292B28' : 'transparent',
                  shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3,
                }}
              >
                <Text style={{
                  fontFamily: activeTab === tab ? 'Inter_600SemiBold' : 'Inter_400Regular',
                  fontSize: 14, color: activeTab === tab ? textPrimary : textSecondary,
                }}>
                  {tab === 'guided' ? t('prayer.guidedPrayers') : t('prayer.myPrayers')}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* ── Guided Prayers — Category Grid ── */}
        {activeTab === 'guided' && (
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={{ paddingHorizontal: 20 }}>
            {loading ? (
              <View style={{ gap: 12 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <View key={i} style={{ height: 80, borderRadius: 20, backgroundColor: surfaceBg }} />
                ))}
              </View>
            ) : categories.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>🙏</Text>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 17, color: textPrimary }}>Loading prayers...</Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {/* Category cards */}
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: textPrimary, marginBottom: 6 }}>
                  Browse by Category
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                  {categories.map((cat) => {
                    const meta = CATEGORY_META[cat] ?? { icon: '🙏', color: '#D98262', label: cat };
                    const count = guided.filter((p) => p.category === cat).length;
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => router.push(`/prayer/category/${cat}`)}
                        style={{
                          width: '47%',
                          backgroundColor: cardBg,
                          borderRadius: 18, padding: 16,
                          borderLeftWidth: 4, borderLeftColor: meta.color,
                          shadowColor: '#292B28', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
                          gap: 6,
                        }}
                      >
                        <Text style={{ fontSize: 26 }}>{meta.icon}</Text>
                        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: textPrimary }}>{meta.label}</Text>
                        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: textSecondary }}>
                          {count} {count === 1 ? 'prayer' : 'prayers'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Recent / featured prayers */}
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: textPrimary, marginBottom: 10 }}>
                  Featured Prayers
                </Text>
                {guided.slice(0, 5).map((prayer) => (
                  <PrayerCard
                    key={prayer.id}
                    id={prayer.id}
                    title={prayer.title}
                    category={prayer.category}
                    durationMinutes={prayer.duration_minutes}
                    isPremium={prayer.is_premium === 1}
                    intro={prayer.intro}
                  />
                ))}
              </View>
            )}
          </Animated.View>
        )}

        {/* ── Personal Prayers ── */}
        {activeTab === 'personal' && (
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={{ paddingHorizontal: 20, gap: 12 }}>
            {loading ? (
              <View style={{ gap: 12 }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <View key={i} style={{ height: 80, borderRadius: 20, backgroundColor: surfaceBg }} />
                ))}
              </View>
            ) : personal.length === 0 ? (
              <EmptyState
                title={t('prayer.emptyState.title')}
                description={t('prayer.emptyState.subtitle')}
                pose="praying"
                actionLabel={t('prayer.emptyState.cta')}
                onAction={() => router.push('/journal/new')}
              />
            ) : (
              personal.map((prayer) => (
                <PrayerCard
                  key={prayer.id}
                  id={prayer.id}
                  title={prayer.title}
                  category={prayer.category ?? 'personal'}
                  durationMinutes={0}
                  isPersonal
                  isAnswered={prayer.is_answered === 1}
                  intro={prayer.body?.slice(0, 120)}
                />
              ))
            )}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
