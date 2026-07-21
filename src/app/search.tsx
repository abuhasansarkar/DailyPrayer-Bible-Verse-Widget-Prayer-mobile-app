import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, useColorScheme, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useAppStore } from '@/store/app.store';
import { useBible } from '@/hooks/use-bible';
import { useUserStore } from '@/store/user.store';
import { useToast } from '@/components/ui/Toast';
import { Toast } from '@/components/ui/Toast';
import { useResolvedTheme } from '@/hooks/use-theme';

interface SearchResult {
  id: string;
  reference: string;
  text: string;
  book: string;
  chapter: number;
}

export default function SearchScreen() {
  const { q: initialQuery } = useLocalSearchParams<{ q?: string }>();
  const { isDark } = useResolvedTheme();
  const { searchVerses } = useBible();
  const { toggleFavorite, isFavorite } = useUserStore();
  const { toastProps, show } = useToast();

  const [query, setQuery] = useState(initialQuery ?? '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const bg = isDark ? '#1E1C18' : '#FFF9EE';
  const cardBg = isDark ? '#332F26' : '#FFFFFF';
  const surfaceBg = isDark ? '#2A2720' : '#F1E6D3';
  const textPrimary = isDark ? '#F5EDD8' : '#292B28';
  const textSecondary = isDark ? '#B8AD97' : '#77766F';

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setHasSearched(true);
    const res = await searchVerses(q.trim());
    setResults(res);
    setLoading(false);
  }, [searchVerses]);

  // Highlight matching text
  function highlight(text: string, q: string) {
    if (!q.trim()) return <Text>{text}</Text>;
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <Text>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <Text key={i} style={{ backgroundColor: '#F2B84B44', color: textPrimary, fontFamily: 'Inter_600SemiBold' }}>{part}</Text>
          ) : (
            <Text key={i} style={{ color: textPrimary }}>{part}</Text>
          )
        )}
      </Text>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(350)} style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: surfaceBg, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 18 }}>‹</Text>
          </Pressable>

          <View style={{
            flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
            backgroundColor: cardBg, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
            shadowColor: '#292B28', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
          }}>
            <Text style={{ fontSize: 15 }}>🔍</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => doSearch(query)}
              placeholder="Search Scripture..."
              placeholderTextColor={textSecondary}
              returnKeyType="search"
              autoFocus
              style={{ flex: 1, fontFamily: 'Inter_400Regular', fontSize: 16, color: textPrimary }}
            />
            {query.length > 0 && (
              <Pressable onPress={() => { setQuery(''); setResults([]); setHasSearched(false); }}>
                <Text style={{ fontSize: 14, color: textSecondary }}>✕</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Result count */}
        {hasSearched && !loading && (
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: textSecondary, marginTop: 10, paddingLeft: 4 }}>
            {results.length === 0
              ? `No results for "${query}"`
              : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
          </Text>
        )}
      </Animated.View>

      {/* Results */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {loading ? (
          <View style={{ paddingTop: 60, alignItems: 'center' }}>
            <ActivityIndicator color="#F2B84B" size="large" />
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: textSecondary, marginTop: 12 }}>Searching Scripture...</Text>
          </View>
        ) : !hasSearched ? (
          <Animated.View entering={FadeIn.duration(400)} style={{ paddingTop: 60, alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 56 }}>📖</Text>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18, color: textPrimary }}>Search the Bible</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: textSecondary, textAlign: 'center', paddingHorizontal: 32 }}>
              Enter a word, phrase, or reference to find verses
            </Text>
          </Animated.View>
        ) : results.length === 0 ? (
          <Animated.View entering={FadeIn.duration(300)} style={{ paddingTop: 60, alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 48 }}>🔍</Text>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 17, color: textPrimary }}>No matches found</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: textSecondary, textAlign: 'center', paddingHorizontal: 32 }}>
              Try different keywords or a shorter phrase
            </Text>
          </Animated.View>
        ) : (
          <View style={{ gap: 10 }}>
            {results.map((result, i) => {
              const saved = isFavorite('verse', result.id);
              return (
                <Animated.View key={result.id} entering={FadeInDown.duration(300).delay(i * 30)}>
                  <Pressable
                    onPress={() => router.push(`/verse/${result.id}`)}
                    style={{
                      backgroundColor: cardBg, borderRadius: 18, padding: 16,
                      shadowColor: '#292B28', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#F2B84B', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>
                          {result.reference}
                        </Text>
                        <Text style={{ fontFamily: 'Lora_400Regular_Italic', fontSize: 14, lineHeight: 22, color: textPrimary }}>
                          "{highlight(result.text.slice(0, 180) + (result.text.length > 180 ? '…' : ''), query)}"
                        </Text>
                      </View>
                      <Pressable
                        onPress={async (e) => {
                          e.stopPropagation();
                          await toggleFavorite('verse', result.id);
                          show(saved ? 'Removed from favorites' : 'Saved!', saved ? 'info' : 'success');
                        }}
                        style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: saved ? '#F2B84B22' : surfaceBg, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Text style={{ fontSize: 14 }}>🔖</Text>
                      </Pressable>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Toast {...toastProps} />
    </SafeAreaView>
  );
}
