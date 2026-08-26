import { supabase, getCurrentUserId } from './supabase';
import { getDb } from '@/db/client';
import { IS_SUPABASE_CONFIGURED } from '@/constants/env';

/**
 * Row-level sync of favourites, journal entries and personal prayers.
 *
 * Targets the `sync_*` tables, matching the schema runFullSync() in
 * ./supabase.ts already writes to. This class previously wrote to a separate
 * set of table names (favorites / journal_entries / prayers), so the two sync
 * paths could never have pointed at the same backend.
 *
 * NOTE: this is a push. Nothing reads back from Supabase yet, so a reinstall
 * does not restore. See plan.md B6 before relying on it for backup.
 */
export class SyncEngine {
  private static isSyncing = false;

  static async syncAll(): Promise<{ success: boolean; syncedCount: number }> {
    // Without config every request would fail against the placeholder client.
    if (!IS_SUPABASE_CONFIGURED) return { success: false, syncedCount: 0 };
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
          user_id: userId,
          type: fav.type,
          ref_id: fav.ref_id,
          synced_at: new Date().toISOString(),
        }));

        const { error } = await supabase.from('sync_favorites').upsert(payload, { onConflict: 'user_id,type,ref_id' });
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
          user_id: userId,
          entry_id: j.id,
          entry_json: JSON.stringify(j),
          updated_at: j.updated_at || j.created_at,
          synced_at: new Date().toISOString(),
        }));

        const { error } = await supabase.from('sync_journal_entries').upsert(payload, { onConflict: 'user_id,entry_id' });
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
          user_id: userId,
          prayer_id: p.id,
          prayer_json: JSON.stringify(p),
          updated_at: p.created_at,
          synced_at: new Date().toISOString(),
        }));

        const { error } = await supabase.from('sync_personal_prayers').upsert(payload, { onConflict: 'user_id,prayer_id' });
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
