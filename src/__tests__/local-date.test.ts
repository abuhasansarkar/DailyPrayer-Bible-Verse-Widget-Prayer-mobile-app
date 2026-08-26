import { format } from 'date-fns';

import { toLocalDate } from '../db/client';

// The app keys the streak, the daily verse and the widget payload on a
// `yyyy-MM-dd` string. Those must all be the DEVICE'S LOCAL calendar date.
//
// The bug this guards: several places used `toISOString().split('T')[0]`,
// which is the UTC date. For a user in UTC-5 that flips to "tomorrow" at 7pm
// local, so the verse of the day changed in the evening and the streak was
// credited to a day the user had not reached yet — while the streak store
// (date-fns `format`) used the local date, so the two disagreed.

describe('toLocalDate', () => {
  it('uses local calendar fields, not UTC', () => {
    // 2026-01-01 23:30 local, whatever the runner's zone is.
    const lateLocalNightNewYear = new Date(2026, 0, 1, 23, 30, 0);
    expect(toLocalDate(lateLocalNightNewYear)).toBe('2026-01-01');

    // 2026-01-01 00:30 local.
    const earlyLocalMorning = new Date(2026, 0, 1, 0, 30, 0);
    expect(toLocalDate(earlyLocalMorning)).toBe('2026-01-01');
  });

  it('pads month and day to two digits', () => {
    expect(toLocalDate(new Date(2026, 2, 5))).toBe('2026-03-05');
    expect(toLocalDate(new Date(2026, 11, 25))).toBe('2026-12-25');
  });

  it('agrees with date-fns, which the streak store uses', () => {
    // If these ever diverge the streak and the daily verse disagree about
    // what day it is.
    for (const date of [
      new Date(2026, 0, 1, 23, 59),
      new Date(2026, 5, 15, 0, 0),
      new Date(2026, 11, 31, 22, 15),
      new Date(),
    ]) {
      expect(toLocalDate(date)).toBe(format(date, 'yyyy-MM-dd'));
    }
  });

  it('does not drift across a whole year of local midnights', () => {
    const start = new Date(2026, 0, 1, 12, 0, 0);
    for (let i = 0; i < 365; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      const formatted = toLocalDate(day);
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      // Round-tripping the string back through the local constructor must
      // land on the same calendar day.
      const [y, m, d] = formatted.split('-').map(Number);
      expect(new Date(y!, m! - 1, d!).getDate()).toBe(day.getDate());
    }
  });
});
