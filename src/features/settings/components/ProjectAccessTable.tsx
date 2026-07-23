import { getTranslations } from 'next-intl/server';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { ProjectAccessDialog } from './ProjectAccessDialog';
import type { ApprovedUserWithAccess, SelectableProject } from '../lib/queries';

interface ProjectAccessTableProps {
  users: ApprovedUserWithAccess[];
  allProjects: SelectableProject[];
}

export async function ProjectAccessTable({ users, allProjects }: ProjectAccessTableProps) {
  const t = await getTranslations('SettingsAccessPage');
  const projectById = new Map(allProjects.map((project) => [project.id, project]));

  if (users.length === 0) {
    return <p className="text-center text-muted-foreground py-16">{t('emptyState')}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('columnName')}</TableHead>
          <TableHead>{t('columnEmail')}</TableHead>
          <TableHead>{t('columnProjects')}</TableHead>
          <TableHead>{t('columnActions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.name ?? '—'}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              {user.projectIds.length === 0 ? (
                <span className="text-muted-foreground">{t('noProjects')}</span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {user.projectIds.map((projectId) => (
                    <Badge key={projectId} variant="secondary">
                      {projectById.get(projectId)?.name ?? projectId}
                    </Badge>
                  ))}
                </div>
              )}
            </TableCell>
            <TableCell>
              <ProjectAccessDialog
                userId={user.id}
                userLabel={user.name ?? user.email}
                allProjects={allProjects}
                initialProjectIds={user.projectIds}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
