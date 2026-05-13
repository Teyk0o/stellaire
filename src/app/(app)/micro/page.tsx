'use client'

import { useState } from 'react'
import { ContentShell } from '@/components/layout/ContentShell'
import { MixedQuiz } from '@/components/revision/MixedQuiz'
import { Zap } from 'lucide-react'
import type { Exercise } from '@/lib/exercises'

export default function MicroSessionPage() {
  const [exercises, setExercises] = useState<Exercise[] | null>(null)
  const [loading, setLoading] = useState(false)

  function start() {
    setLoading(true)
    fetch('/api/micro-session', { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        if (data.length > 0) setExercises(data)
        else setExercises([])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  function handleComplete(results: { correct: boolean; slug: string; exerciseId: string }[]) {
    const bySlug = new Map<string, { exerciseId: string; correct: boolean }[]>()
    for (const r of results) {
      if (!bySlug.has(r.slug)) bySlug.set(r.slug, [])
      bySlug.get(r.slug)!.push(r)
    }

    for (const [slug, exResults] of bySlug) {
      const exerciseResults: Record<string, { correct: boolean; attempts: number }> = {}
      const completedExercises: string[] = []
      for (const r of exResults) {
        exerciseResults[r.exerciseId] = { correct: r.correct, attempts: 1 }
        if (r.correct) completedExercises.push(r.exerciseId)
      }
      fetch('/api/progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, exerciseResults, completedExercises }),
      })
    }
  }

  if (exercises !== null && exercises.length > 0) {
    return (
      <ContentShell>
        <div className="rounded-lg border border-foreground/10 p-6">
          <MixedQuiz
            exercises={exercises}
            mode="micro"
            onComplete={handleComplete}
            onCancel={() => setExercises(null)}
          />
        </div>
      </ContentShell>
    )
  }

  return (
    <ContentShell>
      <h1 className="text-3xl font-bold mb-2">Session rapide</h1>
      <p className="text-secondary mb-8">
        10 questions mixtes tirées de tes cours en cours et complétés.
        Les exercices les plus urgents à réviser sont prioritaires.
      </p>

      {exercises !== null && exercises.length === 0 && (
        <div className="rounded-lg border border-foreground/10 p-8 text-center mb-6">
          <p className="text-secondary">
            Aucun exercice disponible. Commence ou complète des cours d&apos;abord.
          </p>
        </div>
      )}

      <button
        onClick={start}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 transition-colors cursor-pointer disabled:opacity-50"
      >
        <Zap size={18} />
        {loading ? 'Chargement...' : 'Commencer la session'}
      </button>
    </ContentShell>
  )
}
