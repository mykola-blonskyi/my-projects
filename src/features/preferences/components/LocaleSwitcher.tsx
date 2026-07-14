'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { locales, type Locale } from '@/shared/lib/i18n/config'
import { setLocale } from '../actions/setLocale'

export function LocaleSwitcher() {
  const locale = useLocale()
  const t = useTranslations('LocaleSwitcher')
  const [isPending, startTransition] = useTransition()

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value as Locale
    startTransition(() => {
      setLocale(nextLocale)
    })
  }

  return (
    <select
      value={locale}
      onChange={handleChange}
      disabled={isPending}
      aria-label={t('label')}
      className="rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
    >
      {locales.map((loc) => (
        <option key={loc} value={loc}>
          {t(loc)}
        </option>
      ))}
    </select>
  )
}
