import Link from 'next/link'

export const metadata = {
  title: 'Impressum — KI-Kompass',
}

export default function ImpressumPage() {
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

      {/* Content */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-[0.25em] text-gold font-body font-medium mb-3">Rechtliches</p>
          <h1 className="font-display text-4xl font-light text-navy mb-12">Impressum</h1>

          <div className="space-y-10 font-body text-sm text-navy/70 leading-relaxed">

            <div>
              <h2 className="font-body font-semibold text-navy text-base mb-3">Angaben gemäß § 5 DDG</h2>
              <p>
                [Vorname Nachname / Firmenname]<br />
                [Straße und Hausnummer]<br />
                [PLZ Ort]<br />
                Deutschland
              </p>
            </div>

            <div>
              <h2 className="font-body font-semibold text-navy text-base mb-3">Kontakt</h2>
              <p>
                E-Mail: <a href="mailto:[email@beispiel.de]" className="text-navy underline underline-offset-2">[email@beispiel.de]</a>
              </p>
            </div>

            <div>
              <h2 className="font-body font-semibold text-navy text-base mb-3">Umsatzsteuer-Identifikationsnummer</h2>
              <p>
                Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:<br />
                [DE xxxxxxxxx]
              </p>
            </div>

            <div>
              <h2 className="font-body font-semibold text-navy text-base mb-3">Verantwortlich für den Inhalt</h2>
              <p>
                [Vorname Nachname]<br />
                [Straße und Hausnummer]<br />
                [PLZ Ort]
              </p>
            </div>

            <div>
              <h2 className="font-body font-semibold text-navy text-base mb-3">Streitschlichtung</h2>
              <p>
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
                <a
                  href="https://ec.europa.eu/consumers/odr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-navy underline underline-offset-2"
                >
                  https://ec.europa.eu/consumers/odr/
                </a>
                <br /><br />
                Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
                Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-dark py-8 px-6 mt-16">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-display text-sm font-medium text-cream/40">KI-Kompass</span>
          <p className="font-body text-xs text-cream/30">© 2026 · DSGVO-konform</p>
          <div className="flex gap-6">
            <Link href="/impressum" className="font-body text-xs text-cream/30 hover:text-cream/60 transition-colors">Impressum</Link>
            <Link href="/datenschutz" className="font-body text-xs text-cream/30 hover:text-cream/60 transition-colors">Datenschutz</Link>
            <Link href="/agb" className="font-body text-xs text-cream/30 hover:text-cream/60 transition-colors">AGB</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
