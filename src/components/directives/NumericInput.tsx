'use client'

import { useState, type ReactNode, type FormEvent } from 'react'
import { Check, X } from 'lucide-react'
import { useExerciseProgress } from '@/components/course/ProgressContext'
import { useStableExerciseId } from '@/components/course/ExerciseIdContext'

interface NumericInputProps {
  answer: string
  tolerance?: string
  children?: ReactNode
}

export function NumericInput({ answer, tolerance = '0', children }: NumericInputProps) {
  const expected = parseFloat(answer)
  const tol = parseFloat(tolerance)
  const ctx = useExerciseProgress()
  const id = useStableExerciseId('num')

  const existing = ctx?.getExerciseResult(id)
  const [value, setValue] = useState(() => existing?.answer ?? '')
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(() => {
    if (!existing?.answer) return null
    return existing.correct ? 'correct' : 'incorrect'
  })
  const [attempts, setAttempts] = useState(() => existing?.attempts ?? 0)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = parseFloat(value.replace(',', '.'))
    if (isNaN(parsed)) return
    const newAttempts = attempts + 1
    setAttempts(newAttempts)
    const correct = Math.abs(parsed - expected) <= tol
    setResult(correct ? 'correct' : 'incorrect')
    ctx?.markExerciseComplete(id, correct, newAttempts, value)
  }

  return (
    <div className="my-6 rounded-lg border border-foreground/10 p-5">
      {children && <div className="prose mb-4">{children}</div>}
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={e => { setValue(e.target.value); if (result !== 'correct') setResult(null) }}
          placeholder="Ta réponse"
          disabled={result === 'correct'}
          className={`px-4 py-2 rounded-lg border text-base w-40 outline-none transition-colors ${
            result === 'correct' ? 'border-success bg-success/5' :
            result === 'incorrect' ? 'border-error bg-error/5' :
            'border-foreground/10 focus:border-accent'
          }`}
        />
        {result !== 'correct' && (
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors cursor-pointer"
          >
            Valider
          </button>
        )}
        {result === 'correct' && <Check size={20} className="text-success" />}
        {result === 'incorrect' && (
          <div className="flex items-center gap-2">
            <X size={20} className="text-error" />
            <span className="text-sm text-secondary">Réessaie !</span>
          </div>
        )}
      </form>
    </div>
  )
}
