import { format, subDays } from 'date-fns';
import { useUserStore } from '../store/user.store';
import type { DayActivity } from '../types/user';

// The store persists to SQLite via a dynamic import. Stub it so these tests
// exercise the streak arithmetic only, with no native module and no log noise.
jest.mock('../db/client', () => ({
  getDb: () => ({ runAsync: jest.fn().mockResolvedValue(undefined) }),
  parseJson: (v: string | null, fallback: unknown) => (v ? JSON.parse(v) : fallback),
}));

const iso = (d: Date) => format(d, 'yyyy-MM-dd');
const today = iso(new Date());

/** Build a 7-day window that ends on `endDate` (i.e. as if built that day). */
function windowEndingOn(endDate: Date, completeDates: string[] = []): DayActivity[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = iso(subDays(endDate, 6 - i));
    const isComplete = completeDates.includes(date);
    return {
      date,
      activities: isComplete ? (['verse'] as DayActivity['activities']) : [],
      isComplete,
    };
  });
}

function resetStore(thisWeek: DayActivity[], currentStreak: number) {
  useUserStore.setState({
    streak: {
      currentStreak,
      longestStreak: currentStreak,
      totalDays: currentStreak,
      thisWeek,
    },
  });
}

describe('recordActivity', () => {
  it('records against today when the cached week is still current', async () => {
    resetStore(windowEndingOn(new Date()), 0);

    await useUserStore.getState().recordActivity('verse');

    const day = useUserStore.getState().streak.thisWeek.find((d) => d.date === today);
    expect(day?.activities).toContain('verse');
    expect(day?.isComplete).toBe(true);
    expect(useUserStore.getState().streak.currentStreak).toBe(1);
  });

  it('continues the streak when yesterday was completed', async () => {
    const yesterday = iso(subDays(new Date(), 1));
    resetStore(windowEndingOn(new Date(), [yesterday]), 4);

    await useUserStore.getState().recordActivity('prayer');

    expect(useUserStore.getState().streak.currentStreak).toBe(5);
  });

  it('restarts the streak at 1 after a gap instead of carrying a stale count', async () => {
    // Last completed day was 5 days ago; the in-memory count is still 4.
    const longAgo = iso(subDays(new Date(), 5));
    resetStore(windowEndingOn(new Date(), [longAgo]), 4);

    await useUserStore.getState().recordActivity('verse');

    expect(useUserStore.getState().streak.currentStreak).toBe(1);
  });

  it('still records today when the cached week was built on an earlier date', async () => {
    // Regression: the app can stay alive across midnight (backgrounded), which
    // left `thisWeek` anchored to an older day. Today then matched no entry, so
    // the activity was dropped and an empty is_complete=0 row was written.
    const threeDaysAgo = subDays(new Date(), 3);
    resetStore(windowEndingOn(threeDaysAgo), 2);

    await useUserStore.getState().recordActivity('verse');

    const week = useUserStore.getState().streak.thisWeek;
    const day = week.find((d) => d.date === today);

    expect(week[6]?.date).toBe(today);
    expect(day?.activities).toContain('verse');
    expect(day?.isComplete).toBe(true);
    // Yesterday was not completed, so this starts a new run.
    expect(useUserStore.getState().streak.currentStreak).toBe(1);
  });

  it('is idempotent for the same activity on the same day', async () => {
    resetStore(windowEndingOn(new Date()), 0);

    await useUserStore.getState().recordActivity('verse');
    await useUserStore.getState().recordActivity('verse');

    const day = useUserStore.getState().streak.thisWeek.find((d) => d.date === today);
    expect(day?.activities).toEqual(['verse']);
    expect(useUserStore.getState().streak.currentStreak).toBe(1);
  });
});
