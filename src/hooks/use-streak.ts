import { useCallback } from 'react';
import { useUserStore } from '@/store/user.store';
import type { StreakActivity } from '@/types/user';

export function useStreak() {
  const { streak, milestones, recordActivity, checkMilestone } = useUserStore();

  const record = useCallback(async (activity: StreakActivity) => {
    await recordActivity(activity);
    return checkMilestone();
  }, [recordActivity, checkMilestone]);

  const completedToday = streak.thisWeek.find(
    (d) => d.date === new Date().toISOString().split('T')[0]
  )?.isComplete ?? false;

  const progressPercent = Math.min((streak.currentStreak / (streak.longestStreak || 1)) * 100, 100);

  const nextMilestone = milestones.find((m) => !m.achieved) ?? null;
  const daysToNext = nextMilestone ? nextMilestone.days - streak.currentStreak : null;

  return {
    streak,
    milestones,
    completedToday,
    progressPercent,
    nextMilestone,
    daysToNext,
    record,
  };
}
