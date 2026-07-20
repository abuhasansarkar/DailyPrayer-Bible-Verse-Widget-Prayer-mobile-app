import { View, Text, ScrollView, Pressable, Switch, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppStore } from '@/store/app.store';
import { useUserStore } from '@/store/user.store';
import { useSubscriptionStore } from '@/store/subscription.store';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const systemScheme = useColorScheme();
  const { colorScheme, setColorScheme, preferences } = useAppStore();
  const { displayName, streak } = useUserStore();
  const { tier } = useSubscriptionStore();
  const isDark = (colorScheme === 'system' ? systemScheme : colorScheme) === 'dark';

  const bg = isDark ? '#1E1C18' : '#FFF9EE';
  const surfaceBg = isDark ? '#2A2720' : '#F1E6D3';
  const cardBg = isDark ? '#332F26' : '#FFFFFF';
  const textPrimary = isDark ? '#F5EDD8' : '#292B28';
  const textSecondary = isDark ? '#B8AD97' : '#77766F';

  type RowData = { label: string; icon: string; value?: string; onPress?: () => void; isToggle?: boolean; toggled?: boolean; onToggle?: (v: boolean) => void };

  const sections: { title: string; rows: RowData[] }[] = [
    {
      title: 'Preferences',
      rows: [
        { label: t('settings.notifications'), icon: '🔔', value: preferences.notificationsEnabled ? 'On' : 'Off' },
        { label: t('settings.translation'), icon: '📖', value: preferences.preferredTranslation },
        { label: 'Dark Mode', icon: '🌙', isToggle: true, toggled: colorScheme === 'dark', onToggle: (v) => setColorScheme(v ? 'dark' : 'light') },
        { label: t('settings.language'), icon: '🌐', value: preferences.language === 'en' ? 'English' : 'Français' },
        { label: t('settings.accessibility'), icon: '♿', onPress: () => {} },
      ],
    },
    {
      title: 'Account',
      rows: [
        {
          label: t('settings.subscription'),
          icon: '⭐',
          value: tier === 'free' ? 'Free' : 'Premium',
          onPress: () => router.push('/premium/'),
        },
        { label: t('settings.privacy'), icon: '🔒' },
        { label: t('settings.help'), icon: '💬' },
        { label: t('settings.about'), icon: 'ℹ️' },
      ],
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16 }}>
        <Pressable onPress={router.back} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: surfaceBg, alignItems: 'center', justifyContent: 'center' }}>
          <Text>←</Text>
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: textPrimary }}>{t('settings.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <Animated.View entering={FadeInDown.duration(400)} style={{ backgroundColor: '#F2B84B', borderRadius: 20, padding: 20, marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(41,43,40,0.15)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 28 }}>🌅</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: '#292B28' }}>
              {displayName || 'My DailyPrayer'}
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: 'rgba(41,43,40,0.7)' }}>
              🔥 {streak.currentStreak} day streak · {tier === 'premium' ? 'Premium' : 'Free'}
            </Text>
          </View>
          <Pressable style={{ backgroundColor: 'rgba(41,43,40,0.12)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#292B28' }}>{t('common.edit')}</Text>
          </Pressable>
        </Animated.View>

        {/* Settings sections */}
        {sections.map((section, si) => (
          <Animated.View key={si} entering={FadeInDown.duration(400).delay(si * 100 + 100)} style={{ marginBottom: 24 }}>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, paddingLeft: 4 }}>
              {section.title}
            </Text>
            <View style={{ backgroundColor: cardBg, borderRadius: 20, overflow: 'hidden', shadowColor: '#292B28', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
              {section.rows.map((row, ri) => (
                <Pressable
                  key={ri}
                  onPress={row.isToggle ? undefined : row.onPress}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 14,
                    paddingHorizontal: 18, paddingVertical: 14,
                    borderBottomWidth: ri < section.rows.length - 1 ? 1 : 0,
                    borderBottomColor: isDark ? 'rgba(245,237,216,0.07)' : 'rgba(41,43,40,0.07)',
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{row.icon}</Text>
                  <Text style={{ flex: 1, fontFamily: 'Inter_400Regular', fontSize: 16, color: textPrimary }}>
                    {row.label}
                  </Text>
                  {row.isToggle ? (
                    <Switch
                      value={row.toggled}
                      onValueChange={row.onToggle}
                      trackColor={{ false: '#CFCFCA', true: '#F2B84B' }}
                      thumbColor="#FFFFFF"
                    />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {row.value && <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: textSecondary }}>{row.value}</Text>}
                      <Text style={{ color: textSecondary }}>›</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </Animated.View>
        ))}

        {/* Version */}
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: textSecondary, textAlign: 'center', marginTop: 8 }}>
          DailyPrayer v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
