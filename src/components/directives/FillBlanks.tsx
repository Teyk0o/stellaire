'use client'

import { useState, useMemo, type ReactNode } from 'react'
import katex from 'katex'
import { Check, X } from 'lucide-react'
import { useExerciseProgress } from '@/components/course/ProgressContext'
import { useStableExerciseId } from '@/components/course/ExerciseIdContext'

interface FillBlanksProps {
  children?: ReactNode
}

interface Segment {
  type: 'text' | 'blank'
  value: string
}

function parseTemplate(text: string): Segment[] {
  const segments: Segment[] = []
  const regex = /\[\[([^\]]+)\]\]/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    }
    segments.push({ type: 'blank', value: match[1] })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) })
  }

  return segments
}

function renderKatexText(text: string): string {
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

export function FillBlanks({ children }: FillBlanksProps) {
  const rawText = useMemo(() => extractRawText(children), [children])
  const segments = useMemo(() => parseTemplate(rawText), [rawText])
  const blanks = useMemo(() => segments.filter(s => s.type === 'blank'), [segments])

  const ctx = useExerciseProgress()
  const id = useStableExerciseId('fb')

  const existing = ctx?.getExerciseResult(id)
  const [values, setValues] = useState<string[]>(() =>
    existing?.answer ? JSON.parse(existing.answer) : blanks.map(() => '')
  )
  const [submitted, setSubmitted] = useState(() => !!existing?.answer)
  const locked = existing?.correct === true

  function updateValue(i: number, val: string) {
    const next = [...values]
    next[i] = val
    setValues(next)
  }

  function submit() {
    if (locked) return
    setSubmitted(true)
    const allCorrect = blanks.every((blank, i) =>
      values[i].trim().toLowerCase() === blank.value.trim().toLowerCase()
    )
    ctx?.markExerciseComplete(id, allCorrect, 1, JSON.stringify(values))
  }

  let blankIndex = 0

  return (
    <div className="my-6 rounded-lg border border-foreground/10 p-5">
      <div className="flex flex-wrap items-center gap-1 text-lg leading-relaxed">
        {segments.map((seg, i) => {
          if (seg.type === 'text') {
            return (
              <span
                key={i}
                dangerouslySetInnerHTML={{ __html: renderKatexText(seg.value) }}
              />
            )
          }

          const idx = blankIndex++
          const correct = values[idx].trim().toLowerCase() === seg.value.trim().toLowerCase()

          return (
            <span key={i} className="inline-flex items-center gap-1">
              <input
                type="text"
                value={values[idx]}
                onChange={e => updateValue(idx, e.target.value)}
                disabled={submitted}
                className={`inline-block w-16 px-2 py-0.5 text-center rounded border text-base outline-none transition-colors ${
                  submitted && correct ? 'border-success bg-success/5' :
                  submitted && !correct ? 'border-error bg-error/5' :
                  'border-foreground/20 focus:border-accent'
                }`}
                style={{ width: `${Math.max(seg.value.length * 0.7 + 1, 3)}em` }}
              />
              {submitted && !correct && (
                <span className="text-xs text-error">{seg.value}</span>
              )}
            </span>
          )
        })}
      </div>
      {!submitted && (
        <button
          onClick={submit}
          disabled={values.some(v => v.trim() === '')}
          className="mt-4 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
        >
          Valider
        </button>
      )}
      {submitted && (
        <div className="mt-3 flex items-center gap-2">
          {blanks.every((b, i) => values[i].trim().toLowerCase() === b.value.trim().toLowerCase())
            ? <><Check size={16} className="text-success" /><span className="text-sm text-success">Correct !</span></>
            : <><X size={16} className="text-error" /><span className="text-sm text-error">Il y a des erreurs.</span></>
          }
        </div>
      )}
    </div>
  )
}
