import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { auth } from '@/features/auth/lib/auth'
import { db } from '@/shared/lib/db'
import { users } from '../../../../../drizzle/schema'

export async function GET() {
  const session = await auth()

  // Build redirects from API_URL rather than the request's own URL: this route
  // runs behind Traefik/Coolify, and Next.js's Request.url resolves to the
  // container's raw HOSTNAME:PORT here rather than the public host.
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/en/login', process.env.API_URL))
  }

  const [user] = await db
    .select({ locale: users.locale })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  const locale = user?.locale ?? 'en'
  return NextResponse.redirect(new URL(`/${locale}/projects`, process.env.API_URL))
}
