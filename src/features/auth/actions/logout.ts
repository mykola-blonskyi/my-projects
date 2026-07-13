'use server'

import { signOut } from '@/features/auth/lib/auth'

export async function logout() {
  await signOut({ redirectTo: '/en/login' })
}
