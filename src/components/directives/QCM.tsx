'use client'

import { useState, useRef, type ReactNode } from 'react'
import katex from 'katex'
import { useExerciseProgress } from '@/components/course/ProgressContext'

interface QCMProps {
  correct: string
  options: string | string[]
  children?: ReactNode
}

function renderWithKatex(text: string): string {
  return text.replace(/\$([^$]+)\$/g, (_, math) => {
    try {
      return katex.renderToString(math, { throwOnError: false })
    } catch {
      return `$${math}$`
    }
  })
}

export function QCM({ correct, options: rawOptions, children }: QCMProps) {
  const options: string[] = typeof rawOptions === 'string' ? JSON.parse(rawOptions) : rawOptions
  const [selected, setSelected] = useState<number | null>(null)
  const [attempts, setAttempts] = useState(0)
  const correctIndex = parseInt(correct, 10)
  const answered = selected !== null
  const ctx = useExerciseProgress()
  const id = useRef(`qcm-${Math.random().toString(36).slice(2, 8)}`)

  return (
    <div className="my-6 rounded-lg border border-foreground/10 p-5">
      {children && <div className="prose mb-4">{children}</div>}
      <div className="space-y-2">
        {options.map((option, i) => {
          const isCorrect = i === correctIndex
          const isSelected = i === selected
          let style = 'border-foreground/10 hover:border-accent/50'
          if (answered) {
            if (isCorrect) style = 'border-success bg-success/5'
            else if (isSelected) style = 'border-error bg-error/5'
            else style = 'border-foreground/5 opacity-50'
          }

          return (
            <button
              key={i}
              onClick={() => {
                if (answered) return
                const newAttempts = attempts + 1
                setAttempts(newAttempts)
                setSelected(i)
                ctx?.markExerciseComplete(id.current, i === correctIndex, newAttempts)
              }}
              disabled={answered}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg border text-left transition-colors cursor-pointer disabled:cursor-default ${style}`}
            >
              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                answered && isCorrect ? 'border-success bg-success' :
                answered && isSelected ? 'border-error bg-error' :
                'border-foreground/20'
              }`}>
                {answered && (isCorrect || isSelected) && (
                  <span className="text-white text-xs font-bold">
                    {isCorrect ? '✓' : '✗'}
                  </span>
                )}
              </span>
              <span
                className="flex-1"
                dangerouslySetInnerHTML={{ __html: renderWithKatex(option) }}
              />
            </button>
          )
        })}
      </div>
      {answered && selected !== correctIndex && (
        <p className="mt-3 text-sm text-secondary">
          La bonne réponse était l&apos;option {correctIndex + 1}.
        </p>
      )}
    </div>
  )
}
