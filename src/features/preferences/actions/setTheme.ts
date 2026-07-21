'use server';

import { eq } from 'drizzle-orm';
import { auth } from '@/features/auth/lib/auth';
import { db } from '@/shared/lib/db';
import { users } from '../../../../drizzle/schema';

const VALID_THEMES = ['light', 'dark', 'theme-rose'] as const;

export async function setTheme(theme: string) {
  if (!VALID_THEMES.includes(theme as (typeof VALID_THEMES)[number])) return;

  const session = await auth();
  if (!session?.user?.id) return;

  await db.update(users).set({ theme }).where(eq(users.id, session.user.id));
}
