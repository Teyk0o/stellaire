import { cookies } from 'next/headers'

const COOKIE_NAME = 'stellaire-profile'

export async function getActiveProfileId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value || null
}

export function requireProfileId(profileId: string | null): string {
  if (!profileId) throw new Error('No active profile')
  return profileId
}
