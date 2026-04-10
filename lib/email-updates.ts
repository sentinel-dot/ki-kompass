/**
 * E-Mail-Funktionen für Enterprise-Updates und Gesetzesänderungs-Alerts
 *
 * Erweitert die bestehende email.ts um Templates für:
 * - Vierteljährliche Policy-Updates
 * - Gesetzesänderungs-Benachrichtigungen
 */

import * as Sentry from '@sentry/nextjs'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ki-kompass.de'

// ─── Vierteljährliches Update E-Mail ────────────────────────────────────────

interface SendUpdateEmailParams {
  to: string
  companyName: string
  version: number
  changeSummary: string
  pdfDownloadUrl: string
  docxDownloadUrl: string
  orderId: string
}

/**
 * Sendet eine E-Mail mit dem vierteljährlichen Policy-Update.
 */
export async function sendUpdateEmail(params: SendUpdateEmailParams): Promise<void> {
  const { to, companyName, version, changeSummary, pdfDownloadUrl, docxDownloadUrl, orderId } = params

  // Markdown-artige Aufzählungen in HTML umwandeln
  const changeSummaryHtml = changeSummary
    .split('\n')
    .map(line => {
      const trimmed = line.trim()
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        return `<li style="margin-bottom: 6px; color: rgba(27,42,74,0.7); font-size: 14px;">${trimmed.slice(2)}</li>`
      }
      if (trimmed.length === 0) return ''
      return `<p style="color: rgba(27,42,74,0.7); font-size: 14px; margin: 8px 0;">${trimmed}</p>`
    })
    .join('\n')

  const hasListItems = changeSummaryHtml.includes('<li')
  const summaryBlock = hasListItems
    ? `<ul style="margin: 16px 0; padding-left: 20px;">${changeSummaryHtml}</ul>`
    : changeSummaryHtml

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'KI-Kompass', email: 'noreply@ki-kompass.de' },
      to: [{ email: to, name: companyName }],
      subject: `Vierteljährliches Update Ihrer KI-Richtlinie (Version ${version})`,
      htmlContent: buildUpdateEmailHtml({
        companyName,
        version,
        summaryBlock,
        pdfDownloadUrl,
        docxDownloadUrl,
        orderId,
      }),
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    const error = new Error(`Update-E-Mail-Versand fehlgeschlagen: ${text}`)
    Sentry.captureException(error, {
      tags: {
        service: 'brevo',
        flow: 'quarterly-updates',
        step: 'update-email',
        order_id: orderId,
      },
    })
    throw error
  }
}

function buildUpdateEmailHtml(params: {
  companyName: string
  version: number
  summaryBlock: string
  pdfDownloadUrl: string
  docxDownloadUrl: string
  orderId: string
}): string {
  const { companyName, version, summaryBlock, pdfDownloadUrl, docxDownloadUrl, orderId } = params
  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })

  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vierteljährliches Update</title>
</head>
<body style="font-family: 'DM Sans', Arial, sans-serif; background: #F7F4EF; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 2px; overflow: hidden; border: 1px solid rgba(27,42,74,0.08);">
    <!-- Header -->
    <div style="background: #1B2A4A; padding: 32px 40px;">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
        <div style="width: 28px; height: 28px; background: rgba(201,168,76,0.2); border-radius: 2px; display: flex; align-items: center; justify-content: center;">
          <span style="color: #C9A84C; font-size: 11px; font-family: monospace; font-weight: 500;">KI</span>
        </div>
        <span style="color: rgba(247,244,239,0.6); font-size: 14px;">KI-Kompass</span>
      </div>
      <h1 style="color: #F7F4EF; font-size: 24px; font-weight: 300; margin: 0; font-family: Georgia, serif; letter-spacing: -0.02em;">
        Vierteljährliches Update
      </h1>
      <p style="color: rgba(247,244,239,0.5); font-size: 13px; margin: 8px 0 0;">
        Version ${version} · ${today}
      </p>
    </div>

    <!-- Body -->
    <div style="padding: 40px;">
      <p style="color: rgba(27,42,74,0.6); font-size: 14px; line-height: 1.6; margin-top: 0;">
        Sehr geehrte Damen und Herren,
      </p>
      <p style="color: rgba(27,42,74,0.6); font-size: 14px; line-height: 1.6;">
        Ihre <strong style="color: #1B2A4A;">KI-Nutzungsrichtlinie für ${companyName}</strong> wurde im Rahmen Ihres Enterprise-Abonnements aktualisiert. Hier die wichtigsten Änderungen:
      </p>

      <!-- Änderungszusammenfassung -->
      <div style="background: #F7F4EF; border-radius: 2px; padding: 20px; margin: 24px 0; border-left: 3px solid #C9A84C;">
        <p style="margin: 0 0 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; color: #C9A84C; font-weight: 500;">Was hat sich geändert?</p>
        ${summaryBlock}
      </div>

      <!-- Download-Buttons -->
      <a href="${pdfDownloadUrl}" style="display: block; background: #1B2A4A; color: white; text-decoration: none; padding: 16px 24px; border-radius: 2px; text-align: center; font-size: 14px; font-weight: 500; margin: 24px 0 12px;">
        Aktualisierte Richtlinie herunterladen (PDF) →
      </a>

      <a href="${docxDownloadUrl}" style="display: block; background: #F7F4EF; color: #1B2A4A; text-decoration: none; padding: 14px 24px; border-radius: 2px; text-align: center; font-size: 14px; font-weight: 500; margin: 0 0 24px; border: 1px solid rgba(27,42,74,0.12);">
        Aktualisierte Richtlinie herunterladen (Word/DOCX) →
      </a>

      <div style="background: #E8F0FE; border-radius: 2px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0; font-size: 13px; color: rgba(27,42,74,0.7);">
          <strong style="color: #1B2A4A;">💡 Empfehlung:</strong> Verteilen Sie die aktualisierte Richtlinie an alle Mitarbeiter und weisen Sie auf die Änderungen hin. Die vorherige Version sollte archiviert werden.
        </p>
      </div>

      <p style="color: rgba(27,42,74,0.4); font-size: 12px; line-height: 1.6; margin-bottom: 0;">
        Alle Versionen Ihrer Richtlinie finden Sie unter
        <a href="${BASE_URL}/ergebnis/${orderId}" style="color: #1B2A4A;">ki-kompass.de/ergebnis/${orderId}</a>.
      </p>
    </div>

    <!-- Footer -->
    <div style="padding: 20px 40px; border-top: 1px solid rgba(27,42,74,0.06); background: #F7F4EF;">
      <p style="color: rgba(27,42,74,0.3); font-size: 11px; margin: 0; text-align: center;">
        KI-Kompass Enterprise · Vierteljährliches Update<br>
        <a href="#" style="color: rgba(27,42,74,0.3); text-decoration: underline;">Impressum</a> ·
        <a href="#" style="color: rgba(27,42,74,0.3); text-decoration: underline;">Datenschutz</a>
      </p>
    </div>
  </div>
</body>
</html>`
}

// ─── Gesetzesänderungs-Alert E-Mail ─────────────────────────────────────────

interface SendLawChangeAlertParams {
  to: string
  companyName: string
  alertTitle: string
  alertDescription: string
  lawReference: string
  severity: 'info' | 'warning' | 'critical'
  effectiveDate?: string
  personalizedNote: string
}

/**
 * Sendet eine Gesetzesänderungs-Benachrichtigung an einen Enterprise-Kunden.
 */
export async function sendLawChangeAlertEmail(params: SendLawChangeAlertParams): Promise<void> {
  const {
    to, companyName, alertTitle, alertDescription,
    lawReference, severity, effectiveDate, personalizedNote,
  } = params

  const severityConfig = {
    info: { emoji: 'ℹ️', label: 'Information', color: '#1565C0', bg: '#E3F2FD' },
    warning: { emoji: '⚠️', label: 'Handlungsbedarf', color: '#E65100', bg: '#FFF3E0' },
    critical: { emoji: '🚨', label: 'Dringender Handlungsbedarf', color: '#C62828', bg: '#FFEBEE' },
  }

  const config = severityConfig[severity]

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'KI-Kompass', email: 'noreply@ki-kompass.de' },
      to: [{ email: to, name: companyName }],
      subject: `${config.emoji} Gesetzesänderung: ${alertTitle}`,
      htmlContent: buildLawChangeAlertHtml({
        companyName,
        alertTitle,
        alertDescription,
        lawReference,
        config,
        effectiveDate,
        personalizedNote,
      }),
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    const error = new Error(`Law-Change-Alert E-Mail fehlgeschlagen: ${text}`)
    Sentry.captureException(error, {
      tags: {
        service: 'brevo',
        flow: 'law-change-alerts',
        step: 'alert-email',
      },
    })
    throw error
  }
}

function buildLawChangeAlertHtml(params: {
  companyName: string
  alertTitle: string
  alertDescription: string
  lawReference: string
  config: { emoji: string; label: string; color: string; bg: string }
  effectiveDate?: string
  personalizedNote: string
}): string {
  const { companyName, alertTitle, alertDescription, lawReference, config, effectiveDate, personalizedNote } = params

  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gesetzesänderung</title>
</head>
<body style="font-family: 'DM Sans', Arial, sans-serif; background: #F7F4EF; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 2px; overflow: hidden; border: 1px solid rgba(27,42,74,0.08);">
    <!-- Header -->
    <div style="background: #1B2A4A; padding: 32px 40px;">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
        <div style="width: 28px; height: 28px; background: rgba(201,168,76,0.2); border-radius: 2px; display: flex; align-items: center; justify-content: center;">
          <span style="color: #C9A84C; font-size: 11px; font-family: monospace; font-weight: 500;">KI</span>
        </div>
        <span style="color: rgba(247,244,239,0.6); font-size: 14px;">KI-Kompass</span>
      </div>
      <h1 style="color: #F7F4EF; font-size: 22px; font-weight: 300; margin: 0; font-family: Georgia, serif;">
        ${config.emoji} Gesetzesänderung
      </h1>
    </div>

    <!-- Severity Badge -->
    <div style="padding: 20px 40px 0;">
      <div style="display: inline-block; background: ${config.bg}; padding: 6px 14px; border-radius: 2px; border: 1px solid ${config.color}20;">
        <span style="color: ${config.color}; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">${config.label}</span>
      </div>
    </div>

    <!-- Body -->
    <div style="padding: 20px 40px 40px;">
      <p style="color: rgba(27,42,74,0.6); font-size: 14px; line-height: 1.6;">
        Sehr geehrte Damen und Herren von <strong style="color: #1B2A4A;">${companyName}</strong>,
      </p>

      <h2 style="color: #1B2A4A; font-size: 18px; font-weight: 600; margin: 24px 0 12px;">${alertTitle}</h2>

      <div style="background: #F7F4EF; border-radius: 2px; padding: 20px; margin: 16px 0; border-left: 3px solid ${config.color};">
        <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; color: ${config.color}; font-weight: 500;">Rechtliche Grundlage</p>
        <p style="margin: 0; font-size: 14px; color: #1B2A4A; font-weight: 600;">${lawReference}</p>
        ${effectiveDate ? `<p style="margin: 8px 0 0; font-size: 13px; color: rgba(27,42,74,0.6);">Inkrafttreten: ${effectiveDate}</p>` : ''}
      </div>

      <p style="color: rgba(27,42,74,0.7); font-size: 14px; line-height: 1.7;">${alertDescription}</p>

      ${personalizedNote ? `
      <div style="background: #E8F0FE; border-radius: 2px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0; font-size: 13px; color: rgba(27,42,74,0.7);">
          <strong style="color: #1B2A4A;">📋 Relevanz für ${companyName}:</strong><br>
          ${personalizedNote}
        </p>
      </div>
      ` : ''}

      <div style="background: #F7F4EF; border-radius: 2px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0; font-size: 13px; color: rgba(27,42,74,0.6);">
          <strong style="color: #1B2A4A;">Nächste Schritte:</strong> Diese Änderung wird bei Ihrem nächsten vierteljährlichen Update automatisch in Ihre KI-Nutzungsrichtlinie eingearbeitet. Sie müssen nichts weiter unternehmen.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding: 20px 40px; border-top: 1px solid rgba(27,42,74,0.06); background: #F7F4EF;">
      <p style="color: rgba(27,42,74,0.3); font-size: 11px; margin: 0; text-align: center;">
        KI-Kompass Enterprise · Gesetzesänderungs-Alert<br>
        <a href="#" style="color: rgba(27,42,74,0.3); text-decoration: underline;">Impressum</a> ·
        <a href="#" style="color: rgba(27,42,74,0.3); text-decoration: underline;">Datenschutz</a>
      </p>
    </div>
  </div>
</body>
</html>`
}
