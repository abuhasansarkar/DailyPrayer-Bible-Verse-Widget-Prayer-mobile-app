export interface BibleBook {
  name: string;
  slug: string;
  chapters: number;
  testament?: 'OT' | 'NT';
}

export const BIBLE_BOOKS: BibleBook[] = [
  // Old Testament
  { name: "Genesis", slug: "genesis", chapters: 50, testament: "OT" },
  { name: "Exodus", slug: "exodus", chapters: 40, testament: "OT" },
  { name: "Leviticus", slug: "leviticus", chapters: 27, testament: "OT" },
  { name: "Numbers", slug: "numbers", chapters: 36, testament: "OT" },
  { name: "Deuteronomy", slug: "deuteronomy", chapters: 34, testament: "OT" },
  { name: "Joshua", slug: "joshua", chapters: 24, testament: "OT" },
  { name: "Judges", slug: "judges", chapters: 21, testament: "OT" },
  { name: "Ruth", slug: "ruth", chapters: 4, testament: "OT" },
  { name: "1 Samuel", slug: "1samuel", chapters: 31, testament: "OT" },
  { name: "2 Samuel", slug: "2samuel", chapters: 24, testament: "OT" },
  { name: "1 Kings", slug: "1kings", chapters: 22, testament: "OT" },
  { name: "2 Kings", slug: "2kings", chapters: 25, testament: "OT" },
  { name: "1 Chronicles", slug: "1chronicles", chapters: 29, testament: "OT" },
  { name: "2 Chronicles", slug: "2chronicles", chapters: 36, testament: "OT" },
  { name: "Ezra", slug: "ezra", chapters: 10, testament: "OT" },
  { name: "Nehemiah", slug: "nehemiah", chapters: 13, testament: "OT" },
  { name: "Esther", slug: "esther", chapters: 10, testament: "OT" },
  { name: "Job", slug: "job", chapters: 42, testament: "OT" },
  { name: "Psalms", slug: "psalms", chapters: 150, testament: "OT" },
  { name: "Proverbs", slug: "proverbs", chapters: 31, testament: "OT" },
  { name: "Ecclesiastes", slug: "ecclesiastes", chapters: 12, testament: "OT" },
  { name: "Song of Solomon", slug: "songofsolomon", chapters: 8, testament: "OT" },
  { name: "Isaiah", slug: "isaiah", chapters: 66, testament: "OT" },
  { name: "Jeremiah", slug: "jeremiah", chapters: 52, testament: "OT" },
  { name: "Lamentations", slug: "lamentations", chapters: 5, testament: "OT" },
  { name: "Ezekiel", slug: "ezekiel", chapters: 48, testament: "OT" },
  { name: "Daniel", slug: "daniel", chapters: 12, testament: "OT" },
  { name: "Hosea", slug: "hosea", chapters: 14, testament: "OT" },
  { name: "Joel", slug: "joel", chapters: 3, testament: "OT" },
  { name: "Amos", slug: "amos", chapters: 9, testament: "OT" },
  { name: "Obadiah", slug: "obadiah", chapters: 1, testament: "OT" },
  { name: "Jonah", slug: "jonah", chapters: 4, testament: "OT" },
  { name: "Micah", slug: "micah", chapters: 7, testament: "OT" },
  { name: "Nahum", slug: "nahum", chapters: 3, testament: "OT" },
  { name: "Habakkuk", slug: "habakkuk", chapters: 3, testament: "OT" },
  { name: "Zephaniah", slug: "zephaniah", chapters: 3, testament: "OT" },
  { name: "Haggai", slug: "haggai", chapters: 2, testament: "OT" },
  { name: "Zechariah", slug: "zechariah", chapters: 14, testament: "OT" },
  { name: "Malachi", slug: "malachi", chapters: 4, testament: "OT" },

  // New Testament
  { name: "Matthew", slug: "matthew", chapters: 28, testament: "NT" },
  { name: "Mark", slug: "mark", chapters: 16, testament: "NT" },
  { name: "Luke", slug: "luke", chapters: 24, testament: "NT" },
  { name: "John", slug: "john", chapters: 21, testament: "NT" },
  { name: "Acts", slug: "acts", chapters: 28, testament: "NT" },
  { name: "Romans", slug: "romans", chapters: 16, testament: "NT" },
  { name: "1 Corinthians", slug: "1corinthians", chapters: 16, testament: "NT" },
  { name: "2 Corinthians", slug: "2corinthians", chapters: 13, testament: "NT" },
  { name: "Galatians", slug: "galatians", chapters: 6, testament: "NT" },
  { name: "Ephesians", slug: "ephesians", chapters: 6, testament: "NT" },
  { name: "Philippians", slug: "philippians", chapters: 4, testament: "NT" },
  { name: "Colossians", slug: "colossians", chapters: 4, testament: "NT" },
  { name: "1 Thessalonians", slug: "1thessalonians", chapters: 5, testament: "NT" },
  { name: "2 Thessalonians", slug: "2thessalonians", chapters: 3, testament: "NT" },
  { name: "1 Timothy", slug: "1timothy", chapters: 6, testament: "NT" },
  { name: "2 Timothy", slug: "2timothy", chapters: 4, testament: "NT" },
  { name: "Titus", slug: "titus", chapters: 3, testament: "NT" },
  { name: "Philemon", slug: "philemon", chapters: 1, testament: "NT" },
  { name: "Hebrews", slug: "hebrews", chapters: 13, testament: "NT" },
  { name: "James", slug: "james", chapters: 5, testament: "NT" },
  { name: "1 Peter", slug: "1peter", chapters: 5, testament: "NT" },
  { name: "2 Peter", slug: "2peter", chapters: 3, testament: "NT" },
  { name: "1 John", slug: "1john", chapters: 5, testament: "NT" },
  { name: "2 John", slug: "2john", chapters: 1, testament: "NT" },
  { name: "3 John", slug: "3john", chapters: 1, testament: "NT" },
  { name: "Jude", slug: "jude", chapters: 1, testament: "NT" },
  { name: "Revelation", slug: "revelation", chapters: 22, testament: "NT" },
];

export function getBookSlug(bookName: string): string {
  if (!bookName) return '';
  const normalized = bookName.trim().toLowerCase();
  const match = BIBLE_BOOKS.find(
    (b) => b.name.toLowerCase() === normalized || b.slug === normalized
  );
  return match ? match.slug : normalized.replace(/\s+/g, '');
}

