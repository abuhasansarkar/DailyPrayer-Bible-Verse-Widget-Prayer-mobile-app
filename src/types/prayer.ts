// ── Prayer Types ──────────────────────────────────────────────────────────────

export type PrayerCategory =
  | 'morning'
  | 'evening'
  | 'gratitude'
  | 'peace'
  | 'anxiety'
  | 'strength'
  | 'healing'
  | 'family'
  | 'relationships'
  | 'forgiveness'
  | 'guidance'
  | 'protection'
  | 'work'
  | 'sleep'
  | 'difficult-times'
  | 'personal';

export interface GuidedPrayer {
  id: string;
  title: string;
  intro: string;
  body: string;
  category: PrayerCategory;
  scriptureRef: string;
  scriptureText: string;
  durationMinutes: number;
  isPremium: boolean;
  tags: string[];
  createdAt: string;
}

export interface PrayerCategoryMeta {
  id: PrayerCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
  gradient: [string, string];
}

export interface PersonalPrayer {
  id: string;
  title: string;
  body: string;
  category: PrayerCategory;
  isAnswered: boolean;
  answeredAt?: string;
  reminderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrayerReminder {
  id: string;
  title: string;
  time: string;              // "07:00"
  daysOfWeek: number[];      // 0=Sun, 1=Mon, ..., 6=Sat
  type: 'morning' | 'evening' | 'midday' | 'custom';
  isActive: boolean;
  soundEnabled: boolean;
  notificationId?: string;   // expo-notifications scheduled ID
  createdAt: string;
}

export interface ReminderTemplate {
  id: string;
  title: string;
  time: string;
  type: PrayerReminder['type'];
  icon: string;
  description: string;
}
