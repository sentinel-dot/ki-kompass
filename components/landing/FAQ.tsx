'use client'

import { useState } from 'react'
import { TIERS, formatPrice } from '@/config/pricing'

const faqs = [
  {
    q: 'Ist die Richtlinie wirklich juristisch geprüft?',
    a: 'Ja. Die Vorlage und der Generierungsprozess wurden von einem Fachanwalt für IT-Recht und Datenschutzrecht geprüft. Die Richtlinie referenziert ausschließlich verifizierte DSGVO- und EU AI Act-Artikel. Für individuelle Rechtsberatung empfehlen wir dennoch einen Fachanwalt hinzuzuziehen.',
  },
  {
    q: 'Welche Unternehmen profitieren am meisten?',
    a: 'KMUs im DACH-Raum (10–500 Mitarbeiter), die noch keine formale KI-Richtlinie haben oder ihre bestehende auf den aktuellen Stand (EU AI Act) bringen möchten. Branchen wie Gesundheitswesen, Finanzen und IT profitieren besonders durch branchenspezifische Regeln.',
  },
  {
    q: 'Wann gilt der EU AI Act für mein Unternehmen?',
    a: 'Art. 4 (AI Literacy / KI-Schulungspflicht) und Art. 5 (verbotene KI-Praktiken) gelten bereits seit dem 2. Februar 2025. Die Hauptpflichten für Hochrisiko-KI-Systeme greifen ab dem 2. August 2026. Unternehmen ohne Schulungsprogramm sind jetzt schon nicht compliant.',
  },
  {
    q: 'Was ist Shadow AI und warum ist das ein Problem?',
    a: 'Shadow AI bezeichnet die unkontrollierte, nicht autorisierte Nutzung von KI-Tools durch Mitarbeiter — z.B. ChatGPT im Browser ohne Unternehmensfreigabe. Das Risiko: Vertrauliche Daten landen auf externen Servern, ohne DSGVO-Konformität. Unsere Richtlinie adressiert dieses Problem direkt.',
  },
  {
    q: 'Kann ich die Richtlinie nach Erhalt noch anpassen?',
    a: 'Absolut. Sie erhalten die Richtlinie als DOCX (Word) und PDF. Das DOCX-Format erlaubt vollständige Bearbeitung — Sie können Inhalte ergänzen, das Logo einsetzen und das Datum anpassen. Die Struktur ist so aufgebaut, dass sie auch als lebendiges Dokument gepflegt werden kann.',
  },
  {
    q: 'Was passiert bei Gesetzesänderungen?',
    a: `Im Enterprise-Paket (${formatPrice('enterprise')}) erhalten Sie 12 Monate lang vierteljährliche Updates per E-Mail, wenn relevante Gesetzesänderungen (EU AI Act, DSGVO) Ihre Richtlinie betreffen. Im Basis- und Professional-Paket können Sie jederzeit eine neue Richtlinie zum aktuellen Preis erstellen.`,
  },
]

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.25em] text-gold font-body font-medium mb-3">
            Häufige Fragen
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-light text-navy">
            Fragen & Antworten
          </h2>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`border rounded-sm transition-all duration-200 ${
                open === i ? 'border-gold/40 bg-cream/50' : 'border-navy/8 hover:border-navy/20'
              }`}
            >
              <button
                className="w-full text-left px-6 py-5 flex items-start justify-between gap-4 group"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-body font-medium text-navy text-sm leading-snug">
                  {faq.q}
                </span>
                <div
                  className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-200 mt-0.5 ${
                    open === i ? 'border-gold bg-gold' : 'border-navy/20'
                  }`}
                >
                  <svg
                    className={`w-3 h-3 transition-transform duration-200 ${open === i ? 'rotate-45 text-navy' : 'text-navy/40'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  open === i ? 'max-h-48 pb-5' : 'max-h-0'
                }`}
              >
                <p className="px-6 font-body text-sm text-navy/60 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
