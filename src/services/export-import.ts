import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDb } from '@/db/client';

export interface UserExportData {
  version: string;
  exportedAt: string;
  favorites: any[];
  journals: any[];
  prayers: any[];
  gratitude: any[];
}

export class ExportImportService {
  /**
   * Export all user data as a JSON file and open native share sheet.
   */
  static async exportUserData(): Promise<boolean> {
    try {
      const db = getDb();

      const favorites = await db.getAllAsync('SELECT * FROM favorites');
      const journals = await db.getAllAsync('SELECT * FROM journal_entries');
      const prayers = await db.getAllAsync('SELECT * FROM personal_prayers');
      const gratitude = await db.getAllAsync('SELECT * FROM gratitude_entries');

      const payload: UserExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        favorites: favorites || [],
        journals: journals || [],
        prayers: prayers || [],
        gratitude: gratitude || [],
      };

      const jsonString = JSON.stringify(payload, null, 2);
      const backupFile = new File(
        Paths.cache,
        `DailyPrayer_Backup_${new Date().toISOString().split('T')[0]}.json`
      );

      // create() throws if the file already exists (same-day re-export).
      if (backupFile.exists) backupFile.delete();
      backupFile.create();
      backupFile.write(jsonString);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(backupFile.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Export DailyPrayer Data',
          UTI: 'public.json',
        });
        return true;
      }
    } catch (e) {
      console.error('[ExportImportService] Export failed:', e);
    }
    return false;
  }

  /**
   * Open native document picker to select a backup file and import it.
   */
  static async pickAndImportFile(): Promise<{ success: boolean; importedCount: number; canceled?: boolean }> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return { success: false, importedCount: 0, canceled: true };
      }

      const fileUri = result.assets[0]!.uri;
      const fileContent = new File(fileUri).textSync();

      return await this.importUserData(fileContent);
    } catch (e) {
      console.error('[ExportImportService] Pick and import failed:', e);
      return { success: false, importedCount: 0 };
    }
  }

  /**
   * Import data from JSON string and insert into local SQLite tables.
   */
  static async importUserData(jsonContent: string): Promise<{ success: boolean; importedCount: number }> {
    try {
      const data = JSON.parse(jsonContent) as UserExportData;
      if (!data.favorites || !data.journals || !data.prayers) {
        throw new Error('Invalid DailyPrayer backup JSON structure.');
      }

      const db = getDb();
      let importedCount = 0;

      // Import favorites
      for (const fav of data.favorites) {
        await db.runAsync(
          `INSERT OR REPLACE INTO favorites 
           (id, type, ref_id, note, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [
            fav.id || `fav-${Date.now()}`,
            fav.type || 'verse',
            fav.ref_id || fav.verse_id || fav.id,
            fav.note || null,
            fav.created_at || new Date().toISOString(),
          ]
        );
        importedCount++;
      }

      // Import journals
      for (const j of data.journals) {
        await db.runAsync(
          `INSERT OR REPLACE INTO journal_entries 
           (id, type, title, body, mood, is_answered, tags, is_private, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            j.id,
            j.type || 'journal',
            j.title || '',
            j.body || j.content || '',
            j.mood || 'peaceful',
            j.is_answered ? 1 : 0,
            j.tags || '[]',
            j.is_private !== undefined ? (j.is_private ? 1 : 0) : 1,
            j.created_at || new Date().toISOString(),
            j.updated_at || j.created_at || new Date().toISOString(),
          ]
        );
        importedCount++;
      }

      // Import personal prayers
      if (data.prayers && Array.isArray(data.prayers)) {
        for (const p of data.prayers) {
          await db.runAsync(
            `INSERT OR REPLACE INTO personal_prayers 
             (id, title, body, category, is_answered, answered_at, reminder_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              p.id,
              p.title || 'Untitled Prayer',
              p.body || p.content || '',
              p.category || 'personal',
              p.is_answered ? 1 : 0,
              p.answered_at || null,
              p.reminder_id || null,
              p.created_at || new Date().toISOString(),
              p.updated_at || p.created_at || new Date().toISOString(),
            ]
          );
          importedCount++;
        }
      }

      return { success: true, importedCount };
    } catch (e) {
      console.error('[ExportImportService] Import failed:', e);
      return { success: false, importedCount: 0 };
    }
  }
}
