'use server';

import { signIn } from '@/features/auth/lib/auth';

// redirect: false returns the provider's authorization URL as a string instead
// of calling Next.js's redirect() internally - that path is buggy for external
// URLs invoked from a Server Action (see ADR-015), so the client navigates itself.
export async function signInWithGoogle(): Promise<string> {
  const url = await signIn('google', { redirect: false });
  return url as string;
}
