import { useState, useCallback } from 'react';
import {
  requestNotificationPermission,
  scheduleReminder,
  cancelReminder,
  syncRemindersFromDb,
} from '@/services/notifications';
import { getDb, generateId, nowIso, parseJson } from '@/db/client';
import type { PrayerReminder } from '@/types/prayer';

export function useNotifications() {
  const [hasPermission, setHasPermission] = useState(false);
  const [reminders, setReminders] = useState<PrayerReminder[]>([]);
  const [loading, setLoading] = useState(false);

  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setHasPermission(granted);
    return granted;
  }, []);

  const loadReminders = useCallback(async () => {
    try {
      const db = getDb();
      const rows = await db.getAllAsync<{
        id: string; title: string; time: string;
        days_of_week: string; type: string;
        is_active: number; sound_enabled: number;
        notification_id: string | null; created_at: string;
      }>('SELECT * FROM reminders ORDER BY time ASC');

      setReminders(rows.map((r) => ({
        id: r.id,
        title: r.title,
        time: r.time,
        daysOfWeek: parseJson<number[]>(r.days_of_week, [0, 1, 2, 3, 4, 5, 6]),
        type: r.type as PrayerReminder['type'],
        isActive: r.is_active === 1,
        soundEnabled: r.sound_enabled === 1,
        notificationId: r.notification_id ?? undefined,
        createdAt: r.created_at,
      })));
    } catch (e) {
      console.warn('[useNotifications] loadReminders error:', e);
    }
  }, []);

  const addReminder = useCallback(async (
    title: string,
    time: string,
    daysOfWeek: number[],
    type: PrayerReminder['type'],
    soundEnabled = true,
  ) => {
    try {
      setLoading(true);
      const db = getDb();
      const id = generateId();
      await db.runAsync(
        `INSERT INTO reminders (id, title, time, days_of_week, type, is_active, sound_enabled, created_at)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
        [id, title, time, JSON.stringify(daysOfWeek), type, soundEnabled ? 1 : 0, nowIso()]
      );
      // Schedule notification
      const reminder: PrayerReminder = { id, title, time, daysOfWeek, type, isActive: true, soundEnabled, createdAt: nowIso() };
      const notifIds = await scheduleReminder(reminder);
      if (notifIds.length > 0) {
        await db.runAsync('UPDATE reminders SET notification_id = ? WHERE id = ?', [notifIds.join(','), id]);
      }
      await loadReminders();
    } catch (e) {
      console.warn('[useNotifications] addReminder error:', e);
    } finally {
      setLoading(false);
    }
  }, [loadReminders]);

  const toggleReminder = useCallback(async (id: string, active: boolean) => {
    try {
      const db = getDb();
      await db.runAsync('UPDATE reminders SET is_active = ? WHERE id = ?', [active ? 1 : 0, id]);
      if (!active) {
        const row = await db.getFirstAsync<{ notification_id: string | null }>('SELECT notification_id FROM reminders WHERE id = ?', [id]);
        if (row?.notification_id) await cancelReminder(row.notification_id);
      } else {
        await syncRemindersFromDb();
      }
      await loadReminders();
    } catch (e) {
      console.warn('[useNotifications] toggleReminder error:', e);
    }
  }, [loadReminders]);

  const deleteReminder = useCallback(async (id: string) => {
    try {
      const db = getDb();
      const row = await db.getFirstAsync<{ notification_id: string | null }>('SELECT notification_id FROM reminders WHERE id = ?', [id]);
      if (row?.notification_id) await cancelReminder(row.notification_id);
      await db.runAsync('DELETE FROM reminders WHERE id = ?', [id]);
      await loadReminders();
    } catch (e) {
      console.warn('[useNotifications] deleteReminder error:', e);
    }
  }, [loadReminders]);

  return {
    hasPermission,
    reminders,
    loading,
    requestPermission,
    loadReminders,
    addReminder,
    toggleReminder,
    deleteReminder,
  };
}
