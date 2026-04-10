import Link from 'next/link'
import { TIER_LIST } from '@/config/pricing'

const legal = [
  { icon: '⚖️', title: 'Juristisch geprüft', desc: 'Fachanwalt für IT-Recht und Datenschutzrecht' },
  { icon: '🔒', title: 'Keine Abofalle', desc: 'Einmalige Zahlung — kein wiederkehrendes Abo' },
  { icon: '📄', title: 'Sofort verfügbar', desc: 'Download nach Zahlungseingang, auch per E-Mail' },
  { icon: '🔄', title: 'Geld-zurück', desc: '14-tägiges Widerrufsrecht gemäß Verbraucherrecht' },
]

export default function PreisePage() {
  return (
    <main className="min-h-screen bg-cream">
      {/* Nav */}
      <nav className="bg-white border-b border-navy/8 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-sm bg-navy flex items-center justify-center">
              <span className="text-gold text-xs font-mono font-medium">KI</span>
            </div>
            <span className="font-display text-lg font-semibold text-navy">KI-Kompass</span>
          </Link>
          <Link href="/fragebogen" className="bg-navy text-cream font-body text-sm font-medium px-5 py-2.5 rounded-sm hover:bg-navy-light transition-colors">
            Richtlinie erstellen →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-16 px-6 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-gold font-body font-medium mb-3">Preise</p>
        <h1 className="font-display text-5xl md:text-6xl font-light text-navy mb-4 leading-tight">
          Einmalzahlung.
          <br />
          <em className="italic">Kein Abo.</em>
        </h1>
        <p className="font-body text-sm text-navy/50 max-w-lg mx-auto leading-relaxed">
          Sie zahlen einmal und erhalten eine vollständige, sofort einsatzfähige KI-Nutzungsrichtlinie.
          Kein Abo, keine versteckten Kosten, keine Verlängerung.
        </p>
      </section>

      {/* Tiers */}
      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {TIER_LIST.map((tier) => (
              <div
                key={tier.id}
                className={`rounded-sm border relative ${
                  tier.highlight
                    ? 'bg-navy border-navy shadow-2xl md:-mt-4 md:-mb-4'
                    : 'bg-white border-navy/10'
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gold text-navy-dark text-xs font-body font-semibold px-4 py-1 rounded-full uppercase tracking-wider">
                      Empfohlen
                    </span>
                  </div>
                )}

                <div className="p-8">
                  <p className={`text-xs uppercase tracking-[0.2em] font-body font-medium mb-2 ${tier.highlight ? 'text-gold' : 'text-slate'}`}>
                    {tier.name}
                  </p>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className={`font-display text-5xl font-light ${tier.highlight ? 'text-cream' : 'text-navy'}`}>
                      €{tier.price}
                    </span>
                    <span className={`font-body text-sm ${tier.highlight ? 'text-cream/40' : 'text-slate'}`}>
                      {tier.period}
                    </span>
                  </div>
                  <p className={`font-body text-xs leading-relaxed mb-8 ${tier.highlight ? 'text-cream/60' : 'text-navy/50'}`}>
                    {tier.description}
                  </p>

                  <ul className="space-y-3 mb-8">
                    {tier.pricingFeatures.filter(f => f.text).map((f, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          f.included
                            ? tier.highlight ? 'bg-gold/20' : 'bg-emerald-100'
                            : 'bg-gray-100'
                        }`}>
                          {f.included ? (
                            <svg className={`w-2.5 h-2.5 ${tier.highlight ? 'text-gold' : 'text-emerald-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-2.5 h-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </div>
                        <span className={`font-body text-sm ${
                          f.included
                            ? tier.highlight ? 'text-cream/80' : 'text-navy/70'
                            : tier.highlight ? 'text-cream/30' : 'text-navy/30'
                        }`}>
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={tier.href}
                    className={`block w-full text-center py-3.5 px-6 rounded-sm font-body font-medium text-sm tracking-wide transition-all duration-200 ${
                      tier.highlight
                        ? 'bg-gold text-navy-dark hover:bg-gold-light'
                        : 'bg-navy text-cream hover:bg-navy-light'
                    }`}
                  >
                    {tier.pricingCta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legal trust */}
      <section className="py-16 px-6 border-t border-navy/8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {legal.map((item, i) => (
              <div key={i}>
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-display text-base font-semibold text-navy mb-1">{item.title}</h3>
                <p className="font-body text-xs text-navy/50 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ snippet */}
      <section className="py-16 px-6 bg-cream">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl font-light text-navy mb-4">
            Noch Fragen?
          </h2>
          <p className="font-body text-sm text-navy/50 mb-8 leading-relaxed">
            Alle Pakete enthalten eine sofort einsatzfähige, juristisch geprüfte KI-Nutzungsrichtlinie —
            maßgeschneidert auf Ihr Unternehmen. Keine generischen Templates.
          </p>
          <Link href="/" className="font-body text-sm text-navy underline underline-offset-4 hover:text-navy-light transition-colors">
            Zurück zur Startseite mit FAQ →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-dark py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-display text-sm font-medium text-cream/40">KI-Kompass</span>
          <p className="font-body text-xs text-cream/30">© 2026 · Alle Preise inkl. MwSt. · DSGVO-konform</p>
          <div className="flex gap-6">
            <a href="#" className="font-body text-xs text-cream/30 hover:text-cream/60 transition-colors">Impressum</a>
            <a href="#" className="font-body text-xs text-cream/30 hover:text-cream/60 transition-colors">Datenschutz</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
