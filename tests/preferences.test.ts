import { describe, it, expect, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb } from './setup/db';
import { users } from '../drizzle/schema';

vi.mock('@/features/auth/lib/auth', () => ({
  auth: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

const { auth } = await import('@/features/auth/lib/auth');
const { setLocale } = await import('@/features/preferences/actions/setLocale');
const { setTheme } = await import('@/features/preferences/actions/setTheme');

async function seedUser() {
  const [user] = await testDb.insert(users).values({ email: 'user@example.com' }).returning();
  return user;
}

describe('setLocale', () => {
  it('updates users.locale in the database', async () => {
    const user = await seedUser();
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id } } as never);

    await setLocale('uk');

    const [updated] = await testDb.select().from(users).where(eq(users.id, user.id));
    expect(updated.locale).toBe('uk');
  });
});

describe('setTheme', () => {
  it('updates users.theme in the database', async () => {
    const user = await seedUser();
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id } } as never);

    await setTheme('dark');

    const [updated] = await testDb.select().from(users).where(eq(users.id, user.id));
    expect(updated.theme).toBe('dark');
  });
});
