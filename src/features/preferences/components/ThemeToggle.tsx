'use client'

import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'
import { Button } from '@/shared/ui/button'
import { setTheme as persistTheme } from '../actions/setTheme'

const THEMES = ['light', 'dark', 'theme-rose'] as const

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const t = useTranslations('ThemeSwitcher')

  function cycleTheme() {
    const currentIndex = THEMES.indexOf(theme as (typeof THEMES)[number])
    const nextTheme = THEMES[(currentIndex + 1) % THEMES.length]
    setTheme(nextTheme)        // immediate client-side update
    persistTheme(nextTheme)    // persist to DB in background
  }

  function getLabel() {
    if (theme === 'dark') return t('dark')
    if (theme === 'theme-rose') return t('rose')
    return t('light')
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={cycleTheme}
      aria-label={t('toggleTheme')}
    >
      {getLabel()}
    </Button>
  )
}
