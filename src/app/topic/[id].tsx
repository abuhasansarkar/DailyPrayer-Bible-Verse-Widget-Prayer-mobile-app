import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';

import { getDb } from '@/db/client';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useResolvedTheme } from '@/hooks/use-theme';

interface TopicRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}
interface VerseRow { id: string; reference: string; text: string }

const FALLBACK_TOPICS: Record<string, { name: string; icon: string; color: string; description: string }> = {
  hope:        { name: 'Hope',        icon: '✨', color: '#F2B84B', description: 'Scriptures and promises of hope in Christ.' },
  peace:       { name: 'Peace',       icon: '🕊️', color: '#96AA88', description: 'Find calm and rest in God\'s presence.' },
  strength:    { name: 'Strength',    icon: '💪', color: '#D98262', description: 'Be renewed in strength for every trial.' },
  love:        { name: 'Love',        icon: '❤️', color: '#D98262', description: 'God\'s unconditional love for you.' },
  faith:       { name: 'Faith',       icon: '🙏', color: '#F2B84B', description: 'Trusting in God\'s promises and timing.' },
  gratitude:   { name: 'Gratitude',   icon: '🌟', color: '#96AA88', description: 'Giving thanks in all circumstances.' },
  anxiety:     { name: 'Anxiety',     icon: '🤍', color: '#7BB8D4', description: 'Casting your worries upon the Lord.' },
  healing:     { name: 'Healing',     icon: '🌿', color: '#96AA88', description: 'Scriptures for comfort and restoration.' },
  guidance:    { name: 'Guidance',    icon: '🌅', color: '#F2B84B', description: 'Seeking God\'s direction in your life.' },
  forgiveness: { name: 'Forgiveness', icon: '💙', color: '#7BB8D4', description: 'Experiencing and extending forgiveness.' },
  family:      { name: 'Family',      icon: '🏡', color: '#D98262', description: 'Prayers and encouragement for home.' },
  morning:     { name: 'Morning',     icon: '🌄', color: '#F2B84B', description: 'Starting each new day with God.' },
};

export default function TopicDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDark } = useResolvedTheme();

  const topicKey = (id ?? '').toLowerCase();
  const fallbackMeta = FALLBACK_TOPICS[topicKey] ?? {
    name: id ? id.charAt(0).toUpperCase() + id.slice(1) : 'Topic',
    icon: '📖', color: '#F2B84B', description: 'Verses and encouragement for your faith journey.'
  };

  const [topic, setTopic] = useState<TopicRow | null>(null);
  const [verses, setVerses] = useState<VerseRow[]>([]);

  const bg = isDark ? '#1E1C18' : '#FFF9EE';
  const cardBg = isDark ? '#332F26' : '#FFFFFF';
  const textPrimary = isDark ? '#F5EDD8' : '#292B28';
  const textSecondary = isDark ? '#B8AD97' : '#77766F';

  useEffect(() => {
    async function load() {
      if (!id) return;
      const db = getDb();
      const t = await db.getFirstAsync<TopicRow>('SELECT * FROM topics WHERE id = ? OR slug = ?', [id, id]);
      setTopic(t ?? { id, ...fallbackMeta });

      let vv = await db.getAllAsync<VerseRow>(
        "SELECT id, reference, text FROM verses WHERE topics LIKE ? OR text LIKE ? LIMIT 20",
        [`%${id}%`, `%${id}%`]
      );
      if (vv.length === 0) {
        vv = await db.getAllAsync<VerseRow>('SELECT id, reference, text FROM verses ORDER BY RANDOM() LIMIT 5');
      }
      setVerses(vv);
    }
    load();
  }, [id]);

  const activeTopic = topic ?? { id: id ?? 'topic', ...fallbackMeta };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16 }}>
        <Pressable onPress={router.back} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? '#2A2720' : '#F1E6D3', alignItems: 'center', justifyContent: 'center' }}>
          <Text>←</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}>
        <Animated.View entering={FadeInDown.duration(400)} style={{ alignItems: 'center', marginBottom: 28, paddingTop: 8 }}>
          <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: `${activeTopic.color}22`, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 40 }}>{activeTopic.icon}</Text>
          </View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 28, color: textPrimary, textAlign: 'center', letterSpacing: -0.3 }}>{activeTopic.name}</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: textSecondary, textAlign: 'center', marginTop: 6 }}>{activeTopic.description}</Text>
        </Animated.View>

        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18, color: textPrimary, marginBottom: 14 }}>
          {verses.length} Verses
        </Text>

        <View style={{ gap: 12 }}>
          {verses.map((verse) => (
            <Pressable
              key={verse.id}
              onPress={() => router.push(`/verse/${verse.id}`)}
              style={{ backgroundColor: cardBg, borderRadius: 20, padding: 18, shadowColor: '#292B28', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
            >
              <Text style={{ fontFamily: 'Lora_400Regular_Italic', fontSize: 16, lineHeight: 26, color: textPrimary, marginBottom: 10 }} numberOfLines={3}>
                &quot;{verse.text}&quot;
              </Text>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: textSecondary }}>{verse.reference}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
