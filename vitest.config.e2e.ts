import { defineConfig } from 'vitest/config'
import path from 'path'

/**
 * Vitest-Konfiguration für E2E-Tests (gegen Claude API).
 *
 * Ausführung: npm run test:e2e
 *
 * Benötigt ANTHROPIC_API_KEY als Umgebungsvariable.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    include: ['tests/e2e/**/*.e2e.test.ts'],

    // Großzügiges Timeout — Claude API kann langsam sein
    testTimeout: 120_000,

    // Sequentiell ausführen (API Rate-Limits)
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },

    // Kein Coverage für E2E
    coverage: {
      enabled: false,
    },
  },
})
