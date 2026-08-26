import { useCallback } from 'react';
import { getDb } from '@/db/client';
import { BIBLE_BOOKS } from '@/constants/bibleBooks';
import { useAsyncData } from './use-async-data';

// The canonical book list lives in @/constants/bibleBooks. This hook used to
// carry a second copy with a different field name (`chapterCount` vs
// `chapters`), which is why chapter counts rendered as undefined in places.
export { BIBLE_BOOKS };
export type { BibleBook } from '@/constants/bibleBooks';

export interface BibleVerse {
  verse_number: number;
  text: string;
}

export interface BibleChapter {
  book: string;
  chapter: number;
  verses: BibleVerse[];
  totalChapters: number;
}

async function loadChapterData(bookName: string, chapterNum: number): Promise<BibleChapter> {
  const db = getDb();

  // Prefer locally cached/seeded verses
  const verses = await db.getAllAsync<BibleVerse>(
    'SELECT verse_number, text FROM verses WHERE book = ? AND chapter = ? ORDER BY verse_number ASC',
    [bookName, chapterNum]
  );

  const bookInfo = BIBLE_BOOKS.find((b) => b.name === bookName);
  const totalChapters = bookInfo?.chapters ?? 1;

  if (verses.length > 0) {
    return { book: bookName, chapter: chapterNum, verses, totalChapters };
  }

  const { getBibleChapter, formatBibleText, getBookSlug } = await import('@/services/bibleApi');
  const apiVersesData = await getBibleChapter({
    version: 'en-kjv',
    book: getBookSlug(bookName),
    chapter: chapterNum,
  });

  return {
    book: bookName,
    chapter: chapterNum,
    totalChapters,
    verses: apiVersesData.map((item) => ({
      verse_number: parseInt(item.verse, 10),
      text: formatBibleText(item.text),
    })),
  };
}

export function useBible(book?: string, chapter?: number) {
  const key = book && chapter ? `${book}:${chapter}` : '';

  const fetchChapter = useCallback(async (): Promise<BibleChapter | null> => {
    if (!book || !chapter) return null;
    return loadChapterData(book, chapter);
  }, [book, chapter]);

  const { data: chapterData, loading, error, refresh } = useAsyncData<BibleChapter | null>(
    key,
    fetchChapter,
    null
  );

  const searchVerses = useCallback(async (query: string, limit = 30) => {
    const trimmed = query.trim();
    if (!trimmed) return [];
    try {
      const db = getDb();
      const sanitized = trimmed.replace(/[%_\\]/g, '\\$&');
      const results = await db.getAllAsync<{
        id: string; reference: string; text: string; book: string; chapter: number;
      }>(
        `SELECT id, reference, text, book, chapter FROM verses
         WHERE text LIKE ? ESCAPE '\\' OR reference LIKE ? ESCAPE '\\'
         ORDER BY book, chapter LIMIT ?`,
        [`%${sanitized}%`, `%${sanitized}%`, limit]
      );
      return results;
    } catch (e) {
      console.warn('[useBible] searchVerses error:', e);
      return [];
    }
  }, []);

  return {
    chapterData,
    // With no book/chapter selected there is nothing to wait for.
    loading: key ? loading : false,
    error,
    loadChapter: refresh,
    searchVerses,
    books: BIBLE_BOOKS,
  };
}
