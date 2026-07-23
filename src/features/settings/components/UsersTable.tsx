import { getTranslations } from 'next-intl/server';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { UserStatusActions } from './UserStatusActions';
import type { UserForApproval } from '../lib/queries';
import type { UserStatus } from '../../../../drizzle/schema';

interface UsersTableProps {
  users: UserForApproval[];
}

const STATUS_VARIANT: Record<UserStatus, 'default' | 'secondary' | 'destructive'> = {
  approved: 'default',
  pending: 'secondary',
  blocked: 'destructive',
};

export async function UsersTable({ users }: UsersTableProps) {
  const t = await getTranslations('SettingsUsersPage');

  const statusLabel: Record<UserStatus, string> = {
    pending: t('statusPending'),
    approved: t('statusApproved'),
    blocked: t('statusBlocked'),
  };

  if (users.length === 0) {
    return <p className="text-center text-muted-foreground py-16">{t('emptyState')}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('columnName')}</TableHead>
          <TableHead>{t('columnEmail')}</TableHead>
          <TableHead>{t('columnStatus')}</TableHead>
          <TableHead>{t('columnActions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.name ?? '—'}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[user.status]}>{statusLabel[user.status]}</Badge>
            </TableCell>
            <TableCell>
              <UserStatusActions userId={user.id} status={user.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
