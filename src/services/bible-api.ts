/**
 * Bible API Service
 *
 * Priority order for fetching chapter content:
 *   1. Local SQLite cache (seeded data + previously fetched chapters)
 *   2. bible.api.bible (free, requires API key in EXPO_PUBLIC_BIBLE_API_KEY)
 *   3. Offline fallback placeholder
 *
 * To enable: add EXPO_PUBLIC_BIBLE_API_KEY to your .env
 * Free key available at: https://scripture.api.bible
 */

const BIBLE_API_BASE = 'https://api.scripture.api.bible/v1';
const BIBLE_API_KEY = process.env.EXPO_PUBLIC_BIBLE_API_KEY ?? '';

// NIV Bible ID on api.bible (most popular)
const BIBLE_ID = '78a9f6124f344018-01'; // NIV
const FALLBACK_BIBLE_ID = '9879dbb7cfe39e4d-01'; // KJV (always public)

interface ApiBibleVerse {
  id: string;
  reference: string;
  content: string;
  number: string;
}

interface ApiBibleChapterResponse {
  data: {
    id: string;
    reference: string;
    content: string;
    verses: ApiBibleVerse[];
  };
}

// ── API Bible client ───────────────────────────────────────────────────────────

async function fetchFromApiBible(book: string, chapter: number): Promise<
  Array<{ verse_number: number; text: string }> | null
> {
  if (!BIBLE_API_KEY) return null;

  try {
    // Map book name → USFM book code
    const bookCode = BOOK_CODES[book];
    if (!bookCode) return null;

    const chapterId = `${bookCode}.${chapter}`;
    const url = `${BIBLE_API_BASE}/bibles/${BIBLE_ID}/chapters/${chapterId}?content-type=text&include-verse-numbers=true&include-verse-spans=false`;

    const res = await fetch(url, {
      headers: { 'api-key': BIBLE_API_KEY },
    });

    if (!res.ok) {
      console.warn(`[BibleAPI] HTTP ${res.status} for ${book} ${chapter}`);
      return null;
    }

    const json: ApiBibleChapterResponse = await res.json();
    const content = json.data?.content ?? '';

    // Parse verse content from text format
    const lines = content.split('\n').filter((l) => l.trim());
    const verses: Array<{ verse_number: number; text: string }> = [];

    let currentVerse = 0;
    let currentText = '';

    for (const line of lines) {
      const verseMatch = line.match(/^\[(\d+)\]/);
      if (verseMatch) {
        if (currentVerse > 0 && currentText.trim()) {
          verses.push({ verse_number: currentVerse, text: currentText.trim() });
        }
        currentVerse = parseInt(verseMatch[1]!, 10);
        currentText = line.replace(/^\[\d+\]/, '').trim();
      } else {
        currentText += ' ' + line.trim();
      }
    }
    if (currentVerse > 0 && currentText.trim()) {
      verses.push({ verse_number: currentVerse, text: currentText.trim() });
    }

    return verses.length > 0 ? verses : null;
  } catch (e) {
    console.warn('[BibleAPI] fetchFromApiBible error:', e);
    return null;
  }
}

// ── Main exported function ─────────────────────────────────────────────────────

export async function fetchBibleChapter(
  book: string,
  chapter: number
): Promise<Array<{ verse_number: number; text: string }>> {
  try {
    // 1. Try local SQLite cache first
    const { getDb } = await import('@/db/client');
    const db = getDb();

    const localVerses = await db.getAllAsync<{ verse_number: number; text: string }>(
      'SELECT verse_number, text FROM verses WHERE book = ? AND chapter = ? ORDER BY verse_number ASC',
      [book, chapter]
    );

    if (localVerses.length > 0) {
      return localVerses;
    }

    // 2. Try API Bible
    const apiVerses = await fetchFromApiBible(book, chapter);
    if (apiVerses && apiVerses.length > 0) {
      // Cache in SQLite for offline use
      await cacheChapter(db, book, chapter, apiVerses);
      return apiVerses;
    }

    // 3. Offline fallback
    return [{
      verse_number: 1,
      text: `${book} chapter ${chapter} is not yet available offline. Connect to the internet to load this chapter.`,
    }];
  } catch (e) {
    console.warn('[BibleAPI] fetchBibleChapter error:', e);
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
  verses: Array<{ verse_number: number; text: string }>
): Promise<void> {
  try {
    for (const verse of verses) {
      const id = `${book.toLowerCase().replace(/\s/g, '-')}-${chapter}-${verse.verse_number}`;
      const reference = `${book} ${chapter}:${verse.verse_number}`;
      await db.runAsync(
        `INSERT OR IGNORE INTO verses (id, reference, text, book, chapter, verse_number, translation, is_featured)
         VALUES (?, ?, ?, ?, ?, ?, 'NIV', 0)`,
        [id, reference, verse.text, book, chapter, verse.verse_number]
      );
    }
  } catch (e) {
    console.warn('[BibleAPI] cacheChapter error:', e);
  }
}

// ── Search verses via API ──────────────────────────────────────────────────────

export async function searchBibleVerses(query: string, limit = 20): Promise<Array<{
  id: string; reference: string; text: string; book: string;
}>> {
  if (!BIBLE_API_KEY || !query.trim()) return [];

  try {
    const url = `${BIBLE_API_BASE}/bibles/${BIBLE_ID}/search?query=${encodeURIComponent(query)}&limit=${limit}&sort=relevance`;
    const res = await fetch(url, { headers: { 'api-key': BIBLE_API_KEY } });

    if (!res.ok) return [];

    const json = await res.json();
    return (json.data?.verses ?? []).map((v: any) => ({
      id: v.id,
      reference: v.reference,
      text: v.text?.replace(/<[^>]+>/g, '').trim() ?? '',
      book: v.bookId,
    }));
  } catch (e) {
    console.warn('[BibleAPI] searchBibleVerses error:', e);
    return [];
  }
}

// ── USFM book code map ─────────────────────────────────────────────────────────

const BOOK_CODES: Record<string, string> = {
  'Genesis': 'GEN', 'Exodus': 'EXO', 'Leviticus': 'LEV', 'Numbers': 'NUM',
  'Deuteronomy': 'DEU', 'Joshua': 'JOS', 'Judges': 'JDG', 'Ruth': 'RUT',
  '1 Samuel': '1SA', '2 Samuel': '2SA', '1 Kings': '1KI', '2 Kings': '2KI',
  '1 Chronicles': '1CH', '2 Chronicles': '2CH', 'Ezra': 'EZR', 'Nehemiah': 'NEH',
  'Esther': 'EST', 'Job': 'JOB', 'Psalms': 'PSA', 'Proverbs': 'PRO',
  'Ecclesiastes': 'ECC', 'Song of Solomon': 'SNG', 'Isaiah': 'ISA', 'Jeremiah': 'JER',
  'Lamentations': 'LAM', 'Ezekiel': 'EZK', 'Daniel': 'DAN', 'Hosea': 'HOS',
  'Joel': 'JOL', 'Amos': 'AMO', 'Obadiah': 'OBA', 'Jonah': 'JON',
  'Micah': 'MIC', 'Nahum': 'NAM', 'Habakkuk': 'HAB', 'Zephaniah': 'ZEP',
  'Haggai': 'HAG', 'Zechariah': 'ZEC', 'Malachi': 'MAL',
  'Matthew': 'MAT', 'Mark': 'MRK', 'Luke': 'LUK', 'John': 'JHN',
  'Acts': 'ACT', 'Romans': 'ROM', '1 Corinthians': '1CO', '2 Corinthians': '2CO',
  'Galatians': 'GAL', 'Ephesians': 'EPH', 'Philippians': 'PHP', 'Colossians': 'COL',
  '1 Thessalonians': '1TH', '2 Thessalonians': '2TH', '1 Timothy': '1TI', '2 Timothy': '2TI',
  'Titus': 'TIT', 'Philemon': 'PHM', 'Hebrews': 'HEB', 'James': 'JAS',
  '1 Peter': '1PE', '2 Peter': '2PE', '1 John': '1JN', '2 John': '2JN',
  '3 John': '3JN', 'Jude': 'JUD', 'Revelation': 'REV',
};
