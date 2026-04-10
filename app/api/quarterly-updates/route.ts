/**
 * Quarterly Updates Worker — Cron-Endpoint
 *
 * Verarbeitet vierteljährliche Policy-Updates für Enterprise-Kunden.
 * Wird per Vercel Cron täglich aufgerufen und prüft, ob Updates fällig sind.
 *
 * Sicherheit: Geschützt durch CRON_SECRET Header.
 *
 * Vercel Cron (vercel.json):
 *   { path: "/api/quarterly-updates", schedule: "0 6 * * *" }
 *   (Täglich um 06:00 UTC — prüft ob Updates fällig sind)
 */

import { NextRequest, NextResponse } from 'next/server'
import { processQuarterlyUpdates, processSubscriptionUpdate } from '@/lib/quarterly-updater'
import { applyRateLimit } from '@/lib/rate-limit'
import * as Sentry from '@sentry/nextjs'

/**
 * Maximale Laufzeit: 5 Minuten.
 * Enterprise-Updates benötigen Claude-Calls + PDF-Generierung.
 */
export const maxDuration = 300

export async function GET(req: NextRequest) {
  // ── Rate-Limiting (20 Requests/Minute — Cron/Admin) ─────────────────
  const rateLimitResponse = await applyRateLimit(req, 'cron')
  if (rateLimitResponse) return rateLimitResponse

  if (!verifyAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Optional: Einzelne Subscription manuell updaten
  const subscriptionId = req.nextUrl.searchParams.get('subscription_id')
  if (subscriptionId) {
    return await handleSingleUpdate(subscriptionId)
  }

  // Batch: Alle fälligen Updates verarbeiten
  return await handleBatchUpdates()
}

// Auch via POST aufrufbar (für Vercel Cron)
export async function POST(req: NextRequest) {
  return GET(req)
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

// ─── Einzelnes Update ───────────────────────────────────────────────────────

async function handleSingleUpdate(subscriptionId: string): Promise<NextResponse> {
  const { createSupabaseServiceClient } = await import('@/lib/supabase')
  const supabase = createSupabaseServiceClient()

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscriptionId)
    .single()

  if (error || !subscription) {
    return NextResponse.json({ error: `Subscription ${subscriptionId} nicht gefunden` }, { status: 404 })
  }

  if (subscription.status !== 'active') {
    return NextResponse.json({
      error: `Subscription ${subscriptionId} ist nicht aktiv (Status: ${subscription.status}).`,
    }, { status: 400 })
  }

  const result = await processSubscriptionUpdate(subscription)

  if (result.success) {
    return NextResponse.json({
      success: true,
      message: `Update für ${result.companyName} erfolgreich generiert.`,
    })
  }

  return NextResponse.json({
    success: false,
    error: result.error,
    message: `Update für ${result.companyName} fehlgeschlagen.`,
  }, { status: 500 })
}

// ─── Batch-Verarbeitung ─────────────────────────────────────────────────────

async function handleBatchUpdates(): Promise<NextResponse> {
  const startTime = Date.now()

  return Sentry.startSpan(
    { name: 'quarterly-updates.batch', op: 'worker.quarterly' },
    async () => {
      const results = await processQuarterlyUpdates()

      const elapsed = Date.now() - startTime
      const successful = results.filter(r => r.success).length
      const failed = results.filter(r => !r.success).length

      console.log(`[QuarterlyUpdates] Batch: ${successful} erfolgreich, ${failed} fehlgeschlagen (${elapsed}ms)`)

      if (failed > 0) {
        Sentry.captureMessage(
          `Quarterly Updates: ${failed} von ${results.length} fehlgeschlagen`,
          {
            level: 'warning',
            tags: { flow: 'quarterly-updates' },
            contexts: {
              batch: { total: results.length, successful, failed, elapsed_ms: elapsed },
            },
          }
        )
      }

      return NextResponse.json({
        processed: results.length,
        successful,
        failed,
        elapsed_ms: elapsed,
        results,
      })
    }
  )
}
