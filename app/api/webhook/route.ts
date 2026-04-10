import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createSupabaseServiceClient } from '@/lib/supabase'
import { applyRateLimit } from '@/lib/rate-limit'
import * as Sentry from '@sentry/nextjs'
import Stripe from 'stripe'
import { z } from 'zod'

/** UUID-Schema für defense-in-depth Validierung der Order-ID aus Stripe Metadata */
const orderIdSchema = z.string().uuid('order_id aus Stripe Metadata ist keine gültige UUID.')

/**
 * Stripe Webhook Handler
 *
 * Entkoppelt von der Policy-Generierung:
 * - Setzt nur den Zahlungsstatus auf 'paid'
 * - Initialisiert retry_count auf 0
 * - Die eigentliche Policy-Generierung erfolgt über den Worker (/api/process-orders)
 *
 * Idempotenz: Doppelte Webhook-Calls für dieselbe Order lösen keine
 * doppelte Verarbeitung aus (Update ist idempotent).
 */
export async function POST(req: NextRequest) {
  // ── Rate-Limiting (30 Requests/Minute — Stripe kann Batches senden) ──
  const rateLimitResponse = await applyRateLimit(req, 'webhook')
  if (rateLimitResponse) return rateLimitResponse

  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Keine Webhook-Signatur' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ungültige Signatur'
    Sentry.captureException(err, {
      tags: { flow: 'webhook', step: 'signature-verification' },
      level: 'warning',
    })
    return NextResponse.json({ error: `Webhook-Verifikation fehlgeschlagen: ${message}` }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session

  if (session.payment_status !== 'paid') {
    return NextResponse.json({ received: true })
  }

  const orderId = session.metadata?.order_id
  if (!orderId) {
    Sentry.captureMessage('Webhook: Keine Order-ID in Stripe Session Metadata', {
      level: 'error',
      tags: { flow: 'webhook' },
      contexts: { stripe: { session_id: session.id } },
    })
    return NextResponse.json({ error: 'Keine Order-ID in Metadata' }, { status: 400 })
  }

  // Defense-in-depth: UUID-Format der Order-ID validieren
  const parsedOrderId = orderIdSchema.safeParse(orderId)
  if (!parsedOrderId.success) {
    Sentry.captureMessage(`Webhook: Ungültiges Order-ID-Format: ${orderId}`, {
      level: 'error',
      tags: { flow: 'webhook' },
      contexts: { stripe: { session_id: session.id, order_id: orderId } },
    })
    return NextResponse.json({ error: 'Ungültiges Order-ID-Format' }, { status: 400 })
  }

  // Sentry: Order-Kontext für alle folgenden Events setzen
  Sentry.setTag('order_id', orderId)
  Sentry.setTag('flow', 'webhook')

  const supabase = createSupabaseServiceClient()

  // Idempotent: Nur Orders updaten, die noch nicht bezahlt sind
  const { data: order, error: updateError } = await supabase
    .from('orders')
    .update({
      payment_status: 'paid',
      retry_count: 0,
      processing_started_at: null,
    })
    .eq('id', orderId)
    .neq('payment_status', 'paid') // Nur wenn noch nicht bezahlt → Idempotenz
    .select('id')
    .maybeSingle()

  if (updateError) {
    console.error(`[Webhook] Fehler beim Update von Order ${orderId}:`, updateError.message)
    Sentry.captureException(new Error(`Webhook DB-Update fehlgeschlagen: ${updateError.message}`), {
      tags: { order_id: orderId, flow: 'webhook', step: 'db-update' },
      level: 'error',
    })
    return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 })
  }

  if (!order) {
    // Entweder Order nicht gefunden oder bereits bezahlt (doppelter Webhook)
    console.log(`[Webhook] Order ${orderId} bereits bezahlt oder nicht gefunden — ignoriert (Idempotenz).`)
    return NextResponse.json({ received: true, note: 'Already processed or not found' })
  }

  console.log(`[Webhook] ✅ Order ${orderId} auf 'paid' gesetzt. Worker wird Policy generieren.`)

  // Optional: Sofort Worker triggern für schnellere Verarbeitung
  // (Der Cron-Job läuft ohnehin alle 2 Minuten als Fallback)
  triggerWorker(orderId).catch(err =>
    console.warn(`[Webhook] Worker-Trigger fehlgeschlagen (Cron übernimmt):`, err)
  )

  return NextResponse.json({ success: true, orderId })
}

// ─── Worker-Trigger ─────────────────────────────────────────────────────────

/**
 * Triggert den Worker-Endpoint asynchron, damit die Order sofort
 * verarbeitet wird (statt auf den nächsten Cron-Zyklus zu warten).
 * Fire-and-forget: Fehler hier sind unkritisch, da der Cron-Job
 * als Fallback alle 2 Minuten läuft.
 */
async function triggerWorker(orderId: string): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ki-kompass.de'
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.warn('[Webhook] CRON_SECRET nicht gesetzt — Worker kann nicht getriggert werden.')
    return
  }

  const response = await fetch(`${baseUrl}/api/process-orders?order_id=${orderId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${cronSecret}`,
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Worker-Trigger HTTP ${response.status}: ${text}`)
  }

  console.log(`[Webhook] Worker für Order ${orderId} erfolgreich getriggert.`)
}
