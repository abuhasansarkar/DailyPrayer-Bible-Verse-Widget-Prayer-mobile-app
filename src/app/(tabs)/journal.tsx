import { View, Text, ScrollView, Pressable, ActivityIndicator, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/app.store';
import { useJournal } from '@/hooks/use-journal';
import { AppIcon } from '@/components/ui/AppIcon';

const FILTERS = ['all', 'prayer', 'gratitude', 'reflection'] as const;
type JournalFilter = (typeof FILTERS)[number];

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function JournalTabScreen() {
  const { t } = useTranslation();
  const systemScheme = useColorScheme();
  const { colorScheme } = useAppStore();
  const isDark = (colorScheme === 'system' ? systemScheme : colorScheme) === 'dark';
  const { entries, gratitude, loading } = useJournal();

  const bg = isDark ? '#1E1C18' : '#FFF9EE';
  const cardBg = isDark ? '#332F26' : '#FFFFFF';
  const surfaceBg = isDark ? '#2A2720' : '#F1E6D3';
  const textPrimary = isDark ? '#F5EDD8' : '#292B28';
  const textSecondary = isDark ? '#B8AD97' : '#77766F';

  const recentEntries = entries.slice(0, 8);
  const totalCount = entries.length + gratitude.length;
  const answeredCount = entries.filter((entry) => entry.is_answered === 1).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(350)} style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 28, color: textPrimary }}>
                {t('journal.title')}
              </Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: textSecondary, marginTop: 4 }}>
                Prayers, gratitude, and reflections in one quiet place
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/journal/new')}
              style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: '#F2B84B', alignItems: 'center', justifyContent: 'center' }}
              accessibilityLabel="Create journal entry"
            >
              <AppIcon name="plus" size={21} color="#292B28" strokeWidth={2.4} />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(350).delay(80)} style={{ paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 18, padding: 16 }}>
              <AppIcon name="journal" size={22} color="#D98262" />
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 28, color: textPrimary, marginTop: 12 }}>{totalCount}</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: textSecondary }}>entries</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 18, padding: 16 }}>
              <AppIcon name="check" size={22} color="#96AA88" />
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 28, color: textPrimary, marginTop: 12 }}>{answeredCount}</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: textSecondary }}>answered</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(350).delay(120)} style={{ paddingTop: 18 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
            {FILTERS.map((filter) => (
              <View
                key={filter}
                style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, backgroundColor: filter === 'all' ? '#F2B84B' : surfaceBg }}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: filter === 'all' ? '#292B28' : textSecondary }}>
                  {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(350).delay(180)} style={{ paddingHorizontal: 20, paddingTop: 20, gap: 12 }}>
          {loading ? (
            <View style={{ paddingVertical: 48, alignItems: 'center', gap: 12 }}>
              <ActivityIndicator color="#F2B84B" />
              <Text style={{ fontFamily: 'Inter_400Regular', color: textSecondary }}>{t('common.loading')}</Text>
            </View>
          ) : recentEntries.length === 0 && gratitude.length === 0 ? (
            <View style={{ backgroundColor: cardBg, borderRadius: 20, padding: 24, alignItems: 'center', gap: 12 }}>
              <View style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: '#F2B84B22', alignItems: 'center', justifyContent: 'center' }}>
                <AppIcon name="journal" size={30} color="#D98262" />
              </View>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: textPrimary }}>{t('journal.emptyState.title')}</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, color: textSecondary, textAlign: 'center' }}>
                {t('journal.emptyState.subtitle')}
              </Text>
              <Pressable onPress={() => router.push('/journal/new')} style={{ backgroundColor: '#F2B84B', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 12 }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#292B28' }}>{t('journal.emptyState.cta')}</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {recentEntries.map((entry) => (
                <Pressable
                  key={entry.id}
                  onPress={() => router.push(`/journal/${entry.id}`)}
                  style={{ backgroundColor: cardBg, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: isDark ? 'rgba(245,237,216,0.06)' : 'rgba(41,43,40,0.06)' }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: entry.type === 'prayer' ? '#D9826220' : '#96AA8820', alignItems: 'center', justifyContent: 'center' }}>
                      <AppIcon name={entry.type === 'prayer' ? 'pray' : 'journal'} size={18} color={entry.type === 'prayer' ? '#D98262' : '#96AA88'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: textPrimary }} numberOfLines={1}>{entry.title || 'Untitled entry'}</Text>
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: textSecondary }}>{entry.type} • {formatDate(entry.created_at)}</Text>
                    </View>
                    <AppIcon name="chevronRight" size={18} color={textSecondary} />
                  </View>
                  <Text style={{ fontFamily: 'Lora_400Regular', fontSize: 15, lineHeight: 23, color: textSecondary }} numberOfLines={2}>
                    {entry.body || 'No details yet.'}
                  </Text>
                </Pressable>
              ))}
            </>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}