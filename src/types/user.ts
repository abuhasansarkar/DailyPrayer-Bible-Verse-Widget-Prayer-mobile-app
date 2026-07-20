// ── User & App Types ──────────────────────────────────────────────────────────

import { BibleTranslation } from './verse';
import { PrayerCategory } from './prayer';

export type SpiritualGoal =
  | 'morning-devotion'
  | 'evening-reflection'
  | 'bible-reading'
  | 'daily-prayer'
  | 'gratitude'
  | 'verse-memorization'
  | 'faith-journaling';

export const GOAL_META: Record<SpiritualGoal, { label: string; icon: string; description: string }> = {
  'morning-devotion': { label: 'Morning Devotion', icon: '🌅', description: 'Start each day with Scripture' },
  'evening-reflection': { label: 'Evening Reflection', icon: '🌙', description: 'End the day with gratitude' },
  'bible-reading': { label: 'Bible Reading', icon: '📖', description: 'Read the Bible consistently' },
  'daily-prayer': { label: 'Daily Prayer', icon: '🙏', description: 'Maintain a regular prayer life' },
  'gratitude': { label: 'Gratitude Practice', icon: '✨', description: 'Cultivate a thankful heart' },
  'verse-memorization': { label: 'Verse Memorization', icon: '💡', description: 'Commit Scripture to memory' },
  'faith-journaling': { label: 'Faith Journaling', icon: '✍️', description: 'Reflect through writing' },
};

export type AppTheme = 'light' | 'dark' | 'system';

export interface UserPreferences {
  displayName?: string;
  avatarUri?: string;
  goals: SpiritualGoal[];
  preferredTranslation: BibleTranslation;
  preferredCategories: PrayerCategory[];
  appTheme: AppTheme;
  fontSize: 'small' | 'default' | 'large' | 'xlarge';
  reducedMotion: boolean;
  highContrast: boolean;
  language: string;           // BCP 47 language tag
  notificationsEnabled: boolean;
}

export interface UserProfile {
  id: string;
  email?: string;
  preferences: UserPreferences;
  createdAt: string;
  lastSeenAt: string;
}

export type StreakActivity = 'verse' | 'prayer' | 'reflection' | 'journal' | 'gratitude' | 'reminder-complete';

export interface DayActivity {
  date: string;               // "2025-07-20"
  activities: StreakActivity[];
  isComplete: boolean;        // at least 1 activity done
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate?: string;
  thisWeek: DayActivity[];    // last 7 days
  totalDays: number;
}

export type MilestoneDay = 3 | 7 | 14 | 30 | 50 | 100 | 365;

export interface StreakMilestone {
  days: MilestoneDay;
  title: string;
  message: string;
  icon: string;
  achieved: boolean;
  achievedAt?: string;
}

export interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  verseCount: number;
  prayerCount: number;
  isPremium: boolean;
}

export interface FavoriteItem {
  id: string;
  type: 'verse' | 'prayer' | 'devotional' | 'collection';
  refId: string;
  note?: string;
  createdAt: string;
}

export interface UserCollection {
  id: string;
  name: string;
  description?: string;
  emoji: string;
  itemIds: string[];
  itemType: 'verse' | 'prayer' | 'mixed';
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}
