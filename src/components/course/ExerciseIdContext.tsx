'use client'

import { createContext, useContext, useRef } from 'react'

const ExerciseIdContext = createContext<{ next: (prefix: string) => string }>({
  next: (prefix) => `${prefix}-0`,
})

export function ExerciseIdProvider({ children }: { children: React.ReactNode }) {
  const counter = useRef(0)

  const next = (prefix: string) => {
    return `${prefix}-${counter.current++}`
  }

  return (
    <ExerciseIdContext.Provider value={{ next }}>
      {children}
    </ExerciseIdContext.Provider>
  )
}

export function useStableExerciseId(prefix: string) {
  const ctx = useContext(ExerciseIdContext)
  const id = useRef<string | null>(null)
  if (id.current === null) {
    id.current = ctx.next(prefix)
  }
  return id.current
}
