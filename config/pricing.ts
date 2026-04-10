/**
 * Zentrale Pricing-Konfiguration — Single Source of Truth.
 *
 * Alle Preis-, Paket- und Feature-Daten werden hier definiert.
 * Jede Komponente, API-Route und E-Mail-Logik importiert aus dieser Datei.
 */

// ─── Typen ───────────────────────────────────────────────────────────

export type TierId = 'basis' | 'professional' | 'enterprise'

export interface TierFeature {
  text: string
  /** true = enthalten, false = nicht enthalten (wird als durchgestrichen dargestellt) */
  included: boolean
}

export interface TierConfig {
  id: TierId
  name: string
  /** Preis in Euro als Ganzzahl (z.B. 79) */
  price: number
  /** Preis in Cent für Stripe (z.B. 7900) */
  priceInCents: number
  /** Anzeige-Periode (z.B. "einmalig") */
  period: string
  /** Kurzbeschreibung für die Preisseite */
  description: string
  /** Ob dieses Tier visuell hervorgehoben wird ("Empfohlen"-Badge) */
  highlight: boolean
  /** Zusammenfassung der Features für die Landing Page (WhatYouGet) */
  landingFeatures: string[]
  /** Detaillierte Feature-Liste für die Preisseite (mit included/excluded) */
  pricingFeatures: TierFeature[]
  /** Kurzliste der Features für den Fragebogen (BlockFinal) */
  questionnaireFeatures: string[]
  /** Extras/Anhänge, die auf der Landing Page angezeigt werden */
  extras: string[]
  /** CTA-Text auf der Landing Page */
  landingCta: string
  /** CTA-Text auf der Preisseite */
  pricingCta: string
  /** Link-Ziel */
  href: string
  /** Stripe Product Name */
  stripeName: string
}

// ─── Konfiguration ───────────────────────────────────────────────────

export const TIERS: Record<TierId, TierConfig> = {
  basis: {
    id: 'basis',
    name: 'Basis',
    price: 79,
    priceInCents: 7900,
    period: 'einmalig',
    description:
      'Für Unternehmen, die eine sofort einsatzfähige, DSGVO-konforme KI-Richtlinie benötigen.',
    highlight: false,
    landingFeatures: [
      '12 Pflichtkapitel, maßgeschneidert',
      'DSGVO-konform (alle relevanten Artikel)',
      'Branchenspezifische Regeln',
      'PDF + DOCX Export',
      'Sofort einsatzfähig',
    ],
    pricingFeatures: [
      { text: '12 Pflichtkapitel, maßgeschneidert', included: true },
      { text: 'Firmenname + Branche eingebaut', included: true },
      { text: 'DSGVO-konform (Art. 5, 6, 22, 25, 33, 44–49)', included: true },
      { text: 'EU AI Act Art. 4 + Art. 5 (seit Feb 2025)', included: true },
      { text: 'Branchenspezifische Regeln', included: true },
      { text: 'PDF + DOCX Export', included: true },
      { text: 'EU AI Act Compliance-Checkliste', included: false },
      { text: 'Mitarbeiter-Schulungsvorlage', included: false },
      { text: 'Vierteljährliche Updates (12 Monate)', included: false },
    ],
    questionnaireFeatures: [
      '12-Kapitel KI-Nutzungsrichtlinie',
      'DSGVO-konform',
      'Branchenspezifische Regeln',
      'PDF + DOCX Export',
    ],
    extras: [],
    landingCta: 'Jetzt starten',
    pricingCta: 'Basis wählen',
    href: '/fragebogen?tier=basis',
    stripeName: 'KI-Kompass Basis',
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    price: 149,
    priceInCents: 14900,
    period: 'einmalig',
    description:
      'Für Unternehmen, die neben der Richtlinie auch Compliance-Werkzeuge für Mitarbeiter benötigen.',
    highlight: true,
    landingFeatures: [
      'Alles aus Basis',
      'EU AI Act Compliance-Checkliste',
      'Mitarbeiter-Schulungsvorlage',
      '5 goldene Regeln + Quiz',
      'Unterschriftenfeld',
    ],
    pricingFeatures: [
      { text: 'Alles aus Basis', included: true },
      { text: 'Anhang B: EU AI Act Compliance-Checkliste', included: true },
      { text: '10-Punkte-Checkliste mit Deadlines', included: true },
      { text: 'Anhang C: Mitarbeiter-Schulungsvorlage', included: true },
      { text: '"5 goldene Regeln für KI am Arbeitsplatz"', included: true },
      { text: '5-Fragen-Quiz zum Verständnis-Check', included: true },
      { text: 'Unterschriftenfeld zur Kenntnisnahme', included: true },
      { text: 'Vierteljährliche Updates (12 Monate)', included: false },
      { text: 'Prioritäts-Support', included: false },
    ],
    questionnaireFeatures: [
      'Alles aus Basis',
      '+ EU AI Act Compliance-Checkliste',
      '+ Mitarbeiter-Schulungsvorlage',
      '+ Quiz & Unterschriftenfeld',
    ],
    extras: ['Anhang B: EU AI Act Checkliste', 'Anhang C: Schulungsvorlage'],
    landingCta: 'Empfohlen wählen',
    pricingCta: 'Professional wählen',
    href: '/fragebogen?tier=professional',
    stripeName: 'KI-Kompass Professional',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    priceInCents: 29900,
    period: 'einmalig',
    description:
      'Für Unternehmen, die langfristige Compliance sicherstellen und bei Gesetzesänderungen informiert bleiben möchten.',
    highlight: false,
    landingFeatures: [
      'Alles aus Professional',
      'Vierteljährliche Updates (12 Monate)',
      'E-Mail-Benachrichtigung bei Gesetzesänderungen',
      'Prioritäts-Support',
    ],
    pricingFeatures: [
      { text: 'Alles aus Professional', included: true },
      { text: 'Vierteljährliche Updates (12 Monate)', included: true },
      { text: 'E-Mail-Benachrichtigung bei Gesetzesänderungen', included: true },
      { text: 'EU AI Act + DSGVO Monitoring', included: true },
      { text: 'Prioritäts-Support', included: true },
      { text: 'Dedizierter Ansprechpartner', included: true },
      { text: 'Rabatt für weitere Dokumente', included: true },
    ],
    questionnaireFeatures: [
      'Alles aus Professional',
      '+ Vierteljährliche Updates (12 Monate)',
      '+ E-Mail bei Gesetzesänderungen',
      '+ Prioritäts-Support',
    ],
    extras: [],
    landingCta: 'Enterprise wählen',
    pricingCta: 'Enterprise wählen',
    href: '/fragebogen?tier=enterprise',
    stripeName: 'KI-Kompass Enterprise',
  },
}

// ─── Hilfsfunktionen ─────────────────────────────────────────────────

/** Sortierte Liste aller Tiers (Basis → Professional → Enterprise) */
export const TIER_LIST: TierConfig[] = [
  TIERS.basis,
  TIERS.professional,
  TIERS.enterprise,
]

/** Alle gültigen Tier-IDs */
export const TIER_IDS: TierId[] = ['basis', 'professional', 'enterprise']

/** Preis als formatierter String: "€79" */
export function formatPrice(tierId: TierId): string {
  return `€${TIERS[tierId].price}`
}

/** Label für E-Mails/Receipts: "Professional (€149)" */
export function tierLabel(tierId: TierId): string {
  const tier = TIERS[tierId]
  return `${tier.name} (€${tier.price})`
}

/** Stripe-kompatibles Pricing-Objekt */
export function getStripePricing(tierId: TierId) {
  const tier = TIERS[tierId]
  return {
    priceId: process.env[`STRIPE_PRICE_${tierId.toUpperCase()}`] ?? '',
    amount: tier.priceInCents,
    name: tier.stripeName,
  }
}
