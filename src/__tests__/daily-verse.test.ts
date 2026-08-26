import { getDailyVerse } from '../services/daily-verse-rotation';

describe('Daily Verse Auto-Rotation Service', () => {
  it('should return a valid verse for a specific date', async () => {
    const verse = await getDailyVerse('2026-07-21');
    expect(verse).toBeDefined();
    expect(verse.book).toBeTruthy();
    expect(verse.chapter).toBeGreaterThan(0);
    expect(verse.verse).toBeGreaterThan(0);
    expect(verse.text).toBeTruthy();
  });

  it('should return deterministic results for the same date', async () => {
    const verse1 = await getDailyVerse('2026-12-25');
    const verse2 = await getDailyVerse('2026-12-25');
    expect(verse1.id).toEqual(verse2.id);
    expect(verse1.text).toEqual(verse2.text);
  });

  it('should rotate to a different verse on consecutive days', async () => {
    const verseDay1 = await getDailyVerse('2026-01-01');
    const verseDay2 = await getDailyVerse('2026-01-02');
    expect(verseDay1.id).not.toEqual(verseDay2.id);
  });
});
