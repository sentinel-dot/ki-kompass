/**
 * Sentry Edge Runtime Configuration
 *
 * Für Middleware und Edge-Functions.
 * Leichtere Konfiguration als Server — kein Node.js verfügbar.
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: 1.0,

  environment: process.env.NODE_ENV,
})
