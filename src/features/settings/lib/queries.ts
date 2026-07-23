import { and, asc, eq, ne } from 'drizzle-orm';
import { db } from '@/shared/lib/db';
import { users, projects, projectAccess, type UserStatus } from '../../../../drizzle/schema';

export type UserForApproval = {
  id: string;
  name: string | null;
  email: string;
  status: UserStatus;
};

export async function listUsersForApproval(): Promise<UserForApproval[]> {
  return db
    .select({ id: users.id, name: users.name, email: users.email, status: users.status })
    .from(users)
    .where(ne(users.role, 'owner'))
    .orderBy(asc(users.createdAt));
}

export type ApprovedUserWithAccess = {
  id: string;
  name: string | null;
  email: string;
  projectIds: string[];
};

export async function listApprovedUsersWithAccess(): Promise<ApprovedUserWithAccess[]> {
  const approvedUsers = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(and(eq(users.status, 'approved'), ne(users.role, 'owner')))
    .orderBy(asc(users.createdAt));

  const grants = await db
    .select({ userId: projectAccess.userId, projectId: projectAccess.projectId })
    .from(projectAccess);

  const projectIdsByUser = new Map<string, string[]>();
  for (const grant of grants) {
    const existing = projectIdsByUser.get(grant.userId) ?? [];
    existing.push(grant.projectId);
    projectIdsByUser.set(grant.userId, existing);
  }

  return approvedUsers.map((user) => ({
    ...user,
    projectIds: projectIdsByUser.get(user.id) ?? [],
  }));
}

export type SelectableProject = {
  id: string;
  name: string;
  slug: string;
};

export async function listAllProjects(): Promise<SelectableProject[]> {
  return db
    .select({ id: projects.id, name: projects.name, slug: projects.slug })
    .from(projects)
    .orderBy(asc(projects.order));
}
