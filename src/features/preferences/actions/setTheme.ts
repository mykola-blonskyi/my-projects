'use server';

import { eq } from 'drizzle-orm';
import { auth } from '@/features/auth/lib/auth';
import { db } from '@/shared/lib/db';
import { users, userThemeEnum, type UserTheme } from '../../../../drizzle/schema';

export async function setTheme(theme: UserTheme) {
  if (!userThemeEnum.enumValues.includes(theme)) return;

  const session = await auth();
  if (!session?.user?.id) return;

  await db.update(users).set({ theme }).where(eq(users.id, session.user.id));
}
