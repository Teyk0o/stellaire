'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle, ArrowRight, Home } from 'lucide-react'
import { useExerciseProgress } from './ProgressContext'
import type { CourseMeta } from '@/types/course'

interface CourseCompletionProps {
  slug: string
  nextCourse?: CourseMeta | null
}

export function CourseCompletion({ slug, nextCourse }: CourseCompletionProps) {
  const ctx = useExerciseProgress()
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    if (!ctx) return
    const status = ctx.progress.status
    setCompleted(status === 'completed' || status === 'mastered')
  }, [ctx])

  if (!completed) return null

  return (
    <div className="mt-12 mb-8 rounded-lg border-2 border-success/30 bg-success/5 p-6 text-center animate-fade-in-up">
      <CheckCircle size={32} className="mx-auto mb-3 text-success" />
      <h3 className="text-lg font-semibold mb-1">Cours terminé</h3>
      <p className="text-sm text-secondary mb-5">
        Tous les exercices sont complétés. La révision sera programmée automatiquement.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {nextCourse && (
          <Link
            href={`/cours/${nextCourse.slug}`}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            Cours suivant : {nextCourse.title} <ArrowRight size={16} />
          </Link>
        )}
        <Link
          href="/"
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-foreground/10 text-sm font-medium hover:bg-foreground/3 transition-colors"
        >
          <Home size={16} /> Accueil
        </Link>
      </div>
    </div>
  )
}
