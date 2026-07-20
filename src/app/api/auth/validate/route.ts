import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/features/auth/lib/auth'
import { validateProjectAccess } from '@/features/auth/lib/validate'

export async function GET(req: NextRequest) {
  const headers = { 'Cache-Control': 'no-store' }

  // Validate query param
  const slug = req.nextUrl.searchParams.get('project')
  if (!slug) {
    return NextResponse.json({ error: 'Missing project param' }, { status: 400, headers })
  }

  // Check session
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ allowed: false }, { status: 401, headers })
  }

  const { id: userId, email, role } = session.user

  const { allowed } = await validateProjectAccess(userId, role, slug)

  if (!allowed) {
    return NextResponse.json({ allowed: false }, { headers })
  }

  return NextResponse.json({ userId, email, role, allowed: true }, { headers })
}
