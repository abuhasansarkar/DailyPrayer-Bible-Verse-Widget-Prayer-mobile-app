import { View, Text, ScrollView, Pressable, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppStore } from '@/store/app.store';
import { WIDGET_THEMES } from '@/types/widget';

const SIZES = [
  { id: 'small', label: 'Small', icon: '▪️', desc: 'Perfect for Lock Screen or corner' },
  { id: 'medium', label: 'Medium', icon: '▬', desc: 'Most popular size for Home Screen' },
  { id: 'large', label: 'Large', icon: '⬛', desc: 'Full verse with reflection' },
  { id: 'lockscreen-rectangular', label: 'Lock Screen', icon: '📱', desc: 'iOS Lock Screen widget' },
];

export default function WidgetsScreen() {
  const { t } = useTranslation();
  const systemScheme = useColorScheme();
  const { colorScheme } = useAppStore();
  const isDark = (colorScheme === 'system' ? systemScheme : colorScheme) === 'dark';

  const bg = isDark ? '#1E1C18' : '#FFF9EE';
  const cardBg = isDark ? '#332F26' : '#FFFFFF';
  const surfaceBg = isDark ? '#2A2720' : '#F1E6D3';
  const textPrimary = isDark ? '#F5EDD8' : '#292B28';
  const textSecondary = isDark ? '#B8AD97' : '#77766F';

  const freeThemes = WIDGET_THEMES.filter(t => !t.isPremium);
  const premiumThemes = WIDGET_THEMES.filter(t => t.isPremium);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 28, color: textPrimary, letterSpacing: -0.5 }}>
            {t('widgets.title')}
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: textSecondary, marginTop: 4 }}>
            {t('widgets.subtitle')}
          </Text>
        </Animated.View>

        {/* Widget sizes */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18, color: textPrimary, marginBottom: 14 }}>
            {t('widgets.gallery')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {SIZES.map((size) => (
              <Pressable
                key={size.id}
                onPress={() => router.push(`/widget/${size.id}/customize`)}
                style={{
                  width: '47%', backgroundColor: cardBg, borderRadius: 20, padding: 18,
                  shadowColor: '#292B28', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
                }}
              >
                <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: surfaceBg, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 28 }}>{size.icon}</Text>
                </View>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: textPrimary, marginBottom: 4 }}>
                  {size.label}
                </Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: textSecondary }}>
                  {size.desc}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Free Themes preview */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={{ paddingTop: 28 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18, color: textPrimary, paddingHorizontal: 20, marginBottom: 14 }}>
            Free Themes
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
            {freeThemes.map((theme) => (
              <Pressable
                key={theme.id}
                onPress={() => router.push(`/widget/medium/customize`)}
                style={{
                  width: 140, height: 100, borderRadius: 16,
                  backgroundColor: theme.bgColor,
                  padding: 14, justifyContent: 'space-between',
                  shadowColor: '#292B28', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
                }}
              >
                <Text style={{ fontFamily: 'Lora_400Regular_Italic', fontSize: 11, lineHeight: 16, color: theme.textColor }} numberOfLines={3}>
                  "For I know the plans I have for you..."
                </Text>
                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 10, color: theme.referenceColor }}>
                  {theme.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Premium Themes preview */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={{ paddingTop: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14 }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18, color: textPrimary }}>
              Premium Themes
            </Text>
            <Pressable onPress={() => router.push('/premium/')}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#F2B84B' }}>{t('common.upgrade')} →</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
            {premiumThemes.slice(0, 8).map((theme) => (
              <Pressable
                key={theme.id}
                onPress={() => router.push('/premium/')}
                style={{
                  width: 140, height: 100, borderRadius: 16,
                  backgroundColor: theme.bgColor,
                  padding: 14, justifyContent: 'space-between',
                  shadowColor: '#292B28', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
                  opacity: 0.85,
                }}
              >
                <Text style={{ fontFamily: 'Lora_400Regular_Italic', fontSize: 11, lineHeight: 16, color: theme.textColor }} numberOfLines={3}>
                  "For I know the plans I have for you..."
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 10, color: theme.referenceColor }}>{theme.name}</Text>
                  <View style={{ backgroundColor: '#F2B84B', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 8, color: '#292B28' }}>PRO</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Install guide CTA */}
        <Animated.View entering={FadeInDown.duration(400).delay(400)} style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Pressable
            style={{
              backgroundColor: surfaceBg, borderRadius: 20, padding: 20,
              flexDirection: 'row', alignItems: 'center', gap: 16,
            }}
          >
            <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: '#F2B84B22', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 26 }}>📖</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: textPrimary, marginBottom: 2 }}>
                {t('widgets.install')}
              </Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: textSecondary }}>
                Step-by-step guide for iOS and Android
              </Text>
            </View>
            <Text style={{ color: textSecondary, fontSize: 16 }}>→</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
