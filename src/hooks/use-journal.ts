import { useEffect, useState, useCallback } from 'react';
import { getDb, generateId, nowIso } from '@/db/client';

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

export function useJournal(type?: JournalType) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [gratitude, setGratitude] = useState<GratitudeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const db = getDb();

      const query = type
        ? 'SELECT id, type, title, body, mood, is_answered, created_at, updated_at FROM journal_entries WHERE type = ? ORDER BY created_at DESC'
        : 'SELECT id, type, title, body, mood, is_answered, created_at, updated_at FROM journal_entries ORDER BY created_at DESC';

      const rows = type
        ? await db.getAllAsync<JournalEntry>(query, [type])
        : await db.getAllAsync<JournalEntry>(query);

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
        setEntries(merged);
      } else {
        setEntries(rows);
      }

      // Load gratitude entries separately
      const gratRows = await db.getAllAsync<{ id: string; items: string; created_at: string }>(
        'SELECT id, items, created_at FROM gratitude_entries ORDER BY created_at DESC LIMIT 30'
      );
      setGratitude(gratRows.map((r) => ({
        id: r.id,
        items: (() => { try { return JSON.parse(r.items); } catch { return [r.items]; } })(),
        created_at: r.created_at,
      })));
    } catch (e) {
      console.warn('[useJournal] load error:', e);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => { load(); }, [load]);

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
      await load();
      return id;
    } catch (e) {
      console.warn('[useJournal] createEntry error:', e);
      return null;
    }
  }, [load]);

  const updateEntry = useCallback(async (id: string, data: Partial<Pick<JournalEntry, 'title' | 'body' | 'mood' | 'is_answered'>>) => {
    try {
      const db = getDb();
      const fields = Object.entries(data).map(([k]) => `${k} = ?`).join(', ');
      const values = Object.values(data);
      await db.runAsync(
        `UPDATE journal_entries SET ${fields}, updated_at = ? WHERE id = ?`,
        [...values, nowIso(), id]
      );
      await load();
    } catch (e) {
      console.warn('[useJournal] updateEntry error:', e);
    }
  }, [load]);

  const deleteEntry = useCallback(async (id: string) => {
    try {
      const db = getDb();
      await db.runAsync('DELETE FROM journal_entries WHERE id = ?', [id]);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (e) {
      console.warn('[useJournal] deleteEntry error:', e);
    }
  }, []);

  const addGratitude = useCallback(async (items: string[]) => {
    try {
      const db = getDb();
      const id = generateId();
      await db.runAsync(
        'INSERT INTO gratitude_entries (id, items, created_at) VALUES (?, ?, datetime("now"))',
        [id, JSON.stringify(items)]
      );
      await load();
      return id;
    } catch (e) {
      console.warn('[useJournal] addGratitude error:', e);
      return null;
    }
  }, [load]);

  return { entries, gratitude, loading, refresh: load, createEntry, updateEntry, deleteEntry, addGratitude };
}
