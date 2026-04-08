import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

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
    .select('id, company_name, tier, payment_status, policy_url, generated_at, email')
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

  const tierLabels: Record<string, string> = {
    basis: 'Basis',
    professional: 'Professional',
    enterprise: 'Enterprise',
  }

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
              {/* Success state */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8"
                style={{ background: 'linear-gradient(135deg, #1B2A4A, #253660)' }}
              >
                <svg className="w-10 h-10 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <p className="text-xs uppercase tracking-[0.25em] text-gold font-body font-medium mb-3">
                Ihre Richtlinie ist bereit
              </p>
              <h1 className="font-display text-4xl font-light text-navy mb-4">
                {order.company_name}
              </h1>
              <p className="font-body text-sm text-navy/50 mb-2">
                Paket: <strong className="text-navy font-medium">{tierLabels[order.tier] ?? order.tier}</strong>
              </p>
              {order.generated_at && (
                <p className="font-body text-xs text-navy/30 mb-10">
                  Erstellt am {new Date(order.generated_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              )}

              {/* Download button */}
              <a
                href={order.policy_url}
                download
                className="inline-flex items-center gap-3 bg-navy text-cream font-body font-medium text-sm px-10 py-4 rounded-sm hover:bg-navy-light transition-all duration-200 mb-4 w-full justify-center"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                KI-Nutzungsrichtlinie herunterladen (PDF)
              </a>

              <p className="font-body text-xs text-navy/40 mt-4">
                Eine Kopie wurde auch an {order.email} gesendet.
              </p>

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
