import fs from 'fs'
import path from 'path'
import os from 'os'
import type { StellaireProgress, CourseProgress, ExamResult, ReportRecord, ProfileEntry, ProfilesIndex } from '@/types/course'
import { computeNextRevision } from './revision'

const DATA_DIR = path.join(process.cwd(), 'data')
const PROFILES_DIR = path.join(DATA_DIR, 'profiles')
const PROFILES_INDEX = path.join(DATA_DIR, 'profiles.json')
const LEGACY_FILE = path.join(DATA_DIR, 'progress.json')

function ensureDirs() {
  if (!fs.existsSync(PROFILES_DIR)) fs.mkdirSync(PROFILES_DIR, { recursive: true })
}

function atomicWrite(filePath: string, data: unknown) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const tmp = path.join(os.tmpdir(), `stellaire-${Date.now()}-${Math.random().toString(36).slice(2)}.json`)
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8')
  fs.renameSync(tmp, filePath)
}

function profilePath(profileId: string): string {
  return path.join(PROFILES_DIR, `${profileId}.json`)
}

// --- Profiles index ---

export function readProfilesIndex(): ProfilesIndex {
  ensureMigration()
  try {
    const raw = fs.readFileSync(PROFILES_INDEX, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return { profiles: [] }
  }
}

export function writeProfilesIndex(index: ProfilesIndex) {
  atomicWrite(PROFILES_INDEX, index)
}

export function createProfile(name: string, color: string, avatarStyle: ProfileEntry['avatarStyle'] = 'notionists-neutral', avatarSeed?: string): ProfileEntry {
  ensureDirs()
  const id = `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  const seed = avatarSeed || `${name}-${Math.random().toString(36).slice(2, 8)}`
  const entry: ProfileEntry = { id, name, color, avatarStyle, avatarSeed: seed, createdAt: new Date().toISOString() }

  const index = readProfilesIndex()
  index.profiles.push(entry)
  writeProfilesIndex(index)

  atomicWrite(profilePath(id), { courses: {}, exams: [], reports: [] })

  return entry
}

export function updateProfileEntry(profileId: string, updates: Partial<Omit<ProfileEntry, 'id' | 'createdAt'>>): ProfileEntry | null {
  const index = readProfilesIndex()
  const entry = index.profiles.find(p => p.id === profileId)
  if (!entry) return null
  Object.assign(entry, updates)
  writeProfilesIndex(index)
  return entry
}

export function deleteProfile(profileId: string) {
  const index = readProfilesIndex()
  index.profiles = index.profiles.filter(p => p.id !== profileId)
  writeProfilesIndex(index)

  const file = profilePath(profileId)
  if (fs.existsSync(file)) fs.unlinkSync(file)
}

// --- Auto-migration from legacy progress.json ---

function migrateIfNeeded() {
  ensureDirs()
  if (!fs.existsSync(LEGACY_FILE)) return
  const index = readProfilesIndex()
  if (index.profiles.length > 0) return

  try {
    const raw = JSON.parse(fs.readFileSync(LEGACY_FILE, 'utf-8'))
    const profile = createProfile('Utilisateur', '#C85A2A')

    let data: StellaireProgress
    if (raw.courses && typeof raw.courses === 'object') {
      data = raw as StellaireProgress
    } else {
      data = { courses: raw, exams: [], reports: [] }
    }
    atomicWrite(profilePath(profile.id), data)

    fs.renameSync(LEGACY_FILE, LEGACY_FILE + '.bak')
  } catch {}
}

let migrated = false
export function ensureMigration() {
  if (migrated) return
  migrated = true
  migrateIfNeeded()
}

// --- Profile progress ---

export function readProgress(profileId: string): StellaireProgress {
  try {
    const raw = fs.readFileSync(profilePath(profileId), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return { courses: {}, exams: [], reports: [] }
  }
}

export function readCourseProgress(profileId: string, slug: string): CourseProgress {
  const data = readProgress(profileId)
  return data.courses[slug] || defaultProgress()
}

export function writeProgress(profileId: string, data: StellaireProgress): void {
  ensureDirs()
  atomicWrite(profilePath(profileId), data)
}

export function updateCourseProgress(
  profileId: string,
  slug: string,
  update: Partial<CourseProgress>,
): CourseProgress {
  const data = readProgress(profileId)
  const current = data.courses[slug] || defaultProgress()
  const merged = { ...current, ...update }

  if (update.completedExercises) {
    const set = new Set([...current.completedExercises, ...update.completedExercises])
    merged.completedExercises = Array.from(set)
  }

  if (update.exerciseResults) {
    merged.exerciseResults = { ...current.exerciseResults, ...update.exerciseResults }
  }

  if (update.revisions) {
    merged.revisions = [...current.revisions, ...update.revisions]
  }

  if (update.status === 'completed' && current.status !== 'completed' && !merged.nextRevision) {
    merged.completedAt = merged.completedAt || new Date().toISOString().split('T')[0]
    merged.nextRevision = computeNextRevision(merged) || undefined
  }

  data.courses[slug] = merged
  writeProgress(profileId, data)
  return merged
}

export function addExamResult(profileId: string, exam: ExamResult): void {
  const data = readProgress(profileId)
  data.exams.push(exam)
  writeProgress(profileId, data)
}

export function addReportRecord(profileId: string, report: ReportRecord): void {
  const data = readProgress(profileId)
  data.reports = [report]
  writeProgress(profileId, data)
}

function defaultProgress(): CourseProgress {
  return {
    status: 'not-started',
    completedExercises: [],
    exerciseResults: {},
    revisions: [],
  }
}
