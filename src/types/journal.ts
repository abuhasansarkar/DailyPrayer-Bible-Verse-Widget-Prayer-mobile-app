// ── Journal Types ─────────────────────────────────────────────────────────────

export type JournalEntryType = 'prayer' | 'gratitude' | 'reflection' | 'devotional';

export type MoodType =
  | 'grateful'
  | 'peaceful'
  | 'hopeful'
  | 'struggling'
  | 'anxious'
  | 'joyful'
  | 'sad'
  | 'neutral';

export const MoodEmoji: Record<MoodType, string> = {
  grateful: '🙏',
  peaceful: '🕊️',
  hopeful: '✨',
  struggling: '💪',
  anxious: '🤍',
  joyful: '😊',
  sad: '💙',
  neutral: '😌',
};

export interface JournalEntry {
  id: string;
  type: JournalEntryType;
  title?: string;
  body: string;
  mood?: MoodType;
  tags: string[];
  linkedVerseId?: string;
  linkedPrayerId?: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GratitudeEntry {
  id: string;
  items: string[];             // up to 3 gratitude items
  mood?: MoodType;
  additionalNote?: string;
  createdAt: string;
}

export interface DevotionalEntry {
  id: string;
  title: string;
  content: string;
  author?: string;
  date: string;
  type: 'morning' | 'evening';
  scriptureRef: string;
  scriptureText: string;
  isPremium: boolean;
  readingTime: number;         // in minutes
}
