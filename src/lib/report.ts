import crypto from 'crypto'
import type { StellaireProgress, CourseMeta, ExamResult, UserProfile } from '@/types/course'

export interface ReportData {
  generatedAt: string
  hash: string
  profile: UserProfile | null
  summary: {
    totalCourses: number
    completedCourses: number
    masteredCourses: number
    masteryRate: number
    estimatedHours: number
    totalExercises: number
    correctExercises: number
    exerciseSuccessRate: number
    totalRevisions: number
    passedRevisions: number
  }
  subjects: Array<{
    name: string
    total: number
    completed: number
    rate: number
  }>
  timeline: Array<{
    week: string
    exercises: number
    revisions: number
  }>
  exams: ExamResult[]
  hardestExercises: Array<{
    exerciseId: string
    courseSlug: string
    courseTitle: string
    attempts: number
  }>
  integrity: {
    dataHash: string
    snapshotSize: number
    courseCount: number
    exerciseCount: number
    revisionCount: number
    examCount: number
    firstActivity: string | null
    lastActivity: string | null
    githubRepo: string
  }
}

const subjectLabels: Record<string, string> = {
  math: 'Mathématiques',
  physics: 'Physique',
  chemistry: 'Chimie',
}

export function computeReportHash(snapshot: string, timestamp: string): string {
  const payload = `${timestamp}|${snapshot}`
  return crypto.createHash('sha256').update(payload).digest('hex')
}

export function computeDataHash(progress: StellaireProgress): string {
  const normalized = JSON.stringify(progress, Object.keys(progress).sort())
  return crypto.createHash('sha256').update(normalized).digest('hex')
}

export function generateReportData(
  progress: StellaireProgress,
  courses: CourseMeta[],
): ReportData {
  const now = new Date().toISOString()
  const snapshot = JSON.stringify(progress)
  const hash = computeReportHash(snapshot, now)
  const dataHash = computeDataHash(progress)

  const realCourses = courses.filter(c => !c.tags.includes('demo'))

  let totalExercises = 0
  let correctExercises = 0
  let totalRevisions = 0
  let passedRevisions = 0
  let allDates: string[] = []

  const hardest: Array<{ exerciseId: string; courseSlug: string; courseTitle: string; attempts: number }> = []

  for (const course of realCourses) {
    const p = progress.courses[course.slug]
    if (!p) continue

    const results = Object.entries(p.exerciseResults || {})
    totalExercises += results.length
    correctExercises += results.filter(([, r]) => r.correct).length

    for (const [exId, r] of results) {
      if (r.correct && r.attempts > 1) {
        hardest.push({
          exerciseId: exId,
          courseSlug: course.slug,
          courseTitle: course.title,
          attempts: r.attempts,
        })
      }
      if (r.lastSeen) allDates.push(r.lastSeen)
    }

    totalRevisions += (p.revisions || []).length
    passedRevisions += (p.revisions || []).filter(r => r.passed).length

    for (const rev of p.revisions || []) {
      allDates.push(rev.date)
    }

    if (p.completedAt) allDates.push(p.completedAt)
    if (p.lastOpened) allDates.push(p.lastOpened.split('T')[0])
  }

  hardest.sort((a, b) => b.attempts - a.attempts)

  const completedCount = realCourses.filter(c => {
    const s = progress.courses[c.slug]?.status
    return s === 'completed' || s === 'mastered'
  }).length
  const masteredCount = realCourses.filter(c => progress.courses[c.slug]?.status === 'mastered').length

  const estimatedMinutes = totalExercises * 3 + totalRevisions * 10 + (progress.exams || []).reduce((sum, e) => sum + Math.ceil(e.timeSeconds / 60), 0)

  // Per-subject
  const subjectMap = new Map<string, { total: number; completed: number }>()
  for (const course of realCourses) {
    if (!subjectMap.has(course.subject)) subjectMap.set(course.subject, { total: 0, completed: 0 })
    const entry = subjectMap.get(course.subject)!
    entry.total++
    const status = progress.courses[course.slug]?.status
    if (status === 'completed' || status === 'mastered') entry.completed++
  }

  // Timeline by week
  allDates = allDates.filter(d => d).sort()
  const weekMap = new Map<string, { exercises: number; revisions: number }>()
  for (const course of realCourses) {
    const p = progress.courses[course.slug]
    if (!p) continue
    for (const [, r] of Object.entries(p.exerciseResults || {})) {
      if (r.lastSeen) {
        const week = getWeekKey(r.lastSeen)
        if (!weekMap.has(week)) weekMap.set(week, { exercises: 0, revisions: 0 })
        weekMap.get(week)!.exercises++
      }
    }
    for (const rev of p.revisions || []) {
      const week = getWeekKey(rev.date)
      if (!weekMap.has(week)) weekMap.set(week, { exercises: 0, revisions: 0 })
      weekMap.get(week)!.revisions++
    }
  }

  const timeline = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, data]) => ({ week, ...data }))

  return {
    generatedAt: now,
    hash,
    profile: progress.profile || null,
    summary: {
      totalCourses: realCourses.length,
      completedCourses: completedCount,
      masteredCourses: masteredCount,
      masteryRate: realCourses.length > 0 ? Math.round((completedCount / realCourses.length) * 100) : 0,
      estimatedHours: Math.round(estimatedMinutes / 60 * 10) / 10,
      totalExercises,
      correctExercises,
      exerciseSuccessRate: totalExercises > 0 ? Math.round((correctExercises / totalExercises) * 100) : 0,
      totalRevisions,
      passedRevisions,
    },
    subjects: Array.from(subjectMap.entries()).map(([name, data]) => ({
      name: subjectLabels[name] || name,
      ...data,
      rate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
    })),
    timeline,
    exams: progress.exams || [],
    hardestExercises: hardest.slice(0, 10),
    integrity: {
      dataHash,
      snapshotSize: snapshot.length,
      courseCount: realCourses.length,
      exerciseCount: totalExercises,
      revisionCount: totalRevisions,
      examCount: (progress.exams || []).length,
      firstActivity: allDates[0] || null,
      lastActivity: allDates[allDates.length - 1] || null,
      githubRepo: 'https://github.com/Teyk0o/stellaire',
    },
  }
}

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr)
  const jan1 = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
  return `${d.getFullYear()}-S${week.toString().padStart(2, '0')}`
}

export function verifyReport(
  hash: string,
  reports: Array<{ date: string; hash: string; progressSnapshot: string }>,
  currentProgress: StellaireProgress,
): { authentic: boolean; date?: string; snapshotMatch: boolean; details: string } {
  const record = reports.find(r => r.hash === hash)
  if (!record) {
    return { authentic: false, snapshotMatch: false, details: 'Aucun rapport trouvé avec ce hash.' }
  }

  const snapshotAtGeneration = JSON.parse(record.progressSnapshot) as StellaireProgress
  const currentDataHash = computeDataHash(currentProgress)
  const snapshotDataHash = computeDataHash(snapshotAtGeneration)
  const snapshotMatch = currentDataHash === snapshotDataHash

  return {
    authentic: true,
    date: record.date,
    snapshotMatch,
    details: snapshotMatch
      ? 'Le rapport est authentique et les données n\'ont pas été modifiées depuis sa génération.'
      : 'Le rapport est authentique mais les données de progression ont évolué depuis sa génération (nouvelles révisions, exercices, etc.).',
  }
}
