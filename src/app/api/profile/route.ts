import { NextRequest, NextResponse } from 'next/server'
import { readProgress, writeProgress, readProfilesIndex, createProfile, deleteProfile } from '@/lib/progress'
import { getActiveProfileId } from '@/lib/profile-utils'
import type { UserProfile } from '@/types/course'

export async function GET() {
  const profileId = await getActiveProfileId()
  if (!profileId) return NextResponse.json(null)

  const data = readProgress(profileId)
  return NextResponse.json(data.profile || null)
}

export async function PUT(request: NextRequest) {
  const profileId = await getActiveProfileId()
  if (!profileId) return NextResponse.json({ error: 'no profile' }, { status: 400 })

  const profile: UserProfile = await request.json()
  const data = readProgress(profileId)
  data.profile = profile
  writeProgress(profileId, data)
  return NextResponse.json(profile)
}
