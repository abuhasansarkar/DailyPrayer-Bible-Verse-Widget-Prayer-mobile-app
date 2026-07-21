import { create } from 'zustand';
import { subDays, format, parseISO, differenceInCalendarDays } from 'date-fns';
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
  recordActivity: (activity: StreakActivity) => Promise<void>;
  toggleFavorite: (type: string, id: string) => Promise<void>;
  isFavorite: (type: string, id: string) => boolean;
  checkMilestone: () => StreakMilestone | null;
  loadUserDataFromDb: () => Promise<void>;
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

const getIsoToday = (): string => format(new Date(), 'yyyy-MM-dd');

const buildEmptyWeek = (): DayActivity[] => {
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = subDays(now, 6 - i);
    return {
      date: format(d, 'yyyy-MM-dd'),
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

  recordActivity: async (activity) => {
    const today = getIsoToday();
    let todayActivities: StreakActivity[] = [];
    let isNowComplete = false;
    let activityAlreadyPresent = false;

    const currentTodayDay = get().streak.thisWeek.find((d) => d.date === today);
    if (currentTodayDay && currentTodayDay.activities.includes(activity)) {
      activityAlreadyPresent = true;
    }

    set((s) => {
      const week = s.streak.thisWeek.map((day) => {
        if (day.date !== today) return day;
        const activities = day.activities.includes(activity)
          ? day.activities
          : [...day.activities, activity];
        todayActivities = activities;
        return { ...day, activities, isComplete: activities.length > 0 };
      });

      const todayDay = week.find((d) => d.date === today);
      const wasComplete = s.streak.thisWeek.find((d) => d.date === today)?.isComplete;
      const nowComplete = todayDay?.isComplete ?? false;
      isNowComplete = nowComplete;

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

    if (activityAlreadyPresent) {
      return;
    }

    try {
      const { getDb } = await import('@/db/client');
      const db = getDb();
      await db.runAsync(
        `INSERT INTO streak_log (id, date, activities, is_complete)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(date) DO UPDATE SET activities = excluded.activities, is_complete = excluded.is_complete`,
        [`streak-${today}`, today, JSON.stringify(todayActivities), isNowComplete ? 1 : 0]
      );
    } catch (e) {
      console.warn('[UserStore] Error writing streak to DB:', e);
    }
  },

  toggleFavorite: async (type, id) => {
    const key = `${type}:${id}`;
    const wasFavorite = get().favoriteIds.has(key);

    set((s) => {
      const next = new Set(s.favoriteIds);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { favoriteIds: next };
    });

    try {
      const { getDb } = await import('@/db/client');
      const db = getDb();
      if (wasFavorite) {
        await db.runAsync('DELETE FROM favorites WHERE type = ? AND ref_id = ?', [type, id]);
      } else {
        await db.runAsync(
          'INSERT OR IGNORE INTO favorites (id, type, ref_id) VALUES (?, ?, ?)',
          [`fav-${Date.now()}`, type, id]
        );
      }
    } catch (e) {
      console.warn('[UserStore] Error writing favorite to DB:', e);
    }
  },

  isFavorite: (type, id) => get().favoriteIds.has(`${type}:${id}`),

  checkMilestone: () => {
    const { streak, milestones } = get();
    return milestones.find(
      (m) => m.achieved && m.days === streak.currentStreak
    ) ?? null;
  },

  loadUserDataFromDb: async () => {
    try {
      const { getDb, parseJson } = await import('@/db/client');
      const db = getDb();

      // Load favorites
      const favRows = await db.getAllAsync<{ type: string; ref_id: string }>('SELECT type, ref_id FROM favorites');
      const favoriteIds = new Set(favRows.map((r) => `${r.type}:${r.ref_id}`));

      // Load streak log
      const streakRows = await db.getAllAsync<{ date: string; activities: string; is_complete: number }>(
        'SELECT date, activities, is_complete FROM streak_log ORDER BY date ASC'
      );

      const completedDates = new Set(streakRows.filter((r) => r.is_complete === 1).map((r) => r.date));
      const todayStr = getIsoToday();

      let currentStreak = 0;
      let checkDate = new Date();
      if (!completedDates.has(todayStr)) {
        checkDate = subDays(checkDate, 1);
      }
      while (completedDates.has(format(checkDate, 'yyyy-MM-dd'))) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      }

      let longestStreak = 0;
      let tempStreak = 0;
      const sortedDates = Array.from(completedDates).sort();
      for (let i = 0; i < sortedDates.length; i++) {
        if (i === 0) {
          tempStreak = 1;
        } else {
          const prev = parseISO(sortedDates[i - 1]!);
          const curr = parseISO(sortedDates[i]!);
          const diffDays = differenceInCalendarDays(curr, prev);
          if (diffDays === 1) tempStreak++;
          else tempStreak = 1;
        }
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      }
      if (currentStreak > longestStreak) longestStreak = currentStreak;

      const now = new Date();
      const thisWeek: DayActivity[] = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(now, 6 - i);
        const dateStr = format(d, 'yyyy-MM-dd');
        const row = streakRows.find((r) => r.date === dateStr);
        const activities: StreakActivity[] = row ? parseJson(row.activities, []) : [];
        return {
          date: dateStr,
          activities,
          isComplete: activities.length > 0,
        };
      });

      set({
        favoriteIds,
        streak: {
          currentStreak,
          longestStreak,
          thisWeek,
          totalDays: completedDates.size,
          lastActivityDate: sortedDates[sortedDates.length - 1],
        },
        milestones: buildMilestones(currentStreak),
      });
    } catch (e) {
      console.warn('[UserStore] Error loading data from DB:', e);
    }
  },
}));
