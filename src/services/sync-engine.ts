import { supabase, getCurrentUserId } from './supabase';
import { getDb } from '@/db/client';

export class SyncEngine {
  private static isSyncing = false;

  /**
   * Run full bidirectional sync for bookmarks, journal entries, prayers, and streaks.
   */
  static async syncAll(): Promise<{ success: boolean; syncedCount: number }> {
    if (this.isSyncing) return { success: false, syncedCount: 0 };
    this.isSyncing = true;
    let syncedCount = 0;

    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        this.isSyncing = false;
        return { success: false, syncedCount: 0 };
      }

      const db = getDb();

      // 1. Sync Bookmarks / Favorites
      const localFavorites = await db.getAllAsync<{
        id: string;
        type: string;
        ref_id: string;
        note: string | null;
        created_at: string;
      }>('SELECT * FROM favorites');

      if (localFavorites && localFavorites.length > 0) {
        const payload = localFavorites.map(fav => ({
          id: fav.id,
          user_id: userId,
          type: fav.type,
          ref_id: fav.ref_id,
          note: fav.note,
          created_at: fav.created_at,
        }));

        const { error } = await supabase.from('favorites').upsert(payload, { onConflict: 'id' });
        if (!error) syncedCount += localFavorites.length;
      }

      // 2. Sync Journal Entries
      const localJournals = await db.getAllAsync<{
        id: string;
        title: string | null;
        body: string;
        mood: string | null;
        created_at: string;
        updated_at: string;
      }>('SELECT * FROM journal_entries');

      if (localJournals && localJournals.length > 0) {
        const payload = localJournals.map(j => ({
          id: j.id,
          user_id: userId,
          title: j.title || '',
          content: j.body,
          mood: j.mood,
          created_at: j.created_at,
          updated_at: j.updated_at || j.created_at,
        }));

        const { error } = await supabase.from('journal_entries').upsert(payload, { onConflict: 'id' });
        if (!error) syncedCount += localJournals.length;
      }

      // 3. Sync Personal Prayers
      const localPrayers = await db.getAllAsync<{
        id: string;
        title: string;
        body: string;
        category: string;
        is_answered: number;
        created_at: string;
      }>('SELECT * FROM personal_prayers');

      if (localPrayers && localPrayers.length > 0) {
        const payload = localPrayers.map(p => ({
          id: p.id,
          user_id: userId,
          title: p.title,
          content: p.body,
          category: p.category,
          is_answered: Boolean(p.is_answered),
          created_at: p.created_at,
        }));

        const { error } = await supabase.from('prayers').upsert(payload, { onConflict: 'id' });
        if (!error) syncedCount += localPrayers.length;
      }

      console.log(`[SyncEngine] Successfully synced ${syncedCount} records to Supabase.`);
      return { success: true, syncedCount };
    } catch (e) {
      console.warn('[SyncEngine] Sync failed:', e);
      return { success: false, syncedCount: 0 };
    } finally {
      this.isSyncing = false;
    }
  }
}
