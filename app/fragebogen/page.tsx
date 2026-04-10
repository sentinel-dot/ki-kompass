'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { QuestionnaireData, FormStep } from '@/components/questionnaire/types'
import { ProgressBar } from '@/components/questionnaire/ProgressBar'
import { Block1 } from '@/components/questionnaire/Block1'
import { Block2 } from '@/components/questionnaire/Block2'
import { Block3 } from '@/components/questionnaire/Block3'
import { Block4 } from '@/components/questionnaire/Block4'
import { BlockFinal } from '@/components/questionnaire/BlockFinal'
import { TIERS, type TierId } from '@/config/pricing'

const STEP_LABELS = ['Unternehmen', 'KI-Nutzung', 'Datenschutz', 'Governance', 'Abschluss']

function getInitialTier(param: string | null): QuestionnaireData['tier'] {
  if (param === 'professional') return param
  return 'basis'
}

function QuestionnaireInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTier = getInitialTier(searchParams.get('tier'))

  const [step, setStep] = useState<FormStep>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [data, setData] = useState<QuestionnaireData>({
    firmenname: '',
    branche: '',
    branche_sonstige: '',
    mitarbeiter: '',
    laender: [],
    ki_status: '',
    externe_tools: [],
    externe_tools_sonstige: '',
    use_cases: [],
    use_cases_sonstige: '',
    interne_ki: '',
    interne_ki_beschreibung: '',
    datenarten: [],
    dsb: '',
    cloud_ausserhalb_eu: '',
    striktheit: '',
    verantwortung: '',
    email: '',
    tier: initialTier,
    disclaimerAccepted: false,
  })

  const update = (updates: Partial<QuestionnaireData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  const validateStep = (): string | null => {
    if (step === 1) {
      if (!data.firmenname.trim()) return 'Bitte geben Sie Ihren Firmennamen ein.'
      if (!data.branche) return 'Bitte wählen Sie Ihre Branche.'
      if (!data.mitarbeiter) return 'Bitte wählen Sie die Mitarbeiteranzahl.'
      if (data.laender.length === 0) return 'Bitte wählen Sie mindestens ein Tätigkeitsland.'
    }
    if (step === 2) {
      if (!data.ki_status) return 'Bitte geben Sie den KI-Status Ihres Unternehmens an.'
      if (data.externe_tools.length === 0) return 'Bitte wählen Sie die genutzten KI-Tools (oder "Keine").'
      if (data.use_cases.length === 0) return 'Bitte wählen Sie mindestens einen Einsatzzweck.'
      if (!data.interne_ki) return 'Bitte beantworten Sie die Frage zur internen KI-Lösung.'
    }
    if (step === 3) {
      if (data.datenarten.length === 0) return 'Bitte wählen Sie mindestens eine Datenkategorie.'
      if (!data.dsb) return 'Bitte geben Sie an, ob Sie einen Datenschutzbeauftragten haben.'
      if (!data.cloud_ausserhalb_eu) return 'Bitte beantworten Sie die Cloud-Speicher-Frage.'
    }
    if (step === 4) {
      if (!data.striktheit) return 'Bitte wählen Sie den gewünschten Striktheit-Level.'
      if (!data.verantwortung) return 'Bitte wählen Sie die verantwortliche Stelle.'
    }
    if (step === 5) {
      if (!data.email.trim() || !data.email.includes('@')) return 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'
      if (!data.tier) return 'Bitte wählen Sie ein Paket.'
      if (!data.disclaimerAccepted) return 'Bitte bestätigen Sie, dass Sie den rechtlichen Hinweis gelesen haben.'
    }
    return null
  }

  const next = () => {
    const err = validateStep()
    if (err) { setError(err); return }
    setError(null)
    if (step < 5) setStep((step + 1) as FormStep)
  }

  const back = () => {
    setError(null)
    if (step > 1) setStep((step - 1) as FormStep)
  }

  const submit = async () => {
    const err = validateStep()
    if (err) { setError(err); return }
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Fehler beim Erstellen der Checkout-Session')
      if (json.url) {
        router.push(json.url)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-navy/8 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-sm bg-navy flex items-center justify-center">
              <span className="text-gold text-xs font-mono font-medium">KI</span>
            </div>
            <span className="font-display text-base font-semibold text-navy">KI-Kompass</span>
          </Link>
          <div className="flex-1">
            <ProgressBar current={step} total={5} labels={STEP_LABELS} />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 py-10 px-6">
        <div className="max-w-2xl mx-auto">
          {/* Step indicator */}
          <p className="font-mono text-xs text-gold/70 uppercase tracking-[0.2em] mb-8">
            Schritt {step} von 5
          </p>

          {/* Form block */}
          <div className="animate-fade-up">
            {step === 1 && <Block1 data={data} onChange={update} />}
            {step === 2 && <Block2 data={data} onChange={update} />}
            {step === 3 && <Block3 data={data} onChange={update} />}
            {step === 4 && <Block4 data={data} onChange={update} />}
            {step === 5 && <BlockFinal data={data} onChange={update} />}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-6 p-4 rounded-sm border border-red-200 bg-red-50">
              <p className="font-body text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-10 flex items-center justify-between gap-4 pt-8 border-t border-navy/8">
            {step > 1 ? (
              <button
                onClick={back}
                className="flex items-center gap-2 font-body text-sm text-navy/60 hover:text-navy transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                Zurück
              </button>
            ) : (
              <Link
                href="/"
                className="flex items-center gap-2 font-body text-sm text-navy/60 hover:text-navy transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                Zurück zur Startseite
              </Link>
            )}

            {step < 5 ? (
              <button
                onClick={next}
                className="flex items-center gap-2 bg-navy text-cream font-body font-medium text-sm px-8 py-3 rounded-sm hover:bg-navy-light transition-colors"
              >
                Weiter
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={loading}
                className="flex items-center gap-2 bg-gold text-navy-dark font-body font-semibold text-sm px-8 py-3 rounded-sm hover:bg-gold-light transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Wird vorbereitet…
                  </>
                ) : (
                  <>
                    Zur Zahlung →
                    <span className="font-display text-sm font-light opacity-70">
                      €{TIERS[data.tier as TierId]?.price ?? '79'}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Trust indicators */}
          <div className="mt-6 flex items-center justify-center gap-6">
            <span className="font-body text-xs text-navy/30 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              SSL-verschlüsselt
            </span>
            <span className="font-body text-xs text-navy/30">·</span>
            <span className="font-body text-xs text-navy/30">Zahlung via Stripe</span>
            <span className="font-body text-xs text-navy/30">·</span>
            <span className="font-body text-xs text-navy/30">DSGVO-konform</span>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function FragebogenPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-navy border-t-gold rounded-full animate-spin" />
      </div>
    }>
      <QuestionnaireInner />
    </Suspense>
  )
}
