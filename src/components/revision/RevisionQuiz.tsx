'use client'

import { useState } from 'react'
import katex from 'katex'
import { Check, X, ArrowRight, Trophy, RotateCcw } from 'lucide-react'
import type { Exercise } from '@/lib/exercises'

interface RevisionQuizProps {
  slug: string
  title: string
  exercises: Exercise[]
  onComplete: (score: number) => void
  onCancel: () => void
}

function renderKatex(text: string): string {
  return text.replace(/\$\$([^$]+)\$\$/g, (_, math) => {
    try {
      return katex.renderToString(math, { throwOnError: false, displayMode: true })
    } catch { return `$$${math}$$` }
  }).replace(/\$([^$]+)\$/g, (_, math) => {
    try {
      return katex.renderToString(math, { throwOnError: false })
    } catch { return `$${math}$` }
  })
}

export function RevisionQuiz({ slug, title, exercises, onComplete, onCancel }: RevisionQuizProps) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [selectedQcm, setSelectedQcm] = useState<number | null>(null)
  const [selectedTf, setSelectedTf] = useState<boolean | null>(null)
  const [numericValue, setNumericValue] = useState('')
  const [numericResult, setNumericResult] = useState<boolean | null>(null)
  const [answered, setAnswered] = useState(false)
  const [finished, setFinished] = useState(false)

  const exercise = exercises[current]
  const score = answers.length > 0 ? answers.filter(Boolean).length / answers.length : 0

  function recordAnswer(correct: boolean) {
    const newAnswers = [...answers, correct]
    setAnswers(newAnswers)
    setAnswered(true)

    if (current === exercises.length - 1) {
      const finalScore = newAnswers.filter(Boolean).length / newAnswers.length
      setFinished(true)
      fetch('/api/revision', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, score: finalScore }),
      })
    }
  }

  function nextQuestion() {
    setCurrent(c => c + 1)
    setSelectedQcm(null)
    setSelectedTf(null)
    setNumericValue('')
    setNumericResult(null)
    setAnswered(false)
  }

  if (finished) {
    const passed = score >= 0.8
    const correctCount = answers.filter(Boolean).length
    return (
      <div className="text-center py-8">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${passed ? 'bg-success/10' : 'bg-error/10'}`}>
          {passed ? <Trophy size={32} className="text-success" /> : <RotateCcw size={32} className="text-error" />}
        </div>
        <h3 className="text-xl font-semibold mb-2">
          {passed ? 'Révision réussie !' : 'À retravailler'}
        </h3>
        <p className="text-secondary mb-1">
          {correctCount}/{answers.length} bonnes réponses ({Math.round(score * 100)}%)
        </p>
        <p className="text-sm text-secondary mb-6">
          {passed
            ? 'La prochaine révision sera programmée plus tard.'
            : 'Une nouvelle révision sera programmée demain.'}
        </p>
        <button
          onClick={() => onComplete(score)}
          className="px-6 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 transition-colors cursor-pointer"
        >
          Continuer
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-secondary">Question {current + 1}/{exercises.length}</p>
        </div>
        <button
          onClick={onCancel}
          className="text-sm text-secondary hover:text-foreground cursor-pointer"
        >
          Annuler
        </button>
      </div>

      <div className="flex gap-1 mb-6">
        {exercises.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${
              i < answers.length
                ? answers[i] ? 'bg-success' : 'bg-error'
                : i === current ? 'bg-accent' : 'bg-foreground/10'
            }`}
          />
        ))}
      </div>

      <div
        className="prose mb-6"
        dangerouslySetInnerHTML={{ __html: renderKatex(exercise.question) }}
      />

      {exercise.type === 'qcm' && exercise.options && (
        <div className="space-y-2">
          {exercise.options.map((option, i) => {
            const correctIndex = parseInt(exercise.correct, 10)
            const isCorrect = i === correctIndex
            const isSelected = i === selectedQcm
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
                  setSelectedQcm(i)
                  recordAnswer(i === correctIndex)
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
                <span dangerouslySetInnerHTML={{ __html: renderKatex(option) }} />
              </button>
            )
          })}
        </div>
      )}

      {exercise.type === 'true-false' && (
        <div className="flex gap-3">
          {[true, false].map(value => {
            const isCorrect = value === (exercise.correct === 'true')
            const isSelected = value === selectedTf
            let style = 'border-foreground/10 hover:border-accent/50'
            if (answered) {
              if (isCorrect) style = 'border-success bg-success/5'
              else if (isSelected) style = 'border-error bg-error/5'
              else style = 'border-foreground/5 opacity-50'
            }
            return (
              <button
                key={String(value)}
                onClick={() => {
                  if (answered) return
                  setSelectedTf(value)
                  recordAnswer(value === (exercise.correct === 'true'))
                }}
                disabled={answered}
                className={`flex items-center gap-2 px-5 py-3 rounded-lg border text-sm font-medium transition-colors cursor-pointer disabled:cursor-default ${style}`}
              >
                {answered && isCorrect && <Check size={16} className="text-success" />}
                {answered && isSelected && !isCorrect && <X size={16} className="text-error" />}
                {value ? 'Vrai' : 'Faux'}
              </button>
            )
          })}
        </div>
      )}

      {exercise.type === 'numeric' && (
        <form
          onSubmit={e => {
            e.preventDefault()
            if (answered) return
            const parsed = parseFloat(numericValue.replace(',', '.'))
            if (isNaN(parsed)) return
            const expected = parseFloat(exercise.correct)
            const tol = exercise.tolerance ? parseFloat(exercise.tolerance) : 0
            const correct = Math.abs(parsed - expected) <= tol
            setNumericResult(correct)
            recordAnswer(correct)
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            inputMode="decimal"
            value={numericValue}
            onChange={e => setNumericValue(e.target.value)}
            placeholder="Ta réponse"
            disabled={answered}
            className={`px-4 py-2 rounded-lg border text-base w-40 outline-none transition-colors ${
              numericResult === true ? 'border-success bg-success/5' :
              numericResult === false ? 'border-error bg-error/5' :
              'border-foreground/10 focus:border-accent'
            }`}
          />
          {!answered && (
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors cursor-pointer"
            >
              Valider
            </button>
          )}
          {numericResult === true && <Check size={20} className="text-success" />}
          {numericResult === false && (
            <span className="text-sm text-secondary">Réponse : {exercise.correct}</span>
          )}
        </form>
      )}

      {answered && !finished && (
        <button
          onClick={nextQuestion}
          className="mt-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground/5 text-sm font-medium hover:bg-foreground/10 transition-colors cursor-pointer"
        >
          Question suivante <ArrowRight size={16} />
        </button>
      )}
    </div>
  )
}
