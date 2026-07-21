'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { signInWithGoogle } from '../actions/signInWithGoogle';

interface GoogleSignInButtonProps {
  label: string;
}

export function GoogleSignInButton({ label }: GoogleSignInButtonProps) {
  const [isPending, setIsPending] = useState(false);

  // Plain async/await, not useTransition/startTransition: this click leaves
  // the SPA entirely via a real navigation, so there's no in-app UI update to
  // batch - wrapping it in a transition caused React/Next.js to replay the
  // action a second time after the window.location.href navigation (see
  // ADR-016).
  async function handleClick() {
    setIsPending(true);
    const url = await signInWithGoogle();
    window.location.href = url;
  }

  return (
    <Button type="button" className="w-full" onClick={handleClick} disabled={isPending}>
      {label}
    </Button>
  );
}
