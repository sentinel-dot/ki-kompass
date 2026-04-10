import Stripe from 'stripe'
import { TIER_IDS, getStripePricing, type TierId } from '@/config/pricing'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY ist nicht gesetzt.')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-03-25.dahlia',
    })
  }
  return _stripe
}

// Keep named export for convenience
export const stripe = {
  checkout: { sessions: { create: (...args: Parameters<Stripe['checkout']['sessions']['create']>) => getStripe().checkout.sessions.create(...args) } },
  webhooks: { constructEvent: (...args: Parameters<Stripe['webhooks']['constructEvent']>) => getStripe().webhooks.constructEvent(...args) },
}

/** Stripe-Pricing abgeleitet aus der zentralen Pricing-Config */
export const TIER_PRICES: Record<string, { priceId: string; amount: number; name: string }> =
  Object.fromEntries(
    TIER_IDS.map(id => [id, getStripePricing(id)])
  )
