import { SQLiteDatabase } from 'expo-sqlite';

// ─────────────────────────────────────────────────────────────────────────────
// Database Schema — DailyPrayer
// Uses expo-sqlite with raw SQL (Drizzle ORM pattern)
// ─────────────────────────────────────────────────────────────────────────────

export const CREATE_TABLES_SQL = `
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  -- Verses
  CREATE TABLE IF NOT EXISTS verses (
    id TEXT PRIMARY KEY NOT NULL,
    reference TEXT NOT NULL,
    book TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    verse_number INTEGER NOT NULL,
    text TEXT NOT NULL,
    translation TEXT NOT NULL DEFAULT 'NIV',
    topics TEXT NOT NULL DEFAULT '[]',
    is_featured INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Daily verse schedule (admin-managed)
  CREATE TABLE IF NOT EXISTS daily_verses (
    id TEXT PRIMARY KEY NOT NULL,
    date TEXT NOT NULL UNIQUE,
    verse_id TEXT NOT NULL,
    reflection TEXT NOT NULL DEFAULT '',
    prayer TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (verse_id) REFERENCES verses(id)
  );

  -- Topics
  CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    icon TEXT NOT NULL DEFAULT 'bookmark',
    color TEXT NOT NULL DEFAULT '#96AA88',
    verse_count INTEGER NOT NULL DEFAULT 0,
    prayer_count INTEGER NOT NULL DEFAULT 0,
    is_premium INTEGER NOT NULL DEFAULT 0
  );

  -- Guided prayers (admin-managed)
  CREATE TABLE IF NOT EXISTS guided_prayers (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    intro TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL,
    category TEXT NOT NULL,
    scripture_ref TEXT NOT NULL DEFAULT '',
    scripture_text TEXT NOT NULL DEFAULT '',
    duration_minutes INTEGER NOT NULL DEFAULT 3,
    is_premium INTEGER NOT NULL DEFAULT 0,
    tags TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Personal prayers (user-created)
  CREATE TABLE IF NOT EXISTS personal_prayers (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'personal',
    is_answered INTEGER NOT NULL DEFAULT 0,
    answered_at TEXT,
    reminder_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Journal entries
  CREATE TABLE IF NOT EXISTS journal_entries (
    id TEXT PRIMARY KEY NOT NULL,
    type TEXT NOT NULL,
    title TEXT,
    body TEXT NOT NULL,
    mood TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    linked_verse_id TEXT,
    linked_prayer_id TEXT,
    is_private INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Gratitude entries
  CREATE TABLE IF NOT EXISTS gratitude_entries (
    id TEXT PRIMARY KEY NOT NULL,
    items TEXT NOT NULL DEFAULT '[]',
    mood TEXT,
    additional_note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Devotionals (admin-managed)
  CREATE TABLE IF NOT EXISTS devotionals (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT,
    date TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'morning',
    scripture_ref TEXT NOT NULL DEFAULT '',
    scripture_text TEXT NOT NULL DEFAULT '',
    is_premium INTEGER NOT NULL DEFAULT 0,
    reading_time INTEGER NOT NULL DEFAULT 3
  );

  -- Reminders
  CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    time TEXT NOT NULL,
    days_of_week TEXT NOT NULL DEFAULT '[1,2,3,4,5,6,7]',
    type TEXT NOT NULL DEFAULT 'custom',
    is_active INTEGER NOT NULL DEFAULT 1,
    sound_enabled INTEGER NOT NULL DEFAULT 1,
    notification_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Streak log
  CREATE TABLE IF NOT EXISTS streak_log (
    id TEXT PRIMARY KEY NOT NULL,
    date TEXT NOT NULL UNIQUE,
    activities TEXT NOT NULL DEFAULT '[]',
    is_complete INTEGER NOT NULL DEFAULT 0
  );

  -- Favorites
  CREATE TABLE IF NOT EXISTS favorites (
    id TEXT PRIMARY KEY NOT NULL,
    type TEXT NOT NULL,
    ref_id TEXT NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(type, ref_id)
  );

  -- User collections
  CREATE TABLE IF NOT EXISTS user_collections (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    emoji TEXT NOT NULL DEFAULT '📚',
    item_ids TEXT NOT NULL DEFAULT '[]',
    item_type TEXT NOT NULL DEFAULT 'verse',
    is_public INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Widget configs
  CREATE TABLE IF NOT EXISTS widget_configs (
    id TEXT PRIMARY KEY NOT NULL,
    size TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'daily-verse',
    theme_id TEXT NOT NULL DEFAULT 'warm-cream',
    font_style TEXT NOT NULL DEFAULT 'inter-regular',
    text_alignment TEXT NOT NULL DEFAULT 'center',
    show_reference INTEGER NOT NULL DEFAULT 1,
    show_date INTEGER NOT NULL DEFAULT 1,
    show_mascot INTEGER NOT NULL DEFAULT 0,
    show_app_logo INTEGER NOT NULL DEFAULT 1,
    custom_photo_uri TEXT,
    verse_translation TEXT NOT NULL DEFAULT 'NIV',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- User preferences (single row)
  CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY NOT NULL DEFAULT 1,
    display_name TEXT,
    avatar_uri TEXT,
    goals TEXT NOT NULL DEFAULT '[]',
    preferred_translation TEXT NOT NULL DEFAULT 'NIV',
    preferred_categories TEXT NOT NULL DEFAULT '[]',
    app_theme TEXT NOT NULL DEFAULT 'system',
    font_size TEXT NOT NULL DEFAULT 'default',
    reduced_motion INTEGER NOT NULL DEFAULT 0,
    high_contrast INTEGER NOT NULL DEFAULT 0,
    language TEXT NOT NULL DEFAULT 'en',
    notifications_enabled INTEGER NOT NULL DEFAULT 1,
    onboarding_complete INTEGER NOT NULL DEFAULT 0,
    last_seen_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Sync queue for Supabase
  CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    payload TEXT NOT NULL DEFAULT '{}',
    synced INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

export const DB_VERSION = 1;

export const MIGRATIONS: Record<number, string> = {
  1: CREATE_TABLES_SQL,
};
