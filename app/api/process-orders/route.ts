/**
 * Worker-Route: Verarbeitet offene Orders
 *
 * Wird regelmäßig per Cron aufgerufen (z.B. alle 2 Minuten via Vercel Cron).
 * Kann auch manuell mit ?order_id=xxx aufgerufen werden, um eine einzelne Order
 * erneut zu verarbeiten.
 *
 * Sicherheit: Geschützt durch CRON_SECRET Header.
 *
 * Beispiel Vercel Cron (vercel.json):
 *   crons: [{ path: "/api/process-orders", schedule: "every 2 minutes" }]
 */

import { NextRequest, NextResponse } from 'next/server'
import { processOpenOrders, processOrder } from '@/lib/policy-generator'
import { createSupabaseServiceClient } from '@/lib/supabase'
import { processOrdersQuerySchema } from '@/lib/schemas'
import { applyRateLimit } from '@/lib/rate-limit'
import * as Sentry from '@sentry/nextjs'

/**
 * Maximale Laufzeit: 5 Minuten (Vercel Pro) bzw. 10 Sekunden (Hobby).
 * Bei Vercel Pro empfohlen: maxDuration auf 300 setzen.
 */
export const maxDuration = 300

export async function GET(req: NextRequest) {
  // ── Rate-Limiting (20 Requests/Minute — Cron/Admin) ─────────────────
  const rateLimitResponse = await applyRateLimit(req, 'cron')
  if (rateLimitResponse) return rateLimitResponse

  // Authentifizierung: Cron-Secret oder manueller Admin-Aufruf
  if (!verifyAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Zod-Validierung der Query-Parameter ────────────────────────────
  const rawOrderId = req.nextUrl.searchParams.get('order_id')
  const parsed = processOrdersQuerySchema.safeParse({
    order_id: rawOrderId ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ungültige order_id. Erwartet wird eine gültige UUID.' },
      { status: 400 }
    )
  }

  const orderId = parsed.data.order_id

  // Einzelne Order manuell neu anstoßen
  if (orderId) {
    return await handleSingleOrder(orderId)
  }

  // Alle offenen Orders abarbeiten
  return await handleBatchProcessing()
}

// Auch via POST aufrufbar (z.B. von externen Cron-Services)
export async function POST(req: NextRequest) {
  return GET(req)
}

// ─── Authentifizierung ──────────────────────────────────────────────────────

function verifyAuth(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET

  // Vercel Cron sendet den Secret automatisch als Header
  const authHeader = req.headers.get('authorization')
  if (authHeader === `Bearer ${cronSecret}`) return true

  // Alternativ: Custom Header für manuelle Aufrufe
  const headerSecret = req.headers.get('x-cron-secret')
  if (headerSecret && headerSecret === cronSecret) return true

  // In Development-Umgebung ohne Secret erlauben
  if (process.env.NODE_ENV === 'development' && !cronSecret) return true

  return false
}

// ─── Einzelne Order verarbeiten ─────────────────────────────────────────────

async function handleSingleOrder(orderId: string): Promise<NextResponse> {
  const supabase = createSupabaseServiceClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: `Order ${orderId} nicht gefunden` }, { status: 404 })
  }

  if (order.policy_url) {
    return NextResponse.json({
      message: `Order ${orderId} hat bereits eine Policy.`,
      policy_url: order.policy_url,
    })
  }

  if (order.payment_status !== 'paid') {
    return NextResponse.json({
      error: `Order ${orderId} ist nicht bezahlt (Status: ${order.payment_status}).`,
    }, { status: 400 })
  }

  // Retry-Count zurücksetzen bei manuellem Retry
  await supabase
    .from('orders')
    .update({ retry_count: 0, processing_started_at: null, admin_alerted_at: null })
    .eq('id', orderId)

  const updatedOrder = { ...order, retry_count: 0, processing_started_at: null }
  const result = await processOrder(updatedOrder)

  if (result.success) {
    return NextResponse.json({
      success: true,
      message: `Order ${orderId} erfolgreich verarbeitet.`,
    })
  }

  return NextResponse.json({
    success: false,
    error: result.error,
    message: `Order ${orderId} konnte nicht verarbeitet werden.`,
  }, { status: 500 })
}

// ─── Batch-Verarbeitung ─────────────────────────────────────────────────────

async function handleBatchProcessing(): Promise<NextResponse> {
  const startTime = Date.now()

  return Sentry.startSpan(
    { name: 'process-orders.batch', op: 'worker.batch' },
    async () => {
      const results = await processOpenOrders()

      const elapsed = Date.now() - startTime
      const successful = results.filter(r => r.success).length
      const failed = results.filter(r => !r.success).length

      console.log(`[Worker] Batch abgeschlossen: ${successful} erfolgreich, ${failed} fehlgeschlagen (${elapsed}ms)`)

      // Sentry: Batch-Metriken erfassen
      if (failed > 0) {
        Sentry.captureMessage(
          `Worker-Batch: ${failed} von ${results.length} Orders fehlgeschlagen`,
          {
            level: failed === results.length ? 'error' : 'warning',
            tags: { flow: 'worker-batch' },
            contexts: {
              batch: {
                total: results.length,
                successful,
                failed,
                elapsed_ms: elapsed,
              },
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
