import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/features/auth/lib/auth';
import { db } from '@/shared/lib/db';
import { users } from '../../../../../drizzle/schema';

// Runs in the normal Node.js runtime (Route Handlers aren't Edge-restricted),
// unlike middleware. Middleware calls this over an internal loopback fetch
// (not the public hostname - see ADR-019) so it can check status against the
// database on every request without pulling drizzle-orm/postgres (raw Node
// "net" sockets, unsupported in the Edge runtime middleware runs in) into
// its own bundle.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ status: null }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const [dbUser] = await db
    .select({ status: users.status })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  return NextResponse.json(
    { status: dbUser?.status ?? null },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
