import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppStore } from '@/store/app.store';
import { getDb, parseJson } from '@/db/client';

interface PrayerRow {
  id: string;
  title: string;
  category: string;
  duration_minutes: number;
  is_premium: number;
  intro: string;
}

interface PersonalPrayerRow {
  id: string;
  title: string;
  body: string;
  is_answered: number;
  created_at: string;
}

const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  morning: { icon: '🌅', color: '#F2B84B' },
  evening: { icon: '🌙', color: '#B8A8CC' },
  gratitude: { icon: '✨', color: '#96AA88' },
  peace: { icon: '🕊️', color: '#96AA88' },
  anxiety: { icon: '🤍', color: '#7BB8D4' },
  strength: { icon: '💪', color: '#D98262' },
  healing: { icon: '🌿', color: '#96AA88' },
  family: { icon: '🏡', color: '#D98262' },
  forgiveness: { icon: '💙', color: '#7BB8D4' },
  guidance: { icon: '🌅', color: '#F2B84B' },
  'difficult-times': { icon: '🫂', color: '#B8A8CC' },
};

export default function PrayScreen() {
  const { t } = useTranslation();
  const systemScheme = useColorScheme();
  const { colorScheme } = useAppStore();
  const isDark = (colorScheme === 'system' ? systemScheme : colorScheme) === 'dark';
  const [prayers, setPrayers] = useState<PrayerRow[]>([]);
  const [personalPrayers, setPersonalPrayers] = useState<PersonalPrayerRow[]>([]);
  const [activeTab, setActiveTab] = useState<'guided' | 'personal'>('guided');

  const bg = isDark ? '#1E1C18' : '#FFF9EE';
  const cardBg = isDark ? '#332F26' : '#FFFFFF';
  const surfaceBg = isDark ? '#2A2720' : '#F1E6D3';
  const textPrimary = isDark ? '#F5EDD8' : '#292B28';
  const textSecondary = isDark ? '#B8AD97' : '#77766F';

  useEffect(() => {
    async function load() {
      const db = getDb();
      const guided = await db.getAllAsync<PrayerRow>(
        'SELECT id, title, category, duration_minutes, is_premium, intro FROM guided_prayers ORDER BY category'
      );
      const personal = await db.getAllAsync<PersonalPrayerRow>(
        'SELECT id, title, body, is_answered, created_at FROM personal_prayers ORDER BY created_at DESC LIMIT 20'
      );
      setPrayers(guided);
      setPersonalPrayers(personal);
    }
    load();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
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
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#FFFFFF' }}>+ {t('prayer.newPrayer')}</Text>
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
                  flex: 1, paddingVertical: 10, borderRadius: 11,
                  backgroundColor: activeTab === tab ? (isDark ? '#3A3028' : '#FFFFFF') : 'transparent',
                  alignItems: 'center',
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

        {/* Guided Prayers */}
        {activeTab === 'guided' && (
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={{ paddingHorizontal: 20, gap: 12 }}>
            {prayers.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>🙏</Text>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 17, color: textPrimary }}>Loading prayers...</Text>
              </View>
            ) : (
              prayers.map((prayer) => {
                const meta = CATEGORY_META[prayer.category] ?? { icon: '🙏', color: '#D98262' };
                return (
                  <Pressable
                    key={prayer.id}
                    onPress={() => router.push(`/prayer/${prayer.id}`)}
                    style={{
                      backgroundColor: cardBg, borderRadius: 20, padding: 18,
                      flexDirection: 'row', gap: 14,
                      shadowColor: '#292B28', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
                    }}
                  >
                    <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: `${meta.color}22`, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 24 }}>{meta.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: textPrimary, flex: 1 }}>
                          {prayer.title}
                        </Text>
                        {prayer.is_premium === 1 && (
                          <View style={{ backgroundColor: '#F2B84B', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
                            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, color: '#292B28' }}>PRO</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: textSecondary }} numberOfLines={2}>
                        {prayer.intro}
                      </Text>
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: textSecondary, marginTop: 6 }}>
                        {prayer.duration_minutes} min · {prayer.category.charAt(0).toUpperCase() + prayer.category.slice(1)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </Animated.View>
        )}

        {/* Personal Prayers */}
        {activeTab === 'personal' && (
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={{ paddingHorizontal: 20, gap: 12 }}>
            {personalPrayers.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 60, gap: 12 }}>
                <Text style={{ fontSize: 56 }}>🙏</Text>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18, color: textPrimary }}>{t('prayer.emptyState.title')}</Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: textSecondary, textAlign: 'center' }}>{t('prayer.emptyState.subtitle')}</Text>
                <Pressable
                  onPress={() => router.push('/journal/new')}
                  style={{ marginTop: 8, height: 48, paddingHorizontal: 24, borderRadius: 24, backgroundColor: '#D98262', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#FFFFFF' }}>{t('prayer.emptyState.cta')}</Text>
                </Pressable>
              </View>
            ) : (
              personalPrayers.map((prayer) => (
                <Pressable
                  key={prayer.id}
                  onPress={() => router.push(`/prayer/${prayer.id}`)}
                  style={{
                    backgroundColor: cardBg, borderRadius: 20, padding: 18,
                    shadowColor: '#292B28', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: textPrimary, flex: 1 }}>{prayer.title}</Text>
                    {prayer.is_answered === 1 && (
                      <View style={{ backgroundColor: '#96AA88', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: '#FFFFFF' }}>Answered</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: textSecondary }} numberOfLines={2}>
                    {prayer.body}
                  </Text>
                </Pressable>
              ))
            )}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
