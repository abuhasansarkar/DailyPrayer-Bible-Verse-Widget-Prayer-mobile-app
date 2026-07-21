import { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/app.store';
import { useUserStore } from '@/store/user.store';
import { getDb, generateId, nowIso } from '@/db/client';
import { useResolvedTheme } from '@/hooks/use-theme';

const CATEGORIES = ['morning', 'evening', 'gratitude', 'peace', 'strength', 'healing', 'family', 'forgiveness', 'guidance', 'personal'];
const MOODS = [
  { id: 'grateful', emoji: '🙏' },
  { id: 'peaceful', emoji: '🕊️' },
  { id: 'hopeful', emoji: '✨' },
  { id: 'struggling', emoji: '💪' },
  { id: 'anxious', emoji: '🤍' },
  { id: 'joyful', emoji: '😊' },
];

export default function NewJournalScreen() {
  const { t } = useTranslation();
  const { isDark } = useResolvedTheme();
  const { recordActivity } = useUserStore();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('personal');
  const [mood, setMood] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const bg = isDark ? '#1E1C18' : '#FFF9EE';
  const surfaceBg = isDark ? '#2A2720' : '#F1E6D3';
  const cardBg = isDark ? '#332F26' : '#FFFFFF';
  const textPrimary = isDark ? '#F5EDD8' : '#292B28';
  const textSecondary = isDark ? '#B8AD97' : '#77766F';

  async function handleSave() {
    if (!title.trim() && !body.trim()) return;
    setSaving(true);
    try {
      const db = getDb();
      await db.runAsync(
        'INSERT INTO personal_prayers (id, title, body, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [generateId(), title.trim() || 'My Prayer', body.trim(), category, nowIso(), nowIso()]
      );
      recordActivity('journal');
      router.back();
    } catch (e) {
      console.warn(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 }}>
        <Pressable onPress={router.back}>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: textSecondary }}>Cancel</Text>
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: textPrimary }}>New Prayer</Text>
        <Pressable onPress={handleSave} disabled={saving}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#D98262' }}>
            {saving ? 'Saving...' : t('common.save')}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={t('prayer.prayerTitle')}
          placeholderTextColor={textSecondary}
          style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: textPrimary, paddingVertical: 8, marginBottom: 4, letterSpacing: -0.3 }}
        />

        {/* Mood */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: textSecondary, marginBottom: 10 }}>
            {t('journal.mood')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            {MOODS.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => setMood(mood === m.id ? null : m.id)}
                style={{
                  width: 52, height: 52, borderRadius: 16,
                  backgroundColor: mood === m.id ? '#F2B84B20' : surfaceBg,
                  borderWidth: 2, borderColor: mood === m.id ? '#F2B84B' : 'transparent',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 26 }}>{m.emoji}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Category */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: textSecondary, marginBottom: 10 }}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setCategory(cat)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
                  backgroundColor: category === cat ? '#D98262' : surfaceBg,
                }}
              >
                <Text style={{
                  fontFamily: 'Inter_500Medium', fontSize: 13,
                  color: category === cat ? '#FFFFFF' : textSecondary,
                }}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Body */}
        <View style={{ backgroundColor: cardBg, borderRadius: 20, padding: 16, minHeight: 200, shadowColor: '#292B28', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder={t('prayer.prayerBody')}
            placeholderTextColor={textSecondary}
            multiline
            textAlignVertical="top"
            style={{ fontFamily: 'Lora_400Regular', fontSize: 17, lineHeight: 28, color: textPrimary, flex: 1, minHeight: 160 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
