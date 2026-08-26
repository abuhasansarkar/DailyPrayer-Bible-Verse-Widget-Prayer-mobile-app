import { useCallback } from 'react';
import { getDb, generateId, nowIso } from '@/db/client';
import { useAsyncData } from './use-async-data';

export type JournalType = 'prayer' | 'gratitude' | 'reflection';

export interface JournalEntry {
  id: string;
  type: JournalType;
  title: string;
  body: string;
  mood: string | null;
  is_answered: number;
  created_at: string;
  updated_at: string;
}

export interface GratitudeEntry {
  id: string;
  items: string[];
  created_at: string;
}

interface JournalData {
  entries: JournalEntry[];
  gratitude: GratitudeEntry[];
}

const EMPTY: JournalData = { entries: [], gratitude: [] };

export function useJournal(type?: JournalType) {
  const fetchJournal = useCallback(async (): Promise<JournalData> => {
    {
      const db = getDb();

      const query = type
        ? 'SELECT id, type, title, body, mood, is_answered, created_at, updated_at FROM journal_entries WHERE type = ? ORDER BY created_at DESC'
        : 'SELECT id, type, title, body, mood, is_answered, created_at, updated_at FROM journal_entries ORDER BY created_at DESC';

      const rows = type
        ? await db.getAllAsync<JournalEntry>(query, [type])
        : await db.getAllAsync<JournalEntry>(query);

      let entries: JournalEntry[];

      // Merge personal_prayers if type is null or 'prayer'
      if (!type || type === 'prayer') {
        const personalPrayers = await db.getAllAsync<{
          id: string; title: string; body: string; is_answered: number; created_at: string; updated_at: string;
        }>('SELECT id, title, body, is_answered, created_at, updated_at FROM personal_prayers ORDER BY created_at DESC');

        const mapped: JournalEntry[] = personalPrayers.map((p) => ({
          id: p.id,
          type: 'prayer',
          title: p.title,
          body: p.body,
          mood: null,
          is_answered: p.is_answered,
          created_at: p.created_at,
          updated_at: p.updated_at,
        }));

        // Combine & sort by created_at DESC
        const merged = [...rows, ...mapped].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        entries = merged;
      } else {
        entries = rows;
      }

      // Load gratitude entries separately
      const gratRows = await db.getAllAsync<{ id: string; items: string; created_at: string }>(
        'SELECT id, items, created_at FROM gratitude_entries ORDER BY created_at DESC LIMIT 30'
      );
      const gratitude = gratRows.map((r) => ({
        id: r.id,
        items: (() => { try { return JSON.parse(r.items) as string[]; } catch { return [r.items]; } })(),
        created_at: r.created_at,
      }));

      return { entries, gratitude };
    }
  }, [type]);

  const { data, loading, refresh, setData } = useAsyncData(type ?? '__all__', fetchJournal, EMPTY);

  const createEntry = useCallback(async (data: {
    type: JournalType;
    title: string;
    body: string;
    mood?: string;
  }) => {
    try {
      const db = getDb();
      const id = generateId();
      const now = nowIso();
      await db.runAsync(
        `INSERT INTO journal_entries (id, type, title, body, mood, is_answered, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
        [id, data.type, data.title, data.body, data.mood ?? null, now, now]
      );
      await refresh();
      return id;
    } catch (e) {
      console.warn('[useJournal] createEntry error:', e);
      return null;
    }
  }, [refresh]);

  const updateEntry = useCallback(async (id: string, data: Partial<Pick<JournalEntry, 'title' | 'body' | 'mood' | 'is_answered'>>) => {
    try {
      const db = getDb();
      const fields = Object.entries(data).map(([k]) => `${k} = ?`).join(', ');
      const values = Object.values(data);
      await db.runAsync(
        `UPDATE journal_entries SET ${fields}, updated_at = ? WHERE id = ?`,
        [...values, nowIso(), id]
      );
      await refresh();
    } catch (e) {
      console.warn('[useJournal] updateEntry error:', e);
    }
  }, [refresh]);

  const deleteEntry = useCallback(async (id: string) => {
    try {
      const db = getDb();
      await db.runAsync('DELETE FROM journal_entries WHERE id = ?', [id]);
      setData((current) => ({
        ...current,
        entries: current.entries.filter((e) => e.id !== id),
      }));
    } catch (e) {
      console.warn('[useJournal] deleteEntry error:', e);
    }
  }, [setData]);

  const addGratitude = useCallback(async (items: string[]) => {
    try {
      const db = getDb();
      const id = generateId();
      await db.runAsync(
        'INSERT INTO gratitude_entries (id, items, created_at) VALUES (?, ?, datetime("now"))',
        [id, JSON.stringify(items)]
      );
      await refresh();
      return id;
    } catch (e) {
      console.warn('[useJournal] addGratitude error:', e);
      return null;
    }
  }, [refresh]);

  return {
    entries: data.entries,
    gratitude: data.gratitude,
    loading,
    refresh,
    createEntry,
    updateEntry,
    deleteEntry,
    addGratitude,
  };
}
