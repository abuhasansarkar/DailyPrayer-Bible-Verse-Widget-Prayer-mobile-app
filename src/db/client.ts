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
  // Get current schema version
  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion < DB_VERSION) {
    // Apply each migration in order
    for (let v = currentVersion + 1; v <= DB_VERSION; v++) {
      const sql = MIGRATIONS[v];
      if (sql) {
        const statements = sql
          .split(';')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        for (const stmt of statements) {
          await db.execAsync(stmt);
        }
      }
    }
    // Update schema version
    await db.execAsync(`PRAGMA user_version = ${DB_VERSION}`);
  }

  // Ensure is_answered column exists on journal_entries for existing databases
  try {
    await db.execAsync('ALTER TABLE journal_entries ADD COLUMN is_answered INTEGER NOT NULL DEFAULT 0;');
  } catch {
    // Column already exists
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

export function todayDate(): string {
  return new Date().toISOString().split('T')[0]!;
}
