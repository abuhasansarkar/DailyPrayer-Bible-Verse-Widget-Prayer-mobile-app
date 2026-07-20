import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppStore } from '@/store/app.store';
import { BIBLE_BOOKS } from '@/hooks/use-bible';

export default function BibleIndexScreen() {
  const systemScheme = useColorScheme();
  const { colorScheme } = useAppStore();
  const isDark = (colorScheme === 'system' ? systemScheme : colorScheme) === 'dark';
  const [search, setSearch] = useState('');
  const [testament, setTestament] = useState<'ALL' | 'OT' | 'NT'>('ALL');

  const bg = isDark ? '#1E1C18' : '#FFF9EE';
  const cardBg = isDark ? '#332F26' : '#FFFFFF';
  const surfaceBg = isDark ? '#2A2720' : '#F1E6D3';
  const textPrimary = isDark ? '#F5EDD8' : '#292B28';
  const textSecondary = isDark ? '#B8AD97' : '#77766F';

  const filtered = BIBLE_BOOKS.filter((b) => {
    const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase()) ||
                          b.abbreviation.toLowerCase().includes(search.toLowerCase());
    const matchesTestament = testament === 'ALL' || b.testament === testament;
    return matchesSearch && matchesTestament;
  });

  const otBooks = filtered.filter((b) => b.testament === 'OT');
  const ntBooks = filtered.filter((b) => b.testament === 'NT');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: surfaceBg, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 18 }}>‹</Text>
          </Pressable>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: textPrimary, letterSpacing: -0.5, flex: 1 }}>
            Bible
          </Text>
        </View>

        {/* Search */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 10,
          backgroundColor: cardBg, borderRadius: 14,
          paddingHorizontal: 14, paddingVertical: 11,
          shadowColor: '#292B28', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
          marginBottom: 12,
        }}>
          <Text style={{ fontSize: 15 }}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search books..."
            placeholderTextColor={textSecondary}
            style={{ flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15, color: textPrimary }}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Text style={{ fontSize: 14, color: textSecondary }}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Testament filter */}
        <View style={{ flexDirection: 'row', backgroundColor: surfaceBg, borderRadius: 12, padding: 3, gap: 3 }}>
          {(['ALL', 'OT', 'NT'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTestament(t)}
              style={{
                flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
                backgroundColor: testament === t ? (isDark ? '#3A3028' : '#FFFFFF') : 'transparent',
                shadowColor: testament === t ? '#292B28' : 'transparent',
                shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2,
              }}
            >
              <Text style={{
                fontFamily: testament === t ? 'Inter_600SemiBold' : 'Inter_400Regular',
                fontSize: 13, color: testament === t ? textPrimary : textSecondary,
              }}>
                {t === 'ALL' ? 'All Books' : t === 'OT' ? 'Old Testament' : 'New Testament'}
              </Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Old Testament */}
        {(testament === 'ALL' || testament === 'OT') && otBooks.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#F2B84B', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
              Old Testament · {otBooks.length} books
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {otBooks.map((book) => (
                <Pressable
                  key={book.name}
                  onPress={() => router.push(`/bible/${encodeURIComponent(book.name)}/1`)}
                  style={{
                    backgroundColor: cardBg, borderRadius: 12,
                    paddingHorizontal: 14, paddingVertical: 10, gap: 2,
                    shadowColor: '#292B28', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
                    minWidth: 90,
                  }}
                >
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: textPrimary }}>{book.name}</Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: textSecondary }}>{book.chapterCount} ch</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

        {/* New Testament */}
        {(testament === 'ALL' || testament === 'NT') && ntBooks.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={{ paddingHorizontal: 20 }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#7BB8D4', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
              New Testament · {ntBooks.length} books
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {ntBooks.map((book) => (
                <Pressable
                  key={book.name}
                  onPress={() => router.push(`/bible/${encodeURIComponent(book.name)}/1`)}
                  style={{
                    backgroundColor: cardBg, borderRadius: 12,
                    paddingHorizontal: 14, paddingVertical: 10, gap: 2,
                    shadowColor: '#292B28', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
                    minWidth: 90,
                  }}
                >
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: textPrimary }}>{book.name}</Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: textSecondary }}>{book.chapterCount} ch</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

        {filtered.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📖</Text>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 17, color: textPrimary }}>No books found</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: textSecondary, marginTop: 4 }}>Try a different search term</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
