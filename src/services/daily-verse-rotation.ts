import { getBibleVerse, normalizeBookSlug } from './bibleApi';

export interface DailyVerseItem {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
  topic?: string;
  date?: string;
}

export const CURATED_DAILY_VERSES: Array<{
  book: string;
  chapter: number;
  verse: number;
  text: string;
  topic: string;
}> = [
  { book: 'John', chapter: 3, verse: 16, text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.', topic: 'Love' },
  { book: 'Philippians', chapter: 4, verse: 13, text: 'I can do all things through Christ which strengtheneth me.', topic: 'Strength' },
  { book: 'Jeremiah', chapter: 29, verse: 11, text: 'For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.', topic: 'Hope' },
  { book: 'Psalm', chapter: 23, verse: 1, text: 'The LORD is my shepherd; I shall not want.', topic: 'Peace' },
  { book: 'Proverbs', chapter: 3, verse: 5, text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.', topic: 'Trust' },
  { book: 'Isaiah', chapter: 40, verse: 31, text: 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.', topic: 'Strength' },
  { book: 'Romans', chapter: 8, verse: 28, text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.', topic: 'Faith' },
  { book: 'Matthew', chapter: 6, verse: 33, text: 'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.', topic: 'Guidance' },
  { book: 'Joshua', chapter: 1, verse: 9, text: 'Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.', topic: 'Courage' },
  { book: '2 Timothy', chapter: 1, verse: 7, text: 'For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.', topic: 'Peace' },
  { book: 'Psalm', chapter: 46, verse: 10, text: 'Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth.', topic: 'Stillness' },
  { book: 'Proverbs', chapter: 16, verse: 3, text: 'Commit thy works unto the LORD, and thy thoughts shall be established.', topic: 'Wisdom' },
  { book: 'Romans', chapter: 12, verse: 2, text: 'And be not conformed to this world: but be ye transformed by the renewing of your mind.', topic: 'Renewal' },
  { book: '1 Corinthians', chapter: 13, verse: 4, text: 'Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up.', topic: 'Love' },
  { book: 'Galatians', chapter: 5, verse: 22, text: 'But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith.', topic: 'Fruit of Spirit' },
  { book: 'Ephesians', chapter: 2, verse: 8, text: 'For by grace are ye saved through faith; and that not of yourselves: it is the gift of God.', topic: 'Grace' },
  { book: 'Hebrews', chapter: 11, verse: 1, text: 'Now faith is the substance of things hoped for, the evidence of things not seen.', topic: 'Faith' },
  { book: '1 Peter', chapter: 5, verse: 7, text: 'Casting all your care upon him; for he careth for you.', topic: 'Peace' },
  { book: 'Psalm', chapter: 119, verse: 105, text: 'Thy word is a lamp unto my feet, and a light unto my path.', topic: 'Guidance' },
  { book: 'Matthew', chapter: 11, verse: 28, text: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.', topic: 'Rest' },
];

function getDeterministicIndex(dateStr: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % length;
}

export async function getDailyVerse(dateStr?: string): Promise<DailyVerseItem> {
  const targetDate = dateStr || new Date().toISOString().split('T')[0];
  const index = getDeterministicIndex(targetDate, CURATED_DAILY_VERSES.length);
  const selected = CURATED_DAILY_VERSES[index];

  try {
    const apiVerse = await getBibleVerse({
      book: selected.book,
      chapter: selected.chapter,
      verse: selected.verse,
      version: 'en-kjv',
    });

    if (apiVerse && apiVerse.text) {
      return {
        id: `${targetDate}-${normalizeBookSlug(selected.book)}-${selected.chapter}-${selected.verse}`,
        book: apiVerse.book_name || selected.book,
        chapter: selected.chapter,
        verse: selected.verse,
        text: apiVerse.text.replace(/^¶\s*/, '').trim(),
        translation: 'KJV',
        topic: selected.topic,
        date: targetDate,
      };
    }
  } catch (_e) {
    // Offline fallback
  }

  return {
    id: `${targetDate}-${selected.book}-${selected.chapter}-${selected.verse}`,
    book: selected.book,
    chapter: selected.chapter,
    verse: selected.verse,
    text: selected.text,
    translation: 'KJV',
    topic: selected.topic,
    date: targetDate,
  };
}

export * from './bibleApi';
