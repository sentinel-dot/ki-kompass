import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    // Standard-Tests (Unit + Integration) — ohne Claude API
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/**/*.e2e.test.ts'],

    // Timeouts
    testTimeout: 10_000,

    // Coverage
    coverage: {
      provider: 'v8',
      include: ['lib/validation.ts', 'lib/prompt.ts', 'lib/claude.ts'],
      reporter: ['text', 'json-summary'],
    },
  },
})
