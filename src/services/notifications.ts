import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { PrayerReminder } from '@/types/prayer';
import { getDb, parseJson } from '@/db/client';

// ─────────────────────────────────────────────────────────────────────────────
// Notification Service (Expo Go & Dev Build Compatible)
// ─────────────────────────────────────────────────────────────────────────────

const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let notificationsModule: typeof import('expo-notifications') | null = null;
let handlerConfigured = false;

function getNotifications(): typeof import('expo-notifications') | null {
  if (isExpoGo && Platform.OS === 'android') {
    // Expo SDK 53+ removed expo-notifications support in Expo Go on Android.
    return null;
  }
  if (notificationsModule) {
    return notificationsModule;
  }
  try {
    notificationsModule = require('expo-notifications');
    if (notificationsModule && !handlerConfigured) {
      notificationsModule.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      handlerConfigured = true;
    }
    return notificationsModule;
  } catch (e) {
    console.warn('[Notifications] Failed to load expo-notifications:', e);
    return null;
  }
}


export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const Notifications = getNotifications();
    if (!Notifications) return false;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('daily-prayer', {
        name: 'DailyPrayer Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F2B84B',
        sound: 'default',
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (e) {
    console.warn('[Notifications] requestNotificationPermission skipped:', e);
    return false;
  }
}

export async function scheduleReminder(reminder: PrayerReminder): Promise<string[]> {
  try {
    const Notifications = getNotifications();
    if (!Notifications) return [];

    const notificationIds: string[] = [];

    if (reminder.notificationId) {
      await cancelReminder(reminder.notificationId);
    }

    // App convention is 0=Sun..6=Sat (see PrayerReminder.daysOfWeek); anything
    // outside that range would produce an invalid expo-notifications weekday.
    const daysOfWeek = reminder.daysOfWeek.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
    const [hourStr, minuteStr] = reminder.time.split(':');
    const hour = parseInt(hourStr ?? '7', 10);
    const minute = parseInt(minuteStr ?? '0', 10);

    const messages = getNotificationMessages(reminder.type);

    for (const day of daysOfWeek) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: messages[Math.floor(Math.random() * messages.length)] ?? 'Your daily prayer reminder.',
          data: { reminderId: reminder.id, type: reminder.type },
          sound: reminder.soundEnabled ? 'default' : undefined,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: day + 1, // expo-notifications: 1=Sun, 7=Sat
          hour,
          minute,
        },
      });
      notificationIds.push(id);
    }

    return notificationIds;
  } catch (e) {
    console.warn('[Notifications] scheduleReminder skipped:', e);
    return [];
  }
}

export async function cancelReminder(notificationId: string): Promise<void> {
  try {
    const Notifications = getNotifications();
    if (!Notifications) return;

    const ids = notificationId.split(',');
    for (const id of ids) {
      await Notifications.cancelScheduledNotificationAsync(id.trim());
    }
  } catch (e) {
    console.warn('[Notifications] cancelReminder skipped:', e);
  }
}

export async function cancelAllReminders(): Promise<void> {
  try {
    const Notifications = getNotifications();
    if (!Notifications) return;

    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.warn('[Notifications] cancelAllReminders skipped:', e);
  }
}

export async function syncRemindersFromDb(): Promise<void> {
  try {
    const Notifications = getNotifications();
    if (!Notifications) return;

    const db = getDb();
    const reminders = await db.getAllAsync<{
      id: string;
      title: string;
      time: string;
      days_of_week: string;
      type: string;
      is_active: number;
      sound_enabled: number;
      notification_id: string | null;
    }>('SELECT * FROM reminders WHERE is_active = 1');

    await cancelAllReminders();

    for (const row of reminders) {
      const reminder: PrayerReminder = {
        id: row.id,
        title: row.title,
        time: row.time,
        daysOfWeek: parseJson<number[]>(row.days_of_week, [0, 1, 2, 3, 4, 5, 6]),
        type: row.type as PrayerReminder['type'],
        isActive: row.is_active === 1,
        soundEnabled: row.sound_enabled === 1,
        notificationId: row.notification_id ?? undefined,
        createdAt: '',
      };

      const ids = await scheduleReminder(reminder);
      await db.runAsync(
        'UPDATE reminders SET notification_id = ? WHERE id = ?',
        [ids.join(','), row.id]
      );
    }
  } catch (e) {
    console.warn('[Notifications] syncRemindersFromDb skipped:', e);
  }
}

function getNotificationMessages(type: string): string[] {
  const messages: Record<string, string[]> = {
    morning: [
      'Good morning! Your daily verse is waiting. 🌅',
      'Start your day with a moment of faith. ☀️',
      'New mercies, new morning. Open DailyPrayer.',
      'A quiet moment with God to begin your day.',
    ],
    evening: [
      'Time to reflect and give thanks. 🌙',
      'End your day in peace with an evening prayer.',
      'A few minutes of reflection before you rest.',
      'Good evening — your prayer is ready.',
    ],
    midday: [
      'A midday pause for your soul. 🕊️',
      'Take a breath. God is with you right now.',
      'A moment of faith in the middle of your day.',
    ],
    custom: [
      'Your prayer reminder is here.',
      'A gentle invitation to pause and pray.',
      'Take a moment with God.',
    ],
  };
  return messages[type] ?? messages['custom']!;
}
