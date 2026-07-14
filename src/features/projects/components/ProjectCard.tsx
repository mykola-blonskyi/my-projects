import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import type { Project } from '../lib/queries'

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const t = useTranslations('ProjectsPage')

  return (
    <a
      href={project.url ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
      aria-label={`${project.name} — ${t('viewProject')}`}
    >
      <Card className="h-full transition-shadow group-hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            {project.icon && (
              <span className="text-2xl" aria-hidden>
                {project.icon}
              </span>
            )}
            <CardTitle className="text-base leading-tight">{project.name}</CardTitle>
          </div>
        </CardHeader>
        {project.description && (
          <CardContent>
            <CardDescription className="text-sm leading-relaxed">
              {project.description}
            </CardDescription>
          </CardContent>
        )}
      </Card>
    </a>
  )
}
