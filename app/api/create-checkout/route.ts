import { NextRequest, NextResponse } from 'next/server'
import { stripe, TIER_PRICES } from '@/lib/stripe'
import { createSupabaseServiceClient } from '@/lib/supabase'
import { checkoutRequestSchema, formatZodErrorsDetailed } from '@/lib/schemas'
import { applyRateLimit } from '@/lib/rate-limit'
import * as Sentry from '@sentry/nextjs'

export async function POST(req: NextRequest) {
  // ── Rate-Limiting (5 Requests/Minute pro IP) ────────────────────────
  const rateLimitResponse = await applyRateLimit(req, 'checkout')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const rawBody = await req.json()

    // ── Zod-Validierung ──────────────────────────────────────────────
    const parsed = checkoutRequestSchema.safeParse(rawBody)
    if (!parsed.success) {
      const { message, fieldErrors } = formatZodErrorsDetailed(parsed.error)
      return NextResponse.json(
        { error: message, fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data
    const { email, tier, firmenname } = data

    const tierConfig = TIER_PRICES[tier]
    if (!tierConfig) {
      return NextResponse.json({ error: 'Ungültiges Paket.' }, { status: 400 })
    }

    // Sentry: Checkout-Kontext setzen
    Sentry.setTag('flow', 'checkout')
    Sentry.setTag('tier', tier)

    // Save order to Supabase
    const supabase = createSupabaseServiceClient()
    const { data: order, error: dbError } = await supabase
      .from('orders')
      .insert({
        email,
        company_name: firmenname,
        tier,
        questionnaire: data,
        payment_status: 'pending',
      })
      .select('id')
      .single()

    if (dbError || !order) {
      throw new Error('Bestellung konnte nicht gespeichert werden.')
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? `https://${req.headers.get('host')}`

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: tierConfig.name,
              description: `KI-Nutzungsrichtlinie für ${firmenname} — ${tier.charAt(0).toUpperCase() + tier.slice(1)}-Paket`,
            },
            unit_amount: tierConfig.amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        order_id: order.id,
        tier,
        company_name: firmenname,
      },
      success_url: `${baseUrl}/ergebnis/${order.id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/fragebogen?tier=${tier}`,
      locale: 'de',
      billing_address_collection: 'auto',
      tax_id_collection: { enabled: true },
    })

    // Update order with stripe session ID
    await supabase
      .from('orders')
      .update({ stripe_session: session.id })
      .eq('id', order.id)

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
    Sentry.captureException(err, {
      tags: { flow: 'checkout', step: 'create-session' },
    })
    return NextResponse.json({ error: `Generierung fehlgeschlagen, bitte Support kontaktieren. (${message})` }, { status: 500 })
  }
}
