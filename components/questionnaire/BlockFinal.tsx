'use client'

import { QuestionnaireData } from './types'
import { EmailInput } from './FormField'
import { TIER_LIST } from '@/config/pricing'
import { LegalDisclaimer } from '@/components/LegalDisclaimer'

interface Props {
  data: QuestionnaireData
  onChange: (updates: Partial<QuestionnaireData>) => void
}

export function BlockFinal({ data, onChange }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl md:text-3xl font-light text-navy mb-1">
          Fast fertig!
        </h2>
        <p className="font-body text-sm text-navy/50">
          Wählen Sie Ihr Paket und geben Sie Ihre E-Mail-Adresse ein, um Ihre Richtlinie zu erhalten.
        </p>
      </div>

      {/* Tier selection */}
      <div>
        <label className="block font-body text-sm font-medium text-navy mb-3">
          Paket wählen <span className="text-gold">*</span>
        </label>
        <div className="grid gap-3">
          {TIER_LIST.map(tier => (
            <label
              key={tier.id}
              className={`flex items-start gap-4 p-5 rounded-sm border cursor-pointer transition-all duration-150 ${
                data.tier === tier.id
                  ? tier.highlight
                    ? 'border-gold bg-navy text-cream'
                    : 'border-gold/60 bg-gold/5'
                  : tier.highlight
                  ? 'border-navy/20 bg-navy/3 hover:border-navy/40'
                  : 'border-navy/10 bg-white hover:border-navy/25'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                data.tier === tier.id ? 'border-gold' : 'border-navy/25'
              }`}>
                {data.tier === tier.id && (
                  <div className="w-2 h-2 rounded-full bg-gold" />
                )}
              </div>
              <input
                type="radio"
                value={tier.id}
                checked={data.tier === tier.id}
                onChange={() => onChange({ tier: tier.id })}
                className="sr-only"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-body font-semibold text-sm ${data.tier === tier.id && tier.highlight ? 'text-cream' : 'text-navy'}`}>
                      {tier.name}
                    </span>
                    {tier.highlight && (
                      <span className="text-xs bg-gold text-navy-dark px-2 py-0.5 rounded-full font-body font-medium">
                        Empfohlen
                      </span>
                    )}
                  </div>
                  <span className={`font-display text-xl font-light ${data.tier === tier.id && tier.highlight ? 'text-gold-light' : 'text-navy'}`}>
                    €{tier.price}
                  </span>
                </div>
                <ul className="space-y-1">
                  {tier.questionnaireFeatures.map((item, i) => (
                    <li key={i} className={`font-body text-xs flex items-start gap-1.5 ${data.tier === tier.id && tier.highlight ? 'text-cream/70' : 'text-navy/60'}`}>
                      <span className="text-gold mt-0.5 flex-shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Email */}
      <EmailInput
        label="Ihre E-Mail-Adresse"
        value={data.email}
        onChange={v => onChange({ email: v })}
        placeholder="max.mustermann@firma.de"
        hint="Die fertige Richtlinie wird an diese Adresse geschickt. Sie können sie auch direkt nach der Zahlung herunterladen."
      />

      {/* Rechtlicher Disclaimer mit Pflicht-Checkbox */}
      <LegalDisclaimer
        showCheckbox
        checked={data.disclaimerAccepted}
        onCheckedChange={(checked) => onChange({ disclaimerAccepted: checked })}
      />

      {/* Summary */}
      <div className="p-5 rounded-sm bg-navy/3 border border-navy/10">
        <p className="font-body text-xs font-medium text-navy mb-3 uppercase tracking-wider">Ihre Angaben im Überblick</p>
        <dl className="space-y-1.5">
          {[
            { label: 'Unternehmen', value: data.firmenname || '—' },
            { label: 'Branche', value: data.branche || '—' },
            { label: 'Mitarbeiter', value: data.mitarbeiter || '—' },
            { label: 'KI-Status', value: data.ki_status || '—' },
            { label: 'Striktheit', value: data.striktheit || '—' },
          ].map(item => (
            <div key={item.label} className="flex justify-between gap-4">
              <dt className="font-body text-xs text-navy/40">{item.label}</dt>
              <dd className="font-body text-xs text-navy font-medium text-right truncate max-w-[200px]">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
