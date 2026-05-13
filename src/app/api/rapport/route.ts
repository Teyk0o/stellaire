import { NextResponse } from 'next/server'
import { readProgress, addReportRecord } from '@/lib/progress'
import { getActiveProfileId } from '@/lib/profile-utils'
import { getAllCourses } from '@/lib/courses'
import { generateReportData, computeReportHash } from '@/lib/report'

export async function GET() {
  const profileId = await getActiveProfileId()
  if (!profileId) return NextResponse.json(null)

  const progress = readProgress(profileId)
  const courses = await getAllCourses()
  const data = generateReportData(progress, courses)
  return NextResponse.json(data)
}

export async function POST() {
  const profileId = await getActiveProfileId()
  if (!profileId) return NextResponse.json({ error: 'no profile' }, { status: 400 })

  const progress = readProgress(profileId)
  const courses = await getAllCourses()
  const data = generateReportData(progress, courses)

  const snapshotData = { courses: progress.courses, exams: progress.exams, profile: progress.profile }
  const snapshot = JSON.stringify(snapshotData)
  const now = new Date().toISOString()
  const hash = computeReportHash(snapshot, now)

  addReportRecord(profileId, { date: now, hash, progressSnapshot: snapshot })

  return NextResponse.json({ ...data, hash })
}
