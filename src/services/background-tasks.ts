import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { WidgetBridgeService } from './widget-bridge';
import { getDailyVerse } from './bible-api';

export const DAILY_VERSE_REFRESH_TASK = 'DAILY_VERSE_REFRESH_TASK';

// Define the background task in global context
TaskManager.defineTask(DAILY_VERSE_REFRESH_TASK, async () => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const verse = await getDailyVerse(todayStr);

    if (verse) {
      await WidgetBridgeService.updateWidgetData({
        verseText: verse.text,
        verseReference: `${verse.book} ${verse.chapter}:${verse.verse}`,
        translation: verse.translation || 'WEB',
        dateString: todayStr,
      });
      console.log('[BackgroundTask] Successfully refreshed Daily Verse for widget:', todayStr);
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }

    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('[BackgroundTask] Error executing daily verse refresh task:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Register the background task with the OS background fetch manager.
 */
export async function registerDailyVerseBackgroundTask() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(DAILY_VERSE_REFRESH_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(DAILY_VERSE_REFRESH_TASK, {
        minimumInterval: 60 * 60 * 6, // Check every 6 hours
        stopOnTerminate: false,      // Continue running after app termination
        startOnBoot: true,           // Relaunch background fetch on device reboot
      });
      console.log('[BackgroundTask] Registered DAILY_VERSE_REFRESH_TASK successfully.');
    }
  } catch (err) {
    console.warn('[BackgroundTask] Task registration warning:', err);
  }
}
