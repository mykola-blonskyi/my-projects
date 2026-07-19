import { getToken } from 'next-auth/jwt'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/shared/lib/i18n/routing'
import { NextResponse, type NextRequest } from 'next/server'

const intlMiddleware = createIntlMiddleware(routing)

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

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
  const intlResponse = intlMiddleware(request)

  // Read the session directly from the JWT cookie instead of going through
  // Auth.js's auth() wrapper: that wrapper rewrites request.url to AUTH_URL's
  // origin for every request (needed for the OAuth token exchange, see
  // ADR-010/ADR-011), which poisons next-intl's own rewrite and causes it to
  // self-fetch through Cloudflare. getToken() only reads cookies/headers, so
  // it never touches request.url.
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    cookieName: 'authjs.session-token',
    secureCookie: process.env.NODE_ENV === 'production',
  })

  // If not authenticated and not on the login page, redirect to login
  if (!token && !isLoginPage) {
    const locale = request.cookies.get('NEXT_LOCALE')?.value || routing.defaultLocale
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
  }

  return intlResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
