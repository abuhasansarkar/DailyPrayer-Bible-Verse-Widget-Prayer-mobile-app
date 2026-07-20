import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppStore } from '@/store/app.store';

const TOPICS = [
  { id: 'hope', name: 'Hope', icon: '✨', color: '#F2B84B' },
  { id: 'peace', name: 'Peace', icon: '🕊️', color: '#96AA88' },
  { id: 'strength', name: 'Strength', icon: '💪', color: '#D98262' },
  { id: 'love', name: 'Love', icon: '❤️', color: '#D98262' },
  { id: 'faith', name: 'Faith', icon: '🙏', color: '#F2B84B' },
  { id: 'gratitude', name: 'Gratitude', icon: '🌟', color: '#96AA88' },
  { id: 'anxiety', name: 'Anxiety', icon: '🤍', color: '#7BB8D4' },
  { id: 'healing', name: 'Healing', icon: '🌿', color: '#96AA88' },
  { id: 'guidance', name: 'Guidance', icon: '🌅', color: '#F2B84B' },
  { id: 'forgiveness', name: 'Forgiveness', icon: '💙', color: '#7BB8D4' },
  { id: 'family', name: 'Family', icon: '🏡', color: '#D98262' },
  { id: 'morning', name: 'Morning', icon: '🌄', color: '#F2B84B' },
];

const BIBLE_BOOKS = [
  { name: 'Genesis', abbr: 'Gen', testament: 'OT' },
  { name: 'Psalms', abbr: 'Ps', testament: 'OT' },
  { name: 'Proverbs', abbr: 'Prov', testament: 'OT' },
  { name: 'Isaiah', abbr: 'Isa', testament: 'OT' },
  { name: 'Jeremiah', abbr: 'Jer', testament: 'OT' },
  { name: 'Matthew', abbr: 'Matt', testament: 'NT' },
  { name: 'John', abbr: 'John', testament: 'NT' },
  { name: 'Romans', abbr: 'Rom', testament: 'NT' },
  { name: 'Ephesians', abbr: 'Eph', testament: 'NT' },
  { name: 'Philippians', abbr: 'Phil', testament: 'NT' },
  { name: 'Hebrews', abbr: 'Heb', testament: 'NT' },
  { name: 'Revelation', abbr: 'Rev', testament: 'NT' },
];

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 28, color: textPrimary, letterSpacing: -0.5, marginBottom: 16 }}>
            {t('explore.title')}
          </Text>

          {/* Search bar */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 10,
            backgroundColor: cardBg, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12,
            shadowColor: '#292B28', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
          }}>
            <Text style={{ fontSize: 16 }}>🔍</Text>
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder={t('explore.search')}
              placeholderTextColor={textSecondary}
              style={{ flex: 1, fontFamily: 'Inter_400Regular', fontSize: 16, color: textPrimary }}
            />
          </View>
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
                  backgroundColor: cardBg, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
                  alignItems: 'center', gap: 6, minWidth: 90,
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

        {/* Bible Books */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={{ paddingTop: 28, paddingHorizontal: 20 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18, color: textPrimary, marginBottom: 14 }}>
            {t('explore.bibleBooks')}
          </Text>
          <View style={{ gap: 8 }}>
            {['OT', 'NT'].map((testament) => (
              <View key={testament}>
                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
                  {testament === 'OT' ? t('explore.oldTestament') : t('explore.newTestament')}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {BIBLE_BOOKS.filter(b => b.testament === testament).map((book) => (
                    <Pressable
                      key={book.name}
                      onPress={() => router.push(`/bible/${book.name}/1`)}
                      style={{
                        backgroundColor: cardBg, borderRadius: 12,
                        paddingHorizontal: 14, paddingVertical: 10,
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
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
