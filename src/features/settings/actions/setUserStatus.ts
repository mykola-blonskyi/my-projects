'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { auth } from '@/features/auth/lib/auth';
import { db } from '@/shared/lib/db';
import { users, userStatusEnum, type UserStatus } from '../../../../drizzle/schema';

export async function setUserStatus(userId: string, status: UserStatus) {
  const session = await auth();
  if (session?.user?.role !== 'owner') return;
  if (!userStatusEnum.enumValues.includes(status)) return;

  await db.update(users).set({ status }).where(eq(users.id, userId));

  revalidatePath('/[locale]/settings/users', 'page');
  revalidatePath('/[locale]/settings/access', 'page');
}
