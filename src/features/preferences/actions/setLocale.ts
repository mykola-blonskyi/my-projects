'use server'

import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { auth } from '@/features/auth/lib/auth'
import { db } from '@/shared/lib/db'
import { users } from '../../../../drizzle/schema'
import { locales, type Locale } from '@/shared/lib/i18n/config'

export async function setLocale(locale: string) {
  if (!locales.includes(locale as Locale)) return

  const session = await auth()
  if (session?.user?.id) {
    await db.update(users).set({ locale }).where(eq(users.id, session.user.id))
  }

  redirect(`/${locale}/`)
}
