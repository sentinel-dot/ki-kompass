import { NextRequest, NextResponse } from 'next/server'
import { stripe, TIER_PRICES } from '@/lib/stripe'
import { createSupabaseServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const { email, tier, firmenname, ...questionnaire } = data

    if (!email || !tier || !firmenname) {
      return NextResponse.json({ error: 'E-Mail, Paket und Firmenname sind erforderlich.' }, { status: 400 })
    }

    const tierConfig = TIER_PRICES[tier as string]
    if (!tierConfig) {
      return NextResponse.json({ error: 'Ungültiges Paket.' }, { status: 400 })
    }

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
    return NextResponse.json({ error: `Generierung fehlgeschlagen, bitte Support kontaktieren. (${message})` }, { status: 500 })
  }
}
