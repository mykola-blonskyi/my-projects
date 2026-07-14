import { getTranslations } from 'next-intl/server'
import { Header } from '@/shared/ui/header'
import { ProjectGrid } from '@/features/projects/components/ProjectGrid'
import { getAllProjects } from '@/features/projects/lib/queries'

export default async function HomePage() {
  const [projects, t] = await Promise.all([getAllProjects(), getTranslations('ProjectsPage')])

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <ProjectGrid projects={projects} />
      </main>
    </>
  )
}
