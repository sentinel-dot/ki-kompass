'use client'

/**
 * Globaler Error-Handler für die App
 *
 * Fängt unhandled Errors in React-Komponenten auf und
 * zeigt eine benutzerfreundliche Fehlermeldung an.
 * Sentry erfasst den Fehler automatisch.
 */

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="de">
      <body style={{ fontFamily: 'Arial, sans-serif', background: '#F7F4EF', margin: 0, padding: '40px 20px' }}>
        <div style={{
          maxWidth: '480px',
          margin: '80px auto',
          textAlign: 'center',
          color: '#1B2A4A',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'rgba(198, 40, 40, 0.1)',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: '24px',
          }}>
            ⚠
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 300, marginBottom: '12px' }}>
            Ein Fehler ist aufgetreten
          </h2>
          <p style={{ color: 'rgba(27, 42, 74, 0.6)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
            Bitte versuchen Sie es erneut. Sollte das Problem bestehen bleiben,
            kontaktieren Sie uns unter{' '}
            <a href="mailto:support@ki-kompass.de" style={{ color: '#1B2A4A' }}>
              support@ki-kompass.de
            </a>
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: '#1B2A4A',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '2px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Erneut versuchen
          </button>
        </div>
      </body>
    </html>
  )
}
