import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
  },
}

export default withSentryConfig(nextConfig, {
  // Sentry Build-Optionen
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Source Maps nur an Sentry senden, nicht öffentlich machen
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Automatische Instrumentation
  autoInstrumentServerFunctions: true,
  autoInstrumentMiddleware: true,
  autoInstrumentAppDirectory: true,

  // Tunnel um Ad-Blocker zu umgehen (optional, kann aktiviert werden)
  // tunnelRoute: '/monitoring-tunnel',

  // Build-Output nicht durch Sentry-Warnungen blockieren
  silent: !process.env.CI,

  // Telemetrie deaktivieren
  telemetry: false,
})
