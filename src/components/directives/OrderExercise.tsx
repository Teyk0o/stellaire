'use client'

import { useState, useMemo, useRef, type ReactNode } from 'react'
import { Check, X, GripVertical, ArrowUp, ArrowDown } from 'lucide-react'
import { useExerciseProgress } from '@/components/course/ProgressContext'

interface OrderExerciseProps {
  children?: ReactNode
}

function extractRawText(node: ReactNode): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (!node) return ''
  if (Array.isArray(node)) return node.map(extractRawText).join('')
  if (typeof node === 'object' && 'props' in node) {
    return extractRawText((node as { props: { children?: ReactNode } }).props.children)
  }
  return ''
}

function parseItems(text: string): string[] {
  return text
    .split('\n')
    .map(line => line.replace(/^[-*]\s*/, '').trim())
    .filter(line => line.length > 0)
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function OrderExercise({ children }: OrderExerciseProps) {
  const rawText = useMemo(() => extractRawText(children), [children])
  const parts = useMemo(() => {
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean)
    const promptLines: string[] = []
    const itemLines: string[] = []
    let inList = false
    for (const line of lines) {
      if (line.startsWith('-') || line.startsWith('*')) {
        inList = true
        itemLines.push(line.replace(/^[-*]\s*/, ''))
      } else if (!inList) {
        promptLines.push(line)
      }
    }
    return { prompt: promptLines.join(' '), correctOrder: itemLines }
  }, [rawText])

  const [items, setItems] = useState<string[]>(() => shuffle(parts.correctOrder))
  const [submitted, setSubmitted] = useState(false)
  const ctx = useExerciseProgress()
  const id = useRef(`ord-${Math.random().toString(36).slice(2, 8)}`)

  const isCorrect = submitted && items.every((item, i) => item === parts.correctOrder[i])

  function moveUp(index: number) {
    if (submitted || index === 0) return
    const next = [...items]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    setItems(next)
  }

  function moveDown(index: number) {
    if (submitted || index === items.length - 1) return
    const next = [...items]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    setItems(next)
  }

  function submit() {
    if (submitted) return
    setSubmitted(true)
    const correct = items.every((item, i) => item === parts.correctOrder[i])
    ctx?.markExerciseComplete(id.current, correct, 1)
  }

  return (
    <div className="my-6 rounded-lg border border-foreground/10 p-5">
      {parts.prompt && <p className="prose mb-4">{parts.prompt}</p>}
      <div className="space-y-2">
        {items.map((item, i) => {
          const correctPos = parts.correctOrder.indexOf(item)
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
              <span className="flex-1 text-sm">{item}</span>
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
            {parts.correctOrder.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
