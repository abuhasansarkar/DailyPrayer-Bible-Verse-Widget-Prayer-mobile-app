import { useState } from 'react';
import { View, Text, ScrollView, Pressable, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppStore } from '@/store/app.store';
import { BIBLE_BOOKS } from '@/constants/bibleBooks';

const TOPICS = [
  { id: 'hope',        name: 'Hope',        icon: '✨', color: '#F2B84B' },
  { id: 'peace',       name: 'Peace',       icon: '🕊️', color: '#96AA88' },
  { id: 'strength',    name: 'Strength',    icon: '💪', color: '#D98262' },
  { id: 'love',        name: 'Love',        icon: '❤️', color: '#D98262' },
  { id: 'faith',       name: 'Faith',       icon: '🙏', color: '#F2B84B' },
  { id: 'gratitude',   name: 'Gratitude',   icon: '🌟', color: '#96AA88' },
  { id: 'anxiety',     name: 'Anxiety',     icon: '🤍', color: '#7BB8D4' },
  { id: 'healing',     name: 'Healing',     icon: '🌿', color: '#96AA88' },
  { id: 'guidance',    name: 'Guidance',    icon: '🌅', color: '#F2B84B' },
  { id: 'forgiveness', name: 'Forgiveness', icon: '💙', color: '#7BB8D4' },
  { id: 'family',      name: 'Family',      icon: '🏡', color: '#D98262' },
  { id: 'morning',     name: 'Morning',     icon: '🌄', color: '#F2B84B' },
];

// Featured books (quick access row)
const FEATURED_BOOKS = ['Psalms', 'Proverbs', 'John', 'Romans', 'Philippians', 'Isaiah'];

export default function ExploreScreen() {
  const { t } = useTranslation();
  const systemScheme = useColorScheme();
  const { colorScheme } = useAppStore();
  const isDark = (colorScheme === 'system' ? systemScheme : colorScheme) === 'dark';
  const [searchText, setSearchText] = useState('');

  const bg = isDark ? '#1E1C18' : '#FFF9EE';
  const surfaceBg = isDark ? '#2A2720' : '#F1E6D3';
  const cardBg = isDark ? '#332F26' : '#FFFFFF';
  const textPrimary = isDark ? '#F5EDD8' : '#292B28';
  const textSecondary = isDark ? '#B8AD97' : '#77766F';

  const handleSearch = () => {
    if (!searchText.trim()) return;
    router.push(`/search?q=${encodeURIComponent(searchText.trim())}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 28, color: textPrimary, letterSpacing: -0.5, marginBottom: 16 }}>
            {t('explore.title')}
          </Text>

          {/* ── LIVE Search bar — navigates to /search ── */}
          <Pressable
            onPress={() => router.push('/search')}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 10,
              backgroundColor: cardBg, borderRadius: 16,
              paddingHorizontal: 16, paddingVertical: 13,
              shadowColor: '#292B28', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
            }}
          >
            <Text style={{ fontSize: 16 }}>🔍</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: textSecondary, flex: 1 }}>
              {t('explore.search')}
            </Text>
          </Pressable>
        </Animated.View>

        {/* Topics */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={{ paddingTop: 24 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18, color: textPrimary, paddingHorizontal: 20, marginBottom: 14 }}>
            {t('explore.topics')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
            {TOPICS.map((topic) => (
              <Pressable
                key={topic.id}
                onPress={() => router.push(`/topic/${topic.id}`)}
                style={{
                  backgroundColor: cardBg, borderRadius: 16,
                  paddingHorizontal: 16, paddingVertical: 14,
                  alignItems: 'center', gap: 6, minWidth: 86,
                  shadowColor: '#292B28', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
                  borderTopWidth: 3, borderTopColor: topic.color,
                }}
              >
                <Text style={{ fontSize: 24 }}>{topic.icon}</Text>
                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: textPrimary, textAlign: 'center' }}>
                  {topic.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Quick-access Bible books */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)} style={{ paddingTop: 24, paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18, color: textPrimary }}>
              {t('explore.bibleBooks')}
            </Text>
            <Pressable onPress={() => router.push('/bible')}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#F2B84B' }}>See all →</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {FEATURED_BOOKS.map((bookName) => {
              const book = BIBLE_BOOKS.find((b) => b.name === bookName);
              return (
                <Pressable
                  key={bookName}
                  onPress={() => router.push(`/bible/${encodeURIComponent(bookName)}/1`)}
                  style={{
                    backgroundColor: cardBg, borderRadius: 14,
                    paddingHorizontal: 16, paddingVertical: 12, gap: 2, minWidth: 90,
                    shadowColor: '#292B28', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 22, marginBottom: 4 }}>📖</Text>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: textPrimary }}>{bookName}</Text>
                  {book && (
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: textSecondary }}>{book.chapterCount} ch</Text>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* All Bible books — OT/NT */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={{ paddingTop: 28, paddingHorizontal: 20 }}>
          <View style={{ gap: 20 }}>
            {(['OT', 'NT'] as const).map((testament) => {
              const books = BIBLE_BOOKS.filter((b) => b.testament === testament);
              return (
                <View key={testament}>
                  <Text style={{
                    fontFamily: 'Inter_600SemiBold', fontSize: 13,
                    color: testament === 'OT' ? '#F2B84B' : '#7BB8D4',
                    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12,
                  }}>
                    {testament === 'OT' ? t('explore.oldTestament') : t('explore.newTestament')} · {books.length} books
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {books.map((book) => (
                      <Pressable
                        key={book.name}
                        onPress={() => router.push(`/bible/${encodeURIComponent(book.name)}/1`)}
                        style={{
                          backgroundColor: cardBg, borderRadius: 12,
                          paddingHorizontal: 12, paddingVertical: 9,
                          shadowColor: '#292B28', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
                        }}
                      >
                        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: textPrimary }}>
                          {book.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
