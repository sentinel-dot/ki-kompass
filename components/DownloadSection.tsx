'use client'

import { useState } from 'react'
import { LegalDisclaimer } from '@/components/LegalDisclaimer'

interface DownloadSectionProps {
  policyUrl: string
  docxUrl: string | null
  email: string
  companyName: string
  tier: string
  generatedAt: string | null
}

const tierLabels: Record<string, string> = {
  basis: 'Basis',
  professional: 'Professional',
}

export function DownloadSection({
  policyUrl,
  docxUrl,
  email,
  companyName,
  tier,
  generatedAt,
}: DownloadSectionProps) {
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false)

  return (
    <>
      {/* Success icon */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8"
        style={{ background: 'linear-gradient(135deg, #1B2A4A, #253660)' }}
      >
        <svg
          className="w-10 h-10 text-gold"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <p className="text-xs uppercase tracking-[0.25em] text-gold font-body font-medium mb-3">
        Ihre Richtlinie ist bereit
      </p>
      <h1 className="font-display text-4xl font-light text-navy mb-4">
        {companyName}
      </h1>
      <p className="font-body text-sm text-navy/50 mb-2">
        Paket: <strong className="text-navy font-medium">{tierLabels[tier] ?? tier}</strong>
      </p>
      {generatedAt && (
        <p className="font-body text-xs text-navy/30 mb-8">
          Erstellt am{' '}
          {new Date(generatedAt).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      )}

      {/* Disclaimer mit Checkbox — muss akzeptiert werden vor Download */}
      <div className="mb-8 text-left">
        <LegalDisclaimer
          showCheckbox
          checked={disclaimerAccepted}
          onCheckedChange={setDisclaimerAccepted}
          variant="compact"
        />
      </div>

      {/* Download buttons — disabled bis Disclaimer akzeptiert */}
      <div className={`transition-opacity duration-200 ${disclaimerAccepted ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
        <a
          href={policyUrl}
          download
          aria-disabled={!disclaimerAccepted}
          tabIndex={disclaimerAccepted ? 0 : -1}
          className="inline-flex items-center gap-3 bg-navy text-cream font-body font-medium text-sm px-10 py-4 rounded-sm hover:bg-navy-light transition-all duration-200 mb-3 w-full justify-center"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          KI-Nutzungsrichtlinie herunterladen (PDF)
        </a>

        {docxUrl && (
          <a
            href={docxUrl}
            download
            aria-disabled={!disclaimerAccepted}
            tabIndex={disclaimerAccepted ? 0 : -1}
            className="inline-flex items-center gap-3 bg-cream text-navy border border-navy/12 font-body font-medium text-sm px-10 py-4 rounded-sm hover:border-gold/40 hover:bg-gold/5 transition-all duration-200 mb-4 w-full justify-center"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            KI-Nutzungsrichtlinie herunterladen (Word/DOCX)
          </a>
        )}
      </div>

      {!disclaimerAccepted && (
        <p className="font-body text-xs text-amber-700 mt-2 mb-4">
          Bitte bestätigen Sie den rechtlichen Hinweis oben, um den Download freizuschalten.
        </p>
      )}

      <p className="font-body text-xs text-navy/40 mt-4">
        Eine Kopie wurde auch an {email} gesendet.
      </p>
    </>
  )
}
