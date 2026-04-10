/**
 * Law Change Alerts — API-Endpoint
 *
 * Ermöglicht das Erstellen und Senden von Gesetzesänderungs-Alerts
 * an Enterprise-Kunden.
 *
 * POST /api/law-change-alerts         — Neuen Alert erstellen
 * POST /api/law-change-alerts?send=ID — Alert an alle Kunden senden
 * GET  /api/law-change-alerts         — Alle Alerts auflisten
 *
 * Sicherheit: Geschützt durch CRON_SECRET Header (Admin-only).
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  createLawChangeAlert,
  sendLawChangeAlertToAll,
  getAllAlerts,
  type CreateAlertParams,
} from '@/lib/law-change-notifier'
import { applyRateLimit } from '@/lib/rate-limit'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'

/**
 * Maximale Laufzeit: 5 Minuten.
 * Alert-Versand an viele Kunden kann dauern (Claude-Personalisierung + E-Mail).
 */
export const maxDuration = 300

// ─── Zod-Schemas ────────────────────────────────────────────────────────────

const createAlertSchema = z.object({
  title: z.string().min(5, 'Titel muss mindestens 5 Zeichen lang sein.').max(200),
  description: z.string().min(20, 'Beschreibung muss mindestens 20 Zeichen lang sein.').max(5000),
  lawReference: z.string().min(3, 'Rechtsreferenz ist erforderlich.').max(200),
  effectiveDate: z.string().date('Ungültiges Datum (YYYY-MM-DD erwartet).').optional(),
  severity: z.enum(['info', 'warning', 'critical'], {
    errorMap: () => ({ message: 'Schweregrad muss info, warning oder critical sein.' }),
  }),
})

// ─── GET: Alle Alerts auflisten ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // ── Rate-Limiting (20 Requests/Minute — Admin) ─────────────────────
  const rateLimitResponse = await applyRateLimit(req, 'cron')
  if (rateLimitResponse) return rateLimitResponse

  if (!verifyAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const alerts = await getAllAlerts()
    return NextResponse.json({ alerts, total: alerts.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
    Sentry.captureException(err, { tags: { flow: 'law-change-alerts', step: 'list' } })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ─── POST: Alert erstellen oder senden ──────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Rate-Limiting (20 Requests/Minute — Admin) ─────────────────────
  const rateLimitResponsePost = await applyRateLimit(req, 'cron')
  if (rateLimitResponsePost) return rateLimitResponsePost

  if (!verifyAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Modus: Alert senden (wenn ?send=ALERT_ID als Query-Parameter)
  const sendAlertId = req.nextUrl.searchParams.get('send')
  if (sendAlertId) {
    return await handleSendAlert(sendAlertId)
  }

  // Modus: Neuen Alert erstellen
  return await handleCreateAlert(req)
}

// ─── Alert erstellen ────────────────────────────────────────────────────────

async function handleCreateAlert(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json()

    const parsed = createAlertSchema.safeParse(body)
    if (!parsed.success) {
      const errors = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
      return NextResponse.json(
        { error: 'Validierungsfehler', details: errors },
        { status: 400 }
      )
    }

    const alertId = await createLawChangeAlert(parsed.data as CreateAlertParams)

    return NextResponse.json({
      success: true,
      alertId,
      message: `Alert erstellt. Zum Senden: POST /api/law-change-alerts?send=${alertId}`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
    Sentry.captureException(err, { tags: { flow: 'law-change-alerts', step: 'create' } })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ─── Alert senden ───────────────────────────────────────────────────────────

async function handleSendAlert(alertId: string): Promise<NextResponse> {
  const startTime = Date.now()

  return Sentry.startSpan(
    { name: 'law-change-alerts.send', op: 'alert.send' },
    async () => {
      try {
        const result = await sendLawChangeAlertToAll(alertId)
        const elapsed = Date.now() - startTime

        if (!result.success) {
          Sentry.captureMessage(
            `Law-Change-Alert: ${result.errors.length} E-Mails fehlgeschlagen`,
            {
              level: 'warning',
              tags: { flow: 'law-change-alerts', alert_id: alertId },
              contexts: {
                alert: {
                  total_recipients: result.totalRecipients,
                  emails_sent: result.emailsSent,
                  errors: result.errors,
                },
              },
            }
          )
        }

        return NextResponse.json({
          ...result,
          elapsed_ms: elapsed,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
        Sentry.captureException(err, {
          tags: { flow: 'law-change-alerts', step: 'send', alert_id: alertId },
        })
        return NextResponse.json({ error: message }, { status: 500 })
      }
    }
  )
}

// ─── Authentifizierung ──────────────────────────────────────────────────────

function verifyAuth(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET

  const authHeader = req.headers.get('authorization')
  if (authHeader === `Bearer ${cronSecret}`) return true

  const headerSecret = req.headers.get('x-cron-secret')
  if (headerSecret && headerSecret === cronSecret) return true

  if (process.env.NODE_ENV === 'development' && !cronSecret) return true

  return false
}
