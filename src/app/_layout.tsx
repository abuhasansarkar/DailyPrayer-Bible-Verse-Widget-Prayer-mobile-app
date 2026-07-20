import { useEffect, useState, useCallback } from 'react';
import { View, useColorScheme, StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Lora_400Regular,
  Lora_400Regular_Italic,
  Lora_500Medium,
  Lora_600SemiBold,
} from '@expo-google-fonts/lora';

import { initDb } from '@/db/client';
import { seedDatabase } from '@/db/seed';
import { initI18n } from '@/i18n';
import { initRevenueCat } from '@/services/revenuecat';
import { requestNotificationPermission, syncRemindersFromDb } from '@/services/notifications';
import { useAppStore } from '@/store/app.store';

import '@/global.css';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,   // 5 minutes
      gcTime: 30 * 60 * 1000,      // 30 minutes
    },
  },
});

// Initialize i18n immediately (synchronous)
initI18n();

export default function RootLayout() {
  const systemColorScheme = useColorScheme();
  const { colorScheme, setDbReady, setOnboardingComplete } = useAppStore();
  const [appIsReady, setAppIsReady] = useState(false);

  // Load fonts from standard font packages
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Lora_400Regular,
    Lora_400Regular_Italic,
    Lora_500Medium,
    Lora_600SemiBold,
  });

  useEffect(() => {
    async function prepare() {
      try {
        // 1. Init database + run migrations
        await initDb();
        setDbReady(true);

        // 2. Seed with initial content
        await seedDatabase();

        // 3. Load user preferences from DB
        const db = (await import('@/db/client')).getDb();
        const prefs = await db.getFirstAsync<{
          onboarding_complete: number;
          app_theme: string;
          preferred_translation: string;
          goals: string;
        }>('SELECT * FROM user_preferences WHERE id = 1');

        if (prefs) {
          setOnboardingComplete(prefs.onboarding_complete === 1);
        }

        // 4. Init RevenueCat (non-blocking)
        initRevenueCat().catch(console.warn);

        // 5. Request notification permission + sync reminders
        const hasPermission = await requestNotificationPermission();
        if (hasPermission && prefs?.onboarding_complete) {
          syncRemindersFromDb().catch(console.warn);
        }
      } catch (e) {
        console.error('[RootLayout] Initialization error:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  // Determine resolved theme
  const resolvedScheme =
    colorScheme === 'system' ? (systemColorScheme ?? 'light') : colorScheme;
  const isDark = resolvedScheme === 'dark';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <View
            className={isDark ? 'flex-1 bg-bg-dark' : 'flex-1 bg-cream'}
            onLayout={onLayoutRootView}
          >
            <StatusBar
              barStyle={isDark ? 'light-content' : 'dark-content'}
              backgroundColor={isDark ? '#1E1C18' : '#FFF9EE'}
            />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="explore" />
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="verse/[id]" />
              <Stack.Screen name="prayer/[id]" />
              <Stack.Screen name="journal/new" />
              <Stack.Screen name="journal/[id]" />
              <Stack.Screen name="bible/[book]/[chapter]" />
              <Stack.Screen name="topic/[id]" />
              <Stack.Screen name="collection/[id]" />
              <Stack.Screen
                name="widget/[id]/customize"
                options={{ presentation: 'modal' }}
              />
              <Stack.Screen
                name="premium/index"
                options={{ presentation: 'modal' }}
              />
              <Stack.Screen name="settings/index" />
            </Stack>
          </View>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
