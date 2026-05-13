import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = path.join(process.cwd(), 'data', 'stellaire.db')

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db

  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#C85A2A',
      avatar_style TEXT NOT NULL DEFAULT 'notionists-neutral',
      avatar_seed TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_profiles (
      profile_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
      encrypted_data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS course_progress (
      profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      slug TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'not-started',
      last_opened TEXT,
      completed_at TEXT,
      next_revision TEXT,
      PRIMARY KEY (profile_id, slug)
    );

    CREATE TABLE IF NOT EXISTS exercise_results (
      profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      slug TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      correct INTEGER NOT NULL DEFAULT 0,
      attempts INTEGER NOT NULL DEFAULT 0,
      answer TEXT,
      last_seen TEXT,
      interval_days INTEGER,
      ease_factor REAL,
      next_due TEXT,
      PRIMARY KEY (profile_id, slug, exercise_id)
    );

    CREATE TABLE IF NOT EXISTS revisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      slug TEXT NOT NULL,
      date TEXT NOT NULL,
      score REAL NOT NULL,
      passed INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      score REAL NOT NULL,
      total_questions INTEGER NOT NULL,
      correct_answers INTEGER NOT NULL,
      time_seconds INTEGER NOT NULL,
      time_per_question TEXT NOT NULL,
      courses_sampled TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      hash TEXT NOT NULL,
      progress_snapshot TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_course_progress_profile ON course_progress(profile_id);
    CREATE INDEX IF NOT EXISTS idx_exercise_results_profile ON exercise_results(profile_id, slug);
    CREATE INDEX IF NOT EXISTS idx_revisions_profile ON revisions(profile_id, slug);
    CREATE INDEX IF NOT EXISTS idx_exams_profile ON exams(profile_id);
  `)

  // Migrations
  const columns = db.prepare("PRAGMA table_info(exercise_results)").all() as Array<{ name: string }>
  if (!columns.some(c => c.name === 'answer')) {
    db.exec("ALTER TABLE exercise_results ADD COLUMN answer TEXT")
  }

  return db
}
