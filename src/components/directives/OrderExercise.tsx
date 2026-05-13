'use client'

import { useState, useMemo, type ReactNode } from 'react'
import katex from 'katex'
import { Check, X, GripVertical, ArrowUp, ArrowDown } from 'lucide-react'
import { useExerciseProgress } from '@/components/course/ProgressContext'
import { useStableExerciseId } from '@/components/course/ExerciseIdContext'

interface OrderExerciseProps {
  options?: string | string[]
  children?: ReactNode
}

function renderKatex(text: string): string {
  return text
    .replace(/\$\$([^$]+)\$\$/g, (_, math) => {
      try { return katex.renderToString(math, { throwOnError: false, displayMode: true }) }
      catch { return `$$${math}$$` }
    })
    .replace(/\$([^$]+)\$/g, (_, math) => {
      try { return katex.renderToString(math, { throwOnError: false }) }
      catch { return `$${math}$` }
    })
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function OrderExercise({ options: rawOptions, children }: OrderExerciseProps) {
  const correctOrder: string[] = useMemo(() => {
    if (!rawOptions) return []
    return typeof rawOptions === 'string' ? JSON.parse(rawOptions) : rawOptions
  }, [rawOptions])

  const ctx = useExerciseProgress()
  const id = useStableExerciseId('ord')

  const existing = ctx?.getExerciseResult(id)
  const [items, setItems] = useState<string[]>(() =>
    existing?.answer ? JSON.parse(existing.answer) : shuffle(correctOrder)
  )
  const [submitted, setSubmitted] = useState(() => !!existing?.answer)
  const locked = existing?.correct === true

  const isCorrect = submitted && items.every((item, i) => item === correctOrder[i])

  function moveUp(index: number) {
    if (locked || index === 0) return
    const next = [...items]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    setItems(next)
  }

  function moveDown(index: number) {
    if (locked || index === items.length - 1) return
    const next = [...items]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    setItems(next)
  }

  function submit() {
    if (locked) return
    setSubmitted(true)
    const correct = items.every((item, i) => item === correctOrder[i])
    ctx?.markExerciseComplete(id, correct, 1, JSON.stringify(items))
  }

  return (
    <div className="my-6 rounded-lg border border-foreground/10 p-5">
      {children && <div className="prose mb-4">{children}</div>}
      <div className="space-y-2">
        {items.map((item, i) => {
          const correctPos = correctOrder.indexOf(item)
          const inPlace = submitted && correctPos === i

          return (
            <div
              key={`${item}-${i}`}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                submitted
                  ? inPlace ? 'border-success bg-success/5' : 'border-error bg-error/5'
                  : 'border-foreground/10'
              }`}
            >
              <GripVertical size={16} className="text-secondary/40 shrink-0" />
              <span className="text-sm font-medium text-secondary w-6 shrink-0">{i + 1}.</span>
              <span className="flex-1 text-sm" dangerouslySetInnerHTML={{ __html: renderKatex(item) }} />
              {!submitted && (
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    onClick={() => moveUp(i)}
                    disabled={i === 0}
                    className="p-0.5 text-secondary hover:text-foreground disabled:opacity-20 cursor-pointer disabled:cursor-default"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => moveDown(i)}
                    disabled={i === items.length - 1}
                    className="p-0.5 text-secondary hover:text-foreground disabled:opacity-20 cursor-pointer disabled:cursor-default"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
              )}
              {submitted && (
                inPlace
                  ? <Check size={16} className="text-success shrink-0" />
                  : <X size={16} className="text-error shrink-0" />
              )}
            </div>
          )
        })}
      </div>

      {!submitted && (
        <button
          onClick={submit}
          className="mt-4 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors cursor-pointer"
        >
          Valider l&apos;ordre
        </button>
      )}

      {submitted && !isCorrect && (
        <div className="mt-4 p-4 rounded-lg bg-foreground/3">
          <p className="text-sm font-medium text-secondary mb-2">Ordre correct :</p>
          <ol className="text-sm text-secondary space-y-1 list-decimal list-inside">
            {correctOrder.map((item, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: renderKatex(item) }} />
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
