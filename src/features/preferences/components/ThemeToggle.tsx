'use client';

import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { setTheme as persistTheme } from '../actions/setTheme';
import type { UserTheme } from '../../../../drizzle/schema';

// Client component: only the type is imported from the schema, not the
// runtime enum object, to avoid pulling drizzle/pg-core into the client bundle.
const THEMES: readonly UserTheme[] = ['light', 'dark', 'theme-rose'];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations('ThemeSwitcher');

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextTheme = event.target.value as UserTheme;
    setTheme(nextTheme); // immediate client-side update
    persistTheme(nextTheme); // persist to DB in background
  }

  function getLabel(value: UserTheme) {
    if (value === 'dark') return t('dark');
    if (value === 'theme-rose') return t('rose');
    return t('light');
  }

  return (
    <select
      value={theme}
      onChange={handleChange}
      aria-label={t('toggleTheme')}
      className="rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
    >
      {THEMES.map((value) => (
        <option key={value} value={value}>
          {getLabel(value)}
        </option>
      ))}
    </select>
  );
}
