import Link from 'next/link'

// This page is shown briefly as redirect to Stripe happens client-side
export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-navy/5 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-navy/30 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <p className="font-display text-xl text-navy">Sie werden zur Zahlung weitergeleitet…</p>
        <p className="font-body text-sm text-navy/40 mt-2">Sichere Zahlung via Stripe</p>
        <Link href="/" className="mt-8 inline-block font-body text-xs text-navy/30 underline underline-offset-4">
          Zurück zur Startseite
        </Link>
      </div>
    </main>
  )
}
