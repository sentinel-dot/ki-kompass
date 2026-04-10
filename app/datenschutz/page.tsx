import Link from 'next/link'

export const metadata = {
  title: 'Datenschutzerklärung — KI-Kompass',
}

export default function DatenschutzPage() {
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
          <h1 className="font-display text-4xl font-light text-navy mb-2">Datenschutzerklärung</h1>
          <p className="font-body text-xs text-navy/40 mb-12">Stand: April 2026</p>

          <div className="space-y-10 font-body text-sm text-navy/70 leading-relaxed">

            <div>
              <h2 className="font-body font-semibold text-navy text-base mb-3">1. Verantwortlicher</h2>
              <p>
                Verantwortlicher im Sinne der DSGVO ist:<br /><br />
                [Vorname Nachname / Firmenname]<br />
                [Straße und Hausnummer]<br />
                [PLZ Ort]<br />
                E-Mail: <a href="mailto:[email@beispiel.de]" className="text-navy underline underline-offset-2">[email@beispiel.de]</a>
              </p>
            </div>

            <div>
              <h2 className="font-body font-semibold text-navy text-base mb-3">2. Erhobene Daten und Verarbeitungszwecke</h2>
              <p className="mb-4">
                Wir verarbeiten personenbezogene Daten nur im Rahmen der Erbringung unserer Dienstleistung
                (Generierung einer KI-Nutzungsrichtlinie) und im Einklang mit den Grundsätzen der DSGVO
                (Art. 5 DSGVO).
              </p>

              <h3 className="font-body font-semibold text-navy mb-2">2.1 Bestelldaten</h3>
              <p className="mb-4">
                Bei einer Bestellung erheben wir folgende Daten: E-Mail-Adresse, Firmenname sowie die
                Angaben aus dem Fragebogen (Branche, Mitarbeiterzahl, KI-Nutzung u.a.). Rechtsgrundlage
                ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung). Die Daten werden für die Dauer der
                gesetzlichen Aufbewahrungsfristen gespeichert (i.d.R. 10 Jahre für steuerrelevante Daten).
              </p>

              <h3 className="font-body font-semibold text-navy mb-2">2.2 Technische Logdaten</h3>
              <p>
                Beim Aufruf der Website werden automatisch technische Informationen (IP-Adresse, Browsertyp,
                Datum und Uhrzeit) in Serverlogfiles gespeichert. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f
                DSGVO (berechtigtes Interesse an der Sicherheit des Dienstes). Löschung erfolgt nach 7 Tagen.
              </p>
            </div>

            <div>
              <h2 className="font-body font-semibold text-navy text-base mb-3">3. Auftragsverarbeiter</h2>
              <p className="mb-4">
                Wir setzen folgende Dienstleister als Auftragsverarbeiter gemäß Art. 28 DSGVO ein:
              </p>
              <ul className="list-disc list-inside space-y-3">
                <li>
                  <strong>Stripe, Inc.</strong> (San Francisco, USA) — Zahlungsabwicklung.
                  Datenübermittlung in die USA auf Basis von Standardvertragsklauseln (Art. 46 Abs. 2 lit. c
                  DSGVO). Datenschutzerklärung: stripe.com/de/privacy
                </li>
                <li>
                  <strong>Supabase, Inc.</strong> (San Francisco, USA) — Datenbankspeicherung und
                  Dateispeicherung (PDF/DOCX). Hosting in der EU (Frankfurt). Datenschutzerklärung:
                  supabase.com/privacy
                </li>
                <li>
                  <strong>Brevo SAS</strong> (Paris, Frankreich) — Transaktionale E-Mails
                  (Download-Links). Datenschutzerklärung: brevo.com/de/legal/privacypolicy/
                </li>
                <li>
                  <strong>Anthropic, PBC</strong> (San Francisco, USA) — KI-Generierung der Richtlinie
                  über die Claude API. Datenübermittlung in die USA auf Basis von Standardvertragsklauseln.
                  Datenschutzerklärung: anthropic.com/privacy
                </li>
                <li>
                  <strong>Vercel, Inc.</strong> (San Francisco, USA) — Hosting der Webanwendung.
                  Datenschutzerklärung: vercel.com/legal/privacy-policy
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-body font-semibold text-navy text-base mb-3">4. Ihre Rechte</h2>
              <p className="mb-3">
                Sie haben gegenüber uns folgende Rechte hinsichtlich Ihrer personenbezogenen Daten:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
                <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
                <li>Recht auf Löschung (Art. 17 DSGVO)</li>
                <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
                <li>Recht auf Widerspruch (Art. 21 DSGVO)</li>
              </ul>
              <p className="mt-3">
                Zur Ausübung Ihrer Rechte wenden Sie sich bitte an:{' '}
                <a href="mailto:[email@beispiel.de]" className="text-navy underline underline-offset-2">
                  [email@beispiel.de]
                </a>
              </p>
            </div>

            <div>
              <h2 className="font-body font-semibold text-navy text-base mb-3">5. Beschwerderecht</h2>
              <p>
                Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die Verarbeitung
                Ihrer personenbezogenen Daten zu beschweren. Die zuständige Aufsichtsbehörde ist die
                Datenschutzaufsichtsbehörde des Bundeslandes, in dem der Verantwortliche seinen Sitz hat.
              </p>
            </div>

            <div>
              <h2 className="font-body font-semibold text-navy text-base mb-3">6. Keine Cookies / Tracking</h2>
              <p>
                KI-Kompass verwendet keine Tracking-Cookies, keine Analytics-Dienste Dritter und kein
                Remarketing. Es werden ausschließlich technisch notwendige Session-Daten verarbeitet.
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
