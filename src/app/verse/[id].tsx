import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Share, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useAppStore } from '@/store/app.store';
import { useUserStore } from '@/store/user.store';
import { useAudioPlayer } from '@/hooks/use-audio-player';
import { getDb, generateId, nowIso } from '@/db/client';
import VerseImageGenerator from '@/components/verse/VerseImageGenerator';

interface VerseDetail {
  id: string;
  reference: string;
  book: string;
  chapter: number;
  verse_number: number;
  text: string;
  translation: string;
  topics: string;
  reflection?: string;
  prayer?: string;
}

export default function VerseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const systemScheme = useColorScheme();
  const { colorScheme } = useAppStore();
  const { toggleFavorite, isFavorite, recordActivity } = useUserStore();
  const { isPlayingSpeech, playVerseSpeech } = useAudioPlayer();
  const isDark = (colorScheme === 'system' ? systemScheme : colorScheme) === 'dark';

  const [verse, setVerse] = useState<VerseDetail | null>(null);
  const [relatedVerses, setRelatedVerses] = useState<{ id: string; reference: string; text: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCardStudio, setShowCardStudio] = useState(false);

  const favorited = verse ? isFavorite('verse', verse.id) : false;

  const bg = isDark ? '#1E1C18' : '#FFF9EE';
  const surfaceBg = isDark ? '#2A2720' : '#F1E6D3';
  const cardBg = isDark ? '#332F26' : '#FFFFFF';
  const textPrimary = isDark ? '#F5EDD8' : '#292B28';
  const textSecondary = isDark ? '#B8AD97' : '#77766F';

  useEffect(() => {
    async function load() {
      if (!id) return;
      const db = getDb();

      const daily = await db.getFirstAsync<VerseDetail>(`
        SELECT v.*, dv.reflection, dv.prayer
        FROM verses v
        LEFT JOIN daily_verses dv ON dv.verse_id = v.id
        WHERE v.id = ?
        LIMIT 1
      `, [id]);

      if (daily) {
        setVerse(daily);
        recordActivity('verse');

        const topics = JSON.parse(daily.topics || '[]') as string[];
        if (topics.length > 0) {
          const related = await db.getAllAsync<{ id: string; reference: string; text: string }>(
            `SELECT id, reference, text FROM verses WHERE id != ? AND topics LIKE ? LIMIT 4`,
            [id, `%${topics[0]}%`]
          );
          setRelatedVerses(related);
        }
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleFavorite() {
    if (!verse) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const db = getDb();
    if (favorited) {
      await db.runAsync('DELETE FROM favorites WHERE type = ? AND ref_id = ?', ['verse', verse.id]);
    } else {
      await db.runAsync(
        'INSERT OR IGNORE INTO favorites (id, type, ref_id, created_at) VALUES (?, ?, ?, ?)',
        [generateId(), 'verse', verse.id, nowIso()]
      );
    }
    toggleFavorite('verse', verse.id);
  }

  if (loading || !verse) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: textSecondary, fontFamily: 'Inter_400Regular' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 }}>
        <Pressable onPress={router.back} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: surfaceBg, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18, color: textPrimary }}>←</Text>
        </Pressable>
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: textPrimary }}>{verse.reference}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable onPress={() => playVerseSpeech(`"${verse.text}" — ${verse.reference}`)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isPlayingSpeech ? '#F2B84B' : surfaceBg, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 16 }}>{isPlayingSpeech ? '⏸️' : '🔊'}</Text>
          </Pressable>
          <Pressable onPress={handleFavorite} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: favorited ? '#F2B84B22' : surfaceBg, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 16 }}>{favorited ? '🔖' : '🔖'}</Text>
          </Pressable>
          <Pressable onPress={() => setShowCardStudio(true)} style={{ backgroundColor: '#F2B84B', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#292B28' }}>🖼️ Studio</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Verse hero */}
        <Animated.View entering={FadeIn.duration(500)} style={{ backgroundColor: '#F2B84B', borderRadius: 24, padding: 28, marginBottom: 24 }}>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#292B28', opacity: 0.6, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 14 }}>
            {verse.translation}
          </Text>
          <Text style={{ fontFamily: 'Lora_400Regular_Italic', fontSize: 22, lineHeight: 34, color: '#292B28', marginBottom: 20 }}>
            "{verse.text}"
          </Text>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: '#292B28' }}>
            {verse.reference}
          </Text>
        </Animated.View>

        {/* Reflection */}
        {verse.reflection && (
          <Animated.View entering={FadeIn.duration(500).delay(100)} style={{ backgroundColor: cardBg, borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#292B28', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
              {t('today.reflection')}
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 26, color: textPrimary }}>
              {verse.reflection}
            </Text>
          </Animated.View>
        )}

        {/* Prayer */}
        {verse.prayer && (
          <Animated.View entering={FadeIn.duration(500).delay(200)} style={{ backgroundColor: isDark ? '#3A2820' : '#FAE3D9', borderRadius: 20, padding: 20, marginBottom: 16 }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: isDark ? '#E89070' : '#C4643E', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
              {t('today.prayer')}
            </Text>
            <Text style={{ fontFamily: 'Lora_400Regular', fontSize: 16, lineHeight: 26, color: textPrimary }}>
              {verse.prayer}
            </Text>
          </Animated.View>
        )}

        {/* Related Verses */}
        {relatedVerses.length > 0 && (
          <Animated.View entering={FadeIn.duration(500).delay(300)}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18, color: textPrimary, marginBottom: 14 }}>
              {t('verse.relatedVerses')}
            </Text>
            <View style={{ gap: 10 }}>
              {relatedVerses.map((rv) => (
                <Pressable
                  key={rv.id}
                  onPress={() => router.push(`/verse/${rv.id}`)}
                  style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, shadowColor: '#292B28', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}
                >
                  <Text style={{ fontFamily: 'Lora_400Regular_Italic', fontSize: 15, lineHeight: 22, color: textPrimary, marginBottom: 8 }} numberOfLines={2}>
                    "{rv.text}"
                  </Text>
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: textSecondary }}>{rv.reference}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Verse Card Exporter Studio */}
      <VerseImageGenerator
        visible={showCardStudio}
        onClose={() => setShowCardStudio(false)}
        verseText={verse.text}
        reference={verse.reference}
        translation={verse.translation}
      />
    </SafeAreaView>
  );
}
