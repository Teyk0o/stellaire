import { NextResponse } from 'next/server'
import { readProgress } from '@/lib/progress'
import { getActiveProfileId } from '@/lib/profile-utils'
import { getAllCourses } from '@/lib/courses'
import { extractExercises } from '@/lib/exercises'
import { selectRevisionExercises } from '@/lib/revision'
import type { ExerciseResult } from '@/types/course'

export async function POST() {
  const profileId = await getActiveProfileId()
  if (!profileId) return NextResponse.json([])

  const progress = readProgress(profileId)
  const courses = await getAllCourses()

  const eligibleSlugs = courses
    .filter(c => {
      const status = progress.courses[c.slug]?.status
      return status === 'in-progress' || status === 'completed' || status === 'mastered'
    })
    .map(c => c.slug)

  if (eligibleSlugs.length === 0) return NextResponse.json([])

  const allExercises = (await Promise.all(
    eligibleSlugs.map(slug => extractExercises(slug))
  )).flat()

  const allResults: Record<string, ExerciseResult> = {}
  for (const slug of eligibleSlugs) {
    Object.assign(allResults, progress.courses[slug]?.exerciseResults || {})
  }

  const selected = selectRevisionExercises(allExercises, allResults, 10)
  return NextResponse.json(selected)
}
