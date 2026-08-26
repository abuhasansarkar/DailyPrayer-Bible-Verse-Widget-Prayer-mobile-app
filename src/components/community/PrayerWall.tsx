import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { getDb, generateId, nowIso } from '@/db/client';
import { useAsyncData } from '@/hooks/use-async-data';
import { useResolvedTheme } from '@/hooks/use-theme';
import { EmptyState } from '@/components/ui/EmptyState';

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

/** Stable identity so useAsyncData does not reset on every render. */
const EMPTY_PRAYERS: CommunityPrayer[] = [];

interface PrayerWallProps {
  /** Tab routes have no back affordance; stack routes do. */
  showBackButton?: boolean;
}

export function PrayerWall({ showBackButton = false }: PrayerWallProps) {
  const { isDark } = useResolvedTheme();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newCategory, setNewCategory] = useState('Healing');

  const bg = isDark ? '#1E1C18' : '#FFF9EE';
  const surfaceBg = isDark ? '#2A2720' : '#F1E6D3';
  const cardBg = isDark ? '#332F26' : '#FFFFFF';
  const textPrimary = isDark ? '#F5EDD8' : '#292B28';
  const textSecondary = isDark ? '#B8AD97' : '#77766F';

  // useAsyncData owns loading/error/cancellation. Loading through it rather
  // than a hand-rolled effect keeps the screen compatible with the React
  // Compiler (no synchronous setState inside an effect body) and fixes two
  // bugs the previous version had: an uncaught DB error left the wall
  // spinning forever, and switching categories quickly could land an older
  // query's results last.
  const fetchPrayers = useCallback(async (): Promise<CommunityPrayer[]> => {
    const db = getDb();
    const query =
      selectedCategory === 'All'
        ? 'SELECT * FROM community_prayers ORDER BY created_at DESC'
        : 'SELECT * FROM community_prayers WHERE category = ? ORDER BY created_at DESC';
    const params = selectedCategory === 'All' ? [] : [selectedCategory];
    return db.getAllAsync<CommunityPrayer>(query, params);
  }, [selectedCategory]);

  const {
    data: prayers,
    loading,
    error,
    refresh: loadPrayers,
    setData: setPrayers,
  } = useAsyncData<CommunityPrayer[]>(selectedCategory, fetchPrayers, EMPTY_PRAYERS);

  const isEmpty = prayers.length === 0;

  async function handlePrayForThis(id: string, currentCount: number, currentlyPrayed: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Clamp: a bad row (prayed flag set with a zero count) would otherwise
    // render "-1 people prayed".
    const newCount = currentlyPrayed ? Math.max(0, currentCount - 1) : currentCount + 1;
    const newStatus = currentlyPrayed ? 0 : 1;

    // Optimistic, then rolled back if the write fails.
    setPrayers((current) =>
      current.map((p) =>
        p.id === id ? { ...p, prayer_count: newCount, user_prayed: newStatus } : p
      )
    );

    try {
      await getDb().runAsync(
        'UPDATE community_prayers SET prayer_count = ?, user_prayed = ? WHERE id = ?',
        [newCount, newStatus, id]
      );
    } catch (e) {
      console.warn('[PrayerWall] Could not save the prayer count:', e);
      setPrayers((current) =>
        current.map((p) =>
          p.id === id ? { ...p, prayer_count: currentCount, user_prayed: currentlyPrayed } : p
        )
      );
    }
  }

  async function handleSubmitPrayer() {
    if (!newContent.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const id = generateId();
    const author = newAuthor.trim() || 'Anonymous Pilgrim';

    try {
      await getDb().runAsync(
        'INSERT INTO community_prayers (id, author_alias, category, content, prayer_count, user_prayed, created_at) VALUES (?, ?, ?, ?, 1, 1, ?)',
        [id, author, newCategory, newContent.trim(), nowIso()]
      );
    } catch (e) {
      console.warn('[PrayerWall] Could not save the prayer:', e);
      Alert.alert('Could not post', 'Your prayer could not be saved. Please try again.');
      return;
    }

    setNewContent('');
    setNewAuthor('');
    setShowAddModal(false);
    void loadPrayers();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      {/* Navbar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 }}>
        {showBackButton ? (
          <Pressable
            onPress={router.back}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: surfaceBg, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 18, color: textPrimary }}>←</Text>
          </Pressable>
        ) : null}
        <View style={{ flex: 1, marginLeft: showBackButton ? 12 : 0 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: textPrimary }}>Prayer Wall</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: textSecondary, marginTop: 2 }}>
            Saved on this device
          </Text>
        </View>
        <Pressable
          onPress={() => setShowAddModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Post a prayer request"
          style={{ backgroundColor: '#F2B84B', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}
        >
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#292B28' }}>+ Post</Text>
        </Pressable>
      </View>

      {/* Category Pills.

          `flexGrow: 0` matters: a horizontal ScrollView placed directly in a
          flex-column screen expands to fill the remaining vertical space, and
          its row content container then stretches every child to that height —
          which turned these pills into full-height columns. `alignItems:
          'center'` keeps them at their natural height independently. */}
      <View style={{ flexGrow: 0, flexShrink: 0, paddingBottom: 12 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8, alignItems: 'center' }}
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedCategory(cat);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedCategory === cat }}
              accessibilityLabel={`Filter by ${cat}`}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 20,
                backgroundColor: selectedCategory === cat ? '#F2B84B' : surfaceBg,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 13,
                  color: selectedCategory === cat ? '#292B28' : textSecondary,
                }}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Prayer Feed.

          When there is nothing to list, the container grows and centres its
          child so the empty state sits in the middle of the space rather than
          flush under the filter pills. */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: showBackButton ? 40 : 120,
          ...(isEmpty ? { flexGrow: 1, justifyContent: 'center' as const } : null),
        }}
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <View
            style={{
              backgroundColor: cardBg,
              borderRadius: 16,
              padding: 16,
              marginBottom: 14,
              borderWidth: 1,
              borderColor: '#D98262',
            }}
          >
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: textPrimary }}>
              {error}
            </Text>
            <Pressable
              onPress={() => void loadPrayers()}
              accessibilityRole="button"
              style={{ marginTop: 10, alignSelf: 'flex-start' }}
            >
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#D98262' }}>
                Try again
              </Text>
            </Pressable>
          </View>
        )}
        {loading && prayers.length === 0 && (
          <View style={{ paddingVertical: 48, alignItems: 'center', gap: 12 }}>
            <ActivityIndicator color="#F2B84B" />
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: textSecondary }}>
              Loading your wall…
            </Text>
          </View>
        )}
        {!loading && !error && prayers.length === 0 && (
          <EmptyState
            title="No requests yet"
            description="Post a request to start your prayer wall. Entries stay on this device."
            pose="praying"
          />
        )}
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
              &quot;{item.content}&quot;
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: textSecondary }}>
                {item.prayer_count} {item.prayer_count === 1 ? 'person prayed' : 'people prayed'}
              </Text>
              <Pressable
                onPress={() => handlePrayForThis(item.id, item.prayer_count, item.user_prayed)}
                accessibilityRole="button"
                accessibilityState={{ selected: Boolean(item.user_prayed) }}
                accessibilityLabel={
                  item.user_prayed
                    ? `You prayed for ${item.author_alias}. Tap to undo.`
                    : `Pray for ${item.author_alias}`
                }
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
        {/* The sheet is vertically centred and its last field is a multiline
            text area, so without this the on-screen keyboard covered both the
            field being typed into and the Share button. */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          <View style={[styles.modalBox, { backgroundColor: cardBg }]}>
            <Text style={[styles.modalTitle, { color: textPrimary }]}>Submit a Prayer Request</Text>

            <Text style={[styles.label, { color: textSecondary }]}>Your Name or Alias</Text>
            <TextInput
              value={newAuthor}
              onChangeText={setNewAuthor}
              placeholder="e.g. Anonymous, Sarah M."
              placeholderTextColor={textSecondary}
              maxLength={40}
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
              maxLength={500}
              style={[styles.textArea, { backgroundColor: surfaceBg, color: textPrimary }]}
            />

            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setShowAddModal(false)}
                accessibilityRole="button"
                style={styles.cancelBtn}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', color: textSecondary }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmitPrayer}
                // Previously this silently did nothing with an empty field.
                disabled={!newContent.trim()}
                accessibilityRole="button"
                accessibilityState={{ disabled: !newContent.trim() }}
                style={[styles.submitBtn, !newContent.trim() && { opacity: 0.5 }]}
              >
                <Text style={{ fontFamily: 'Inter_700Bold', color: '#292B28' }}>Share Request</Text>
              </Pressable>
            </View>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
