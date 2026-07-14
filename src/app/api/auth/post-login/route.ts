import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { auth } from '@/features/auth/lib/auth'
import { db } from '@/shared/lib/db'
import { users } from '../../../../../drizzle/schema'

export async function GET(req: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/en/login', req.url))
  }

  const [user] = await db
    .select({ locale: users.locale })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  const locale = user?.locale ?? 'en'
  return NextResponse.redirect(new URL(`/${locale}/`, req.url))
}
