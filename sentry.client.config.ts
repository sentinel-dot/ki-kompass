/**
 * Sentry Client-side Configuration
 *
 * Läuft im Browser — erfasst Frontend-Fehler, Performance und User-Feedback.
 * Wird automatisch von @sentry/nextjs via next.config.ts geladen.
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 1.0, // 100% in der Anfangsphase, später auf 0.2–0.5 reduzieren

  // Session Replay für Fehler-Debugging
  replaysSessionSampleRate: 0.1, // 10% aller Sessions
  replaysOnErrorSampleRate: 1.0, // 100% bei Fehlern

  integrations: [
    Sentry.replayIntegration(),
    Sentry.browserTracingIntegration(),
  ],

  // Umgebung
  environment: process.env.NODE_ENV,

  // Sensible Daten filtern
  beforeSend(event) {
    // PII aus Breadcrumbs entfernen
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
        if (breadcrumb.data?.url) {
          // E-Mail-Parameter aus URLs entfernen
          try {
            const url = new URL(breadcrumb.data.url)
            url.searchParams.delete('email')
            breadcrumb.data.url = url.toString()
          } catch {
            // URL parsing fehlgeschlagen, ignorieren
          }
        }
        return breadcrumb
      })
    }
    return event
  },

  // Bekannte Browser-Erweiterungen ignorieren
  ignoreErrors: [
    'ResizeObserver loop',
    'Non-Error promise rejection captured',
    /^Loading chunk \d+ failed/,
  ],
})
