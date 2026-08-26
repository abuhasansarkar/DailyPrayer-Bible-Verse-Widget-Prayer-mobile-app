import { useCallback, useMemo } from 'react';
import { getDb } from '@/db/client';
import { useAsyncData } from './use-async-data';

export interface GuidedPrayer {
  id: string;
  title: string;
  category: string;
  duration_minutes: number;
  is_premium: number;
  intro: string;
  body: string;
  scripture_ref: string | null;
}

export interface PersonalPrayer {
  id: string;
  title: string;
  body: string;
  category: string | null;
  is_answered: number;
  created_at: string;
}

interface PrayersData {
  guided: GuidedPrayer[];
  personal: PersonalPrayer[];
}

const EMPTY: PrayersData = { guided: [], personal: [] };

export function usePrayers(category?: string) {
  const fetchPrayers = useCallback(async (): Promise<PrayersData> => {
    const db = getDb();

    const guidedQuery = category
      ? 'SELECT id, title, category, duration_minutes, is_premium, intro, body, scripture_ref FROM guided_prayers WHERE category = ? ORDER BY title'
      : 'SELECT id, title, category, duration_minutes, is_premium, intro, body, scripture_ref FROM guided_prayers ORDER BY category, title';

    const guided = category
      ? await db.getAllAsync<GuidedPrayer>(guidedQuery, [category])
      : await db.getAllAsync<GuidedPrayer>(guidedQuery);

    const personal = await db.getAllAsync<PersonalPrayer>(
      'SELECT id, title, body, category, is_answered, created_at FROM personal_prayers ORDER BY created_at DESC'
    );

    return { guided, personal };
  }, [category]);

  const { data, loading, refresh, setData } = useAsyncData(
    category ?? '__all__',
    fetchPrayers,
    EMPTY
  );

  const addPersonalPrayer = useCallback(
    async (title: string, body: string, prayerCategory?: string) => {
      try {
        const db = getDb();
        const id = `prayer-${Date.now()}`;
        await db.runAsync(
          'INSERT INTO personal_prayers (id, title, body, category, is_answered, created_at) VALUES (?, ?, ?, ?, 0, datetime("now"))',
          [id, title, body, prayerCategory ?? null]
        );
        await refresh();
        return id;
      } catch (e) {
        console.warn('[usePrayers] addPersonalPrayer error:', e);
        return null;
      }
    },
    [refresh]
  );

  const markAnswered = useCallback(
    async (id: string) => {
      try {
        const db = getDb();
        await db.runAsync('UPDATE personal_prayers SET is_answered = 1 WHERE id = ?', [id]);
        setData((current) => ({
          ...current,
          personal: current.personal.map((p) => (p.id === id ? { ...p, is_answered: 1 } : p)),
        }));
      } catch (e) {
        console.warn('[usePrayers] markAnswered error:', e);
      }
    },
    [setData]
  );

  const categories = useMemo(
    () => [...new Set(data.guided.map((p) => p.category))].sort(),
    [data.guided]
  );

  return {
    guided: data.guided,
    personal: data.personal,
    loading,
    categories,
    refresh,
    addPersonalPrayer,
    markAnswered,
  };
}
