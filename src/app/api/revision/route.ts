import { NextRequest, NextResponse } from 'next/server'
import { readProgress, updateCourseProgress } from '@/lib/progress'
import { getActiveProfileId } from '@/lib/profile-utils'
import { computeNextRevision, isDueToday } from '@/lib/revision'
import { extractExercises } from '@/lib/exercises'
import { getAllCourses } from '@/lib/courses'

export async function GET() {
  const profileId = await getActiveProfileId()
  if (!profileId) return NextResponse.json([])

  const progress = readProgress(profileId)
  const courses = await getAllCourses()
  const due: Array<{ slug: string; title: string; nextRevision: string; consecutivePasses: number }> = []

  for (const course of courses) {
    const p = progress.courses[course.slug]
    if (!p || (p.status !== 'completed' && p.status !== 'mastered')) continue

    const next = p.nextRevision || computeNextRevision(p)
    if (next && isDueToday(next)) {
      let passes = 0
      for (let i = p.revisions.length - 1; i >= 0; i--) {
        if (p.revisions[i].passed) passes++
        else break
      }
      due.push({ slug: course.slug, title: course.title, nextRevision: next, consecutivePasses: passes })
    }
  }

  due.sort((a, b) => a.nextRevision.localeCompare(b.nextRevision))
  return NextResponse.json(due)
}

export async function POST(request: NextRequest) {
  const { slug } = await request.json()
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

  const exercises = await extractExercises(slug)
  const shuffled = exercises.sort(() => Math.random() - 0.5).slice(0, 5)
  return NextResponse.json(shuffled)
}

export async function PUT(request: NextRequest) {
  const profileId = await getActiveProfileId()
  if (!profileId) return NextResponse.json({ error: 'no profile' }, { status: 400 })

  const { slug, score } = await request.json()
  if (!slug || score === undefined) {
    return NextResponse.json({ error: 'slug and score required' }, { status: 400 })
  }

  const passed = score >= 0.8
  const date = new Date().toISOString().split('T')[0]

  const updated = updateCourseProgress(profileId, slug, {
    revisions: [{ date, score, passed }],
    status: passed ? 'mastered' : 'completed',
  })

  const next = computeNextRevision(updated)
  if (next) {
    updateCourseProgress(profileId, slug, { nextRevision: next })
  }

  return NextResponse.json({ passed, score, nextRevision: next })
}
