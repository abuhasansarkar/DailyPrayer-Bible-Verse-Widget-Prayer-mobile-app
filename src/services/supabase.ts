import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

import { ENV, IS_SUPABASE_CONFIGURED } from '@/constants/env';

const SUPABASE_URL = ENV.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = ENV.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// SecureStore adapter for Supabase session persistence
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-anon-key',
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

const isConfigured = IS_SUPABASE_CONFIGURED;

// ── Auth helpers ───────────────────────────────────────────────────────────────

export async function signInAnonymously(): Promise<string | null> {
  if (!isConfigured) return null;
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      if (error.message?.includes('Anonymous sign-ins are disabled')) {
        console.log('[Supabase] Anonymous auth disabled in Supabase dashboard — running in local mode.');
        return null;
      }
      throw error;
    }
    return data.user?.id ?? null;
  } catch (e) {
    console.warn('[Supabase] signInAnonymously skipped:', e);
    return null;
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  if (!isConfigured) return null;
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

export async function ensureAuth(): Promise<string | null> {
  if (!isConfigured) return null;
  let userId = await getCurrentUserId();
  if (!userId) {
    userId = await signInAnonymously();
  }
  return userId;
}

// ── Sync helpers ───────────────────────────────────────────────────────────────

/**
 * Sync user preferences to Supabase
 */
export async function syncPreferences(prefs: {
  translation?: string;
  theme?: string;
  goals?: string[];
  language?: string;
  display_name?: string;
}): Promise<void> {
  if (!isConfigured) return;
  try {
    const userId = await ensureAuth();
    if (!userId) return;

    await supabase.from('user_preferences').upsert({
      user_id: userId,
      translation: prefs.translation,
      theme: prefs.theme,
      goals: prefs.goals,
      language: prefs.language,
      display_name: prefs.display_name,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  } catch (e) {
    console.warn('[Supabase] syncPreferences failed:', e);
  }
}

/**
 * Sync a batch of favorites to Supabase
 */
export async function syncFavorites(
  favorites: { type: string; ref_id: string; created_at?: string }[]
): Promise<void> {
  if (!isConfigured) return;
  try {
    const userId = await ensureAuth();
    if (!userId) return;

    const rows = favorites.map((f) => ({
      user_id: userId,
      type: f.type,
      ref_id: f.ref_id,
      synced_at: new Date().toISOString(),
    }));

    if (rows.length > 0) {
      await supabase.from('sync_favorites').upsert(rows, {
        onConflict: 'user_id,type,ref_id',
        ignoreDuplicates: false,
      });
    }
  } catch (e) {
    console.warn('[Supabase] syncFavorites failed:', e);
  }
}

/**
 * Sync journal entries (last-write-wins by updated_at)
 */
export async function syncJournalEntries(
  entries: {
    id: string; type: string; title: string; body: string;
    mood?: string; is_answered: number; created_at: string; updated_at: string;
  }[]
): Promise<void> {
  if (!isConfigured) return;
  try {
    const userId = await ensureAuth();
    if (!userId) return;

    const rows = entries.map((e) => ({
      user_id: userId,
      entry_id: e.id,
      entry_json: JSON.stringify(e),
      updated_at: e.updated_at,
      synced_at: new Date().toISOString(),
    }));

    if (rows.length > 0) {
      await supabase.from('sync_journal_entries').upsert(rows, {
        onConflict: 'user_id,entry_id',
        ignoreDuplicates: false,
      });
    }
  } catch (e) {
    console.warn('[Supabase] syncJournalEntries failed:', e);
  }
}

/**
 * Sync streak log to Supabase
 */
export async function syncStreakLog(
  log: { date: string; activities: string[]; is_complete: boolean }[]
): Promise<void> {
  if (!isConfigured) return;
  try {
    const userId = await ensureAuth();
    if (!userId) return;

    const rows = log.map((l) => ({
      user_id: userId,
      date: l.date,
      activities: l.activities,
      is_complete: l.is_complete,
      synced_at: new Date().toISOString(),
    }));

    if (rows.length > 0) {
      await supabase.from('sync_streaks').upsert(rows, {
        onConflict: 'user_id,date',
        ignoreDuplicates: false,
      });
    }
  } catch (e) {
    console.warn('[Supabase] syncStreakLog failed:', e);
  }
}

/**
 * Full offline-first sync — reads from SQLite and pushes to Supabase.
 * Safe to call on app foreground; all errors are caught and logged.
 */
export async function runFullSync(): Promise<void> {
  if (!isConfigured) {
    console.log('[Supabase] Sync skipped — not configured');
    return;
  }
  try {
    const { getDb, parseJson } = await import('@/db/client');
    const db = getDb();

    // 1. Sync favorites
    const favRows = await db.getAllAsync<{ type: string; ref_id: string; created_at: string }>(
      'SELECT type, ref_id, created_at FROM favorites ORDER BY created_at DESC LIMIT 200'
    );
    await syncFavorites(favRows);

    // 2. Sync journal entries
    const journalRows = await db.getAllAsync<{
      id: string; type: string; title: string; body: string;
      mood: string | null; is_answered: number; created_at: string; updated_at: string;
    }>('SELECT id, type, title, body, mood, is_answered, created_at, updated_at FROM journal_entries ORDER BY updated_at DESC LIMIT 100');
    await syncJournalEntries(journalRows.map((r) => ({ ...r, mood: r.mood ?? undefined })));

    // 3. Sync streak log (last 30 days)
    const streakRows = await db.getAllAsync<{ date: string; activities: string; is_complete: number }>(
      `SELECT date, activities, is_complete FROM streak_log
       WHERE date >= date('now', '-30 days')
       ORDER BY date DESC`
    );
    await syncStreakLog(streakRows.map((r) => ({
      date: r.date,
      activities: parseJson<string[]>(r.activities, []),
      is_complete: r.is_complete === 1,
    })));

    // 4. Sync preferences
    const prefs = await db.getFirstAsync<{
      preferred_translation: string; app_theme: string;
      language: string; display_name: string; goals: string;
    }>('SELECT preferred_translation, app_theme, language, display_name, goals FROM user_preferences WHERE id = 1');

    if (prefs) {
      await syncPreferences({
        translation: prefs.preferred_translation,
        theme: prefs.app_theme,
        language: prefs.language,
        display_name: prefs.display_name,
        goals: parseJson<string[]>(prefs.goals, []),
      });
    }

    console.log('[Supabase] Full sync complete');
  } catch (e) {
    console.warn('[Supabase] runFullSync error:', e);
  }
}
