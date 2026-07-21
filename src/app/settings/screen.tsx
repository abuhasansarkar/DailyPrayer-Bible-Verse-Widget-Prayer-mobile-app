import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Download, Shield, Bell, Moon, BookOpen, User, LogIn } from '@/components/ui/LucideIcons';
import { ExportImportService } from '@/services/export-import';
import { useUserStore } from '@/store/user.store';
import { useAppStore } from '@/store/app.store';
import { useSubscriptionStore } from '@/store/subscription.store';
import { useResolvedTheme } from '@/hooks/use-theme';

export default function SettingsScreen() {
  const { isDark } = useResolvedTheme();
  const { colorScheme, setColorScheme, preferences, updatePreferences, setTranslation } = useAppStore();
  const { displayName, streak } = useUserStore();
  const { tier } = useSubscriptionStore();

  const bg = isDark ? '#1E1C18' : '#FFF9EE';
  const cardBg = isDark ? '#2A2720' : '#F5EDD8';
  const userCardBg = isDark ? '#332A18' : '#FEF3D1';
  const textColor = isDark ? '#F5EDD8' : '#292B28';
  const subTextColor = isDark ? '#B8AD97' : '#77766F';
  const borderColor = isDark ? 'rgba(245,237,216,0.12)' : '#E8DFC9';
  const iconColor = isDark ? '#F5EDD8' : '#292B28';

  const handleExportData = async () => {
    const success = await ExportImportService.exportUserData();
    if (!success) {
      Alert.alert('Export Failed', 'Unable to create backup JSON file.');
    }
  };

  const handleToggleTheme = async (v: boolean) => {
    const newScheme = v ? 'dark' : 'light';
    setColorScheme(newScheme);
  };

  const handleCycleTranslation = () => {
    const translations = ['NIV', 'ESV', 'KJV', 'NLT', 'CSB'];
    const idx = translations.indexOf(preferences.preferredTranslation);
    const next = translations[(idx + 1) % translations.length]!;
    setTranslation(next);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: borderColor }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, borderRadius: 9999, backgroundColor: cardBg, marginRight: 12 }}>
          <ArrowLeft size={20} color={iconColor} />
        </TouchableOpacity>
        <View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: textColor }}>Settings</Text>
          <Text style={{ fontSize: 12, color: subTextColor }}>Preferences & Account</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* User Card */}
        <View style={{ backgroundColor: userCardBg, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: isDark ? 'rgba(242,184,75,0.25)' : 'rgba(242,184,75,0.3)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F2B84B', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <User size={20} color="#292B28" />
            </View>
            <View>
              <Text style={{ fontWeight: '700', color: textColor }}>{displayName || 'Guest User'}</Text>
              <Text style={{ fontSize: 12, color: subTextColor }}>🔥 {streak?.currentStreak ?? 1} Day Streak • {tier === 'free' ? 'Free Member' : 'Pro Supporter'}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            style={{ backgroundColor: '#F2B84B', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' }}
          >
            <LogIn size={14} color="#292B28" style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#292B28' }}>Account</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Practice */}
        <Text style={{ fontSize: 12, fontWeight: '700', color: subTextColor, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 }}>Daily Practice</Text>
        <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor }}>
          <TouchableOpacity onPress={handleCycleTranslation} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: borderColor }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <BookOpen size={18} color={iconColor} style={{ marginRight: 12 }} />
              <Text style={{ fontWeight: '600', color: textColor }}>Bible Translation</Text>
            </View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#F2B84B' }}>{preferences.preferredTranslation}</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Bell size={18} color={iconColor} style={{ marginRight: 12 }} />
              <Text style={{ fontWeight: '600', color: textColor }}>Daily Reminder</Text>
            </View>
            <Switch
              value={preferences.notificationsEnabled}
              onValueChange={(val) => updatePreferences({ notificationsEnabled: val })}
              trackColor={{ false: isDark ? '#332E25' : '#E8DFC9', true: '#F2B84B' }}
              thumbColor={isDark ? '#F5EDD8' : '#292B28'}
            />
          </View>
        </View>

        {/* App Appearance */}
        <Text style={{ fontSize: 12, fontWeight: '700', color: subTextColor, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 }}>Appearance</Text>
        <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Moon size={18} color={iconColor} style={{ marginRight: 12 }} />
              <Text style={{ fontWeight: '600', color: textColor }}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={handleToggleTheme}
              trackColor={{ false: isDark ? '#332E25' : '#E8DFC9', true: '#F2B84B' }}
              thumbColor={isDark ? '#F5EDD8' : '#292B28'}
            />
          </View>
        </View>

        {/* Data & Backup */}
        <Text style={{ fontSize: 12, fontWeight: '700', color: subTextColor, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 }}>Data & Backup</Text>
        <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor }}>
          <TouchableOpacity onPress={handleExportData} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Download size={18} color={iconColor} style={{ marginRight: 12 }} />
              <View>
                <Text style={{ fontWeight: '600', color: textColor }}>Export Backup</Text>
                <Text style={{ fontSize: 12, color: subTextColor }}>Save your prayers, journal & streak data</Text>
              </View>
            </View>
            <Shield size={16} color={subTextColor} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
