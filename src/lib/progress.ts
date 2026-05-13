import fs from 'fs'
import path from 'path'
import { getDb } from './database'
import { encrypt, decrypt } from './crypto'
import { computeNextRevision } from './revision'
import type {
  StellaireProgress, CourseProgress, ExerciseResult,
  ExamResult, ReportRecord, UserProfile,
  ProfileEntry, ProfilesIndex,
} from '@/types/course'

// --- Legacy migration ---

const LEGACY_FILE = path.join(process.cwd(), 'data', 'progress.json')
let migrated = false

export function ensureMigration() {
  if (migrated) return
  migrated = true
  if (!fs.existsSync(LEGACY_FILE)) return

  const db = getDb()
  const existing = db.prepare('SELECT COUNT(*) as count FROM profiles').get() as { count: number }
  if (existing.count > 0) return

  try {
    const raw = JSON.parse(fs.readFileSync(LEGACY_FILE, 'utf-8'))
    const profile = createProfile('Utilisateur', '#C85A2A')

    const courses = raw.courses && typeof raw.courses === 'object' ? raw.courses : raw
    for (const [slug, data] of Object.entries(courses)) {
      const cp = data as CourseProgress
      importCourseProgress(profile.id, slug, cp)
    }

    if (raw.exams) {
      for (const exam of raw.exams) addExamResult(profile.id, exam)
    }

    if (raw.profile) {
      saveUserProfile(profile.id, raw.profile)
    }

    fs.renameSync(LEGACY_FILE, LEGACY_FILE + '.bak')
  } catch {}
}

// --- Profiles ---

export function readProfilesIndex(): ProfilesIndex {
  ensureMigration()
  const db = getDb()
  const rows = db.prepare('SELECT id, name, color, avatar_style, avatar_seed, created_at FROM profiles ORDER BY created_at').all() as Array<{
    id: string; name: string; color: string; avatar_style: string; avatar_seed: string; created_at: string
  }>
  return {
    profiles: rows.map(r => ({
      id: r.id,
      name: r.name,
      color: r.color,
      avatarStyle: r.avatar_style as ProfileEntry['avatarStyle'],
      avatarSeed: r.avatar_seed,
      createdAt: r.created_at,
    })),
  }
}

export function writeProfilesIndex(_index: ProfilesIndex) {
  // no-op: profiles are in SQLite now
}

export function createProfile(
  name: string,
  color: string,
  avatarStyle: ProfileEntry['avatarStyle'] = 'notionists-neutral',
  avatarSeed?: string,
): ProfileEntry {
  const db = getDb()
  const id = `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  const seed = avatarSeed || `${name}-${Math.random().toString(36).slice(2, 8)}`
  const now = new Date().toISOString()

  db.prepare('INSERT INTO profiles (id, name, color, avatar_style, avatar_seed, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(id, name, color, avatarStyle, seed, now)

  return { id, name, color, avatarStyle, avatarSeed: seed, createdAt: now }
}

export function updateProfileEntry(
  profileId: string,
  updates: Partial<Omit<ProfileEntry, 'id' | 'createdAt'>>,
): ProfileEntry | null {
  const db = getDb()
  const fields: string[] = []
  const values: unknown[] = []

  if (updates.name) { fields.push('name = ?'); values.push(updates.name) }
  if (updates.color) { fields.push('color = ?'); values.push(updates.color) }
  if (updates.avatarStyle) { fields.push('avatar_style = ?'); values.push(updates.avatarStyle) }
  if (updates.avatarSeed) { fields.push('avatar_seed = ?'); values.push(updates.avatarSeed) }

  if (fields.length === 0) return null
  values.push(profileId)

  db.prepare(`UPDATE profiles SET ${fields.join(', ')} WHERE id = ?`).run(...values)

  const row = db.prepare('SELECT * FROM profiles WHERE id = ?').get(profileId) as {
    id: string; name: string; color: string; avatar_style: string; avatar_seed: string; created_at: string
  } | undefined

  if (!row) return null
  return { id: row.id, name: row.name, color: row.color, avatarStyle: row.avatar_style as ProfileEntry['avatarStyle'], avatarSeed: row.avatar_seed, createdAt: row.created_at }
}

export function deleteProfile(profileId: string) {
  const db = getDb()
  db.prepare('DELETE FROM profiles WHERE id = ?').run(profileId)
}

// --- Encrypted user profile ---

export function saveUserProfile(profileId: string, profile: UserProfile) {
  const db = getDb()
  const encrypted = encrypt(JSON.stringify(profile))
  db.prepare('INSERT OR REPLACE INTO user_profiles (profile_id, encrypted_data) VALUES (?, ?)').run(profileId, encrypted)
}

export function loadUserProfile(profileId: string): UserProfile | null {
  const db = getDb()
  const row = db.prepare('SELECT encrypted_data FROM user_profiles WHERE profile_id = ?').get(profileId) as { encrypted_data: string } | undefined
  if (!row) return null
  try {
    return JSON.parse(decrypt(row.encrypted_data))
  } catch {
    return null
  }
}

// --- Course progress ---

function defaultProgress(): CourseProgress {
  return {
    status: 'not-started',
    completedExercises: [],
    exerciseResults: {},
    revisions: [],
  }
}

export function readCourseProgress(profileId: string, slug: string): CourseProgress {
  const db = getDb()
  const row = db.prepare('SELECT * FROM course_progress WHERE profile_id = ? AND slug = ?').get(profileId, slug) as {
    status: string; last_opened: string | null; completed_at: string | null; next_revision: string | null
  } | undefined

  const cp: CourseProgress = row ? {
    status: row.status as CourseProgress['status'],
    lastOpened: row.last_opened || undefined,
    completedAt: row.completed_at || undefined,
    nextRevision: row.next_revision || undefined,
    completedExercises: [],
    exerciseResults: {},
    revisions: [],
  } : defaultProgress()

  const exercises = db.prepare('SELECT * FROM exercise_results WHERE profile_id = ? AND slug = ?').all(profileId, slug) as Array<{
    exercise_id: string; correct: number; attempts: number; last_seen: string | null; interval_days: number | null; ease_factor: number | null; next_due: string | null
  }>

  for (const ex of exercises) {
    cp.exerciseResults[ex.exercise_id] = {
      correct: !!ex.correct,
      attempts: ex.attempts,
      lastSeen: ex.last_seen || undefined,
      interval: ex.interval_days || undefined,
      easeFactor: ex.ease_factor || undefined,
      nextDue: ex.next_due || undefined,
    }
    if (ex.correct) cp.completedExercises.push(ex.exercise_id)
  }

  const revisions = db.prepare('SELECT date, score, passed FROM revisions WHERE profile_id = ? AND slug = ? ORDER BY id').all(profileId, slug) as Array<{
    date: string; score: number; passed: number
  }>
  cp.revisions = revisions.map(r => ({ date: r.date, score: r.score, passed: !!r.passed }))

  return cp
}

export function updateCourseProgress(
  profileId: string,
  slug: string,
  update: Partial<CourseProgress>,
): CourseProgress {
  const db = getDb()
  const current = readCourseProgress(profileId, slug)
  const status = update.status || current.status
  const lastOpened = update.lastOpened || current.lastOpened
  let completedAt = update.completedAt || current.completedAt
  let nextRevision = update.nextRevision || current.nextRevision

  if (update.status === 'completed' && current.status !== 'completed' && !nextRevision) {
    completedAt = completedAt || new Date().toISOString().split('T')[0]
    const tempProgress = { ...current, status: 'completed' as const, completedAt }
    nextRevision = computeNextRevision(tempProgress) || undefined
  }

  db.prepare(`INSERT OR REPLACE INTO course_progress (profile_id, slug, status, last_opened, completed_at, next_revision)
    VALUES (?, ?, ?, ?, ?, ?)`).run(profileId, slug, status, lastOpened || null, completedAt || null, nextRevision || null)

  if (update.exerciseResults) {
    const stmt = db.prepare(`INSERT OR REPLACE INTO exercise_results
      (profile_id, slug, exercise_id, correct, attempts, last_seen, interval_days, ease_factor, next_due)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)

    for (const [exId, result] of Object.entries(update.exerciseResults)) {
      const existing = current.exerciseResults[exId]
      const merged = { ...existing, ...result }
      stmt.run(profileId, slug, exId, merged.correct ? 1 : 0, merged.attempts,
        merged.lastSeen || null, merged.interval || null, merged.easeFactor || null, merged.nextDue || null)
    }
  }

  if (update.revisions) {
    const stmt = db.prepare('INSERT INTO revisions (profile_id, slug, date, score, passed) VALUES (?, ?, ?, ?, ?)')
    for (const rev of update.revisions) {
      stmt.run(profileId, slug, rev.date, rev.score, rev.passed ? 1 : 0)
    }
  }

  return readCourseProgress(profileId, slug)
}

function importCourseProgress(profileId: string, slug: string, cp: CourseProgress) {
  const db = getDb()
  db.prepare(`INSERT OR REPLACE INTO course_progress (profile_id, slug, status, last_opened, completed_at, next_revision)
    VALUES (?, ?, ?, ?, ?, ?)`).run(profileId, slug, cp.status, cp.lastOpened || null, cp.completedAt || null, cp.nextRevision || null)

  const stmt = db.prepare(`INSERT OR REPLACE INTO exercise_results
    (profile_id, slug, exercise_id, correct, attempts, last_seen, interval_days, ease_factor, next_due)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  for (const [exId, r] of Object.entries(cp.exerciseResults || {})) {
    stmt.run(profileId, slug, exId, r.correct ? 1 : 0, r.attempts, r.lastSeen || null, r.interval || null, r.easeFactor || null, r.nextDue || null)
  }

  const revStmt = db.prepare('INSERT INTO revisions (profile_id, slug, date, score, passed) VALUES (?, ?, ?, ?, ?)')
  for (const rev of cp.revisions || []) {
    revStmt.run(profileId, slug, rev.date, rev.score, rev.passed ? 1 : 0)
  }
}

// --- Full progress read (for reports, compatibility) ---

export function readProgress(profileId: string): StellaireProgress {
  const db = getDb()
  const slugs = db.prepare('SELECT DISTINCT slug FROM course_progress WHERE profile_id = ?').all(profileId) as Array<{ slug: string }>

  const courses: Record<string, CourseProgress> = {}
  for (const { slug } of slugs) {
    courses[slug] = readCourseProgress(profileId, slug)
  }

  const exams = readExams(profileId)
  const reports = readReports(profileId)
  const profile = loadUserProfile(profileId)

  return { courses, exams, reports, profile: profile || undefined }
}

export function writeProgress(profileId: string, _data: StellaireProgress): void {
  // no-op: individual writes handle persistence
}

// --- Exams ---

function readExams(profileId: string): ExamResult[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM exams WHERE profile_id = ? ORDER BY id').all(profileId) as Array<{
    date: string; score: number; total_questions: number; correct_answers: number;
    time_seconds: number; time_per_question: string; courses_sampled: string
  }>
  return rows.map(r => ({
    date: r.date,
    score: r.score,
    totalQuestions: r.total_questions,
    correctAnswers: r.correct_answers,
    timeSeconds: r.time_seconds,
    timePerQuestion: JSON.parse(r.time_per_question),
    coursesSampled: JSON.parse(r.courses_sampled),
  }))
}

export function addExamResult(profileId: string, exam: ExamResult): void {
  const db = getDb()
  db.prepare(`INSERT INTO exams (profile_id, date, score, total_questions, correct_answers, time_seconds, time_per_question, courses_sampled)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    profileId, exam.date, exam.score, exam.totalQuestions, exam.correctAnswers,
    exam.timeSeconds, JSON.stringify(exam.timePerQuestion), JSON.stringify(exam.coursesSampled))
}

// --- Reports ---

function readReports(profileId: string): ReportRecord[] {
  const db = getDb()
  const rows = db.prepare('SELECT date, hash, progress_snapshot FROM reports WHERE profile_id = ? ORDER BY id DESC LIMIT 1').all(profileId) as Array<{
    date: string; hash: string; progress_snapshot: string
  }>
  return rows.map(r => ({ date: r.date, hash: r.hash, progressSnapshot: r.progress_snapshot }))
}

export function addReportRecord(profileId: string, report: ReportRecord): void {
  const db = getDb()
  db.prepare('DELETE FROM reports WHERE profile_id = ?').run(profileId)
  db.prepare('INSERT INTO reports (profile_id, date, hash, progress_snapshot) VALUES (?, ?, ?, ?)').run(
    profileId, report.date, report.hash, report.progressSnapshot)
}
