import { View, Text, ScrollView, Pressable, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppStore } from '@/store/app.store';
import { WIDGET_THEMES } from '@/types/widget';
import { AppIcon, AppIconName } from '@/components/ui/AppIcon';

const SIZES: { id: string; label: string; icon: AppIconName; desc: string }[] = [
  { id: 'small', label: 'Small', icon: 'grid', desc: 'Compact verse tile for quick glances' },
  { id: 'medium', label: 'Medium', icon: 'widget', desc: 'Balanced daily verse and reference' },
  { id: 'large', label: 'Large', icon: 'book', desc: 'Verse, reference, and reflection space' },
  { id: 'lockscreen-rectangular', label: 'Lock Screen', icon: 'phone', desc: 'Minimal verse prompt for iOS lock screens' },
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

  // All free themes — the paywall copy in constants/entitlements promises
  // "5 widget themes", and slicing to 4 here contradicted it.
  const freeThemes = WIDGET_THEMES.filter((theme) => !theme.isPremium);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 44 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(350)} style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 28, color: textPrimary }}>{t('widgets.title')}</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, color: textSecondary, marginTop: 4 }}>
                Scripture that feels native on the home screen.
              </Text>
            </View>
            <Pressable onPress={() => router.push('/widget/install')} style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: surfaceBg, alignItems: 'center', justifyContent: 'center' }}>
              <AppIcon name="help" size={21} color={textPrimary} />
            </Pressable>
          </View>

          {/* Honest status banner.
              The previous copy said native widgets "require an EAS Development
              Build", which implied they exist and merely need the right build.
              There is no WidgetKit extension and no AppWidgetProvider in this
              project, so nothing can render on a home screen yet — see
              plan.md B1. Saying so is better than a promise the app cannot keep. */}
          <View style={{ marginTop: 12, backgroundColor: '#FEF3D1', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#F2B84B' }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#292B28' }}>
              💡 Theme preview
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: '#77766F', marginTop: 2 }}>
              Design and preview your widget here. Placing it on your home screen is coming in a future update.
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(350).delay(80)} style={{ paddingHorizontal: 20 }}>
          <View style={{ backgroundColor: cardBg, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: isDark ? 'rgba(245,237,216,0.07)' : 'rgba(41,43,40,0.07)' }}>
            <View style={{ height: 178, borderRadius: 22, backgroundColor: '#F2B84B', padding: 18, justifyContent: 'space-between', overflow: 'hidden' }}>
              <View style={{ position: 'absolute', right: -28, top: -28, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.18)' }} />
              <View style={{ width: 42, height: 42, borderRadius: 15, backgroundColor: 'rgba(41,43,40,0.14)', alignItems: 'center', justifyContent: 'center' }}>
                <AppIcon name="book" size={22} color="#292B28" />
              </View>
              <View>
                <Text style={{ fontFamily: 'Lora_400Regular_Italic', fontSize: 20, lineHeight: 30, color: '#292B28' }} numberOfLines={3}>
                  For I know the plans I have for you...
                </Text>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: 'rgba(41,43,40,0.72)', marginTop: 8 }}>
                  Jeremiah 29:11
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Pressable onPress={() => router.push('/widget/medium/customize')} style={{ flex: 1, height: 48, borderRadius: 16, backgroundColor: '#292B28', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#FFF9EE' }}>{t('widgets.customize')}</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/widget/themes')} style={{ width: 52, height: 48, borderRadius: 16, backgroundColor: surfaceBg, alignItems: 'center', justifyContent: 'center' }}>
                <AppIcon name="palette" size={21} color={textPrimary} />
              </Pressable>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(350).delay(140)} style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: textPrimary, marginBottom: 12 }}>Choose a size</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {SIZES.map((size) => (
              <Pressable
                key={size.id}
                onPress={() => router.push(`/widget/${size.id}/customize`)}
                style={{ width: '47.8%', backgroundColor: cardBg, borderRadius: 18, padding: 16, minHeight: 148, borderWidth: 1, borderColor: isDark ? 'rgba(245,237,216,0.06)' : 'rgba(41,43,40,0.06)' }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: surfaceBg, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <AppIcon name={size.icon} size={22} color="#D98262" />
                </View>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: textPrimary, marginBottom: 5 }}>{size.label}</Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, color: textSecondary }}>{size.desc}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(350).delay(220)} style={{ paddingTop: 26 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: textPrimary }}>Theme starters</Text>
            <Pressable onPress={() => router.push('/widget/themes')}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#D98262' }}>View all</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
            {freeThemes.map((theme) => (
              <Pressable key={theme.id} onPress={() => router.push('/widget/medium/customize')} style={{ width: 150, height: 104, borderRadius: 17, backgroundColor: theme.bgColor, padding: 14, justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'Lora_400Regular_Italic', fontSize: 11, lineHeight: 16, color: theme.textColor }} numberOfLines={3}>
                  For I know the plans I have for you...
                </Text>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: theme.referenceColor }}>{theme.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(350).delay(280)} style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <Pressable onPress={() => router.push('/widget/install')} style={{ backgroundColor: surfaceBg, borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 46, height: 46, borderRadius: 15, backgroundColor: '#F2B84B22', alignItems: 'center', justifyContent: 'center' }}>
              <AppIcon name="phone" size={22} color="#D98262" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: textPrimary }}>{t('widgets.install')}</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: textSecondary, marginTop: 2 }}>iOS and Android setup guide</Text>
            </View>
            <AppIcon name="chevronRight" size={18} color={textSecondary} />
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}