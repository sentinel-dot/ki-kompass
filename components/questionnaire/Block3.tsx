'use client'

import { QuestionnaireData } from './types'
import { RadioGroup, CheckboxGroup } from './FormField'

interface Props {
  data: QuestionnaireData
  onChange: (updates: Partial<QuestionnaireData>) => void
}

const DATENARTEN = [
  { value: 'kundendaten', label: 'Kundendaten (Namen, Adressen, Kontaktdaten)' },
  { value: 'gesundheitsdaten', label: 'Gesundheitsdaten' },
  { value: 'finanzdaten', label: 'Finanzdaten (Gehälter, Kontonummern, Bilanzen)' },
  { value: 'personaldaten', label: 'Personaldaten (Bewerbungen, Leistungsbeurteilungen)' },
  { value: 'geschaeftsgeheimnisse', label: 'Geschäftsgeheimnisse / geistiges Eigentum' },
  { value: 'oeffentlich', label: 'Ausschließlich öffentlich verfügbare Daten' },
]

const DSB = [
  { value: 'intern', label: 'Ja — interner Datenschutzbeauftragter', desc: 'Ein Mitarbeiter ist offiziell als DSB bestellt.' },
  { value: 'extern', label: 'Ja — externer Datenschutzbeauftragter', desc: 'Ein externer Dienstleister übernimmt die DSB-Funktion.' },
  { value: 'nein', label: 'Nein', desc: 'Kein Datenschutzbeauftragter vorhanden.' },
]

const CLOUD_EU = [
  { value: 'ja', label: 'Ja', desc: 'Daten werden in Clouds außerhalb der EU gespeichert (z.B. AWS US, Azure US).' },
  { value: 'nein', label: 'Nein', desc: 'Alle Daten bleiben in EU-Rechenzentren.' },
  { value: 'teilweise', label: 'Teilweise', desc: 'Einige Systeme nutzen Drittland-Cloud-Dienste.' },
  { value: 'weiss_nicht', label: 'Weiß nicht', desc: 'Keine genaue Kenntnis der Speicherorte.' },
]

export function Block3({ data, onChange }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl md:text-3xl font-light text-navy mb-1">
          Daten & Datenschutz
        </h2>
        <p className="font-body text-sm text-navy/50">
          Welche sensiblen Daten verarbeiten Sie — und welche dürfen niemals in KI-Tools eingegeben werden?
        </p>
      </div>

      <CheckboxGroup
        label="F9 — Welche Art von sensiblen Daten verarbeiten Ihre Mitarbeiter regelmäßig?"
        value={data.datenarten}
        onChange={v => onChange({ datenarten: v })}
        options={DATENARTEN}
        hint="Bestimmt die Verbotsliste in Kapitel 5 und die Datenklassifikationsregeln."
        required
      />

      <RadioGroup
        label="F10 — Haben Sie einen Datenschutzbeauftragten (DSB)?"
        value={data.dsb}
        onChange={v => onChange({ dsb: v })}
        options={DSB}
        hint="Bestimmt die Verantwortlichkeiten und den Ansprechpartner in Kapitel 9."
        required
      />

      <div>
        <RadioGroup
          label="F11 — Werden Daten in Cloud-Diensten außerhalb der EU gespeichert?"
          value={data.cloud_ausserhalb_eu}
          onChange={v => onChange({ cloud_ausserhalb_eu: v })}
          options={CLOUD_EU}
          hint="Relevant für den DSGVO-Drittlandtransfer-Abschnitt (Art. 44–49 DSGVO). Betrifft z.B. US-basierte KI-Anbieter wie OpenAI, Google, Anthropic."
          required
        />
        {(data.cloud_ausserhalb_eu === 'ja' || data.cloud_ausserhalb_eu === 'teilweise') && (
          <div className="mt-3 p-4 rounded-sm border border-amber-200 bg-amber-50">
            <p className="font-body text-xs text-amber-800 leading-relaxed">
              <strong>Hinweis:</strong> Bei Drittlandtransfers (z.B. US-Anbieter) sind DSGVO Art. 44–49 relevant.
              US-Anbieter wie OpenAI und Google nutzen Standard-Vertragsklauseln (SCCs) als Rechtsgrundlage.
              Die Policy wird einen entsprechenden Abschnitt dazu enthalten.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
