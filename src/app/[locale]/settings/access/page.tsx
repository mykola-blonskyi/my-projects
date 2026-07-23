import { getTranslations } from 'next-intl/server';
import { ProjectAccessTable } from '@/features/settings/components/ProjectAccessTable';
import { listApprovedUsersWithAccess, listAllProjects } from '@/features/settings/lib/queries';

export default async function SettingsAccessPage() {
  const [users, allProjects, t] = await Promise.all([
    listApprovedUsersWithAccess(),
    listAllProjects(),
    getTranslations('SettingsAccessPage'),
  ]);

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-6">{t('subtitle')}</p>
      <ProjectAccessTable users={users} allProjects={allProjects} />
    </div>
  );
}
