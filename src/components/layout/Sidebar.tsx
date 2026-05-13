'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Circle, Star, CheckCircle, CircleDot } from 'lucide-react'
import type { CourseMeta, CourseStatus, CourseProgress, Subject, ProfileEntry } from '@/types/course'

interface SidebarProps {
  courses: CourseMeta[]
}

const subjectLabels: Record<Subject, string> = {
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

export function Sidebar({ courses }: SidebarProps) {
  const [open, setOpen] = useState(false)
  const [progress, setProgress] = useState<Record<string, CourseProgress>>({})
  const [activeProfile, setActiveProfile] = useState<ProfileEntry | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
    fetch('/api/progress').then(r => r.json()).then(setProgress).catch(() => {})
    fetch('/api/profiles').then(r => r.json()).then((profiles: ProfileEntry[]) => {
      const cookieId = document.cookie.split('; ').find(c => c.startsWith('stellaire-profile='))?.split('=')[1]
      const active = profiles.find(p => p.id === cookieId)
      if (active) setActiveProfile(active)
    }).catch(() => {})
  }, [pathname])

  const grouped = new Map<number, Map<Subject, CourseMeta[]>>()
  for (const course of courses.filter(c => !c.tags.includes('demo'))) {
    if (!grouped.has(course.phase)) grouped.set(course.phase, new Map())
    const phaseMap = grouped.get(course.phase)!
    if (!phaseMap.has(course.subject)) phaseMap.set(course.subject, [])
    phaseMap.get(course.subject)!.push(course)
  }

  const nav = (
    <nav className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-foreground/5">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-foreground tracking-tight">
          <Image src="/icon.png" alt="" width={28} height={28} className="shrink-0" unoptimized />
          Stellaire
        </Link>
        <button
          onClick={() => setOpen(false)}
          className="lg:hidden text-secondary hover:text-foreground cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {Array.from(grouped.entries())
          .sort(([a], [b]) => a - b)
          .map(([phase, subjects]) => (
            <div key={phase}>
              <h3 className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-secondary">
                Phase {phase}
              </h3>
              {Array.from(subjects.entries()).map(([subject, subjectCourses]) => (
                <div key={subject} className="mb-3">
                  <p className="px-2 mb-1 text-xs text-secondary/60">{subjectLabels[subject]}</p>
                  {subjectCourses.map(course => {
                    const status = progress[course.slug]?.status || 'not-started'
                    const StatusIcon = statusIcons[status]
                    const isActive = pathname === `/cours/${course.slug}`

                    return (
                      <Link
                        key={course.slug}
                        href={`/cours/${course.slug}`}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                          isActive
                            ? 'bg-accent/10 text-accent font-medium'
                            : 'text-foreground/70 hover:text-foreground hover:bg-foreground/3'
                        }`}
                      >
                        <StatusIcon size={14} className={statusColors[status]} />
                        <span className="truncate">{course.title}</span>
                      </Link>
                    )
                  })}
                </div>
              ))}
            </div>
          ))}
      </div>

      <div className="border-t border-foreground/5 px-3 py-3 space-y-1">
        <Link href="/micro" className="block px-2 py-1.5 rounded-md text-sm text-secondary hover:text-foreground hover:bg-foreground/3 transition-colors">
          Session rapide
        </Link>
        <Link href="/revision" className="block px-2 py-1.5 rounded-md text-sm text-secondary hover:text-foreground hover:bg-foreground/3 transition-colors">
          Révision espacée
        </Link>
        <Link href="/examen" className="block px-2 py-1.5 rounded-md text-sm text-secondary hover:text-foreground hover:bg-foreground/3 transition-colors">
          Examen blanc
        </Link>
        <Link href="/progression" className="block px-2 py-1.5 rounded-md text-sm text-secondary hover:text-foreground hover:bg-foreground/3 transition-colors">
          Progression
        </Link>
        <Link href="/rapport" className="block px-2 py-1.5 rounded-md text-sm text-secondary hover:text-foreground hover:bg-foreground/3 transition-colors">
          Rapport
        </Link>
        <Link href="/parametres" className="block px-2 py-1.5 rounded-md text-sm text-secondary hover:text-foreground hover:bg-foreground/3 transition-colors">
          Paramètres
        </Link>
        {activeProfile && (
          <Link href="/profils" className="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-foreground/3 transition-colors mt-1">
            <img
              src={`https://api.dicebear.com/9.x/${activeProfile.avatarStyle || 'notionists-neutral'}/svg?seed=${encodeURIComponent(activeProfile.avatarSeed || activeProfile.name)}&backgroundColor=${activeProfile.color.replace('#', '')}&backgroundType=solid&radius=8`}
              alt={activeProfile.name}
              width={28}
              height={28}
              className="rounded-lg shrink-0"
            />
            <span className="text-sm font-medium truncate">{activeProfile.name}</span>
          </Link>
        )}
      </div>
    </nav>
  )

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed z-40 lg:hidden bg-background rounded-lg border border-foreground/10 p-2 shadow-sm cursor-pointer print-hidden"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1rem)', left: 'calc(env(safe-area-inset-left, 0px) + 1rem)' }}
      >
        <Menu size={20} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} className={`
        fixed inset-y-0 left-0 z-50 w-[300px] bg-sidebar border-r border-foreground/5
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 lg:shrink-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {nav}
      </aside>
    </>
  )
}
