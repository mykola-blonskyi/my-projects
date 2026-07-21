'use server';

import { signOut } from '@/features/auth/lib/auth';

export async function logout() {
  // Absolute URL, not a relative path: signOut()'s internal host detection
  // resolves to the container's raw HOSTNAME:PORT behind Traefik/Coolify.
  await signOut({ redirectTo: `${process.env.API_URL}/en/login` });
}
