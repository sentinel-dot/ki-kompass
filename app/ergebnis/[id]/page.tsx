import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { DownloadSection } from '@/components/DownloadSection'

interface Props {
  params: Promise<{ id: string }>
}

async function getOrder(id: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
  const { data, error } = await supabase
    .from('orders')
    .select('id, company_name, tier, payment_status, policy_url, docx_url, generated_at, email')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data
}

export default async function ErgebnisPage({ params }: Props) {
  const { id } = await params
  const order = await getOrder(id)

  if (!order) return notFound()

  const isPaid = order.payment_status === 'paid'
  const isReady = isPaid && order.policy_url

  return (
    <main className="min-h-screen bg-cream flex flex-col">
      {/* Nav */}
      <nav className="bg-white border-b border-navy/8">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-2">
          <div className="w-7 h-7 rounded-sm bg-navy flex items-center justify-center">
            <span className="text-gold text-xs font-mono font-medium">KI</span>
          </div>
          <span className="font-display text-base font-semibold text-navy">KI-Kompass</span>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center py-20 px-6">
        <div className="max-w-lg w-full text-center">
          {isReady ? (
            <>
              <DownloadSection
                policyUrl={order.policy_url}
                docxUrl={order.docx_url}
                email={order.email}
                companyName={order.company_name}
                tier={order.tier}
                generatedAt={order.generated_at}
              />

              <div className="mt-12 pt-8 border-t border-navy/8">
                <p className="font-body text-sm text-navy/50 mb-4">
                  Empfehlen Sie KI-Kompass weiter und helfen Sie anderen Unternehmen, compliant zu werden.
                </p>
                <Link
                  href="/"
                  className="font-body text-sm text-navy underline underline-offset-4 hover:text-navy-light transition-colors"
                >
                  Zurück zur Startseite
                </Link>
              </div>
            </>
          ) : isPaid ? (
            <>
              {/* Generating state */}
              <div className="w-20 h-20 rounded-full bg-navy/5 flex items-center justify-center mx-auto mb-8">
                <svg className="w-10 h-10 text-navy/40 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <h1 className="font-display text-3xl font-light text-navy mb-4">
                Wird generiert…
              </h1>
              <p className="font-body text-sm text-navy/50 leading-relaxed mb-4">
                Ihre Richtlinie für <strong className="text-navy">{order.company_name}</strong> wird gerade erstellt.
                Das dauert in der Regel 1–2 Minuten.
              </p>
              <p className="font-body text-xs text-navy/30">
                Sie werden auch per E-Mail benachrichtigt, sobald Ihre Richtlinie fertig ist.
                Diese Seite können Sie jederzeit erneut aufrufen.
              </p>
            </>
          ) : (
            <>
              {/* Pending payment */}
              <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-8">
                <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="font-display text-3xl font-light text-navy mb-4">
                Zahlung ausstehend
              </h1>
              <p className="font-body text-sm text-navy/50 leading-relaxed mb-8">
                Die Zahlung für diese Bestellung ist noch nicht bestätigt.
                Sobald die Zahlung eingegangen ist, wird Ihre Richtlinie automatisch erstellt.
              </p>
              <Link
                href="/fragebogen"
                className="inline-flex items-center gap-2 bg-navy text-cream font-body font-medium text-sm px-8 py-3 rounded-sm hover:bg-navy-light transition-colors"
              >
                Neue Richtlinie erstellen →
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
