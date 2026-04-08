'use client'

import { QuestionnaireData } from './types'
import { RadioGroup } from './FormField'

interface Props {
  data: QuestionnaireData
  onChange: (updates: Partial<QuestionnaireData>) => void
}

const STRIKTHEIT = [
  {
    value: 'innovationsfreundlich',
    label: 'Innovationsfreundlich',
    desc: 'Wir möchten KI-Nutzung ermöglichen und fördern, mit klaren Leitplanken. Ton: ermutigend, positiv, Chancen betonen.',
  },
  {
    value: 'ausgewogen',
    label: 'Ausgewogen',
    desc: 'Produktivitätsgewinn und Risikominimierung im Gleichgewicht. Ton: sachlich, neutral, Chancen und Risiken nennen.',
  },
  {
    value: 'restriktiv',
    label: 'Restriktiv',
    desc: 'Sicherheit und Compliance haben oberste Priorität. Nur freigegebene Tools und Use Cases. Ton: formell, pflichtbetont.',
  },
]

const VERANTWORTUNG = [
  { value: 'geschaeftsfuehrung', label: 'Geschäftsführung', desc: 'Die GF trägt die Gesamtverantwortung für die KI-Richtlinie.' },
  { value: 'it', label: 'IT-Abteilung', desc: 'Die IT übernimmt operative Verantwortung und Tool-Freigaben.' },
  { value: 'dsb', label: 'Datenschutzbeauftragter (DSB)', desc: 'Der DSB koordiniert Compliance und Datenschutzaspekte.' },
  { value: 'komitee', label: 'Eigenes KI-Governance-Komitee', desc: 'Ein dediziertes Gremium aus mehreren Stakeholdern.' },
  { value: 'unklar', label: 'Noch unklar', desc: 'Die Verantwortung ist noch nicht festgelegt.' },
]

export function Block4({ data, onChange }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl md:text-3xl font-light text-navy mb-1">
          Umfang & Governance
        </h2>
        <p className="font-body text-sm text-navy/50">
          Wie strikt soll die Richtlinie sein — und wer trägt die Verantwortung?
        </p>
      </div>

      <RadioGroup
        label="F12 — Wie strikt soll die KI-Richtlinie sein?"
        value={data.striktheit}
        onChange={v => onChange({ striktheit: v })}
        options={STRIKTHEIT}
        hint="Bestimmt den gesamten Ton der Richtlinie — von ermutigend bis restriktiv."
        required
      />

      <RadioGroup
        label="F13 — Wer soll für die Einhaltung der KI-Richtlinie verantwortlich sein?"
        value={data.verantwortung}
        onChange={v => onChange({ verantwortung: v })}
        options={VERANTWORTUNG}
        hint="Wird direkt in Kapitel 9 (Verantwortlichkeiten & Governance) eingebaut."
        required
      />
    </div>
  )
}
