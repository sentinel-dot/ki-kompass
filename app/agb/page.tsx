import Link from 'next/link'

export const metadata = {
  title: 'AGB — KI-Kompass',
}

export default function AGBPage() {
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
          <h1 className="font-display text-4xl font-light text-navy mb-2">
            Allgemeine Geschäftsbedingungen
          </h1>
          <p className="font-body text-xs text-navy/40 mb-12">Stand: April 2026</p>

          <div className="space-y-10 font-body text-sm text-navy/70 leading-relaxed">

            <div>
              <h2 className="font-body font-semibold text-navy text-base mb-3">§ 1 Geltungsbereich</h2>
              <p>
                Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge zwischen [Firmenname],
                [Adresse] (nachfolgend „Anbieter") und den Nutzern des Dienstes KI-Kompass (nachfolgend
                „Kunde") über die Website ki-kompass.de.
              </p>
            </div>

            <div>
              <h2 className="font-body font-semibold text-navy text-base mb-3">§ 2 Leistungsbeschreibung</h2>
              <p className="mb-3">
                Der Anbieter erstellt auf Basis eines Fragebogens (13 Fragen) eine individualisierte
                KI-Nutzungsrichtlinie für Unternehmen. Die Richtlinie wird mittels künstlicher Intelligenz
                (Claude API, Anthropic) generiert und als PDF- und DOCX-Datei per E-Mail zugestellt
                sowie zum Download bereitgestellt.
              </p>
              <p>
                Es werden zwei Pakete angeboten:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>Basis (€79):</strong> KI-Nutzungsrichtlinie (12 Kapitel) als PDF + DOCX</li>
                <li><strong>Professional (€149):</strong> Basis + EU AI Act Compliance-Checkliste + Mitarbeiter-Schulungsvorlage</li>
              </ul>
            </div>

            <div>
              <h2 className="font-body font-semibold text-navy text-base mb-3">§ 3 Vertragsschluss</h2>
              <p>
                Der Vertrag kommt durch Ausfüllen des Fragebogens, Auswahl eines Pakets und abgeschlossene
                Zahlung über Stripe Checkout zustande. Mit Abschluss der Zahlung bestätigt der Kunde die
                Geltung dieser AGB.
              </p>
            </div>

            <div>
              <h2 className="font-body font-semibold text-navy text-base mb-3">§ 4 Preise und Zahlung</h2>
              <p>
                Alle Preise sind Einmalzahlungen und verstehen sich inklusive der gesetzlichen Mehrwertsteuer.
                Die Zahlung erfolgt über den Zahlungsdienstleister Stripe. Nach erfolgreicher Zahlung wird die
                Richtlinie innerhalb weniger Minuten generiert und per E-Mail zugestellt.
              </p>
            </div>

            <div>
              <h2 className="font-body font-semibold text-navy text-base mb-3">§ 5 Widerrufsrecht</h2>
              <p className="mb-3">
                Verbraucher (natürliche Personen, die zu einem Zweck handeln, der überwiegend weder ihrer
                gewerblichen noch ihrer selbständigen beruflichen Tätigkeit zugerechnet werden kann) haben
                ein Widerrufsrecht gemäß den gesetzlichen Bestimmungen.
              </p>
              <p className="mb-3">
                <strong>Widerrufsbelehrung:</strong> Sie haben das Recht, binnen vierzehn Tagen ohne Angabe
                von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem
                Tag des Vertragsschlusses.
              </p>
              <p className="mb-3">
                <strong>Erlöschen des Widerrufsrechts:</strong> Das Widerrufsrecht erlischt bei
                Dienstleistungsverträgen, wenn der Unternehmer die Dienstleistung vollständig erbracht hat
                und mit der Ausführung der Dienstleistung erst begonnen hat, nachdem der Verbraucher dazu
                seine ausdrückliche Zustimmung gegeben und gleichzeitig seine Kenntnis davon bestätigt hat,
                dass er sein Widerrufsrecht bei vollständiger Vertragserfüllung durch den Unternehmer
                verliert (§ 356 Abs. 4 BGB).
              </p>
              <p>
                Mit dem Absenden des Fragebogens und Bestätigung der Zahlung stimmt der Kunde ausdrücklich
                zu, dass die Dienstleistung sofort beginnt, und bestätigt seine Kenntnis über den Verlust
                des Widerrufsrechts nach vollständiger Leistungserbringung.
              </p>
              <p className="mt-3">
                Um das Widerrufsrecht auszuüben, wenden Sie sich per E-Mail an:{' '}
                <a href="mailto:[email@beispiel.de]" className="text-navy underline underline-offset-2">
                  [email@beispiel.de]
                </a>
              </p>
            </div>

            <div>
              <h2 className="font-body font-semibold text-navy text-base mb-3">§ 6 Haftungsausschluss</h2>
              <p className="mb-3">
                Die generierten Richtlinien stellen keine Rechtsberatung im Sinne des
                Rechtsdienstleistungsgesetzes (RDG) dar. Der Anbieter übernimmt keine Haftung für die
                rechtliche Vollständigkeit, Aktualität oder individuelle Eignung der generierten Dokumente.
              </p>
              <p>
                Der Kunde ist selbst dafür verantwortlich, die generierte Richtlinie auf ihre Eignung für
                den konkreten Einsatz zu prüfen. Für rechtlich verbindliche Dokumente empfehlen wir die
                Hinzuziehung eines Fachanwalts. Die Haftung des Anbieters beschränkt sich auf Vorsatz und
                grobe Fahrlässigkeit.
              </p>
            </div>

            <div>
              <h2 className="font-body font-semibold text-navy text-base mb-3">§ 7 Urheberrecht und Nutzungsrechte</h2>
              <p>
                Die generierten Dokumente werden dem Kunden zur unbeschränkten Nutzung für den eigenen
                Unternehmensbetrieb überlassen. Eine Weiterveräußerung oder gewerbliche Verwertung der
                Dokumente (z.B. Verkauf an Dritte) ist nicht gestattet.
              </p>
            </div>

            <div>
              <h2 className="font-body font-semibold text-navy text-base mb-3">§ 8 Datenschutz</h2>
              <p>
                Die Verarbeitung personenbezogener Daten erfolgt gemäß unserer{' '}
                <Link href="/datenschutz" className="text-navy underline underline-offset-2">
                  Datenschutzerklärung
                </Link>.
              </p>
            </div>

            <div>
              <h2 className="font-body font-semibold text-navy text-base mb-3">§ 9 Anwendbares Recht und Gerichtsstand</h2>
              <p>
                Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
                Gerichtsstand für alle Streitigkeiten aus diesem Vertragsverhältnis ist — soweit gesetzlich
                zulässig — [Ort des Anbieters].
              </p>
            </div>

            <div>
              <h2 className="font-body font-semibold text-navy text-base mb-3">§ 10 Schlussbestimmungen</h2>
              <p>
                Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, berührt dies die
                Wirksamkeit der übrigen Bestimmungen nicht. Der Anbieter behält sich das Recht vor, diese
                AGB mit Wirkung für die Zukunft zu ändern.
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
