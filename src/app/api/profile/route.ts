import { NextRequest, NextResponse } from 'next/server'
import { loadUserProfile, saveUserProfile } from '@/lib/progress'
import { getActiveProfileId } from '@/lib/profile-utils'
import type { UserProfile } from '@/types/course'

export async function GET() {
  const profileId = await getActiveProfileId()
  if (!profileId) return NextResponse.json(null)

  return NextResponse.json(loadUserProfile(profileId))
}

export async function PUT(request: NextRequest) {
  const profileId = await getActiveProfileId()
  if (!profileId) return NextResponse.json({ error: 'no profile' }, { status: 400 })

  const profile: UserProfile = await request.json()
  saveUserProfile(profileId, profile)
  return NextResponse.json(profile)
}
