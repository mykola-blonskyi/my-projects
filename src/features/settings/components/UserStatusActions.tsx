'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/shared/ui/button';
import { setUserStatus } from '../actions/setUserStatus';
import type { UserStatus } from '../../../../drizzle/schema';

interface UserStatusActionsProps {
  userId: string;
  status: UserStatus;
}

export function UserStatusActions({ userId, status }: UserStatusActionsProps) {
  const t = useTranslations('SettingsUsersPage');
  const [isPending, setIsPending] = useState(false);

  async function handleChange(nextStatus: UserStatus) {
    setIsPending(true);
    await setUserStatus(userId, nextStatus);
    setIsPending(false);
  }

  return (
    <div className="flex gap-2">
      {status !== 'approved' && (
        <Button size="sm" onClick={() => handleChange('approved')} disabled={isPending}>
          {t('approve')}
        </Button>
      )}
      {status !== 'blocked' && (
        <Button
          size="sm"
          variant="destructive"
          onClick={() => handleChange('blocked')}
          disabled={isPending}
        >
          {t('block')}
        </Button>
      )}
    </div>
  );
}
