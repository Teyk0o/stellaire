'use client'

import { useState } from 'react'
import { ContentShell } from '@/components/layout/ContentShell'
import { MixedQuiz } from '@/components/revision/MixedQuiz'
import { ClipboardList } from 'lucide-react'
import type { Exercise } from '@/lib/exercises'

export default function ExamenPage() {
  const [exercises, setExercises] = useState<Exercise[] | null>(null)
  const [loading, setLoading] = useState(false)

  function start() {
    setLoading(true)
    fetch('/api/exam', { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        if (data.length > 0) setExercises(data)
        else setExercises([])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  function handleComplete(
    results: { correct: boolean; slug: string; exerciseId: string }[],
    timeSeconds: number,
    timePerQuestion: number[],
  ) {
    const correctAnswers = results.filter(r => r.correct).length
    const coursesSampled = [...new Set(results.map(r => r.slug))]

    fetch('/api/exam', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: new Date().toISOString().split('T')[0],
        score: correctAnswers / results.length,
        totalQuestions: results.length,
        correctAnswers,
        timeSeconds,
        timePerQuestion,
        coursesSampled,
      }),
    })
  }

  if (exercises !== null && exercises.length > 0) {
    return (
      <ContentShell>
        <div className="rounded-lg border border-foreground/10 p-6">
          <MixedQuiz
            exercises={exercises}
            mode="exam"
            onComplete={handleComplete}
            onCancel={() => setExercises(null)}
          />
        </div>
      </ContentShell>
    )
  }

  return (
    <ContentShell>
      <h1 className="text-3xl font-bold mb-2">Examen blanc</h1>
      <p className="text-secondary mb-8">
        20 questions tirées de tous tes cours complétés. Pas de feedback pendant l&apos;examen,
        chronomètre actif. Résultats à la fin.
      </p>

      {exercises !== null && exercises.length === 0 && (
        <div className="rounded-lg border border-foreground/10 p-8 text-center mb-6">
          <p className="text-secondary">
            Aucun cours complété. Termine des cours pour débloquer l&apos;examen.
          </p>
        </div>
      )}

      <div className="rounded-lg border border-foreground/10 p-6 mb-6">
        <h3 className="font-semibold mb-3">Conditions</h3>
        <ul className="text-sm text-secondary space-y-1">
          <li>20 questions de toutes les matières</li>
          <li>Pas de feedback entre les questions</li>
          <li>Chronomètre visible</li>
          <li>Résultats détaillés à la fin</li>
        </ul>
      </div>

      <button
        onClick={start}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 transition-colors cursor-pointer disabled:opacity-50"
      >
        <ClipboardList size={18} />
        {loading ? 'Préparation...' : 'Commencer l\'examen'}
      </button>
    </ContentShell>
  )
}
