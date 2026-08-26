import * as SQLite from 'expo-sqlite';
import { MIGRATIONS, DB_VERSION } from './schema';

const DB_NAME = 'dailyprayer.db';

let _db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return _db;
}

export async function initDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;

  _db = await SQLite.openDatabaseAsync(DB_NAME);

  // Run migrations
  await runMigrations(_db);

  return _db;
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  // Set PRAGMAs outside transactions
  try {
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await db.execAsync('PRAGMA foreign_keys = ON;');
  } catch (e) {
    console.warn('[DB] PRAGMA config warning:', e);
  }

  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion < DB_VERSION) {
    for (let v = currentVersion + 1; v <= DB_VERSION; v++) {
      const sql = MIGRATIONS[v];
      if (sql) {
        const statements = sql
          .split(';')
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && !s.toLowerCase().startsWith('pragma'));
        for (const stmt of statements) {
          try {
            await db.execAsync(stmt);
          } catch (err) {
            console.warn(`[DB] Migration ${v} statement warning:`, err);
          }
        }
      }
    }
    await db.execAsync(`PRAGMA user_version = ${DB_VERSION}`);
  }

  // Ensure optional columns exist for legacy databases
  try {
    const cols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(journal_entries);');
    const hasIsAnswered = cols?.some((c) => c.name === 'is_answered');
    if (!hasIsAnswered) {
      await db.execAsync('ALTER TABLE journal_entries ADD COLUMN is_answered INTEGER NOT NULL DEFAULT 0;');
    }
  } catch (err) {
    console.warn('[DB] Ensure column check warning:', err);
  }
}

export async function closeDb(): Promise<void> {
  if (_db) {
    await _db.closeAsync();
    _db = null;
  }
}

// ── Generic DAO helpers ───────────────────────────────────────────────────────

export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function toJson(value: unknown): string {
  return JSON.stringify(value);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Format a Date as a local `yyyy-MM-dd` calendar date.
 *
 * NOT `toISOString().split('T')[0]` — that is the UTC date. For anyone west
 * of UTC it rolls over before local midnight (a user in UTC-5 sees "tomorrow"
 * from 7pm), and east of UTC it rolls over late. In a daily-habit app that
 * means the verse changes at the wrong hour and the streak is credited to the
 * wrong day.
 *
 * The streak store keys on the local date (date-fns `format`), so every other
 * "today" in the app has to agree with it.
 */
export function toLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** The device's current local calendar date, as `yyyy-MM-dd`. */
export function todayDate(): string {
  return toLocalDate(new Date());
}
