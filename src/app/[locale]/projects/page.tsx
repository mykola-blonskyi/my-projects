import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/features/auth/lib/auth';
import { Header } from '@/shared/ui/header';
import { ProjectGrid } from '@/features/projects/components/ProjectGrid';
import { getProjectsForUser } from '@/features/projects/lib/queries';

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect('/en/login');

  const [projects, t] = await Promise.all([
    getProjectsForUser(session.user.id, session.user.role),
    getTranslations('ProjectsPage'),
  ]);

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
  );
}
