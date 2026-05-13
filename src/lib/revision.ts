import type { CourseProgress, ExerciseResult } from '@/types/course'
import type { Exercise } from './exercises'

const INTERVALS = [1, 3, 7, 14, 30]

export function computeNextRevision(progress: CourseProgress): string | null {
  if (progress.status !== 'completed' && progress.status !== 'mastered') return null

  const revisions = progress.revisions
  if (revisions.length === 0) {
    const base = progress.completedAt || new Date().toISOString().split('T')[0]
    return addDays(base, INTERVALS[0])
  }

  const lastRevision = revisions[revisions.length - 1]
  if (!lastRevision.passed) {
    return addDays(lastRevision.date, INTERVALS[0])
  }

  const consecutivePasses = countConsecutivePasses(revisions)
  const intervalIndex = Math.min(consecutivePasses, INTERVALS.length - 1)
  return addDays(lastRevision.date, INTERVALS[intervalIndex])
}

function countConsecutivePasses(revisions: CourseProgress['revisions']): number {
  let count = 0
  for (let i = revisions.length - 1; i >= 0; i--) {
    if (revisions[i].passed) count++
    else break
  }
  return count
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

export function isDueToday(nextRevision: string | undefined | null): boolean {
  if (!nextRevision) return false
  const today = new Date().toISOString().split('T')[0]
  return nextRevision <= today
}

export function daysOverdue(nextRevision: string): number {
  const today = new Date()
  const due = new Date(nextRevision)
  const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

export function computeExerciseSM2(
  result: ExerciseResult | undefined,
  wasCorrect: boolean,
  attempts: number,
): Partial<ExerciseResult> {
  const ef = result?.easeFactor ?? 2.5
  const interval = result?.interval ?? 1
  const today = new Date().toISOString().split('T')[0]

  const quality = wasCorrect ? (attempts === 1 ? 5 : 3) : 1
  const newEf = Math.max(1.3, ef + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

  let newInterval: number
  if (quality < 3) {
    newInterval = 1
  } else if (interval === 1) {
    newInterval = 1
  } else if (interval <= 3) {
    newInterval = 6
  } else {
    newInterval = Math.round(interval * newEf)
  }

  return {
    lastSeen: today,
    interval: newInterval,
    easeFactor: newEf,
    nextDue: addDays(today, newInterval),
  }
}

export function selectRevisionExercises(
  exercises: Exercise[],
  results: Record<string, ExerciseResult>,
  count: number,
): Exercise[] {
  const today = new Date().toISOString().split('T')[0]

  const scored = exercises.map(ex => {
    const r = results[ex.id]
    let priority = 0

    if (r?.nextDue && r.nextDue <= today) {
      priority = 100 + daysOverdue(r.nextDue)
    } else if (r && !r.correct) {
      priority = 50
    } else if (r?.easeFactor && r.easeFactor < 2.0) {
      priority = 30
    } else if (!r) {
      priority = 10
    } else {
      priority = 0
    }

    return { exercise: ex, priority }
  })

  scored.sort((a, b) => b.priority - a.priority || Math.random() - 0.5)
  return scored.slice(0, count).map(s => s.exercise)
}
