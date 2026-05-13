export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Zap } from 'lucide-react'
import { getCourseGroups } from '@/lib/courses'
import { ContentShell } from '@/components/layout/ContentShell'

const subjectLabels: Record<string, string> = {
  math: 'Mathématiques',
  physics: 'Physique',
  chemistry: 'Chimie',
}

export default async function Home() {
  const groups = await getCourseGroups()
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

      {groups.map(group => (
        <section key={group.phase} className="mb-10">
          <h2 className="text-xl font-semibold mb-4 animate-fade-in-up" style={{ animationDelay: `${150 + (cardIndex++) * 40}ms` }}>
            Phase {group.phase}
          </h2>
          {(Object.entries(group.subjects) as [string, typeof group.subjects.math][]).map(([subject, allCourses]) => {
            const courses = allCourses.filter(c => !c.tags.includes('demo'))
            if (courses.length === 0) return null
            return (
              <div key={subject} className="mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-secondary mb-3">
                  {subjectLabels[subject] || subject}
                </h3>
                <div className="space-y-2">
                  {courses.map(course => (
                    <Link
                      key={course.slug}
                      href={`/cours/${course.slug}`}
                      className="block px-4 py-3 rounded-lg border border-foreground/8 hover:border-accent/30 transition-colors animate-fade-in-up"
                      style={{ animationDelay: `${150 + (cardIndex++) * 40}ms` }}
                    >
                      <span className="text-foreground font-medium">{course.title}</span>
                      {course.tags.length > 0 && (
                        <span className="ml-3 text-xs text-secondary">
                          {course.tags.join(' · ')}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </section>
      ))}

      {groups.length === 0 && (
        <p className="text-secondary animate-fade-in-up">
          Aucun cours trouvé. Ajoute des fichiers .md dans le dossier <code>content/</code>.
        </p>
      )}
    </ContentShell>
  )
}
