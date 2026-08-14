import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = {
  '/owner-dashboard': 'owner',
  '/advertiser-dashboard': 'advertiser',
  '/admin': 'admin',
} as const

const publicRoutes = ['/', '/browse', '/login', '/signup', '/forgot-password', '/reset-password', '/terms', '/privacy', '/contact', '/pricing']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const protectedRoute = Object.keys(protectedRoutes).find(route => pathname.startsWith(route))
  
  if (protectedRoute) {
    // Get auth tokens from localStorage (will be handled client-side in AuthGuard)
    // Middleware cannot access localStorage, so we rely on client-side AuthGuard
    // This middleware mainly handles route matching
    return NextResponse.next()
  }

  // Allow all other routes
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
