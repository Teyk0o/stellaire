import { NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  const profileId = request.cookies.get('stellaire-profile')?.value
  const pathname = request.nextUrl.pathname

  if (pathname === '/profils' || pathname.startsWith('/api/profiles')) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/_next') || pathname.startsWith('/icon') || pathname.startsWith('/web-app') ||
      pathname === '/manifest.json' || pathname === '/sw.js' || pathname === '/apple-icon.png' || pathname === '/favicon.ico') {
    return NextResponse.next()
  }

  if (!profileId) {
    return NextResponse.redirect(new URL('/profils', request.url))
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const verifyRes = await fetch(new URL('/api/profiles', `http://localhost:${process.env.PORT || 3000}`))
  const profiles = await verifyRes.json()
  if (!Array.isArray(profiles) || !profiles.some((p: { id: string }) => p.id === profileId)) {
    const response = NextResponse.redirect(new URL('/profils', request.url))
    response.cookies.delete('stellaire-profile')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
