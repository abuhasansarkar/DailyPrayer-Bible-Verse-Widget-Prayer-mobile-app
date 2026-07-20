import { create } from 'zustand';
import { DayActivity, StreakData, StreakMilestone, MilestoneDay } from '@/types/user';
import type { StreakActivity } from '@/types/user';

// ─────────────────────────────────────────────────────────────────────────────
// User Store — profile, streak, favorites
// ─────────────────────────────────────────────────────────────────────────────

interface UserState {
  displayName: string;
  avatarUri?: string;
  streak: StreakData;
  milestones: StreakMilestone[];
  favoriteIds: Set<string>;   // "type:id" keys

  setProfile: (name: string, avatarUri?: string) => void;
  setStreak: (streak: StreakData) => void;
  recordActivity: (activity: StreakActivity) => void;
  toggleFavorite: (type: string, id: string) => void;
  isFavorite: (type: string, id: string) => boolean;
  checkMilestone: () => StreakMilestone | null;
}

const MILESTONE_DATA: Record<MilestoneDay, { title: string; message: string; icon: string }> = {
  3:   { title: '3-Day Journey',    message: 'You\'ve taken three faithful steps. Every great journey begins this way.', icon: '🌱' },
  7:   { title: 'A Faithful Week',  message: 'Seven days of showing up. Your consistency is growing something beautiful.', icon: '🌟' },
  14:  { title: 'Two Weeks Strong', message: 'Fourteen days. A habit is forming. God sees every quiet moment you\'ve given him.', icon: '🌿' },
  30:  { title: 'A Month of Grace', message: 'Thirty days of drawing closer. Your spiritual growth is real and meaningful.', icon: '🌸' },
  50:  { title: '50 Days of Faith', message: 'Fifty faithful days. You are building something that will last.', icon: '🔥' },
  100: { title: '100 Days!',        message: 'One hundred days with God. This is a remarkable act of devotion.', icon: '💛' },
  365: { title: 'A Year with God',  message: 'A full year of daily faith. You have built one of the most meaningful habits of your life.', icon: '👑' },
};

const buildMilestones = (currentStreak: number): StreakMilestone[] => {
  return (Object.entries(MILESTONE_DATA) as [string, (typeof MILESTONE_DATA)[MilestoneDay]][]).map(
    ([days, meta]) => ({
      days: Number(days) as MilestoneDay,
      ...meta,
      achieved: currentStreak >= Number(days),
      achievedAt: currentStreak >= Number(days) ? new Date().toISOString() : undefined,
    })
  );
};

const buildEmptyWeek = (): DayActivity[] => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d.toISOString().split('T')[0]!,
      activities: [],
      isComplete: false,
    };
  });
};

export const useUserStore = create<UserState>((set, get) => ({
  displayName: '',
  avatarUri: undefined,
  streak: {
    currentStreak: 0,
    longestStreak: 0,
    thisWeek: buildEmptyWeek(),
    totalDays: 0,
  },
  milestones: buildMilestones(0),
  favoriteIds: new Set(),

  setProfile: (name, avatarUri) => set({ displayName: name, avatarUri }),

  setStreak: (streak) =>
    set({ streak, milestones: buildMilestones(streak.currentStreak) }),

  recordActivity: (activity) => {
    const today = new Date().toISOString().split('T')[0]!;
    set((s) => {
      const week = s.streak.thisWeek.map((day) => {
        if (day.date !== today) return day;
        const activities = day.activities.includes(activity)
          ? day.activities
          : [...day.activities, activity];
        return { ...day, activities, isComplete: activities.length > 0 };
      });

      const todayDay = week.find((d) => d.date === today);
      const wasComplete = s.streak.thisWeek.find((d) => d.date === today)?.isComplete;
      const nowComplete = todayDay?.isComplete;

      let { currentStreak, longestStreak, totalDays } = s.streak;
      if (!wasComplete && nowComplete) {
        currentStreak += 1;
        totalDays += 1;
        if (currentStreak > longestStreak) longestStreak = currentStreak;
      }

      return {
        streak: { ...s.streak, thisWeek: week, currentStreak, longestStreak, totalDays, lastActivityDate: today },
        milestones: buildMilestones(currentStreak),
      };
    });
  },

  toggleFavorite: (type, id) => {
    const key = `${type}:${id}`;
    set((s) => {
      const next = new Set(s.favoriteIds);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { favoriteIds: next };
    });
  },

  isFavorite: (type, id) => get().favoriteIds.has(`${type}:${id}`),

  checkMilestone: () => {
    const { streak, milestones } = get();
    return milestones.find(
      (m) => m.achieved && m.days === streak.currentStreak
    ) ?? null;
  },
}));
