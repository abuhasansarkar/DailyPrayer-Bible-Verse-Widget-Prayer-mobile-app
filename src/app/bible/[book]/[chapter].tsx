import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useAppStore } from '@/store/app.store';
import { useAudioPlayer } from '@/hooks/use-audio-player';
import { getBibleChapter, formatBibleText, getBookSlug } from '@/services/bibleApi';
import { BIBLE_BOOKS } from '@/constants/bibleBooks';
import { getDb, generateId, nowIso } from '@/db/client';
import VerseImageGenerator from '@/components/verse/VerseImageGenerator';
import { useResolvedTheme } from '@/hooks/use-theme';

export default function BibleChapterScreen() {
  const { book, chapter } = useLocalSearchParams<{ book: string; chapter: string }>();
  const { isDark } = useResolvedTheme();
  const { preferences } = useAppStore();
  const { isPlayingSpeech, playVerseSpeech, activeSoundscape, selectSoundscape } = useAudioPlayer();

  const [verses, setVerses] = useState<{ verse_number: number; text: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState<number>(18);
  const [selectedVerse, setSelectedVerse] = useState<{ number: number; text: string } | null>(null);
  const [highlights, setHighlights] = useState<Record<number, string>>({});
  const [showImageStudio, setShowImageStudio] = useState(false);

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

        // Load existing highlights
        const db = getDb();
        const refPrefix = `${bookName} ${currentChapter}:`;
        const rows = await db.getAllAsync<{ verse_id: string; color: string }>(
          'SELECT verse_id, color FROM verse_highlights WHERE verse_id LIKE ?',
          [`${refPrefix}%`]
        );
        const map: Record<number, string> = {};
        for (const r of rows) {
          const vNum = parseInt(r.verse_id.split(':')[1] ?? '0', 10);
          if (vNum) map[vNum] = r.color;
        }
        setHighlights(map);
      } catch (e) {
        console.warn('Error loading Bible chapter:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [bookName, currentChapter, preferences.preferredTranslation]);

  async function handleToggleHighlight(vNum: number, color: string) {
    Haptics.selectionAsync();
    const ref = `${bookName} ${currentChapter}:${vNum}`;
    const db = getDb();
    const existing = highlights[vNum];

    if (existing === color) {
      await db.runAsync('DELETE FROM verse_highlights WHERE verse_id = ?', [ref]);
      setHighlights((prev) => {
        const copy = { ...prev };
        delete copy[vNum];
        return copy;
      });
    } else {
      await db.runAsync(
        'INSERT OR REPLACE INTO verse_highlights (id, verse_id, color, created_at) VALUES (?, ?, ?, ?)',
        [generateId(), ref, color, nowIso()]
      );
      setHighlights((prev) => ({ ...prev, [vNum]: color }));
    }
  }

  function handleNarrateChapter() {
    if (verses.length === 0) return;
    const fullText = verses.map((v) => `${v.verse_number}. ${v.text}`).join(' ');
    playVerseSpeech(`${bookName} chapter ${currentChapter}. ${fullText}`);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? 'rgba(245,237,216,0.07)' : 'rgba(41,43,40,0.07)',
        }}
      >
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: surfaceBg, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18, color: textPrimary }}>‹</Text>
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: textPrimary }}>
            {bookName} {currentChapter}
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: textSecondary }}>
            Chapter {currentChapter} of {totalChapters}
          </Text>
        </View>
        <Pressable onPress={() => setFontSize((prev) => (prev >= 24 ? 16 : prev + 4))} style={{ backgroundColor: surfaceBg, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: textSecondary }}>
            A{fontSize > 18 ? '+' : ''}
          </Text>
        </Pressable>
      </View>

      {/* Audio Toolbar */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: surfaceBg }}>
        <Pressable onPress={handleNarrateChapter} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 16 }}>{isPlayingSpeech ? '⏸️' : '🔊'}</Text>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: isPlayingSpeech ? '#F2B84B' : textPrimary }}>
            {isPlayingSpeech ? 'Pause Narration' : 'Listen Chapter'}
          </Text>
        </Pressable>
        <Pressable onPress={() => selectSoundscape(activeSoundscape ? null : 'rain')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 16 }}>🕊️</Text>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: activeSoundscape ? '#F2B84B' : textSecondary }}>
            {activeSoundscape ? 'Ambient Sounding' : 'Ambient Sound'}
          </Text>
        </Pressable>
      </View>

      {/* Chapter Reader */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 60, gap: 12 }}>
            <ActivityIndicator color="#F2B84B" size="large" />
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: textSecondary }}>Loading {bookName} {currentChapter}...</Text>
          </View>
        ) : verses.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60, gap: 12 }}>
            <Text style={{ fontSize: 48 }}>📖</Text>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18, color: textPrimary }}>Chapter unavailable offline</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: textSecondary, textAlign: 'center' }}>
              Connect to internet to read full chapter.
            </Text>
          </View>
        ) : (
          <Animated.View entering={FadeIn.duration(400)} style={{ gap: 16 }}>
            {verses.map((verse) => {
              const hColor = highlights[verse.verse_number];
              const isSelected = selectedVerse?.number === verse.verse_number;
              return (
                <View key={verse.verse_number}>
                  <Pressable
                    onPress={() => setSelectedVerse(isSelected ? null : { number: verse.verse_number, text: verse.text })}
                    style={[
                      { flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderRadius: 8, padding: 6 },
                      hColor ? { backgroundColor: hColor + '44' } : isSelected ? { backgroundColor: '#F2B84B22' } : null,
                    ]}
                  >
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#F2B84B', marginTop: 5, width: 24, textAlign: 'right' }}>
                      {verse.verse_number}
                    </Text>
                    <Text style={{ flex: 1, fontFamily: 'Lora_400Regular', fontSize, lineHeight: fontSize * 1.6, color: textPrimary }}>
                      {verse.text}
                    </Text>
                  </Pressable>

                  {/* Highlight & Action Bar when verse selected */}
                  {isSelected && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: surfaceBg, borderRadius: 14, padding: 10, marginTop: 8, marginLeft: 36 }}>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        {['#F2B84B', '#96AA88', '#D98262', '#7BB8D4'].map((c) => (
                          <Pressable
                            key={c}
                            onPress={() => handleToggleHighlight(verse.verse_number, c)}
                            style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: c, borderWidth: hColor === c ? 2 : 0, borderColor: textPrimary }}
                          />
                        ))}
                      </View>
                      <Pressable
                        onPress={() => setShowImageStudio(true)}
                        style={{ backgroundColor: '#F2B84B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}
                      >
                        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: '#292B28' }}>🖼️ Create Card</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}
          </Animated.View>
        )}
      </ScrollView>

      {/* Chapter navigation footer */}
      <View
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          paddingHorizontal: 24, paddingVertical: 16, backgroundColor: bg,
          borderTopWidth: 1, borderTopColor: isDark ? 'rgba(245,237,216,0.07)' : 'rgba(41,43,40,0.07)',
        }}
      >
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

      {/* Verse Card Studio Modal */}
      {selectedVerse && (
        <VerseImageGenerator
          visible={showImageStudio}
          onClose={() => setShowImageStudio(false)}
          verseText={selectedVerse.text}
          reference={`${bookName} ${currentChapter}:${selectedVerse.number}`}
          translation={preferences.preferredTranslation}
        />
      )}
    </SafeAreaView>
  );
}
