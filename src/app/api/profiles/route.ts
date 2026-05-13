import { NextRequest, NextResponse } from 'next/server'
import { readProfilesIndex, createProfile, deleteProfile, updateProfileEntry } from '@/lib/progress'
import { cookies } from 'next/headers'

export async function GET() {
  const index = readProfilesIndex()
  return NextResponse.json(index.profiles)
}

export async function POST(request: NextRequest) {
  const { name, color, avatarStyle, avatarSeed } = await request.json()
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const profile = createProfile(name, color || '#C85A2A', avatarStyle || 'notionists-neutral', avatarSeed)

  const cookieStore = await cookies()
  cookieStore.set('stellaire-profile', profile.id, { path: '/', maxAge: 365 * 24 * 60 * 60 })

  return NextResponse.json(profile)
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  deleteProfile(id)
  return NextResponse.json({ ok: true })
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const cookieStore = await cookies()

  if (body.action === 'select') {
    cookieStore.set('stellaire-profile', body.id, { path: '/', maxAge: 365 * 24 * 60 * 60 })
    return NextResponse.json({ ok: true })
  }

  const { id, name, color, avatarStyle, avatarSeed } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const updated = updateProfileEntry(id, {
    ...(name && { name }),
    ...(color && { color }),
    ...(avatarStyle && { avatarStyle }),
    ...(avatarSeed && { avatarSeed }),
  })

  if (!updated) return NextResponse.json({ error: 'profile not found' }, { status: 404 })
  return NextResponse.json(updated)
}
