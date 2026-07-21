import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Download, Shield, Bell, Moon, BookOpen, User, LogIn, Globe, Crown, ChevronRight } from '@/components/ui/LucideIcons';
import { ExportImportService } from '@/services/export-import';
import { useUserStore } from '@/store/user.store';
import { useAppStore } from '@/store/app.store';
import { useSubscriptionStore } from '@/store/subscription.store';

export default function SettingsScreen() {
  const systemScheme = useColorScheme();
  const { colorScheme, setColorScheme, preferences, updatePreferences, setTranslation } = useAppStore();
  const { displayName, streak } = useUserStore();
  const { tier } = useSubscriptionStore();

  const isDark = (colorScheme === 'system' ? systemScheme : colorScheme) === 'dark';
  const bg = isDark ? '#1E1C18' : '#FFF9EE';
  const cardBg = isDark ? '#2A2720' : '#F5EDD8';
  const textColor = isDark ? '#F5EDD8' : '#292B28';
  const subTextColor = isDark ? '#B8AD97' : '#77766F';

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
      <View className="flex-row items-center px-6 py-4 border-b border-[#E8DFC9]">
        <TouchableOpacity onPress={() => router.back()} className="p-2 rounded-full bg-[#F5EDD8] mr-3">
          <ArrowLeft size={20} color="#292B28" />
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-bold text-[#292B28]">Settings</Text>
          <Text className="text-xs text-[#77766F]">Preferences & Account</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* User Card */}
        <View className="bg-[#FEF3D1] rounded-2xl p-4 mb-6 border border-[#F2B84B]/30 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-[#F2B84B] items-center justify-center mr-3">
              <User size={20} color="#292B28" />
            </View>
            <View>
              <Text className="font-bold text-[#292B28]">{displayName || 'Guest User'}</Text>
              <Text className="text-xs text-[#77766F]">🔥 {streak?.currentStreak ?? 1} Day Streak • {tier === 'free' ? 'Free Member' : 'Pro Supporter'}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            className="bg-[#F2B84B] rounded-xl py-2 px-3 flex-row items-center"
          >
            <LogIn size={14} color="#292B28" className="mr-1" />
            <Text className="text-xs font-bold text-[#292B28]">Account</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Practice */}
        <Text className="text-xs font-bold text-[#77766F] uppercase tracking-wider mb-2 ml-1">Daily Practice</Text>
        <View className="bg-[#F5EDD8] rounded-2xl p-4 mb-6 border border-[#E8DFC9]">
          <TouchableOpacity onPress={handleCycleTranslation} className="flex-row items-center justify-between py-3 border-b border-[#E8DFC9]">
            <View className="flex-row items-center">
              <BookOpen size={18} color="#292B28" className="mr-3" />
              <Text className="font-semibold text-[#292B28]">Bible Translation</Text>
            </View>
            <Text className="text-xs font-bold text-[#F2B84B]">{preferences.preferredTranslation}</Text>
          </TouchableOpacity>

          <View className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center">
              <Bell size={18} color="#292B28" className="mr-3" />
              <Text className="font-semibold text-[#292B28]">Daily Reminder</Text>
            </View>
            <Switch
              value={preferences.notificationsEnabled}
              onValueChange={(val) => updatePreferences({ notificationsEnabled: val })}
              trackColor={{ false: '#E8DFC9', true: '#F2B84B' }}
              thumbColor="#292B28"
            />
          </View>
        </View>

        {/* App Appearance */}
        <Text className="text-xs font-bold text-[#77766F] uppercase tracking-wider mb-2 ml-1">Appearance</Text>
        <View className="bg-[#F5EDD8] rounded-2xl p-4 mb-6 border border-[#E8DFC9]">
          <View className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center">
              <Moon size={18} color="#292B28" className="mr-3" />
              <Text className="font-semibold text-[#292B28]">Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={handleToggleTheme}
              trackColor={{ false: '#E8DFC9', true: '#F2B84B' }}
              thumbColor="#292B28"
            />
          </View>
        </View>

        {/* Data & Backup */}
        <Text className="text-xs font-bold text-[#77766F] uppercase tracking-wider mb-2 ml-1">Data & Backup</Text>
        <View className="bg-[#F5EDD8] rounded-2xl p-4 border border-[#E8DFC9]">
          <TouchableOpacity onPress={handleExportData} className="flex-row items-center justify-between py-2">
            <View className="flex-row items-center">
              <Download size={18} color="#292B28" className="mr-3" />
              <View>
                <Text className="font-semibold text-[#292B28]">Export Backup</Text>
                <Text className="text-xs text-[#77766F]">Save your prayers, journal & streak data</Text>
              </View>
            </View>
            <Shield size={16} color="#77766F" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
