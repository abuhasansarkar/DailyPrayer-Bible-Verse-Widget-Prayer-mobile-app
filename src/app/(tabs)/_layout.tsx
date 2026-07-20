import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, Pressable, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/app.store';

// Inline type replacing the un-installed @react-navigation/bottom-tabs dep
type TabBarProps = { state: any; descriptors: any; navigation: any };

// ── Tab icon components ───────────────────────────────────────────────────────
function TodayIcon({ focused }: { focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: focused ? 22 : 20 }}>☀️</Text>
    </View>
  );
}
function ExploreIcon({ focused }: { focused: boolean }) {
  return <Text style={{ fontSize: focused ? 22 : 20 }}>🔍</Text>;
}
function PrayIcon({ focused }: { focused: boolean }) {
  return <Text style={{ fontSize: focused ? 22 : 20 }}>🙏</Text>;
}
function WidgetsIcon({ focused }: { focused: boolean }) {
  return <Text style={{ fontSize: focused ? 22 : 20 }}>⬛</Text>;
}
function LibraryIcon({ focused }: { focused: boolean }) {
  return <Text style={{ fontSize: focused ? 22 : 20 }}>📚</Text>;
}

// ── Custom Tab Bar ────────────────────────────────────────────────────────────
function DailyPrayerTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const systemScheme = useColorScheme();
  const { colorScheme } = useAppStore();
  const isDark = (colorScheme === 'system' ? systemScheme : colorScheme) === 'dark';

  const LABELS = [
    t('tabs.today'),
    t('tabs.explore'),
    t('tabs.pray'),
    t('tabs.widgets'),
    t('tabs.library'),
  ];

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: isDark ? '#2A2720' : '#FFFFFF',
        paddingBottom: Math.max(insets.bottom, 8),
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: isDark ? 'rgba(245,237,216,0.07)' : 'rgba(41,43,40,0.07)',
        shadowColor: '#292B28',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      {state.routes.map((route: { key: string; name: string }, index: number) => {
        const focused = state.index === index;
        const label = LABELS[index] ?? route.name;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const icons = [TodayIcon, ExploreIcon, PrayIcon, WidgetsIcon, LibraryIcon];
        const IconComp = icons[index]!;

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={{ flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4, minHeight: 44 }}
          >
            <IconComp focused={focused} />
            <Text
              style={{
                fontFamily: focused ? 'Inter_600SemiBold' : 'Inter_400Regular',
                fontSize: 10,
                letterSpacing: 0.1,
                color: focused
                  ? '#F2B84B'
                  : isDark ? '#7A7264' : '#77766F',
              }}
              numberOfLines={1}
            >
              {label}
            </Text>
            {focused && (
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#F2B84B', marginTop: 1 }} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Tabs Layout ───────────────────────────────────────────────────────────────
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <DailyPrayerTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="pray" />
      <Tabs.Screen name="widgets" />
      <Tabs.Screen name="library" />
    </Tabs>
  );
}
