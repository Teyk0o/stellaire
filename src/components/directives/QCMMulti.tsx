'use client'

import { useState, type ReactNode } from 'react'
import katex from 'katex'
import { useExerciseProgress } from '@/components/course/ProgressContext'
import { useStableExerciseId } from '@/components/course/ExerciseIdContext'

interface QCMMultiProps {
  correct: string
  options: string | string[]
  children?: ReactNode
}

function renderWithKatex(text: string): string {
  return text.replace(/\$([^$]+)\$/g, (_, math) => {
    try {
      return katex.renderToString(math, { throwOnError: false })
    } catch { return `$${math}$` }
  })
}

export function QCMMulti({ correct, options: rawOptions, children }: QCMMultiProps) {
  const options: string[] = typeof rawOptions === 'string' ? JSON.parse(rawOptions) : rawOptions
  const correctIndices: Set<number> = new Set(JSON.parse(correct))
  const ctx = useExerciseProgress()
  const id = useStableExerciseId('qcm-m')

  const existing = ctx?.getExerciseResult(id)
  const [selected, setSelected] = useState<Set<number>>(() =>
    existing?.answer ? new Set(JSON.parse(existing.answer)) : new Set()
  )
  const [submitted, setSubmitted] = useState(() => !!existing?.answer)
  const locked = existing?.correct === true

  function toggle(i: number) {
    if (locked) return
    const next = new Set(selected)
    if (next.has(i)) next.delete(i)
    else next.add(i)
    setSelected(next)
  }

  function submit() {
    if (locked) return
    setSubmitted(true)
    const isCorrect = selected.size === correctIndices.size &&
      [...selected].every(i => correctIndices.has(i))
    ctx?.markExerciseComplete(id, isCorrect, 1, JSON.stringify([...selected]))
  }

  return (
    <div className="my-6 rounded-lg border border-foreground/10 p-5">
      {children && <div className="prose mb-3">{children}</div>}
      <p className="text-xs text-secondary mb-3">Plusieurs réponses possibles</p>
      <div className="space-y-2">
        {options.map((option, i) => {
          const isCorrect = correctIndices.has(i)
          const isSelected = selected.has(i)
          let style = 'border-foreground/10 hover:border-accent/50'
          if (submitted) {
            if (isCorrect && isSelected) style = 'border-success bg-success/5'
            else if (isCorrect && !isSelected) style = 'border-success/50 bg-success/5'
            else if (isSelected && !isCorrect) style = 'border-error bg-error/5'
            else style = 'border-foreground/5 opacity-50'
          } else if (isSelected) {
            style = 'border-accent bg-accent/5'
          }

          return (
            <button
              key={i}
              onClick={() => toggle(i)}
              disabled={submitted}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg border text-left transition-colors cursor-pointer disabled:cursor-default ${style}`}
            >
              <span className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 text-xs font-bold ${
                submitted && isCorrect ? 'border-success bg-success text-white' :
                submitted && isSelected ? 'border-error bg-error text-white' :
                isSelected ? 'border-accent bg-accent text-white' :
                'border-foreground/20'
              }`}>
                {submitted && isCorrect && '✓'}
                {submitted && isSelected && !isCorrect && '✗'}
                {!submitted && isSelected && '✓'}
              </span>
              <span
                className="flex-1"
                dangerouslySetInnerHTML={{ __html: renderWithKatex(option) }}
              />
            </button>
          )
        })}
      </div>
      {!submitted && (
        <button
          onClick={submit}
          disabled={selected.size === 0}
          className="mt-4 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
        >
          Valider
        </button>
      )}
    </div>
  )
}
