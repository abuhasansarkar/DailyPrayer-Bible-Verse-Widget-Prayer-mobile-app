import { WidgetBridgeService } from './widget-bridge';
import { getDailyVerse } from './daily-verse-rotation';

export const DAILY_VERSE_REFRESH_TASK = 'DAILY_VERSE_REFRESH_TASK';

function initTaskManager() {
  try {
    const TaskManager = require('expo-task-manager');
    const BackgroundFetch = require('expo-background-fetch');

    if (TaskManager && typeof TaskManager.defineTask === 'function') {
      TaskManager.defineTask(DAILY_VERSE_REFRESH_TASK, async () => {
        try {
          const todayStr = new Date().toISOString().split('T')[0];
          const verse = await getDailyVerse(todayStr);

          if (verse) {
            await WidgetBridgeService.updateWidgetData({
              verseText: verse.text,
              verseReference: `${verse.book} ${verse.chapter}:${verse.verse}`,
              translation: verse.translation || 'KJV',
              dateString: todayStr,
            });
            console.log('[BackgroundTask] Successfully refreshed Daily Verse for widget:', todayStr);
            return BackgroundFetch?.BackgroundFetchResult?.NewData ?? 1;
          }

          return BackgroundFetch?.BackgroundFetchResult?.NoData ?? 2;
        } catch (error) {
          console.error('[BackgroundTask] Error executing daily verse refresh task:', error);
          return BackgroundFetch?.BackgroundFetchResult?.Failed ?? 3;
        }
      });
    }
  } catch {
    // expo-task-manager or expo-background-fetch native modules not available
  }
}

initTaskManager();

/**
 * Register the background task with the OS background fetch manager.
 */
export async function registerDailyVerseBackgroundTask() {
  try {
    const TaskManager = require('expo-task-manager');
    const BackgroundFetch = require('expo-background-fetch');

    if (!TaskManager || !BackgroundFetch) return;

    const isRegistered = await TaskManager.isTaskRegisteredAsync(DAILY_VERSE_REFRESH_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(DAILY_VERSE_REFRESH_TASK, {
        minimumInterval: 60 * 60 * 6, // Check every 6 hours
        stopOnTerminate: false,      // Continue running after app termination
        startOnBoot: true,           // Relaunch background fetch on device reboot
      });
      console.log('[BackgroundTask] Registered DAILY_VERSE_REFRESH_TASK successfully.');
    }
  } catch {
    // Graceful fallback when running in Expo Go or environment without native background task support
  }
}
