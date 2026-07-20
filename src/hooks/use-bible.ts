import { useEffect, useState, useCallback } from 'react';
import { getDb } from '@/db/client';

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

export interface BibleBook {
  name: string;
  abbreviation: string;
  testament: 'OT' | 'NT';
  chapterCount: number;
}

// All 66 canonical books with chapter counts
export const BIBLE_BOOKS: BibleBook[] = [
  // Old Testament
  { name: 'Genesis', abbreviation: 'Gen', testament: 'OT', chapterCount: 50 },
  { name: 'Exodus', abbreviation: 'Exod', testament: 'OT', chapterCount: 40 },
  { name: 'Leviticus', abbreviation: 'Lev', testament: 'OT', chapterCount: 27 },
  { name: 'Numbers', abbreviation: 'Num', testament: 'OT', chapterCount: 36 },
  { name: 'Deuteronomy', abbreviation: 'Deut', testament: 'OT', chapterCount: 34 },
  { name: 'Joshua', abbreviation: 'Josh', testament: 'OT', chapterCount: 24 },
  { name: 'Judges', abbreviation: 'Judg', testament: 'OT', chapterCount: 21 },
  { name: 'Ruth', abbreviation: 'Ruth', testament: 'OT', chapterCount: 4 },
  { name: '1 Samuel', abbreviation: '1Sam', testament: 'OT', chapterCount: 31 },
  { name: '2 Samuel', abbreviation: '2Sam', testament: 'OT', chapterCount: 24 },
  { name: '1 Kings', abbreviation: '1Kgs', testament: 'OT', chapterCount: 22 },
  { name: '2 Kings', abbreviation: '2Kgs', testament: 'OT', chapterCount: 25 },
  { name: '1 Chronicles', abbreviation: '1Chr', testament: 'OT', chapterCount: 29 },
  { name: '2 Chronicles', abbreviation: '2Chr', testament: 'OT', chapterCount: 36 },
  { name: 'Ezra', abbreviation: 'Ezra', testament: 'OT', chapterCount: 10 },
  { name: 'Nehemiah', abbreviation: 'Neh', testament: 'OT', chapterCount: 13 },
  { name: 'Esther', abbreviation: 'Esth', testament: 'OT', chapterCount: 10 },
  { name: 'Job', abbreviation: 'Job', testament: 'OT', chapterCount: 42 },
  { name: 'Psalms', abbreviation: 'Ps', testament: 'OT', chapterCount: 150 },
  { name: 'Proverbs', abbreviation: 'Prov', testament: 'OT', chapterCount: 31 },
  { name: 'Ecclesiastes', abbreviation: 'Eccl', testament: 'OT', chapterCount: 12 },
  { name: 'Song of Solomon', abbreviation: 'Song', testament: 'OT', chapterCount: 8 },
  { name: 'Isaiah', abbreviation: 'Isa', testament: 'OT', chapterCount: 66 },
  { name: 'Jeremiah', abbreviation: 'Jer', testament: 'OT', chapterCount: 52 },
  { name: 'Lamentations', abbreviation: 'Lam', testament: 'OT', chapterCount: 5 },
  { name: 'Ezekiel', abbreviation: 'Ezek', testament: 'OT', chapterCount: 48 },
  { name: 'Daniel', abbreviation: 'Dan', testament: 'OT', chapterCount: 12 },
  { name: 'Hosea', abbreviation: 'Hos', testament: 'OT', chapterCount: 14 },
  { name: 'Joel', abbreviation: 'Joel', testament: 'OT', chapterCount: 3 },
  { name: 'Amos', abbreviation: 'Amos', testament: 'OT', chapterCount: 9 },
  { name: 'Obadiah', abbreviation: 'Obad', testament: 'OT', chapterCount: 1 },
  { name: 'Jonah', abbreviation: 'Jonah', testament: 'OT', chapterCount: 4 },
  { name: 'Micah', abbreviation: 'Mic', testament: 'OT', chapterCount: 7 },
  { name: 'Nahum', abbreviation: 'Nah', testament: 'OT', chapterCount: 3 },
  { name: 'Habakkuk', abbreviation: 'Hab', testament: 'OT', chapterCount: 3 },
  { name: 'Zephaniah', abbreviation: 'Zeph', testament: 'OT', chapterCount: 3 },
  { name: 'Haggai', abbreviation: 'Hag', testament: 'OT', chapterCount: 2 },
  { name: 'Zechariah', abbreviation: 'Zech', testament: 'OT', chapterCount: 14 },
  { name: 'Malachi', abbreviation: 'Mal', testament: 'OT', chapterCount: 4 },
  // New Testament
  { name: 'Matthew', abbreviation: 'Matt', testament: 'NT', chapterCount: 28 },
  { name: 'Mark', abbreviation: 'Mark', testament: 'NT', chapterCount: 16 },
  { name: 'Luke', abbreviation: 'Luke', testament: 'NT', chapterCount: 24 },
  { name: 'John', abbreviation: 'John', testament: 'NT', chapterCount: 21 },
  { name: 'Acts', abbreviation: 'Acts', testament: 'NT', chapterCount: 28 },
  { name: 'Romans', abbreviation: 'Rom', testament: 'NT', chapterCount: 16 },
  { name: '1 Corinthians', abbreviation: '1Cor', testament: 'NT', chapterCount: 16 },
  { name: '2 Corinthians', abbreviation: '2Cor', testament: 'NT', chapterCount: 13 },
  { name: 'Galatians', abbreviation: 'Gal', testament: 'NT', chapterCount: 6 },
  { name: 'Ephesians', abbreviation: 'Eph', testament: 'NT', chapterCount: 6 },
  { name: 'Philippians', abbreviation: 'Phil', testament: 'NT', chapterCount: 4 },
  { name: 'Colossians', abbreviation: 'Col', testament: 'NT', chapterCount: 4 },
  { name: '1 Thessalonians', abbreviation: '1Thess', testament: 'NT', chapterCount: 5 },
  { name: '2 Thessalonians', abbreviation: '2Thess', testament: 'NT', chapterCount: 3 },
  { name: '1 Timothy', abbreviation: '1Tim', testament: 'NT', chapterCount: 6 },
  { name: '2 Timothy', abbreviation: '2Tim', testament: 'NT', chapterCount: 4 },
  { name: 'Titus', abbreviation: 'Titus', testament: 'NT', chapterCount: 3 },
  { name: 'Philemon', abbreviation: 'Phlm', testament: 'NT', chapterCount: 1 },
  { name: 'Hebrews', abbreviation: 'Heb', testament: 'NT', chapterCount: 13 },
  { name: 'James', abbreviation: 'Jas', testament: 'NT', chapterCount: 5 },
  { name: '1 Peter', abbreviation: '1Pet', testament: 'NT', chapterCount: 5 },
  { name: '2 Peter', abbreviation: '2Pet', testament: 'NT', chapterCount: 3 },
  { name: '1 John', abbreviation: '1John', testament: 'NT', chapterCount: 5 },
  { name: '2 John', abbreviation: '2John', testament: 'NT', chapterCount: 1 },
  { name: '3 John', abbreviation: '3John', testament: 'NT', chapterCount: 1 },
  { name: 'Jude', abbreviation: 'Jude', testament: 'NT', chapterCount: 1 },
  { name: 'Revelation', abbreviation: 'Rev', testament: 'NT', chapterCount: 22 },
];

export function useBible(book?: string, chapter?: number) {
  const [chapterData, setChapterData] = useState<BibleChapter | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChapter = useCallback(async (bookName: string, chapterNum: number) => {
    try {
      setLoading(true);
      setError(null);
      const db = getDb();

      // Try loading from local DB (seeded verses)
      const verses = await db.getAllAsync<{ verse_number: number; text: string }>(
        'SELECT verse_number, text FROM verses WHERE book = ? AND chapter = ? ORDER BY verse_number ASC',
        [bookName, chapterNum]
      );

      const bookInfo = BIBLE_BOOKS.find((b) => b.name === bookName);
      const totalChapters = bookInfo?.chapterCount ?? 1;

      if (verses.length > 0) {
        setChapterData({ book: bookName, chapter: chapterNum, verses, totalChapters });
      } else {
        const { fetchBibleChapter } = await import('@/services/bible-api');
        const apiVerses = await fetchBibleChapter(bookName, chapterNum);
        setChapterData({
          book: bookName,
          chapter: chapterNum,
          verses: apiVerses,
          totalChapters,
        });
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load chapter');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchVerses = useCallback(async (query: string, limit = 30) => {
    if (!query.trim()) return [];
    try {
      const db = getDb();
      const results = await db.getAllAsync<{
        id: string; reference: string; text: string; book: string; chapter: number;
      }>(
        `SELECT id, reference, text, book, chapter FROM verses
         WHERE text LIKE ? OR reference LIKE ?
         ORDER BY book, chapter LIMIT ?`,
        [`%${query}%`, `%${query}%`, limit]
      );
      return results;
    } catch (e) {
      console.warn('[useBible] searchVerses error:', e);
      return [];
    }
  }, []);

  useEffect(() => {
    if (book && chapter) loadChapter(book, chapter);
  }, [book, chapter, loadChapter]);

  return { chapterData, loading, error, loadChapter, searchVerses, books: BIBLE_BOOKS };
}
