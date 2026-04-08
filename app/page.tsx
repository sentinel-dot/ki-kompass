import Link from 'next/link'
import { CountdownTimer } from '@/components/landing/CountdownTimer'
import { TrustBar } from '@/components/landing/TrustBar'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { WhatYouGet } from '@/components/landing/WhatYouGet'
import { FAQ } from '@/components/landing/FAQ'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-cream/80 backdrop-blur-md border-b border-navy/8">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-sm bg-navy flex items-center justify-center">
              <span className="text-gold text-xs font-mono font-medium">KI</span>
            </div>
            <span className="font-display text-lg font-semibold text-navy tracking-tight">
              KI-Kompass
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#wie-es-funktioniert" className="font-body text-sm text-navy/60 hover:text-navy transition-colors">
              So funktionierts
            </a>
            <a href="#preise" className="font-body text-sm text-navy/60 hover:text-navy transition-colors">
              Preise
            </a>
            <Link
              href="/fragebogen"
              className="bg-navy text-cream font-body text-sm font-medium px-5 py-2.5 rounded-sm hover:bg-navy-light transition-colors"
            >
              Richtlinie erstellen →
            </Link>
          </div>
          {/* Mobile CTA */}
          <Link
            href="/fragebogen"
            className="md:hidden bg-navy text-cream font-body text-sm font-medium px-4 py-2 rounded-sm"
          >
            Starten →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="relative pt-32 pb-20 px-6 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #111D33 0%, #1B2A4A 60%, #1e3060 100%)' }}
      >
        {/* Background geometric grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(201,168,76,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(201,168,76,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        {/* Radial glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, #C9A84C 0%, transparent 70%)' }}
        />

        <div className="relative max-w-5xl mx-auto">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/30 mb-8 animate-fade-up stagger-1"
            style={{ background: 'rgba(201,168,76,0.08)' }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            <span className="font-body text-xs text-gold/80 tracking-wider uppercase font-medium">
              EU AI Act — Deadline: 2. August 2026
            </span>
          </div>

          {/* Headline */}
          <h1
            className="font-display font-light leading-[1.05] mb-6 animate-fade-up stagger-2"
            style={{ fontSize: 'clamp(2.5rem, 7vw, 5.5rem)', color: '#F7F4EF' }}
          >
            Die KI-Richtlinie für
            <br />
            <span className="shimmer-text italic">Ihr Unternehmen</span>
            <br />
            <span style={{ color: 'rgba(247,244,239,0.7)' }}>in 10 Minuten.</span>
          </h1>

          <p className="font-body text-base md:text-lg text-cream/60 max-w-xl mb-10 leading-relaxed animate-fade-up stagger-3">
            Maßgeschneidert. DSGVO-konform. EU AI Act-ready. Juristisch geprüft.
            Für KMUs im DACH-Raum — ohne Anwalt, ohne Wochenprojekt.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 mb-16 animate-fade-up stagger-4">
            <Link
              href="/fragebogen"
              className="inline-flex items-center gap-2 bg-gold text-navy-dark font-body font-semibold px-8 py-4 rounded-sm hover:bg-gold-light transition-all duration-200 text-sm tracking-wide animate-pulse-gold"
            >
              Jetzt Richtlinie erstellen
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/preise"
              className="inline-flex items-center gap-2 border border-cream/20 text-cream/80 font-body font-medium px-8 py-4 rounded-sm hover:border-cream/40 hover:text-cream transition-all duration-200 text-sm"
            >
              Preise ansehen
            </Link>
          </div>

          {/* Countdown */}
          <div className="animate-fade-up stagger-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/30" />
              <p className="font-body text-xs uppercase tracking-[0.2em] text-gold/60 font-medium">
                Bis zur EU AI Act High-Risk Deadline
              </p>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/30" />
            </div>
            <CountdownTimer />
            <p className="mt-4 font-body text-xs text-cream/30 text-center">
              Art. 4 + Art. 5 EU AI Act gelten bereits seit 2. Februar 2025
            </p>
          </div>
        </div>

        {/* Bottom fade */}
        <div
          className="absolute bottom-0 inset-x-0 h-24 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #F7F4EF)' }}
        />
      </section>

      {/* Trust Bar */}
      <TrustBar />

      {/* How It Works */}
      <div id="wie-es-funktioniert">
        <HowItWorks />
      </div>

      {/* What You Get + Pricing */}
      <div id="preise">
        <WhatYouGet />
      </div>

      {/* Social Proof */}
      <section className="py-20 px-6 bg-white border-y border-navy/6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.25em] text-gold font-body font-medium mb-3">
              Rechtliche Absicherung
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-light text-navy">
              Nicht ein generisches Template.
              <br />
              <em className="italic">Eine geprüfte Richtlinie.</em>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '⚖️',
                title: 'Juristisch geprüft',
                desc: 'Von einem Fachanwalt für IT-Recht und Datenschutzrecht geprüft. Alle DSGVO- und EU AI Act-Referenzen verifiziert.',
              },
              {
                icon: '🎯',
                title: 'Maßgeschneidert',
                desc: '13 gezielte Fragen. Branchenspezifische Regeln, passende Governance-Struktur, korrekte Risikoeinschätzung.',
              },
              {
                icon: '🔄',
                title: 'Sofort einsatzfähig',
                desc: 'Kein "[hier einfügen]". Ihre Firmendaten sind eingebaut. Unterschreiben und einführen — fertig.',
              },
            ].map((item, i) => (
              <div key={i} className="text-center p-8">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-display text-xl font-semibold text-navy mb-3">{item.title}</h3>
                <p className="font-body text-sm text-navy/60 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQ />

      {/* Final CTA */}
      <section
        className="py-24 px-6 text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #111D33 0%, #1B2A4A 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-5 diagonal-lines"
        />
        <div className="relative max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-[0.25em] text-gold font-body font-medium mb-4">
            Jetzt starten
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-light text-cream mb-6 leading-tight">
            Sind Sie compliant
            <br />
            <em className="italic">zum 2. August 2026?</em>
          </h2>
          <p className="font-body text-sm text-cream/50 mb-10 leading-relaxed">
            Unternehmen ohne KI-Richtlinie und Schulungsprogramm verstoßen bereits jetzt gegen
            Art. 4 des EU AI Act. Die Bußgelder: bis zu 35 Mio. EUR oder 7% des Jahresumsatzes.
          </p>
          <Link
            href="/fragebogen"
            className="inline-flex items-center gap-2 bg-gold text-navy-dark font-body font-semibold px-10 py-4 rounded-sm hover:bg-gold-light transition-all duration-200 text-sm tracking-wide"
          >
            Richtlinie jetzt erstellen — ab €79
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-dark py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-sm bg-navy-light flex items-center justify-center">
              <span className="text-gold text-xs font-mono font-medium">KI</span>
            </div>
            <span className="font-display text-sm font-medium text-cream/60">KI-Kompass</span>
          </div>
          <p className="font-body text-xs text-cream/30 text-center">
            © 2026 KI-Kompass · Kein Abo · Einmalzahlung · DSGVO-konform
          </p>
          <div className="flex gap-6">
            <a href="#" className="font-body text-xs text-cream/30 hover:text-cream/60 transition-colors">Impressum</a>
            <a href="#" className="font-body text-xs text-cream/30 hover:text-cream/60 transition-colors">Datenschutz</a>
            <a href="#" className="font-body text-xs text-cream/30 hover:text-cream/60 transition-colors">AGB</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
