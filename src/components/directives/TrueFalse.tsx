'use client'

import { useState, type ReactNode } from 'react'
import { Check, X } from 'lucide-react'
import { useExerciseProgress } from '@/components/course/ProgressContext'
import { useStableExerciseId } from '@/components/course/ExerciseIdContext'

interface TrueFalseProps {
  answer: string
  children?: ReactNode
}

export function TrueFalse({ answer, children }: TrueFalseProps) {
  const correctAnswer = answer === 'true'
  const ctx = useExerciseProgress()
  const id = useStableExerciseId('tf')

  const existing = ctx?.getExerciseResult(id)
  const [selected, setSelected] = useState<boolean | null>(() =>
    existing?.answer !== undefined ? existing.answer === 'true' : null
  )
  const answered = selected !== null
  const locked = existing?.correct === true

  function handleSelect(value: boolean) {
    if (locked) return
    setSelected(value)
    ctx?.markExerciseComplete(id, value === correctAnswer, 1, String(value))
  }

  return (
    <div className="my-6 rounded-lg border border-foreground/10 p-5">
      {children && <div className="prose mb-4">{children}</div>}
      <div className="flex gap-3">
        {[true, false].map(value => {
          const isCorrect = value === correctAnswer
          const isSelected = value === selected
          let style = 'border-foreground/10 hover:border-accent/50'
          if (answered) {
            if (isCorrect) style = 'border-success bg-success/5'
            else if (isSelected) style = 'border-error bg-error/5'
            else style = 'border-foreground/5 opacity-50'
          }

          return (
            <button
              key={String(value)}
              onClick={() => handleSelect(value)}
              disabled={locked}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg border text-sm font-medium transition-colors cursor-pointer disabled:cursor-default ${style}`}
            >
              {answered && isCorrect && <Check size={16} className="text-success" />}
              {answered && isSelected && !isCorrect && <X size={16} className="text-error" />}
              {value ? 'Vrai' : 'Faux'}
            </button>
          )
        })}
      </div>
    </div>
  )
}
