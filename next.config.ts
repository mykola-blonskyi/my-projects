import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/shared/lib/i18n/request.ts')

const nextConfig: NextConfig = {
  output: 'standalone', // required for the lean multi-stage Docker build
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google OAuth profile pictures
      },
    ],
  },
}

export default withNextIntl(nextConfig)
