// ── Verse Types ───────────────────────────────────────────────────────────────

/**
 * Translations the app is licensed to display.
 *
 * All three are public domain. Modern translations (NIV, ESV, NLT, CSB, NKJV,
 * MSG, AMP) are copyrighted and cannot be redistributed without a licence
 * agreement from their publishers — do not add them here without one.
 */
export type BibleTranslation = 'KJV' | 'ASV' | 'WEB';

export const BIBLE_TRANSLATIONS: readonly {
  id: BibleTranslation;
  name: string;
  apiVersion: string;
}[] = [
  { id: 'KJV', name: 'King James Version', apiVersion: 'en-kjv' },
  { id: 'ASV', name: 'American Standard Version', apiVersion: 'en-asv' },
  { id: 'WEB', name: 'World English Bible', apiVersion: 'en-web' },
] as const;

export type BibleBook =
  | 'Genesis' | 'Exodus' | 'Leviticus' | 'Numbers' | 'Deuteronomy'
  | 'Joshua' | 'Judges' | 'Ruth' | '1 Samuel' | '2 Samuel'
  | '1 Kings' | '2 Kings' | '1 Chronicles' | '2 Chronicles' | 'Ezra'
  | 'Nehemiah' | 'Esther' | 'Job' | 'Psalms' | 'Proverbs'
  | 'Ecclesiastes' | 'Song of Solomon' | 'Isaiah' | 'Jeremiah' | 'Lamentations'
  | 'Ezekiel' | 'Daniel' | 'Hosea' | 'Joel' | 'Amos' | 'Obadiah'
  | 'Jonah' | 'Micah' | 'Nahum' | 'Habakkuk' | 'Zephaniah' | 'Haggai'
  | 'Zechariah' | 'Malachi' | 'Matthew' | 'Mark' | 'Luke' | 'John'
  | 'Acts' | 'Romans' | '1 Corinthians' | '2 Corinthians' | 'Galatians'
  | 'Ephesians' | 'Philippians' | 'Colossians' | '1 Thessalonians' | '2 Thessalonians'
  | '1 Timothy' | '2 Timothy' | 'Titus' | 'Philemon' | 'Hebrews' | 'James'
  | '1 Peter' | '2 Peter' | '1 John' | '2 John' | '3 John' | 'Jude' | 'Revelation';

export type TestamentType = 'OT' | 'NT';

export interface Verse {
  id: string;
  reference: string;           // "John 3:16"
  book: string;
  chapter: number;
  verseNumber: number;
  text: string;
  translation: BibleTranslation;
  topics: string[];            // topic slugs
  isFeatured: boolean;
  createdAt: string;
}

export interface DailyVerse {
  id: string;
  date: string;                // "2025-07-20"
  verseId: string;
  verse: Verse;
  reflection: string;
  prayer: string;
}

export interface VerseCollection {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  verseIds: string[];
  isPremium: boolean;
  createdAt: string;
}

export interface BibleChapter {
  book: string;
  chapter: number;
  translation: BibleTranslation;
  verses: Verse[];
}

export interface SearchResult {
  verse: Verse;
  matchType: 'reference' | 'keyword' | 'topic';
  highlight?: string;
}
