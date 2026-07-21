import { getDb } from '@/db/client';

export interface ReadingPlan {
  id: string;
  title: string;
  description: string;
  category: string;
  total_days: number;
  is_featured: boolean;
}

export interface UserPlanProgress {
  id: string;
  plan_id: string;
  current_day: number;
  completed_days: number[];
  is_completed: boolean;
}

export const SAMPLE_PLANS: ReadingPlan[] = [
  {
    id: 'bible-in-a-year',
    title: 'Read the Bible in a Year',
    description: 'A structured daily reading plan taking you through Old Testament, New Testament, Psalms, and Proverbs.',
    category: 'Full Bible',
    total_days: 365,
    is_featured: true,
  },
  {
    id: '30-days-of-peace',
    title: '30 Days of Divine Peace',
    description: 'Daily scriptures and devotionals focused on overwhelming peace, reducing anxiety, and building trust.',
    category: 'Topical',
    total_days: 30,
    is_featured: true,
  },
  {
    id: 'psalms-of-comfort',
    title: 'Psalms of Comfort & Hope',
    description: '14 days exploring the most uplifting and soothing Psalms written by David and the Levites.',
    category: 'Psalms',
    total_days: 14,
    is_featured: false,
  },
];

export class ReadingPlanService {
  static async getPlans(): Promise<ReadingPlan[]> {
    try {
      const db = getDb();
      const rows = await db.getAllAsync<any>('SELECT * FROM reading_plans');
      if (rows && rows.length > 0) {
        return rows.map(r => ({
          id: r.id,
          title: r.title,
          description: r.description,
          category: r.category,
          total_days: r.total_days,
          is_featured: Boolean(r.is_featured),
        }));
      }
    } catch {
      // Fallback
    }
    return SAMPLE_PLANS;
  }

  static async getProgress(planId: string): Promise<UserPlanProgress | null> {
    try {
      const db = getDb();
      const row = await db.getFirstAsync<any>(
        'SELECT * FROM user_reading_plan_progress WHERE plan_id = ?',
        [planId]
      );
      if (row) {
        return {
          id: row.id,
          plan_id: row.plan_id,
          current_day: row.current_day,
          completed_days: JSON.parse(row.completed_days || '[]'),
          is_completed: Boolean(row.is_completed),
        };
      }
    } catch (e) {
      console.warn('Failed to get plan progress:', e);
    }
    return null;
  }

  static async toggleDayComplete(planId: string, dayNumber: number): Promise<boolean> {
    try {
      const db = getDb();
      const current = await this.getProgress(planId);
      let completedDays = current?.completed_days || [];

      if (completedDays.includes(dayNumber)) {
        completedDays = completedDays.filter(d => d !== dayNumber);
      } else {
        completedDays.push(dayNumber);
      }

      const id = current?.id || `progress-${planId}`;
      const isCompleted = completedDays.length >= 30; // Check threshold

      await db.runAsync(
        `INSERT OR REPLACE INTO user_reading_plan_progress 
         (id, plan_id, current_day, completed_days, is_completed, last_read_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [id, planId, dayNumber, JSON.stringify(completedDays), isCompleted ? 1 : 0]
      );

      return true;
    } catch (e) {
      console.warn('Failed to toggle day complete:', e);
      return false;
    }
  }
}
