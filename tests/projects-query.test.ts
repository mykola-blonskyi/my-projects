import { describe, it, expect } from 'vitest';
import { testDb } from './setup/db';
import { projects, projectAccess, users } from '../drizzle/schema';
import { getProjectsForUser } from '@/features/projects/lib/queries';

async function seedProjects() {
  return testDb
    .insert(projects)
    .values([
      { slug: 'sqlpanel', name: 'SQL Panel', order: 0 },
      { slug: 'todo', name: 'Todo', order: 1 },
    ])
    .returning();
}

describe('getProjectsForUser', () => {
  it('returns all projects for an owner', async () => {
    const [user] = await testDb.insert(users).values({ email: 'owner@example.com', role: 'owner' }).returning();
    const seeded = await seedProjects();

    const result = await getProjectsForUser(user.id, 'owner');

    expect(result.map((p) => p.slug)).toEqual(seeded.map((p) => p.slug));
  });

  it('returns only projects with a matching project_access row for a non-owner', async () => {
    const [user] = await testDb.insert(users).values({ email: 'user@example.com', role: 'user' }).returning();
    const [sqlpanel, todo] = await seedProjects();
    await testDb.insert(projectAccess).values({ userId: user.id, projectId: todo.id });

    const result = await getProjectsForUser(user.id, 'user');

    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe(todo.slug);
    expect(result.map((p) => p.slug)).not.toContain(sqlpanel.slug);
  });
});
