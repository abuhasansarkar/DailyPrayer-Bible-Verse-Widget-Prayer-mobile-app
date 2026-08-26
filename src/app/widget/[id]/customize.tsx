import { useState } from 'react';
import { View, Text, ScrollView, Pressable, useColorScheme, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppStore } from '@/store/app.store';
import { WIDGET_THEMES, WidgetTheme, WidgetContentType, WidgetSize } from '@/types/widget';
import { getDb, generateId, nowIso } from '@/db/client';

export default function WidgetCustomizeScreen() {
  const { id: sizeParam } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const systemScheme = useColorScheme();
  const { colorScheme } = useAppStore();
  const isDark = (colorScheme === 'system' ? systemScheme : colorScheme) === 'dark';

  const widgetSize = (sizeParam ?? 'medium') as WidgetSize;

  const [selectedTheme, setSelectedTheme] = useState<WidgetTheme>(WIDGET_THEMES[0]!);
  const [contentType, setContentType] = useState<WidgetContentType>('daily-verse');
  const [showReference, setShowReference] = useState(true);
  const [showDate, setShowDate] = useState(true);
  const [saving, setSaving] = useState(false);

  const bg = isDark ? '#1E1C18' : '#FFF9EE';
  const surfaceBg = isDark ? '#2A2720' : '#F1E6D3';
  const cardBg = isDark ? '#332F26' : '#FFFFFF';
  const textPrimary = isDark ? '#F5EDD8' : '#292B28';
  const textSecondary = isDark ? '#B8AD97' : '#77766F';

  async function handleSave() {
    setSaving(true);
    try {
      const db = getDb();
      await db.runAsync(
        `INSERT INTO widget_configs (id, size, content_type, theme_id, show_reference, show_date, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [generateId(), widgetSize, contentType, selectedTheme.id, showReference ? 1 : 0, showDate ? 1 : 0, nowIso()]
      );
      router.back();
    } catch (e) {
      console.warn(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 }}>
        <Pressable onPress={router.back}>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: textSecondary }}>Cancel</Text>
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: textPrimary }}>Customize Widget</Text>
        <Pressable onPress={handleSave} disabled={saving}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#F2B84B' }}>
            {saving ? 'Saving...' : t('common.save')}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Live Widget Preview */}
        <Animated.View entering={FadeInDown.duration(400)} style={{ alignItems: 'center', marginVertical: 20 }}>
          <View
            style={{
              width: widgetSize === 'small' ? 160 : '100%',
              height: widgetSize === 'small' ? 160 : widgetSize === 'large' ? 240 : 130,
              backgroundColor: selectedTheme.bgColor,
              borderRadius: 24, padding: 20, justifyContent: 'space-between',
              shadowColor: '#292B28', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 6,
              borderWidth: 1, borderColor: selectedTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            }}
          >
            {showDate && (
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 10, color: selectedTheme.referenceColor, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </Text>
            )}

            <Text
              style={{
                fontFamily: 'Lora_400Regular_Italic',
                fontSize: widgetSize === 'large' ? 18 : 14,
                lineHeight: widgetSize === 'large' ? 28 : 22,
                color: selectedTheme.textColor,
              }}
              numberOfLines={widgetSize === 'small' ? 3 : widgetSize === 'large' ? 6 : 3}
            >
              &quot;{contentType === 'daily-prayer' ? 'Lord, give me strength today to walk in your peace and grace.' : 'For I know the plans I have for you, declares the Lord...'}&quot;
            </Text>

            {showReference && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: selectedTheme.accentColor }}>
                  {contentType === 'daily-prayer' ? 'Morning Prayer' : 'Jeremiah 29:11'}
                </Text>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9, color: selectedTheme.textColor, opacity: 0.4 }}>
                  DAILYPRAYER
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Content Type Selector */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
            Content
          </Text>
          <View style={{ flexDirection: 'row', backgroundColor: surfaceBg, borderRadius: 14, padding: 4, gap: 4 }}>
            {[
              { id: 'daily-verse', label: 'Verse' },
              { id: 'daily-prayer', label: 'Prayer' },
              { id: 'streak', label: 'Streak' },
            ].map((type) => (
              <Pressable
                key={type.id}
                onPress={() => setContentType(type.id as WidgetContentType)}
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center',
                  backgroundColor: contentType === type.id ? cardBg : 'transparent',
                }}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: contentType === type.id ? textPrimary : textSecondary }}>
                  {type.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Theme Picker */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
            Theme ({WIDGET_THEMES.length})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {WIDGET_THEMES.map((theme) => {
              const isSelected = selectedTheme.id === theme.id;
              return (
                <Pressable
                  key={theme.id}
                  onPress={() => {
                    if (theme.isPremium) {
                      router.push('/premium');
                    } else {
                      setSelectedTheme(theme);
                    }
                  }}
                  style={{
                    width: 72, height: 72, borderRadius: 18,
                    backgroundColor: theme.bgColor,
                    borderWidth: 3, borderColor: isSelected ? '#F2B84B' : 'transparent',
                    alignItems: 'center', justifyContent: 'center', padding: 6,
                    shadowColor: '#292B28', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
                  }}
                >
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, color: theme.textColor, textAlign: 'center' }}>
                    {theme.name}
                  </Text>
                  {theme.isPremium && (
                    <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: '#F2B84B', borderRadius: 4, paddingHorizontal: 3, paddingVertical: 1 }}>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 7, color: '#292B28' }}>PRO</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Toggles */}
        <View style={{ backgroundColor: cardBg, borderRadius: 20, paddingHorizontal: 18, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(245,237,216,0.07)' : 'rgba(41,43,40,0.07)' }}>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: textPrimary }}>Show Scripture Reference</Text>
            <Switch value={showReference} onValueChange={setShowReference} trackColor={{ false: '#CFCFCA', true: '#F2B84B' }} thumbColor="#FFFFFF" />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 }}>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: textPrimary }}>Show Today&apos;s Date</Text>
            <Switch value={showDate} onValueChange={setShowDate} trackColor={{ false: '#CFCFCA', true: '#F2B84B' }} thumbColor="#FFFFFF" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
