import { asc, eq, getTableColumns } from 'drizzle-orm';
import { db } from '@/shared/lib/db';
import { projects, projectAccess, type UserRole } from '../../../../drizzle/schema';

export type Project = typeof projects.$inferSelect;

export async function getProjectsForUser(userId: string, role: UserRole): Promise<Project[]> {
  if (role === 'owner') {
    return db.select().from(projects).orderBy(asc(projects.order));
  }

  return db
    .select(getTableColumns(projects))
    .from(projects)
    .innerJoin(projectAccess, eq(projectAccess.projectId, projects.id))
    .where(eq(projectAccess.userId, userId))
    .orderBy(asc(projects.order));
}
