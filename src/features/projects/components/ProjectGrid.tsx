import { useTranslations } from 'next-intl';
import { ProjectCard } from './ProjectCard';
import type { Project } from '../lib/queries';

interface ProjectGridProps {
  projects: Project[];
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  const t = useTranslations('ProjectsPage');

  if (projects.length === 0) {
    return <p className="text-center text-muted-foreground py-16">{t('emptyState')}</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
