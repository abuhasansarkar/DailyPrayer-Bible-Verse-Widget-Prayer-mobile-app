import { useEffect, useState, useRef } from 'react';
import { View, useColorScheme, StatusBar } from 'react-native';
import { Stack, router } from 'expo-router';
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
import { ensureAuth, runFullSync } from '@/services/supabase';
import { useAppStore } from '@/store/app.store';
import { useUserStore } from '@/store/user.store';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

import '@/global.css';

import { useColorScheme as useNwColorScheme } from 'nativewind';

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
  const { setColorScheme: setNwColorScheme } = useNwColorScheme();
  const [appIsReady, setAppIsReady] = useState(false);
  const notifListenerRef = useRef<any>(null);

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
          language: string;
          display_name: string;
        }>('SELECT * FROM user_preferences WHERE id = 1');

        if (prefs) {
          setOnboardingComplete(prefs.onboarding_complete === 1);
          if (prefs.app_theme) {
            useAppStore.getState().setColorScheme(prefs.app_theme as any);
          }
          if (prefs.language) {
            useAppStore.getState().updatePreferences({ language: prefs.language });
            const i18n = (await import('@/i18n')).default;
            await i18n.changeLanguage(prefs.language);
          }
          if (prefs.preferred_translation) {
            useAppStore.getState().updatePreferences({ preferredTranslation: prefs.preferred_translation as any });
          }
          if (prefs.display_name) {
            useUserStore.getState().setProfile(prefs.display_name);
          }
        }

        // 4. Load streak and favorites from DB
        await useUserStore.getState().loadUserDataFromDb();

        // 5. Init RevenueCat (non-blocking)
        initRevenueCat().catch(console.warn);

        // 6. Request notification permission + sync reminders
        const hasPermission = await requestNotificationPermission();
        if (hasPermission && prefs?.onboarding_complete) {
          syncRemindersFromDb().catch(console.warn);
        }

        // 7. Supabase anonymous auth + background sync (non-blocking)
        ensureAuth().catch(console.warn);
        if (prefs?.onboarding_complete) {
          runFullSync().catch(console.warn);
        }

        // 8. Register Background Tasks & Sync Initial OS Widget Payload
        try {
          const { registerDailyVerseBackgroundTask } = await import('@/services/background-tasks');
          const { WidgetBridgeService } = await import('@/services/widget-bridge');
          const { getDailyVerse } = await import('@/services/daily-verse-rotation');

          registerDailyVerseBackgroundTask().catch(console.warn);

          const todayStr = new Date().toISOString().split('T')[0];
          const todayVerse = await getDailyVerse(todayStr);
          if (todayVerse) {
            WidgetBridgeService.updateWidgetData({
              verseText: todayVerse.text,
              verseReference: `${todayVerse.book} ${todayVerse.chapter}:${todayVerse.verse}`,
              translation: todayVerse.translation || 'KJV',
              dateString: todayStr,
            }).catch(console.warn);
          }
        } catch (err) {
          console.warn('[RootLayout] Widget/BackgroundTask init warning:', err);
        }

        // 8. Set up notification tap deep-link handler
        try {
          const Constants = (await import('expo-constants')).default;
          const { ExecutionEnvironment } = await import('expo-constants');
          const isExpoGo =
            Constants.appOwnership === 'expo' ||
            Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

          if (!isExpoGo) {
            const Notifications = require('expo-notifications');
            if (Notifications && typeof Notifications.addNotificationResponseReceivedListener === 'function') {
              notifListenerRef.current = Notifications.addNotificationResponseReceivedListener(
                (response: any) => {
                  const data = response.notification.request.content.data;
                  if (data?.type === 'verse' && data?.verseId) {
                    router.push(`/verse/${data.verseId}`);
                  } else if (data?.type === 'prayer' || data?.reminderId) {
                    router.push('/(tabs)/pray');
                  } else if (data?.type === 'gratitude') {
                    router.push('/gratitude');
                  } else {
                    router.push('/(tabs)');
                  }
                }
              );
            }
          }
        } catch {
          // Notifications deep-link not available in Expo Go
        }
      } catch (e) {
        console.error('[RootLayout] Initialization error:', e);
      } finally {
        // Hide splash screen here — all data is loaded, redirect destination is known.
        // This prevents the onboarding flash race condition for returning users.
        await SplashScreen.hideAsync().catch(() => {});
        setAppIsReady(true);
      }
    }

    prepare();

    return () => {
      // Clean up notification listener on unmount
      if (notifListenerRef.current) {
        try {
          const Notifications = require('expo-notifications');
          Notifications.removeNotificationSubscription(notifListenerRef.current);
        } catch { /* noop */ }
      }
    };
  }, []);

  // Determine resolved theme
  const resolvedScheme =
    colorScheme === 'system' ? (systemColorScheme ?? 'light') : colorScheme;
  const isDark = resolvedScheme === 'dark';

  useEffect(() => {
    try {
      setNwColorScheme(resolvedScheme as 'light' | 'dark');
    } catch {
      // noop
    }
  }, [resolvedScheme, setNwColorScheme]);

  // While initializing: render a splash-colored placeholder so there is never
  // a blank white/dark frame between the native splash and the app content.
  if (!appIsReady || !fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: systemColorScheme === 'dark' ? '#1E1C18' : '#FFF9EE',
        }}
      />
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <View
              className={isDark ? 'flex-1 bg-bg-dark' : 'flex-1 bg-cream'}
            >
              <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={isDark ? '#1E1C18' : '#FFF9EE'}
              />
              <Stack screenOptions={{ headerShown: false }}>
                {/* Root redirect — routes to onboarding or tabs */}
                <Stack.Screen name="index" />
                {/* Onboarding group */}
                <Stack.Screen name="(onboarding)" />
                {/* Main tabs */}
                <Stack.Screen name="(tabs)" />
                {/* Verse */}
                <Stack.Screen name="verse/[id]" />
                {/* Prayer */}
                <Stack.Screen name="prayer/[id]" />
                <Stack.Screen name="prayer/category/[cat]" />
                {/* Journal */}
                <Stack.Screen name="journal/new" />
                <Stack.Screen name="journal/[id]" />
                {/* Gratitude history */}
                <Stack.Screen name="gratitude/index" />
                {/* Bible */}
                <Stack.Screen name="bible/index" />
                <Stack.Screen name="bible/[book]/[chapter]" />
                {/* Search */}
                <Stack.Screen name="search" options={{ presentation: 'modal' }} />
                {/* Topic */}
                <Stack.Screen name="topic/[id]" />
                {/* Collection */}
                <Stack.Screen name="collection/[id]" />
                {/* Widget */}
                <Stack.Screen name="widget/install" />
                <Stack.Screen name="widget/themes" />
                <Stack.Screen
                  name="widget/[id]/customize"
                  options={{ presentation: 'modal' }}
                />
                {/* Premium */}
                <Stack.Screen
                  name="premium/index"
                  options={{ presentation: 'modal' }}
                />
                {/* Settings */}
                <Stack.Screen name="settings/screen" />
                {/* Catch-all unmatched route handler */}
                <Stack.Screen name="+not-found" />
              </Stack>
            </View>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
