'use client';

import { useEffect, useState } from 'react';
import { getCsrfToken } from 'next-auth/react';
import { Button } from '@/shared/ui/button';

interface GoogleSignInButtonProps {
  label: string;
}

// A plain HTML form POSTing straight to Auth.js's own /api/auth/signin/google,
// not a Server Action: any Server Action invocation here gets wrapped in
// Next.js's own internal startTransition, which replays once the resulting
// external navigation lands on a page that also uses Server Actions (see
// ADR-016 - dropping our own useTransition wasn't enough, since the wrapping
// happens inside Next.js's framework code regardless). A native form submit
// leaves no React/Next.js request-handling in the loop at all.
export function GoogleSignInButton({ label }: GoogleSignInButtonProps) {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  useEffect(() => {
    getCsrfToken().then(setCsrfToken);
  }, []);

  return (
    <form method="POST" action="/api/auth/signin/google">
      <input type="hidden" name="csrfToken" value={csrfToken ?? ''} />
      <Button type="submit" className="w-full" disabled={!csrfToken}>
        {label}
      </Button>
    </form>
  );
}
