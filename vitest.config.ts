import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    // All test files share one Postgres instance; running them in parallel
    // causes cross-file truncate/insert races.
    fileParallelism: false,
    globalSetup: './tests/setup/global-setup.ts',
    setupFiles: ['./tests/setup/test-setup.ts'],
    include: ['tests/**/*.test.ts'],
    env: {
      DATABASE_URL: 'postgres://hub_test:hub_test@localhost:5434/hub_test',
    },
    coverage: {
      provider: 'v8',
    },
  },
})
