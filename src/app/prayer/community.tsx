import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/store/app.store';
import { getDb, generateId, nowIso } from '@/db/client';
import { useResolvedTheme } from '@/hooks/use-theme';

interface CommunityPrayer {
  id: string;
  author_alias: string;
  category: string;
  content: string;
  prayer_count: number;
  user_prayed: number;
  created_at: string;
}

const CATEGORIES = ['All', 'Healing', 'Peace', 'Family', 'Strength', 'Guidance'];

export default function CommunityPrayerWallScreen() {
  const { isDark } = useResolvedTheme();

  const [prayers, setPrayers] = useState<CommunityPrayer[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newCategory, setNewCategory] = useState('Healing');
  const [loading, setLoading] = useState(true);

  const bg = isDark ? '#1E1C18' : '#FFF9EE';
  const surfaceBg = isDark ? '#2A2720' : '#F1E6D3';
  const cardBg = isDark ? '#332F26' : '#FFFFFF';
  const textPrimary = isDark ? '#F5EDD8' : '#292B28';
  const textSecondary = isDark ? '#B8AD97' : '#77766F';

  useEffect(() => {
    loadPrayers();
  }, [selectedCategory]);

  async function loadPrayers() {
    setLoading(true);
    const db = getDb();
    let query = 'SELECT * FROM community_prayers ORDER BY created_at DESC';
    let params: any[] = [];

    if (selectedCategory !== 'All') {
      query = 'SELECT * FROM community_prayers WHERE category = ? ORDER BY created_at DESC';
      params = [selectedCategory];
    }

    const data = await db.getAllAsync<CommunityPrayer>(query, params);
    setPrayers(data);
    setLoading(false);
  }

  async function handlePrayForThis(id: string, currentCount: number, currentlyPrayed: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const db = getDb();
    const newCount = currentlyPrayed ? currentCount - 1 : currentCount + 1;
    const newStatus = currentlyPrayed ? 0 : 1;

    await db.runAsync(
      'UPDATE community_prayers SET prayer_count = ?, user_prayed = ? WHERE id = ?',
      [newCount, newStatus, id]
    );

    setPrayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, prayer_count: newCount, user_prayed: newStatus } : p))
    );
  }

  async function handleSubmitPrayer() {
    if (!newContent.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const db = getDb();
    const id = generateId();
    const author = newAuthor.trim() || 'Anonymous Pilgrim';

    await db.runAsync(
      'INSERT INTO community_prayers (id, author_alias, category, content, prayer_count, user_prayed, created_at) VALUES (?, ?, ?, ?, 1, 1, ?)',
      [id, author, newCategory, newContent.trim(), nowIso()]
    );

    setNewContent('');
    setNewAuthor('');
    setShowAddModal(false);
    loadPrayers();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      {/* Navbar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 }}>
        <Pressable onPress={router.back} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: surfaceBg, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18, color: textPrimary }}>←</Text>
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: textPrimary }}>Community Prayer Wall</Text>
        <Pressable onPress={() => setShowAddModal(true)} style={{ backgroundColor: '#F2B84B', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#292B28' }}>+ Post</Text>
        </Pressable>
      </View>

      {/* Category Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 12 }}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedCategory(cat);
            }}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 20,
              backgroundColor: selectedCategory === cat ? '#F2B84B' : surfaceBg,
            }}
          >
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: selectedCategory === cat ? '#292B28' : textSecondary }}>
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Prayer Feed */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {prayers.map((item) => (
          <View
            key={item.id}
            style={{
              backgroundColor: cardBg,
              borderRadius: 20,
              padding: 20,
              marginBottom: 14,
              borderWidth: 1,
              borderColor: isDark ? '#3D382E' : '#E6DAC7',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#96AA8833', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 14 }}>🙏</Text>
                </View>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: textPrimary }}>{item.author_alias}</Text>
              </View>
              <View style={{ backgroundColor: '#F2B84B22', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: '#F2B84B' }}>{item.category}</Text>
              </View>
            </View>

            <Text style={{ fontFamily: 'Lora_400Regular_Italic', fontSize: 16, lineHeight: 24, color: textPrimary, marginBottom: 16 }}>
              "{item.content}"
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: textSecondary }}>
                {item.prayer_count} {item.prayer_count === 1 ? 'person prayed' : 'people prayed'}
              </Text>
              <Pressable
                onPress={() => handlePrayForThis(item.id, item.prayer_count, item.user_prayed)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: item.user_prayed ? '#F2B84B' : surfaceBg,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 16,
                }}
              >
                <Text style={{ fontSize: 14 }}>{item.user_prayed ? '❤️' : '🙏'}</Text>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: item.user_prayed ? '#292B28' : textPrimary }}>
                  {item.user_prayed ? 'Prayed' : 'I Prayed'}
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Add Prayer Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent={true} onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: cardBg }]}>
            <Text style={[styles.modalTitle, { color: textPrimary }]}>Submit a Prayer Request</Text>

            <Text style={[styles.label, { color: textSecondary }]}>Your Name or Alias</Text>
            <TextInput
              value={newAuthor}
              onChangeText={setNewAuthor}
              placeholder="e.g. Anonymous, Sarah M."
              placeholderTextColor={textSecondary}
              style={[styles.input, { backgroundColor: surfaceBg, color: textPrimary }]}
            />

            <Text style={[styles.label, { color: textSecondary }]}>Category</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setNewCategory(cat)}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    backgroundColor: newCategory === cat ? '#F2B84B' : surfaceBg,
                  }}
                >
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: newCategory === cat ? '#292B28' : textSecondary }}>
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.label, { color: textSecondary }]}>Prayer Content</Text>
            <TextInput
              value={newContent}
              onChangeText={setNewContent}
              placeholder="Share what you would like prayer for..."
              placeholderTextColor={textSecondary}
              multiline
              numberOfLines={4}
              style={[styles.textArea, { backgroundColor: surfaceBg, color: textPrimary }]}
            />

            <View style={styles.modalButtons}>
              <Pressable onPress={() => setShowAddModal(false)} style={styles.cancelBtn}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', color: textSecondary }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSubmitPrayer} style={styles.submitBtn}>
                <Text style={{ fontFamily: 'Inter_700Bold', color: '#292B28' }}>Share Request</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalBox: {
    borderRadius: 24,
    padding: 24,
    elevation: 10,
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    marginBottom: 14,
  },
  textArea: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 15,
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  submitBtn: {
    backgroundColor: '#F2B84B',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
});
