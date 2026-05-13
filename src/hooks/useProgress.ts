'use client'

import { useState, useEffect, useCallback } from 'react'
import type { CourseProgress, CourseStatus } from '@/types/course'

const DEFAULT_PROGRESS: CourseProgress = {
  status: 'not-started',
  completedExercises: [],
  exerciseResults: {},
  revisions: [],
}

export function useProgress(slug: string): {
  progress: CourseProgress
  loading: boolean
  update: (partial: Partial<CourseProgress>) => Promise<CourseProgress>
  markExerciseComplete: (exerciseId: string, correct: boolean, attempts: number, answer?: string) => Promise<CourseProgress>
  setStatus: (status: CourseStatus) => Promise<CourseProgress>
  markOpened: () => Promise<CourseProgress | void>
} {
  const [progress, setProgress] = useState<CourseProgress>(DEFAULT_PROGRESS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/progress?slug=${encodeURIComponent(slug)}`)
      .then(r => r.json())
      .then(data => setProgress(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  const update = useCallback(async (partial: Partial<CourseProgress>) => {
    const res = await fetch('/api/progress', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, ...partial }),
    })
    const updated = await res.json()
    setProgress(updated)
    return updated
  }, [slug])

  const markExerciseComplete = useCallback(async (exerciseId: string, correct: boolean, attempts: number, answer?: string) => {
    return update({
      completedExercises: [exerciseId],
      exerciseResults: { [exerciseId]: { correct, attempts, answer } },
      status: 'in-progress',
    })
  }, [update])

  const setStatus = useCallback(async (status: CourseStatus) => {
    const extra: Partial<CourseProgress> = { status }
    if (status === 'completed') extra.completedAt = new Date().toISOString().split('T')[0]
    return update(extra)
  }, [update])

  const markOpened = useCallback(async () => {
    if (progress.status === 'not-started') {
      return update({
        status: 'in-progress',
        lastOpened: new Date().toISOString(),
      })
    }
    return update({ lastOpened: new Date().toISOString() })
  }, [update, progress.status])

  return { progress, loading, update, markExerciseComplete, setStatus, markOpened }
}
