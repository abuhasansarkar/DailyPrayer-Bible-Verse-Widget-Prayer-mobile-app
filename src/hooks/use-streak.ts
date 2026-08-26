import { useCallback } from 'react';
import { format } from 'date-fns';
import { useUserStore } from '@/store/user.store';
import type { StreakActivity } from '@/types/user';

export function useStreak() {
  const { streak, milestones, recordActivity, checkMilestone } = useUserStore();

  const record = useCallback(async (activity: StreakActivity) => {
    await recordActivity(activity);
    return checkMilestone();
  }, [recordActivity, checkMilestone]);

  // toISOString() is UTC, so it rolls over at the wrong moment for anyone not
  // on UTC — use the device's local date, which is what the streak is keyed on.
  const todayLocal = format(new Date(), 'yyyy-MM-dd');
  const completedToday = streak.thisWeek.find((d) => d.date === todayLocal)?.isComplete ?? false;

  const nextMilestone = milestones.find((m) => !m.achieved) ?? null;
  const daysToNext = nextMilestone ? nextMilestone.days - streak.currentStreak : null;

  // Progress toward the next milestone. This was previously measured against
  // longestStreak, which reads as 100% for every new user (current === longest)
  // and is meaningless as a progress indicator.
  const progressPercent = nextMilestone
    ? Math.min((streak.currentStreak / nextMilestone.days) * 100, 100)
    : 100;

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
