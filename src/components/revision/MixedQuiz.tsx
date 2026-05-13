'use client'

import { useState, useRef } from 'react'
import katex from 'katex'
import { Check, X, ArrowRight, Trophy, RotateCcw, Clock } from 'lucide-react'
import type { Exercise } from '@/lib/exercises'

type Mode = 'micro' | 'exam'

interface MixedQuizProps {
  exercises: Exercise[]
  mode: Mode
  onComplete: (results: { correct: boolean; slug: string; exerciseId: string }[], timeSeconds: number, timePerQuestion: number[]) => void
  onCancel: () => void
}

function renderKatex(text: string): string {
  return text.replace(/\$\$([^$]+)\$\$/g, (_, math) => {
    try { return katex.renderToString(math, { throwOnError: false, displayMode: true }) }
    catch { return `$$${math}$$` }
  }).replace(/\$([^$]+)\$/g, (_, math) => {
    try { return katex.renderToString(math, { throwOnError: false }) }
    catch { return `$${math}$` }
  })
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function MixedQuiz({ exercises, mode, onComplete, onCancel }: MixedQuizProps) {
  const [current, setCurrent] = useState(0)
  const [results, setResults] = useState<{ correct: boolean; slug: string; exerciseId: string }[]>([])
  const [answered, setAnswered] = useState(false)
  const [finished, setFinished] = useState(false)
  const [selectedQcm, setSelectedQcm] = useState<number | null>(null)
  const [selectedTf, setSelectedTf] = useState<boolean | null>(null)
  const [numericValue, setNumericValue] = useState('')
  const [numericResult, setNumericResult] = useState<boolean | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const startTime = useRef(Date.now())
  const questionStart = useRef(Date.now())
  const timesPerQ = useRef<number[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval>>(null)

  if (!timerRef.current) {
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000))
    }, 1000)
  }

  const exercise = exercises[current]
  const score = results.length > 0 ? results.filter(r => r.correct).length / results.length : 0

  function recordAnswer(correct: boolean) {
    const qTime = Math.floor((Date.now() - questionStart.current) / 1000)
    timesPerQ.current.push(qTime)

    const newResults = [...results, { correct, slug: exercise.slug, exerciseId: exercise.id }]
    setResults(newResults)

    if (mode === 'exam') {
      if (current === exercises.length - 1) {
        finish(newResults)
      } else {
        setCurrent(c => c + 1)
        questionStart.current = Date.now()
        resetInputs()
      }
    } else {
      setAnswered(true)
      if (current === exercises.length - 1) {
        finish(newResults)
      }
    }
  }

  function finish(finalResults: typeof results) {
    if (timerRef.current) clearInterval(timerRef.current)
    const totalTime = Math.floor((Date.now() - startTime.current) / 1000)
    setFinished(true)
    onComplete(finalResults, totalTime, timesPerQ.current)
  }

  function nextQuestion() {
    setCurrent(c => c + 1)
    questionStart.current = Date.now()
    resetInputs()
  }

  function resetInputs() {
    setAnswered(false)
    setSelectedQcm(null)
    setSelectedTf(null)
    setNumericValue('')
    setNumericResult(null)
  }

  if (finished) {
    const correctCount = results.filter(r => r.correct).length
    const passed = score >= 0.8
    return (
      <div className="text-center py-8">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${passed ? 'bg-success/10' : 'bg-error/10'}`}>
          {passed ? <Trophy size={32} className="text-success" /> : <RotateCcw size={32} className="text-error" />}
        </div>
        <h3 className="text-xl font-semibold mb-2">
          {mode === 'exam' ? 'Examen terminé' : passed ? 'Bien joué !' : 'Continue à pratiquer'}
        </h3>
        <p className="text-secondary mb-1">
          {correctCount}/{results.length} ({Math.round(score * 100)}%)
        </p>
        <p className="text-sm text-secondary mb-6">
          Temps : {formatTime(elapsed)}
        </p>
        {mode === 'exam' && (
          <div className="max-w-sm mx-auto mb-6 space-y-1">
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {r.correct ? <Check size={14} className="text-success" /> : <X size={14} className="text-error" />}
                <span className="text-secondary">Q{i + 1}</span>
                <span className="text-xs text-secondary/60">{formatTime(timesPerQ.current[i])}</span>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => onCancel()}
          className="px-6 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 transition-colors cursor-pointer"
        >
          Terminer
        </button>
      </div>
    )
  }

  const showFeedback = mode === 'micro' && answered

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-secondary">
            Question {current + 1}/{exercises.length}
            {exercise.slug && <span className="ml-2 text-xs text-secondary/50">{exercise.slug}</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {mode === 'exam' && (
            <span className="flex items-center gap-1 text-sm font-mono text-secondary">
              <Clock size={14} /> {formatTime(elapsed)}
            </span>
          )}
          <button onClick={onCancel} className="text-sm text-secondary hover:text-foreground cursor-pointer">
            Annuler
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-6">
        {exercises.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${
            i < results.length
              ? (mode === 'exam' ? 'bg-accent' : results[i].correct ? 'bg-success' : 'bg-error')
              : i === current ? 'bg-accent' : 'bg-foreground/10'
          }`} />
        ))}
      </div>

      <div className="prose mb-6" dangerouslySetInnerHTML={{ __html: renderKatex(exercise.question) }} />

      {exercise.type === 'qcm' && exercise.options && (
        <div className="space-y-2">
          {exercise.options.map((option, i) => {
            const correctIndex = parseInt(exercise.correct, 10)
            const isCorrect = i === correctIndex
            const isSelected = i === selectedQcm
            let style = 'border-foreground/10 hover:border-accent/50'
            if (showFeedback) {
              if (isCorrect) style = 'border-success bg-success/5'
              else if (isSelected) style = 'border-error bg-error/5'
              else style = 'border-foreground/5 opacity-50'
            }
            return (
              <button key={i} onClick={() => {
                if (answered && mode === 'micro') return
                setSelectedQcm(i)
                recordAnswer(i === correctIndex)
              }} disabled={showFeedback}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg border text-left transition-colors cursor-pointer disabled:cursor-default ${style}`}>
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  showFeedback && isCorrect ? 'border-success bg-success' :
                  showFeedback && isSelected ? 'border-error bg-error' : 'border-foreground/20'
                }`}>
                  {showFeedback && (isCorrect || isSelected) && (
                    <span className="text-white text-xs font-bold">{isCorrect ? '✓' : '✗'}</span>
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
            if (showFeedback) {
              if (isCorrect) style = 'border-success bg-success/5'
              else if (isSelected) style = 'border-error bg-error/5'
              else style = 'border-foreground/5 opacity-50'
            }
            return (
              <button key={String(value)} onClick={() => {
                if (showFeedback) return
                setSelectedTf(value)
                recordAnswer(value === (exercise.correct === 'true'))
              }} disabled={showFeedback}
                className={`flex items-center gap-2 px-5 py-3 rounded-lg border text-sm font-medium transition-colors cursor-pointer disabled:cursor-default ${style}`}>
                {showFeedback && isCorrect && <Check size={16} className="text-success" />}
                {showFeedback && isSelected && !isCorrect && <X size={16} className="text-error" />}
                {value ? 'Vrai' : 'Faux'}
              </button>
            )
          })}
        </div>
      )}

      {exercise.type === 'numeric' && (
        <form onSubmit={e => {
          e.preventDefault()
          if (showFeedback) return
          const parsed = parseFloat(numericValue.replace(',', '.'))
          if (isNaN(parsed)) return
          const expected = parseFloat(exercise.correct)
          const tol = exercise.tolerance ? parseFloat(exercise.tolerance) : 0
          const correct = Math.abs(parsed - expected) <= tol
          setNumericResult(correct)
          recordAnswer(correct)
        }} className="flex items-center gap-3">
          <input type="text" inputMode="decimal" value={numericValue}
            onChange={e => setNumericValue(e.target.value)}
            placeholder="Ta réponse" disabled={showFeedback}
            className={`px-4 py-2 rounded-lg border text-base w-40 outline-none transition-colors ${
              showFeedback && numericResult === true ? 'border-success bg-success/5' :
              showFeedback && numericResult === false ? 'border-error bg-error/5' :
              'border-foreground/10 focus:border-accent'
            }`} />
          {!showFeedback && (
            <button type="submit" className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors cursor-pointer">
              Valider
            </button>
          )}
          {showFeedback && numericResult === true && <Check size={20} className="text-success" />}
          {showFeedback && numericResult === false && <span className="text-sm text-secondary">Réponse : {exercise.correct}</span>}
        </form>
      )}

      {showFeedback && !finished && (
        <button onClick={nextQuestion}
          className="mt-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground/5 text-sm font-medium hover:bg-foreground/10 transition-colors cursor-pointer">
          Question suivante <ArrowRight size={16} />
        </button>
      )}
    </div>
  )
}
