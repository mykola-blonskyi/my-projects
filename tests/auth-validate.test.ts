import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { testDb } from './setup/db';
import { projects, projectAccess, users } from '../drizzle/schema';

vi.mock('@/features/auth/lib/auth', () => ({
  auth: vi.fn(),
}));

const { auth } = await import('@/features/auth/lib/auth');
const { GET } = await import('@/app/api/auth/validate/route');

function requestFor(slug: string | null) {
  const url = slug
    ? `http://localhost/api/auth/validate?project=${slug}`
    : 'http://localhost/api/auth/validate';
  return new NextRequest(url);
}

async function seedUserAndProject(role: 'owner' | 'user') {
  const [user] = await testDb
    .insert(users)
    .values({ email: `${role}@example.com`, role })
    .returning();
  const [project] = await testDb
    .insert(projects)
    .values({ slug: 'sqlpanel', name: 'SQL Panel' })
    .returning();
  return { user, project };
}

describe('GET /api/auth/validate', () => {
  it('allows an owner regardless of project_access rows', async () => {
    const { user } = await seedUserAndProject('owner');
    vi.mocked(auth).mockResolvedValue({
      user: { id: user.id, email: user.email, role: 'owner' },
    } as never);

    const res = await GET(requestFor('sqlpanel'));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ allowed: true, role: 'owner' });
  });

  it('allows a non-owner with a matching project_access row', async () => {
    const { user, project } = await seedUserAndProject('user');
    await testDb.insert(projectAccess).values({ userId: user.id, projectId: project.id });
    vi.mocked(auth).mockResolvedValue({
      user: { id: user.id, email: user.email, role: 'user' },
    } as never);

    const res = await GET(requestFor('sqlpanel'));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ allowed: true, role: 'user' });
  });

  it('denies a non-owner without a project_access row', async () => {
    const { user } = await seedUserAndProject('user');
    vi.mocked(auth).mockResolvedValue({
      user: { id: user.id, email: user.email, role: 'user' },
    } as never);

    const res = await GET(requestFor('sqlpanel'));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ allowed: false });
  });

  it('denies and returns 401 when there is no session (missing JWT)', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const res = await GET(requestFor('sqlpanel'));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ allowed: false });
  });

  it('denies and returns 401 when the session has no user id (invalid JWT)', async () => {
    vi.mocked(auth).mockResolvedValue({ user: {} } as never);

    const res = await GET(requestFor('sqlpanel'));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ allowed: false });
  });

  it('denies access to an unknown project slug', async () => {
    const { user } = await seedUserAndProject('user');
    vi.mocked(auth).mockResolvedValue({
      user: { id: user.id, email: user.email, role: 'user' },
    } as never);

    const res = await GET(requestFor('does-not-exist'));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ allowed: false });
  });
});
