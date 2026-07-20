import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAppStore } from '@/store/app.store';
import { getDb } from '@/db/client';

interface ChapterVerse {
  id: string;
  reference: string;
  book: string;
  chapter: number;
  verse_number: number;
  text: string;
  translation: string;
}

export default function BibleChapterScreen() {
  const { book, chapter } = useLocalSearchParams<{ book: string; chapter: string }>();
  const { t } = useTranslation();
  const systemScheme = useColorScheme();
  const { colorScheme, preferences } = useAppStore();
  const isDark = (colorScheme === 'system' ? systemScheme : colorScheme) === 'dark';

  const [verses, setVerses] = useState<ChapterVerse[]>([]);
  const [loading, setLoading] = useState(true);

  const currentChapter = parseInt(chapter ?? '1', 10);

  const bg = isDark ? '#1E1C18' : '#FFF9EE';
  const surfaceBg = isDark ? '#2A2720' : '#F1E6D3';
  const cardBg = isDark ? '#332F26' : '#FFFFFF';
  const textPrimary = isDark ? '#F5EDD8' : '#292B28';
  const textSecondary = isDark ? '#B8AD97' : '#77766F';

  useEffect(() => {
    async function load() {
      if (!book) return;
      setLoading(true);
      try {
        const db = getDb();
        const rows = await db.getAllAsync<ChapterVerse>(
          'SELECT * FROM verses WHERE book = ? AND chapter = ? ORDER BY verse_number ASC',
          [book, currentChapter]
        );

        // If no specific chapter verses in DB, load book verses as placeholder
        if (rows.length === 0) {
          const fallback = await db.getAllAsync<ChapterVerse>(
            'SELECT * FROM verses WHERE book = ? LIMIT 10',
            [book]
          );
          setVerses(fallback);
        } else {
          setVerses(rows);
        }
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [book, currentChapter]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
        borderBottomColor: isDark ? 'rgba(245,237,216,0.07)' : 'rgba(41,43,40,0.07)',
      }}>
        <Pressable onPress={router.back} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: surfaceBg, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18 }}>←</Text>
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: textPrimary }}>
          {book} {currentChapter}
        </Text>
        <View style={{ backgroundColor: surfaceBg, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: textSecondary }}>
            {preferences.preferredTranslation}
          </Text>
        </View>
      </View>

      {/* Chapter Reader */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontFamily: 'Inter_400Regular', color: textSecondary }}>Loading chapter...</Text>
          </View>
        ) : verses.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60, gap: 12 }}>
            <Text style={{ fontSize: 48 }}>📖</Text>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18, color: textPrimary }}>Chapter unavailable</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: textSecondary, textAlign: 'center' }}>
              Offline scripture storage for {book} chapter {currentChapter} will download when connected.
            </Text>
          </View>
        ) : (
          <Animated.View entering={FadeIn.duration(400)} style={{ gap: 20 }}>
            {verses.map((verse) => (
              <Pressable
                key={verse.id}
                onPress={() => router.push(`/verse/${verse.id}`)}
                style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}
              >
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#F2B84B', marginTop: 4, width: 24 }}>
                  {verse.verse_number}
                </Text>
                <Text style={{ flex: 1, fontFamily: 'Lora_400Regular', fontSize: 18, lineHeight: 30, color: textPrimary }}>
                  {verse.text}
                </Text>
              </Pressable>
            ))}
          </Animated.View>
        )}
      </ScrollView>

      {/* Chapter navigation footer */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 24, paddingVertical: 16, backgroundColor: bg,
        borderTopWidth: 1, borderTopColor: isDark ? 'rgba(245,237,216,0.07)' : 'rgba(41,43,40,0.07)',
      }}>
        <Pressable
          disabled={currentChapter <= 1}
          onPress={() => router.replace(`/bible/${book}/${currentChapter - 1}`)}
          style={{ opacity: currentChapter <= 1 ? 0.3 : 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Text style={{ fontSize: 16, color: textPrimary }}>←</Text>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: textPrimary }}>Previous</Text>
        </Pressable>

        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: textSecondary }}>
          Ch. {currentChapter}
        </Text>

        <Pressable
          onPress={() => router.replace(`/bible/${book}/${currentChapter + 1}`)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: textPrimary }}>Next</Text>
          <Text style={{ fontSize: 16, color: textPrimary }}>→</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
