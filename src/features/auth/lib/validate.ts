import { db } from '@/shared/lib/db';
import { projects, projectAccess, type UserRole } from '../../../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function validateProjectAccess(
  userId: string,
  role: UserRole,
  projectSlug: string,
): Promise<{ allowed: boolean }> {
  // Owners have access to all projects
  if (role === 'owner') {
    return { allowed: true };
  }

  // Look up the project by slug
  const project = await db.select().from(projects).where(eq(projects.slug, projectSlug)).limit(1);

  if (!project.length) {
    return { allowed: false };
  }

  // Check whether the user has an explicit access grant
  const access = await db
    .select()
    .from(projectAccess)
    .where(and(eq(projectAccess.userId, userId), eq(projectAccess.projectId, project[0].id)))
    .limit(1);

  return { allowed: access.length > 0 };
}
