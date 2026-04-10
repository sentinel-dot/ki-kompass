import { TIER_LIST } from '@/config/pricing'

const chapters = [
  'Präambel & Zweck',
  'Definitionen (EU AI Act, DSGVO)',
  'Erlaubte & verbotene Nutzung',
  'Freigegebene Tools & Zugangsregeln',
  'Datenschutz & Datenklassifikation',
  'Qualitätssicherung & menschl. Kontrolle',
  'Geistiges Eigentum & Urheberrecht',
  'Transparenz & Kennzeichnung',
  'Verantwortlichkeiten & Governance',
  'Schulung & Awareness (Art. 4 EU AI Act)',
  'Verstöße & Konsequenzen',
  'Überprüfung & Aktualisierung',
]

export function WhatYouGet() {
  return (
    <section className="py-24 px-6 bg-cream diagonal-lines">
      <div className="max-w-6xl mx-auto">
        {/* Chapter list */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.25em] text-gold font-body font-medium mb-3">
              Inhalt der Policy
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-light text-navy">
              12 Kapitel. Vollständig.
              <br />
              <em className="italic">Sofort einsatzfähig.</em>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-3 max-w-3xl mx-auto">
            {chapters.map((ch, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 bg-white/80 rounded-sm border border-navy/6 group hover:border-gold/30 transition-colors"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-mono font-medium"
                  style={{ background: 'rgba(201,168,76,0.12)', color: '#C9A84C' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                <span className="font-body text-sm text-navy/80 font-medium">{ch}</span>
                <div className="ml-auto">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing tiers */}
        <div>
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.25em] text-gold font-body font-medium mb-3">
              Preise
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-light text-navy">
              Einmalzahlung.
              <br />
              <em className="italic">Kein Abo.</em>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TIER_LIST.map((tier, i) => (
              <div
                key={tier.id}
                className={`relative p-8 rounded-sm transition-all duration-300 ${
                  tier.highlight
                    ? 'bg-navy text-cream shadow-2xl scale-105'
                    : 'bg-white border border-navy/10 hover:border-gold/30'
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gold text-navy-dark text-xs font-body font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                      Empfohlen
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <p className={`text-xs uppercase tracking-[0.2em] font-body font-medium mb-2 ${tier.highlight ? 'text-gold' : 'text-slate'}`}>
                    {tier.name}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className={`font-display text-5xl font-light ${tier.highlight ? 'text-cream' : 'text-navy'}`}>
                      €{tier.price}
                    </span>
                    <span className={`font-body text-sm ${tier.highlight ? 'text-cream/50' : 'text-slate'}`}>
                      {tier.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.landingFeatures.map((f, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${tier.highlight ? 'bg-gold/20' : 'bg-emerald-100'}`}>
                        <svg className={`w-2.5 h-2.5 ${tier.highlight ? 'text-gold' : 'text-emerald-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className={`font-body text-sm ${tier.highlight ? 'text-cream/80' : 'text-navy/70'}`}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <a
                  href={tier.href}
                  className={`block w-full text-center py-3 px-6 rounded-sm font-body font-medium text-sm tracking-wide transition-all duration-200 ${
                    tier.highlight
                      ? 'bg-gold text-navy-dark hover:bg-gold-light'
                      : 'bg-navy text-cream hover:bg-navy-light'
                  }`}
                >
                  {tier.landingCta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
