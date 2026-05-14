export type Subject = 'math' | 'physics' | 'chemistry'
export type CourseStatus = 'not-started' | 'in-progress' | 'completed' | 'mastered'

export interface CourseMeta {
  title: string
  slug: string
  phase: number
  subject: Subject
  order: number
  tags: string[]
  prerequisites: string[]
}

export interface CourseData {
  meta: CourseMeta
  content: string
}

export interface ExerciseResult {
  correct: boolean
  attempts: number
  answer?: string
  lastSeen?: string
  interval?: number
  easeFactor?: number
  nextDue?: string
}

export interface Revision {
  date: string
  score: number
  passed: boolean
}

export interface CourseProgress {
  status: CourseStatus
  lastOpened?: string
  completedAt?: string
  completedExercises: string[]
  exerciseResults: Record<string, ExerciseResult>
  revisions: Revision[]
  nextRevision?: string
}

export interface ExamResult {
  date: string
  score: number
  totalQuestions: number
  correctAnswers: number
  timeSeconds: number
  timePerQuestion: number[]
  coursesSampled: string[]
}

export interface ReportRecord {
  date: string
  hash: string
  progressSnapshot: string
}

export interface UserProfile {
  firstName: string
  lastName: string
  email: string
  birthDate: string
  address: string
}

export interface StellaireProgress {
  courses: Record<string, CourseProgress>
  exams: ExamResult[]
  reports: ReportRecord[]
  profile?: UserProfile
}

export interface ProfileEntry {
  id: string
  name: string
  color: string
  avatarStyle: 'notionists-neutral' | 'lorelei-neutral'
  avatarSeed: string
  createdAt: string
}

export interface ProfilesIndex {
  profiles: ProfileEntry[]
}

export interface CourseGroup {
  phase: number
  subjects: Record<Subject, CourseMeta[]>
}
