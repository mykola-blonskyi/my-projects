import Image from 'next/image';
import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { auth } from '@/features/auth/lib/auth';
import { logout } from '@/features/auth/actions/logout';
import { ThemeToggle } from '@/features/preferences/components/ThemeToggle';
import { LocaleSwitcher } from '@/features/preferences/components/LocaleSwitcher';
import { Button } from './button';

export async function Header() {
  const [session, t, locale] = await Promise.all([auth(), getTranslations('Nav'), getLocale()]);
  const user = session?.user;

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <span className="font-semibold text-sm">blonskyi.dev</span>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LocaleSwitcher />

          {user?.role === 'owner' && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${locale}/settings`}>{t('settings')}</Link>
            </Button>
          )}

          {user?.image && (
            <Image
              src={user.image}
              alt={user.name ?? 'avatar'}
              width={32}
              height={32}
              className="rounded-full"
            />
          )}

          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm">
              {t('signOut')}
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
