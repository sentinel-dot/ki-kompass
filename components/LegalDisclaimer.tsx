'use client'

interface LegalDisclaimerProps {
  /** Show the checkbox for user acknowledgement */
  showCheckbox?: boolean
  /** Current checked state (only relevant when showCheckbox is true) */
  checked?: boolean
  /** Callback when checkbox state changes */
  onCheckedChange?: (checked: boolean) => void
  /** Visual variant */
  variant?: 'default' | 'compact'
}

/**
 * Rechtlicher Disclaimer — "Keine Rechtsberatung"
 *
 * Wird angezeigt auf:
 * - Fragebogen (Schritt 5, vor Kauf)
 * - Ergebnis-Seite (vor Download)
 * - PDF (erste Seite nach Cover)
 */
export function LegalDisclaimer({
  showCheckbox = false,
  checked = false,
  onCheckedChange,
  variant = 'default',
}: LegalDisclaimerProps) {
  const isCompact = variant === 'compact'

  return (
    <div
      className={`rounded-sm border ${
        isCompact
          ? 'border-amber-200/60 bg-amber-50/50 p-4'
          : 'border-amber-200 bg-amber-50/80 p-5'
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <svg
            className={`text-amber-600 ${isCompact ? 'w-4 h-4' : 'w-5 h-5'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`font-body font-semibold text-amber-900 ${
              isCompact ? 'text-xs' : 'text-sm'
            }`}
          >
            Wichtiger Hinweis — Keine Rechtsberatung
          </p>
          <p
            className={`font-body text-amber-800/80 mt-1.5 leading-relaxed ${
              isCompact ? 'text-xs' : 'text-xs'
            }`}
          >
            Die durch KI-Kompass erstellte KI-Nutzungsrichtlinie dient als
            professionelle Vorlage und Orientierungshilfe. Sie ersetzt{' '}
            <strong className="text-amber-900">keine individuelle Rechtsberatung</strong>{' '}
            durch einen Fachanwalt. Trotz sorgfältiger Erstellung und juristischer
            Prüfung des Generierungsprozesses übernehmen wir keine Haftung für die
            Vollständigkeit, Richtigkeit oder Aktualität der Inhalte. Wir empfehlen,
            die Richtlinie vor der Einführung durch Ihre Rechtsabteilung oder einen
            spezialisierten Anwalt prüfen zu lassen.
          </p>
        </div>
      </div>

      {/* Optional checkbox */}
      {showCheckbox && (
        <label className="flex items-start gap-3 mt-4 pt-4 border-t border-amber-200/60 cursor-pointer group">
          <div className="flex-shrink-0 mt-0.5">
            <div
              className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center transition-all duration-150 ${
                checked
                  ? 'bg-navy border-navy'
                  : 'bg-white border-amber-300 group-hover:border-amber-400'
              }`}
            >
              {checked && (
                <svg
                  className="w-3.5 h-3.5 text-cream"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => onCheckedChange?.(e.target.checked)}
              className="sr-only"
            />
          </div>
          <span className="font-body text-xs text-amber-900 leading-relaxed select-none">
            Ich habe den Hinweis gelesen und verstehe, dass die erstellte
            KI-Nutzungsrichtlinie keine individuelle Rechtsberatung ersetzt.
          </span>
        </label>
      )}
    </div>
  )
}

/**
 * HTML-Version des Disclaimers für das PDF-Cover/erste Seite
 */
export const DISCLAIMER_HTML = `
<div style="
  border: 1px solid #F59E0B;
  border-radius: 2px;
  padding: 20px 24px;
  margin: 0 0 24px 0;
  background: #FFFBEB;
  page-break-inside: avoid;
">
  <p style="
    font-size: 10pt;
    font-weight: 700;
    color: #92400E;
    margin: 0 0 8px 0;
  ">⚠ Wichtiger Hinweis — Keine Rechtsberatung</p>
  <p style="
    font-size: 9pt;
    color: #78350F;
    line-height: 1.6;
    margin: 0;
  ">
    Die vorliegende KI-Nutzungsrichtlinie wurde mit Hilfe von KI-Kompass erstellt und dient als
    professionelle Vorlage und Orientierungshilfe. Sie ersetzt <strong>keine individuelle Rechtsberatung</strong>
    durch einen Fachanwalt. Trotz sorgfältiger Erstellung und juristischer Prüfung des
    Generierungsprozesses wird keine Haftung für die Vollständigkeit, Richtigkeit oder Aktualität
    der Inhalte übernommen. Es wird empfohlen, die Richtlinie vor der Einführung durch eine
    Rechtsabteilung oder einen spezialisierten Anwalt prüfen zu lassen.
  </p>
</div>
`
