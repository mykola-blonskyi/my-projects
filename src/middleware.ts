import { auth } from '@/features/auth/lib/auth'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/shared/lib/i18n/routing'
import { NextResponse } from 'next/server'

const intlMiddleware = createIntlMiddleware(routing)

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Pass through Next.js internals and API auth routes
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/_vercel') ||
    /\.[^/]+$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  // Check if request is for the login page (any locale prefix)
  const isLoginPage = /^\/[a-z]{2}\/login(\/)?$/.test(pathname) || pathname === '/login'

  // Run intl middleware for all non-internal routes
  const intlResponse = intlMiddleware(req)

  // If not authenticated and not on the login page, redirect to login
  if (!req.auth && !isLoginPage) {
    const locale = req.cookies.get('NEXT_LOCALE')?.value || routing.defaultLocale
    return NextResponse.redirect(new URL(`/${locale}/login`, req.url))
  }

  return intlResponse
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
