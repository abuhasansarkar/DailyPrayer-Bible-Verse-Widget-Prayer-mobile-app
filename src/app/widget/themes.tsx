import { useState } from 'react';
import { View, Text, ScrollView, Pressable, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppStore } from '@/store/app.store';
import { useSubscriptionStore } from '@/store/subscription.store';
import { WIDGET_THEMES } from '@/types/widget';

export default function WidgetThemesScreen() {
  const systemScheme = useColorScheme();
  const { colorScheme } = useAppStore();
  const { isPro } = useSubscriptionStore();
  const isDark = (colorScheme === 'system' ? systemScheme : colorScheme) === 'dark';

  const [filter, setFilter] = useState<'ALL' | 'FREE' | 'PREMIUM'>('ALL');

  const bg = isDark ? '#1E1C18' : '#FFF9EE';
  const cardBg = isDark ? '#332F26' : '#FFFFFF';
  const surfaceBg = isDark ? '#2A2720' : '#F1E6D3';
  const textPrimary = isDark ? '#F5EDD8' : '#292B28';
  const textSecondary = isDark ? '#B8AD97' : '#77766F';

  const themes = WIDGET_THEMES.filter((t) => {
    if (filter === 'FREE') return !t.isPremium;
    if (filter === 'PREMIUM') return t.isPremium;
    return true;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: surfaceBg, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 18, color: textSecondary }}>‹</Text>
          </Pressable>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: textPrimary, letterSpacing: -0.5, flex: 1 }}>
            Widget Themes
          </Text>
        </View>

        {/* Filter segment */}
        <View style={{ flexDirection: 'row', backgroundColor: surfaceBg, borderRadius: 12, padding: 3, gap: 3 }}>
          {(['ALL', 'FREE', 'PREMIUM'] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={{
                flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
                backgroundColor: filter === f ? (isDark ? '#3A3028' : '#FFFFFF') : 'transparent',
              }}
            >
              <Text style={{
                fontFamily: filter === f ? 'Inter_600SemiBold' : 'Inter_400Regular',
                fontSize: 13, color: filter === f ? textPrimary : textSecondary,
              }}>
                {f === 'ALL' ? 'All Themes' : f === 'FREE' ? 'Free' : 'Premium PRO'}
              </Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      {/* Grid */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {themes.map((theme) => {
            const isLocked = theme.isPremium && !isPro;
            return (
              <Pressable
                key={theme.id}
                onPress={() => {
                  if (isLocked) {
                    router.push('/premium');
                  } else {
                    router.push('/widget/medium/customize');
                  }
                }}
                style={{
                  width: '48%', height: 110, borderRadius: 18,
                  backgroundColor: theme.bgColor,
                  padding: 14, justifyContent: 'space-between',
                  shadowColor: '#292B28', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
                  opacity: isLocked ? 0.85 : 1,
                }}
              >
                <Text style={{ fontFamily: 'Lora_400Regular_Italic', fontSize: 11, lineHeight: 16, color: theme.textColor }} numberOfLines={3}>
                  "For I know the plans I have for you..."
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: theme.referenceColor }}>
                    {theme.name}
                  </Text>
                  {theme.isPremium && (
                    <View style={{ backgroundColor: '#F2B84B', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 8, color: '#292B28' }}>PRO</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
