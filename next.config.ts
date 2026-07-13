import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/shared/lib/i18n/request.ts')

const nextConfig: NextConfig = {
  // Routing only — no business logic here
}

export default withNextIntl(nextConfig)
