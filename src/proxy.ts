import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const profileId = request.cookies.get('stellaire-profile')?.value
  const pathname = request.nextUrl.pathname

  const publicPaths = ['/profils', '/api/profiles', '/_next', '/icon', '/web-app', '/manifest.json', '/sw.js', '/apple-icon.png', '/favicon.ico']
  if (publicPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  if (!profileId) {
    return NextResponse.redirect(new URL('/profils', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
