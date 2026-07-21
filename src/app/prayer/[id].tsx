import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useAppStore } from '@/store/app.store';
import { useUserStore } from '@/store/user.store';
import { useAudioPlayer } from '@/hooks/use-audio-player';
import { getDb } from '@/db/client';
import MascotCelebration from '@/components/mascot/MascotCelebration';

interface PrayerDetail {
  id: string;
  title: string;
  intro: string;
  body: string;
  category: string;
  scripture_ref: string;
  scripture_text: string;
  duration_minutes: number;
  is_premium: number;
}

export default function PrayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const systemScheme = useColorScheme();
  const { colorScheme } = useAppStore();
  const { recordActivity } = useUserStore();
  const { isPlayingSpeech, playVerseSpeech, activeSoundscape, selectSoundscape } = useAudioPlayer();
  const isDark = (colorScheme === 'system' ? systemScheme : colorScheme) === 'dark';

  const [prayer, setPrayer] = useState<PrayerDetail | null>(null);
  const [prayed, setPrayed] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const bg = isDark ? '#1E1C18' : '#FFF9EE';
  const surfaceBg = isDark ? '#2A2720' : '#F1E6D3';
  const cardBg = isDark ? '#332F26' : '#FFFFFF';
  const textPrimary = isDark ? '#F5EDD8' : '#292B28';
  const textSecondary = isDark ? '#B8AD97' : '#77766F';

  useEffect(() => {
    async function load() {
      if (!id) return;
      const db = getDb();
      const row = await db.getFirstAsync<PrayerDetail>(
        'SELECT * FROM guided_prayers WHERE id = ?',
        [id]
      );
      setPrayer(row ?? null);
    }
    load();
  }, [id]);

  function handleMarkPrayed() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    recordActivity('prayer');
    setPrayed(true);
    setShowCelebration(true);
  }

  if (!prayer) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: textSecondary }}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16 }}>
        <Pressable onPress={router.back} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: surfaceBg, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18, color: textPrimary }}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: textPrimary }}>{prayer.title}</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: textSecondary }}>
            {prayer.duration_minutes} min · {prayer.category.charAt(0).toUpperCase() + prayer.category.slice(1)}
          </Text>
        </View>
      </View>

      {/* Audio & Soundscape Controls */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: surfaceBg }}>
        <Pressable onPress={() => playVerseSpeech(`${prayer.title}. ${prayer.body}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 16 }}>{isPlayingSpeech ? '⏸️' : '🔊'}</Text>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: isPlayingSpeech ? '#F2B84B' : textPrimary }}>
            {isPlayingSpeech ? 'Pause Voice' : 'Spoken Prayer'}
          </Text>
        </Pressable>

        <Pressable onPress={() => selectSoundscape(activeSoundscape ? null : 'sanctuary')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 16 }}>🕊️</Text>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: activeSoundscape ? '#F2B84B' : textSecondary }}>
            {activeSoundscape ? 'Sanctuary Ambient' : 'Ambient Music'}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <Animated.View entering={FadeIn.duration(500)}>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 26, color: textSecondary, marginBottom: 24, fontStyle: 'italic' }}>
            {prayer.intro}
          </Text>
        </Animated.View>

        {/* Breathing cue */}
        <Animated.View entering={FadeIn.duration(500).delay(100)} style={{ backgroundColor: surfaceBg, borderRadius: 16, padding: 14, marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ fontSize: 20 }}>🫁</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: textSecondary, flex: 1 }}>
            Take a slow breath in... and release. Let yourself become still.
          </Text>
        </Animated.View>

        {/* Prayer text */}
        <Animated.View entering={FadeIn.duration(500).delay(200)} style={{ backgroundColor: cardBg, borderRadius: 24, padding: 24, marginBottom: 20, shadowColor: '#292B28', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 }}>
          <Text style={{ fontFamily: 'Lora_400Regular', fontSize: 18, lineHeight: 30, color: textPrimary }}>
            {prayer.body}
          </Text>
        </Animated.View>

        {/* Scripture reference */}
        {prayer.scripture_ref && (
          <Animated.View entering={FadeIn.duration(500).delay(300)} style={{ backgroundColor: isDark ? '#3A3028' : '#FEF3D1', borderRadius: 16, padding: 18, marginBottom: 20 }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: isDark ? '#E0A828' : '#BB7E1A', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
              Scripture
            </Text>
            <Text style={{ fontFamily: 'Lora_400Regular_Italic', fontSize: 16, lineHeight: 26, color: textPrimary, marginBottom: 8 }}>
              "{prayer.scripture_text}"
            </Text>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: isDark ? '#E0A828' : '#BB7E1A' }}>
              {prayer.scripture_ref}
            </Text>
          </Animated.View>
        )}
      </ScrollView>

      {/* CTA */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16,
        backgroundColor: bg, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(245,237,216,0.07)' : 'rgba(41,43,40,0.07)',
      }}>
        {prayed ? (
          <View style={{ height: 56, borderRadius: 20, backgroundColor: '#96AA88', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
            <Text style={{ fontSize: 20 }}>✓</Text>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 17, color: '#FFFFFF' }}>{t('prayer.prayed')}</Text>
          </View>
        ) : (
          <Pressable
            onPress={handleMarkPrayed}
            style={{ height: 56, borderRadius: 20, backgroundColor: '#D98262', alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 17, color: '#FFFFFF' }}>{t('prayer.markPrayed')}</Text>
          </Pressable>
        )}
      </View>

      {/* Celebration Modal */}
      <MascotCelebration
        visible={showCelebration}
        onClose={() => {
          setShowCelebration(false);
          router.back();
        }}
        title="Prayer Complete"
        subtitle={`You've dedicated time to pray '${prayer.title}'. Peace be with you.`}
      />
    </SafeAreaView>
  );
}
