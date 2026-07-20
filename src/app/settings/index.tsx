import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch, useColorScheme, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppStore } from '@/store/app.store';
import { useUserStore } from '@/store/user.store';
import { useSubscriptionStore } from '@/store/subscription.store';
import { AppIcon, AppIconName } from '@/components/ui/AppIcon';
import {
  getOpenCodeZenApiKey,
  getOpenCodeZenModel,
  OPENCODE_ZEN_FREE_MODELS,
  setOpenCodeZenApiKey,
  setOpenCodeZenModel,
  OpenCodeZenModelId,
} from '@/services/opencode-zen';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const systemScheme = useColorScheme();
  const { colorScheme, setColorScheme, preferences, updatePreferences, setTranslation } = useAppStore();
  const { displayName, streak } = useUserStore();
  const { tier } = useSubscriptionStore();
  const isDark = (colorScheme === 'system' ? systemScheme : colorScheme) === 'dark';
  const [zenConfigured, setZenConfigured] = useState(false);
  const [zenModel, setZenModel] = useState<OpenCodeZenModelId>('deepseek-v4-flash-free');

  const bg = isDark ? '#1E1C18' : '#FFF9EE';
  const surfaceBg = isDark ? '#2A2720' : '#F1E6D3';
  const cardBg = isDark ? '#332F26' : '#FFFFFF';
  const textPrimary = isDark ? '#F5EDD8' : '#292B28';
  const textSecondary = isDark ? '#B8AD97' : '#77766F';
  const divider = isDark ? 'rgba(245,237,216,0.07)' : 'rgba(41,43,40,0.07)';

  useEffect(() => {
    async function loadZenSettings() {
      const [apiKey, model] = await Promise.all([getOpenCodeZenApiKey(), getOpenCodeZenModel()]);
      setZenConfigured(Boolean(apiKey));
      setZenModel(model);
    }
    loadZenSettings().catch(console.warn);
  }, []);

  const handleToggleTheme = async (v: boolean) => {
    const newScheme = v ? 'dark' : 'light';
    setColorScheme(newScheme);
    try {
      const { getDb } = await import('@/db/client');
      await getDb().runAsync('UPDATE user_preferences SET app_theme = ? WHERE id = 1', [newScheme]);
    } catch (e) {
      console.warn('Error saving theme pref:', e);
    }
  };

  const handleCycleLanguage = async () => {
    const newLang = preferences.language === 'en' ? 'fr' : 'en';
    updatePreferences({ language: newLang });
    i18n.changeLanguage(newLang);
    try {
      const { getDb } = await import('@/db/client');
      await getDb().runAsync('UPDATE user_preferences SET language = ? WHERE id = 1', [newLang]);
    } catch (e) {
      console.warn('Error saving language pref:', e);
    }
  };

  const handleCycleTranslation = async () => {
    const translations = ['NIV', 'ESV', 'KJV', 'NLT', 'CSB'] as const;
    const currentIdx = translations.indexOf(preferences.preferredTranslation as any);
    const nextTranslation = translations[(currentIdx + 1) % translations.length]!;
    setTranslation(nextTranslation);
    try {
      const { getDb } = await import('@/db/client');
      await getDb().runAsync('UPDATE user_preferences SET preferred_translation = ? WHERE id = 1', [nextTranslation]);
    } catch (e) {
      console.warn('Error saving translation pref:', e);
    }
  };

  const handleToggleNotifications = async () => {
    const nextVal = !preferences.notificationsEnabled;
    updatePreferences({ notificationsEnabled: nextVal });
    try {
      const { getDb } = await import('@/db/client');
      await getDb().runAsync('UPDATE user_preferences SET notifications_enabled = ? WHERE id = 1', [nextVal ? 1 : 0]);
    } catch (e) {
      console.warn('Error saving notification pref:', e);
    }
  };

  const handleEditProfile = () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Profile name', 'Profile editing from Settings is currently available on iOS.');
      return;
    }
    Alert.prompt(
      'Edit Profile Name',
      'How should DailyPrayer address you?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (name?: string) => {
            if (name?.trim()) {
              useUserStore.getState().setProfile(name.trim());
              try {
                const { getDb } = await import('@/db/client');
                await getDb().runAsync('UPDATE user_preferences SET display_name = ? WHERE id = 1', [name.trim()]);
              } catch (e) {
                console.warn('Error saving display name:', e);
              }
            }
          },
        },
      ],
      'plain-text',
      displayName || ''
    );
  };

  const handleSetZenKey = () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('OpenCode Zen', 'Secure API key entry is ready for iOS. Add an Android secure input screen before shipping this flow on Android.');
      return;
    }
    Alert.prompt(
      'OpenCode Zen API Key',
      'Paste your OpenCode Zen key. It is stored in SecureStore on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (key?: string) => {
            await setOpenCodeZenApiKey(key ?? '');
            setZenConfigured(Boolean(key?.trim()));
          },
        },
      ],
      'secure-text'
    );
  };

  const handleCycleZenModel = async () => {
    const currentIdx = OPENCODE_ZEN_FREE_MODELS.findIndex((model) => model.id === zenModel);
    const next = OPENCODE_ZEN_FREE_MODELS[(currentIdx + 1) % OPENCODE_ZEN_FREE_MODELS.length]!;
    await setOpenCodeZenModel(next.id);
    setZenModel(next.id);
  };

  type RowData = {
    label: string;
    icon: AppIconName;
    value?: string;
    onPress?: () => void;
    isToggle?: boolean;
    toggled?: boolean;
    onToggle?: (v: boolean) => void;
    accent?: string;
  };

  const sections: { title: string; rows: RowData[] }[] = [
    {
      title: 'Daily Practice',
      rows: [
        { label: t('settings.notifications'), icon: 'bell', isToggle: true, toggled: preferences.notificationsEnabled, onToggle: handleToggleNotifications, accent: '#F2B84B' },
        { label: t('settings.translation'), icon: 'book', value: preferences.preferredTranslation, onPress: handleCycleTranslation, accent: '#D98262' },
        { label: 'Widgets', icon: 'widget', value: 'Setup', onPress: () => router.push('/(tabs)/widgets'), accent: '#96AA88' },
      ],
    },
    {
      title: 'App',
      rows: [
        { label: 'Dark Mode', icon: 'moon', isToggle: true, toggled: colorScheme === 'dark', onToggle: handleToggleTheme, accent: '#7BB8D4' },
        { label: t('settings.language'), icon: 'globe', value: preferences.language === 'en' ? 'English' : 'Francais', onPress: handleCycleLanguage, accent: '#96AA88' },
        { label: t('settings.accessibility'), icon: 'shield', value: preferences.fontSize, onPress: () => Alert.alert('Accessibility', `Reduced Motion: ${preferences.reducedMotion ? 'On' : 'Off'}\nHigh Contrast: ${preferences.highContrast ? 'On' : 'Off'}\nFont Size: ${preferences.fontSize}`), accent: '#B8A8CC' },
      ],
    },
    {
      title: 'OpenCode Zen',
      rows: [
        { label: 'API Key', icon: 'lock', value: zenConfigured ? 'Connected' : 'Not set', onPress: handleSetZenKey, accent: '#292B28' },
        { label: 'Free Model', icon: 'ai', value: OPENCODE_ZEN_FREE_MODELS.find((model) => model.id === zenModel)?.name, onPress: handleCycleZenModel, accent: '#D98262' },
      ],
    },
    {
      title: 'Account',
      rows: [
        { label: t('settings.subscription'), icon: 'sparkle', value: tier === 'free' ? 'Free' : 'Premium', onPress: () => router.push('/premium'), accent: '#F2B84B' },
        { label: t('settings.privacy'), icon: 'shield', onPress: () => Linking.openURL('https://dailyprayer.app/privacy').catch(() => {}), accent: '#96AA88' },
        { label: t('settings.help'), icon: 'help', onPress: () => Linking.openURL('mailto:support@dailyprayer.app?subject=DailyPrayer%20Support').catch(() => {}), accent: '#7BB8D4' },
        { label: t('settings.about'), icon: 'info', onPress: () => Alert.alert('DailyPrayer v1.0.0', 'A quiet moment with God, every day.\nBuilt with care for your daily spiritual journey.'), accent: '#D98262' },
      ],
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16 }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 15, backgroundColor: surfaceBg, alignItems: 'center', justifyContent: 'center' }}>
          <AppIcon name="arrowLeft" size={20} color={textPrimary} />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: textPrimary }}>{t('settings.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(350)} style={{ backgroundColor: '#F2B84B', borderRadius: 22, padding: 20, marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View style={{ width: 58, height: 58, borderRadius: 20, backgroundColor: 'rgba(41,43,40,0.14)', alignItems: 'center', justifyContent: 'center' }}>
            <AppIcon name="home" size={28} color="#292B28" strokeWidth={2.3} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: '#292B28' }}>{displayName || 'My DailyPrayer'}</Text>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: 'rgba(41,43,40,0.72)', marginTop: 3 }}>
              {streak.currentStreak} day streak • {tier === 'premium' ? 'Premium' : 'Free'}
            </Text>
          </View>
          <Pressable onPress={handleEditProfile} style={{ backgroundColor: 'rgba(41,43,40,0.12)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#292B28' }}>{t('common.edit')}</Text>
          </Pressable>
        </Animated.View>

        {sections.map((section, sectionIndex) => (
          <Animated.View key={section.title} entering={FadeInDown.duration(350).delay(sectionIndex * 70 + 80)} style={{ marginBottom: 22 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, paddingLeft: 2 }}>
              {section.title}
            </Text>
            <View style={{ backgroundColor: cardBg, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: divider }}>
              {section.rows.map((row, rowIndex) => (
                <Pressable
                  key={row.label}
                  onPress={row.isToggle ? undefined : row.onPress}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 15,
                    borderBottomWidth: rowIndex < section.rows.length - 1 ? 1 : 0,
                    borderBottomColor: divider,
                  }}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 13, backgroundColor: `${row.accent ?? '#F2B84B'}22`, alignItems: 'center', justifyContent: 'center' }}>
                    <AppIcon name={row.icon} size={19} color={row.accent ?? '#F2B84B'} />
                  </View>
                  <Text style={{ flex: 1, fontFamily: 'Inter_500Medium', fontSize: 15, color: textPrimary }}>{row.label}</Text>
                  {row.isToggle ? (
                    <Switch value={row.toggled} onValueChange={row.onToggle} trackColor={{ false: '#CFCFCA', true: '#F2B84B' }} thumbColor="#FFFFFF" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: 176 }}>
                      {row.value && <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: textSecondary }} numberOfLines={1}>{row.value}</Text>}
                      <AppIcon name="chevronRight" size={17} color={textSecondary} />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </Animated.View>
        ))}

        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: textSecondary, textAlign: 'center', marginTop: 8 }}>
          DailyPrayer v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}