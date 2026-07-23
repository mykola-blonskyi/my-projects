import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/features/auth/lib/auth';
import { Header } from '@/shared/ui/header';
import { SettingsNav } from '@/features/settings/components/SettingsNav';

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default async function SettingsLayout({ children }: SettingsLayoutProps) {
  const [session, t] = await Promise.all([auth(), getTranslations('SettingsPage')]);

  if (session?.user?.role !== 'owner') {
    redirect('/en/projects');
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        </div>
        <div className="flex gap-8">
          <SettingsNav />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </main>
    </>
  );
}
