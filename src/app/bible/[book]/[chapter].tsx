import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, useColorScheme, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAppStore } from '@/store/app.store';
import { useUserStore } from '@/store/user.store';
import { getBibleChapter, formatBibleText, getBookSlug } from '@/services/bibleApi';
import { BIBLE_BOOKS } from '@/constants/bibleBooks';

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
  const { toggleFavorite, isFavorite } = useUserStore();
  const isDark = (colorScheme === 'system' ? systemScheme : colorScheme) === 'dark';

  const [verses, setVerses] = useState<Array<{ verse_number: number; text: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null);

  const bookName = decodeURIComponent(book ?? '');
  const currentChapter = parseInt(chapter ?? '1', 10);
  const bookInfo = BIBLE_BOOKS.find((b) => b.name === bookName || b.slug === bookName.toLowerCase());
  const totalChapters = bookInfo?.chapters ?? 150;

  const bg = isDark ? '#1E1C18' : '#FFF9EE';
  const surfaceBg = isDark ? '#2A2720' : '#F1E6D3';
  const textPrimary = isDark ? '#F5EDD8' : '#292B28';
  const textSecondary = isDark ? '#B8AD97' : '#77766F';

  useEffect(() => {
    async function load() {
      if (!bookName) return;
      setLoading(true);
      setVerses([]);
      try {
        const slug = getBookSlug(bookName);
        const version = preferences.preferredTranslation ?? 'en-kjv';
        const result = await getBibleChapter({ version, book: slug, chapter: currentChapter });
        const mapped = result.map((item) => ({
          verse_number: parseInt(item.verse, 10),
          text: formatBibleText(item.text),
        }));
        setVerses(mapped);
      } catch (e) {
        console.warn('Error loading Bible chapter:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [bookName, currentChapter, preferences.preferredTranslation]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
        borderBottomColor: isDark ? 'rgba(245,237,216,0.07)' : 'rgba(41,43,40,0.07)',
      }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: surfaceBg, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18 }}>‹</Text>
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: textPrimary }}>
            {bookName} {currentChapter}
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: textSecondary }}>
            Chapter {currentChapter} of {totalChapters}
          </Text>
        </View>
        <View style={{ backgroundColor: surfaceBg, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: textSecondary }}>
            {preferences.preferredTranslation}
          </Text>
        </View>
      </View>

      {/* Chapter Reader */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 60, gap: 12 }}>
            <ActivityIndicator color="#F2B84B" size="large" />
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: textSecondary }}>Loading {bookName} {currentChapter}...</Text>
          </View>
        ) : verses.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60, gap: 12 }}>
            <Text style={{ fontSize: 48 }}>📖</Text>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18, color: textPrimary }}>Chapter unavailable</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: textSecondary, textAlign: 'center' }}>
              This chapter will load when you're connected to the internet.
            </Text>
          </View>
        ) : (
          <Animated.View entering={FadeIn.duration(400)} style={{ gap: 16 }}>
            {verses.map((verse) => (
              <Pressable
                key={verse.verse_number}
                onLongPress={() => setHighlightedVerse(verse.verse_number === highlightedVerse ? null : verse.verse_number)}
                style={[
                  { flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderRadius: 8, padding: 4 },
                  highlightedVerse === verse.verse_number && { backgroundColor: '#F2B84B22' },
                ]}
              >
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#F2B84B', marginTop: 5, width: 22, textAlign: 'right' }}>
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
          onPress={() => router.replace(`/bible/${encodeURIComponent(bookName)}/${currentChapter - 1}`)}
          style={{ opacity: currentChapter <= 1 ? 0.3 : 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Text style={{ fontSize: 16, color: textPrimary }}>‹</Text>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: textPrimary }}>Previous</Text>
        </Pressable>

        <Pressable onPress={() => router.push('/bible')} style={{ alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#F2B84B' }}>{bookName}</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: textSecondary }}>Ch. {currentChapter}/{totalChapters}</Text>
        </Pressable>

        <Pressable
          disabled={currentChapter >= totalChapters}
          onPress={() => router.replace(`/bible/${encodeURIComponent(bookName)}/${currentChapter + 1}`)}
          style={{ opacity: currentChapter >= totalChapters ? 0.3 : 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: textPrimary }}>Next</Text>
          <Text style={{ fontSize: 16, color: textPrimary }}>›</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
