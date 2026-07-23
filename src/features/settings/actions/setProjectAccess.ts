'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, notInArray } from 'drizzle-orm';
import { auth } from '@/features/auth/lib/auth';
import { db } from '@/shared/lib/db';
import { projectAccess } from '../../../../drizzle/schema';

// Replaces a user's project grants with exactly the given set - the caller
// (ProjectAccessDialog) always submits the full desired list, not a diff.
export async function setProjectAccess(userId: string, projectIds: string[]) {
  const session = await auth();
  if (session?.user?.role !== 'owner') return;

  await db.transaction(async (tx) => {
    await tx
      .delete(projectAccess)
      .where(
        and(
          eq(projectAccess.userId, userId),
          projectIds.length > 0 ? notInArray(projectAccess.projectId, projectIds) : undefined,
        ),
      );

    if (projectIds.length > 0) {
      await tx
        .insert(projectAccess)
        .values(projectIds.map((projectId) => ({ userId, projectId })))
        .onConflictDoNothing();
    }
  });

  revalidatePath('/[locale]/settings/access', 'page');
}
