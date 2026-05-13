import { NextRequest, NextResponse } from 'next/server'
import { readProgress } from '@/lib/progress'
import { getActiveProfileId } from '@/lib/profile-utils'
import { verifyReport } from '@/lib/report'

export async function GET(request: NextRequest) {
  const hash = request.nextUrl.searchParams.get('hash')
  if (!hash) return NextResponse.json({ error: 'hash required' }, { status: 400 })

  const profileId = await getActiveProfileId()
  if (!profileId) return NextResponse.json({ authentic: false, snapshotMatch: false, details: 'Aucun profil actif.' })

  const progress = readProgress(profileId)
  const result = verifyReport(hash, progress.reports, progress)
  return NextResponse.json(result)
}
