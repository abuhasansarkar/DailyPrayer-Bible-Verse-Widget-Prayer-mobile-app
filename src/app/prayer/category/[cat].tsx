
import { View, Text, ScrollView, Pressable, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppStore } from '@/store/app.store';
import { PrayerCard } from '@/components/prayer/PrayerCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePrayers } from '@/hooks/use-prayers';

const CATEGORY_META: Record<string, { icon: string; color: string; label: string; description: string }> = {
  morning:         { icon: '🌅', color: '#F2B84B', label: 'Morning Prayers', description: "Start your day with God's presence." },
  evening:         { icon: '🌙', color: '#B8A8CC', label: 'Evening Prayers', description: 'End each day in peace and gratitude.' },
  gratitude:       { icon: '✨', color: '#96AA88', label: 'Gratitude', description: 'Give thanks in all circumstances.' },
  peace:           { icon: '🕊️', color: '#96AA88', label: 'Peace', description: 'Find calm and rest in Him.' },
  anxiety:         { icon: '🤍', color: '#7BB8D4', label: 'Anxiety & Worry', description: 'Cast your cares upon the Lord.' },
  strength:        { icon: '💪', color: '#D98262', label: 'Strength', description: 'Be strengthened through prayer.' },
  healing:         { icon: '🌿', color: '#96AA88', label: 'Healing', description: 'Prayers for restoration and healing.' },
  family:          { icon: '🏡', color: '#D98262', label: 'Family', description: 'Lift your family in prayer.' },
  forgiveness:     { icon: '💙', color: '#7BB8D4', label: 'Forgiveness', description: 'Release, forgive, and be free.' },
  guidance:        { icon: '🌅', color: '#F2B84B', label: 'Guidance', description: 'Seek direction in all your ways.' },
  'difficult-times': { icon: '🫂', color: '#B8A8CC', label: 'Difficult Times', description: 'Hold fast in seasons of struggle.' },
};

export default function PrayerCategoryScreen() {
  const { cat } = useLocalSearchParams<{ cat: string }>();
  const systemScheme = useColorScheme();
  const { colorScheme } = useAppStore();
  const isDark = (colorScheme === 'system' ? systemScheme : colorScheme) === 'dark';
  const { guided, loading } = usePrayers(cat);

  const meta = CATEGORY_META[cat ?? ''] ?? { icon: '🙏', color: '#D98262', label: cat ?? 'Prayers', description: '' };

  const bg = isDark ? '#1E1C18' : '#FFF9EE';
  const textPrimary = isDark ? '#F5EDD8' : '#292B28';
  const textSecondary = isDark ? '#B8AD97' : '#77766F';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Hero header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={{
            paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24,
            backgroundColor: `${meta.color}18`,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: `${meta.color}22`, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}
          >
            <Text style={{ fontSize: 18, color: meta.color }}>‹</Text>
          </Pressable>

          <Text style={{ fontSize: 48, marginBottom: 12 }}>{meta.icon}</Text>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 28, color: textPrimary, letterSpacing: -0.5, marginBottom: 6 }}>
            {meta.label}
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: textSecondary, lineHeight: 22 }}>
            {meta.description}
          </Text>
          <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ height: 3, width: 32, borderRadius: 2, backgroundColor: meta.color }} />
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: textSecondary }}>
              {guided.length} {guided.length === 1 ? 'prayer' : 'prayers'}
            </Text>
          </View>
        </Animated.View>

        {/* Prayer list */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)} style={{ paddingHorizontal: 20, paddingTop: 20, gap: 12 }}>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <View key={i} style={{ height: 90, backgroundColor: isDark ? '#2A2720' : '#F1E6D3', borderRadius: 20 }} />
            ))
          ) : guided.length === 0 ? (
            <EmptyState
              title="No prayers yet"
              description="Prayers for this category will appear here."
              pose="praying"
            />
          ) : (
            guided.map((prayer) => (
              <PrayerCard
                key={prayer.id}
                id={prayer.id}
                title={prayer.title}
                category={prayer.category}
                durationMinutes={prayer.duration_minutes}
                isPremium={prayer.is_premium === 1}
                intro={prayer.intro}
              />
            ))
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
