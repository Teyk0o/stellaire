'use client'

import { useState, useEffect, useMemo } from 'react'
import { ContentShell } from '@/components/layout/ContentShell'
import { Circle, CircleDot, CheckCircle, Star, TrendingUp } from 'lucide-react'
import type { CourseMeta, CourseProgress, CourseStatus } from '@/types/course'

const statusConfig: Record<CourseStatus, { label: string; icon: typeof Circle; color: string; bg: string }> = {
  'not-started': { label: 'Non commencé', icon: Circle, color: 'text-foreground/20', bg: 'bg-foreground/5' },
  'in-progress': { label: 'En cours', icon: CircleDot, color: 'text-amber-500', bg: 'bg-amber-50' },
  'completed': { label: 'Complété', icon: CheckCircle, color: 'text-success', bg: 'bg-success/5' },
  'mastered': { label: 'Maîtrisé', icon: Star, color: 'text-amber-400', bg: 'bg-amber-50' },
}

const subjectLabels: Record<string, string> = {
  math: 'Mathématiques',
  physics: 'Physique',
  chemistry: 'Chimie',
}

export default function ProgressionPage() {
  const [courses, setCourses] = useState<CourseMeta[]>([])
  const [progress, setProgress] = useState<Record<string, CourseProgress>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/courses').then(r => r.json()),
      fetch('/api/progress').then(r => r.json()),
    ])
      .then(([c, p]) => { setCourses(c.filter((course: CourseMeta) => !course.tags.includes('demo'))); setProgress(p) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const stats = useMemo(() => {
    const counts: Record<CourseStatus, number> = {
      'not-started': 0, 'in-progress': 0, 'completed': 0, 'mastered': 0,
    }
    for (const course of courses) {
      const status = progress[course.slug]?.status || 'not-started'
      counts[status]++
    }

    const total = courses.length
    const done = counts.completed + counts.mastered
    const percentage = total > 0 ? Math.round((done / total) * 100) : 0

    let totalExercises = 0
    let correctExercises = 0
    let totalRevisions = 0
    let passedRevisions = 0
    for (const p of Object.values(progress)) {
      const results = Object.values(p.exerciseResults || {})
      totalExercises += results.length
      correctExercises += results.filter(r => r.correct).length
      totalRevisions += (p.revisions || []).length
      passedRevisions += (p.revisions || []).filter(r => r.passed).length
    }

    return { counts, total, done, percentage, totalExercises, correctExercises, totalRevisions, passedRevisions }
  }, [courses, progress])

  const bySubject = useMemo(() => {
    const map = new Map<string, { total: number; done: number }>()
    for (const course of courses) {
      if (!map.has(course.subject)) map.set(course.subject, { total: 0, done: 0 })
      const entry = map.get(course.subject)!
      entry.total++
      const status = progress[course.slug]?.status
      if (status === 'completed' || status === 'mastered') entry.done++
    }
    return map
  }, [courses, progress])

  if (loading) {
    return (
      <ContentShell>
        <div className="text-secondary text-center py-12">Chargement...</div>
      </ContentShell>
    )
  }

  return (
    <ContentShell>
      <h1 className="text-3xl font-bold mb-2">Progression</h1>
      <p className="text-secondary mb-8">Vue d&apos;ensemble de ta progression.</p>

      {/* Barre de progression globale */}
      <div className="rounded-lg border border-foreground/10 p-6 mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold">Progression globale</span>
          <span className="text-2xl font-bold text-accent">{stats.percentage}%</span>
        </div>
        <div className="h-3 bg-foreground/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${stats.percentage}%` }}
          />
        </div>
        <p className="text-sm text-secondary mt-2">
          {stats.done}/{stats.total} cours complétés
        </p>
      </div>

      {/* Compteurs par statut */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {(Object.entries(statusConfig) as [CourseStatus, typeof statusConfig[CourseStatus]][]).map(([status, config]) => {
          const Icon = config.icon
          return (
            <div key={status} className={`rounded-lg ${config.bg} px-4 py-3`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={16} className={config.color} />
                <span className="text-xs text-secondary">{config.label}</span>
              </div>
              <span className="text-xl font-bold">{stats.counts[status]}</span>
            </div>
          )
        })}
      </div>

      {/* Stats exercices et revisions */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="rounded-lg border border-foreground/10 px-4 py-3">
          <p className="text-xs text-secondary mb-1">Exercices réussis</p>
          <p className="text-xl font-bold">
            {stats.correctExercises}
            <span className="text-sm font-normal text-secondary">/{stats.totalExercises}</span>
          </p>
          {stats.totalExercises > 0 && (
            <p className="text-xs text-secondary mt-1">
              {Math.round((stats.correctExercises / stats.totalExercises) * 100)}% de réussite
            </p>
          )}
        </div>
        <div className="rounded-lg border border-foreground/10 px-4 py-3">
          <p className="text-xs text-secondary mb-1">Révisions réussies</p>
          <p className="text-xl font-bold">
            {stats.passedRevisions}
            <span className="text-sm font-normal text-secondary">/{stats.totalRevisions}</span>
          </p>
          {stats.totalRevisions > 0 && (
            <p className="text-xs text-secondary mt-1">
              {Math.round((stats.passedRevisions / stats.totalRevisions) * 100)}% de réussite
            </p>
          )}
        </div>
      </div>

      {/* Progression par matière */}
      <h2 className="text-xl font-semibold mb-4">Par matière</h2>
      <div className="space-y-4 mb-8">
        {Array.from(bySubject.entries()).map(([subject, data]) => {
          const pct = data.total > 0 ? Math.round((data.done / data.total) * 100) : 0
          return (
            <div key={subject}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{subjectLabels[subject] || subject}</span>
                <span className="text-sm text-secondary">{data.done}/{data.total}</span>
              </div>
              <div className="h-2 bg-foreground/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent/70 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Liste détaillée */}
      <h2 className="text-xl font-semibold mb-4">Détail par cours</h2>
      <div className="space-y-2">
        {courses.map(course => {
          const p = progress[course.slug]
          const status = p?.status || 'not-started'
          const config = statusConfig[status]
          const Icon = config.icon
          const exerciseCount = Object.keys(p?.exerciseResults || {}).length
          const revisionCount = (p?.revisions || []).length

          return (
            <div
              key={course.slug}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-foreground/8"
            >
              <Icon size={16} className={config.color} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{course.title}</p>
                <p className="text-xs text-secondary">
                  Phase {course.phase} · {subjectLabels[course.subject] || course.subject}
                  {exerciseCount > 0 && ` · ${exerciseCount} exercice${exerciseCount > 1 ? 's' : ''}`}
                  {revisionCount > 0 && ` · ${revisionCount} révision${revisionCount > 1 ? 's' : ''}`}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                {config.label}
              </span>
            </div>
          )
        })}
      </div>
    </ContentShell>
  )
}
