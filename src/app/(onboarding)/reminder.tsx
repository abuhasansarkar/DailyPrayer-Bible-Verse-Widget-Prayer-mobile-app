import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Switch, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { requestNotificationPermission, scheduleReminder } from '@/services/notifications';
import { getDb, generateId } from '@/db/client';

const REMINDER_PRESETS = [
  { id: 'morning', label: 'Morning Devotion', icon: '🌅', time: '07:00', type: 'morning' as const },
  { id: 'midday', label: 'Midday Pause', icon: '☀️', time: '12:00', type: 'midday' as const },
  { id: 'evening', label: 'Evening Reflection', icon: '🌙', time: '20:00', type: 'evening' as const },
];

export default function ReminderScreen() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Set<string>>(new Set(['morning']));
  const [saving, setSaving] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleContinue() {
    setSaving(true);
    try {
      if (selected.size > 0) {
        const hasPermission = await requestNotificationPermission();
        if (hasPermission) {
          const db = getDb();
          for (const id of selected) {
            const preset = REMINDER_PRESETS.find((r) => r.id === id)!;
            const reminderId = generateId();
            const days = [0, 1, 2, 3, 4, 5, 6];
            await db.runAsync(
              'INSERT OR REPLACE INTO reminders (id, title, time, days_of_week, type, is_active) VALUES (?, ?, ?, ?, ?, 1)',
              [reminderId, preset.label, preset.time, JSON.stringify(days), preset.type]
            );
            await scheduleReminder({
              id: reminderId,
              title: preset.label,
              time: preset.time,
              daysOfWeek: days,
              type: preset.type,
              isActive: true,
              soundEnabled: true,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    } catch (e) {
      console.warn('Reminder setup error:', e);
    } finally {
      setSaving(false);
      router.push('/(onboarding)/theme-select');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-bg-dark">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
        <Pressable onPress={router.back} className="mb-6 self-start">
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: '#77766F' }}>← Back</Text>
        </Pressable>

        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 30, lineHeight: 38, letterSpacing: -0.5, color: '#292B28', marginBottom: 8 }}>
          {t('onboarding.reminder.title')}
        </Text>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 24, color: '#77766F', marginBottom: 32 }}>
          {t('onboarding.reminder.subtitle')}
        </Text>

        <View style={{ gap: 12 }}>
          {REMINDER_PRESETS.map((preset) => {
            const isOn = selected.has(preset.id);
            return (
              <Pressable
                key={preset.id}
                onPress={() => toggle(preset.id)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 16,
                  padding: 20, borderRadius: 20,
                  backgroundColor: isOn ? '#F2B84B18' : '#F1E6D3',
                  borderWidth: 2, borderColor: isOn ? '#F2B84B' : 'transparent',
                }}
              >
                <View style={{
                  width: 52, height: 52, borderRadius: 16,
                  backgroundColor: isOn ? '#F2B84B' : '#E5D3B9',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 26 }}>{preset.icon}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#292B28' }}>
                    {preset.label}
                  </Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#77766F', marginTop: 2 }}>
                    Daily at {preset.time}
                  </Text>
                </View>

                <Switch
                  value={isOn}
                  onValueChange={() => toggle(preset.id)}
                  trackColor={{ false: '#CFCFCA', true: '#F2B84B' }}
                  thumbColor={Platform.OS === 'android' ? (isOn ? '#292B28' : '#FFFFFF') : '#FFFFFF'}
                />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16,
        backgroundColor: '#FFF9EE', borderTopWidth: 1, borderTopColor: 'rgba(41,43,40,0.07)',
        gap: 8,
      }}>
        <Pressable
          onPress={handleContinue}
          disabled={saving}
          style={{ height: 56, borderRadius: 20, backgroundColor: '#F2B84B', alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 17, color: '#292B28' }}>
            {saving ? 'Setting up...' : t('common.continue')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/(onboarding)/theme-select')}
          style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: '#77766F' }}>
            {t('onboarding.reminder.skip')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
