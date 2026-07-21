'use client';

import { useTransition } from 'react';
import { Button } from '@/shared/ui/button';
import { signInWithGoogle } from '../actions/signInWithGoogle';

interface GoogleSignInButtonProps {
  label: string;
}

export function GoogleSignInButton({ label }: GoogleSignInButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const url = await signInWithGoogle();
      window.location.href = url;
    });
  }

  return (
    <Button type="button" className="w-full" onClick={handleClick} disabled={isPending}>
      {label}
    </Button>
  );
}
