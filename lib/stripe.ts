import Stripe from 'stripe'

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

export const TIER_PRICES: Record<string, { priceId: string; amount: number; name: string }> = {
  basis: {
    priceId: process.env.STRIPE_PRICE_BASIS ?? '',
    amount: 7900,
    name: 'KI-Kompass Basis',
  },
  professional: {
    priceId: process.env.STRIPE_PRICE_PROFESSIONAL ?? '',
    amount: 14900,
    name: 'KI-Kompass Professional',
  },
  enterprise: {
    priceId: process.env.STRIPE_PRICE_ENTERPRISE ?? '',
    amount: 29900,
    name: 'KI-Kompass Enterprise',
  },
}
