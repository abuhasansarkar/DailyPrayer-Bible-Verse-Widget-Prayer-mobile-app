import { useEffect, useState, useCallback } from 'react';
import { getDb, todayDate } from '@/db/client';
import { useUserStore } from '@/store/user.store';

export interface DailyVerseRow {
  id: string;
  date: string;
  reflection: string;
  prayer: string;
  verse_reference: string;
  verse_text: string;
  verse_book: string;
}

export function useDailyVerse() {
  const [verse, setVerse] = useState<DailyVerseRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { recordActivity } = useUserStore();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const db = getDb();
      const today = todayDate();

      // Try scheduled daily verse first
      const row = await db.getFirstAsync<DailyVerseRow>(`
        SELECT dv.id, dv.date, dv.reflection, dv.prayer,
               v.reference as verse_reference, v.text as verse_text, v.book as verse_book
        FROM daily_verses dv
        JOIN verses v ON v.id = dv.verse_id
        WHERE dv.date = ?
        LIMIT 1
      `, [today]);

      if (row) {
        setVerse(row);
        recordActivity('verse');
      } else {
        // Fallback: featured verse
        const fallback = await db.getFirstAsync<{ id: string; reference: string; text: string; book: string }>(
          'SELECT id, reference, text, book FROM verses WHERE is_featured = 1 ORDER BY RANDOM() LIMIT 1'
        );
        if (fallback) {
          setVerse({
            id: fallback.id,
            date: today,
            reflection: '',
            prayer: '',
            verse_reference: fallback.reference,
            verse_text: fallback.text,
            verse_book: fallback.book,
          });
        }
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load verse');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { verse, loading, error, refresh: load };
}
