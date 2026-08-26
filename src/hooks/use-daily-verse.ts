import { useCallback } from 'react';
import { getDb, todayDate } from '@/db/client';
import { useUserStore } from '@/store/user.store';
import { useAsyncData } from './use-async-data';

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
  const today = todayDate();

  const fetchVerse = useCallback(async (): Promise<DailyVerseRow | null> => {
    const db = getDb();

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
      // Reading today's verse counts toward the streak.
      await useUserStore.getState().recordActivity('verse');
      return row;
    }

    // Fallback: any featured verse from the local seed
    const fallback = await db.getFirstAsync<{ id: string; reference: string; text: string; book: string }>(
      'SELECT id, reference, text, book FROM verses WHERE is_featured = 1 ORDER BY RANDOM() LIMIT 1'
    );
    if (fallback) {
      return {
        id: fallback.id,
        date: today,
        reflection: '',
        prayer: '',
        verse_reference: fallback.reference,
        verse_text: fallback.text,
        verse_book: fallback.book,
      };
    }

    // Last resort: fetch a verse live from the public-domain CDN
    const { getBibleVerse, formatBibleText } = await import('@/services/bibleApi');
    const live = await getBibleVerse({ version: 'en-kjv', book: 'john', chapter: 3, verse: 16 });
    return {
      id: 'verse-john-3-16',
      date: today,
      reflection: 'For God so loved the world that He gave His only begotten Son.',
      prayer: 'Lord, thank You for Your grace and unfailing love.',
      verse_reference: 'John 3:16',
      verse_text: formatBibleText(live.text),
      verse_book: 'John',
    };
  }, [today]);

  const { data: verse, loading, error, refresh } = useAsyncData<DailyVerseRow | null>(
    today,
    fetchVerse,
    null
  );

  return { verse, loading, error, refresh };
}
