import { NextRequest, NextResponse } from 'next/server'
import { readProgress, readCourseProgress, updateCourseProgress } from '@/lib/progress'
import { getActiveProfileId } from '@/lib/profile-utils'

export async function GET(request: NextRequest) {
  const profileId = await getActiveProfileId()
  if (!profileId) return NextResponse.json({})

  const slug = request.nextUrl.searchParams.get('slug')
  if (slug) {
    return NextResponse.json(readCourseProgress(profileId, slug))
  }

  const progress = readProgress(profileId)
  return NextResponse.json(progress.courses)
}

export async function PUT(request: NextRequest) {
  const profileId = await getActiveProfileId()
  if (!profileId) return NextResponse.json({ error: 'no profile' }, { status: 400 })

  const body = await request.json()
  const { slug, ...update } = body

  if (!slug || typeof slug !== 'string') {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  }

  const result = updateCourseProgress(profileId, slug, update)
  return NextResponse.json(result)
}
