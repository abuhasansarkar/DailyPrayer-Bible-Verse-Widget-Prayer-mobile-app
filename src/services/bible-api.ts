/**
 * Bible API Service
 *
 * Priority order for fetching chapter content:
 *   1. Local SQLite cache (seeded data + previously fetched chapters)
 *   2. wldeh/bible-api via jsDelivr CDN (free, no API key)
 *   3. Offline fallback placeholder
 *
 * API docs: https://github.com/wldeh/bible-api
 */

const WLDEH_BIBLE_API_BASE = 'https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles';
const DEFAULT_BIBLE_VERSION = 'en-kjv';

interface WldehChapterVerse {
  book?: string;
  chapter?: string;
  verse: string;
  text: string;
}

interface WldehChapterResponse {
  data?: WldehChapterVerse[];
}

interface NormalizedBibleVerse {
  verse_number: number;
  text: string;
}

export interface BibleVersionInfo {
  id: string;
  name?: string;
  description?: string;
  language?: string;
  license?: string;
}

function normalizeBibleVersion(translation?: string): string {
  const configured = process.env.EXPO_PUBLIC_BIBLE_API_VERSION?.trim();
  if (configured) return configured;

  const key = translation?.trim().toUpperCase();
  const versions: Record<string, string> = {
    ASV: 'en-asv',
    KJV: 'en-kjv',
    AKJV: 'en-akjv',
    WEB: 'en-web',
  };

  return versions[key ?? ''] ?? DEFAULT_BIBLE_VERSION;
}

function slugifyBookName(book: string): string {
  return BOOK_SLUGS[book] ?? book
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeVerseText(text: string): string {
  return text
    .replace(/^\s*¶\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeChapterPayload(payload: WldehChapterResponse): NormalizedBibleVerse[] {
  const verses = payload.data ?? [];
  const byVerse = new Map<number, string>();

  for (const item of verses) {
    const verseNumber = Number.parseInt(item.verse, 10);
    const text = normalizeVerseText(item.text ?? '');
    if (Number.isFinite(verseNumber) && verseNumber > 0 && text && !byVerse.has(verseNumber)) {
      byVerse.set(verseNumber, text);
    }
  }

  return Array.from(byVerse.entries())
    .sort(([a], [b]) => a - b)
    .map(([verse_number, text]) => ({ verse_number, text }));
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = 12000): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      console.warn(`[BibleAPI] HTTP ${response.status} for ${url}`);
      return null;
    }
    return await response.json() as T;
  } catch (error) {
    console.warn('[BibleAPI] fetch failed:', error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchFromWldehBibleApi(
  book: string,
  chapter: number,
  translation?: string
): Promise<NormalizedBibleVerse[] | null> {
  const version = normalizeBibleVersion(translation);
  const bookSlug = slugifyBookName(book);
  const url = `${WLDEH_BIBLE_API_BASE}/${version}/books/${bookSlug}/chapters/${chapter}.json`;
  const payload = await fetchJsonWithTimeout<WldehChapterResponse>(url);
  if (!payload) return null;

  const verses = normalizeChapterPayload(payload);
  return verses.length > 0 ? verses : null;
}

export async function fetchBibleChapter(
  book: string,
  chapter: number,
  translation?: string
): Promise<NormalizedBibleVerse[]> {
  const version = normalizeBibleVersion(translation);

  try {
    const { getDb } = await import('@/db/client');
    const db = getDb();

    const localVerses = await db.getAllAsync<NormalizedBibleVerse>(
      'SELECT verse_number, text FROM verses WHERE book = ? AND chapter = ? AND translation = ? ORDER BY verse_number ASC',
      [book, chapter, version.toUpperCase()]
    );

    if (localVerses.length > 0) {
      return localVerses;
    }

    const remoteVerses = await fetchFromWldehBibleApi(book, chapter, translation);
    if (remoteVerses && remoteVerses.length > 0) {
      await cacheChapter(db, book, chapter, version, remoteVerses);
      return remoteVerses;
    }

    return [{
      verse_number: 1,
      text: `${book} chapter ${chapter} is not yet available offline. Connect to the internet to load this chapter.`,
    }];
  } catch (error) {
    console.warn('[BibleAPI] fetchBibleChapter error:', error);
    return [{
      verse_number: 1,
      text: 'Unable to load this chapter. Please try again.',
    }];
  }
}

async function cacheChapter(
  db: any,
  book: string,
  chapter: number,
  version: string,
  verses: NormalizedBibleVerse[]
): Promise<void> {
  try {
    const translation = version.toUpperCase();
    for (const verse of verses) {
      const id = `${slugifyBookName(book)}-${chapter}-${verse.verse_number}-${version}`;
      const reference = `${book} ${chapter}:${verse.verse_number}`;
      await db.runAsync(
        `INSERT OR REPLACE INTO verses (id, reference, text, book, chapter, verse_number, translation, is_featured)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        [id, reference, verse.text, book, chapter, verse.verse_number, translation]
      );
    }
  } catch (error) {
    console.warn('[BibleAPI] cacheChapter error:', error);
  }
}

export async function fetchSupportedBibleVersions(): Promise<BibleVersionInfo[]> {
  const payload = await fetchJsonWithTimeout<unknown>(`${WLDEH_BIBLE_API_BASE}/bibles.json`);
  if (!Array.isArray(payload)) return [];
  return payload.filter((item): item is BibleVersionInfo => {
    return Boolean(item && typeof item === 'object' && 'id' in item && typeof (item as BibleVersionInfo).id === 'string');
  });
}

export async function searchBibleVerses(query: string, limit = 20): Promise<Array<{
  id: string; reference: string; text: string; book: string;
}>> {
  if (!query.trim()) return [];

  try {
    const { getDb } = await import('@/db/client');
    const db = getDb();
    return await db.getAllAsync<{ id: string; reference: string; text: string; book: string }>(
      `SELECT id, reference, text, book FROM verses
       WHERE text LIKE ? OR reference LIKE ?
       ORDER BY book, chapter, verse_number
       LIMIT ?`,
      [`%${query}%`, `%${query}%`, limit]
    );
  } catch (error) {
    console.warn('[BibleAPI] searchBibleVerses error:', error);
    return [];
  }
}

const BOOK_SLUGS: Record<string, string> = {
  Genesis: 'genesis',
  Exodus: 'exodus',
  Leviticus: 'leviticus',
  Numbers: 'numbers',
  Deuteronomy: 'deuteronomy',
  Joshua: 'joshua',
  Judges: 'judges',
  Ruth: 'ruth',
  '1 Samuel': '1-samuel',
  '2 Samuel': '2-samuel',
  '1 Kings': '1-kings',
  '2 Kings': '2-kings',
  '1 Chronicles': '1-chronicles',
  '2 Chronicles': '2-chronicles',
  Ezra: 'ezra',
  Nehemiah: 'nehemiah',
  Esther: 'esther',
  Job: 'job',
  Psalms: 'psalms',
  Proverbs: 'proverbs',
  Ecclesiastes: 'ecclesiastes',
  'Song of Solomon': 'song-of-solomon',
  Isaiah: 'isaiah',
  Jeremiah: 'jeremiah',
  Lamentations: 'lamentations',
  Ezekiel: 'ezekiel',
  Daniel: 'daniel',
  Hosea: 'hosea',
  Joel: 'joel',
  Amos: 'amos',
  Obadiah: 'obadiah',
  Jonah: 'jonah',
  Micah: 'micah',
  Nahum: 'nahum',
  Habakkuk: 'habakkuk',
  Zephaniah: 'zephaniah',
  Haggai: 'haggai',
  Zechariah: 'zechariah',
  Malachi: 'malachi',
  Matthew: 'matthew',
  Mark: 'mark',
  Luke: 'luke',
  John: 'john',
  Acts: 'acts',
  Romans: 'romans',
  '1 Corinthians': '1-corinthians',
  '2 Corinthians': '2-corinthians',
  Galatians: 'galatians',
  Ephesians: 'ephesians',
  Philippians: 'philippians',
  Colossians: 'colossians',
  '1 Thessalonians': '1-thessalonians',
  '2 Thessalonians': '2-thessalonians',
  '1 Timothy': '1-timothy',
  '2 Timothy': '2-timothy',
  Titus: 'titus',
  Philemon: 'philemon',
  Hebrews: 'hebrews',
  James: 'james',
  '1 Peter': '1-peter',
  '2 Peter': '2-peter',
  '1 John': '1-john',
  '2 John': '2-john',
  '3 John': '3-john',
  Jude: 'jude',
  Revelation: 'revelation',
};