import { getTranslations } from 'next-intl/server';
import { UsersTable } from '@/features/settings/components/UsersTable';
import { listUsersForApproval } from '@/features/settings/lib/queries';

export default async function SettingsUsersPage() {
  const [users, t] = await Promise.all([
    listUsersForApproval(),
    getTranslations('SettingsUsersPage'),
  ]);

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-6">{t('subtitle')}</p>
      <UsersTable users={users} />
    </div>
  );
}
