export interface BibleVerse {
  verse: string;
  text: string;
}

export interface BibleChapterVerse {
  book: string;
  chapter: string;
  verse: string;
  text: string;
}

export interface BibleChapterResponse {
  data: BibleChapterVerse[];
}

export interface BibleLanguage {
  name: string;
  code: string;
  level?: string;
}

export interface BibleCountry {
  name: string;
  code: string;
}

export interface BibleVersion {
  id: string;
  version: string;
  description?: string;
  scope?: string;
  language?: BibleLanguage;
  country?: BibleCountry;
  numeralSystem?: string;
  script?: string;
  copyright?: string;
  localVersionName?: string;
  localVersionAbbreviation?: string;
}
