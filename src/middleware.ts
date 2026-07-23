import { getToken } from 'next-auth/jwt';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from '@/shared/lib/i18n/routing';
import { NextResponse, type NextRequest } from 'next/server';

const intlMiddleware = createIntlMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pass through Next.js internals and API auth routes
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/_vercel') ||
    /\.[^/]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Check if request is for the login page (any locale prefix)
  const isLoginPage = /^\/[a-z]{2}\/login(\/)?$/.test(pathname) || pathname === '/login';
  const isAwaitingApprovalPage =
    /^\/[a-z]{2}\/awaiting-approval(\/)?$/.test(pathname) || pathname === '/awaiting-approval';

  // Run intl middleware for all non-internal routes
  const intlResponse = intlMiddleware(request);

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
  });

  // If not authenticated and not on the login page, redirect to login
  if (!token && !isLoginPage) {
    const locale = request.cookies.get('NEXT_LOCALE')?.value || routing.defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  // Site-wide approval gate (Business Rule 7 / ADR-018): checked against the
  // database on every request, not cached in the JWT, so a block takes effect
  // on the user's very next request rather than their next login. The owner
  // is never subject to this - role still comes from the JWT, only status
  // needs a fresh read.
  //
  // The check itself lives in /api/auth/status, not here: middleware runs in
  // the Edge runtime, which can't load drizzle-orm/postgres (raw Node "net"
  // sockets - confirmed at runtime: "The edge runtime does not support
  // Node.js 'net' module"). Node.js middleware support needs Next.js 15.5+
  // stable (we're on 15.3.4), so instead of upgrading Next.js for this,
  // middleware calls that Route Handler (normal Node.js runtime) over an
  // internal loopback fetch. That fetch targets 127.0.0.1:PORT directly, not
  // request.url's public hostname - the origin fetching its own public,
  // Cloudflare-proxied hostname is exactly the self-referential loop ADR-011
  // already fixed once for a different code path; a loopback fetch has no
  // Cloudflare hop to loop through at all. See ADR-019.
  if (token && token.role !== 'owner') {
    const locale = request.cookies.get('NEXT_LOCALE')?.value || routing.defaultLocale;
    const statusResponse = await fetch(
      `http://127.0.0.1:${process.env.PORT ?? 3000}/api/auth/status`,
      {
        headers: { cookie: request.headers.get('cookie') ?? '' },
      },
    );
    const { status } = (await statusResponse.json()) as { status: string | null };
    const isApproved = status === 'approved';

    if (!isApproved && !isAwaitingApprovalPage) {
      return NextResponse.redirect(new URL(`/${locale}/awaiting-approval`, request.url));
    }
    if (isApproved && isAwaitingApprovalPage) {
      return NextResponse.redirect(new URL(`/${locale}/projects`, request.url));
    }
  }

  return intlResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
