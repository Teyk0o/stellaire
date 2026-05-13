'use client'

import { useState, useEffect } from 'react'
import { ContentShell } from '@/components/layout/ContentShell'
import { RevisionQuiz } from '@/components/revision/RevisionQuiz'
import { Calendar, CheckCircle, Clock } from 'lucide-react'
import type { Exercise } from '@/lib/exercises'

interface DueCourse {
  slug: string
  title: string
  nextRevision: string
  consecutivePasses: number
}

export default function RevisionPage() {
  const [due, setDue] = useState<DueCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [activeQuiz, setActiveQuiz] = useState<{ slug: string; title: string; exercises: Exercise[] } | null>(null)

  function loadDue() {
    setLoading(true)
    fetch('/api/revision')
      .then(r => r.json())
      .then(setDue)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(loadDue, [])

  function startQuiz(slug: string, title: string) {
    fetch('/api/revision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    })
      .then(r => r.json())
      .then(exercises => {
        if (exercises.length > 0) {
          setActiveQuiz({ slug, title, exercises })
        }
      })
  }

  function handleQuizComplete() {
    setActiveQuiz(null)
    loadDue()
  }

  if (activeQuiz) {
    return (
      <ContentShell>
        <div className="rounded-lg border border-foreground/10 p-6">
          <RevisionQuiz
            slug={activeQuiz.slug}
            title={activeQuiz.title}
            exercises={activeQuiz.exercises}
            onComplete={handleQuizComplete}
            onCancel={() => setActiveQuiz(null)}
          />
        </div>
      </ContentShell>
    )
  }

  return (
    <ContentShell>
      <h1 className="text-3xl font-bold mb-2">Révision espacée</h1>
      <p className="text-secondary mb-8">
        Les cours complétés apparaissent ici selon un rythme de révision :
        J+1, J+3, J+7, J+14, J+30.
      </p>

      {loading && (
        <div className="text-secondary text-center py-12">Chargement...</div>
      )}

      {!loading && due.length === 0 && (
        <div className="rounded-lg border border-foreground/10 p-8 text-center">
          <CheckCircle size={32} className="mx-auto mb-3 text-success" />
          <p className="font-medium mb-1">Rien à réviser aujourd&apos;hui</p>
          <p className="text-sm text-secondary">
            Complète des cours pour que les révisions se programment automatiquement.
          </p>
        </div>
      )}

      {!loading && due.length > 0 && (
        <div className="space-y-3">
          {due.map(course => (
            <div
              key={course.slug}
              className="flex items-center justify-between px-5 py-4 rounded-lg border border-foreground/10"
            >
              <div>
                <p className="font-medium">{course.title}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-secondary">
                    <Calendar size={12} />
                    Prévu le {course.nextRevision}
                  </span>
                  {course.consecutivePasses > 0 && (
                    <span className="flex items-center gap-1 text-xs text-secondary">
                      <Clock size={12} />
                      {course.consecutivePasses} révision{course.consecutivePasses > 1 ? 's' : ''} réussie{course.consecutivePasses > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => startQuiz(course.slug, course.title)}
                className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors cursor-pointer shrink-0"
              >
                Réviser
              </button>
            </div>
          ))}
        </div>
      )}
    </ContentShell>
  )
}
