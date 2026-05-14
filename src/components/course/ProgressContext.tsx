'use client'

import { createContext, useContext, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { useProgress } from '@/hooks/useProgress'
import { ExerciseIdProvider } from './ExerciseIdContext'
import type { CourseProgress, ExerciseResult } from '@/types/course'

interface ProgressContextValue {
  progress: CourseProgress
  markExerciseComplete: (exerciseId: string, correct: boolean, attempts: number, answer?: string) => Promise<CourseProgress>
  getExerciseResult: (exerciseId: string) => ExerciseResult | undefined
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

export function ProgressProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const { progress, loading, markExerciseComplete, markOpened } = useProgress(slug)
  const opened = useRef(false)

  useEffect(() => {
    if (!loading && !opened.current) {
      opened.current = true
      markOpened()
    }
  }, [loading, markOpened])

  const getExerciseResult = useCallback((exerciseId: string) => {
    return progress.exerciseResults[exerciseId]
  }, [progress])

  if (loading) {
    return <div className="py-12 text-center text-secondary text-sm">Chargement...</div>
  }

  return (
    <ProgressContext.Provider value={{ progress, markExerciseComplete, getExerciseResult }}>
      <ExerciseIdProvider>
        {children}
      </ExerciseIdProvider>
    </ProgressContext.Provider>
  )
}

export function useExerciseProgress() {
  return useContext(ProgressContext)
}
