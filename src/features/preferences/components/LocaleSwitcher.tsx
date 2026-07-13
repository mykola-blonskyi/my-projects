'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { locales, type Locale } from '@/shared/lib/i18n/config'

export function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('LocaleSwitcher')

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value as Locale

    // Replace the current locale prefix in the pathname
    const segments = pathname.split('/')
    // segments[0] is '', segments[1] is locale
    segments[1] = nextLocale
    const nextPathname = segments.join('/')

    router.push(nextPathname)
  }

  return (
    <select
      value={locale}
      onChange={handleChange}
      aria-label={t('label')}
      className="rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      {locales.map((loc) => (
        <option key={loc} value={loc}>
          {t(loc)}
        </option>
      ))}
    </select>
  )
}
