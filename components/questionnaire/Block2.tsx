'use client'

import { QuestionnaireData } from './types'
import { RadioGroup, CheckboxGroup, TextInput } from './FormField'

interface Props {
  data: QuestionnaireData
  onChange: (updates: Partial<QuestionnaireData>) => void
}

const KI_STATUS = [
  { value: 'freigegeben', label: 'Offiziell freigegeben', desc: 'KI-Nutzung ist mit klaren Regeln genehmigt.' },
  { value: 'teilweise', label: 'Teilweise freigegeben', desc: 'Einige Tools genehmigt, aber ohne formale Regelung.' },
  { value: 'shadow', label: 'Keine Regelung (Shadow AI)', desc: 'Mitarbeiter nutzen KI eigenständig ohne Freigabe.' },
  { value: 'nicht_genutzt', label: 'KI wird aktuell nicht genutzt', desc: 'Wir möchten eine präventive Richtlinie erstellen.' },
  { value: 'weiss_nicht', label: 'Weiß nicht', desc: 'Kein Überblick über die aktuelle KI-Nutzung.' },
]

const EXTERNE_TOOLS = [
  { value: 'chatgpt', label: 'ChatGPT / OpenAI' },
  { value: 'copilot', label: 'Microsoft Copilot (Office 365)' },
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'claude', label: 'Claude (Anthropic)' },
  { value: 'github_copilot', label: 'GitHub Copilot' },
  { value: 'bildgenerierung', label: 'Midjourney / DALL-E (Bildgenerierung)' },
  { value: 'branchenspezifisch', label: 'Branchenspezifische KI-Software' },
  { value: 'keine', label: 'Keine / Nicht bekannt' },
  { value: 'sonstige', label: 'Sonstige' },
]

const USE_CASES = [
  { value: 'texte', label: 'Texte schreiben (E-Mails, Berichte, Zusammenfassungen)' },
  { value: 'code', label: 'Programmierung / Code-Generierung' },
  { value: 'datenanalyse', label: 'Datenanalyse & Auswertungen' },
  { value: 'kundenservice', label: 'Kundenservice / Chatbots' },
  { value: 'uebersetzung', label: 'Übersetzungen' },
  { value: 'bilder', label: 'Bild- und Medienerstellung' },
  { value: 'personal', label: 'Personalwesen (Bewerbungs-Screening, Leistungsbeurteilung)' },
  { value: 'entscheidung', label: 'Entscheidungsunterstützung (Finanzen, Strategie)' },
  { value: 'sonstige', label: 'Sonstige' },
]

const INTERNE_KI = [
  { value: 'ja', label: 'Ja', desc: 'Wir betreiben eine eigene KI-Lösung (z.B. interner Chatbot, eigenes Modell).' },
  { value: 'nein', label: 'Nein', desc: 'Wir nutzen ausschließlich externe KI-Dienste.' },
  { value: 'geplant', label: 'In Planung', desc: 'Eine eigene KI-Lösung ist in Vorbereitung.' },
]

export function Block2({ data, onChange }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl md:text-3xl font-light text-navy mb-1">
          Aktuelle KI-Nutzung
        </h2>
        <p className="font-body text-sm text-navy/50">
          Wie und welche KI-Tools werden in Ihrem Unternehmen eingesetzt?
        </p>
      </div>

      <RadioGroup
        label="F5 — Wie ist der aktuelle Status der KI-Nutzung?"
        value={data.ki_status}
        onChange={v => onChange({ ki_status: v })}
        options={KI_STATUS}
        hint="Bestimmt den Ton der Richtlinie und ob ein Shadow-AI-Kapitel notwendig ist."
        required
      />

      <div className="space-y-3">
        <CheckboxGroup
          label="F6 — Welche externen KI-Tools werden genutzt?"
          value={data.externe_tools}
          onChange={v => onChange({ externe_tools: v })}
          options={EXTERNE_TOOLS}
          hint="Bestimmt Kapitel 4: Freigegebene Tools. Eigene interne KI-Systeme werden separat in F8 abgefragt."
          required
        />
        {data.externe_tools.includes('sonstige') && (
          <TextInput
            label="Weitere Tools (Freitext)"
            value={data.externe_tools_sonstige ?? ''}
            onChange={v => onChange({ externe_tools_sonstige: v })}
            placeholder="z.B. Perplexity AI, Notion AI…"
          />
        )}
      </div>

      <div className="space-y-3">
        <CheckboxGroup
          label="F7 — Für welche Aufgaben wird KI eingesetzt?"
          value={data.use_cases}
          onChange={v => onChange({ use_cases: v })}
          options={USE_CASES}
          hint="Bestimmt die Tabelle erlaubter/eingeschränkter/verbotener Use Cases in Kapitel 3."
          required
        />
        {data.use_cases.includes('sonstige') && (
          <TextInput
            label="Weitere Aufgaben (Freitext)"
            value={data.use_cases_sonstige ?? ''}
            onChange={v => onChange({ use_cases_sonstige: v })}
            placeholder="z.B. Produktrecherche, Marktanalyse…"
          />
        )}
      </div>

      <div className="space-y-4">
        <RadioGroup
          label="F8 — Betreibt Ihr Unternehmen eine eigene interne KI-Lösung?"
          value={data.interne_ki}
          onChange={v => onChange({ interne_ki: v })}
          options={INTERNE_KI}
          hint="Eigene KI-Systeme erfordern Anhang A mit Logging, Zugangsberechtigungen und EU AI Act Dokumentationspflichten."
          required
        />
        {data.interne_ki === 'ja' && (
          <div className="pl-4 border-l-2 border-gold/30">
            <TextInput
              label="Kurze Beschreibung der internen KI-Lösung"
              value={data.interne_ki_beschreibung ?? ''}
              onChange={v => onChange({ interne_ki_beschreibung: v })}
              placeholder="z.B. Interner Support-Chatbot basierend auf GPT-4, eigenes Modell für Kreditscoring…"
              hint="Diese Beschreibung wird in Anhang A der Richtlinie verwendet."
            />
          </div>
        )}
      </div>
    </div>
  )
}
