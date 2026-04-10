/**
 * Admin-Alerting bei fehlgeschlagenen Policy-Generierungen
 *
 * Sendet E-Mail an den Admin, wenn eine bezahlte Order nach
 * allen Retries keine Policy erhalten hat.
 */

import * as Sentry from '@sentry/nextjs'

interface AdminAlertParams {
  orderId: string
  email: string
  companyName: string
  retryCount: number
  lastError: string
  createdAt: string
}

const ADMIN_EMAIL = process.env.ADMIN_ALERT_EMAIL ?? 'admin@ki-kompass.de'

/**
 * Sendet einen Alert an den Admin über eine fehlgeschlagene Order.
 */
export async function sendAdminAlert(params: AdminAlertParams): Promise<void> {
  const { orderId, email, companyName, retryCount, lastError, createdAt } = params

  console.error(
    `[Admin-Alert] 🚨 Order ${orderId} fehlgeschlagen nach ${retryCount} Versuchen.\n` +
    `  Kunde: ${companyName} (${email})\n` +
    `  Erstellt: ${createdAt}\n` +
    `  Letzter Fehler: ${lastError}`
  )

  // E-Mail an Admin via Brevo
  if (!process.env.BREVO_API_KEY) {
    console.error('[Admin-Alert] BREVO_API_KEY nicht gesetzt — Alert kann nicht per E-Mail gesendet werden.')
    return
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'KI-Kompass System', email: 'noreply@ki-kompass.de' },
        to: [{ email: ADMIN_EMAIL, name: 'KI-Kompass Admin' }],
        subject: `🚨 Policy-Generierung fehlgeschlagen: ${companyName} (Order ${orderId.slice(0, 8)})`,
        htmlContent: `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; padding: 20px; color: #1B2A4A;">
  <h2 style="color: #C62828;">🚨 Policy-Generierung fehlgeschlagen</h2>
  <p>Eine bezahlte Order konnte nach <strong>${retryCount} Versuchen</strong> nicht verarbeitet werden und erfordert manuelle Intervention.</p>

  <table style="border-collapse: collapse; margin: 20px 0; width: 100%;">
    <tr>
      <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; background: #f5f5f5;">Order ID</td>
      <td style="padding: 8px 12px; border: 1px solid #ddd; font-family: monospace;">${orderId}</td>
    </tr>
    <tr>
      <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; background: #f5f5f5;">Kunde</td>
      <td style="padding: 8px 12px; border: 1px solid #ddd;">${companyName}</td>
    </tr>
    <tr>
      <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; background: #f5f5f5;">E-Mail</td>
      <td style="padding: 8px 12px; border: 1px solid #ddd;">${email}</td>
    </tr>
    <tr>
      <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; background: #f5f5f5;">Erstellt</td>
      <td style="padding: 8px 12px; border: 1px solid #ddd;">${new Date(createdAt).toLocaleString('de-DE')}</td>
    </tr>
    <tr>
      <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; background: #f5f5f5;">Versuche</td>
      <td style="padding: 8px 12px; border: 1px solid #ddd;">${retryCount}</td>
    </tr>
    <tr>
      <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; background: #f5f5f5;">Letzter Fehler</td>
      <td style="padding: 8px 12px; border: 1px solid #ddd; color: #C62828;"><pre style="margin:0;white-space:pre-wrap;">${lastError}</pre></td>
    </tr>
  </table>

  <h3>Nächste Schritte</h3>
  <ol>
    <li>Fehlerursache prüfen (Claude-Timeout? Puppeteer? Supabase?)</li>
    <li>Problem beheben</li>
    <li>Order manuell neu anstoßen via <code>POST /api/process-orders?order_id=${orderId}</code></li>
  </ol>

  <p style="color: #888; font-size: 12px; margin-top: 24px;">
    Diese E-Mail wurde automatisch vom KI-Kompass System generiert.
  </p>
</body>
</html>
        `,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error(`[Admin-Alert] E-Mail-Versand fehlgeschlagen: ${text}`)
      Sentry.captureMessage(`Admin-Alert E-Mail konnte nicht gesendet werden für Order ${orderId}`, {
        level: 'error',
        tags: {
          service: 'brevo',
          flow: 'admin-alert',
          order_id: orderId,
        },
        contexts: {
          response: { status: response.status, body: text },
        },
      })
    } else {
      console.log(`[Admin-Alert] Alert-E-Mail für Order ${orderId} erfolgreich gesendet.`)
    }
  } catch (err) {
    console.error('[Admin-Alert] E-Mail-Versand-Fehler:', err instanceof Error ? err.message : err)
    Sentry.captureException(err, {
      tags: {
        service: 'brevo',
        flow: 'admin-alert',
        order_id: orderId,
      },
    })
  }
}
