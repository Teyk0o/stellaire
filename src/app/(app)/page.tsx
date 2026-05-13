export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Zap, Circle, CircleDot, CheckCircle, Star } from 'lucide-react'
import { getCourseGroups } from '@/lib/courses'
import { readProgress } from '@/lib/progress'
import { getActiveProfileId } from '@/lib/profile-utils'
import { ContentShell } from '@/components/layout/ContentShell'
import type { CourseStatus } from '@/types/course'

const subjectLabels: Record<string, string> = {
  math: 'Mathématiques',
  physics: 'Physique',
  chemistry: 'Chimie',
}

const statusIcons: Record<CourseStatus, typeof Circle> = {
  'not-started': Circle,
  'in-progress': CircleDot,
  'completed': CheckCircle,
  'mastered': Star,
}

const statusColors: Record<CourseStatus, string> = {
  'not-started': 'text-foreground/20',
  'in-progress': 'text-amber-500',
  'completed': 'text-success',
  'mastered': 'text-amber-400',
}

export default async function Home() {
  const groups = await getCourseGroups()
  const profileId = await getActiveProfileId()
  const progress = profileId ? readProgress(profileId) : null
  let cardIndex = 0

  return (
    <ContentShell>
      <h1 className="text-3xl font-bold mb-2 animate-fade-in-up">Stellaire</h1>
      <p className="text-secondary mb-8 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
        Cours interactifs de maths et physique-chimie.
      </p>

      <Link
        href="/micro"
        className="flex items-center gap-3 px-5 py-4 mb-10 rounded-lg border border-accent/20 bg-accent/5 hover:bg-accent/10 transition-colors animate-fade-in-up"
        style={{ animationDelay: '100ms' }}
      >
        <Zap size={20} className="text-accent shrink-0" />
        <div>
          <span className="font-medium text-accent">Session rapide (5 min)</span>
          <p className="text-xs text-secondary mt-0.5">10 questions mixtes de tes cours en cours</p>
        </div>
      </Link>

      {groups.map(group => {
        const allPhaseCourses = (Object.values(group.subjects) as typeof group.subjects.math[])
          .flat()
          .filter(c => !c.tags.includes('demo'))
        const phaseCompleted = allPhaseCourses.filter(c => {
          const s = progress?.courses[c.slug]?.status
          return s === 'completed' || s === 'mastered'
        }).length
        const phaseTotal = allPhaseCourses.length

        return (
          <section key={group.phase} className="mb-10">
            <div className="flex items-center justify-between mb-4 animate-fade-in-up" style={{ animationDelay: `${150 + (cardIndex++) * 40}ms` }}>
              <h2 className="text-xl font-semibold">Phase {group.phase}</h2>
              {phaseTotal > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-foreground/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${Math.round((phaseCompleted / phaseTotal) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-secondary">{phaseCompleted}/{phaseTotal}</span>
                </div>
              )}
            </div>
            {(Object.entries(group.subjects) as [string, typeof group.subjects.math][]).map(([subject, allCourses]) => {
              const courses = allCourses.filter(c => !c.tags.includes('demo'))
              if (courses.length === 0) return null
              return (
                <div key={subject} className="mb-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-secondary mb-3">
                    {subjectLabels[subject] || subject}
                  </h3>
                  <div className="space-y-2">
                    {courses.map(course => {
                      const status: CourseStatus = progress?.courses[course.slug]?.status || 'not-started'
                      const StatusIcon = statusIcons[status]

                      return (
                        <Link
                          key={course.slug}
                          href={`/cours/${course.slug}`}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg border border-foreground/8 hover:border-accent/30 transition-colors animate-fade-in-up"
                          style={{ animationDelay: `${150 + (cardIndex++) * 40}ms` }}
                        >
                          <StatusIcon size={16} className={`shrink-0 ${statusColors[status]}`} />
                          <span className="text-foreground font-medium flex-1">{course.title}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </section>
        )
      })}

      {groups.length === 0 && (
        <p className="text-secondary animate-fade-in-up">
          Aucun cours trouvé. Ajoute des fichiers .md dans le dossier <code>content/</code>.
        </p>
      )}
    </ContentShell>
  )
}
