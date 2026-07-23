'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';

export function SettingsNav() {
  const t = useTranslations('SettingsPage');
  const locale = useLocale();
  const pathname = usePathname();

  const tabs = [
    { href: `/${locale}/settings/users`, label: t('usersTab') },
    { href: `/${locale}/settings/access`, label: t('accessTab') },
  ];

  return (
    <nav className="flex flex-col gap-1 w-48 shrink-0">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            'rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
            pathname === tab.href && 'bg-accent text-accent-foreground',
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
