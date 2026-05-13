import { NextRequest, NextResponse } from 'next/server'
import { readProgress, addExamResult } from '@/lib/progress'
import { getActiveProfileId } from '@/lib/profile-utils'
import { getAllCourses } from '@/lib/courses'
import { extractExercises } from '@/lib/exercises'
import type { ExamResult } from '@/types/course'

export async function POST() {
  const profileId = await getActiveProfileId()
  if (!profileId) return NextResponse.json([])

  const progress = readProgress(profileId)
  const courses = await getAllCourses()

  const eligibleSlugs = courses
    .filter(c => {
      const status = progress.courses[c.slug]?.status
      return status === 'completed' || status === 'mastered'
    })
    .map(c => c.slug)

  if (eligibleSlugs.length === 0) return NextResponse.json([])

  const allExercises = (await Promise.all(
    eligibleSlugs.map(slug => extractExercises(slug))
  )).flat()

  const shuffled = allExercises.sort(() => Math.random() - 0.5).slice(0, 20)
  return NextResponse.json(shuffled)
}

export async function PUT(request: NextRequest) {
  const profileId = await getActiveProfileId()
  if (!profileId) return NextResponse.json({ error: 'no profile' }, { status: 400 })

  const exam: ExamResult = await request.json()
  addExamResult(profileId, exam)
  return NextResponse.json({ ok: true })
}
