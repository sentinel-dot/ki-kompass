/**
 * Sentry Server-side Configuration
 *
 * Läuft auf dem Server (Node.js Runtime) — erfasst API-Fehler,
 * Webhook-Probleme, Claude-Timeouts, PDF-Fehler, Supabase-Fehler.
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance: Alle Server-Requests tracen
  tracesSampleRate: 1.0, // 100% in der Anfangsphase, später auf 0.3 reduzieren

  // Umgebung
  environment: process.env.NODE_ENV,

  // Spotlight für lokales Debugging (dev only)
  spotlight: process.env.NODE_ENV === 'development',

  // Kritische Pfade: Fingerprinting für bessere Gruppierung
  beforeSend(event, hint) {
    const error = hint.originalException

    // Payment-ohne-Policy Fehler besonders markieren
    if (error instanceof Error && error.message.includes('Policy-Generierung')) {
      event.fingerprint = ['policy-generation-failure']
      event.level = 'fatal'
      event.tags = {
        ...event.tags,
        flow: 'payment-to-delivery',
        critical: 'true',
      }
    }

    // Claude API Fehler gruppieren
    if (error instanceof Error && (error.message.includes('Claude') || error.message.includes('ANTHROPIC'))) {
      event.fingerprint = ['claude-api-error']
      event.tags = { ...event.tags, service: 'claude' }
    }

    // Puppeteer/PDF Fehler gruppieren
    if (error instanceof Error && (error.message.includes('Puppeteer') || error.message.includes('PDF') || error.message.includes('chromium'))) {
      event.fingerprint = ['pdf-generation-error']
      event.tags = { ...event.tags, service: 'puppeteer' }
    }

    // Supabase Fehler gruppieren
    if (error instanceof Error && (error.message.includes('Supabase') || error.message.includes('Upload'))) {
      event.fingerprint = ['supabase-error']
      event.tags = { ...event.tags, service: 'supabase' }
    }

    // E-Mail-Versand Fehler
    if (error instanceof Error && (error.message.includes('E-Mail') || error.message.includes('Brevo'))) {
      event.fingerprint = ['email-delivery-error']
      event.tags = { ...event.tags, service: 'brevo' }
    }

    return event
  },
})
