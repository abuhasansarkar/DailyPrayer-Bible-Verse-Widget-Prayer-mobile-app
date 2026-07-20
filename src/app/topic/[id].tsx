import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useAppStore } from '@/store/app.store';
import { getDb } from '@/db/client';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface TopicRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}
interface VerseRow { id: string; reference: string; text: string }

export default function TopicDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const systemScheme = useColorScheme();
  const { colorScheme } = useAppStore();
  const isDark = (colorScheme === 'system' ? systemScheme : colorScheme) === 'dark';

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
      const t = await db.getFirstAsync<TopicRow>('SELECT * FROM topics WHERE id = ?', [id]);
      setTopic(t ?? null);
      const vv = await db.getAllAsync<VerseRow>(
        "SELECT id, reference, text FROM verses WHERE topics LIKE ? LIMIT 20",
        [`%${id}%`]
      );
      setVerses(vv);
    }
    load();
  }, [id]);

  if (!topic) return <View style={{ flex: 1, backgroundColor: bg }} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16 }}>
        <Pressable onPress={router.back} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? '#2A2720' : '#F1E6D3', alignItems: 'center', justifyContent: 'center' }}>
          <Text>←</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}>
        <Animated.View entering={FadeInDown.duration(400)} style={{ alignItems: 'center', marginBottom: 28, paddingTop: 8 }}>
          <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: `${topic.color}22`, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 40 }}>{topic.icon}</Text>
          </View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 28, color: textPrimary, textAlign: 'center', letterSpacing: -0.3 }}>{topic.name}</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: textSecondary, textAlign: 'center', marginTop: 6 }}>{topic.description}</Text>
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
                "{verse.text}"
              </Text>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: textSecondary }}>{verse.reference}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
