import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { getDb, nowIso } from '@/db/client';
import { useResolvedTheme } from '@/hooks/use-theme';

interface JournalDetail {
  id: string;
  title: string;
  body: string;
  category: string;
  is_answered: number;
  created_at: string;
}

export default function JournalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { isDark } = useResolvedTheme();

  const [entry, setEntry] = useState<JournalDetail | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const bg = isDark ? '#1E1C18' : '#FFF9EE';
  const surfaceBg = isDark ? '#2A2720' : '#F1E6D3';
  const cardBg = isDark ? '#332F26' : '#FFFFFF';
  const textPrimary = isDark ? '#F5EDD8' : '#292B28';
  const textSecondary = isDark ? '#B8AD97' : '#77766F';

  useEffect(() => {
    async function load() {
      if (!id) return;
      const db = getDb();
      const row = await db.getFirstAsync<JournalDetail>(
        'SELECT * FROM personal_prayers WHERE id = ?',
        [id]
      );
      if (row) {
        setEntry(row);
        setTitle(row.title);
        setBody(row.body);
      }
    }
    load();
  }, [id]);

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    try {
      const db = getDb();
      await db.runAsync(
        'UPDATE personal_prayers SET title = ?, body = ?, updated_at = ? WHERE id = ?',
        [title, body, nowIso(), id]
      );
      setIsEditing(false);
    } catch (e) {
      console.warn(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    Alert.alert('Delete Prayer', 'Are you sure you want to delete this prayer?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!id) return;
          const db = getDb();
          await db.runAsync('DELETE FROM personal_prayers WHERE id = ?', [id]);
          router.back();
        },
      },
    ]);
  }

  async function toggleAnswered() {
    if (!entry || !id) return;
    const db = getDb();
    const nextState = entry.is_answered === 1 ? 0 : 1;
    await db.runAsync(
      'UPDATE personal_prayers SET is_answered = ?, answered_at = ? WHERE id = ?',
      [nextState, nextState === 1 ? nowIso() : null, id]
    );
    setEntry({ ...entry, is_answered: nextState });
  }

  if (!entry) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: textSecondary }}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 }}>
        <Pressable onPress={router.back} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: surfaceBg, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18 }}>←</Text>
        </Pressable>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {isEditing ? (
            <Pressable onPress={handleSave} disabled={saving}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#D98262' }}>
                {saving ? 'Saving...' : 'Done'}
              </Text>
            </Pressable>
          ) : (
            <>
              <Pressable onPress={() => setIsEditing(true)}>
                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 15, color: textSecondary }}>{t('common.edit')}</Text>
              </Pressable>
              <Pressable onPress={handleDelete}>
                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 15, color: '#D04A3C' }}>{t('common.delete')}</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Answered Banner */}
        <Pressable
          onPress={toggleAnswered}
          style={{
            backgroundColor: entry.is_answered === 1 ? '#96AA8822' : surfaceBg,
            borderRadius: 16, padding: 14, marginBottom: 20,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            borderWidth: 1, borderColor: entry.is_answered === 1 ? '#96AA88' : 'transparent',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ fontSize: 20 }}>{entry.is_answered === 1 ? '✨' : '🙏'}</Text>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: entry.is_answered === 1 ? '#96AA88' : textPrimary }}>
              {entry.is_answered === 1 ? 'Answered Prayer!' : 'Mark as Answered'}
            </Text>
          </View>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: textSecondary }}>
            {entry.is_answered === 1 ? 'Tap to undo' : 'Tap when answered'}
          </Text>
        </Pressable>

        {isEditing ? (
          <>
            <TextInput
              value={title}
              onChangeText={setTitle}
              style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: textPrimary, marginBottom: 16 }}
            />
            <View style={{ backgroundColor: cardBg, borderRadius: 20, padding: 16, minHeight: 200 }}>
              <TextInput
                value={body}
                onChangeText={setBody}
                multiline
                textAlignVertical="top"
                style={{ fontFamily: 'Lora_400Regular', fontSize: 17, lineHeight: 28, color: textPrimary, flex: 1 }}
              />
            </View>
          </>
        ) : (
          <>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 26, color: textPrimary, letterSpacing: -0.5, marginBottom: 8 }}>
              {entry.title}
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: textSecondary, marginBottom: 24 }}>
              {new Date(entry.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
            <View style={{ backgroundColor: cardBg, borderRadius: 24, padding: 24, shadowColor: '#292B28', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 }}>
              <Text style={{ fontFamily: 'Lora_400Regular', fontSize: 18, lineHeight: 30, color: textPrimary }}>
                {entry.body}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
