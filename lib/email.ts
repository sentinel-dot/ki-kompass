import * as Sentry from '@sentry/nextjs'
import { tierLabel, type TierId } from '@/config/pricing'

interface SendEmailParams {
  to: string
  companyName: string
  orderId: string
  downloadUrl: string
  docxDownloadUrl?: string
  tier: string
}

export async function sendDownloadEmail(params: SendEmailParams): Promise<void> {
  const { to, companyName, orderId, downloadUrl, docxDownloadUrl, tier } = params

  const label = tierLabel(tier as TierId)

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'KI-Kompass', email: 'noreply@ki-kompass.de' },
      to: [{ email: to, name: companyName }],
      subject: `Ihre KI-Nutzungsrichtlinie für ${companyName} ist fertig`,
      htmlContent: `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ihre KI-Nutzungsrichtlinie</title>
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
      <h1 style="color: #F7F4EF; font-size: 26px; font-weight: 300; margin: 0; font-family: Georgia, serif; letter-spacing: -0.02em;">
        Ihre Richtlinie ist bereit
      </h1>
    </div>

    <!-- Body -->
    <div style="padding: 40px;">
      <p style="color: rgba(27,42,74,0.6); font-size: 14px; line-height: 1.6; margin-top: 0;">
        Sehr geehrte Damen und Herren,
      </p>
      <p style="color: rgba(27,42,74,0.6); font-size: 14px; line-height: 1.6;">
        Ihre maßgeschneiderte <strong style="color: #1B2A4A;">KI-Nutzungsrichtlinie für ${companyName}</strong> wurde erfolgreich generiert.
      </p>

      <div style="background: #F7F4EF; border-radius: 2px; padding: 20px; margin: 24px 0; border-left: 3px solid #C9A84C;">
        <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; color: #C9A84C; font-weight: 500;">Bestelldetails</p>
        <p style="margin: 0; font-size: 13px; color: rgba(27,42,74,0.7);">
          Paket: <strong style="color: #1B2A4A;">${label}</strong><br>
          Bestellnummer: <span style="font-family: monospace; font-size: 12px;">${orderId}</span>
        </p>
      </div>

      <a
        href="${downloadUrl}"
        style="display: block; background: #1B2A4A; color: white; text-decoration: none; padding: 16px 24px; border-radius: 2px; text-align: center; font-size: 14px; font-weight: 500; margin: 24px 0 12px;"
      >
        Richtlinie herunterladen (PDF) →
      </a>

      ${docxDownloadUrl ? `
      <a
        href="${docxDownloadUrl}"
        style="display: block; background: #F7F4EF; color: #1B2A4A; text-decoration: none; padding: 14px 24px; border-radius: 2px; text-align: center; font-size: 14px; font-weight: 500; margin: 0 0 24px; border: 1px solid rgba(27,42,74,0.12);"
      >
        Richtlinie herunterladen (Word/DOCX) →
      </a>
      ` : ''}

      <p style="color: rgba(27,42,74,0.4); font-size: 12px; line-height: 1.6; margin-bottom: 0;">
        Sie können Ihre Richtlinie auch jederzeit unter
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/ergebnis/${orderId}" style="color: #1B2A4A;">
          ki-kompass.de/ergebnis/${orderId}
        </a>
        herunterladen.
      </p>
    </div>

    <!-- Footer -->
    <div style="padding: 20px 40px; border-top: 1px solid rgba(27,42,74,0.06); background: #F7F4EF;">
      <p style="color: rgba(27,42,74,0.3); font-size: 11px; margin: 0; text-align: center;">
        KI-Kompass · DSGVO-konform · Juristisch geprüft<br>
        <a href="#" style="color: rgba(27,42,74,0.3); text-decoration: underline;">Impressum</a> ·
        <a href="#" style="color: rgba(27,42,74,0.3); text-decoration: underline;">Datenschutz</a>
      </p>
    </div>
  </div>
</body>
</html>
      `,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    const error = new Error(`E-Mail-Versand fehlgeschlagen: ${text}`)
    Sentry.captureException(error, {
      tags: {
        service: 'brevo',
        flow: 'payment-to-delivery',
        step: 'download-email',
        order_id: orderId,
      },
    })
    throw error
  }
}
