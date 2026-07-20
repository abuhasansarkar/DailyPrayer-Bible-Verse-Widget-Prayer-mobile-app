import { useEffect, useState, useCallback } from 'react';
import { getDb } from '@/db/client';

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

export function usePrayers(category?: string) {
  const [guided, setGuided] = useState<GuidedPrayer[]>([]);
  const [personal, setPersonal] = useState<PersonalPrayer[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const db = getDb();

      const guidedQuery = category
        ? 'SELECT id, title, category, duration_minutes, is_premium, intro, body, scripture_ref FROM guided_prayers WHERE category = ? ORDER BY title'
        : 'SELECT id, title, category, duration_minutes, is_premium, intro, body, scripture_ref FROM guided_prayers ORDER BY category, title';

      const guidedRows = category
        ? await db.getAllAsync<GuidedPrayer>(guidedQuery, [category])
        : await db.getAllAsync<GuidedPrayer>(guidedQuery);

      const personalRows = await db.getAllAsync<PersonalPrayer>(
        'SELECT id, title, body, category, is_answered, created_at FROM personal_prayers ORDER BY created_at DESC'
      );

      setGuided(guidedRows);
      setPersonal(personalRows);
    } catch (e) {
      console.warn('[usePrayers] error:', e);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => { load(); }, [load]);

  const addPersonalPrayer = useCallback(async (title: string, body: string, prayerCategory?: string) => {
    try {
      const db = getDb();
      const id = `prayer-${Date.now()}`;
      await db.runAsync(
        'INSERT INTO personal_prayers (id, title, body, category, is_answered, created_at) VALUES (?, ?, ?, ?, 0, datetime("now"))',
        [id, title, body, prayerCategory ?? null]
      );
      await load();
      return id;
    } catch (e) {
      console.warn('[usePrayers] addPersonalPrayer error:', e);
      return null;
    }
  }, [load]);

  const markAnswered = useCallback(async (id: string) => {
    try {
      const db = getDb();
      await db.runAsync('UPDATE personal_prayers SET is_answered = 1 WHERE id = ?', [id]);
      setPersonal((prev) => prev.map((p) => p.id === id ? { ...p, is_answered: 1 } : p));
    } catch (e) {
      console.warn('[usePrayers] markAnswered error:', e);
    }
  }, []);

  const categories = [...new Set(guided.map((p) => p.category))].sort();

  return { guided, personal, loading, categories, refresh: load, addPersonalPrayer, markAnswered };
}
