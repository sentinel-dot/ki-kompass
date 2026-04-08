'use client'

import { QuestionnaireData } from './types'
import { TextInput, Select, RadioGroup, CheckboxGroup } from './FormField'

interface Props {
  data: QuestionnaireData
  onChange: (updates: Partial<QuestionnaireData>) => void
}

const BRANCHEN = [
  { value: 'logistik', label: 'Logistik & Transport' },
  { value: 'gesundheit', label: 'Gesundheitswesen & Pharma' },
  { value: 'finanzen', label: 'Finanzdienstleistungen & Versicherungen' },
  { value: 'handel', label: 'Handel & E-Commerce' },
  { value: 'it', label: 'IT & Software' },
  { value: 'fertigung', label: 'Fertigung & Industrie' },
  { value: 'beratung', label: 'Beratung & Dienstleistungen' },
  { value: 'bildung', label: 'Bildung & Forschung' },
  { value: 'oeffentlich', label: 'Öffentlicher Sektor' },
  { value: 'gastronomie', label: 'Gastronomie & Hotellerie' },
  { value: 'bau', label: 'Bau & Handwerk' },
  { value: 'sonstige', label: 'Sonstige' },
]

const MITARBEITER = [
  { value: '1-10', label: '1–10 Mitarbeiter' },
  { value: '11-50', label: '11–50 Mitarbeiter' },
  { value: '51-250', label: '51–250 Mitarbeiter' },
  { value: '251-500', label: '251–500 Mitarbeiter' },
  { value: '500+', label: 'Mehr als 500 Mitarbeiter' },
]

const LAENDER = [
  { value: 'deutschland', label: 'Deutschland' },
  { value: 'oesterreich', label: 'Österreich' },
  { value: 'schweiz', label: 'Schweiz' },
  { value: 'eu_andere', label: 'EU (weitere Länder)' },
  { value: 'nicht_eu', label: 'Nicht-EU-Länder' },
]

export function Block1({ data, onChange }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl md:text-3xl font-light text-navy mb-1">
          Unternehmensprofil
        </h2>
        <p className="font-body text-sm text-navy/50">
          Diese Angaben bilden die Grundlage Ihrer maßgeschneiderten Richtlinie.
        </p>
      </div>

      <TextInput
        label="F1 — Firmenname"
        value={data.firmenname}
        onChange={v => onChange({ firmenname: v })}
        placeholder="Mustermann GmbH"
        hint="Wird in der gesamten Richtlinie verwendet."
        required
      />

      <div className="space-y-3">
        <Select
          label="F2 — Branche"
          value={data.branche}
          onChange={v => onChange({ branche: v })}
          options={BRANCHEN}
          hint="Bestimmt branchenspezifische Regeln (z.B. Patientendaten, BaFin-Anforderungen)."
          required
        />
        {data.branche === 'sonstige' && (
          <TextInput
            label="Branche (Freitext)"
            value={data.branche_sonstige ?? ''}
            onChange={v => onChange({ branche_sonstige: v })}
            placeholder="Ihre Branche…"
          />
        )}
      </div>

      <RadioGroup
        label="F3 — Anzahl Mitarbeiter"
        value={data.mitarbeiter}
        onChange={v => onChange({ mitarbeiter: v })}
        options={MITARBEITER}
        hint="Bestimmt die Governance-Struktur (einfache Regeln vs. KI-Komitee)."
        required
      />

      <CheckboxGroup
        label="F4 — In welchen Ländern ist Ihr Unternehmen tätig?"
        value={data.laender}
        onChange={v => onChange({ laender: v })}
        options={LAENDER}
        hint="Bestimmt DSGVO-Umfang und EU AI Act-Anwendbarkeit. Hinweis: Die Schweiz ist kein EU-Mitglied."
        required
      />
    </div>
  )
}
