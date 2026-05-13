'use client'

import { createContext, useContext, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { useProgress } from '@/hooks/useProgress'
import type { CourseProgress } from '@/types/course'

interface ProgressContextValue {
  progress: CourseProgress
  markExerciseComplete: (exerciseId: string, correct: boolean, attempts: number) => Promise<CourseProgress>
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

export function ProgressProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const { progress, markExerciseComplete, markOpened } = useProgress(slug)
  const opened = useRef(false)

  useEffect(() => {
    if (!opened.current) {
      opened.current = true
      markOpened()
    }
  }, [markOpened])

  return (
    <ProgressContext.Provider value={{ progress, markExerciseComplete }}>
      {children}
    </ProgressContext.Provider>
  )
}

export function useExerciseProgress() {
  return useContext(ProgressContext)
}

let exerciseCounter = 0
export function useExerciseId() {
  const ref = useRef<string | null>(null)
  if (ref.current === null) {
    ref.current = `ex-${++exerciseCounter}`
  }
  return ref.current
}
