import { describe, it, expect, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb } from './setup/db';
import { users, projects, projectAccess } from '../drizzle/schema';

vi.mock('@/features/auth/lib/auth', () => ({
  auth: vi.fn(),
}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const { auth } = await import('@/features/auth/lib/auth');
const { listUsersForApproval, listApprovedUsersWithAccess, listAllProjects } =
  await import('@/features/settings/lib/queries');
const { setUserStatus } = await import('@/features/settings/actions/setUserStatus');
const { setProjectAccess } = await import('@/features/settings/actions/setProjectAccess');

async function seedOwner() {
  const [owner] = await testDb
    .insert(users)
    .values({ email: 'owner@example.com', role: 'owner', status: 'approved' })
    .returning();
  return owner;
}

async function seedNonOwner(status: 'pending' | 'approved' | 'blocked') {
  const [user] = await testDb
    .insert(users)
    .values({ email: `${status}@example.com`, role: 'user', status })
    .returning();
  return user;
}

describe('listUsersForApproval', () => {
  it('returns non-owner users with their status, excluding the owner', async () => {
    await seedOwner();
    const pending = await seedNonOwner('pending');
    const approved = await seedNonOwner('approved');

    const result = await listUsersForApproval();

    expect(result.map((u) => u.id).sort()).toEqual([pending.id, approved.id].sort());
    expect(result.find((u) => u.id === pending.id)?.status).toBe('pending');
    expect(result.find((u) => u.id === approved.id)?.status).toBe('approved');
  });
});

describe('listApprovedUsersWithAccess', () => {
  it('only includes approved non-owner users, with their granted project ids', async () => {
    await seedOwner();
    const pending = await seedNonOwner('pending');
    const approved = await seedNonOwner('approved');
    const [project] = await testDb
      .insert(projects)
      .values({ slug: 'todo', name: 'Todo' })
      .returning();
    await testDb.insert(projectAccess).values({ userId: approved.id, projectId: project.id });

    const result = await listApprovedUsersWithAccess();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(approved.id);
    expect(result[0].projectIds).toEqual([project.id]);
    expect(result.map((u) => u.id)).not.toContain(pending.id);
  });

  it('returns an empty projectIds array for an approved user with no grants', async () => {
    const approved = await seedNonOwner('approved');

    const result = await listApprovedUsersWithAccess();

    expect(result[0].id).toBe(approved.id);
    expect(result[0].projectIds).toEqual([]);
  });
});

describe('listAllProjects', () => {
  it('returns all projects', async () => {
    await testDb.insert(projects).values([
      { slug: 'todo', name: 'Todo', order: 1 },
      { slug: 'sqlpanel', name: 'SQL Panel', order: 0 },
    ]);

    const result = await listAllProjects();

    expect(result.map((p) => p.slug)).toEqual(['sqlpanel', 'todo']);
  });
});

describe('setUserStatus', () => {
  it('updates status when called by the owner', async () => {
    const owner = await seedOwner();
    const target = await seedNonOwner('pending');
    vi.mocked(auth).mockResolvedValue({ user: { id: owner.id, role: 'owner' } } as never);

    await setUserStatus(target.id, 'approved');

    const [updated] = await testDb.select().from(users).where(eq(users.id, target.id));
    expect(updated.status).toBe('approved');
  });

  it('does nothing when called by a non-owner', async () => {
    const target = await seedNonOwner('pending');
    vi.mocked(auth).mockResolvedValue({ user: { id: target.id, role: 'user' } } as never);

    await setUserStatus(target.id, 'approved');

    const [unchanged] = await testDb.select().from(users).where(eq(users.id, target.id));
    expect(unchanged.status).toBe('pending');
  });
});

describe('setProjectAccess', () => {
  it('grants and revokes access to exactly the given project set, called by the owner', async () => {
    const owner = await seedOwner();
    const target = await seedNonOwner('approved');
    const [todo, sqlpanel] = await testDb
      .insert(projects)
      .values([
        { slug: 'todo', name: 'Todo' },
        { slug: 'sqlpanel', name: 'SQL Panel' },
      ])
      .returning();
    await testDb.insert(projectAccess).values({ userId: target.id, projectId: todo.id });
    vi.mocked(auth).mockResolvedValue({ user: { id: owner.id, role: 'owner' } } as never);

    await setProjectAccess(target.id, [sqlpanel.id]);

    const grants = await testDb
      .select()
      .from(projectAccess)
      .where(eq(projectAccess.userId, target.id));
    expect(grants.map((g) => g.projectId)).toEqual([sqlpanel.id]);
  });

  it('does nothing when called by a non-owner', async () => {
    const target = await seedNonOwner('approved');
    const [project] = await testDb
      .insert(projects)
      .values({ slug: 'todo', name: 'Todo' })
      .returning();
    vi.mocked(auth).mockResolvedValue({ user: { id: target.id, role: 'user' } } as never);

    await setProjectAccess(target.id, [project.id]);

    const grants = await testDb
      .select()
      .from(projectAccess)
      .where(eq(projectAccess.userId, target.id));
    expect(grants).toHaveLength(0);
  });
});
